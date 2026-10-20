-- VoiceSell AI Complete Supabase Migration
-- Tables:
-- 1. workspaces
-- 2. workspace_members
-- 3. products
-- 4. product_faqs
-- 5. leads
-- 6. call_sessions
-- 7. call_messages
-- 8. call_recordings
-- 9. call_summaries
-- 10. follow_up_tasks
-- 11. agent_settings
-- 12. recording_consents

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Sales status enum with exact required values
create type public.sales_status_enum as enum (
  'Converted',
  'Interested',
  'Follow-up Required',
  'Not Interested',
  'Demo Requested',
  'No Response'
);

create type public.call_status_enum as enum (
  'Idle',
  'Connecting',
  'Listening',
  'Speaking',
  'Completed',
  'Failed'
);

create type public.speaker_enum as enum (
  'ai',
  'customer'
);

create type public.task_status_enum as enum (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.task_priority_enum as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

-- 1. WORKSPACES
create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tier text not null default 'Enterprise Growth Fleet',
  calls_limit integer not null default 5000,
  calls_used integer not null default 0,
  minutes_limit integer not null default 25000,
  minutes_used integer not null default 0,
  timezone text not null default 'UTC+05:30 (Asia/Kolkata / IST)',
  currency text not null default 'USD ($)',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. WORKSPACE_MEMBERS
create table if not exists public.workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'sales_rep', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Index for membership lookups
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_workspace_members_ws on public.workspace_members(workspace_id);

-- 3. PRODUCTS
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  tagline text not null default '',
  category text not null default 'Sales Tech & CRM',
  description text not null default '',
  features jsonb not null default '[]'::jsonb,
  pricing jsonb not null default '[]'::jsonb,
  target_audience text not null default '',
  product_website text not null default '',
  sales_pitch text not null,
  tone text not null default 'Consultative',
  preferred_language text not null default 'English',
  call_to_action text not null default 'Book a 15-minute live architecture demo',
  ai_instructions text not null default '',
  active boolean not null default true,
  call_count integer not null default 0,
  conversion_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_workspace on public.products(workspace_id);

-- 4. PRODUCT_FAQS
create table if not exists public.product_faqs (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  question text not null,
  answer text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_faqs_product on public.product_faqs(product_id);

-- 5. LEADS
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  company text not null,
  email text not null,
  phone text not null default '',
  preferred_language text not null default 'English',
  associated_product_id uuid references public.products(id) on delete set null,
  associated_product_name text not null default '',
  sales_status public.sales_status_enum not null default 'Interested',
  deal_value numeric(12,2) not null default 0,
  notes text not null default '',
  city text not null default '',
  country text not null default '',
  last_contacted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_workspace on public.leads(workspace_id);
create index if not exists idx_leads_status on public.leads(sales_status);

-- 6. CALL_SESSIONS
create table if not exists public.call_sessions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  product_name text not null default '',
  start_time timestamptz not null default now(),
  end_time timestamptz,
  duration_seconds integer not null default 0,
  call_status public.call_status_enum not null default 'Idle',
  selected_language text not null default 'English',
  consent_status boolean not null default true,
  consent_timestamp timestamptz default now(),
  recording_storage_path text,
  customer_requirements jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  sales_status public.sales_status_enum not null default 'Interested',
  ai_score integer not null default 85,
  ai_analysis_metadata jsonb not null default '{}'::jsonb,
  sentiment text not null default 'Positive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_call_sessions_workspace on public.call_sessions(workspace_id);
create index if not exists idx_call_sessions_lead on public.call_sessions(lead_id);
create index if not exists idx_call_sessions_status on public.call_sessions(sales_status);

-- 7. CALL_MESSAGES
create table if not exists public.call_messages (
  id uuid primary key default uuid_generate_v4(),
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  speaker public.speaker_enum not null,
  speaker_name text not null,
  text text not null,
  timestamp_offset_seconds integer not null default 0,
  formatted_time text not null default '00:00',
  created_at timestamptz not null default now()
);

create index if not exists idx_call_messages_session on public.call_messages(call_session_id);
create index if not exists idx_call_messages_workspace on public.call_messages(workspace_id);

-- 8. CALL_RECORDINGS
create table if not exists public.call_recordings (
  id uuid primary key default uuid_generate_v4(),
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  storage_bucket text not null default 'call-recordings',
  storage_path text not null,
  duration_seconds integer not null default 0,
  file_size_bytes bigint not null default 0,
  mime_type text not null default 'audio/wav',
  waveform_data jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_recordings_session on public.call_recordings(call_session_id);
create index if not exists idx_call_recordings_workspace on public.call_recordings(workspace_id);

-- 9. CALL_SUMMARIES
create table if not exists public.call_summaries (
  id uuid primary key default uuid_generate_v4(),
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  executive_summary text not null,
  customer_sentiment text not null default 'Positive',
  objections_summary jsonb not null default '[]'::jsonb,
  requirements_summary jsonb not null default '[]'::jsonb,
  next_steps_summary jsonb not null default '[]'::jsonb,
  confidence_score integer not null default 90,
  created_at timestamptz not null default now()
);

create index if not exists idx_call_summaries_session on public.call_summaries(call_session_id);

-- 10. FOLLOW_UP_TASKS
create table if not exists public.follow_up_tasks (
  id uuid primary key default uuid_generate_v4(),
  call_session_id uuid references public.call_sessions(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  due_date timestamptz,
  status public.task_status_enum not null default 'pending',
  priority public.task_priority_enum not null default 'medium',
  assigned_to text not null default 'Enterprise AE Team',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_follow_up_tasks_workspace on public.follow_up_tasks(workspace_id);

-- 11. AGENT_SETTINGS
create table if not exists public.agent_settings (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_name text not null default 'Aria — Enterprise Voice SDR',
  voice_preference text not null default 'ElevenLabs Nova (Natural Expressive)',
  voice_gender text not null default 'female',
  personality text not null default 'Empathetic, razor-sharp enterprise consultant who actively listens, identifies acute business bottlenecks, and gently steers toward scheduling high-value demos.',
  sales_approach text not null default 'Consultative',
  opening_greeting text not null default 'Hello [Customer Name]! This is Aria with [Product Name]. I noticed your team has been scaling operations recently — do you have two minutes to discuss accelerating your pipeline?',
  supported_languages text[] not null default array['English', 'Hindi', 'Telugu', 'Spanish', 'Tamil', 'German', 'French', 'Kannada'],
  conversation_rules text[] not null default array[
    'Always address the prospect by their respectful first name or localized title (e.g., "ji" in Hindi, "Garu" in Telugu).',
    'Never interrupt while the customer is actively vocalizing; allow a 400ms buffer before responding.',
    'If the prospect expresses hesitation around price, immediately pivot to ROI and deferred trial options.',
    'Ask clarifying discovery questions before offering a product feature pitch.',
    'Ensure explicit verbal agreement before sending calendar invites or locking demo times.',
    'Maintain a calm, warm, and highly professional conversational pace.'
  ],
  follow_up_behavior text not null default 'Automatically synthesize call transcripts into CRM tasks, send personalized calendar invitations within 60 seconds, and enqueue WhatsApp/SMS recaps if requested.',
  demo_booking_instructions text not null default 'Offer two specific time slots (e.g., "Tomorrow at 3 PM or Thursday at 11 AM"). Check company calendar availability in real time and immediately confirm email address spelling.',
  speaking_rate numeric(3,2) not null default 1.0,
  interruption_handling text not null default 'Context-Aware',
  max_call_duration_minutes integer not null default 12,
  ambient_noise_suppression boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id)
);

create index if not exists idx_agent_settings_workspace on public.agent_settings(workspace_id);

-- 12. RECORDING_CONSENTS
create table if not exists public.recording_consents (
  id uuid primary key default uuid_generate_v4(),
  call_session_id uuid references public.call_sessions(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  consent_given boolean not null default true,
  consent_text text not null default 'This call may be monitored and recorded by VoiceSell AI for quality assurance and automated meeting notes. Do you agree to proceed?',
  consent_timestamp timestamptz not null default now(),
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_recording_consents_workspace on public.recording_consents(workspace_id);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
--------------------------------------------------------------------------------

-- Helper 1: Is user an authorized member of this workspace?
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

-- Helper 2: Set of workspace IDs belonging to current user
create or replace function public.get_user_workspace_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid();
$$;

--------------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
--------------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.products enable row level security;
alter table public.product_faqs enable row level security;
alter table public.leads enable row level security;
alter table public.call_sessions enable row level security;
alter table public.call_messages enable row level security;
alter table public.call_recordings enable row level security;
alter table public.call_summaries enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.agent_settings enable row level security;
alter table public.recording_consents enable row level security;

--------------------------------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------------------------------

-- 1. workspaces policies
create policy "Users can view workspaces they belong to"
  on public.workspaces for select
  using (id in (select public.get_user_workspace_ids()));

create policy "Users can update their workspaces"
  on public.workspaces for update
  using (public.is_workspace_member(id));

create policy "Authenticated users can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() is not null);

-- 2. workspace_members policies
create policy "Users can view members of their workspaces"
  on public.workspace_members for select
  using (user_id = auth.uid() or workspace_id in (select public.get_user_workspace_ids()));

create policy "Authenticated users can join or create workspace members"
  on public.workspace_members for insert
  with check (auth.uid() is not null);

create policy "Admins can update workspace members"
  on public.workspace_members for update
  using (public.is_workspace_member(workspace_id));

create policy "Admins can delete workspace members"
  on public.workspace_members for delete
  using (public.is_workspace_member(workspace_id));

-- 3. products policies
create policy "Workspace members can view products"
  on public.products for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert products"
  on public.products for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update products"
  on public.products for update
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete products"
  on public.products for delete
  using (public.is_workspace_member(workspace_id));

-- 4. product_faqs policies
create policy "Workspace members can view product faqs"
  on public.product_faqs for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can manage product faqs"
  on public.product_faqs for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- 5. leads policies
create policy "Workspace members can view leads"
  on public.leads for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert leads"
  on public.leads for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update leads"
  on public.leads for update
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete leads"
  on public.leads for delete
  using (public.is_workspace_member(workspace_id));

-- 6. call_sessions policies
create policy "Workspace members can view call sessions"
  on public.call_sessions for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert call sessions"
  on public.call_sessions for insert
  with check (public.is_workspace_member(workspace_id));

create policy "Workspace members can update call sessions"
  on public.call_sessions for update
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can delete call sessions"
  on public.call_sessions for delete
  using (public.is_workspace_member(workspace_id));

-- 7. call_messages policies
create policy "Workspace members can view call messages"
  on public.call_messages for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert call messages"
  on public.call_messages for insert
  with check (public.is_workspace_member(workspace_id));

-- 8. call_recordings policies
create policy "Workspace members can view call recordings"
  on public.call_recordings for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert call recordings"
  on public.call_recordings for insert
  with check (public.is_workspace_member(workspace_id));

-- 9. call_summaries policies
create policy "Workspace members can view call summaries"
  on public.call_summaries for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert call summaries"
  on public.call_summaries for insert
  with check (public.is_workspace_member(workspace_id));

-- 10. follow_up_tasks policies
create policy "Workspace members can manage follow-up tasks"
  on public.follow_up_tasks for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- 11. agent_settings policies
create policy "Workspace members can view agent settings"
  on public.agent_settings for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can manage agent settings"
  on public.agent_settings for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- 12. recording_consents policies
create policy "Workspace members can view recording consents"
  on public.recording_consents for select
  using (public.is_workspace_member(workspace_id));

create policy "Workspace members can insert recording consents"
  on public.recording_consents for insert
  with check (public.is_workspace_member(workspace_id));

--------------------------------------------------------------------------------
-- STORAGE BUCKET: Private call-recordings
--------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'call-recordings',
  'call-recordings',
  false,
  52428800, -- 50MB
  array['audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm']
)
on conflict (id) do update set public = false;

-- Storage object policies for private call recordings
create policy "Workspace members can access their call recordings"
  on storage.objects for select
  using (
    bucket_id = 'call-recordings'
    and auth.uid() is not null
    and public.is_workspace_member(cast(split_part(name, '/', 1) as uuid))
  );

create policy "Workspace members can upload call recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'call-recordings'
    and auth.uid() is not null
    and public.is_workspace_member(cast(split_part(name, '/', 1) as uuid))
  );

--------------------------------------------------------------------------------
-- WORKSPACE PROVISIONING RPC (Runs on user signup or onboarding)
--------------------------------------------------------------------------------

create or replace function public.provision_workspace_with_seed(ws_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_ws_id uuid;
  prod1_id uuid;
  prod2_id uuid;
  prod3_id uuid;
  prod4_id uuid;
  lead1_id uuid;
  lead2_id uuid;
  lead3_id uuid;
  call1_id uuid;
  call2_id uuid;
begin
  -- 1. Create Workspace
  insert into public.workspaces (name, tier, calls_limit, calls_used, minutes_limit, minutes_used)
  values (coalesce(ws_name, 'My VoiceSell Fleet'), 'Enterprise Growth Fleet', 5000, 1482, 25000, 6372)
  returning id into new_ws_id;

  -- 2. Associate Creator as Owner
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_ws_id, auth.uid(), 'owner');

  -- 3. Seed Default Agent Settings
  insert into public.agent_settings (
    workspace_id, agent_name, voice_preference, voice_gender, personality,
    sales_approach, opening_greeting, supported_languages, conversation_rules,
    follow_up_behavior, demo_booking_instructions, speaking_rate, interruption_handling,
    ambient_noise_suppression
  ) values (
    new_ws_id,
    'Aria — Enterprise Voice SDR',
    'ElevenLabs Nova (Natural Expressive)',
    'female',
    'Empathetic, razor-sharp enterprise consultant who actively listens, identifies acute business bottlenecks, and gently steers toward scheduling high-value demos.',
    'Consultative',
    'Hello [Customer Name]! This is Aria with [Product Name]. I noticed your team has been scaling operations recently — do you have two minutes to discuss accelerating your pipeline?',
    array['English', 'Hindi', 'Telugu', 'Spanish', 'Tamil', 'German', 'French', 'Kannada'],
    array[
      'Always address the prospect by their respectful first name or localized title (e.g., "ji" in Hindi, "Garu" in Telugu).',
      'Never interrupt while the customer is actively vocalizing; allow a 400ms buffer before responding.',
      'If the prospect expresses hesitation around price, immediately pivot to ROI and deferred trial options.',
      'Ask clarifying discovery questions before offering a product feature pitch.',
      'Ensure explicit verbal agreement before sending calendar invites or locking demo times.',
      'Maintain a calm, warm, and highly professional conversational pace.'
    ],
    'Automatically synthesize call transcripts into CRM tasks, send personalized calendar invitations within 60 seconds, and enqueue WhatsApp/SMS recaps if requested.',
    'Offer two specific time slots (e.g., "Tomorrow at 3 PM or Thursday at 11 AM"). Check company calendar availability in real time and immediately confirm email address spelling.',
    1.0,
    'Context-Aware',
    true
  );

  -- 4. Seed SaaS Products
  insert into public.products (
    workspace_id, name, tagline, category, description, features, pricing,
    target_audience, product_website, sales_pitch, tone, preferred_language,
    call_to_action, ai_instructions, active, call_count, conversion_rate
  ) values (
    new_ws_id,
    'OmniFlow CRM',
    'Autonomous AI Sales & Pipeline Acceleration Platform',
    'Sales Tech & CRM',
    'OmniFlow CRM unifies outbound pipeline generation, automated deal intelligence, and predictive revenue forecasting for high-velocity B2B SaaS teams.',
    '["Autonomous outbound voice & email multi-channel follow-up", "Real-time deal risk prediction & win-rate scoring", "One-click bidirectional sync with Salesforce & HubSpot", "AI meeting summarize & action item delegation", "Voice-to-CRM automatic data hygiene"]'::jsonb,
    '[{"tier": "Starter", "price": "$49", "period": "/user/mo", "billing": "Billed annually"}, {"tier": "Growth AI", "price": "$129", "period": "/user/mo", "billing": "Billed annually (Most Popular)"}, {"tier": "Enterprise Scale", "price": "$249", "period": "/user/mo", "billing": "Custom SLA & Dedicated Voice Cluster"}]'::jsonb,
    'B2B SaaS companies, mid-market sales organizations, agency owners, and revenue leaders managing 10+ SDRs and AEs.',
    'https://omniflowcrm.io',
    'OmniFlow CRM helps revenue teams recover 12+ lost selling hours every week by putting lead follow-up, voice outreach, and pipeline hygiene on autonomous autopilot.',
    'Consultative',
    'English',
    'Book a 15-minute live ROI benchmark & customized architecture walkthrough',
    'Adopt an executive consultative posture. Uncover the customer''s current outbound volume, CRM adoption challenges, and SDR ramp time before introducing tier recommendations.',
    true,
    684,
    24.8
  ) returning id into prod1_id;

  insert into public.products (
    workspace_id, name, tagline, category, description, features, pricing,
    target_audience, product_website, sales_pitch, tone, preferred_language,
    call_to_action, ai_instructions, active, call_count, conversion_rate
  ) values (
    new_ws_id,
    'CloudPulse APM',
    'Autonomous Cloud Observability & Anomaly Prevention',
    'DevOps & Cloud Infrastructure',
    'High-throughput eBPF-powered observability platform that isolates microservice regressions and memory leaks in seconds before users notice.',
    '["Zero-overhead kernel-level eBPF distributed tracing", "Autonomous root-cause analysis with LLM incident correlation", "Multi-cloud cost forecasting & unused container reclamation", "Native OpenTelemetry ingestion with 90-day retention"]'::jsonb,
    '[{"tier": "Developer", "price": "$89", "period": "/host/mo", "billing": "Pay as you go"}, {"tier": "Production Core", "price": "$199", "period": "/host/mo", "billing": "Billed annually"}, {"tier": "Mission Critical", "price": "Custom", "period": "/cluster", "billing": "Custom SLA & On-prem VPC"}]'::jsonb,
    'CTOs, VP of Engineering, SRE leads, and Platform Engineers maintaining distributed Kubernetes clusters.',
    'https://cloudpulse-apm.tech',
    'CloudPulse slashes MTTR by 78% and halves runaway observability bills with zero-overhead eBPF tracing.',
    'Direct & ROI-focused',
    'English',
    'Deploy our 15-minute sandbox agent on your staging cluster',
    'Engage platform architects on latency spikes, pager alerts fatigue, and egress monitoring bills.',
    true,
    412,
    19.4
  ) returning id into prod2_id;

  insert into public.products (
    workspace_id, name, tagline, category, description, features, pricing,
    target_audience, product_website, sales_pitch, tone, preferred_language,
    call_to_action, ai_instructions, active, call_count, conversion_rate
  ) values (
    new_ws_id,
    'Securify Zero-Trust',
    'Next-Gen Identity Governance & Automated Posture Shield',
    'Cybersecurity & Compliance',
    'Continuous biometric & cryptographic access verification across cloud workloads, SaaS tools, and remote workforce endpoints.',
    '["Context-aware adaptive MFA with device health checks", "Just-in-time (JIT) ephemeral cloud privilege escalation", "Automated SOC-2, HIPAA, and ISO 27001 evidence collector", "Real-time credential leakage & dark-web threat radar"]'::jsonb,
    '[{"tier": "Standard", "price": "$8", "period": "/user/mo", "billing": "Billed annually"}, {"tier": "Zero-Trust Shield", "price": "$18", "period": "/user/mo", "billing": "Billed annually"}, {"tier": "GovCloud & Defense", "price": "$35", "period": "/user/mo", "billing": "Air-gapped deployment"}]'::jsonb,
    'CISOs, InfoSec Directors, Compliance Officers, and IT Security managers.',
    'https://securify.cloud',
    'Protect every endpoint and automate your next security audit with zero user friction.',
    'Friendly & Professional',
    'Hindi',
    'Schedule a free Attack Surface & Credential Exposure assessment',
    'Highlight regulatory audit deadlines, ransomware prevention, and frictionless employee login experience.',
    true,
    236,
    22.1
  ) returning id into prod3_id;

  insert into public.products (
    workspace_id, name, tagline, category, description, features, pricing,
    target_audience, product_website, sales_pitch, tone, preferred_language,
    call_to_action, ai_instructions, active, call_count, conversion_rate
  ) values (
    new_ws_id,
    'DevSprint AI',
    'Autonomous AI Code Review & Automated Regression Shield',
    'Developer Productivity',
    'AI code assistant that automatically writes unit tests, reviews pull requests for architectural flaws, and fixes vulnerability CVEs.',
    '["Self-healing automated unit test generation", "Deep architectural dependency graph analysis", "Instant PR review comments under 45 seconds", "Zero training on private repositories guarantee"]'::jsonb,
    '[{"tier": "Team", "price": "$29", "period": "/dev/mo", "billing": "Billed annually"}, {"tier": "Pro Scale", "price": "$69", "period": "/dev/mo", "billing": "Billed annually"}, {"tier": "Enterprise Dedicated", "price": "$120", "period": "/dev/mo", "billing": "Self-hosted LLM"}]'::jsonb,
    'Engineering managers, lead developers, and VP of Software Engineering.',
    'https://devsprint.dev',
    'Cut PR review cycles from 3 days to 45 minutes while achieving 85%+ branch test coverage.',
    'Challenger',
    'Telugu',
    'Run a sample scan on one open-source or test repository',
    'Emphasize engineering velocity, preventing junior dev bugs from hitting production, and test coverage automation.',
    true,
    150,
    18.0
  ) returning id into prod4_id;

  -- 5. Seed Product FAQs
  insert into public.product_faqs (product_id, workspace_id, question, answer, display_order)
  values
    (prod1_id, new_ws_id, 'How long does implementation take?', 'Standard onboarding takes under 35 minutes with native OAuth integrations for Google Workspace and Microsoft 365.', 1),
    (prod1_id, new_ws_id, 'Can OmniFlow replace our existing CRM?', 'OmniFlow can run as a standalone CRM or sit as an acceleration layer on top of Salesforce or HubSpot.', 2),
    (prod2_id, new_ws_id, 'Does eBPF instrumentation impact CPU overhead?', 'No, kernel-level eBPF operates with under 0.8% CPU overhead, drastically lighter than traditional bytecode agents.', 1),
    (prod3_id, new_ws_id, 'Does Securify support hybrid Active Directory?', 'Yes, full bi-directional sync with Azure AD / Entra ID, Okta, and on-premises LDAP.', 1);

  -- 6. Seed Realistic Leads
  insert into public.leads (
    workspace_id, name, company, email, phone, preferred_language,
    associated_product_id, associated_product_name, sales_status, deal_value, notes, city, country
  ) values (
    new_ws_id,
    'Vikramaditya Sharma',
    'FinApex Technologies',
    'vikram@finapex.co',
    '+91 98201 44521',
    'Hindi',
    prod1_id,
    'OmniFlow CRM',
    'Converted',
    18500,
    'Approved 25-seat Growth AI license after reviewing native Salesforce sync and multilingual outbound capability.',
    'Mumbai',
    'India'
  ) returning id into lead1_id;

  insert into public.leads (
    workspace_id, name, company, email, phone, preferred_language,
    associated_product_id, associated_product_name, sales_status, deal_value, notes, city, country
  ) values (
    new_ws_id,
    'Kavya Sree Reddy',
    'Cyientrix Data Systems',
    'kavya.reddy@cyientrix.io',
    '+91 94408 77123',
    'Telugu',
    prod2_id,
    'CloudPulse APM',
    'Demo Requested',
    24000,
    'Requested a technical deep-dive on eBPF kernel tracing vs Datadog collector for their 80-node EKS cluster.',
    'Hyderabad',
    'India'
  ) returning id into lead2_id;

  insert into public.leads (
    workspace_id, name, company, email, phone, preferred_language,
    associated_product_id, associated_product_name, sales_status, deal_value, notes, city, country
  ) values (
    new_ws_id,
    'Marcus Vance',
    'Apex Venture Logistics',
    'marcus.v@apexlogistics.com',
    '+1 (415) 890-3329',
    'English',
    prod1_id,
    'OmniFlow CRM',
    'Interested',
    32000,
    'Very receptive to outbound voice SDRs. Asked for security compliance documentation and SOC-2 report.',
    'San Francisco',
    'United States'
  ) returning id into lead3_id;

  -- 7. Seed Call Sessions & Transcripts
  insert into public.call_sessions (
    workspace_id, lead_id, product_id, customer_name, customer_email,
    customer_phone, product_name, duration_seconds, call_status, selected_language,
    consent_status, recording_storage_path, customer_requirements, objections,
    next_steps, sales_status, ai_score, sentiment
  ) values (
    new_ws_id, lead1_id, prod1_id,
    'Vikramaditya Sharma', 'vikram@finapex.co', '+91 98201 44521',
    'OmniFlow CRM', 274, 'Completed', 'Hindi', true,
    new_ws_id || '/call-101.wav',
    '["Salesforce bidirectional integration", "Hinglish & Hindi voice support", "25-seat deployment"]'::jsonb,
    '["Manual data entry fatigue in Salesforce", "Language barrier in regional calling"]'::jsonb,
    '["Sent calendar invitation for Oct 21, 3:00 PM IST", "Shared executive one-pager & pricing breakdown", "Assigned deal to Enterprise AE team"]'::jsonb,
    'Converted', 96, 'Positive'
  ) returning id into call1_id;

  insert into public.call_messages (call_session_id, workspace_id, speaker, speaker_name, text, timestamp_offset_seconds, formatted_time)
  values
    (call1_id, new_ws_id, 'ai', 'VoiceSell AI (Aria)', 'नमस्ते विक्रम जी! मैं OmniFlow CRM से Aria बात कर रही हूँ। आशा है आपका दिन अच्छा जा रहा होगा। क्या आपके पास हमारी बातचीत के लिए दो मिनट का समय है?', 3, '00:03'),
    (call1_id, new_ws_id, 'customer', 'Vikramaditya Sharma', 'नमस्ते Aria जी। हाँ बोलिए, क्या बात है?', 15, '00:15'),
    (call1_id, new_ws_id, 'ai', 'VoiceSell AI (Aria)', 'धन्यवाद विक्रम जी! मैं देख रही थी कि FinApex में आपकी सेल्स टीम काफी तेजी से बढ़ रही है। क्या आपके SDRs अभी भी कॉलिंग और CRM डेटा एंट्री में दिन के 3 से 4 घंटे मैन्युअली लगा रहे हैं?', 28, '00:28'),
    (call1_id, new_ws_id, 'customer', 'Vikramaditya Sharma', 'हाँ, यह एक बहुत बड़ा सिरदर्द है। हमारे सेल्स रेप्लिका Salesforce में नोट्स भरने में ही आधा दिन गँवा देते हैं।', 46, '00:46'),
    (call1_id, new_ws_id, 'ai', 'VoiceSell AI (Aria)', 'बिल्कुल सही कहा आपने। OmniFlow CRM इसी परेशानी को खत्म करता है। हमारा वॉइस AI कॉल समाप्त होते ही स्वतः Salesforce में नोट्स, एक्शन आइटम्स और पाइपलाइन स्टेज अपडेट कर देता है।', 65, '01:05'),
    (call1_id, new_ws_id, 'customer', 'Vikramaditya Sharma', 'अरे वाह! कल दोपहर 3 बजे डेमो शेड्यूल कर सकते हैं?', 88, '01:28'),
    (call1_id, new_ws_id, 'ai', 'VoiceSell AI (Aria)', 'बिल्कुल विक्रम जी! मैंने आपके ईमेल vikram@finapex.co पर कैलेंडर इनवाइट भेज दिया है। कल मिलते हैं!', 105, '01:45');

  insert into public.call_summaries (
    call_session_id, workspace_id, executive_summary, customer_sentiment,
    objections_summary, requirements_summary, next_steps_summary, confidence_score
  ) values (
    call1_id, new_ws_id,
    'Customer confirmed high friction with manual CRM data entry for 25 SDRs. Displayed strong interest in multilingual voice transcription and bidirectional Salesforce sync. Successfully booked a live enterprise demo for tomorrow at 3:00 PM IST.',
    'Positive',
    '["Salesforce manual entry fatigue", "Regional dialect barrier"]'::jsonb,
    '["Salesforce bidirectional sync", "Hinglish voice model"]'::jsonb,
    '["Calendar invite dispatched to vikram@finapex.co", "Deal assigned to Enterprise AE"]'::jsonb,
    96
  );

  insert into public.call_recordings (
    call_session_id, workspace_id, storage_bucket, storage_path, duration_seconds, file_size_bytes, mime_type
  ) values (
    call1_id, new_ws_id, 'call-recordings', new_ws_id || '/call-101.wav', 274, 2184000, 'audio/wav'
  );

  insert into public.recording_consents (
    call_session_id, lead_id, workspace_id, consent_given, consent_text, ip_address
  ) values (
    call1_id, lead1_id, new_ws_id, true,
    'This call may be monitored and recorded by VoiceSell AI for quality assurance and automated meeting notes. Do you agree to proceed?',
    '103.21.124.8'
  );

  -- 8. Seed Second Call (Telugu)
  insert into public.call_sessions (
    workspace_id, lead_id, product_id, customer_name, customer_email,
    customer_phone, product_name, duration_seconds, call_status, selected_language,
    consent_status, recording_storage_path, customer_requirements, objections,
    next_steps, sales_status, ai_score, sentiment
  ) values (
    new_ws_id, lead2_id, prod2_id,
    'Kavya Sree Reddy', 'kavya.reddy@cyientrix.io', '+91 94408 77123',
    'CloudPulse APM', 312, 'Completed', 'Telugu', true,
    new_ws_id || '/call-102.wav',
    '["eBPF zero-overhead proof of concept", "Cost comparison calculator vs Datadog", "Kubernetes Helm chart deployment"]'::jsonb,
    '["High Datadog switching costs", "Kernel-level overhead concerns"]'::jsonb,
    '["Invite sent for Thursday 11:00 AM", "Sent eBPF benchmark whitepaper to DevOps team"]'::jsonb,
    'Demo Requested', 92, 'Positive'
  ) returning id into call2_id;

  insert into public.call_messages (call_session_id, workspace_id, speaker, speaker_name, text, timestamp_offset_seconds, formatted_time)
  values
    (call2_id, new_ws_id, 'ai', 'VoiceSell AI (Aria)', 'నమస్కారం కావ్య గారు! నేను CloudPulse APM నుండి Aria మాట్లాడుతున్నాను. మీ కుబెర్నెటిస్ క్లస్టర్ల అబ్జర్వబిలిటీ గురించి ఒక నిమిషం మాట్లాడవచ్చా?', 4, '00:04'),
    (call2_id, new_ws_id, 'customer', 'Kavya Sree Reddy', 'నమస్కారం అండీ. అవును చెప్పండి, మా టీమ్ ప్రస్తుతం హై లేటెన్సీ ఇష్యూస్ ఫేస్ చేస్తోంది.', 19, '00:19'),
    (call2_id, new_ws_id, 'ai', 'VoiceSell AI (Aria)', 'CloudPulse లో eBPF టెక్నాలజీ ద్వారా జీరో CPU ఓవర్‌హెడ్‌తో ప్రతి ప్యాకెట్ ట్రేస్ చేయవచ్చు. గురువారం 11 గంటలకు టెక్నికల్ డెమో సెట్ చేయమంటారా?', 38, '00:38'),
    (call2_id, new_ws_id, 'customer', 'Kavya Sree Reddy', 'సరే అండీ, గురువారం 11 గంటలకి డెమో పంపండి. కలుద్దాం.', 60, '01:00'),
    (call2_id, new_ws_id, 'ai', 'VoiceSell AI (Aria)', 'ధన్యవాదాలు కావ్య గారు! ఇన్విటేషన్ పంపించాను. హావ్ ఏ గ్రేట్ డే!', 75, '01:15');

  insert into public.call_summaries (
    call_session_id, workspace_id, executive_summary, customer_sentiment,
    objections_summary, requirements_summary, next_steps_summary, confidence_score
  ) values (
    call2_id, new_ws_id,
    'Prospect experiences recurring Kubernetes latency spikes and high Datadog expenditure on 80 nodes. Convinced of eBPF kernel tracing efficiency. Scheduled technical architecture evaluation for Thursday 11:00 AM IST with DevOps team.',
    'Positive',
    '["Datadog incumbent lock-in"]'::jsonb,
    '["Kubernetes Helm chart deployment"]'::jsonb,
    '["Invite sent for Thursday 11:00 AM IST"]'::jsonb,
    92
  );

  insert into public.call_recordings (
    call_session_id, workspace_id, storage_bucket, storage_path, duration_seconds, file_size_bytes, mime_type
  ) values (
    call2_id, new_ws_id, 'call-recordings', new_ws_id || '/call-102.wav', 312, 2496000, 'audio/wav'
  );

  return new_ws_id;
end;
$$;
