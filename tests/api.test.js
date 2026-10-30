'use strict';
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../server');

const active = [];
afterEach(async () => {
  for (const { server, directory } of active.splice(0)) {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
async function start() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'riskcontrol-test-'));
  const dataFile = path.join(directory, 'data.json');
  const server = createApp({ dataFile }).listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  active.push({ server, directory });
  return { base: 'http://127.0.0.1:' + server.address().port, dataFile };
}
const valid = { date: '2026-10-30', inflacion: 2.5, pbi: 1000, tipoCambioOficial: 1200 };
async function post(base, payload) {
  const response = await fetch(base + '/api/indicators', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return { status: response.status, data: await response.json() };
}
test('GET returns [] when no file exists', async () => {
  const { base } = await start();
  const response = await fetch(base + '/api/indicators');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});
test('POST persists valid indicator; GET returns it', async () => {
  const { base, dataFile } = await start();
  const response = await post(base, valid);
  assert.equal(response.status, 200);
  assert.deepEqual(response.data.data, valid);
  assert.deepEqual(JSON.parse(fs.readFileSync(dataFile, 'utf8')), [valid]);
  assert.deepEqual(await (await fetch(base + '/api/indicators')).json(), [valid]);
});
test('same date updates record rather than duplicating it', async () => {
  const { base } = await start();
  await post(base, valid);
  const updated = { ...valid, inflacion: 3.7 };
  assert.equal((await post(base, updated)).status, 200);
  assert.deepEqual(await (await fetch(base + '/api/indicators')).json(), [updated]);
});
test('invalid dates return 400 without changing storage', async () => {
  const { base, dataFile } = await start();
  await post(base, valid);
  for (const date of [undefined, 'bad', '2026-02-30', 20261030, '2026-13-01'])
    assert.equal((await post(base, { ...valid, date })).status, 400);
  assert.deepEqual(JSON.parse(fs.readFileSync(dataFile, 'utf8')), [valid]);
});
test('missing and invalid financial metrics return 400', async () => {
  const { base } = await start();
  for (const key of ['inflacion', 'pbi', 'tipoCambioOficial']) {
    for (const value of [undefined, '12.5', null])
      assert.equal((await post(base, { ...valid, [key]: value })).status, 400);
  }
  assert.equal((await post(base, { ...valid, tipoCambioOficial: 0 })).status, 400);
});
test('malformed JSON returns HTTP 400', async () => {
  const { base } = await start();
  const response = await fetch(base + '/api/indicators', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken'
  });
  assert.equal(response.status, 400);
});
test('corrupt file returns controlled HTTP 500 on GET', async () => {
  const { base, dataFile } = await start();
  fs.writeFileSync(dataFile, '{bad');
  const response = await fetch(base + '/api/indicators');
  assert.equal(response.status, 500);
});
test('corrupt file is not overwritten by POST', async () => {
  const { base, dataFile } = await start();
  fs.writeFileSync(dataFile, '{bad');
  assert.equal((await post(base, valid)).status, 500);
  assert.equal(fs.readFileSync(dataFile, 'utf8'), '{bad');
});
