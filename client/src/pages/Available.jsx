import { useEffect, useState } from 'react';
import { api, MATERIAL_LABELS } from '../api.js';

export default function Available() {
  const [posts, setPosts] = useState(null);
  const [material, setMaterial] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () =>
    api(`/posts/available${material ? `?material=${material}` : ''}`)
      .then((d) => setPosts(d.posts))
      .catch((e) => setError(e.message));
  useEffect(() => { load(); }, [material]); // eslint-disable-line react-hooks/exhaustive-deps

  const accept = async (id) => {
    setError('');
    setMessage('');
    try {
      await api(`/posts/${id}/accept`, { method: 'POST' });
      setMessage('Publicación aceptada: la encontrarás en "Mis recolecciones"');
    } catch (err) {
      setError(err.message);
    }
    load();
  };

  return (
    <section>
      <h1>Residuos disponibles</h1>
      <div className="toolbar">
        <label>
          Tipo de material
          <select value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(MATERIAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <button className="secondary" onClick={load}>Actualizar</button>
      </div>
      {message && <p className="alert ok" role="status">{message}</p>}
      {error && <p className="alert error" role="alert">{error}</p>}
      {posts && posts.length === 0 && <p className="card muted">No hay residuos disponibles por ahora.</p>}
      <div className="list">
        {posts?.map((p) => (
          <article key={p.id} className="card point">
            <div className="row">
              <h2>{MATERIAL_LABELS[p.material]} · {p.quantity}</h2>
              <span className="badge">{p.zone || 'Zona no indicada'}</span>
            </div>
            <p>{p.address}</p>
            <p className="muted">Horario de recojo: {p.pickup_time}</p>
            <button className="primary" onClick={() => accept(p.id)}>Aceptar recolección</button>
          </article>
        ))}
      </div>
    </section>
  );
}
