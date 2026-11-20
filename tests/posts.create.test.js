const { buildTestApp, registerAndLogin } = require('./helpers');

describe('Publicación de residuos', () => {
  let api;
  let gen;
  const post = {
    material: 'plastico',
    quantity: '3 bolsas grandes',
    address: 'Jr. Las Flores 456, Miraflores',
    zone: 'Miraflores',
    pickup_time: 'Sábados de 9:00 a 12:00',
  };

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
  });

  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  test('crea la publicación con estado Disponible', async () => {
    const res = await api.post('/api/posts').set(auth(gen.token)).send(post);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ material: 'plastico', status: 'Disponible' });
  });

  test('rechaza la publicación si faltan datos obligatorios', async () => {
    const res = await api.post('/api/posts').set(auth(gen.token)).send({ material: 'vidrio' });
    expect(res.status).toBe(400);
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['quantity', 'address', 'pickup_time']));
  });

  test('"Mis publicaciones" muestra el estado actual de cada una', async () => {
    await api.post('/api/posts').set(auth(gen.token)).send(post);
    await api.post('/api/posts').set(auth(gen.token)).send({ ...post, material: 'vidrio' });
    const res = await api.get('/api/posts/mine').set(auth(gen.token));
    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(2);
    expect(res.body.posts.every((p) => p.status === 'Disponible')).toBe(true);
  });

  test('cada generador solo ve sus propias publicaciones', async () => {
    await api.post('/api/posts').set(auth(gen.token)).send(post);
    const other = await registerAndLogin(api, { email: 'otro@correo.com', role: 'generator' });
    const res = await api.get('/api/posts/mine').set(auth(other.token));
    expect(res.body.posts).toEqual([]);
  });

  test('un recolector no puede publicar residuos', async () => {
    const col = await registerAndLogin(api, { email: 'col@correo.com', role: 'collector' });
    const res = await api.post('/api/posts').set(auth(col.token)).send(post);
    expect(res.status).toBe(403);
  });

  test('exige autenticación', async () => {
    const res = await api.post('/api/posts').send(post);
    expect(res.status).toBe(401);
  });
});
