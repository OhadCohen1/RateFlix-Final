// KNN מבוסס משתמשים על מטריצה דלילה של דירוגים.

// דירוגים של משתמש אחד: { itemId: score }
export type RatingsVector = Record<string, number>;

// כל המטריצה: { userId: { itemId: score } }
export type RatingsMatrix = Record<string, RatingsVector>;

export interface Recommendation {
  itemId: string;
  predictedScore: number;
}

interface Neighbor {
  userId: string;
  similarity: number;
}

// דמיון קוסינוס בין שני וקטורי דירוג.
export const calculateCosineSimilarity = (
  userA: RatingsVector,
  userB: RatingsVector
): number => {
  if (!userA || !userB) return 0;

  // רצים על המפה הקטנה יותר בשביל יעילות.
  const [smaller, larger] =
    Object.keys(userA).length <= Object.keys(userB).length ? [userA, userB] : [userB, userA];

  let dotProduct = 0;
  for (const itemId in smaller) {
    if (itemId in larger) {
      dotProduct += smaller[itemId] * larger[itemId];
    }
  }
  if (dotProduct === 0) return 0; // אין חפיפה בין דירוגים

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

// מוצא שכנים קרובים ומחזיר המלצות ממוינות לפי ציון חזוי.
export const getRecommendations = (
  targetUserId: string,
  matrix: RatingsMatrix,
  k = 3
): Recommendation[] => {
  const targetRatings = matrix[targetUserId];
  if (!targetRatings) return [];

  // שלב 1: מחשבים דמיון מול כל משתמש אחר.
  const neighbors: Neighbor[] = [];
  for (const userId in matrix) {
    if (userId === targetUserId) continue;

    const similarity = calculateCosineSimilarity(targetRatings, matrix[userId]);
    if (similarity > 0) {
      neighbors.push({ userId, similarity });
    }
  }

  // שלב 2: משאירים רק את k הכי דומים.
  neighbors.sort((a, b) => b.similarity - a.similarity);
  const nearest = neighbors.slice(0, k);

  // שלב 3: חיזוי ציון לפריטים שהמשתמש עוד לא דירג.
  const weightedSums: Record<string, number> = {};
  const similaritySums: Record<string, number> = {};

  for (const { userId, similarity } of nearest) {
    const neighborRatings = matrix[userId];
    for (const itemId in neighborRatings) {
      if (itemId in targetRatings) continue; // כבר דורג

      weightedSums[itemId] = (weightedSums[itemId] ?? 0) + similarity * neighborRatings[itemId];
      similaritySums[itemId] = (similaritySums[itemId] ?? 0) + similarity;
    }
  }

  // שלב 4: בונים רשימה וממיינים מהגבוה לנמוך.
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
