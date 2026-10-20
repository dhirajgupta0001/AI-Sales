import React, { useState } from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Menu,
  Search,
  Bell,
  Globe,
  Radio,
  Sparkles,
  ChevronDown,
  Info,
  CheckCircle,
  Building,
  LogOut,
  User,
  ShieldCheck,
  Plus
} from 'lucide-react';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  const { currentTab, setCurrentTab } = useApp();
  const { user, activeWorkspace, userWorkspaces, memberRole, switchWorkspace, createWorkspace, signOut } = useAuth();
  const { showToast } = useToast();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getPageTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Executive Overview', subtitle: 'Real-time sales voice intelligence & conversion analytics' };
      case 'live-call':
        return { title: 'Live Voice Agent Studio', subtitle: 'Launch real-time interactive sales conversations across languages' };
      case 'products':
        return { title: 'SaaS Products & Pitches', subtitle: 'Manage value propositions, objections, and AI sales playbooks' };
      case 'leads':
        return { title: 'Leads & Pipeline CRM', subtitle: 'Track prospect engagement, deal velocity, and call disposition' };
      case 'call-history':
        return { title: 'Call History & Recordings', subtitle: 'Inspect transcripts, audio recordings, and AI-scored summaries' };
      case 'agent-settings':
        return { title: 'AI Sales Agent Personality', subtitle: 'Tune conversation rules, voice cadence, objection logic, and booking' };
      case 'settings':
        return { title: 'Platform & API Settings', subtitle: 'Manage workspaces, telephony endpoints, LLM engines, and privacy' };
    }
  };

  const pageInfo = getPageTitle(currentTab);

  const notifications = [
    {
      id: 'n1',
      title: 'Deal Won: FinApex Tech',
      desc: 'Vikramaditya Sharma approved $18,500 annual contract via Hindi voice call.',
      time: '12m ago',
    },
    {
      id: 'n2',
      title: 'New Demo Booked',
      desc: 'Kavya Sree Reddy requested Telugu technical deep-dive on CloudPulse.',
      time: '42m ago',
    },
    {
      id: 'n3',
      title: 'Workspace Isolated',
      desc: 'Row Level Security policy confirmed for current tenant.',
      time: '3h ago',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    showToast(
      'Global Search',
      `Searching workspace for "${searchQuery}". Jumped to Leads & Pipeline.`,
      'info'
    );
    setCurrentTab('leads');
    setSearchQuery('');
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const { error } = await createWorkspace(newWsName);
    if (error) {
      showToast('Workspace Creation Error', error, 'error');
    } else {
      showToast('Workspace Created', `Switched to "${newWsName}".`, 'success');
      setShowNewWorkspaceModal(false);
      setNewWsName('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#090F24]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Mobile trigger & Page Titles */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {pageInfo.title}
              </h1>
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>RLS Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-md">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Workspace Selector */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[130px]">
                {activeWorkspace?.name || 'Workspace'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showWorkspaceMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Authorized Workspaces ({userWorkspaces.length})
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {userWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        switchWorkspace(ws.id);
                        setShowWorkspaceMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        activeWorkspace?.id === ws.id
                          ? 'bg-indigo-600/20 text-white font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {activeWorkspace?.id === ws.id && (
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowNewWorkspaceModal(true);
                    }}
                    className="w-full flex items-center gap-1.5 p-2 rounded-xl text-indigo-400 hover:bg-slate-800 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Global Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex items-center relative"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, calls, products..."
              className="w-44 xl:w-56 pl-9 pr-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/80"
            />
          </form>

          {/* Quick Start Call pill in navbar */}
          <button
            onClick={() => setCurrentTab('live-call')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
          >
            <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
            <span className="hidden sm:inline">Launch Agent</span>
            <span className="sm:hidden">Call</span>
          </button>

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-[#090F24]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">Notifications</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Live
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      showToast('Notifications Cleared', 'All read.', 'success');
                      setShowNotifications(false);
                    }}
                    className="text-[11px] text-slate-400 hover:text-indigo-400"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto mt-2 space-y-2">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowNotifications(false);
                        setCurrentTab('call-history');
                      }}
                      className="pt-2 pb-2 px-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{item.title}</span>
                        <span className="text-[10px] text-slate-400">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Account Menu with Sign Out */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                <div className="pb-3 border-b border-slate-800">
                  <p className="font-semibold text-white truncate">
                    {user?.user_metadata?.full_name || 'Admin User'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Role: {memberRole}
                    </span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setCurrentTab('settings');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowInfoModal(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Database & RLS Specs</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Create New Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleCreateWorkspace}
            className="relative w-full max-w-md rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Create New Isolated Workspace</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Each workspace maintains completely isolated Row Level Security policies, products, leads, and call recordings.
            </p>

            <div className="my-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Workspace Name *
              </label>
              <input
                type="text"
                required
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="e.g. EMEA Enterprise Fleet"
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewWorkspaceModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Provision Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RLS Architecture Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Supabase Multi-Tenant Architecture</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Real authentication, Row Level Security, and private file storage are enforced across 12 relational tables.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tenant Data Isolation:</strong> Every record is guarded by <code>is_workspace_member(workspace_id)</code> using the authenticated user's <code>auth.uid()</code>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Private File Storage:</strong> Call recordings are stored in the private <code>call-recordings</code> bucket and streamed using 60-minute signed URLs.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Sales Status Constraint:</strong> Enforced by Postgres enum: <code>Converted</code>, <code>Interested</code>, <code>Follow-up Required</code>, <code>Not Interested</code>, <code>Demo Requested</code>, <code>No Response</code>.
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
