import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Admin() {
  const [data, setData] = useState({ points: [], posts: [] });
  const [error, setError] = useState('');

  const load = () => api('/admin/overview').then(setData).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const act = async (path) => {
    setError('');
    try {
      await api(path, { method: 'POST' });
    } catch (err) {
      setError(err.message);
    }
    load();
  };

  return (
    <section>
      <h1>Moderación</h1>
      {error && <p className="alert error" role="alert">{error}</p>}
      <h2>Puntos de acopio</h2>
      <div className="list">
        {data.points.map((p) => (
          <article key={p.id} className="card point">
            <div className="row">
              <h2>{p.name}</h2>
              <span className={`badge ${p.active ? 'open' : 'closed'}`}>{p.active ? 'Activo' : 'Desactivado'}</span>
              <button className="secondary" onClick={() => act(`/admin/points/${p.id}/${p.active ? 'deactivate' : 'activate'}`)}>
                {p.active ? 'Desactivar' : 'Reactivar'}
              </button>
            </div>
            <p className="muted">{p.address}</p>
          </article>
        ))}
      </div>
      <h2>Publicaciones</h2>
      <div className="list">
        {data.posts.map((p) => (
          <article key={p.id} className="card point">
            <div className="row">
              <h2>{p.material} · {p.quantity}</h2>
              <span className="badge">{p.status}</span>
              {['Disponible', 'Aceptada'].includes(p.status) && (
                <button className="secondary" onClick={() => act(`/admin/posts/${p.id}/deactivate`)}>Desactivar</button>
              )}
            </div>
            <p className="muted">{p.address}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
