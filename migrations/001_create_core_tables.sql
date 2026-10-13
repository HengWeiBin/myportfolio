-- Migration 001: Create Core Tables

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  github TEXT,
  linkedin TEXT,
  instagram TEXT,
  facebook TEXT,
  resume_link TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  date_start TEXT,
  date_end TEXT,
  image_url TEXT,
  image_base64 TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  issuer TEXT,
  date TEXT,
  image_url TEXT,
  image_base64 TEXT,
  credential_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS experience (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  date_range TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[]
);
