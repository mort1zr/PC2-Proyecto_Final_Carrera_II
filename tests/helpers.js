const { newDb } = require('pg-mem');
const request = require('supertest');
const { createApp } = require('../src/app');
const { initSchema } = require('../src/db');

/** Crea una app con una base de datos PostgreSQL en memoria. */
async function buildTestApp({ clock } = {}) {
  const db = newDb();
  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  await initSchema(pool);
  const app = createApp({ pool, rateLimitMax: 10000, clock });
  return { app, pool, request: request(app) };
}

async function registerAndLogin(api, { email, role = 'generator', name = 'Usuario Prueba', password = 'Clave12345' }) {
  await api.post('/api/auth/register').send({ name, email, password, role });
  const res = await api.post('/api/auth/login').send({ email, password });
  return { token: res.body.token, user: res.body.user };
}

/** Crea un administrador de plataforma (el rol no se puede elegir al registrarse). */
async function createAdminAndLogin(api, pool, email = 'admin@plataforma.com') {
  const password = 'ClaveAdmin123';
  await api.post('/api/auth/register').send({ name: 'Admin', email, password, role: 'generator' });
  await pool.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
  const res = await api.post('/api/auth/login').send({ email, password });
  return { token: res.body.token, user: res.body.user };
}

module.exports = { buildTestApp, registerAndLogin, createAdminAndLogin };
