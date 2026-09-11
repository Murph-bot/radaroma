-- Pour Compass — initial schema (spec §3.1) + RLS + triggers
-- Apply via Supabase CLI (`supabase db push`) or the dashboard SQL editor.

-- cafes: the core, publicly-visible entity
create table cafes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  neighborhood text,
  price_tier smallint check (price_tier between 1 and 4),
  source text not null check (source in ('owner','public_submission')),
  status text not null default 'draft'
    check (status in ('draft','verified','flagged','rejected')),
  confidence_score numeric,      -- agent's verification confidence, 0–1
  verification_notes text,       -- agent's short human-readable summary
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz
);

-- cafe_scores: curator score and future public-average score kept separate
create table cafe_scores (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes(id) on delete cascade,
  scored_by text not null check (scored_by in ('curator','public_avg')),
  quality numeric check (quality between 1 and 5),
  price_value numeric check (price_value between 1 and 5),
  work_friendliness numeric check (work_friendliness between 1 and 5),
  quiet_vibe numeric check (quiet_vibe between 1 and 5),
  specialty_depth numeric check (specialty_depth between 1 and 5),
  updated_at timestamptz not null default now(),
  unique (cafe_id, scored_by)
);

-- submissions: raw public intake, before promotion to `cafes`
create table submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_name text not null,
  submitted_location text not null,   -- address or maps URL, freeform
  submitter_note text,
  status text not null default 'new'
    check (status in ('new','agent_reviewing','verified','flagged','rejected','promoted')),
  promoted_cafe_id uuid references cafes(id),
  created_at timestamptz not null default now()
);

-- agent_runs: audit trail of every agent decision — builds trust and debuggability
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  mode text not null
    check (mode in ('verify_submission','concierge_chat','curator_assist')),
  tool_calls jsonb,          -- log of which tools were invoked + their results
  confidence_score numeric,
  decision text,             -- 'auto_verified' | 'flagged_for_review' | 'rejected'
  reasoning text,
  created_at timestamptz not null default now()
);

-- invited_emails: allowlist for ADMIN access only (not for browsing/submitting)
create table invited_emails (
  email text primary key,
  invited_by text,
  role text not null default 'curator' check (role in ('owner','curator')),
  created_at timestamptz not null default now()
);

-- indexes for the hot paths: status filters and joins
create index cafes_status_idx on cafes (status);
create index submissions_status_idx on submissions (status);
create index agent_runs_submission_id_idx on agent_runs (submission_id);

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cafes_set_updated_at before update on cafes
  for each row execute function public.set_updated_at();
create trigger cafe_scores_set_updated_at before update on cafe_scores
  for each row execute function public.set_updated_at();

-- row level security: public can read verified cafes + their scores,
-- and insert submissions (only ever as status='new'); everything else
-- is admin-only (service role bypasses RLS).
alter table cafes enable row level security;
alter table cafe_scores enable row level security;
alter table submissions enable row level security;
alter table agent_runs enable row level security;
alter table invited_emails enable row level security;

create policy "public read verified cafes" on cafes
  for select to anon, authenticated
  using (status = 'verified');

create policy "public read scores of verified cafes" on cafe_scores
  for select to anon, authenticated
  using (exists (
    select 1 from cafes c where c.id = cafe_id and c.status = 'verified'
  ));

-- public intake: anyone may insert a submission, but only as 'new';
-- status transitions happen server-side through the agent pipeline.
create policy "public submit new cafe" on submissions
  for insert to anon, authenticated
  with check (status = 'new');
