const { buildTestApp, registerAndLogin } = require('./helpers');

describe('Notificaciones de cambio de estado', () => {
  let api;
  let gen;
  let col;
  let postId;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
    col = await registerAndLogin(api, { email: 'col@correo.com', role: 'collector', name: 'Carlos Recolector' });
    const created = await api.post('/api/posts').set(auth(gen.token)).send({
      material: 'vidrio',
      quantity: '4 botellas',
      address: 'Av. Central 12',
      pickup_time: 'Viernes',
    });
    postId = created.body.id;
  });

  test('el generador recibe una notificación con el nombre del recolector al aceptarse su publicación', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col.token));
    const res = await api.get('/api/notifications').set(auth(gen.token));
    expect(res.body.notifications).toHaveLength(1);
    expect(res.body.notifications[0].message).toMatch(/Carlos Recolector/);
  });

  test('muestra el contador de no leídas', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col.token));
    await api.post(`/api/posts/${postId}/complete`).set(auth(col.token));
    const res = await api.get('/api/notifications').set(auth(gen.token));
    expect(res.body.unread).toBe(2);
  });

  test('marca una notificación como leída al abrirla', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col.token));
    const list = await api.get('/api/notifications').set(auth(gen.token));
    const id = list.body.notifications[0].id;
    const read = await api.post(`/api/notifications/${id}/read`).set(auth(gen.token));
    expect(read.status).toBe(200);
    const after = await api.get('/api/notifications').set(auth(gen.token));
    expect(after.body.unread).toBe(0);
  });

  test('un usuario no puede leer notificaciones ajenas', async () => {
    await api.post(`/api/posts/${postId}/accept`).set(auth(col.token));
    const list = await api.get('/api/notifications').set(auth(gen.token));
    const id = list.body.notifications[0].id;
    const res = await api.post(`/api/notifications/${id}/read`).set(auth(col.token));
    expect(res.status).toBe(404);
  });

  test('exige autenticación', async () => {
    const res = await api.get('/api/notifications');
    expect(res.status).toBe(401);
  });
});
