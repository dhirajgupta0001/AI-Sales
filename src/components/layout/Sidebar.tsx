import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Mic2,
  Package,
  Users,
  PhoneCall,
  Sliders,
  Settings,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  Building,
  LogOut,
  ListTodo
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { currentTab, setCurrentTab, appSettings, followUpTasks } = useApp();
  const { user, activeWorkspace, memberRole, signOut } = useAuth();

  const pendingTasksCount = followUpTasks ? followUpTasks.filter((t) => t.status === 'pending').length : 0;

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'live-call',
      label: 'Live Voice Agent',
      icon: Mic2,
      badge: 'Interactive',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'products',
      label: 'SaaS Products',
      icon: Package,
    },
    {
      id: 'leads',
      label: 'Leads & Pipeline',
      icon: Users,
    },
    {
      id: 'call-history',
      label: 'Call History',
      icon: PhoneCall,
    },
    {
      id: 'tasks',
      label: 'Follow-Up Tasks',
      icon: ListTodo,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount} pending` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'agent-settings',
      label: 'AI Sales Agent',
      icon: Sliders,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    onCloseMobile();
  };

  const minutesPercent = Math.min(
    100,
    Math.round((appSettings.workspace.minutesUsed / Math.max(1, appSettings.workspace.minutesLimit)) * 100)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#090F24] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Mic2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                  VoiceSell
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Autonomous Voice SDR
              </p>
            </div>
          </div>
        </div>

        {/* Active Workspace Header Badge */}
        <div className="px-4 pt-3 pb-1">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <Building className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-slate-200 truncate">
                  {activeWorkspace?.name || 'Workspace'}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">Role: {memberRole}</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Workspace Connected" />
          </div>
        </div>

        {/* Quick Action: Start Call Button */}
        <div className="p-4 pt-2">
          <button
            onClick={() => handleNavClick('live-call')}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap className="w-4 h-4 fill-white text-white" />
            <span>Launch Live Voice Agent</span>
          </button>
        </div>

        {/* Nav list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-2 pt-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Platform Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-200 border border-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-indigo-400'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Workspace quota indicator */}
        <div className="p-4 mx-3 mb-3 rounded-xl bg-slate-900/90 border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between text-slate-300 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Voice Fleet Quota</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{minutesPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1.5 rounded-full"
              style={{ width: `${minutesPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
            <span>{appSettings.workspace.minutesUsed.toLocaleString()} mins used</span>
            <span>{appSettings.workspace.minutesLimit.toLocaleString()} total</span>
          </div>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#080D1F] flex items-center justify-between">
          <div
            onClick={() => handleNavClick('settings')}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors flex-1 min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-xs border border-indigo-400/30 shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.user_metadata?.full_name || 'Admin User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
