-- Alter users table to add IRCTC registration fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS irctc_id VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(50);

-- Create tatkal_requests table
CREATE TABLE tatkal_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Journey details
  from_station        VARCHAR(10) NOT NULL,
  to_station          VARCHAR(10) NOT NULL,
  travel_date         DATE NOT NULL,
  train_number        VARCHAR(10) NOT NULL,
  class               VARCHAR(5) NOT NULL,  -- SL, 3A, 2A, 1A, GEN

  -- Passenger details (JSON array — supports up to 6 passengers)
  passengers          JSONB NOT NULL,

  -- Urgency
  is_urgent           BOOLEAN DEFAULT false,
  urgency_reason      VARCHAR(20),          -- medical | bereavement | official | personal
  urgency_document_url TEXT,
  urgency_score       NUMERIC(3,1) DEFAULT 0,

  -- Execution
  scheduled_fire_time TIMESTAMPTZ NOT NULL,
  status              VARCHAR(20) DEFAULT 'PENDING',

  -- Result (from IRCTC or simulation)
  simulated_pnr       VARCHAR(10),
  result_payload      JSONB,

  -- Anti-hoarding
  booking_date        DATE NOT NULL,        -- the date this request was created

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Anti-hoarding constraint: one request per user per booking date per train
CREATE UNIQUE INDEX idx_tatkal_one_per_day
  ON tatkal_requests(user_id, booking_date, train_number)
  WHERE status NOT IN ('CANCELLED', 'FAILED');

-- Other indexes for tatkal_requests
CREATE INDEX idx_tatkal_user_id ON tatkal_requests(user_id);
CREATE INDEX idx_tatkal_status ON tatkal_requests(status);
CREATE INDEX idx_tatkal_fire_time ON tatkal_requests(scheduled_fire_time);
CREATE INDEX idx_tatkal_travel_date ON tatkal_requests(travel_date);


-- Create tatkal_surrenders table
CREATE TABLE tatkal_surrenders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Ticket details
  pnr                 VARCHAR(10) NOT NULL,
  from_station        VARCHAR(10) NOT NULL,
  to_station          VARCHAR(10) NOT NULL,
  travel_date         DATE NOT NULL,
  train_number        VARCHAR(10) NOT NULL,
  class               VARCHAR(5) NOT NULL,

  -- Status
  status              VARCHAR(20) DEFAULT 'LISTED',  -- LISTED | MATCHED | COMPLETED | WITHDRAWN

  listed_at           TIMESTAMPTZ DEFAULT NOW(),
  matched_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tatkal_surrenders
CREATE INDEX idx_surrenders_status ON tatkal_surrenders(status);
CREATE INDEX idx_surrenders_owner ON tatkal_surrenders(owner_user_id);
CREATE INDEX idx_surrenders_travel_date ON tatkal_surrenders(travel_date);


-- Row-Level Security Policies

-- tatkal_requests policies
ALTER TABLE tatkal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tatkal_requests_owner" ON tatkal_requests
  FOR ALL
  TO authenticated
  USING (
    user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );

-- tatkal_surrenders policies
ALTER TABLE tatkal_surrenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "surrenders_read_all" ON tatkal_surrenders
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "surrenders_owner_write" ON tatkal_surrenders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid())
  );

CREATE POLICY "surrenders_update_policy" ON tatkal_surrenders
  FOR UPDATE
  TO authenticated
  USING (
    owner_user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()) OR
    (status = 'LISTED' AND owner_user_id != (SELECT id FROM users WHERE firebase_uid = auth.uid()))
  )
  WITH CHECK (
    owner_user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()) OR
    (status = 'MATCHED' AND requester_user_id = (SELECT id FROM users WHERE firebase_uid = auth.uid()))
  );
