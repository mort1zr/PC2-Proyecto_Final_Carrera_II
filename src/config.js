const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción');
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: '8h',
  bcryptRounds: 10,
  roles: ['generator', 'collector', 'point_admin'],
  materials: ['papel', 'carton', 'plastico', 'vidrio', 'metal', 'electronicos'],
};
