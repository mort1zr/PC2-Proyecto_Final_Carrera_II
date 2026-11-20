const { buildTestApp, registerAndLogin } = require('./helpers');

describe('POST /api/auth/logout', () => {
  let api;
  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
  });

  test('invalida la sesión y el token deja de funcionar', async () => {
    const { token } = await registerAndLogin(api, { email: 'ana@correo.com' });
    const before = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);

    const out = await api.post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(out.status).toBe(200);

    const after = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  test('exige autenticación para cerrar sesión', async () => {
    const res = await api.post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  test('cerrar una sesión no afecta a otra sesión del mismo usuario', async () => {
    const first = await registerAndLogin(api, { email: 'ana@correo.com' });
    const second = await api.post('/api/auth/login').send({ email: 'ana@correo.com', password: 'Clave12345' });
    await api.post('/api/auth/logout').set('Authorization', `Bearer ${first.token}`);
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${second.body.token}`);
    expect(res.status).toBe(200);
  });
});
