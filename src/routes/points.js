const express = require('express');
const { z } = require('zod');
const config = require('../config');
const { validate } = require('../validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const pointSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  address: z.string().trim().min(5, 'La dirección es obligatoria'),
  lat: z.coerce.number({ message: 'Latitud inválida' }).min(-90).max(90),
  lng: z.coerce.number({ message: 'Longitud inválida' }).min(-180).max(180),
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const detailsSchema = z
  .object({
    materials: z
      .array(z.enum(config.materials, { message: 'Material inválido' }))
      .min(1, 'Selecciona al menos un material'),
    hours: z
      .array(
        z.object({
          day: z.number().int().min(0).max(6),
          open: z.string().regex(timeRegex, 'Hora de apertura inválida (HH:MM)'),
          close: z.string().regex(timeRegex, 'Hora de cierre inválida (HH:MM)'),
        })
      )
      .min(1, 'Indica al menos un horario'),
  })
  .superRefine((data, ctx) => {
    data.hours.forEach((h, i) => {
      if (h.open >= h.close) {
        ctx.addIssue({
          code: 'custom',
          path: ['hours', i, 'close'],
          message: 'El horario de cierre debe ser posterior al de apertura',
        });
      }
    });
  })
  .transform((data) => ({ ...data, materials: [...new Set(data.materials)] }));

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

  // PPCII-11 · Definir materiales y horarios de un punto de acopio
  router.put('/:id/details', auth, pointAdmin, validate(detailsSchema), async (req, res, next) => {
    try {
      const pointId = Number(req.params.id);
      if (!Number.isInteger(pointId)) {
        return res.status(400).json({ error: 'Identificador inválido' });
      }
      const point = await pool.query('SELECT id, owner_id FROM collection_points WHERE id = $1', [pointId]);
      if (point.rows.length === 0) {
        return res.status(404).json({ error: 'Punto de acopio no encontrado' });
      }
      if (point.rows[0].owner_id !== req.user.id) {
        return res.status(403).json({ error: 'Solo el propietario puede modificar el punto' });
      }
      const { materials, hours } = req.body;
      await pool.query('DELETE FROM point_materials WHERE point_id = $1', [pointId]);
      await pool.query('DELETE FROM point_hours WHERE point_id = $1', [pointId]);
      for (const material of materials) {
        await pool.query('INSERT INTO point_materials (point_id, material) VALUES ($1, $2)', [pointId, material]);
      }
      for (const h of hours) {
        await pool.query(
          'INSERT INTO point_hours (point_id, day, open_time, close_time) VALUES ($1, $2, $3, $4)',
          [pointId, h.day, h.open, h.close]
        );
      }
      return res.json({ id: pointId, materials, hours });
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
