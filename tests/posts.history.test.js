const { buildTestApp, registerAndLogin } = require('./helpers');

describe('GET /api/posts/history', () => {
  let api;
  let gen;
  let col;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  async function deliver(material, quantity) {
    const created = await api.post('/api/posts').set(auth(gen.token)).send({
      material,
      quantity,
      address: 'Av. Historial 1',
      pickup_time: 'Mañanas',
    });
    await api.post(`/api/posts/${created.body.id}/accept`).set(auth(col.token));
    await api.post(`/api/posts/${created.body.id}/complete`).set(auth(col.token));
  }

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
    col = await registerAndLogin(api, { email: 'col@correo.com', role: 'collector' });
  });

  test('muestra fecha, material y cantidad de cada recolección completada', async () => {
    await deliver('vidrio', '3 botellas');
    const res = await api.get('/api/posts/history').set(auth(gen.token));
    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(1);
    expect(res.body.history[0]).toMatchObject({ material: 'vidrio', quantity: '3 botellas' });
    expect(res.body.history[0].completed_at).toBeTruthy();
  });

  test('no incluye publicaciones que no se completaron', async () => {
    await api.post('/api/posts').set(auth(gen.token)).send({
      material: 'papel',
      quantity: '1 caja',
      address: 'Av. Historial 2',
      pickup_time: 'Tardes',
    });
    const res = await api.get('/api/posts/history').set(auth(gen.token));
    expect(res.body.history).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('acumula el total por material al filtrar', async () => {
    await deliver('vidrio', '2 botellas');
    await deliver('vidrio', '5 botellas');
    await deliver('metal', '1 lata');
    const res = await api.get('/api/posts/history').query({ material: 'vidrio' }).set(auth(gen.token));
    expect(res.body.total).toBe(2);
    expect(res.body.totals_by_material).toEqual({ vidrio: 2, metal: 1 });
  });

  test('cada generador ve solo su propio historial', async () => {
    await deliver('vidrio', '2 botellas');
    const other = await registerAndLogin(api, { email: 'otro@correo.com', role: 'generator' });
    const res = await api.get('/api/posts/history').set(auth(other.token));
    expect(res.body.history).toEqual([]);
  });

  test('rechaza un material fuera del catálogo', async () => {
    const res = await api.get('/api/posts/history').query({ material: 'madera' }).set(auth(gen.token));
    expect(res.status).toBe(400);
  });
});
