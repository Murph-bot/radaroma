-- Pour Compass — initial schema (SQLite dialect for Cloudflare D1).
-- Apply: wrangler d1 migrations apply pour-compass --local|--remote
--
-- SECURITY MODEL (no RLS in D1): all data access goes through the app
-- server (repositories in lib/db/repositories/). Public pages only ever
-- read status='verified' rows; submissions are created by the server
-- route with status='new' hardcoded. Browsers never touch D1 directly.

-- cafes: the core, publicly-visible entity
create table cafes (
  id text primary key,                -- uuid v4, generated in app code
  slug text unique not null,
  name text not null,
  address text not null,
  lat real,
  lng real,
  neighborhood text,
  price_tier integer check (price_tier between 1 and 4),
  source text not null check (source in ('owner','public_submission')),
  status text not null default 'draft'
    check (status in ('draft','verified','flagged','rejected')),
  confidence_score real,              -- agent's verification confidence, 0–1
  verification_notes text,            -- agent's short human-readable summary
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  verified_at text
);

-- cafe_scores: curator score and future public-average score kept separate
create table cafe_scores (
  id text primary key,                -- uuid v4, generated in app code
  cafe_id text not null references cafes(id) on delete cascade,
  scored_by text not null check (scored_by in ('curator','public_avg')),
  quality real check (quality between 1 and 5),
  price_value real check (price_value between 1 and 5),
  work_friendliness real check (work_friendliness between 1 and 5),
  quiet_vibe real check (quiet_vibe between 1 and 5),
  specialty_depth real check (specialty_depth between 1 and 5),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  unique (cafe_id, scored_by)
);

-- submissions: raw public intake, before promotion to `cafes`
create table submissions (
  id text primary key,                -- uuid v4, generated in app code
  submitted_name text not null,
  submitted_location text not null,   -- address or maps URL, freeform
  submitter_note text,
  status text not null default 'new'
    check (status in ('new','agent_reviewing','verified','flagged','rejected','promoted')),
  promoted_cafe_id text references cafes(id),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- agent_runs: audit trail of every agent decision — builds trust and debuggability
create table agent_runs (
  id text primary key,                -- uuid v4, generated in app code
  submission_id text references submissions(id) on delete cascade,
  mode text not null
    check (mode in ('verify_submission','concierge_chat','curator_assist')),
  tool_calls text,                    -- JSON string of tool invocations + results
  confidence_score real,
  decision text,                      -- 'auto_verified' | 'flagged_for_review' | 'rejected'
  reasoning text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- invited_emails: allowlist for ADMIN access only (not for browsing/submitting)
create table invited_emails (
  email text primary key,
  invited_by text,
  role text not null default 'curator' check (role in ('owner','curator')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- indexes for the hot paths: status filters and joins
create index cafes_status_idx on cafes (status);
create index submissions_status_idx on submissions (status);
create index agent_runs_submission_id_idx on agent_runs (submission_id);
create index cafe_scores_cafe_id_idx on cafe_scores (cafe_id);
