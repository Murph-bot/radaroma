-- Curator review completion: set when a human has walked all five axes of a
-- café's curator score and approved them. NULL = draft (seed or unreviewed edit).
-- Only meaningful for scored_by='curator'.
alter table cafe_scores add column scores_reviewed_at text;
