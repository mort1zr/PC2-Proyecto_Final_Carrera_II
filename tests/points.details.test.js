const { buildTestApp, registerAndLogin } = require('./helpers');

describe('Materiales y horarios de un punto de acopio', () => {
  let api;
  let admin;
  let pointId;
  const hours = [
    { day: 1, open: '08:00', close: '17:00' },
    { day: 2, open: '08:00', close: '17:00' },
  ];

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    admin = await registerAndLogin(api, { email: 'admin@acopio.com', role: 'point_admin' });
    const created = await api
      .post('/api/points')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Eco Punto', address: 'Av. Principal 123', lat: -12.04, lng: -77.04 });
    pointId = created.body.id;
  });

  const put = (body, token = admin.token, id = pointId) =>
    api.put(`/api/points/${id}/details`).set('Authorization', `Bearer ${token}`).send(body);

  test('asocia materiales y horarios al punto', async () => {
    const res = await put({ materials: ['vidrio', 'papel', 'vidrio'], hours });
    expect(res.status).toBe(200);
    expect(res.body.materials.sort()).toEqual(['papel', 'vidrio']);
    expect(res.body.hours).toHaveLength(2);
  });

  test('reemplaza los datos anteriores al guardar de nuevo', async () => {
    await put({ materials: ['vidrio'], hours });
    const res = await put({ materials: ['metal'], hours: [hours[0]] });
    expect(res.body.materials).toEqual(['metal']);
    expect(res.body.hours).toHaveLength(1);
  });

  test('rechaza un horario de cierre anterior al de apertura', async () => {
    const res = await put({ materials: ['vidrio'], hours: [{ day: 1, open: '18:00', close: '09:00' }] });
    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toMatch(/posterior/);
  });

  test('exige al menos un material', async () => {
    const res = await put({ materials: [], hours });
    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toMatch(/al menos un material/);
  });

  test('rechaza materiales fuera del catálogo', async () => {
    const res = await put({ materials: ['madera'], hours });
    expect(res.status).toBe(400);
  });

  test('solo el propietario puede modificar su punto', async () => {
    const other = await registerAndLogin(api, { email: 'otro@acopio.com', role: 'point_admin' });
    const res = await put({ materials: ['vidrio'], hours }, other.token);
    expect(res.status).toBe(403);
  });

  test('responde 404 si el punto no existe', async () => {
    const res = await put({ materials: ['vidrio'], hours }, admin.token, 9999);
    expect(res.status).toBe(404);
  });
});
