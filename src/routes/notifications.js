const express = require('express');
const { requireAuth } = require('../middleware/auth');

/** Registra una notificación para un usuario. */
async function notify(pool, userId, message) {
  await pool.query('INSERT INTO notifications (user_id, message) VALUES ($1, $2)', [userId, message]);
}

// PPCII-20 · Recibir notificaciones de cambio de estado
function notificationsRouter({ pool }) {
  const router = express.Router();
  const auth = requireAuth(pool);

  router.get('/', auth, async (req, res, next) => {
    try {
      const rows = await pool.query(
        'SELECT id, message, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 50',
        [req.user.id]
      );
      const unread = rows.rows.filter((n) => !n.is_read).length;
      return res.json({ notifications: rows.rows, unread });
    } catch (err) {
      return next(err);
    }
  });

  router.post('/:id/read', auth, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'Identificador inválido' });
      const updated = await pool.query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id, is_read',
        [id, req.user.id]
      );
      if (updated.rows.length === 0) return res.status(404).json({ error: 'Notificación no encontrada' });
      return res.json(updated.rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { notificationsRouter, notify };
