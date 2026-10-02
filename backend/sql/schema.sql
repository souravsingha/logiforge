CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN','LOGISTICS_PLANNER','DEPOT_MANAGER','FIELD_OPERATOR','ANALYST');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('CENTRAL_DEPOT','REGIONAL_DEPOT','FORWARD_LOCATION','DISTRIBUTION_POINT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE inventory_status AS ENUM ('GREEN','AMBER','RED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_priority AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('DRAFT','SUBMITTED','UNDER_REVIEW','PLANNED','APPROVED','IN_TRANSIT','DELIVERED','CLOSED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM ('AVAILABLE','ASSIGNED','IN_TRANSIT','MAINTENANCE','UNAVAILABLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('INFO','WARNING','CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scenario_status AS ENUM ('OPEN','RUNNING','COMPLETED','CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(160) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name varchar(120) NOT NULL,
  role user_role NOT NULL DEFAULT 'LOGISTICS_PLANNER',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) UNIQUE NOT NULL,
  name varchar(120) NOT NULL,
  type location_type NOT NULL,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  storage_capacity numeric(14,2) NOT NULL DEFAULT 1000,
  priority_level int NOT NULL DEFAULT 3 CHECK(priority_level BETWEEN 1 AND 5),
  connectivity_status varchar(30) NOT NULL DEFAULT 'ONLINE',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) UNIQUE NOT NULL,
  name varchar(120) NOT NULL,
  category varchar(60) NOT NULL,
  unit varchar(30) NOT NULL DEFAULT 'units',
  minimum_days numeric(8,2) NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  current_quantity numeric(14,2) NOT NULL DEFAULT 0,
  minimum_threshold numeric(14,2) NOT NULL DEFAULT 0,
  maximum_capacity numeric(14,2) NOT NULL DEFAULT 1000,
  daily_average_consumption numeric(14,4) NOT NULL DEFAULT 0,
  days_of_supply numeric(14,2) NOT NULL DEFAULT 0,
  status inventory_status NOT NULL DEFAULT 'GREEN',
  last_updated timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id,item_id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type varchar(30) NOT NULL,
  quantity numeric(14,2) NOT NULL,
  reference_code varchar(80),
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consumption_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  consumption_date date NOT NULL,
  quantity numeric(14,2) NOT NULL CHECK(quantity >= 0),
  unit varchar(30) NOT NULL,
  scenario_tag varchar(80),
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id,item_id,consumption_date)
);

CREATE TABLE IF NOT EXISTS supply_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code varchar(50) UNIQUE NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id),
  item_id uuid NOT NULL REFERENCES items(id),
  quantity numeric(14,2) NOT NULL CHECK(quantity > 0),
  required_by date NOT NULL,
  priority request_priority NOT NULL DEFAULT 'MEDIUM',
  reason text NOT NULL,
  status request_status NOT NULL DEFAULT 'DRAFT',
  created_by uuid REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transport_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_code varchar(50) UNIQUE NOT NULL,
  asset_type varchar(60) NOT NULL,
  capacity numeric(14,2) NOT NULL,
  capacity_unit varchar(30) NOT NULL DEFAULT 'units',
  status asset_status NOT NULL DEFAULT 'AVAILABLE',
  availability_percent numeric(5,2) NOT NULL DEFAULT 100,
  current_location_id uuid REFERENCES locations(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code varchar(50) UNIQUE NOT NULL,
  from_location_id uuid NOT NULL REFERENCES locations(id),
  to_location_id uuid NOT NULL REFERENCES locations(id),
  distance_km numeric(10,2) NOT NULL,
  estimated_time_hours numeric(10,2) NOT NULL,
  capacity numeric(14,2) NOT NULL,
  road_condition varchar(30) NOT NULL DEFAULT 'NORMAL',
  weather_impact varchar(30) NOT NULL DEFAULT 'LOW',
  availability_percent numeric(5,2) NOT NULL DEFAULT 100,
  modeled_cost numeric(14,2) NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS route_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  condition_date date NOT NULL,
  weather varchar(60),
  road_condition varchar(60),
  impact_percent numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(route_id,condition_date)
);

CREATE TABLE IF NOT EXISTS demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  forecast_date date NOT NULL,
  predicted_quantity numeric(14,2) NOT NULL,
  lower_bound numeric(14,2),
  upper_bound numeric(14,2),
  model_name varchar(100) NOT NULL,
  model_version varchar(50),
  horizon_days int NOT NULL,
  source varchar(120),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id,item_id,forecast_date,model_version)
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type varchar(60) NOT NULL,
  severity alert_severity NOT NULL,
  title varchar(180) NOT NULL,
  message text NOT NULL,
  location_id uuid REFERENCES locations(id),
  item_id uuid REFERENCES items(id),
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS optimization_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type varchar(50) NOT NULL,
  status varchar(30) NOT NULL,
  solver_name varchar(100),
  scenario_id uuid,
  created_by uuid REFERENCES users(id),
  input_summary jsonb,
  output_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(150) NOT NULL,
  type varchar(60) NOT NULL,
  parameter numeric(10,2) NOT NULL DEFAULT 0,
  status scenario_status NOT NULL DEFAULT 'OPEN',
  created_by uuid REFERENCES users(id),
  baseline_snapshot jsonb,
  result_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action varchar(100) NOT NULL,
  entity_type varchar(80),
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_consumption_date ON consumption_history(consumption_date);
CREATE INDEX IF NOT EXISTS idx_requests_status ON supply_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON supply_requests(priority);
CREATE INDEX IF NOT EXISTS idx_forecast_date ON demand_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(is_resolved,severity);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);