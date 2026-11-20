const TOKEN_KEY = 'reciclaje_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

/** Llama a la API; lanza un Error con el mensaje del servidor si la respuesta no es correcta. */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.details?.map((d) => d.message).join('. ');
    const error = new Error(detail || data.error || 'Error inesperado');
    error.status = res.status;
    throw error;
  }
  return data;
}

export const ROLE_LABELS = {
  generator: 'Generador de residuos',
  collector: 'Recolector',
  point_admin: 'Administrador de punto de acopio',
};

export const MATERIAL_LABELS = {
  papel: 'Papel',
  carton: 'Cartón',
  plastico: 'Plástico',
  vidrio: 'Vidrio',
  metal: 'Metal',
  electronicos: 'Electrónicos',
};

export const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
