const { buildTestApp, registerAndLogin } = require('./helpers');

describe('POST /api/posts/:id/accept', () => {
  let api;
  let gen;
  let col1;
  let col2;
  let postId;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator', name: 'Gina Generadora' });
    col1 = await registerAndLogin(api, { email: 'col1@correo.com', role: 'collector', name: 'Carlos Recolector' });
    col2 = await registerAndLogin(api, { email: 'col2@correo.com', role: 'collector', name: 'Clara Recicladora' });
    const created = await api.post('/api/posts').set(auth(gen.token)).send({
      material: 'metal',
      quantity: '10 kg',
      address: 'Calle Falsa 123',
      pickup_time: 'Mañanas',
    });
    postId = created.body.id;
  });

  test('cambia el estado a Aceptada y queda asignada al recolector', async () => {
    const res = await api.post(`/api/posts/${postId}/accept`).set(auth(col1.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'Aceptada', collector_id: col1.user.id });
  });

  test('informa que ya no está disponible si otro recolector la aceptó antes', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col1.token));
    const res = await api.post(`/api/posts/${postId}/accept`).set(auth(col2.token));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya no está disponible/);
  });

  test('el generador ve el nombre del recolector asignado', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col1.token));
    const mine = await api.get('/api/posts/mine').set(auth(gen.token));
    expect(mine.body.posts[0].collector_name).toBe('Carlos Recolector');
  });

  test('la publicación aceptada deja de aparecer entre las disponibles', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col1.token));
    const list = await api.get('/api/posts/available').set(auth(col2.token));
    expect(list.body.posts).toEqual([]);
  });

  test('el recolector ve sus publicaciones aceptadas', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col1.token));
    const res = await api.get('/api/posts/assigned').set(auth(col1.token));
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].generator_name).toBe('Gina Generadora');
  });

  test('responde 404 si la publicación no existe', async () => {
    const res = await api.post('/api/posts/9999/accept').set(auth(col1.token));
    expect(res.status).toBe(404);
  });

  test('un generador no puede aceptar publicaciones', async () => {
    const res = await api.post(`/api/posts/${postId}/accept`).set(auth(gen.token));
    expect(res.status).toBe(403);
  });
});
