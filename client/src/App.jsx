import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { ROLE_LABELS } from './api.js';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Home from './pages/Home.jsx';
import Points from './pages/Points.jsx';
import MyPoints from './pages/MyPoints.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted center">Cargando…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        ♻ Recicla Conecta
      </Link>
      <nav>
        {user && (
          <>
            <NavLink to="/">Inicio</NavLink>
            <NavLink to="/puntos">Puntos de acopio</NavLink>
            <NavLink to="/perfil">Mi perfil</NavLink>
            <span className="chip">{ROLE_LABELS[user.role]}</span>
            <button className="link" onClick={onLogout}>
              Cerrar sesión
            </button>
          </>
        )}
        {!user && (
          <>
            <NavLink to="/login">Iniciar sesión</NavLink>
            <NavLink to="/registro">Registrarme</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/" element={<Protected><Home /></Protected>} />
          <Route path="/puntos" element={<Protected><Points /></Protected>} />
          <Route path="/mis-puntos" element={<Protected><MyPoints /></Protected>} />
          <Route path="/perfil" element={<Protected><Profile /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
