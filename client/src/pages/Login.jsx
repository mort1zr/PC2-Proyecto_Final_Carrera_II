import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card narrow" onSubmit={onSubmit}>
      <h1>Iniciar sesión</h1>
      {error && <p className="alert error" role="alert">{error}</p>}
      <label>
        Correo electrónico
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label>
        Contraseña
        <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </label>
      <button className="primary" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
      <p className="muted">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    </form>
  );
}
