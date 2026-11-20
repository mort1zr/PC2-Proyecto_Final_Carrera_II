const { buildTestApp, registerAndLogin } = require('./helpers');

describe('Registro de puntos de acopio', () => {
  let api;
  let admin;
  const point = { name: 'Eco Punto Centro', address: 'Av. Principal 123, Lima', lat: -12.0464, lng: -77.0428 };

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    admin = await registerAndLogin(api, { email: 'admin@acopio.com', role: 'point_admin' });
  });

  test('un administrador de punto crea el punto y aparece en su listado', async () => {
    const res = await api.post('/api/points').set('Authorization', `Bearer ${admin.token}`).send(point);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Eco Punto Centro', active: true });

    const mine = await api.get('/api/points/mine').set('Authorization', `Bearer ${admin.token}`);
    expect(mine.body.points).toHaveLength(1);
    expect(mine.body.points[0].name).toBe('Eco Punto Centro');
  });

  test('rechaza el registro si faltan datos obligatorios', async () => {
    const res = await api
      .post('/api/points')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Sin dirección', lat: -12, lng: -77 });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toContain('address');
  });

  test('rechaza coordenadas fuera de rango', async () => {
    const res = await api
      .post('/api/points')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ ...point, lat: 123 });
    expect(res.status).toBe(400);
  });

  test('deniega el acceso a usuarios sin el rol de administrador de punto', async () => {
    const generator = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
    const res = await api.post('/api/points').set('Authorization', `Bearer ${generator.token}`).send(point);
    expect(res.status).toBe(403);
  });

  test('exige autenticación', async () => {
    const res = await api.post('/api/points').send(point);
    expect(res.status).toBe(401);
  });
});
