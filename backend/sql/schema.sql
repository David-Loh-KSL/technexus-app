-- TechNexus schema
CREATE TABLE IF NOT EXISTS companies (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  country       TEXT DEFAULT 'Not disclosed',
  founded       TEXT DEFAULT 'Not disclosed',
  employees     TEXT DEFAULT 'Not disclosed',
  domain        TEXT NOT NULL,
  product       TEXT DEFAULT '',
  tech          TEXT DEFAULT '',
  cert          TEXT[] DEFAULT '{}',
  trl           INTEGER DEFAULT 5 CHECK (trl >= 1 AND trl <= 9),
  trl_conf      TEXT DEFAULT '',
  website       TEXT DEFAULT 'Not publicly disclosed',
  contact       TEXT DEFAULT 'Not publicly listed',
  impl          TEXT DEFAULT '',
  ai_generated  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies (domain);
CREATE INDEX IF NOT EXISTS idx_companies_trl ON companies (trl);
