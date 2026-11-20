const { buildTestApp } = require('./helpers');

describe('POST /api/auth/register', () => {
  let api;
  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
  });

  const valid = { name: 'Ana Pérez', email: 'ana@correo.com', password: 'Clave12345', role: 'generator' };

  test('crea la cuenta con datos válidos', async () => {
    const res = await api.post('/api/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Ana Pérez', email: 'ana@correo.com', role: 'generator' });
    expect(res.body.password_hash).toBeUndefined();
  });

  test('rechaza un correo ya registrado', async () => {
    await api.post('/api/auth/register').send(valid);
    const res = await api.post('/api/auth/register').send(valid);
    expect(res.status).toBe(409);
  });

  test('rechaza una contraseña de menos de 8 caracteres', async () => {
    const res = await api.post('/api/auth/register').send({ ...valid, password: 'corta' });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('password');
  });

  test('rechaza un correo inválido y un rol inválido', async () => {
    const bad = await api.post('/api/auth/register').send({ ...valid, email: 'no-es-correo' });
    expect(bad.status).toBe(400);
    const role = await api.post('/api/auth/register').send({ ...valid, role: 'admin' });
    expect(role.status).toBe(400);
  });
});
