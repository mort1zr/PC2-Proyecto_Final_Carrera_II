const { buildTestApp, registerAndLogin, createAdminAndLogin } = require('./helpers');
const { ensureAdmin } = require('../src/routes/admin');

describe('Moderación (administrador)', () => {
  let api;
  let pool;
  let admin;
  let pointAdmin;
  let gen;
  let pointId;
  let postId;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  beforeEach(async () => {
    ({ request: api, pool } = await buildTestApp());
    admin = await createAdminAndLogin(api, pool);
    pointAdmin = await registerAndLogin(api, { email: 'punto@correo.com', role: 'point_admin' });
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
    const point = await api.post('/api/points').set(auth(pointAdmin.token)).send({
      name: 'Punto Dudoso',
      address: 'Calle Inapropiada 1',
      lat: -12,
      lng: -77,
    });
    pointId = point.body.id;
    const post = await api.post('/api/posts').set(auth(gen.token)).send({
      material: 'papel',
      quantity: '1 caja',
      address: 'Av. Moderación 3',
      pickup_time: 'Lunes',
    });
    postId = post.body.id;
  });

  test('el panel muestra la lista de publicaciones y puntos con su estado', async () => {
    const res = await api.get('/api/admin/overview').set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.points[0]).toMatchObject({ name: 'Punto Dudoso', active: true });
    expect(res.body.posts[0]).toMatchObject({ status: 'Disponible' });
  });

  test('desactivar un punto lo oculta de la lista pública y del mapa', async () => {
    const before = await api.get('/api/points');
    expect(before.body.points).toHaveLength(1);
    const res = await api.post(`/api/admin/points/${pointId}/deactivate`).set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
    const after = await api.get('/api/points');
    expect(after.body.points).toEqual([]);
  });

  test('se puede reactivar un punto desactivado', async () => {
    await api.post(`/api/admin/points/${pointId}/deactivate`).set(auth(admin.token));
    await api.post(`/api/admin/points/${pointId}/activate`).set(auth(admin.token));
    const list = await api.get('/api/points');
    expect(list.body.points).toHaveLength(1);
  });

  test('desactivar una publicación deja de mostrarla a los recolectores', async () => {
    const col = await registerAndLogin(api, { email: 'col@correo.com', role: 'collector' });
    const res = await api.post(`/api/admin/posts/${postId}/deactivate`).set(auth(admin.token));
    expect(res.status).toBe(200);
    const list = await api.get('/api/posts/available').set(auth(col.token));
    expect(list.body.posts).toEqual([]);
  });

  test('deniega el acceso a quien no es administrador', async () => {
    const overview = await api.get('/api/admin/overview').set(auth(gen.token));
    const deactivate = await api.post(`/api/admin/points/${pointId}/deactivate`).set(auth(pointAdmin.token));
    expect(overview.status).toBe(403);
    expect(deactivate.status).toBe(403);
  });

  test('responde 404 si el punto o la publicación no existen', async () => {
    const point = await api.post('/api/admin/points/9999/deactivate').set(auth(admin.token));
    const post = await api.post('/api/admin/posts/9999/deactivate').set(auth(admin.token));
    expect(point.status).toBe(404);
    expect(post.status).toBe(404);
  });

  test('ensureAdmin crea el administrador una sola vez', async () => {
    const created = await ensureAdmin(pool, { email: 'root@plataforma.com', password: 'OtraClave123' });
    const again = await ensureAdmin(pool, { email: 'root@plataforma.com', password: 'OtraClave123' });
    expect(created).toBe(true);
    expect(again).toBe(false);
    const login = await api.post('/api/auth/login').send({ email: 'root@plataforma.com', password: 'OtraClave123' });
    expect(login.body.user.role).toBe('admin');
  });
});
