import { HINEdge, HINEdgeType, HINNode, HINNodeType } from './graph-team-formation.types';

export class HINGraph {
  private nodes: Map<string, HINNode> = new Map();
  private outEdges: Map<string, HINEdge[]> = new Map();
  private inEdges: Map<string, HINEdge[]> = new Map();
  private nodesByType: Map<HINNodeType, Set<string>> = new Map();

  constructor() {
    // Initialize empty type sets
    const allTypes: HINNodeType[] = [
      'PROJECT',
      'PROJECT_ROLE',
      'CANDIDATE',
      'PROFESSIONAL_ROLE',
      'SKILL',
      'TOOL',
      'GAME_ENGINE',
      'GENRE',
      'PLATFORM',
    ];
    for (const t of allTypes) {
      this.nodesByType.set(t, new Set());
    }
  }

  /**
   * Add or update a typed node in the graph
   */
  public addNode(node: HINNode): void {
    if (!this.nodes.has(node.id)) {
      this.outEdges.set(node.id, []);
      this.inEdges.set(node.id, []);
    }
    this.nodes.set(node.id, node);
    this.nodesByType.get(node.type)?.add(node.id);
  }

  /**
   * Check if a node exists
   */
  public hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * Retrieve node by global ID
   */
  public getNode(id: string): HINNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Return all nodes in the graph
   */
  public getNodes(): HINNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Return all node IDs
   */
  public getAllNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Return all nodes of a specific HINNodeType
   */
  public getNodesByType(type: HINNodeType): HINNode[] {
    const ids = this.nodesByType.get(type);
    if (!ids) return [];
    const result: HINNode[] = [];
    for (const id of ids) {
      const node = this.nodes.get(id);
      if (node) result.push(node);
    }
    return result;
  }

  /**
   * Add a typed, weighted edge.
   * If bidirectional is true (default for RWR semantic traversal), the reverse edge is also added.
   */
  public addEdge(edge: HINEdge, bidirectional = true): void {
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      throw new Error(
        `Cannot add edge ${edge.type} between non-existent nodes: ${edge.source} -> ${edge.target}`,
      );
    }

    const sourceOut = this.outEdges.get(edge.source) || [];
    // Prevent duplicate edges of identical type between same pair
    const existingIndex = sourceOut.findIndex(
      (e) => e.target === edge.target && e.type === edge.type,
    );
    if (existingIndex >= 0) {
      sourceOut[existingIndex].weight = edge.weight;
    } else {
      sourceOut.push({ ...edge });
    }
    this.outEdges.set(edge.source, sourceOut);

    const targetIn = this.inEdges.get(edge.target) || [];
    const existingInIndex = targetIn.findIndex(
      (e) => e.source === edge.source && e.type === edge.type,
    );
    if (existingInIndex >= 0) {
      targetIn[existingInIndex].weight = edge.weight;
    } else {
      targetIn.push({ ...edge });
    }
    this.inEdges.set(edge.target, targetIn);

    if (bidirectional && edge.source !== edge.target) {
      const reverseEdge: HINEdge = {
        source: edge.target,
        target: edge.source,
        type: edge.type,
        weight: edge.weight,
        data: edge.data,
      };
      this.addEdge(reverseEdge, false);
    }
  }

  /**
   * Get all outgoing edges from a node
   */
  public getOutEdges(nodeId: string): HINEdge[] {
    return this.outEdges.get(nodeId) || [];
  }

  /**
   * Get all incoming edges to a node
   */
  public getInEdges(nodeId: string): HINEdge[] {
    return this.inEdges.get(nodeId) || [];
  }

  /**
   * Filter outgoing edges by edge type
   */
  public getOutEdgesByType(nodeId: string, edgeType: HINEdgeType): HINEdge[] {
    return (this.outEdges.get(nodeId) || []).filter((e) => e.type === edgeType);
  }

  /**
   * Compute sum of outgoing edge weights for a node (used for RWR transition normalization)
   */
  public getOutDegreeWeight(nodeId: string): number {
    const edges = this.outEdges.get(nodeId) || [];
    return edges.reduce((sum, e) => sum + e.weight, 0);
  }

  /**
   * Get all adjacent neighbor nodes with their connecting edge
   */
  public getAdjacentNodes(nodeId: string): { node: HINNode; edge: HINEdge }[] {
    const edges = this.outEdges.get(nodeId) || [];
    const result: { node: HINNode; edge: HINEdge }[] = [];
    for (const edge of edges) {
      const neighbor = this.nodes.get(edge.target);
      if (neighbor) {
        result.push({ node: neighbor, edge });
      }
    }
    return result;
  }

  /**
   * Total count of unique nodes
   */
  public get nodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Total count of directed edges
   */
  public get edgeCount(): number {
    let count = 0;
    for (const edges of this.outEdges.values()) {
      count += edges.length;
    }
    return count;
  }

  /**
   * Clear the entire graph
   */
  public clear(): void {
    this.nodes.clear();
    this.outEdges.clear();
    this.inEdges.clear();
    for (const set of this.nodesByType.values()) {
      set.clear();
    }
  }
}
