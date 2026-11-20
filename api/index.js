// Punto de entrada serverless para Vercel: expone la API Express en /api/*
const { createApp } = require('../src/app');
const { createPool, initSchema } = require('../src/db');
const { ensureAdmin } = require('../src/routes/admin');

let appPromise;

async function buildApp() {
  const pool = createPool();
  await initSchema(pool);
  await ensureAdmin(pool, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  return createApp({ pool });
}

module.exports = async (req, res) => {
  try {
    if (!appPromise) appPromise = buildApp();
    const app = await appPromise;
    return app(req, res);
  } catch (err) {
    appPromise = undefined; // permite reintentar en la siguiente invocación
    console.error('Error al iniciar la API', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'La API no pudo iniciarse' }));
  }
};
