const express = require('express');
const { z } = require('zod');
const config = require('../config');
const { validate } = require('../validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const postSchema = z.object({
  material: z.enum(config.materials, { message: 'Material inválido' }),
  quantity: z.string().trim().min(1, 'La cantidad es obligatoria').max(60),
  address: z.string().trim().min(5, 'La dirección es obligatoria'),
  zone: z.string().trim().max(100).optional(),
  pickup_time: z.string().trim().min(1, 'El horario de recojo es obligatorio').max(100),
});

const COLUMNS =
  'p.id, p.material, p.quantity, p.address, p.zone, p.pickup_time, p.status, p.created_at, p.completed_at, p.collector_id, u.name AS collector_name';

module.exports = function postsRouter({ pool }) {
  const router = express.Router();
  const auth = requireAuth(pool);
  const generator = requireRole('generator');

  // PPCII-15 · Publicar residuos reciclables disponibles
  router.post('/', auth, generator, validate(postSchema), async (req, res, next) => {
    try {
      const { material, quantity, address, zone, pickup_time: pickupTime } = req.body;
      const created = await pool.query(
        `INSERT INTO posts (generator_id, material, quantity, address, zone, pickup_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'Disponible')
         RETURNING id, material, quantity, address, zone, pickup_time, status`,
        [req.user.id, material, quantity, address, zone || null, pickupTime]
      );
      return res.status(201).json(created.rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  // "Mis publicaciones": estado actual de cada una y recolector asignado
  router.get('/mine', auth, generator, async (req, res, next) => {
    try {
      const rows = await pool.query(
        `SELECT ${COLUMNS} FROM posts p LEFT JOIN users u ON u.id = p.collector_id
         WHERE p.generator_id = $1 ORDER BY p.id DESC`,
        [req.user.id]
      );
      return res.json({ posts: rows.rows });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
