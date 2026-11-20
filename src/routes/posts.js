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
  const collector = requireRole('collector');

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

  // PPCII-16 · Consultar residuos disponibles para recolección
  router.get('/available', auth, collector, async (req, res, next) => {
    try {
      const { material } = req.query;
      if (material !== undefined && !config.materials.includes(material)) {
        return res.status(400).json({ error: 'Material inválido', allowed: config.materials });
      }
      const params = [];
      let filter = '';
      if (material) {
        params.push(material);
        filter = ' AND p.material = $1';
      }
      const rows = await pool.query(
        `SELECT p.id, p.material, p.quantity, p.address, p.zone, p.pickup_time, p.created_at
         FROM posts p WHERE p.status = 'Disponible'${filter} ORDER BY p.id DESC`,
        params
      );
      return res.json({ posts: rows.rows });
    } catch (err) {
      return next(err);
    }
  });

  // PPCII-17 · Aceptar solicitud de recolección (atómico: solo si sigue Disponible)
  router.post('/:id/accept', auth, collector, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identificador inválido' });
      const updated = await pool.query(
        `UPDATE posts SET status = 'Aceptada', collector_id = $1
         WHERE id = $2 AND status = 'Disponible'
         RETURNING id, material, quantity, address, zone, pickup_time, status, collector_id, generator_id`,
        [req.user.id, id]
      );
      if (updated.rows.length === 0) {
        const exists = await pool.query('SELECT id FROM posts WHERE id = $1', [id]);
        if (exists.rows.length === 0) return res.status(404).json({ error: 'Publicación no encontrada' });
        return res.status(409).json({ error: 'La publicación ya no está disponible' });
      }
      const { generator_id: generatorId, ...post } = updated.rows[0];
      return res.json(post);
    } catch (err) {
      return next(err);
    }
  });

  // PPCII-19 · Cancelar publicación de residuos (solo el generador y solo si sigue Disponible)
  router.post('/:id/cancel', auth, generator, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identificador inválido' });
      const found = await pool.query('SELECT id, status, generator_id FROM posts WHERE id = $1', [id]);
      const post = found.rows[0];
      if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });
      if (post.generator_id !== req.user.id) {
        return res.status(403).json({ error: 'Solo el autor puede cancelar la publicación' });
      }
      if (post.status !== 'Disponible') {
        const reason =
          post.status === 'Completada'
            ? 'No se puede cancelar una publicación completada'
            : `No se puede cancelar una publicación en estado ${post.status}`;
        return res.status(409).json({ error: reason });
      }
      const updated = await pool.query(
        `UPDATE posts SET status = 'Cancelada' WHERE id = $1 AND status = 'Disponible' RETURNING id, status`,
        [id]
      );
      if (updated.rows.length === 0) {
        return res.status(409).json({ error: 'La publicación ya no se puede cancelar' });
      }
      return res.json(updated.rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  // PPCII-18 · Confirmar recolección completada
  router.post('/:id/complete', auth, collector, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identificador inválido' });
      const found = await pool.query('SELECT id, status, collector_id FROM posts WHERE id = $1', [id]);
      const post = found.rows[0];
      if (!post) return res.status(404).json({ error: 'Publicación no encontrada' });
      if (post.collector_id !== req.user.id) {
        return res.status(403).json({ error: 'La publicación no está asignada a ti' });
      }
      if (post.status === 'Completada') {
        return res.status(409).json({ error: 'La publicación ya está completada y no admite cambios' });
      }
      if (post.status !== 'Aceptada') {
        return res.status(409).json({ error: 'Solo se pueden completar publicaciones aceptadas' });
      }
      const updated = await pool.query(
        `UPDATE posts SET status = 'Completada', completed_at = now()
         WHERE id = $1 AND status = 'Aceptada'
         RETURNING id, material, quantity, status, completed_at`,
        [id]
      );
      return res.json(updated.rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  // Publicaciones aceptadas por el recolector autenticado
  router.get('/assigned', auth, collector, async (req, res, next) => {
    try {
      const rows = await pool.query(
        `SELECT p.id, p.material, p.quantity, p.address, p.zone, p.pickup_time, p.status, p.completed_at, g.name AS generator_name, g.phone AS generator_phone
         FROM posts p JOIN users g ON g.id = p.generator_id
         WHERE p.collector_id = $1 ORDER BY p.id DESC`,
        [req.user.id]
      );
      return res.json({ posts: rows.rows });
    } catch (err) {
      return next(err);
    }
  });

  return router;
};
