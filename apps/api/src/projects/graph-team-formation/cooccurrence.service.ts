import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CooccurrenceEdgeData } from './graph-team-formation.types';

@Injectable()
export class CooccurrenceService {
  private readonly logger = new Logger(CooccurrenceService.name);

  // Default empirical thresholds
  public static readonly DEFAULT_MIN_INTERSECTION = 3;
  public static readonly DEFAULT_MIN_JACCARD = 0.15;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pure algorithm to compute pairwise Jaccard co-occurrence from an inverted index map (Item -> Set of User IDs).
   *
   * J(a, b) = |Users(a) ∩ Users(b)| / |Users(a) ∪ Users(b)|
   *
   * An edge is emitted iff:
   *   |Users(a) ∩ Users(b)| >= minIntersection AND J(a, b) >= minJaccard
   */
  public static computeJaccardFromIndex(
    itemToUsersMap: Map<string, Set<string>>,
    minIntersection = CooccurrenceService.DEFAULT_MIN_INTERSECTION,
    minJaccard = CooccurrenceService.DEFAULT_MIN_JACCARD,
  ): CooccurrenceEdgeData[] {
    const itemIds = Array.from(itemToUsersMap.keys()).sort();
    const results: CooccurrenceEdgeData[] = [];

    for (let i = 0; i < itemIds.length; i++) {
      const itemA = itemIds[i];
      const usersA = itemToUsersMap.get(itemA);
      if (!usersA || usersA.size < minIntersection) continue;

      for (let j = i + 1; j < itemIds.length; j++) {
        const itemB = itemIds[j];
        const usersB = itemToUsersMap.get(itemB);
        if (!usersB || usersB.size < minIntersection) continue;

        // Compute intersection
        let intersectionCount = 0;
        const [smaller, larger] = usersA.size <= usersB.size ? [usersA, usersB] : [usersB, usersA];

        for (const userId of smaller) {
          if (larger.has(userId)) {
            intersectionCount++;
          }
        }

        if (intersectionCount < minIntersection) continue;

        const unionCount = usersA.size + usersB.size - intersectionCount;
        const jaccard = intersectionCount / unionCount;

        if (jaccard >= minJaccard) {
          results.push({
            itemAId: itemA,
            itemBId: itemB,
            intersectionCount,
            unionCount,
            jaccard: Number(jaccard.toFixed(4)),
          });
        }
      }
    }

    return results;
  }

  /**
   * Compute skill co-occurrences directly from Prisma UserSkill records.
   */
  public async getSkillCooccurrences(
    minIntersection = CooccurrenceService.DEFAULT_MIN_INTERSECTION,
    minJaccard = CooccurrenceService.DEFAULT_MIN_JACCARD,
  ): Promise<CooccurrenceEdgeData[]> {
    try {
      const userSkills = await this.prisma.userSkill.findMany({
        select: {
          skillId: true,
          profile: {
            select: {
              profile: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      const skillToUsers = new Map<string, Set<string>>();
      for (const record of userSkills) {
        const userId = record.profile?.profile?.userId;
        if (!userId || !record.skillId) continue;

        let userSet = skillToUsers.get(record.skillId);
        if (!userSet) {
          userSet = new Set<string>();
          skillToUsers.set(record.skillId, userSet);
        }
        userSet.add(userId);
      }

      return CooccurrenceService.computeJaccardFromIndex(skillToUsers, minIntersection, minJaccard);
    } catch (err) {
      this.logger.error('Failed to compute skill co-occurrences from Prisma:', err);
      return [];
    }
  }

  /**
   * Compute tool co-occurrences directly from Prisma UserTool records.
   */
  public async getToolCooccurrences(
    minIntersection = CooccurrenceService.DEFAULT_MIN_INTERSECTION,
    minJaccard = CooccurrenceService.DEFAULT_MIN_JACCARD,
  ): Promise<CooccurrenceEdgeData[]> {
    try {
      const userTools = await this.prisma.userTool.findMany({
        select: {
          toolId: true,
          profile: {
            select: {
              profile: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      const toolToUsers = new Map<string, Set<string>>();
      for (const record of userTools) {
        const userId = record.profile?.profile?.userId;
        if (!userId || !record.toolId) continue;

        let userSet = toolToUsers.get(record.toolId);
        if (!userSet) {
          userSet = new Set<string>();
          toolToUsers.set(record.toolId, userSet);
        }
        userSet.add(userId);
      }

      return CooccurrenceService.computeJaccardFromIndex(toolToUsers, minIntersection, minJaccard);
    } catch (err) {
      this.logger.error('Failed to compute tool co-occurrences from Prisma:', err);
      return [];
    }
  }
}
