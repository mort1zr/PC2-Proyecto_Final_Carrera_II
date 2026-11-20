import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { api, MATERIAL_LABELS } from '../api.js';
import { formatHours } from './Points.jsx';

L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// Zona por defecto cuando no hay permiso de ubicación: Lima
const DEFAULT_CENTER = [-12.0464, -77.0428];

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 13); }, [center, map]);
  return null;
}

export default function MapView() {
  const [points, setPoints] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/points').then((d) => setPoints(d.points)).catch((e) => setError(e.message));
    // Si el usuario concede la ubicación, se centra el mapa en su posición
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  return (
    <section>
      <h1>Mapa de puntos de acopio</h1>
      {error && <p className="alert error" role="alert">{error}</p>}
      <MapContainer center={center} zoom={13} className="map" scrollWheelZoom>
        <Recenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]}>
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {p.address}
              <br />
              {p.materials.map((m) => MATERIAL_LABELS[m]).join(', ') || 'Sin materiales definidos'}
              <br />
              <small>{formatHours(p.hours)}</small>
              <br />
              <span className={`badge ${p.open_now ? 'open' : 'closed'}`}>{p.open_now ? 'Abierto ahora' : 'Cerrado'}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="muted">{points.length} punto(s) de acopio en el mapa.</p>
    </section>
  );
}
