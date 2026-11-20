const { buildTestApp, registerAndLogin } = require('./helpers');

describe('GET /api/posts/available', () => {
  let api;
  let gen;
  let col;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const base = { quantity: '2 bolsas', address: 'Av. Siempre Viva 742', zone: 'Surco', pickup_time: 'Lunes por la tarde' };

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
    col = await registerAndLogin(api, { email: 'col@correo.com', role: 'collector' });
    await api.post('/api/posts').set(auth(gen.token)).send({ ...base, material: 'vidrio' });
    await api.post('/api/posts').set(auth(gen.token)).send({ ...base, material: 'papel' });
  });

  test('muestra material, cantidad, zona y horario de cada publicación disponible', async () => {
    const res = await api.get('/api/posts/available').set(auth(col.token));
    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(2);
    expect(res.body.posts[0]).toEqual(
      expect.objectContaining({ material: expect.any(String), quantity: '2 bolsas', zone: 'Surco', pickup_time: 'Lunes por la tarde' })
    );
  });

  test('filtra por tipo de material', async () => {
    const res = await api.get('/api/posts/available').query({ material: 'vidrio' }).set(auth(col.token));
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].material).toBe('vidrio');
  });

  test('rechaza un material fuera del catálogo', async () => {
    const res = await api.get('/api/posts/available').query({ material: 'madera' }).set(auth(col.token));
    expect(res.status).toBe(400);
  });

  test('solo los recolectores pueden consultar las publicaciones disponibles', async () => {
    const res = await api.get('/api/posts/available').set(auth(gen.token));
    expect(res.status).toBe(403);
  });

  test('exige autenticación', async () => {
    const res = await api.get('/api/posts/available');
    expect(res.status).toBe(401);
  });
});
