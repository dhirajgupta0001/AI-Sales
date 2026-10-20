import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get credentials from environment or localStorage for runtime onboarding
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('voicesell_supabase_url') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('voicesell_supabase_key') : null;

  const url = (envUrl && !envUrl.includes('your-project-id')) ? envUrl : storedUrl || '';
  const key = (envKey && !envKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) ? envKey : storedKey || '';

  const isConfigured = Boolean(url && key && url.startsWith('http'));

  return { url, key, isConfigured };
};

export const saveRuntimeSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('voicesell_supabase_url', url.trim());
    localStorage.setItem('voicesell_supabase_key', key.trim());
  }
};

export const clearRuntimeSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('voicesell_supabase_url');
    localStorage.removeItem('voicesell_supabase_key');
  }
};

// Initialize Supabase Client
const { url, key } = getSupabaseConfig();

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

/**
 * Generates a short-lived signed URL for private recording playback
 * The URL expires after 60 minutes (3600 seconds)
 */
export async function getRecordingSignedUrl(storagePath: string): Promise<string | null> {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured || !storagePath) return null;

  try {
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .createSignedUrl(storagePath, 3600);

    if (error) {
      console.warn('Could not generate signed recording URL:', error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.warn('Storage signed URL error:', err);
    return null;
  }
}

/**
 * Uploads a call recording file to the private storage bucket
 */
export async function uploadRecordingFile(
  workspaceId: string,
  sessionId: string,
  audioBlob: Blob | File
): Promise<string | null> {
  const { isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const path = `${workspaceId}/${sessionId}.wav`;

  try {
    const { data, error } = await supabase.storage
      .from('call-recordings')
      .upload(path, audioBlob, {
        contentType: 'audio/wav',
        upsert: true,
      });

    if (error) {
      console.warn('Storage upload error:', error.message);
      return null;
    }

    return data?.path || path;
  } catch (err) {
    console.warn('Recording file upload exception:', err);
    return null;
  }
}
