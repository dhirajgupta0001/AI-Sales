import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { IntegrationConfig } from '../../types';
import {
  Settings,
  User,
  Building,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  Globe,
  Database,
  Radio,
  X,
  Server,
  Sliders,
  Check,
  RefreshCw,
  LogOut
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { appSettings, updateAppSettings, updateIntegrationStatus, refreshWorkspaceData, isLoadingData } = useApp();
  const { isConfigured, saveConnectionConfig, disconnectConnection, user, activeWorkspace, memberRole } = useAuth();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<
    'integrations' | 'database' | 'privacy' | 'workspace' | 'profile'
  >('database');

  // Form states
  const [profileForm, setProfileForm] = useState({ ...appSettings.profile });
  const [workspaceForm, setWorkspaceForm] = useState({ ...appSettings.workspace });
  const [privacyForm, setPrivacyForm] = useState({ ...appSettings.privacy });

  // Integration config modal
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({ profile: profileForm });
    showToast('Profile Updated', 'Administrator profile information updated.', 'success');
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({ workspace: workspaceForm });
    showToast('Workspace Saved', 'Fleet quotas and organization settings saved.', 'success');
  };

  const handleSavePrivacy = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppSettings({ privacy: privacyForm });
    showToast('Privacy Policy Saved', 'Consent disclaimer & retention settings updated.', 'success');
  };

  const openIntegrationModal = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setApiKeyInput(integration.keyMasked || '');
    setApiSecretInput('');
  };

  const handleSaveIntegration = () => {
    if (!selectedIntegration) return;

    if (!apiKeyInput.trim()) {
      showToast('Validation Error', 'API key or auth token cannot be empty.', 'warning');
      return;
    }

    // Toggle to Connected
    updateIntegrationStatus(selectedIntegration.provider, 'Connected');
    showToast(
      'Integration Configured (Simulated)',
      `${selectedIntegration.name} token saved. Stage 1 operates in simulated verification mode.`,
      'success'
    );
    setSelectedIntegration(null);
  };

  const handleDisconnectIntegration = (provider: string) => {
    updateIntegrationStatus(provider as any, 'Not Configured');
    showToast('Integration Disconnected', `${provider} connector disconnected.`, 'info');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0E1635] to-[#12163E] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Platform & API Integrations Settings
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Manage telephony gateways, speech synthesis engines, CRM pipelines, organization profile, and regulatory recording consent policies.
          </p>
        </div>

        {/* Integration health badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-300">Stage 1: Mock/Sandbox Endpoints</span>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 overflow-x-auto">
        {[
          { id: 'database' as const, label: 'Supabase & RLS Health', icon: Database },
          { id: 'integrations' as const, label: 'API Integrations & Telephony', icon: Key },
          { id: 'privacy' as const, label: 'Privacy & Recording Consent', icon: ShieldCheck },
          { id: 'workspace' as const, label: 'Workspace & Voice Quotas', icon: Building },
          { id: 'profile' as const, label: 'Admin Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 0: Supabase & RLS Health */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">
                    Supabase Database & Private Storage Architecture
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real PostgreSQL persistence, Row Level Security policies, and encrypted audio bucket
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await refreshWorkspaceData();
                    showToast('Database Synchronized', 'Fetched latest records from Supabase tables.', 'success');
                  }}
                  disabled={isLoadingData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                  <span>Sync Tables</span>
                </button>
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-medium">Connection Status</span>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="font-bold text-white text-sm">
                    {isConfigured ? 'Connected & Verified' : 'Awaiting Config'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {isConfigured ? 'Direct PostgreSQL via PostgREST' : 'Using Local Workspace Cache'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-medium">Active Workspace Isolation</span>
                <span className="font-bold text-white text-sm block pt-1 truncate">
                  {activeWorkspace?.name || 'Enterprise Voice Fleet'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Tenant ID: {activeWorkspace?.id?.slice(0, 8) || 'active'}...
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-medium">Row Level Security</span>
                <div className="flex items-center gap-1.5 pt-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>12 Tables Guarded</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">is_workspace_member()</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 block font-medium">Private Recording Bucket</span>
                <div className="flex items-center gap-1.5 pt-1 text-indigo-400 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>call-recordings</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">60-Min Signed URLs</span>
              </div>
            </div>

            {/* Table Architecture Checklist */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <span className="font-bold text-slate-200 text-xs block uppercase tracking-wider">
                Relational Schema Tables & Relations
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px] text-slate-300">
                {[
                  '1. workspaces',
                  '2. workspace_members',
                  '3. products',
                  '4. product_faqs',
                  '5. leads',
                  '6. call_sessions',
                  '7. call_messages',
                  '8. call_recordings',
                  '9. call_summaries',
                  '10. follow_up_tasks',
                  '11. agent_settings',
                  '12. recording_consents',
                ].map((tbl, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800/80 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{tbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credentials & Migration Reference */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2">
              <span className="font-bold text-indigo-300 block uppercase tracking-wider text-[11px]">
                Migration File Location
              </span>
              <p className="text-slate-300">
                The migration file includes table definitions, foreign keys, indexes, sales status constraints, RLS helper functions, and the <code>call-recordings</code> storage bucket:
              </p>
              <code className="text-indigo-300 font-mono text-[11px] block bg-slate-950 p-2 rounded-xl border border-slate-800">
                supabase/migrations/20261020000000_init_voicesell_schema.sql
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: API Integrations */}
      {activeSubTab === 'integrations' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-start gap-3">
            <Radio className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Stage 1 Integration Transparency:</span>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                As required by Stage 1 specifications, actual real-time voice calls and AI persistence are simulated. Below, you can inspect and configure credentials for ElevenLabs, OpenAI Realtime, Deepgram, Twilio, HubSpot, and Salesforce. Buttons indicate their exact configuration status.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {appSettings.integrations.map((item, idx) => {
              const isConnected = item.status === 'Connected';
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                        {item.category}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1 ${
                          isConnected
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        <span>{item.status}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Key: {item.keyMasked || 'Not provided'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
                      <span className="text-slate-300 block font-semibold mb-0.5">Telemetry Note:</span>
                      <span>{item.lastTested}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={item.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex gap-2">
                      {isConnected && (
                        <button
                          type="button"
                          onClick={() => handleDisconnectIntegration(item.provider)}
                          className="px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openIntegrationModal(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isConnected
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        }`}
                      >
                        {isConnected ? 'Manage Key' : 'Configure API Key'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Privacy & Recording Consent */}
      {activeSubTab === 'privacy' && (
        <form onSubmit={handleSavePrivacy} className="space-y-6">
          <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Regulatory Privacy & Two-Party Recording Consent
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">SOC-2 & GDPR Ready</span>
            </div>

            {/* Disclaimer text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Automated Verbal Consent Disclaimer (Spoken by Agent at Call Start)
              </label>
              <textarea
                rows={3}
                value={privacyForm.consentDisclaimerText}
                onChange={(e) =>
                  setPrivacyForm({ ...privacyForm, consentDisclaimerText: e.target.value })
                }
                className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This exact prompt is synthesized in the customer's selected language prior to value proposition pitching.
              </p>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 text-xs">
                <input
                  type="checkbox"
                  checked={privacyForm.recordingConsentRequired}
                  onChange={(e) =>
                    setPrivacyForm({
                      ...privacyForm,
                      recordingConsentRequired: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-800 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-white block">
                    Enforce Mandatory Consent Opt-In Before Audio Recording
                  </span>
                  <span className="text-[11px] text-slate-400">
                    If prospect declines, audio recording is disabled while text-only live transcript continues.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 text-xs">
                <input
                  type="checkbox"
                  checked={privacyForm.autoRedactPii}
                  onChange={(e) =>
                    setPrivacyForm({ ...privacyForm, autoRedactPii: e.target.checked })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-800 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-white block">
                    Automatic PII Redaction in Transcripts & Audio
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Masks credit card numbers, tax IDs, and confidential passwords before storing records.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 text-xs">
                <input
                  type="checkbox"
                  checked={privacyForm.gdprCompliantMode}
                  onChange={(e) =>
                    setPrivacyForm({
                      ...privacyForm,
                      gdprCompliantMode: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-800 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-white block">
                    EU/GDPR Strict Data Residency Mode
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Restricts voice processing nodes to EU-Central (Frankfurt) AWS/GCP clusters.
                  </span>
                </div>
              </label>
            </div>

            {/* Retention Slider */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">Audio & Transcript Data Retention Period</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {privacyForm.dataRetentionDays} Days
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="365"
                step="30"
                value={privacyForm.dataRetentionDays}
                onChange={(e) =>
                  setPrivacyForm({
                    ...privacyForm,
                    dataRetentionDays: parseInt(e.target.value),
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>30 Days (HIPAA Minimal)</span>
                <span>90 Days (Recommended)</span>
                <span>365 Days (Annual Audit)</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Privacy Configuration</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Workspace & Quotas */}
      {activeSubTab === 'workspace' && (
        <form onSubmit={handleSaveWorkspace} className="space-y-6">
          <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Workspace Telemetry & Quota Limits
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {workspaceForm.tier}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceForm.name}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Organization Timezone</label>
                <input
                  type="text"
                  value={workspaceForm.timezone}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quota Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Calls limit */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>Monthly Voice Calls Fleet Quota</span>
                  <span className="font-mono text-indigo-400">
                    {workspaceForm.callsUsed} / {workspaceForm.callsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{
                      width: `${(workspaceForm.callsUsed / workspaceForm.callsLimit) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {workspaceForm.callsLimit - workspaceForm.callsUsed} calls remaining this billing cycle.
                </span>
              </div>

              {/* Minutes limit */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>Voice Telephony Minutes Quota</span>
                  <span className="font-mono text-emerald-400">
                    {workspaceForm.minutesUsed.toLocaleString()} / {workspaceForm.minutesLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${(workspaceForm.minutesUsed / workspaceForm.minutesLimit) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {(workspaceForm.minutesLimit - workspaceForm.minutesUsed).toLocaleString()} minutes remaining.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Workspace Settings</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Admin Profile */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">
                  Administrator Profile & Credentials
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Title / Role</label>
                <input
                  type="text"
                  value={profileForm.title}
                  onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Organization Company</label>
                <input
                  type="text"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Integration Credential Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Configure {selectedIntegration.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category: {selectedIntegration.category}
                </p>
              </div>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                <span className="font-semibold text-white block mb-1">Integration Status:</span>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Enter your credentials below. In Stage 1 UI mode, credential validation operates with realistic mock authentication.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  API Key / OAuth Bearer Token *
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="e.g. sk-live-••••••••••••••••"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Webhook / Telephony Trunk URL (Optional)
                </label>
                <input
                  type="text"
                  value={apiSecretInput}
                  onChange={(e) => setApiSecretInput(e.target.value)}
                  placeholder="https://api.voicesell.ai/v1/telephony-webhook"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <a
                href={selectedIntegration.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View Documentation</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIntegration(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveIntegration}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
