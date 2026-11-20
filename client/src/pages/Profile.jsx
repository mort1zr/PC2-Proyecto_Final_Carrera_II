import { useState } from 'react';
import { api, ROLE_LABELS } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', zone: user.zone || '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const data = await api('/users/me', { method: 'PUT', body: form });
      setUser(data.user);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  };
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form className="card narrow" onSubmit={onSubmit}>
      <h1>Mi perfil</h1>
      <p className="muted">{user.email} · {ROLE_LABELS[user.role]}</p>
      {message && <p className="alert ok" role="status">{message}</p>}
      {error && <p className="alert error" role="alert">{error}</p>}
      <label>Nombre<input value={form.name} onChange={set('name')} /></label>
      <label>Teléfono<input value={form.phone} onChange={set('phone')} placeholder="+51 999 999 999" /></label>
      <label>Zona de residencia<input value={form.zone} onChange={set('zone')} placeholder="Distrito o barrio" /></label>
      <button className="primary">Guardar cambios</button>
    </form>
  );
}
