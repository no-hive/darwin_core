import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare } from './artifacts.mjs';

test('preservation guard detects changed, added and removed deployment files', () => {
  assert.deepEqual(compare({ a: { sha256: '1' }, b: { sha256: '2' } }, {
    a: { sha256: '3' }, c: { sha256: '4' }
  }), [
    { file: 'a', change: 'changed' },
    { file: 'b', change: 'removed' },
    { file: 'c', change: 'added' }
  ]);
  assert.deepEqual(compare({ a: { sha256: '1' } }, { a: { sha256: '1' } }), []);
});
