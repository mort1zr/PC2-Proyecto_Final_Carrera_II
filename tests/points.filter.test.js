const { buildTestApp, registerAndLogin } = require('./helpers');

async function createPoint(api, token, name, materials) {
  const auth = { Authorization: `Bearer ${token}` };
  const created = await api
    .post('/api/points')
    .set(auth)
    .send({ name, address: `${name}, Lima 123`, lat: -12.04, lng: -77.04 });
  await api
    .put(`/api/points/${created.body.id}/details`)
    .set(auth)
    .send({ materials, hours: [{ day: 1, open: '08:00', close: '17:00' }] });
}

describe('GET /api/points?material=', () => {
  let api;
  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    const admin = await registerAndLogin(api, { email: 'admin@acopio.com', role: 'point_admin' });
    await createPoint(api, admin.token, 'Punto Vidrio', ['vidrio', 'metal']);
    await createPoint(api, admin.token, 'Punto Papel', ['papel']);
  });

  test('devuelve solo los puntos que reciben el material elegido', async () => {
    const res = await api.get('/api/points').query({ material: 'vidrio' });
    expect(res.status).toBe(200);
    expect(res.body.points.map((p) => p.name)).toEqual(['Punto Vidrio']);
  });

  test('devuelve lista vacía si ningún punto recibe el material', async () => {
    const res = await api.get('/api/points').query({ material: 'electronicos' });
    expect(res.status).toBe(200);
    expect(res.body.points).toEqual([]);
  });

  test('sin filtro vuelve a mostrar todos los puntos', async () => {
    const res = await api.get('/api/points');
    expect(res.body.points).toHaveLength(2);
  });

  test('rechaza un material fuera del catálogo', async () => {
    const res = await api.get('/api/points').query({ material: 'madera' });
    expect(res.status).toBe(400);
  });
});
