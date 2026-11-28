// Self-check for the even-split maths (must match the backend): npm test
import assert from 'node:assert/strict';
import { splitEvenly } from '../app/lib/split.ts';

assert.deepEqual(splitEvenly(100000, 3), [33334, 33333, 33333]); // part 1 takes the remainder
assert.deepEqual(splitEvenly(30000, 3), [10000, 10000, 10000]);
for (const [total, n] of [[47000, 2], [1, 3], [99999, 10]]) {
  assert.equal(splitEvenly(total, n).reduce((a, b) => a + b, 0), total); // never over or under the bill
}

console.log('split-check: ok');
