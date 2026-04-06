-- =====================================================
-- USERS
-- type:
-- 1 = internal
-- 2 = guest
-- =====================================================
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  type SMALLINT NOT NULL DEFAULT 1,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =====================================================
-- COURTS
-- =====================================================
CREATE TABLE courts (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =====================================================
-- SHUTTLECOCKS
-- =====================================================
CREATE TABLE shuttlecocks (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =====================================================
-- SESSIONS
-- status:
-- 1 = draft
-- 2 = finalized
-- 3 = locked
-- =====================================================
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  session_date DATE NOT NULL,

  court_id BIGINT REFERENCES courts(id),

  status SMALLINT NOT NULL DEFAULT 1,
  is_scheduled BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =====================================================
-- SESSION PARTICIPANTS
-- type_snapshot:
-- 1 = internal
-- 2 = guest
-- =====================================================
CREATE TABLE session_participants (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES sessions(id),
  user_id BIGINT NOT NULL REFERENCES users(id),

  type_snapshot SMALLINT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  UNIQUE(session_id, user_id)
);

-- =====================================================
-- SESSION SHUTTLECOCK SNAPSHOT
-- =====================================================
CREATE TABLE session_shuttlecock_snapshots (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES sessions(id),

  shuttlecock_id BIGINT,
  shuttlecock_name_snapshot VARCHAR(255),

  unit_price_snapshot INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SESSION SNAPSHOT
-- cost_strategy:
-- 1 = equal_split
-- 2 = internal_only_split
-- 3 = weighted
-- =====================================================
CREATE TABLE session_snapshots (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL UNIQUE REFERENCES sessions(id),

  -- participants
  total_participants INTEGER NOT NULL,
  total_internal INTEGER NOT NULL,
  total_guest INTEGER NOT NULL,

  -- court snapshot
  court_id_snapshot BIGINT,
  court_name_snapshot VARCHAR(255),
  court_price_snapshot INTEGER NOT NULL,

  -- shuttlecock
  shuttlecock_total_amount INTEGER NOT NULL,

  -- other cost
  other_cost INTEGER NOT NULL DEFAULT 0,

  -- total
  total_cost INTEGER NOT NULL,

  -- subsidy
  subsidy_used INTEGER NOT NULL,
  subsidy_remaining_after INTEGER NOT NULL,

  -- rule
  cost_strategy SMALLINT NOT NULL,

  -- debug
  calculation_metadata JSONB,

  note TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =====================================================
-- SESSION USER SNAPSHOT
-- =====================================================
CREATE TABLE session_user_snapshots (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES sessions(id),
  user_id BIGINT NOT NULL REFERENCES users(id),

  type_snapshot SMALLINT NOT NULL,

  cost_share INTEGER NOT NULL,
  subsidy_share INTEGER NOT NULL,
  final_amount INTEGER NOT NULL,

  -- payment tracking
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  UNIQUE(session_id, user_id)
);

-- =====================================================
-- SUBSIDIES
-- =====================================================
CREATE TABLE subsidies (
  id BIGSERIAL PRIMARY KEY,
  month DATE NOT NULL UNIQUE,

  total_amount INTEGER NOT NULL DEFAULT 2000000,
  used_amount INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- =====================================================
-- SUBSIDY USAGE (OPTIONAL - ADVANCED)
-- =====================================================
CREATE TABLE subsidy_usages (
  id BIGSERIAL PRIMARY KEY,
  subsidy_id BIGINT REFERENCES subsidies(id),
  session_id BIGINT REFERENCES sessions(id),

  amount INTEGER NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_sessions_status ON sessions(status);

CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_id);

CREATE INDEX idx_session_user_snapshots_session ON session_user_snapshots(session_id);
CREATE INDEX idx_session_user_snapshots_user ON session_user_snapshots(user_id);

CREATE INDEX idx_subsidies_month ON subsidies(month);
