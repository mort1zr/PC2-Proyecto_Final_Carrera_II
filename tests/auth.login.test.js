const { buildTestApp, registerAndLogin } = require('./helpers');

describe('POST /api/auth/login', () => {
  let api;
  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    await api
      .post('/api/auth/register')
      .send({ name: 'Ana Pérez', email: 'ana@correo.com', password: 'Clave12345', role: 'generator' });
  });

  test('da acceso con credenciales correctas', async () => {
    const res = await api.post('/api/auth/login').send({ email: 'ana@correo.com', password: 'Clave12345' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'ana@correo.com', role: 'generator' });
  });

  test('responde lo mismo para contraseña errónea y correo inexistente', async () => {
    const wrongPass = await api.post('/api/auth/login').send({ email: 'ana@correo.com', password: 'otra-clave' });
    const noUser = await api.post('/api/auth/login').send({ email: 'nadie@correo.com', password: 'Clave12345' });
    expect(wrongPass.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPass.body.error).toBe(noUser.body.error);
  });

  test('valida campos obligatorios', async () => {
    const res = await api.post('/api/auth/login').send({ email: 'ana@correo.com' });
    expect(res.status).toBe(400);
  });

  test('una ruta protegida redirige a iniciar sesión sin token', async () => {
    const res = await api.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('una ruta protegida responde con un token válido', async () => {
    const { token } = await registerAndLogin(api, { email: 'luis@correo.com', role: 'collector' });
    const res = await api.get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('luis@correo.com');
  });

  test('rechaza un token manipulado', async () => {
    const res = await api.get('/api/auth/me').set('Authorization', 'Bearer token.falso.aqui');
    expect(res.status).toBe(401);
  });
});
