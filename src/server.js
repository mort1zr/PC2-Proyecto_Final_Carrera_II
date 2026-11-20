const { createApp } = require('./app');
const { createPool, initSchema } = require('./db');
const { ensureAdmin } = require('./routes/admin');

async function main() {
  const pool = createPool();
  await initSchema(pool);
  await ensureAdmin(pool, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const app = createApp({ pool });
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API escuchando en el puerto ${port}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
