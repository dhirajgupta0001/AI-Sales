import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../common/StatusBadge';
import { formatDuration } from '../../utils/cn';
import { CallRecord, SalesStatus } from '../../types';
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
  ArrowUpDown,
  FileText,
  Copy,
  ExternalLink,
  X,
  User,
  ShieldCheck,
  Disc
} from 'lucide-react';

export const CallHistoryPage: React.FC = () => {
  const { calls, products, selectedCallId, setSelectedCallId, setCurrentTab, startCallWithLead, leads } = useApp();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All');
  const [recordingOnly, setRecordingOnly] = useState(false);

  // Active inspected call
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(25); // percentage
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5>(1);

  // Auto select call if selectedCallId exists
  useEffect(() => {
    if (selectedCallId) {
      const match = calls.find((c) => c.id === selectedCallId);
      if (match) {
        setActiveCall(match);
      }
    } else if (calls.length > 0 && !activeCall) {
      setActiveCall(calls[0]);
    }
  }, [selectedCallId, calls]);

  // Audio simulation timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
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
  }, [isPlaying, playbackSpeed]);

  const allStatuses: SalesStatus[] = [
    'Converted',
    'Interested',
    'Follow-up Required',
    'Not Interested',
    'Demo Requested',
    'No Response',
  ];

  const filteredCalls = calls.filter((c) => {
    const matchesSearch =
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aiSummary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesProduct = productFilter === 'All' || c.productId === productFilter;
    const matchesRecording = !recordingOnly || c.recordingAvailable;

    return matchesSearch && matchesStatus && matchesProduct && matchesRecording;
  });

  const handleSelectCall = (call: CallRecord) => {
    setActiveCall(call);
    setSelectedCallId(call.id);
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const copyTranscriptText = () => {
    if (!activeCall) return;
    const text = activeCall.transcript
      .map((m) => `[${m.timestamp}] ${m.speakerName}: ${m.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    showToast('Transcript Copied', 'Full conversation copied to clipboard.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0E1635] to-[#12163E] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Call History, Audio Recordings & Transcripts
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Audit conversational audio, verify AI objection-handling, inspect multilingual transcripts, and review automated CRM next steps.
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

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0B132B]/80 backdrop-blur-md border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, email, product, or summary keywords..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Product:</span>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
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

            <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={recordingOnly}
                onChange={(e) => setRecordingOnly(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 bg-slate-800"
              />
              <span>With Audio Recording</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Grid: Calls List (5 cols) & Selected Call Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Call Sessions List */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-4 shadow-xl flex flex-col justify-between max-h-[820px]">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-white text-sm">
              Completed Calls ({filteredCalls.length})
            </span>
            <span className="text-xs text-slate-400">Sorted by newest</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
            {filteredCalls.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                No calls match your search query.
              </div>
            ) : (
              filteredCalls.map((call) => {
                const isSelected = activeCall?.id === call.id;
                return (
                  <div
                    key={call.id}
                    onClick={() => handleSelectCall(call)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white">{call.customerName}</div>
                        <div className="text-[11px] text-slate-400">{call.productName}</div>
                      </div>
                      <StatusBadge status={call.status} size="sm" />
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <span>{call.date}</span>
                        <span>•</span>
                        <span>{call.language}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{formatDuration(call.durationSeconds)}</span>
                      </div>
                    </div>

                    {/* AI Score pill */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Score: {call.aiScore}/100</span>
                      </div>
                      {call.recordingAvailable && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Disc className="w-3 h-3" />
                          <span>Audio Available</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>SOC-2 Audio Encryption: Active</span>
            <span className="text-emerald-400 font-mono">90-Day Retention</span>
          </div>
        </div>

        {/* Right Column: Full Call Details Inspector (7 cols) */}
        <div className="lg:col-span-7">
          {activeCall ? (
            <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{activeCall.customerName}</h3>
                    <StatusBadge status={activeCall.status} size="md" />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeCall.customerEmail} • {activeCall.customerPhone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyTranscriptText}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Transcript</span>
                  </button>

                  <button
                    onClick={() => {
                      const matchedLead = leads.find((l) => l.email === activeCall.customerEmail);
                      if (matchedLead) {
                        startCallWithLead(matchedLead);
                      } else {
                        showToast('Re-dialing Customer', `Setting up follow-up call with ${activeCall.customerName}.`, 'info');
                        setCurrentTab('live-call');
                      }
                    }}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Re-Dial Lead</span>
                  </button>
                </div>
              </div>

              {/* Audio Recording Player */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#070D1E] via-[#0B142F] to-[#0A1226] border border-indigo-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-white">Encrypted Private Recording (Signed URL)</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ({activeCall.recordingDuration || formatDuration(activeCall.durationSeconds)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                    <span>Speed:</span>
                    {([1, 1.25, 1.5] as const).map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
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
                </div>

                {/* Simulated Audio Waveform Bar */}
                <div
                  className="w-full h-12 flex items-center justify-between gap-1 px-2 bg-slate-950/60 rounded-xl cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = Math.round((clickX / rect.width) * 100);
                    setPlaybackProgress(percent);
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
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => setPlaybackProgress(0)}
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

              {/* AI Executive Summary Card */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-indigo-300 uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Disposition & Call Summary</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {activeCall.aiSummary}
                </p>
              </div>

              {/* Two columns: Objections & Customer Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Objections Handled */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-amber-400 block uppercase text-[11px] tracking-wider">
                    Objections Identified
                  </span>
                  {activeCall.objections.length === 0 ? (
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

                {/* Customer Requirements */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <span className="font-semibold text-indigo-400 block uppercase text-[11px] tracking-wider">
                    Customer Requirements
                  </span>
                  {activeCall.customerRequirements.length === 0 ? (
                    <p className="text-slate-400 italic">Standard tier qualification.</p>
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
              </div>

              {/* Automated Next Steps */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1.5">
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

              {/* Full Interactive Transcript Viewer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Full Conversational Transcript ({activeCall.language})</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {activeCall.transcript.length} turns
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
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
          ) : (
            <div className="rounded-2xl bg-[#0B132B]/90 border border-slate-800 p-12 text-center text-slate-400">
              <PhoneCall className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p>Select a call from the list to inspect audio recording and AI transcript.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
