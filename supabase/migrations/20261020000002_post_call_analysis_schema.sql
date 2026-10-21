-- =========================================================================
-- VoiceSell AI — Post-Call AI Analysis & Manual Status Override Schema
-- Migration: 20261020000002_post_call_analysis_schema.sql
-- Description: Adds audit trail fields for manual classification overrides,
--              structured post-call intelligence, and evidence quotes.
-- =========================================================================

-- 1. Extend call_sessions table with audit fields for manual classification
alter table if exists public.call_sessions
  add column if not exists original_ai_status public.sales_status_enum,
  add column if not exists is_manually_corrected boolean not null default false,
  add column if not exists corrected_by text,
  add column if not exists corrected_at timestamptz,
  add column if not exists correction_notes text,
  add column if not exists follow_up_date date,
  add column if not exists buying_intent text;

-- 2. Extend call_summaries table with rich structured analysis fields
alter table if exists public.call_summaries
  add column if not exists structured_analysis jsonb not null default '{}'::jsonb,
  add column if not exists evidence_quotes jsonb not null default '[]'::jsonb,
  add column if not exists customer_business_and_use_case text,
  add column if not exists features_discussed jsonb not null default '[]'::jsonb,
  add column if not exists questions_asked jsonb not null default '[]'::jsonb,
  add column if not exists budget_or_timeline text,
  add column if not exists promised_actions jsonb not null default '[]'::jsonb;
