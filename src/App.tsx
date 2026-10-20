import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { LiveCallPage } from './components/live-call/LiveCallPage';
import { ProductsPage } from './components/products/ProductsPage';
import { LeadsPage } from './components/leads/LeadsPage';
import { CallHistoryPage } from './components/calls/CallHistoryPage';
import { AgentSettingsPage } from './components/agent-settings/AgentSettingsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { Mic2, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { currentTab, isLoadingData } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Loading state during auth check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070C1A] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4 animate-pulse">
          <Mic2 className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Connecting to VoiceSell AI Fleet & Workspace...</span>
        </div>
      </div>
    );
  }

  // Protected route check: if user is not authenticated, render AuthPage
  if (!user) {
    return <AuthPage />;
  }

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'live-call':
        return <LiveCallPage />;
      case 'products':
        return <ProductsPage />;
      case 'leads':
        return <LeadsPage />;
      case 'call-history':
        return <CallHistoryPage />;
      case 'agent-settings':
        return <AgentSettingsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070C1A] text-slate-100 flex">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (offset by 72 on lg screens) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Top Navigation Bar */}
        <TopNavbar onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

        {/* Global database loading banner if syncing */}
        {isLoadingData && (
          <div className="bg-indigo-950/80 border-b border-indigo-500/20 px-6 py-1.5 flex items-center justify-between text-xs text-indigo-300">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Syncing workspace database tables from Supabase...</span>
            </span>
          </div>
        )}

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
