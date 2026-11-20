const { buildTestApp, registerAndLogin } = require('./helpers');

describe('POST /api/posts/:id/cancel', () => {
  let api;
  let gen;
  let col;
  let postId;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
    col = await registerAndLogin(api, { email: 'col@correo.com', role: 'collector' });
    const created = await api.post('/api/posts').set(auth(gen.token)).send({
      material: 'papel',
      quantity: '1 caja',
      address: 'Av. Los Olivos 55',
      pickup_time: 'Lunes',
    });
    postId = created.body.id;
  });

  test('cancela una publicación disponible y deja de mostrarse a los recolectores', async () => {
    const res = await api.post(`/api/posts/${postId}/cancel`).set(auth(gen.token));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Cancelada');
    const list = await api.get('/api/posts/available').set(auth(col.token));
    expect(list.body.posts).toEqual([]);
  });

  test('no permite cancelar una publicación completada', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col.token));
    await api.post(`/api/posts/${postId}/complete`).set(auth(col.token));
    const res = await api.post(`/api/posts/${postId}/cancel`).set(auth(gen.token));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/completada/);
  });

  test('no permite cancelar una publicación ya aceptada', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col.token));
    const res = await api.post(`/api/posts/${postId}/cancel`).set(auth(gen.token));
    expect(res.status).toBe(409);
  });

  test('solo el autor puede cancelar su publicación', async () => {
    const other = await registerAndLogin(api, { email: 'otro@correo.com', role: 'generator' });
    const res = await api.post(`/api/posts/${postId}/cancel`).set(auth(other.token));
    expect(res.status).toBe(403);
  });

  test('responde 404 si la publicación no existe', async () => {
    const res = await api.post('/api/posts/9999/cancel').set(auth(gen.token));
    expect(res.status).toBe(404);
  });
});
