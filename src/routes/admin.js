const express = require('express');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');

/** Crea (si no existe) el administrador de la plataforma a partir de variables de entorno. */
async function ensureAdmin(pool, { email, password, name = 'Administrador' }) {
  if (!email || !password) return false;
  const normalized = email.trim().toLowerCase();
  const found = await pool.query('SELECT id FROM users WHERE email = $1', [normalized]);
  if (found.rows.length > 0) return false;
  const hash = await bcrypt.hash(password, config.bcryptRounds);
  await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)', [
    name,
    normalized,
    hash,
    'admin',
  ]);
  return true;
}

// PPCII-25 · Moderar publicaciones y puntos de acopio
function adminRouter({ pool }) {
  const router = express.Router();
  const guard = [requireAuth(pool), requireRole('admin')];

  // Panel: puntos y publicaciones con su estado
  router.get('/overview', ...guard, async (req, res, next) => {
    try {
      const points = await pool.query(
        'SELECT id, name, address, active FROM collection_points ORDER BY id DESC'
      );
      const posts = await pool.query(
        'SELECT id, material, quantity, address, status FROM posts ORDER BY id DESC'
      );
      return res.json({ points: points.rows, posts: posts.rows });
    } catch (err) {
      return next(err);
    }
  });

  const setPointActive = (active) => async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identificador inválido' });
      const updated = await pool.query(
        'UPDATE collection_points SET active = $1 WHERE id = $2 RETURNING id, name, active',
        [active, id]
      );
      if (updated.rows.length === 0) return res.status(404).json({ error: 'Punto de acopio no encontrado' });
      return res.json(updated.rows[0]);
    } catch (err) {
      return next(err);
    }
  };
  router.post('/points/:id/deactivate', ...guard, setPointActive(false));
  router.post('/points/:id/activate', ...guard, setPointActive(true));

  // Desactiva una publicación inapropiada (deja de mostrarse a los recolectores)
  router.post('/posts/:id/deactivate', ...guard, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identificador inválido' });
      const updated = await pool.query(
        `UPDATE posts SET status = 'Cancelada' WHERE id = $1 AND status IN ('Disponible', 'Aceptada') RETURNING id, status`,
        [id]
      );
      if (updated.rows.length === 0) {
        const exists = await pool.query('SELECT id FROM posts WHERE id = $1', [id]);
        if (exists.rows.length === 0) return res.status(404).json({ error: 'Publicación no encontrada' });
        return res.status(409).json({ error: 'La publicación ya no se puede desactivar' });
      }
      return res.json(updated.rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { adminRouter, ensureAdmin };
