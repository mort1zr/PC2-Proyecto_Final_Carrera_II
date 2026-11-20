import { useEffect, useState } from 'react';
import { api, MATERIAL_LABELS } from '../api.js';

export default function History() {
  const [data, setData] = useState(null);
  const [material, setMaterial] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/posts/history${material ? `?material=${material}` : ''}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [material]);

  return (
    <section>
      <h1>Historial de entregas</h1>
      <div className="toolbar">
        <label>
          Material
          <select value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(MATERIAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        {data && <p><strong>{data.total}</strong> entrega(s) {material ? `de ${MATERIAL_LABELS[material]}` : 'en total'}</p>}
      </div>
      {error && <p className="alert error" role="alert">{error}</p>}
      {data && data.history.length === 0 && <p className="card muted">Aún no tienes entregas registradas.</p>}
      <div className="list">
        {data?.history.map((h) => (
          <article key={h.id} className="card point">
            <h2>{MATERIAL_LABELS[h.material]} · {h.quantity}</h2>
            <p className="muted">Entregado el {new Date(h.completed_at).toLocaleDateString('es-PE')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
