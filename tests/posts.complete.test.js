const { buildTestApp, registerAndLogin } = require('./helpers');

describe('POST /api/posts/:id/complete', () => {
  let api;
  let gen;
  let col1;
  let col2;
  let postId;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
    col1 = await registerAndLogin(api, { email: 'col1@correo.com', role: 'collector' });
    col2 = await registerAndLogin(api, { email: 'col2@correo.com', role: 'collector' });
    const created = await api.post('/api/posts').set(auth(gen.token)).send({
      material: 'carton',
      quantity: '5 cajas',
      address: 'Av. Reciclaje 100',
      pickup_time: 'Tardes',
    });
    postId = created.body.id;
    await api.post(`/api/posts/${postId}/accept`).set(auth(col1.token));
  });

  test('cambia el estado a Completada y registra la fecha', async () => {
    const res = await api.post(`/api/posts/${postId}/complete`).set(auth(col1.token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Completada');
    expect(res.body.completed_at).toBeTruthy();
  });

  test('deniega la acción si la publicación no está asignada al recolector', async () => {
    const res = await api.post(`/api/posts/${postId}/complete`).set(auth(col2.token));
    expect(res.status).toBe(403);
  });

  test('no permite modificar una publicación ya completada', async () => {
    await api.post(`/api/posts/${postId}/complete`).set(auth(col1.token));
    const again = await api.post(`/api/posts/${postId}/complete`).set(auth(col1.token));
    expect(again.status).toBe(409);
    expect(again.body.error).toMatch(/no admite cambios/);
  });

  test('responde 404 si la publicación no existe', async () => {
    const res = await api.post('/api/posts/9999/complete').set(auth(col1.token));
    expect(res.status).toBe(404);
  });

  test('el generador ve la publicación como Completada', async () => {
    await api.post(`/api/posts/${postId}/complete`).set(auth(col1.token));
    const mine = await api.get('/api/posts/mine').set(auth(gen.token));
    expect(mine.body.posts[0].status).toBe('Completada');
  });
});
