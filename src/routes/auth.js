const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const config = require('../config');
const { validate } = require('../validate');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  email: z.string().trim().toLowerCase().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(config.roles, { message: 'Rol inválido' }),
});

module.exports = function authRouter({ pool }) {
  const router = express.Router();

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
