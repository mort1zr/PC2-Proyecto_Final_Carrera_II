import { useEffect, useState } from 'react';
import { api, DAY_LABELS, MATERIAL_LABELS } from '../api.js';

export function formatHours(hours) {
  if (!hours.length) return 'Horario no definido';
  return hours.map((h) => `${DAY_LABELS[h.day].slice(0, 3)} ${h.open}–${h.close}`).join(' · ');
}

export default function Points() {
  const [points, setPoints] = useState(null);
  const [material, setMaterial] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setPoints(null);
    api(`/points${material ? `?material=${material}` : ''}`)
      .then((data) => setPoints(data.points))
      .catch((err) => setError(err.message));
  }, [material]);

  return (
    <section>
      <h1>Puntos de acopio</h1>
      <div className="toolbar">
        <label>
          Filtrar por material
          <select value={material} onChange={(e) => setMaterial(e.target.value)}>
            <option value="">Todos los materiales</option>
            {Object.entries(MATERIAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        {material && (
          <button className="secondary" onClick={() => setMaterial('')}>Quitar filtro</button>
        )}
      </div>
      {error && <p className="alert error" role="alert">{error}</p>}
      {points === null && !error && <p className="muted">Cargando puntos…</p>}
      {points && points.length === 0 && (
        <p className="card muted">
          {material
            ? 'Ningún punto de acopio recibe este material por ahora.'
            : 'Aún no hay puntos de acopio registrados.'}
        </p>
      )}
      <div className="list">
        {points?.map((p) => (
          <article key={p.id} className="card point">
            <div className="row">
              <h2>{p.name}</h2>
              <span className={`badge ${p.open_now ? 'open' : 'closed'}`}>{p.open_now ? 'Abierto ahora' : 'Cerrado'}</span>
            </div>
            <p>{p.address}</p>
            <p>{p.materials.map((m) => <span key={m} className="badge">{MATERIAL_LABELS[m]}</span>)}</p>
            <p className="muted">{formatHours(p.hours)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
