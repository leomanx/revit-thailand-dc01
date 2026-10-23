const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../lab-engine.js');
const action = (s, actor, command, value) => { s.actor = actor; return E.act(s, command, value); };
function issue(s, purpose = 'construction') {
  s.purpose = purpose;
  for (const [actor, command] of [['lead','check'],['lead','share'],['coordinator','coordinate'],['controller','submit'],['approver','authorize'],['controller','publish']]) assert.equal(action(s, actor, command).allowed, true, command);
}
test('moving folders never grants access, approval or construction authority', () => {
  const s = E.create(); action(s, 'admin', 'move', 'PUBLISHED');
  assert.equal(s.state, 'WIP'); assert.equal(s.authorization, null);
  assert.equal(action(s, 'admin', 'read').allowed, false);
  assert.equal(action(s, 'site', 'use').allowed, false);
});
test('unauthorized actors cannot approve or publish; failure leaves control state intact', () => {
  const s = E.create();
  assert.equal(action(s,'admin','authorize').allowed,false);
  assert.equal(action(s,'controller','publish').allowed,false);
  assert.equal(s.state,'WIP'); assert.equal(s.release,null);
});
test('full explicit review, authorization and controlled issue allows current revision for construction', () => {
  const s = E.create(); issue(s);
  assert.equal(s.state,'PUBLISHED'); assert.ok(s.release.reference);
  assert.equal(action(s,'site','use').allowed,true);
  assert.equal(s.events.filter(e => e.allowed).length,7);
});
test('shared coordination is not sufficient for construction', () => {
  const s = E.create(); action(s,'lead','check'); action(s,'lead','share');
  assert.equal(action(s,'site','use').allowed,false);
});
test('published for coordination does not authorize construction', () => {
  const s = E.create(); issue(s, 'coordination');
  assert.equal(action(s,'site','use').allowed,false);
});
test('authorization cannot be reused for another intended use', () => {
  const s = E.create(); s.purpose='coordination';
  action(s,'lead','check'); action(s,'lead','share'); action(s,'coordinator','coordinate'); action(s,'controller','submit'); action(s,'approver','authorize');
  s.purpose='construction'; assert.equal(action(s,'controller','publish').allowed,false);
});
test('new revision invalidates all current evidence and preserves old issue record', () => {
  const s = E.create(); issue(s); action(s,'author','revise');
  assert.equal(s.revision,2); assert.equal(s.state,'WIP');
  for (const key of ['check','coordination','submission','authorization','release']) assert.equal(s[key],null);
  assert.equal(s.history[0].revision,1); assert.match(s.history[0].status,/HOLD/);
  assert.equal(action(s,'site','use').allowed,false);
  issue(s); assert.equal(action(s,'site','use').allowed,false);
  s.siteRevision=2; assert.equal(action(s,'site','use').allowed,true);
});
test('resubmission or new coordination invalidates pending approval', () => {
  const s = E.create(); action(s,'lead','check'); action(s,'lead','share'); action(s,'coordinator','coordinate'); action(s,'controller','submit'); action(s,'approver','authorize');
  action(s,'controller','submit'); assert.equal(s.authorization,null);
  action(s,'approver','authorize'); action(s,'coordinator','coordinate');
  assert.equal(s.submission,null); assert.equal(s.authorization,null);
});
test('commercial access remains restricted after a folder move; admin and RACI do not grant access', () => {
  const s = E.create('commercial');
  for (const actor of Object.keys(E.actors)) assert.equal(action(s,actor,'read').allowed,['commercial','approver'].includes(actor),actor);
  action(s,'admin','move','PUBLISHED'); assert.equal(action(s,'admin','read').allowed,false);
});
test('changed drawing starts with previous issue held and cannot use old revision', () => {
  const s = E.create('change'); assert.equal(s.revision,2); assert.equal(s.history[0].revision,1);
  assert.equal(action(s,'site','use').allowed,false); issue(s);
  assert.equal(action(s,'site','use').allowed,false); s.siteRevision=2;
  assert.equal(action(s,'site','use').allowed,true);
});
test('export re-import replays actual decisions including denied actions, move and site revision', () => {
  const s = E.create('change'); action(s,'admin','move','PUBLISHED'); action(s,'site','use'); issue(s);
  s.siteRevision=2; action(s,'site','use');
  const restored = E.restore(JSON.parse(JSON.stringify(E.exportSession(s))));
  assert.deepEqual(restored,s);
});
test('import ignores injected approvals and reconstructs only supported actions', () => {
  const input = E.exportSession(E.create()); input.authorization={revision:1}; input.state='PUBLISHED';
  const s = E.restore(input); assert.equal(s.authorization,null); assert.equal(s.state,'WIP');
  assert.throws(() => E.restore({ ...input, scenario:'__proto__' }));
  assert.throws(() => E.restore({ ...input, actions:[{ actor:'__proto__' }] }));
  assert.throws(() => E.restore({ ...input, actions:Array(1001).fill({}) }));
  assert.throws(() => E.restore({ ...input, actions:[{actor:'author', action:'<script>', purpose:'construction', siteRevision:1, at:new Date().toISOString()}] }));
});
test('standalone canonical data matches JSON, all RACI activities have 12 entries and exactly one A', () => {
  const root=path.resolve(__dirname,'..'); const canonical=JSON.parse(fs.readFileSync(path.join(root,'data/cde-template.json'),'utf8'));
  const context={window:{}}; vm.runInNewContext(fs.readFileSync(path.join(root,'data/template.js'),'utf8'),context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.window.CDE_TEMPLATE)),canonical);
  for (const activity of canonical.responsibilityMatrix.activities) { assert.equal(activity.raci.length,12); assert.equal(activity.raci.filter(v=>v==='A').length,1); }
});
test('required filename positive and negative examples match prototype validation', () => {
  const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
  const expression=html.match(/m=(\/\^.*?\$\/)\.exec\(name\)/)[1]; const regex=vm.runInNewContext(expression);
  assert.ok(regex.test('PRJ-ARC-ZZ-01-DR-A-0001.pdf')); assert.equal(regex.test('Approved-Final-v9.pdf'),false);
});
