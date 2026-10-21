-- =========================================================================
-- VoiceSell AI — Data Retention, Secure Deletion & Storage Hardening
-- Migration: 20261020000003_retention_and_security_hardening.sql
-- Description: Adds storage delete policy for workspace members, automated
--              retention purge RPC, and workspace-scoped session deletion.
-- =========================================================================

-- 1. Storage Object Policy: Allow workspace members to delete recordings
create policy "Workspace members can delete call recordings"
  on storage.objects for delete
  using (
    bucket_id = 'call-recordings'
    and auth.uid() is not null
    and public.is_workspace_member(cast(split_part(name, '/', 1) as uuid))
  );

-- 2. Data Retention Purge RPC (Invoked by Workspace Admins or Scheduled Jobs)
-- Purges call sessions and related data older than the specified retention threshold
create or replace function public.purge_expired_call_records(retention_days integer default 90)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  purged_count integer := 0;
  retention_interval interval;
  user_ws_ids uuid[];
begin
  -- Enforce minimum retention threshold of 7 days to prevent accidental mass deletion
  if retention_days < 7 then
    raise exception 'Data retention period cannot be less than 7 days.';
  end if;

  retention_interval := (retention_days || ' days')::interval;

  -- Collect workspace IDs current user has owner/admin membership for
  select array_agg(workspace_id) into user_ws_ids
  from public.workspace_members
  where user_id = auth.uid()
    and role in ('owner', 'admin');

  if user_ws_ids is null or array_length(user_ws_ids, 1) = 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'Unauthorized. Only workspace owners and admins can execute data retention purges.',
      'purged_count', 0
    );
  end if;

  -- Delete expired call sessions (foreign keys cascade to messages, summaries, recordings)
  with deleted as (
    delete from public.call_sessions
    where workspace_id = any(user_ws_ids)
      and start_time < (now() - retention_interval)
    returning id
  )
  select count(*) into purged_count from deleted;

  return jsonb_build_object(
    'success', true,
    'purged_count', purged_count,
    'retention_days', retention_days,
    'purged_at', now()
  );
end;
$$;

-- 3. Secure Individual Call Deletion Function
create or replace function public.delete_call_session(call_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_ws_id uuid;
begin
  select workspace_id into target_ws_id
  from public.call_sessions
  where id = call_id;

  if target_ws_id is null then
    return false;
  end if;

  -- Verify caller is a member of the workspace
  if not public.is_workspace_member(target_ws_id) then
    raise exception 'Unauthorized to delete call session outside of your workspace.';
  end if;

  delete from public.call_sessions where id = call_id;
  return true;
end;
$$;
