# VoiceSell AI — Supabase Integration & Architecture Guide

This guide details the complete Supabase backend integration for **VoiceSell AI**, including authentication, database persistence across 12 relational tables, Row Level Security (RLS) tenant isolation, and private audio recording file storage with signed URLs.

---

## 1. Quick Setup & Configuration

### Option A: Via `.env` File (Recommended)
1. In the project root, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate your Supabase project credentials (found under **Project Settings > API**):
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Restart the Vite development server:
   ```bash
   npm run dev
   ```

### Option B: Runtime In-App Configuration
If you don't wish to edit `.env` immediately, open the application in your browser and click **"Configure Supabase Credentials"** on the sign-in screen, or go to **Settings > Supabase & RLS Health**. Enter your Project URL and Public Anon Key. The application stores this securely in browser local storage and initializes the client immediately.

> **Security Note:** Never expose the `service_role` secret key in frontend code. VoiceSell AI strictly utilizes the public `anon` key alongside PostgreSQL Row Level Security to verify all operations.

---

## 2. Database Schema & Migrations

The full migration script is located at:
[`supabase/migrations/20261020000000_init_voicesell_schema.sql`](file:///Users/dhirajgupta/Developer/Projects/ai_voice_bot/supabase/migrations/20261020000000_init_voicesell_schema.sql)

### How to Apply the Migration
1. Go to your **Supabase Dashboard**.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Click **New Query**, paste the contents of `20261020000000_init_voicesell_schema.sql`, and click **Run**.

---

## 3. Relational Tables Implemented

| Table Name | Description | Key Relationships & Fields |
|---|---|---|
| `workspaces` | Multi-tenant tenant accounts | `id`, `name`, `tier`, `calls_limit`, `calls_used`, `minutes_limit`, `minutes_used`, `timezone` |
| `workspace_members` | Tenant membership & RBAC | `workspace_id`, `user_id`, `role` (`owner`, `admin`, `sales_rep`, `viewer`) |
| `products` | SaaS products to sell | `workspace_id`, `name`, `sales_pitch`, `pricing` (JSONB), `features`, `tone`, `ai_instructions` |
| `product_faqs` | Knowledge base Q&A | `product_id`, `workspace_id`, `question`, `answer`, `display_order` |
| `leads` | Sales pipeline prospects | `workspace_id`, `name`, `company`, `email`, `phone`, `sales_status`, `deal_value` |
| `call_sessions` | Complete voice sessions | `workspace_id`, `lead_id`, `product_id`, `start_time`, `end_time`, `duration_seconds`, `call_status`, `selected_language`, `consent_status`, `recording_storage_path`, `sales_status`, `ai_score` |
| `call_messages` | Real-time transcript turns | `call_session_id`, `workspace_id`, `speaker` (`ai`, `customer`), `speaker_name`, `text`, `timestamp_offset_seconds` |
| `call_recordings` | Encrypted audio files | `call_session_id`, `workspace_id`, `storage_bucket`, `storage_path`, `duration_seconds`, `file_size_bytes` |
| `call_summaries` | AI analysis & next steps | `call_session_id`, `workspace_id`, `executive_summary`, `customer_sentiment`, `objections_summary`, `next_steps_summary` |
| `follow_up_tasks` | Automated AE action items | `call_session_id`, `lead_id`, `workspace_id`, `title`, `due_date`, `status`, `priority` |
| `agent_settings` | Voice SDR personality | `workspace_id`, `agent_name`, `voice_preference`, `sales_approach`, `opening_greeting`, `conversation_rules` |
| `recording_consents` | Two-party consent audit | `call_session_id`, `lead_id`, `workspace_id`, `consent_given`, `consent_text`, `consent_timestamp` |

---

## 4. Sales Status Constraint
Enforced via PostgreSQL enum `public.sales_status_enum`:
- `Converted`
- `Interested`
- `Follow-up Required`
- `Not Interested`
- `Demo Requested`
- `No Response`

---

## 5. Row Level Security (RLS) & Tenant Isolation

Row Level Security is enabled on **all 12 tables**. Data isolation is governed by two security definer helper functions:

```sql
-- Checks if the authenticated caller belongs to the requested workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Returns all workspace IDs authorized for the authenticated user
create or replace function public.get_user_workspace_ids()
returns setof uuid language sql security definer stable as $$
  select workspace_id from public.workspace_members
  where user_id = auth.uid();
$$;
```

---

## 6. Private File Storage for Call Recordings

1. **Private Bucket**: `call-recordings` is created with `public = false`.
2. **Storage Path Convention**: `<workspace_id>/<call_session_id>.wav`.
3. **Storage Access Policies**:
   - `SELECT`: Only users who are members of `<workspace_id>` can read the object.
   - `INSERT`: Only authenticated workspace members can write objects to their tenant folder.
4. **Signed URLs**: The frontend generates 60-minute signed URLs via `supabase.storage.from('call-recordings').createSignedUrl(path, 3600)`.

---

## 7. Automatic Workspace Provisioning & Seed Data

When a user signs up, the RPC function `public.provision_workspace_with_seed(ws_name)` executes automatically:
- Creates the user's isolated workspace.
- Sets the user as the `owner` in `workspace_members`.
- Seeds the initial AI agent configuration (`Aria`).
- Seeds 4 realistic SaaS products (`OmniFlow CRM`, `CloudPulse APM`, `Securify Zero-Trust`, `DevSprint AI`) with full objection-handling playbooks.
- Seeds realistic leads and multilingual call transcripts in **Hindi**, **Telugu**, and **English**.
