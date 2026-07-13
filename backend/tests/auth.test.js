// Unit tests for password security (proposal section 14.2):
// verifies bcrypt hashing so passwords are never stored as plain text.
// Uses a dedicated test database (rateflix_test) - safe to run repeatedly.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../dist/features/users/users.model.js';

const TEST_DB = 'mongodb://localhost:27017/rateflix_test';
const PLAIN_PASSWORD = 'secret123';

before(async () => {
  await mongoose.connect(TEST_DB);
  await User.deleteMany({});
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('password is stored hashed, never as plain text', async () => {
  const user = await User.create({ email: 'hash@test.com', password: PLAIN_PASSWORD });

  const stored = await User.findById(user._id).select('+password');
  assert.notEqual(stored.password, PLAIN_PASSWORD, 'plain text must not be stored');
  assert.match(stored.password, /^\$2[aby]\$/, 'stored value must be a bcrypt hash');
});

test('matchPassword accepts the correct password and rejects a wrong one', async () => {
  const user = await User.create({ email: 'match@test.com', password: PLAIN_PASSWORD });
  const stored = await User.findById(user._id).select('+password');

  assert.equal(await stored.matchPassword(PLAIN_PASSWORD), true);
  assert.equal(await stored.matchPassword('wrong-password'), false);
});

test('password is not re-hashed when other fields change', async () => {
  const user = await User.create({ email: 'stable@test.com', password: PLAIN_PASSWORD });
  const hashBefore = (await User.findById(user._id).select('+password')).password;

  const doc = await User.findById(user._id).select('+password');
  doc.isActive = false;
  await doc.save();

  const hashAfter = (await User.findById(user._id).select('+password')).password;
  assert.equal(hashBefore, hashAfter, 'hash must be unchanged when password is untouched');
});

test('password field is hidden from regular queries (select: false)', async () => {
  await User.create({ email: 'hidden@test.com', password: PLAIN_PASSWORD });
  const fetched = await User.findOne({ email: 'hidden@test.com' });
  assert.equal(fetched.password, undefined);
});

test('bcrypt.compare works directly against a fresh hash', async () => {
  const hash = await bcrypt.hash(PLAIN_PASSWORD, 10);
  assert.equal(await bcrypt.compare(PLAIN_PASSWORD, hash), true);
  assert.equal(await bcrypt.compare('other', hash), false);
});
