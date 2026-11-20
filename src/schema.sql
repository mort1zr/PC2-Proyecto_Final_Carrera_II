CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  zone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_points (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS point_materials (
  point_id INTEGER NOT NULL REFERENCES collection_points(id),
  material TEXT NOT NULL,
  PRIMARY KEY (point_id, material)
);

CREATE TABLE IF NOT EXISTS point_hours (
  id SERIAL PRIMARY KEY,
  point_id INTEGER NOT NULL REFERENCES collection_points(id),
  day INTEGER NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  generator_id INTEGER NOT NULL REFERENCES users(id),
  material TEXT NOT NULL,
  quantity TEXT NOT NULL,
  address TEXT NOT NULL,
  zone TEXT,
  pickup_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Disponible',
  collector_id INTEGER REFERENCES users(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL UNIQUE REFERENCES posts(id),
  rater_id INTEGER NOT NULL REFERENCES users(id),
  collector_id INTEGER NOT NULL REFERENCES users(id),
  stars INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
