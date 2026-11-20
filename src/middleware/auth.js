const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Exige un token válido cuya sesión siga activa en la base de datos.
 * Deja el usuario en req.user y el id de sesión en req.sessionId.
 */
function requireAuth(pool) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Autenticación requerida' });
      }
      let payload;
      try {
        payload = jwt.verify(token, config.jwtSecret);
      } catch {
        return res.status(401).json({ error: 'Sesión inválida o expirada' });
      }
      const found = await pool.query(
        'SELECT u.id, u.name, u.email, u.role, u.phone, u.zone FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = $1',
        [payload.jti]
      );
      if (found.rows.length === 0) {
        return res.status(401).json({ error: 'Sesión inválida o expirada' });
      }
      req.user = found.rows[0];
      req.sessionId = payload.jti;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

/** Restringe el acceso a uno o más roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
