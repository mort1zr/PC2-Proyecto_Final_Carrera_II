# Recicla Conecta

Plataforma web que conecta a personas que generan residuos reciclables con **puntos de acopio** y **recolectores**, para que menos material termine en la basura común.

Proyecto Final de Carrera III · Práctica Calificada 2 · Caso "Recolectores y reciclaje".

## Roles

| Rol | Qué hace |
|---|---|
| Generador de residuos | Consulta puntos de acopio (lista, mapa, filtro), publica residuos, sigue su estado, califica al recolector y ve su historial |
| Recolector | Ve residuos disponibles, acepta y confirma recolecciones |
| Administrador de punto de acopio | Registra puntos, materiales y horarios |
| Administrador de la plataforma | Modera publicaciones y puntos |

## Arquitectura lógica

```
Navegador (React + Vite + Leaflet)
        │  HTTPS / JSON (JWT Bearer)
        ▼
API REST (Node.js + Express)      ── helmet · CORS · rate limit · validación zod
  ├─ /api/auth           registro, login, logout (sesión en BD)
  ├─ /api/users          perfil
  ├─ /api/points         puntos de acopio, materiales, horarios
  ├─ /api/posts          publicación → aceptación → recolección → calificación
  ├─ /api/notifications  avisos de cambio de estado
  └─ /api/admin          moderación
        │  SQL parametrizado (pg)
        ▼
PostgreSQL (Supabase)
```

Servicios externos: OpenStreetMap (mosaicos del mapa) y Supabase (base de datos).

## Ejecutar en local

```bash
cp .env.example .env        # completar DATABASE_URL y JWT_SECRET
npm install
npm --prefix client install
npm run dev                 # API en :3000
npm --prefix client run dev # cliente en :5173 (proxy a la API)
npm test                    # pruebas con cobertura (PostgreSQL en memoria)
```

Variables de entorno: `DATABASE_URL`, `JWT_SECRET`, opcionalmente `ADMIN_EMAIL` y `ADMIN_PASSWORD` para crear el administrador de plataforma al iniciar.

## Flujo de ramas y CI/CD

- `main`: producción. Solo recibe Pull Requests.
- `test`: integración y pruebas.
- Cada commit lleva el título de la historia de usuario de Jira que implementa.

El workflow `.github/workflows/ci.yml` ejecuta build y pruebas, análisis de dependencias (`npm audit`), escaneo de secretos (gitleaks) y despliegue en Vercel desde `main`. `codeql.yml` ejecuta el análisis estático (SAST).
