const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const pointsRouter = require('./routes/points');

/** Construye la aplicación Express con un pool de base de datos inyectado. */
function createApp({ pool, rateLimitMax = 100, clock } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(
    '/api/',
    rateLimit({ windowMs: 15 * 60 * 1000, max: rateLimitMax, standardHeaders: true, legacyHeaders: false })
  );

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter({ pool }));
  app.use('/api/users', usersRouter({ pool }));
  app.use('/api/points', pointsRouter({ pool, clock }));

  app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { createApp };
