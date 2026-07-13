/**
 * KNNService - User-based collaborative filtering, implemented from scratch.
 *
 * User rating profiles are represented as sparse maps to prevent high memory
 * allocation: { itemId: score } - only items the user actually rated appear
 * as keys. The full ratings matrix is a nested sparse map:
 * matrix[userId][itemId] = score.
 */

/** Sparse rating vector of a single user: { itemId: score } */
export type RatingsVector = Record<string, number>;

/** Full sparse ratings matrix: { userId: { itemId: score } } */
export type RatingsMatrix = Record<string, RatingsVector>;

export interface Recommendation {
  itemId: string;
  predictedScore: number;
}

interface Neighbor {
  userId: string;
  similarity: number;
}

/**
 * Cosine Similarity = (A . B) / (||A|| * ||B||)
 *
 * Returns a value in [0, 1] (ratings are positive); 0 when either vector is
 * empty or the users share no rated items.
 */
export const calculateCosineSimilarity = (
  userA: RatingsVector,
  userB: RatingsVector
): number => {
  if (!userA || !userB) return 0;

  // Iterate over the smaller map for the dot product - only shared items contribute
  const [smaller, larger] =
    Object.keys(userA).length <= Object.keys(userB).length ? [userA, userB] : [userB, userA];

  let dotProduct = 0;
  for (const itemId in smaller) {
    if (itemId in larger) {
      dotProduct += smaller[itemId] * larger[itemId];
    }
  }
  if (dotProduct === 0) return 0; // no overlap - no need to compute norms

  let normA = 0;
  for (const itemId in userA) {
    normA += userA[itemId] * userA[itemId];
  }

  let normB = 0;
  for (const itemId in userB) {
    normB += userB[itemId] * userB[itemId];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Finds the k nearest neighbors of the target user, predicts scores for movies
 * the target has not rated (similarity-weighted average of neighbor ratings),
 * and returns the recommendations sorted by predictedScore descending.
 */
export const getRecommendations = (
  targetUserId: string,
  matrix: RatingsMatrix,
  k = 3
): Recommendation[] => {
  const targetRatings = matrix[targetUserId];
  if (!targetRatings) return [];

  // 1. Score every other user against the target
  const neighbors: Neighbor[] = [];
  for (const userId in matrix) {
    if (userId === targetUserId) continue;

    const similarity = calculateCosineSimilarity(targetRatings, matrix[userId]);
    if (similarity > 0) {
      neighbors.push({ userId, similarity });
    }
  }

  // 2. Keep only the k most similar users
  neighbors.sort((a, b) => b.similarity - a.similarity);
  const nearest = neighbors.slice(0, k);

  // 3. Project predicted ratings for items the target has NOT rated:
  //    predictedScore = sum(similarity * score) / sum(similarity)
  const weightedSums: Record<string, number> = {};
  const similaritySums: Record<string, number> = {};

  for (const { userId, similarity } of nearest) {
    const neighborRatings = matrix[userId];
    for (const itemId in neighborRatings) {
      if (itemId in targetRatings) continue; // target already rated this item

      weightedSums[itemId] = (weightedSums[itemId] ?? 0) + similarity * neighborRatings[itemId];
      similaritySums[itemId] = (similaritySums[itemId] ?? 0) + similarity;
    }
  }

  // 4. Build and sort the recommendation list
  const recommendations: Recommendation[] = [];
  for (const itemId in weightedSums) {
    recommendations.push({
      itemId,
      predictedScore: weightedSums[itemId] / similaritySums[itemId],
    });
  }
  recommendations.sort((a, b) => b.predictedScore - a.predictedScore);

  return recommendations;
};
