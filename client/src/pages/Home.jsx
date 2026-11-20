import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

const ACTIONS = {
  generator: [
    { to: '/mis-publicaciones', title: 'Mis publicaciones', text: 'Publica tus residuos reciclables y sigue su estado.' },
    { to: '/puntos', title: 'Puntos de acopio', text: 'Encuentra dónde entregar tu reciclaje.' },
    { to: '/mapa', title: 'Mapa', text: 'Mira los puntos cercanos a ti.' },
  ],
  collector: [
    { to: '/puntos', title: 'Puntos de acopio', text: 'Consulta los puntos de entrega de la zona.' },
    { to: '/mapa', title: 'Mapa', text: 'Ubica los puntos en el mapa.' },
  ],
  point_admin: [
    { to: '/mis-puntos', title: 'Mis puntos de acopio', text: 'Registra tus puntos y define materiales y horarios.' },
    { to: '/puntos', title: 'Todos los puntos', text: 'Mira la red de puntos disponibles.' },
  ],
};

export default function Home() {
  const { user } = useAuth();
  return (
    <section>
      <h1>Hola, {user.name}</h1>
      <p className="muted">Conectamos a quienes generan residuos reciclables con puntos de acopio y recolectores.</p>
      <div className="grid">
        {(ACTIONS[user.role] || []).map((a) => (
          <Link key={a.to} to={a.to} className="card tile">
            <h2>{a.title}</h2>
            <p>{a.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
