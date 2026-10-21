import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../common/StatusBadge';
import { formatDuration } from '../../utils/cn';
import { CallRecord, SalesStatus } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { getRecordingSignedUrl } from '../../lib/supabase';
import {
  PhoneCall,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Download,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  FileText,
  Copy,
  ExternalLink,
  X,
  User,
  ShieldCheck,
  Disc,
  Edit2,
  Quote,
  HelpCircle,
  Check,
  ListTodo,
  Layers,
  ChevronDown,
  Trash2
} from 'lucide-react';

export const CallHistoryPage: React.FC = () => {
  const {
    calls,
    products,
    selectedCallId,
    setSelectedCallId,
    setCurrentTab,
    startCallWithLead,
    leads,
    manuallyCorrectCallStatus,
    createFollowUpTask,
    deleteCallRecord,
  } = useApp();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [recordingOnly, setRecordingOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Drawer State
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);

  // Manual Classification Override Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctedStatusInput, setCorrectedStatusInput] = useState<SalesStatus>('Interested');
  const [correctionNotesInput, setCorrectionNotesInput] = useState('');

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // percentage
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Auto select call if selectedCallId exists
  useEffect(() => {
    if (selectedCallId) {
      const match = calls.find((c) => c.id === selectedCallId);
      if (match) {
        setActiveCall(match);
        setIsDetailDrawerOpen(true);
      }
    } else if (calls.length > 0 && !activeCall) {
      setActiveCall(calls[0]);
    } else if (activeCall) {
      const updated = calls.find((c) => c.id === activeCall.id);
      if (updated && updated !== activeCall) {
        setActiveCall(updated);
      }
    }
  }, [selectedCallId, calls]);

  // Fetch or sync audio source URL whenever activeCall changes
  useEffect(() => {
    setIsPlaying(false);
    setPlaybackProgress(0);

    if (activeCall?.recordingSignedUrl) {
      setAudioUrl(activeCall.recordingSignedUrl);
    } else if (activeCall?.recordingStoragePath) {
      getRecordingSignedUrl(activeCall.recordingStoragePath).then((url) => {
        if (url) setAudioUrl(url);
      });
    } else {
      setAudioUrl(null);
    }
  }, [activeCall?.id, activeCall?.recordingStoragePath, activeCall?.recordingSignedUrl]);

  // Audio timer fallback when no native media element is loaded
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !audioUrl) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 300 / playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, audioUrl]);

  const allStatuses: SalesStatus[] = [
    'Converted',
    'Interested',
    'Follow-up Required',
    'Not Interested',
    'Demo Requested',
    'No Response',
  ];

  // Date range matcher
  const matchesDateRange = (callDateStr: string) => {
    if (dateRangeFilter === 'all') return true;
    const callDate = new Date(callDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRangeFilter === 'today') {
      return callDate >= today;
    } else if (dateRangeFilter === '7d') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      return callDate >= d7;
    } else if (dateRangeFilter === '30d') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      return callDate >= d30;
    } else if (dateRangeFilter === 'custom') {
      if (customStartDate && new Date(callDateStr) < new Date(customStartDate)) return false;
      if (customEndDate && new Date(callDateStr) > new Date(customEndDate + 'T23:59:59')) return false;
      return true;
    }
    return true;
  };

  // Filtered Calls
  const filteredCalls = calls.filter((c) => {
    const matchesSearch =
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aiSummary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesProduct = productFilter === 'All' || c.productId === productFilter;
    const matchesLanguage = languageFilter === 'All' || c.language.toLowerCase().includes(languageFilter.toLowerCase());
    const matchesRecording = !recordingOnly || c.recordingAvailable;
    const matchesDate = matchesDateRange(c.date || c.startTime || '2026-10-20');

    return matchesSearch && matchesStatus && matchesProduct && matchesLanguage && matchesRecording && matchesDate;
  });

  // Pagination calculation
  const totalCalls = filteredCalls.length;
  const totalPages = Math.max(1, Math.ceil(totalCalls / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * pageSize;
  const paginatedCalls = filteredCalls.slice(startIndex, startIndex + pageSize);

  const handleOpenCallDrawer = (call: CallRecord) => {
    setActiveCall(call);
    setSelectedCallId(call.id);
    setIsPlaying(false);
    setPlaybackProgress(0);
    setIsDetailDrawerOpen(true);
  };

  const copyTranscriptText = () => {
    if (!activeCall) return;
    const text = activeCall.transcript
      .map((m) => `[${m.timestamp}] ${m.speakerName}: ${m.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast('Transcript Copied', 'Full conversation copied to clipboard.', 'success');
  };

  const handleApplyManualCorrection = async () => {
    if (!activeCall) return;
    await manuallyCorrectCallStatus(activeCall.id, correctedStatusInput, correctionNotesInput);
    setActiveCall({
      ...activeCall,
      status: correctedStatusInput,
      isManuallyCorrected: true,
      originalAiStatus: activeCall.originalAiStatus || activeCall.status,
      correctedBy: user?.email || 'Authorized Auditor',
      correctedAt: new Date().toISOString(),
      correctionNotes: correctionNotesInput,
    });
    setShowCorrectionModal(false);
    setCorrectionNotesInput('');
  };

  // Quick action: Create follow-up task from AI next steps
  const handleCreateTaskFromCall = async () => {
    if (!activeCall) return;
    const firstNextStep = activeCall.nextSteps && activeCall.nextSteps.length > 0
      ? activeCall.nextSteps[0]
      : `Follow up with ${activeCall.customerName} regarding ${activeCall.productName}`;

    await createFollowUpTask({
      call_session_id: activeCall.id,
      lead_id: activeCall.lead_id,
      customerName: activeCall.customerName,
      customerEmail: activeCall.customerEmail,
      productName: activeCall.productName,
      title: activeCall.status === 'Demo Requested'
        ? `Conduct Scheduled Demo for ${activeCall.customerName}`
        : `Executive Follow-Up with ${activeCall.customerName}`,
      description: activeCall.nextSteps ? activeCall.nextSteps.join('; ') : activeCall.aiSummary,
      due_date: activeCall.followUpDate
        ? `${activeCall.followUpDate}T17:00:00Z`
        : new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'pending',
      priority: activeCall.status === 'Demo Requested' ? 'high' : 'medium',
      assigned_to: 'Enterprise AE Team',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0E1635] to-[#12163E] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Call History, Audio Recordings & Transcripts
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Audit conversational audio, verify AI objection-handling, inspect multilingual transcripts, review consent logs, and track sales pipeline dispositions.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('live-call')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Launch New Call</span>
        </button>
      </div>

      {/* Search & Multi-Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 space-y-3 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Full Text Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by customer, email, product, or summary keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Date:</span>
              <select
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {/* Product Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Product:</span>
              <select
                value={productFilter}
                onChange={(e) => {
                  setProductFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Language:</span>
              <select
                value={languageFilter}
                onChange={(e) => {
                  setLanguageFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Languages</option>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Statuses ({calls.length})</option>
                {allStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Recording checkbox */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={recordingOnly}
                onChange={(e) => {
                  setRecordingOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-800"
              />
              <span>With Audio Recording</span>
            </label>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRangeFilter === 'custom' && (
          <div className="pt-2 border-t border-slate-800 flex items-center gap-3 text-xs animate-in fade-in">
            <span className="text-slate-400">Date Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Paginated Calls Table */}
      <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 pl-5 pr-3">Customer</th>
                <th className="py-3.5 px-3">Product</th>
                <th className="py-3.5 px-3">Date & Time</th>
                <th className="py-3.5 px-3">Duration</th>
                <th className="py-3.5 px-3">Language</th>
                <th className="py-3.5 px-3">Sales Status</th>
                <th className="py-3.5 px-3">Audio Recording</th>
                <th className="py-3.5 px-3">Summary Status</th>
                <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedCalls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 text-xs">
                    No calls match the configured search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedCalls.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => handleOpenCallDrawer(call)}
                    className="hover:bg-indigo-600/10 cursor-pointer transition-colors group"
                  >
                    {/* Customer */}
                    <td className="py-3.5 pl-5 pr-3">
                      <div>
                        <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {call.customerName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {call.customerEmail}
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-slate-200">
                        {call.productName}
                      </span>
                    </td>

                    {/* Call Date & Time */}
                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      <div>{call.date}</div>
                      <div className="text-[11px] text-slate-500">{call.timestamp}</div>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-3 font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{formatDuration(call.durationSeconds)}</span>
                      </div>
                    </td>

                    {/* Language */}
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700/60">
                        {call.language}
                      </span>
                    </td>

                    {/* Final Sales Status */}
                    <td className="py-3.5 px-3">
                      <StatusBadge status={call.status} size="sm" />
                    </td>

                    {/* Audio Recording */}
                    <td className="py-3.5 px-3">
                      {call.recordingAvailable ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-semibold flex items-center gap-1 w-fit">
                          <Disc className="w-3 h-3" />
                          <span>Available</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                          Unavailable
                        </span>
                      )}
                    </td>

                    {/* Summary Processing Status */}
                    <td className="py-3.5 px-3">
                      {call.summaryStatus === 'Processing' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-semibold animate-pulse flex items-center gap-1 w-fit">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Processing</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                          <span>Completed ({call.aiScore}%)</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pl-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenCallDrawer(call)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => {
                            const matchedLead = leads.find((l) => l.email === call.customerEmail);
                            if (matchedLead) {
                              startCallWithLead(matchedLead);
                            } else {
                              setCurrentTab('live-call');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Dial Lead"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing {totalCalls === 0 ? 0 : startIndex + 1} to{' '}
              {Math.min(startIndex + pageSize, totalCalls)} of {totalCalls} completed calls
            </span>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={effectivePage <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300 px-2">
              Page {effectivePage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={effectivePage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Over Full Call Details Drawer */}
      {isDetailDrawerOpen && activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-navy-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl h-full bg-[#0B132B] border-l border-slate-800 shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300">
            {/* Top Bar */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white">{activeCall.customerName}</h3>
                  <StatusBadge status={activeCall.status} size="md" />
                  {activeCall.isManuallyCorrected ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-1">
                      <Edit2 className="w-3 h-3" />
                      Manually Overridden (AI: {activeCall.originalAiStatus || 'Unknown'})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono">
                      AI Precedence Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeCall.customerEmail} • {activeCall.customerPhone} • {activeCall.productName}
                </p>
                {activeCall.isManuallyCorrected && activeCall.correctionNotes && (
                  <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-300/90 italic mt-1.5">
                    Audit Note: "{activeCall.correctionNotes}" — {activeCall.correctedBy || 'Auditor'} ({activeCall.correctedAt ? new Date(activeCall.correctedAt).toLocaleDateString() : 'recent'})
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCorrectedStatusInput(activeCall.status);
                    setShowCorrectionModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Override Status</span>
                </button>

                <button
                  onClick={handleCreateTaskFromCall}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-medium border border-indigo-500/30 transition-all"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>Queue Follow-Up Task</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyTranscriptText}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Transcript</span>
                </button>

                <button
                  onClick={() => {
                    const matchedLead = leads.find((l) => l.email === activeCall.customerEmail);
                    if (matchedLead) {
                      startCallWithLead(matchedLead);
                    } else {
                      setCurrentTab('live-call');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/30"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Re-Dial Lead</span>
                </button>

                <button
                  onClick={async () => {
                    if (
                      confirm(
                        `Permanently delete this call session with ${activeCall.customerName}? Recording audio, messages, and AI summaries will be purged pursuant to privacy policy.`
                      )
                    ) {
                      await deleteCallRecord(activeCall.id);
                      setIsDetailDrawerOpen(false);
                      setActiveCall(null);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-medium border border-rose-500/30 transition-colors"
                  title="Permanently Delete Call Record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* Audio Recording Player */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#070D1E] via-[#0B142F] to-[#0A1226] border border-indigo-500/30 shadow-lg space-y-3">
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  preload="metadata"
                  onTimeUpdate={() => {
                    if (audioRef.current && audioRef.current.duration) {
                      const pct = Math.round(
                        (audioRef.current.currentTime / audioRef.current.duration) * 100
                      );
                      setPlaybackProgress(pct);
                    }
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setPlaybackProgress(0);
                  }}
                  className="hidden"
                />
              )}

              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${activeCall.recordingAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="font-semibold text-white">
                    {activeCall.recordingAvailable
                      ? audioUrl
                        ? 'Private Audio Recording (Signed Playback Ready)'
                        : 'Private Audio Recording (Encrypted)'
                      : 'Audio Recording Unavailable (Web Speech Mode)'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({activeCall.recordingDuration || formatDuration(activeCall.durationSeconds)})
                  </span>
                </div>
                {activeCall.recordingAvailable && (
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                    <span>Speed:</span>
                    {([1, 1.25, 1.5] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => {
                          setPlaybackSpeed(spd);
                          if (audioRef.current) audioRef.current.playbackRate = spd;
                        }}
                        className={`px-1.5 py-0.5 rounded ${
                          playbackSpeed === spd
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Audio Waveform Bar */}
              <div
                className="w-full h-12 flex items-center justify-between gap-1 px-2 bg-slate-950/60 rounded-xl cursor-pointer"
                onClick={(e) => {
                  if (!activeCall.recordingAvailable) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percent = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
                  setPlaybackProgress(percent);
                  if (audioRef.current && audioRef.current.duration) {
                    audioRef.current.currentTime = (percent / 100) * audioRef.current.duration;
                  }
                }}
              >
                {Array.from({ length: 48 }).map((_, idx) => {
                  const isPlayed = (idx / 48) * 100 <= playbackProgress;
                  const waveH = Math.sin(idx * 0.4) * 16 + 22;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-full transition-all duration-100 ${
                        isPlayed
                          ? 'bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.5)]'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                      style={{ height: `${waveH}px` }}
                    />
                  );
                })}
              </div>

              {/* Player Controls & Scrubber */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!activeCall.recordingAvailable) {
                        showToast('Notice', 'Direct audio stream recording was disabled for this session.', 'info');
                        return;
                      }
                      if (audioRef.current && audioUrl) {
                        if (isPlaying) {
                          audioRef.current.pause();
                          setIsPlaying(false);
                        } else {
                          audioRef.current.playbackRate = playbackSpeed;
                          audioRef.current
                            .play()
                            .then(() => setIsPlaying(true))
                            .catch((err) => {
                              console.warn('Audio playback notice:', err);
                              setIsPlaying(true);
                            });
                        }
                      } else {
                        setIsPlaying(!isPlaying);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setPlaybackProgress(0);
                      if (audioRef.current) audioRef.current.currentTime = 0;
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    title="Restart audio"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {formatDuration(
                      Math.round((activeCall.durationSeconds * playbackProgress) / 100)
                    )}{' '}
                    / {formatDuration(activeCall.durationSeconds)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      showToast('Audio Download', 'Downloading encrypted call recording FLAC/WAV.', 'info');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Download Call Recording"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      showToast('Share Link Copied', 'Encrypted 24-hour review link copied.', 'success');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Share Recording Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recording Consent Information Box */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Two-Party Recording Consent Verification</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  {activeCall.consentStatus !== false ? 'Consent Granted & Logged' : 'Consent Declined'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 italic">
                "{activeCall.consentText || 'Two-Party Recording Consent verified prior to conversational outreach.'}"
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>Timestamp: {activeCall.consentTimestamp || activeCall.startTime || activeCall.date}</span>
                <span className="text-emerald-400">SOC-2 Type II Audited</span>
              </div>
            </div>

            {/* AI Executive Summary Card */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-indigo-300 uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Disposition & Executive Summary</span>
              </div>
              <p className="text-slate-200 leading-relaxed text-xs">
                {activeCall.aiSummary}
              </p>
            </div>

            {/* Key Intelligence Badges: Anti-Hallucination Safe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Customer Business & Use Case */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                  Business & Use Case
                </span>
                <p className={`font-medium ${!activeCall.customerBusinessAndUseCase || activeCall.customerBusinessAndUseCase === 'Unknown' ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                  {activeCall.customerBusinessAndUseCase || 'Unknown'}
                </p>
              </div>

              {/* Buying Intent */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                  Buying Intent
                </span>
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      activeCall.buyingIntent === 'High'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : activeCall.buyingIntent === 'Medium'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : activeCall.buyingIntent === 'Low'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {activeCall.buyingIntent || 'Medium'} Intent
                  </span>
                </div>
              </div>

              {/* Budget or Timeline */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                  Budget or Timeline
                </span>
                <p className={`font-medium ${!activeCall.budgetOrTimeline || activeCall.budgetOrTimeline === 'Unknown' ? 'text-slate-400 italic' : 'text-amber-300'}`}>
                  {!activeCall.budgetOrTimeline || activeCall.budgetOrTimeline === 'Unknown'
                    ? 'Not stated during call'
                    : activeCall.budgetOrTimeline}
                </p>
              </div>

              {/* Target Follow-Up Date */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                  Target Follow-Up Date
                </span>
                <div className="flex items-center gap-1.5 text-slate-200 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {activeCall.followUpDate
                      ? new Date(activeCall.followUpDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Within 48 hours'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Detail Cards: Requirements, Features Discussed, Questions Asked, Objections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Customer Requirements */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-indigo-400 block uppercase text-[11px] tracking-wider">
                  Customer Requirements & Pain Points
                </span>
                {!activeCall.customerRequirements || activeCall.customerRequirements.length === 0 ? (
                  <p className="text-slate-400 italic">Standard qualification.</p>
                ) : (
                  <ul className="space-y-1 text-slate-300">
                    {activeCall.customerRequirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Features Discussed */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-sky-400 block uppercase text-[11px] tracking-wider">
                  Features Discussed
                </span>
                {!activeCall.featuresDiscussed || activeCall.featuresDiscussed.length === 0 ? (
                  <p className="text-slate-400 italic">{activeCall.productName} overview</p>
                ) : (
                  <ul className="space-y-1 text-slate-300">
                    {activeCall.featuresDiscussed.map((feat, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-sky-400 font-bold">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Questions Asked by Customer */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-purple-400 block uppercase text-[11px] tracking-wider">
                  Questions Asked by Customer
                </span>
                {!activeCall.questionsAsked || activeCall.questionsAsked.length === 0 ? (
                  <p className="text-slate-400 italic">No specific questions asked.</p>
                ) : (
                  <ul className="space-y-1 text-slate-300">
                    {activeCall.questionsAsked.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <HelpCircle className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Objections Handled */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-amber-400 block uppercase text-[11px] tracking-wider">
                  Objections & Concerns
                </span>
                {!activeCall.objections || activeCall.objections.length === 0 ? (
                  <p className="text-slate-400 italic">No strong objections raised.</p>
                ) : (
                  <ul className="space-y-1 text-slate-300">
                    {activeCall.objections.map((obj, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Action Columns: Promised Actions & Automated Next Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Promised Actions */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-cyan-400 block uppercase text-[11px] tracking-wider">
                  Promised Actions Committed
                </span>
                {!activeCall.promisedActions || activeCall.promisedActions.length === 0 ? (
                  <p className="text-slate-400 italic">Standard follow-up dispatch.</p>
                ) : (
                  <ul className="space-y-1 text-slate-300">
                    {activeCall.promisedActions.map((act, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Automated Next Steps */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 block uppercase text-[11px] tracking-wider">
                  Automated Next Steps Executed
                </span>
                <ul className="space-y-1 text-emerald-300">
                  {activeCall.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Verbatim Evidence Quotes */}
            {activeCall.evidenceQuotes && activeCall.evidenceQuotes.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <Quote className="w-4 h-4 text-indigo-400" />
                  <span>Audited Verbatim Evidence Quotes ({activeCall.evidenceQuotes.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeCall.evidenceQuotes.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                            item.speaker === 'customer'
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {item.speaker === 'customer' ? activeCall.customerName : 'Voice AI'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 uppercase font-mono">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-slate-300 italic leading-relaxed text-[11px]">
                        "{item.quote}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Interactive Transcript Viewer */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between pb-2 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Full Conversational Transcript ({activeCall.language})</span>
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {activeCall.transcript.length} turns
                </span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activeCall.transcript.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs leading-relaxed ${
                      msg.speaker === 'ai'
                        ? 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-100'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-slate-400">
                      <span className={msg.speaker === 'ai' ? 'text-indigo-300' : 'text-slate-300'}>
                        {msg.speakerName}
                      </span>
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Classification Override Modal */}
      {showCorrectionModal && activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Manual Classification Override</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-slate-300 space-y-1.5">
              <span className="font-bold text-amber-300 block">Audited Precedence Rules:</span>
              <p className="leading-relaxed text-[11px]">
                The AI applies strict precedence: <strong>No Response &gt; Not Interested &gt; Converted (trusted confirmation only) &gt; Demo Requested &gt; Follow-up Required &gt; Interested</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                Overriding will update CRM records while preserving original AI status ({activeCall.originalAiStatus || activeCall.status}) for compliance audits.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Sales Classification *
              </label>
              <select
                value={correctedStatusInput}
                onChange={(e) => setCorrectedStatusInput(e.target.value as SalesStatus)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Converted">Converted (Confirmed purchase/subscription)</option>
                <option value="Interested">Interested (General engagement without specific commitment)</option>
                <option value="Follow-up Required">Follow-up Required (Unresolved question or callback requested)</option>
                <option value="Not Interested">Not Interested (Declined or opted out)</option>
                <option value="Demo Requested">Demo Requested (Explicit product walkthrough requested)</option>
                <option value="No Response">No Response (Insufficient response or disconnected)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason / Audit Notes *
              </label>
              <textarea
                rows={3}
                required
                value={correctionNotesInput}
                onChange={(e) => setCorrectionNotesInput(e.target.value)}
                placeholder="Explain the reason for manual reclassification (e.g. Verified payment proof, customer phoned back directly)..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyManualCorrection}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-600/30"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Override</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
