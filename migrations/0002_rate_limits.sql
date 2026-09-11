-- Sliding-window rate limiting for the agent endpoints (D1-backed).
create table if not exists rate_limits (
  key text primary key,
  window_start text not null,
  count integer not null default 1
);
