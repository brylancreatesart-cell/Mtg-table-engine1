const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('scripts/inline-101.js', 'utf8');
const begin = source.indexOf('function send(m){');
const end = source.indexOf('function sendToSeat(', begin);
assert(begin >= 0 && end > begin);
const calls = [];
const context = {
  soloTestMode: true, HST: 1, activeRoom: 'SOLO-QA', cc: null,
  cs: new Map(),
  phase108Outbound: m => { calls.push('stamp'); return { ...m, stamped: true }; },
  cancelSharedDisplayState: () => calls.push('cancel'),
  scheduleSharedDisplayState: () => calls.push('schedule'),
  resumeNet: () => calls.push('reconnect'),
  netState: () => calls.push('error'),
};
vm.createContext(context);
vm.runInContext(source.slice(begin, end), context);
// A solo state must never be traversed or serialized for an outbound packet.
const state = new Proxy({}, { ownKeys() { throw Error('Solo state was serialized'); } });
for (const t of ['state', 'start', 'players', 'pass']) context.send({ t, st: state });
assert.deepEqual(calls, []);
context.soloTestMode = false;
const packets = [];
context.cs.set('player-2', { open: true, send: packet => packets.push(packet) });
context.send({ t: 'state', st: { turn: 4, active: 4 } });
assert.equal(packets.length, 1);
assert.equal(packets[0].stamped, true);
assert.deepEqual(calls, ['cancel', 'stamp']);
calls.length = 0;
context.HST = 0;
context.cc = { open: true, send: packet => packets.push(packet) };
context.send({ t: 'pass', id: 4 });
assert.equal(packets.length, 2);
assert.equal(packets[1].id, 4);
assert.deepEqual(calls, ['stamp']);
console.log('PASS: solo skips transport; multiplayer host and client still send.');
