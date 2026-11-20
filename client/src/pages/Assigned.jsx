import { useEffect, useState } from 'react';
import { api, MATERIAL_LABELS } from '../api.js';

export default function Assigned() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => api('/posts/assigned').then((d) => setPosts(d.posts)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const complete = async (id) => {
    setError('');
    setMessage('');
    try {
      await api(`/posts/${id}/complete`, { method: 'POST' });
      setMessage('Recolección confirmada');
    } catch (err) {
      setError(err.message);
    }
    load();
  };

  return (
    <section>
      <h1>Mis recolecciones</h1>
      {message && <p className="alert ok" role="status">{message}</p>}
      {error && <p className="alert error" role="alert">{error}</p>}
      {posts.length === 0 && <p className="card muted">Aún no aceptaste ninguna publicación.</p>}
      <div className="list">
        {posts.map((p) => (
          <article key={p.id} className="card point">
            <div className="row">
              <h2>{MATERIAL_LABELS[p.material]} · {p.quantity}</h2>
              <span className="badge">{p.status}</span>
            </div>
            <p>{p.address}{p.zone ? ` (${p.zone})` : ''}</p>
            <p className="muted">Contacto: {p.generator_name}{p.generator_phone ? ` · ${p.generator_phone}` : ''} · Recojo: {p.pickup_time}</p>
            {p.status === 'Aceptada' && (
              <button className="primary" onClick={() => complete(p.id)}>Confirmar retiro</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
