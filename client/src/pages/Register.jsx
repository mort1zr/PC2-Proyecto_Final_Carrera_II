import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ROLE_LABELS } from '../api.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'generator' });
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/auth/register', { method: 'POST', body: form });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <form className="card narrow" onSubmit={onSubmit}>
      <h1>Crear cuenta</h1>
      {error && <p className="alert error" role="alert">{error}</p>}
      <label>Nombre<input required value={form.name} onChange={set('name')} /></label>
      <label>Correo electrónico<input type="email" required value={form.email} onChange={set('email')} /></label>
      <label>
        Contraseña (mínimo 8 caracteres)
        <input type="password" required minLength={8} value={form.password} onChange={set('password')} />
      </label>
      <label>
        Soy
        <select value={form.role} onChange={set('role')}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <button className="primary">Registrarme</button>
      <p className="muted">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </form>
  );
}
