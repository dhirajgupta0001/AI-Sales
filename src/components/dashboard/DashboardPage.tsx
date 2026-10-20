import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../common/StatusBadge';
import { formatDuration } from '../../utils/cn';
import {
  PhoneCall,
  CheckCircle2,
  Users,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Play,
  Volume2,
  X,
  FileText
} from 'lucide-react';
import {
  DASHBOARD_METRICS,
  CONVERSION_TREND_DATA,
  SALES_STATUS_DISTRIBUTION,
  RECENT_ACTIVITY_FEED,
} from '../../data/mockData';
import { CallRecord } from '../../types';

export const DashboardPage: React.FC = () => {
  const { calls, products, setCurrentTab, setSelectedCallId, startCallWithLead, leads } = useApp();
  const { showToast } = useToast();
  const [trendRange, setTrendRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedCallForModal, setSelectedCallForModal] = useState<CallRecord | null>(null);

  // Top metric cards
  const stats = [
    {
      label: 'Total Calls',
      value: DASHBOARD_METRICS.totalCalls.toLocaleString(),
      subtext: '+18.4% vs last month',
      icon: PhoneCall,
      color: 'indigo',
      glow: 'shadow-indigo-500/10 border-indigo-500/20',
      badge: 'All Engines',
    },
    {
      label: 'Completed Calls',
      value: DASHBOARD_METRICS.completedCalls.toLocaleString(),
      subtext: '89.6% completion rate',
      icon: CheckCircle2,
      color: 'emerald',
      glow: 'shadow-emerald-500/10 border-emerald-500/20',
      badge: '98% Voice Quality',
    },
    {
      label: 'Interested Leads',
      value: DASHBOARD_METRICS.interestedLeads.toLocaleString(),
      subtext: 'High purchase intent',
      icon: Users,
      color: 'violet',
      glow: 'shadow-violet-500/10 border-violet-500/20',
      badge: 'Ready to Close',
    },
    {
      label: 'Conversions',
      value: DASHBOARD_METRICS.conversions.toLocaleString(),
      subtext: '$894k pipeline influenced',
      icon: TrendingUp,
      color: 'cyan',
      glow: 'shadow-cyan-500/10 border-cyan-500/20',
      badge: 'Closed Won',
    },
    {
      label: 'Conversion Rate',
      value: `${DASHBOARD_METRICS.conversionRate}%`,
      subtext: '+4.2% higher than human SDRs',
      icon: Sparkles,
      color: 'amber',
      glow: 'shadow-amber-500/10 border-amber-500/20',
      badge: 'Top Decile',
    },
    {
      label: 'Avg Call Duration',
      value: formatDuration(DASHBOARD_METRICS.averageCallDurationSec),
      subtext: 'Natural pacing & rapport',
      icon: Clock,
      color: 'rose',
      glow: 'shadow-rose-500/10 border-rose-500/20',
      badge: 'Optimized',
    },
  ];

  const recentCalls = calls.slice(0, 5);

  const handleInspectCall = (call: CallRecord) => {
    setSelectedCallId(call.id);
    setCurrentTab('call-history');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-[#0E1635] to-[#121139] border border-indigo-500/20 p-6 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-400">
                Autonomous Revenue Intelligence
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-xs text-slate-400">Multilingual Fleet Active</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              VoiceSell AI Revenue Operations Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time telemetry from autonomous voice sales agents qualifying prospects, overcoming objections in 8 languages, and booking enterprise demos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('live-call')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Launch Live Call</span>
            </button>
            <button
              onClick={() => setCurrentTab('call-history')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <span>View Recordings</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`rounded-2xl bg-[#0B132B]/80 backdrop-blur-md border p-4 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/40 shadow-lg ${stat.glow}`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {stat.badge}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-white mt-0.5 tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-emerald-400 font-medium mt-1 truncate">
                  {stat.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Conversion Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Sales Conversion & Call Velocity
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of inbound/outbound calls against generated conversions
              </p>
            </div>
            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTrendRange(range);
                    showToast('Chart Range Filter', `Updated conversion trends for last ${range}.`, 'info');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    trendRange === range
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom SVG Interactive Bar / Trend Chart */}
          <div className="py-6">
            <div className="h-64 w-full flex items-end justify-between gap-3 px-2">
              {CONVERSION_TREND_DATA.map((item, i) => {
                const maxCalls = 350;
                const callsHeight = Math.round((item.calls / maxCalls) * 100);
                const convHeight = Math.round((item.conversions / maxCalls) * 100 * 2.5);
                const interestedHeight = Math.round((item.interested / maxCalls) * 100 * 1.5);

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-full flex items-end justify-center gap-1 h-52 relative">
                      {/* Hover Tooltip */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 p-1.5 rounded-lg text-[10px] text-slate-200 shadow-2xl pointer-events-none whitespace-nowrap z-20">
                        <div className="font-bold text-white">{item.date} Overview</div>
                        <div className="text-indigo-400">Calls: {item.calls}</div>
                        <div className="text-violet-400">Interested: {item.interested}</div>
                        <div className="text-emerald-400">Conversions: {item.conversions}</div>
                      </div>

                      {/* Total Calls Bar */}
                      <div
                        className="w-1/3 rounded-t-lg bg-slate-700/60 group-hover:bg-slate-600 transition-all"
                        style={{ height: `${callsHeight}%` }}
                      />
                      {/* Interested Bar */}
                      <div
                        className="w-1/3 rounded-t-lg bg-indigo-500/70 group-hover:bg-indigo-500 transition-all"
                        style={{ height: `${interestedHeight}%` }}
                      />
                      {/* Conversions Bar */}
                      <div
                        className="w-1/3 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        style={{ height: `${convHeight}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-600" />
                <span className="text-slate-300">Total Calls Dialed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-500" />
                <span className="text-slate-300">Interested Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-300 font-semibold text-emerald-400">
                  Closed Conversions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Status Distribution Chart */}
        <div className="rounded-2xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Sales Status Breakdown
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">1,482 Total</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Proportional distribution across all standardized qualification stages.
            </p>

            {/* Visual stacked percentage bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex my-4 bg-slate-800 border border-slate-700/50">
              {SALES_STATUS_DISTRIBUTION.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                  title={`${item.status}: ${item.percentage}%`}
                  className="h-full transition-all hover:opacity-85"
                />
              ))}
            </div>

            {/* List breakdown */}
            <div className="space-y-2.5 mt-4">
              {SALES_STATUS_DISTRIBUTION.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/60 transition-colors border border-slate-800/50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-200">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-400">{item.count} calls</span>
                    <span className="font-semibold text-slate-200 w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Model: GPT-4o + ElevenLabs</span>
            <span className="text-emerald-400 font-medium">99.4% Disposition Accuracy</span>
          </div>
        </div>
      </div>

      {/* Lower Row: Recent Calls Table & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls Table */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Recent Voice Conversations</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Latest live calls handled by autonomous Voice SDR agents
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('call-history')}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>View All ({calls.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-2">Customer & Company</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Language</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">AI Score</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCallForModal(call)}
                  >
                    <td className="py-3 pl-2">
                      <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {call.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400">{call.customerEmail}</div>
                    </td>
                    <td className="py-3 text-slate-300 font-medium">{call.productName}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono">
                        {call.language}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {formatDuration(call.durationSeconds)}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={call.status} size="sm" />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              call.aiScore >= 85
                                ? 'bg-emerald-400'
                                : call.aiScore >= 70
                                ? 'bg-indigo-400'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${call.aiScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          {call.aiScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectCall(call);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-all"
                        title="View Full Call Record & Audio"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-2xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Live Activity Feed</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="mt-4 space-y-4">
              {RECENT_ACTIVITY_FEED.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-100 truncate">
                        {activity.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {activity.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${activity.badgeColor}`}
                      >
                        {activity.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              showToast('Feed Refreshed', 'Synced latest AI agent telemetry.', 'success');
            }}
            className="w-full mt-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors text-center"
          >
            Refresh Event Telemetry
          </button>
        </div>
      </div>

      {/* Quick Call Preview Modal */}
      {selectedCallForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {selectedCallForModal.customerName}
                  </h3>
                  <StatusBadge status={selectedCallForModal.status} size="sm" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Product: {selectedCallForModal.productName} • Language: {selectedCallForModal.language} • Duration: {formatDuration(selectedCallForModal.durationSeconds)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCallForModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-96 overflow-y-auto pr-1">
              {/* AI Summary */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Executive Summary</span>
                </div>
                <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                  {selectedCallForModal.aiSummary}
                </p>
              </div>

              {/* Requirements & Next Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">
                    Requirements Identified
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {selectedCallForModal.customerRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">
                    Automated Next Steps
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-emerald-400">
                    {selectedCallForModal.nextSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sample Transcript Excerpt */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Transcript Excerpt
                </span>
                <div className="space-y-2">
                  {selectedCallForModal.transcript.slice(0, 3).map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-xl text-xs ${
                        msg.speaker === 'ai'
                          ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-100'
                          : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1 text-[11px] text-slate-400">
                        <span>{msg.speakerName}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Score: <strong className="text-white">{selectedCallForModal.aiScore}/100</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCallForModal(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const id = selectedCallForModal.id;
                    setSelectedCallForModal(null);
                    setSelectedCallId(id);
                    setCurrentTab('call-history');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Full Call & Audio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
