import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');

  const load = () =>
    api('/notifications')
      .then((d) => { setItems(d.notifications); setUnread(d.unread); })
      .catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const open = async (n) => {
    if (n.is_read) return;
    await api(`/notifications/${n.id}/read`, { method: 'POST' });
    load();
    window.dispatchEvent(new Event('notifications-changed'));
  };

  return (
    <section>
      <h1>Notificaciones {unread > 0 && <span className="badge">{unread} sin leer</span>}</h1>
      {error && <p className="alert error" role="alert">{error}</p>}
      {items.length === 0 && <p className="card muted">No tienes notificaciones.</p>}
      <div className="list">
        {items.map((n) => (
          <button key={n.id} className="card point" style={{ textAlign: 'left', fontWeight: n.is_read ? 400 : 700 }} onClick={() => open(n)}>
            {n.message}
            <br />
            <small className="muted">{new Date(n.created_at).toLocaleString('es-PE')}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
