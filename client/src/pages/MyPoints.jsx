import { useEffect, useState } from 'react';
import { api, DAY_LABELS, MATERIAL_LABELS } from '../api.js';

function PointDetailsForm({ point }) {
  const [materials, setMaterials] = useState([]);
  const [hours, setHours] = useState(
    DAY_LABELS.map((_, day) => ({ day, enabled: day >= 1 && day <= 5, open: '08:00', close: '17:00' }))
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const toggleMaterial = (m) =>
    setMaterials((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]));
  const setHour = (day, patch) => setHours((cur) => cur.map((h) => (h.day === day ? { ...h, ...patch } : h)));

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await api(`/points/${point.id}/details`, {
        method: 'PUT',
        body: {
          materials,
          hours: hours.filter((h) => h.enabled).map(({ day, open, close }) => ({ day, open, close })),
        },
      });
      setMessage('Materiales y horarios guardados');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="list">
      {message && <p className="alert ok" role="status">{message}</p>}
      {error && <p className="alert error" role="alert">{error}</p>}
      <fieldset>
        <legend>Materiales que recibe</legend>
        <div className="checks">
          {Object.entries(MATERIAL_LABELS).map(([value, label]) => (
            <label key={value}>
              <input type="checkbox" checked={materials.includes(value)} onChange={() => toggleMaterial(value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Horario de atención</legend>
        {hours.map((h) => (
          <div key={h.day} className="row">
            <label className="checks">
              <input type="checkbox" checked={h.enabled} onChange={(e) => setHour(h.day, { enabled: e.target.checked })} />
              <span style={{ width: 90 }}>{DAY_LABELS[h.day]}</span>
            </label>
            <input type="time" value={h.open} disabled={!h.enabled} onChange={(e) => setHour(h.day, { open: e.target.value })} />
            <span>a</span>
            <input type="time" value={h.close} disabled={!h.enabled} onChange={(e) => setHour(h.day, { close: e.target.value })} />
          </div>
        ))}
      </fieldset>
      <button className="primary">Guardar materiales y horarios</button>
    </form>
  );
}

export default function MyPoints() {
  const [points, setPoints] = useState([]);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '' });
  const [error, setError] = useState('');

  const load = () => api('/points/mine').then((d) => setPoints(d.points)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const created = await api('/points', { method: 'POST', body: form });
      setForm({ name: '', address: '', lat: '', lng: '' });
      await load();
      setOpen(created.id);
    } catch (err) {
      setError(err.message);
    }
  };
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <section>
      <h1>Mis puntos de acopio</h1>
      <form className="card list" onSubmit={onSubmit}>
        <h2>Registrar un punto</h2>
        {error && <p className="alert error" role="alert">{error}</p>}
        <label>Nombre<input required value={form.name} onChange={set('name')} /></label>
        <label>Dirección<input required value={form.address} onChange={set('address')} /></label>
        <div className="row">
          <label>Latitud<input required type="number" step="any" value={form.lat} onChange={set('lat')} placeholder="-12.0464" /></label>
          <label>Longitud<input required type="number" step="any" value={form.lng} onChange={set('lng')} placeholder="-77.0428" /></label>
        </div>
        <button className="primary">Registrar punto</button>
      </form>
      <div className="list" style={{ marginTop: '1rem' }}>
        {points.length === 0 && <p className="muted">Todavía no registraste puntos.</p>}
        {points.map((p) => (
          <article key={p.id} className="card point">
            <div className="row">
              <h2>{p.name}</h2>
              <button className="secondary" onClick={() => setOpen(open === p.id ? null : p.id)}>
                {open === p.id ? 'Cerrar' : 'Materiales y horarios'}
              </button>
            </div>
            <p className="muted">{p.address}</p>
            {open === p.id && <PointDetailsForm point={p} />}
          </article>
        ))}
      </div>
    </section>
  );
}
