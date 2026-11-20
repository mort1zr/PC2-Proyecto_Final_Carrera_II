const { buildTestApp, registerAndLogin } = require('./helpers');

describe('Perfil de usuario', () => {
  let api;
  let token;
  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    ({ token } = await registerAndLogin(api, { email: 'ana@correo.com' }));
  });

  test('actualiza nombre, teléfono y zona y confirma el cambio', async () => {
    const res = await api
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana Gómez', phone: '+51 999 888 777', zone: 'Miraflores' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Perfil actualizado');
    expect(res.body.user).toMatchObject({ name: 'Ana Gómez', phone: '+51 999 888 777', zone: 'Miraflores' });

    const me = await api.get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.user.zone).toBe('Miraflores');
  });

  test('rechaza el nombre vacío', async () => {
    const res = await api.put('/api/users/me').set('Authorization', `Bearer ${token}`).send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('name');
  });

  test('rechaza un teléfono inválido', async () => {
    const res = await api
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana', phone: 'abc' });
    expect(res.status).toBe(400);
  });

  test('exige autenticación', async () => {
    const res = await api.put('/api/users/me').send({ name: 'Ana' });
    expect(res.status).toBe(401);
  });

  test('no permite cambiar el rol ni el correo mediante el perfil', async () => {
    await api
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana', role: 'point_admin', email: 'otro@correo.com' });
    const me = await api.get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.body.user.role).toBe('generator');
    expect(me.body.user.email).toBe('ana@correo.com');
  });
});
