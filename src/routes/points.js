const express = require('express');
const { z } = require('zod');
const { validate } = require('../validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const pointSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  address: z.string().trim().min(5, 'La dirección es obligatoria'),
  lat: z.coerce.number({ message: 'Latitud inválida' }).min(-90).max(90),
  lng: z.coerce.number({ message: 'Longitud inválida' }).min(-180).max(180),
});

module.exports = function pointsRouter({ pool }) {
  const router = express.Router();
  const auth = requireAuth(pool);
  const pointAdmin = requireRole('point_admin');

  // PPCII-10 · Registrar punto de acopio
  router.post('/', auth, pointAdmin, validate(pointSchema), async (req, res, next) => {
    try {
      const { name, address, lat, lng } = req.body;
      const created = await pool.query(
        'INSERT INTO collection_points (owner_id, name, address, lat, lng) VALUES ($1, $2, $3, $4, $5) RETURNING id, owner_id, name, address, lat, lng, active',
        [req.user.id, name, address, lat, lng]
      );
      return res.status(201).json(created.rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  // Listado de los puntos del administrador autenticado
  router.get('/mine', auth, pointAdmin, async (req, res, next) => {
    try {
      const rows = await pool.query(
        'SELECT id, name, address, lat, lng, active FROM collection_points WHERE owner_id = $1 ORDER BY id',
        [req.user.id]
      );
      return res.json({ points: rows.rows });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
