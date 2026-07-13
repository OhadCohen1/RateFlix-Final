// בדיקות KNN על מקרי קצה ותוצאות צפויות.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCosineSimilarity, getRecommendations } from '../dist/services/KNNService.js';

test('identical vectors have similarity 1', () => {
  const sim = calculateCosineSimilarity({ m1: 5, m2: 3 }, { m1: 5, m2: 3 });
  assert.ok(Math.abs(sim - 1) < 1e-9);
});

test('vectors with no shared items have similarity 0', () => {
  assert.equal(calculateCosineSimilarity({ m1: 5 }, { m2: 4 }), 0);
});

test('known value: A=(1,2), B=(2,1) -> 4/5 = 0.8', () => {
  // חישוב ידני קצר כדי לוודא שלא פספסנו בנוסחה.
  const sim = calculateCosineSimilarity({ m1: 1, m2: 2 }, { m1: 2, m2: 1 });
  assert.ok(Math.abs(sim - 0.8) < 1e-9);
});

test('empty vector yields similarity 0', () => {
  assert.equal(calculateCosineSimilarity({}, { m1: 5 }), 0);
});

test('similarity is symmetric', () => {
  const a = { m1: 5, m2: 2, m3: 4 };
  const b = { m2: 3, m3: 5 };
  assert.equal(calculateCosineSimilarity(a, b), calculateCosineSimilarity(b, a));
});

const matrix = {
  alice: { m1: 5, m2: 4 },
  bob: { m1: 5, m2: 4, m3: 5, m4: 2 }, // very similar to alice
  carol: { m1: 1, m2: 1, m3: 1 },
  dave: { m5: 5 }, // no overlap with alice
};

test('recommends only unrated items, sorted by predictedScore descending', () => {
  const recs = getRecommendations('alice', matrix, 2);
  const ids = recs.map((r) => r.itemId);

  assert.ok(ids.includes('m3') && ids.includes('m4'), 'neighbors items expected');
  assert.ok(!ids.includes('m1') && !ids.includes('m2'), 'rated items must be excluded');
  assert.ok(!ids.includes('m5'), 'non-overlapping user must not contribute');
  assert.equal(recs[0].itemId, 'm3', 'highest predicted score first');
  for (let i = 1; i < recs.length; i++) {
    assert.ok(recs[i - 1].predictedScore >= recs[i].predictedScore, 'sorted descending');
  }
});

test('unknown user gets an empty list', () => {
  assert.deepEqual(getRecommendations('nobody', matrix), []);
});

test('single user in the matrix gets an empty list', () => {
  assert.deepEqual(getRecommendations('alice', { alice: { m1: 5 } }), []);
});

test('predicted score is the similarity-weighted average of neighbor ratings', () => {
  // עם שכן אחד רלוונטי, התחזית אמורה לצאת בדיוק כמו הציון שלו.
  const twoUsers = { u1: { a: 5 }, u2: { a: 5, b: 3 } };
  const recs = getRecommendations('u1', twoUsers, 3);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].itemId, 'b');
  assert.ok(Math.abs(recs[0].predictedScore - 3) < 1e-9);
});

test('k limits which neighbors contribute', () => {
  // 'far' דומה קצת, אבל עם k=2 אנחנו רוצים רק את הקרובים באמת.
  const kMatrix = {
    target: { m1: 5, m2: 5 },
    close1: { m1: 5, m2: 5, m3: 4 },
    close2: { m1: 5, m2: 4, m4: 3 },
    far: { m1: 1, m5: 5 },
  };

  const withK3 = getRecommendations('target', kMatrix, 3).map((r) => r.itemId);
  assert.ok(withK3.includes('m5'), 'sanity: with k=3 the far neighbor does contribute');

  const withK2 = getRecommendations('target', kMatrix, 2).map((r) => r.itemId);
  assert.ok(withK2.includes('m3') && withK2.includes('m4'), 'close neighbors items expected');
  assert.ok(!withK2.includes('m5'), 'k=2 must exclude the least similar neighbor');
});

test('two neighbors: prediction matches the exact weighted-average formula', () => {
  const target = { a: 4, b: 4 };
  const n1 = { a: 4, b: 4, x: 2 }; // same taste as target, rates x low
  const n2 = { a: 5, b: 1, x: 5 }; // different taste, rates x high
  const recs = getRecommendations('t', { t: target, n1, n2 }, 2);

  const s1 = calculateCosineSimilarity(target, n1);
  const s2 = calculateCosineSimilarity(target, n2);
  const expected = (s1 * 2 + s2 * 5) / (s1 + s2);

  assert.equal(recs.length, 1);
  assert.equal(recs[0].itemId, 'x');
  assert.ok(Math.abs(recs[0].predictedScore - expected) < 1e-9);
  assert.ok(s1 > s2, 'sanity: n1 must be the more similar neighbor');
  assert.ok(recs[0].predictedScore < 3.5, 'the similar neighbor must pull the prediction toward its low score');
});
