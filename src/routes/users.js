const express = require('express');
const { z } = require('zod');
const { validate } = require('../validate');
const { requireAuth } = require('../middleware/auth');

const profileSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s-]{6,20}$/, 'Teléfono inválido')
    .optional()
    .or(z.literal('')),
  zone: z.string().trim().max(100).optional().or(z.literal('')),
});

module.exports = function usersRouter({ pool }) {
  const router = express.Router();
  const auth = requireAuth(pool);

  // PPCII-9 · Gestionar perfil de usuario
  router.get('/me', auth, (req, res) => res.json({ user: req.user }));

  router.put('/me', auth, validate(profileSchema), async (req, res, next) => {
    try {
      const { name, phone = '', zone = '' } = req.body;
      const updated = await pool.query(
        'UPDATE users SET name = $1, phone = $2, zone = $3 WHERE id = $4 RETURNING id, name, email, role, phone, zone',
        [name, phone || null, zone || null, req.user.id]
      );
      return res.json({ user: updated.rows[0], message: 'Perfil actualizado' });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
