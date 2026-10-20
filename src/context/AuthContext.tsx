import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getSupabaseConfig, saveRuntimeSupabaseConfig, clearRuntimeSupabaseConfig } from '../lib/supabase';
import { useToast } from './ToastContext';

export interface WorkspaceRecord {
  id: string;
  name: string;
  tier: string;
  calls_limit: number;
  calls_used: number;
  minutes_limit: number;
  minutes_used: number;
  timezone: string;
  currency: string;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'sales_rep' | 'viewer';
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  activeWorkspace: WorkspaceRecord | null;
  userWorkspaces: WorkspaceRecord[];
  memberRole: string;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUp: (email: string, pass: string, fullName: string, workspaceName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPass: string) => Promise<{ error: string | null }>;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (workspaceName: string) => Promise<{ error: string | null; workspaceId?: string }>;
  saveConnectionConfig: (url: string, key: string) => void;
  disconnectConnection: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceRecord | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<WorkspaceRecord[]>([]);
  const [memberRole, setMemberRole] = useState<string>('owner');
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(getSupabaseConfig().isConfigured);

  // Load user session on startup
  useEffect(() => {
    const config = getSupabaseConfig();
    setIsConfigured(config.isConfigured);

    if (!config.isConfigured) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadUserWorkspaces(currentSession.user.id);
        }
      } catch (err: any) {
        console.warn('Auth initialization warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        await loadUserWorkspaces(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setActiveWorkspace(null);
        setUserWorkspaces([]);
        setMemberRole('owner');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const loadUserWorkspaces = async (userId: string) => {
    try {
      // Fetch memberships
      const { data: members, error: memberErr } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', userId);

      if (memberErr) {
        console.warn('Could not query workspace_members:', memberErr.message);
        return;
      }

      if (members && members.length > 0) {
        const wsIds = members.map((m) => m.workspace_id);
        const { data: wsData, error: wsErr } = await supabase
          .from('workspaces')
          .select('*')
          .in('id', wsIds);

        if (wsErr) {
          console.warn('Could not query workspaces:', wsErr.message);
          return;
        }

        if (wsData && wsData.length > 0) {
          setUserWorkspaces(wsData);
          // Set active to first or restore stored
          const storedWsId = localStorage.getItem('voicesell_active_ws');
          const matched = wsData.find((w) => w.id === storedWsId) || wsData[0];
          setActiveWorkspace(matched);

          const roleMatch = members.find((m) => m.workspace_id === matched.id);
          if (roleMatch) setMemberRole(roleMatch.role);
          return;
        }
      }

      // If no workspace exists yet for this user, attempt provision via RPC
      const defaultWsName = 'Enterprise Voice Fleet';
      const { data: newWsId, error: rpcErr } = await supabase.rpc('provision_workspace_with_seed', {
        ws_name: defaultWsName,
      });

      if (!rpcErr && newWsId) {
        const { data: createdWs } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', newWsId)
          .single();

        if (createdWs) {
          setUserWorkspaces([createdWs]);
          setActiveWorkspace(createdWs);
          setMemberRole('owner');
          localStorage.setItem('voicesell_active_ws', createdWs.id);
        }
      }
    } catch (err: any) {
      console.warn('loadUserWorkspaces exception:', err);
    }
  };

  const signIn = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        await loadUserWorkspaces(data.user.id);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign-in.' };
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, workspaceName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // If user was created and session is ready, provision workspace with seed
      if (data.user) {
        try {
          const wsName = workspaceName?.trim() || `${fullName}'s Voice Fleet`;
          const { data: newWsId, error: rpcErr } = await supabase.rpc('provision_workspace_with_seed', {
            ws_name: wsName,
          });

          if (!rpcErr && newWsId) {
            await loadUserWorkspaces(data.user.id);
          }
        } catch (provErr) {
          console.warn('Workspace auto-provision notice:', provErr);
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to complete sign-up.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setActiveWorkspace(null);
    setUserWorkspaces([]);
    localStorage.removeItem('voicesell_active_ws');
    showToast('Signed Out', 'You have been safely signed out of VoiceSell AI.', 'info');
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/#reset-password`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Could not send reset password email.' };
    }
  };

  const updatePassword = async (newPass: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPass,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'Failed to update password.' };
    }
  };

  const switchWorkspace = (workspaceId: string) => {
    const matched = userWorkspaces.find((w) => w.id === workspaceId);
    if (matched) {
      setActiveWorkspace(matched);
      localStorage.setItem('voicesell_active_ws', matched.id);
      showToast('Workspace Switched', `Active workspace set to "${matched.name}".`, 'info');
    }
  };

  const createWorkspace = async (workspaceName: string) => {
    if (!user) return { error: 'Must be logged in to create a workspace.' };

    try {
      const { data: newWsId, error: rpcErr } = await supabase.rpc('provision_workspace_with_seed', {
        ws_name: workspaceName.trim(),
      });

      if (rpcErr) {
        // Fallback standard insert
        const { data: ws, error: insertErr } = await supabase
          .from('workspaces')
          .insert({ name: workspaceName.trim() })
          .select()
          .single();

        if (insertErr) return { error: insertErr.message };

        await supabase.from('workspace_members').insert({
          workspace_id: ws.id,
          user_id: user.id,
          role: 'owner',
        });

        await loadUserWorkspaces(user.id);
        return { error: null, workspaceId: ws.id };
      }

      await loadUserWorkspaces(user.id);
      return { error: null, workspaceId: newWsId };
    } catch (err: any) {
      return { error: err.message || 'Failed to create workspace.' };
    }
  };

  const saveConnectionConfig = (url: string, key: string) => {
    saveRuntimeSupabaseConfig(url, key);
    setIsConfigured(true);
    showToast('Credentials Saved', 'Supabase credentials updated. Re-authenticating...', 'success');
    window.location.reload();
  };

  const disconnectConnection = () => {
    clearRuntimeSupabaseConfig();
    setIsConfigured(false);
    setUser(null);
    setSession(null);
    setActiveWorkspace(null);
    showToast('Disconnected', 'Supabase connection cleared from browser.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        activeWorkspace,
        userWorkspaces,
        memberRole,
        isLoading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        switchWorkspace,
        createWorkspace,
        saveConnectionConfig,
        disconnectConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
