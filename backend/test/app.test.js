import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/salud returns ok', async () => {
  const response = await request(app).get('/api/salud');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('GET /api/arts returns products', async () => {
  const response = await request(app).get('/api/arts');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0);
});

test('GET /api/seg returns a simulated finding', async () => {
  const response = await request(app).get('/api/seg');
  assert.equal(response.status, 200);
  assert.equal(response.body.simulated, true);
  assert.equal(response.body.status, 'warning');
  assert.equal(response.body.severity, 'medium');
});
