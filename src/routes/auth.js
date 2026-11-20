const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const config = require('../config');
const { validate } = require('../validate');
const { requireAuth } = require('../middleware/auth');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(config.roles, { message: 'Rol inválido' }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

module.exports = function authRouter({ pool }) {
  const router = express.Router();
  const auth = requireAuth(pool);

  // PPCII-7 · Iniciar sesión
  router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const found = await pool.query(
        'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
        [email]
      );
      const user = found.rows[0];
      // Mismo mensaje para correo inexistente y contraseña errónea
      const valid = user && (await bcrypt.compare(password, user.password_hash));
      if (!valid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const sessionId = crypto.randomUUID();
      await pool.query('INSERT INTO sessions (id, user_id) VALUES ($1, $2)', [sessionId, user.id]);
      const token = jwt.sign({ sub: user.id, jti: sessionId }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
      });
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      return next(err);
    }
  });

  // Usuario autenticado actual (ruta protegida)
  router.get('/me', auth, (req, res) => res.json({ user: req.user }));

  // PPCII-6 · Registrar cuenta de usuario
  router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'El correo ya está registrado' });
      }
      const hash = await bcrypt.hash(password, config.bcryptRounds);
      const created = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, hash, role]
      );
      return res.status(201).json(created.rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
