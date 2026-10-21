-- =========================================================================
-- VoiceSell AI — Sales Conversation Engine Schema Migration
-- Migration: 20261020000001_sales_engine_schema.sql
-- Description: Adds product-specific pain points, competitor differentiation,
--              demo booking protocols, purchasing instructions, and agent
--              qualification questions & closing behavior settings.
-- =========================================================================

-- 1. Extend products table with sales engine knowledge fields
alter table if exists public.products
  add column if not exists customer_pain_points jsonb not null default '[]'::jsonb,
  add column if not exists competitor_differentiation text not null default '',
  add column if not exists demo_booking_process text not null default '',
  add column if not exists purchasing_instructions text not null default '';

-- 2. Extend agent_settings table with qualification and closing behavior
alter table if exists public.agent_settings
  add column if not exists sales_tone text not null default 'Consultative',
  add column if not exists qualification_questions text[] not null default array[
    'Could you briefly describe your current team structure and active workflow bottlenecks?',
    'What tools or systems are you currently using for this process, and where do they fall short?',
    'What is your target timeline for evaluating and putting an automated solution in place?'
  ],
  add column if not exists product_specific_instructions text not null default '',
  add column if not exists closing_behavior text not null default 'Offer two concrete times for a live architecture demo. If opt-out requested, immediately acknowledge politely, confirm no further contact, and conclude.';
