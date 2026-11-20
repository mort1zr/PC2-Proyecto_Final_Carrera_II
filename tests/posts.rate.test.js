const { buildTestApp, registerAndLogin } = require('./helpers');

describe('POST /api/posts/:id/rate', () => {
  let api;
  let gen;
  let col;
  let postId;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  async function newCompletedPost() {
    const created = await api.post('/api/posts').set(auth(gen.token)).send({
      material: 'metal',
      quantity: '2 kg',
      address: 'Av. Calificación 9',
      pickup_time: 'Noches',
    });
    await api.post(`/api/posts/${created.body.id}/accept`).set(auth(col.token));
    await api.post(`/api/posts/${created.body.id}/complete`).set(auth(col.token));
    return created.body.id;
  }

  beforeEach(async () => {
    ({ request: api } = await buildTestApp());
    gen = await registerAndLogin(api, { email: 'gen@correo.com', role: 'generator' });
    col = await registerAndLogin(api, { email: 'col@correo.com', role: 'collector' });
    postId = await newCompletedPost();
  });

  test('guarda la calificación y actualiza el promedio del recolector', async () => {
    const res = await api.post(`/api/posts/${postId}/rate`).set(auth(gen.token)).send({ stars: 5 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ stars: 5, collector_average: 5, collector_ratings: 1 });

    const second = await newCompletedPost();
    const res2 = await api.post(`/api/posts/${second}/rate`).set(auth(gen.token)).send({ stars: 4 });
    expect(res2.body.collector_average).toBe(4.5);
    expect(res2.body.collector_ratings).toBe(2);
  });

  test('no permite calificar dos veces la misma recolección', async () => {
    await api.post(`/api/posts/${postId}/rate`).set(auth(gen.token)).send({ stars: 5 });
    const again = await api.post(`/api/posts/${postId}/rate`).set(auth(gen.token)).send({ stars: 1 });
    expect(again.status).toBe(409);
  });

  test('rechaza calificaciones fuera del rango de 1 a 5', async () => {
    const low = await api.post(`/api/posts/${postId}/rate`).set(auth(gen.token)).send({ stars: 0 });
    const high = await api.post(`/api/posts/${postId}/rate`).set(auth(gen.token)).send({ stars: 6 });
    expect(low.status).toBe(400);
    expect(high.status).toBe(400);
  });

  test('solo se califica una recolección completada', async () => {
    const created = await api.post('/api/posts').set(auth(gen.token)).send({
      material: 'papel',
      quantity: '1 caja',
      address: 'Av. Pendiente 1',
      pickup_time: 'Lunes',
    });
    const res = await api.post(`/api/posts/${created.body.id}/rate`).set(auth(gen.token)).send({ stars: 3 });
    expect(res.status).toBe(409);
  });

  test('solo el autor de la publicación puede calificar', async () => {
    const other = await registerAndLogin(api, { email: 'otro@correo.com', role: 'generator' });
    const res = await api.post(`/api/posts/${postId}/rate`).set(auth(other.token)).send({ stars: 5 });
    expect(res.status).toBe(403);
  });

  test('"Mis publicaciones" indica la calificación ya enviada', async () => {
    await api.post(`/api/posts/${postId}/rate`).set(auth(gen.token)).send({ stars: 4 });
    const mine = await api.get('/api/posts/mine').set(auth(gen.token));
    expect(mine.body.posts[0].my_rating).toBe(4);
  });
});
