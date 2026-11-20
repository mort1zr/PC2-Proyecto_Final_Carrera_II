import { useEffect, useState } from 'react';
import { api, MATERIAL_LABELS } from '../api.js';

const EMPTY = { material: 'plastico', quantity: '', address: '', zone: '', pickup_time: '' };

export default function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => api('/posts/mine').then((d) => setPosts(d.posts)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/posts', { method: 'POST', body: form });
      setForm(EMPTY);
      setMessage('Publicación creada: los recolectores ya pueden verla');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const cancel = async (id) => {
    setError('');
    setMessage('');
    try {
      await api(`/posts/${id}/cancel`, { method: 'POST' });
      setMessage('Publicación cancelada');
    } catch (err) {
      setError(err.message);
    }
    load();
  };

  return (
    <section>
      <h1>Mis publicaciones</h1>
      <form className="card list" onSubmit={onSubmit}>
        <h2>Publicar residuos disponibles</h2>
        {message && <p className="alert ok" role="status">{message}</p>}
        {error && <p className="alert error" role="alert">{error}</p>}
        <div className="row">
          <label>
            Material
            <select value={form.material} onChange={set('material')}>
              {Object.entries(MATERIAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label>Cantidad aproximada<input required value={form.quantity} onChange={set('quantity')} placeholder="Ej.: 3 bolsas grandes" /></label>
        </div>
        <label>Dirección de recojo<input required value={form.address} onChange={set('address')} /></label>
        <div className="row">
          <label>Zona / distrito<input value={form.zone} onChange={set('zone')} /></label>
          <label>Horario de recojo<input required value={form.pickup_time} onChange={set('pickup_time')} placeholder="Ej.: Sábados 9:00–12:00" /></label>
        </div>
        <button className="primary">Publicar</button>
      </form>
      <div className="list" style={{ marginTop: '1rem' }}>
        {posts.length === 0 && <p className="muted">Todavía no tienes publicaciones.</p>}
        {posts.map((p) => (
          <article key={p.id} className="card point">
            <div className="row">
              <h2>{MATERIAL_LABELS[p.material]} · {p.quantity}</h2>
              <span className="badge">{p.status}</span>
            </div>
            <p>{p.address}{p.zone ? ` (${p.zone})` : ''}</p>
            <p className="muted">Recojo: {p.pickup_time}</p>
            {p.collector_name && <p>Recolector asignado: <strong>{p.collector_name}</strong></p>}
            {p.status === 'Disponible' && (
              <button className="secondary" onClick={() => cancel(p.id)}>Cancelar publicación</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
