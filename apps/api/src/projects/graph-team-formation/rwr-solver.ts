import { Injectable, Logger } from '@nestjs/common';
import { HINGraph } from './hin-graph';
import {
  CandidateGraphAffinity,
  RWRDistributionResult,
  RWROptions,
} from './graph-team-formation.types';

/**
 * ============================================================================
 * RANDOM WALK WITH RESTART (RWR) SOLVER FOR HETEROGENEOUS INFORMATION NETWORKS
 * ============================================================================
 *
 * Mathematical Formulation and Matrix Convention:
 *
 * For a target restart node r (typically a ProjectRole node `role:uuid`), the RWR
 * algorithm models a random surfer traversing the weighted heterogeneous graph G = (V, E)
 * with a probability (1 - alpha) of transitioning to an adjacent neighbor and a probability
 * alpha of teleporting/restarting at node r.
 *
 * Discrete Update Equation per Node v in V:
 *
 *   p_next(v) = (1 - alpha) * sum_{u in InNeighbors(v)} [ p(u) * ( w(u, v) / D_out(u) ) ]
 *               + (1 - alpha) * sum_{d in DanglingNodes} [ p(d) * I(v = r) ]
 *               + alpha * I(v = r)
 *
 * Where:
 *   - p(u) is the probability mass residing at node u at iteration t.
 *   - w(u, v) is the weight of directed edge u -> v.
 *   - D_out(u) = sum_{k in OutNeighbors(u)} w(u, k) is the sum of outgoing edge weights from u.
 *   - I(v = r) is the indicator function (1 if v is the restart node r, else 0).
 *   - Dangling nodes (D_out(d) == 0) safely return their probability mass to the restart node r.
 *
 * Matrix Representation:
 *   p^(t+1) = (1 - alpha) * P * p^(t) + alpha * e_r
 *   Where P is the column-stochastic transition probability matrix with P_{v, u} = w(u, v) / D_out(u).
 *
 * Properties Guaranteed:
 *   1. Probability Conservation: sum_{v in V} p(v) = 1.0 at every iteration step.
 *   2. Non-negativity: p(v) >= 0 for all v in V.
 *   3. Power-iteration semantics:
 *      - If L1 delta < epsilon is achieved within maxIterations, `converged=true` and the output
 *        is a converged stationary approximation within tolerance epsilon.
 *      - If maxIterations is reached before L1 delta < epsilon, `converged=false` and the output
 *        is the truncated RWR distribution at iteration step maxIterations.
 *   4. Multi-hop semantic traversal: Captures paths such as:
 *      role -> skill -> candidate
 *      role -> tool -> candidate
 *      role -> tax_role -> candidate
 *      role -> skill -> skill (co-occurrence) -> candidate
 * ============================================================================
 */
@Injectable()
export class RWRSolver {
  private readonly logger = new Logger(RWRSolver.name);

  public static readonly DEFAULT_ALPHA = 0.15;
  public static readonly DEFAULT_MAX_ITERATIONS = 25;
  public static readonly DEFAULT_EPSILON = 1e-6;

  /**
   * Compute the probability distribution across all nodes in the HIN graph
   * starting from a designated restart node (e.g. ProjectRole).
   *
   * Distinguishes between:
   *   - Converged stationary approximation (converged = true, L1 delta < epsilon)
   *   - Truncated RWR distribution (converged = false, reached maxIterations)
   */
  public computeStationaryDistribution(
    graph: HINGraph,
    restartNodeId: string,
    options: RWROptions = {},
  ): RWRDistributionResult {
    const alpha = options.alpha ?? RWRSolver.DEFAULT_ALPHA;
    const maxIterations = options.maxIterations ?? RWRSolver.DEFAULT_MAX_ITERATIONS;
    const epsilon = options.epsilon ?? RWRSolver.DEFAULT_EPSILON;

    if (!graph.hasNode(restartNodeId)) {
      throw new Error(`Restart node '${restartNodeId}' does not exist in the HIN graph.`);
    }

    const restartNode = graph.getNode(restartNodeId)!;
    const allNodeIds = graph.getAllNodeIds();
    const totalNodes = allNodeIds.length;

    if (totalNodes === 0) {
      throw new Error('Cannot execute RWR on an empty graph.');
    }

    // Single-node trivial base case
    if (totalNodes === 1) {
      const singleDist = new Map<string, number>([[restartNodeId, 1.0]]);
      return {
        restartNodeId,
        roleId: restartNode.rawId,
        distribution: singleDist,
        candidateAffinities: [],
        iterations: 0,
        converged: true,
        l1Delta: 0,
      };
    }

    // Precompute out-degree weights and pre-filter edges for performance
    const outDegreeWeights = new Map<string, number>();
    for (const nodeId of allNodeIds) {
      outDegreeWeights.set(nodeId, graph.getOutDegreeWeight(nodeId));
    }

    // Initialize probability distribution: p^(0)(r) = 1.0, p^(0)(v) = 0 for v != r
    let currentP = new Map<string, number>();
    currentP.set(restartNodeId, 1.0);

    let iterations = 0;
    let converged = false;
    let l1Delta = 1.0;

    for (let iter = 0; iter < maxIterations; iter++) {
      iterations++;
      const nextP = new Map<string, number>();

      // 1. Teleportation baseline mass: alpha * I(v = r)
      nextP.set(restartNodeId, alpha);

      // 2. Transition flow through edges
      for (const [u, probU] of currentP.entries()) {
        if (probU <= 0) continue;

        const dOut = outDegreeWeights.get(u) || 0;

        if (dOut > 0) {
          const flow = (1 - alpha) * probU;
          const edges = graph.getOutEdges(u);

          for (const edge of edges) {
            const transfer = flow * (edge.weight / dOut);
            const currentVal = nextP.get(edge.target) || 0;
            nextP.set(edge.target, currentVal + transfer);
          }
        } else {
          // Dangling node: return (1 - alpha) * probU mass back to restart node r
          const danglingReturn = (1 - alpha) * probU;
          const currentRestartVal = nextP.get(restartNodeId) || 0;
          nextP.set(restartNodeId, currentRestartVal + danglingReturn);
        }
      }

      // 3. Compute L1 Delta for convergence check: sum_{v in V} |p_next(v) - p_curr(v)|
      l1Delta = 0;
      for (const nodeId of allNodeIds) {
        const pNextVal = nextP.get(nodeId) || 0;
        const pCurrVal = currentP.get(nodeId) || 0;
        l1Delta += Math.abs(pNextVal - pCurrVal);
      }

      currentP = nextP;

      if (l1Delta < epsilon) {
        converged = true;
        break;
      }
    }

    // 4. Extract and sort Candidate affinities
    const candidateNodes = graph.getNodesByType('CANDIDATE');
    const candidateAffinities: CandidateGraphAffinity[] = [];

    for (const candNode of candidateNodes) {
      const rawScore = currentP.get(candNode.id) || 0;
      candidateAffinities.push({
        roleId: restartNode.rawId,
        candidateId: candNode.rawId,
        candidateNodeId: candNode.id,
        rawGraphScore: Number(rawScore.toFixed(8)),
      });
    }

    // Sort deterministically: highest rawGraphScore first, tie-breaker on candidateId
    candidateAffinities.sort((a, b) => {
      if (b.rawGraphScore !== a.rawGraphScore) {
        return b.rawGraphScore - a.rawGraphScore;
      }
      return a.candidateId.localeCompare(b.candidateId);
    });

    return {
      restartNodeId,
      roleId: restartNode.rawId,
      distribution: currentP,
      candidateAffinities,
      iterations,
      converged,
      l1Delta: Number(l1Delta.toFixed(8)),
    };
  }

  /**
   * Convenience method: Calculate candidate-only affinities directly for a ProjectRole node.
   */
  public computeCandidateAffinity(
    graph: HINGraph,
    roleNodeId: string,
    options: RWROptions = {},
  ): CandidateGraphAffinity[] {
    const result = this.computeStationaryDistribution(graph, roleNodeId, options);
    return result.candidateAffinities;
  }
}
