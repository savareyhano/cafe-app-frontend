// Self-check for the split-bill maths: npm test
import assert from 'node:assert/strict';
import { equalShares, personShares } from '../app/lib/split.ts';

assert.deepEqual(equalShares(47000, 2), [23500, 23500]);
assert.deepEqual(equalShares(47000, 3), [15700, 15700, 15700]); // 15.666,67 rounds up
assert.deepEqual(equalShares(30000, 3), [10000, 10000, 10000]); // no rounding when it divides

const lines = [
  { id: 'ayam', price: 25000, quantity: 1 },
  { id: 'kopi', price: 22000, quantity: 3 },
];
// Everything assigned: each pays exactly their own portions
assert.deepEqual(personShares(lines, 2, { ayam: [1, 0], kopi: [2, 1] }), { shares: [69000, 22000], unassigned: 0 });
// Nothing assigned: same as an equal split
assert.deepEqual(personShares(lines, 2, {}), { shares: [45500, 45500], unassigned: 91000 });
// Partly assigned: the 3 coffees left are shared by both
assert.deepEqual(personShares(lines, 2, { ayam: [1] }), { shares: [58000, 33000], unassigned: 66000 });
// A removed person's portions go back to everyone
assert.deepEqual(personShares(lines, 2, { ayam: [0, 0, 1] }).unassigned, 91000);
// More portions taken than ordered (cart shrank): only what exists counts
assert.deepEqual(personShares([{ id: 'x', price: 22000, quantity: 1 }], 2, { x: [1, 1] }).shares, [22000, 0]);
// Unassigned remainder that doesn't divide rounds up
assert.deepEqual(personShares([{ id: 'x', price: 10000, quantity: 1 }], 3, {}).shares, [3400, 3400, 3400]);

console.log('split-check: ok');
