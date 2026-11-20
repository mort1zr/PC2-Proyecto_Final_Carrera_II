const { buildTestApp, registerAndLogin } = require('./helpers');

// Lunes 2026-11-16 a las 10:00 hora de Lima (UTC-5) = 15:00 UTC
const MONDAY_10AM_LIMA = new Date('2026-11-16T15:00:00Z');
// Lunes 2026-11-16 a las 20:00 hora de Lima = 01:00 UTC del martes
const MONDAY_8PM_LIMA = new Date('2026-11-17T01:00:00Z');

async function seed(api) {
  const admin = await registerAndLogin(api, { email: 'admin@acopio.com', role: 'point_admin' });
  const auth = { Authorization: `Bearer ${admin.token}` };
  const created = await api
    .post('/api/points')
    .set(auth)
    .send({ name: 'Eco Punto Centro', address: 'Av. Principal 123', lat: -12.04, lng: -77.04 });
  await api
    .put(`/api/points/${created.body.id}/details`)
    .set(auth)
    .send({
      materials: ['vidrio', 'papel'],
      hours: [{ day: 1, open: '08:00', close: '17:00' }],
    });
  return created.body.id;
}

describe('GET /api/points', () => {
  test('lista nombre, dirección, materiales y horario de cada punto', async () => {
    const { request: api } = await buildTestApp({ clock: () => MONDAY_10AM_LIMA });
    await seed(api);
    const res = await api.get('/api/points');
    expect(res.status).toBe(200);
    expect(res.body.points).toHaveLength(1);
    expect(res.body.points[0]).toMatchObject({
      name: 'Eco Punto Centro',
      address: 'Av. Principal 123',
      hours: [{ day: 1, open: '08:00', close: '17:00' }],
    });
    expect(res.body.points[0].materials.sort()).toEqual(['papel', 'vidrio']);
  });

  test('indica que el punto está abierto dentro del horario', async () => {
    const { request: api } = await buildTestApp({ clock: () => MONDAY_10AM_LIMA });
    await seed(api);
    const res = await api.get('/api/points');
    expect(res.body.points[0].open_now).toBe(true);
  });

  test('indica que el punto está cerrado fuera del horario', async () => {
    const { request: api } = await buildTestApp({ clock: () => MONDAY_8PM_LIMA });
    await seed(api);
    const res = await api.get('/api/points');
    expect(res.body.points[0].open_now).toBe(false);
  });

  test('devuelve una lista vacía si no hay puntos', async () => {
    const { request: api } = await buildTestApp();
    const res = await api.get('/api/points');
    expect(res.status).toBe(200);
    expect(res.body.points).toEqual([]);
  });
});
