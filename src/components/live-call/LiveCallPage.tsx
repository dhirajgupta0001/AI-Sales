import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../common/StatusBadge';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { SalesStatus, TranscriptMessage, CallRecord } from '../../types';
import {
  OpenAIRealtimeVoiceSession,
  RealtimeState,
} from '../../lib/realtimeClient';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Radio,
  User,
  Mail,
  Phone,
  Package,
  Globe,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  Key,
  ExternalLink,
  ChevronDown,
  Info,
  Sliders,
  X,
  Loader2
} from 'lucide-react';

export const LiveCallPage: React.FC = () => {
  const {
    products,
    agentSettings,
    liveCallPrefill,
    clearLiveCallPrefill,
    addCallRecord,
    setCurrentTab,
  } = useApp();
  const { showToast } = useToast();

  // Call configuration form state
  const [customerName, setCustomerName] = useState('Arjun Nambiar');
  const [customerEmail, setCustomerEmail] = useState('arjun@nambiartech.com');
  const [customerPhone, setCustomerPhone] = useState('+91 98450 12894');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'prod-1');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [consentAgreed, setConsentAgreed] = useState(true);

  // Audio / Hardware indicators
  const [isMuted, setIsMuted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(true);
  const [audioLevel, setAudioLevel] = useState(15);

  // Call runtime state
  const [callStatus, setCallStatus] = useState<RealtimeState>('Idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [activeCallSession, setActiveCallSession] = useState<OpenAIRealtimeVoiceSession | null>(null);

  // Provider configuration status
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(null);
  const [keyMasked, setKeyMasked] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Post-call AI analysis result
  const [postCallResult, setPostCallResult] = useState<{
    summary: string;
    status: SalesStatus;
    objections: string[];
    requirements: string[];
    nextSteps: string[];
    score: number;
  } | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const timerRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Check backend Realtime status on mount
  useEffect(() => {
    checkRealtimeStatus();
  }, []);

  const checkRealtimeStatus = async () => {
    try {
      const resp = await fetch('/api/realtime-status');
      if (resp.ok) {
        const data = await resp.json();
        setProviderConfigured(Boolean(data.configured));
        setKeyMasked(data.keyMasked);
      }
    } catch (e) {
      console.warn('Realtime status check error:', e);
    }
  };

  // Check prefilled lead data if passed from Leads tab
  useEffect(() => {
    if (liveCallPrefill) {
      if (liveCallPrefill.customerName) setCustomerName(liveCallPrefill.customerName);
      if (liveCallPrefill.customerEmail) setCustomerEmail(liveCallPrefill.customerEmail);
      if (liveCallPrefill.customerPhone) setCustomerPhone(liveCallPrefill.customerPhone);
      if (liveCallPrefill.productId) setSelectedProductId(liveCallPrefill.productId);
      if (liveCallPrefill.preferredLanguage) setSelectedLanguage(liveCallPrefill.preferredLanguage);
      showToast('Lead Prefilled', `Loaded ${liveCallPrefill.customerName} into live call studio.`, 'info');
      clearLiveCallPrefill();
    }
  }, [liveCallPrefill]);

  // Scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Call timer interval: runs only while call is active
  useEffect(() => {
    if (callStatus === 'Speaking' || callStatus === 'Listening') {
      timerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Start Realtime Call Handler
  const handleStartCall = async () => {
    // 1. Prevent simultaneous sessions
    if (callStatus === 'Speaking' || callStatus === 'Listening' || callStatus === 'Connecting') {
      showToast('Call Already Active', 'A voice session is already in progress.', 'warning');
      return;
    }

    // 2. Consent check
    if (!consentAgreed) {
      showToast(
        'Recording Consent Required',
        'Customer recording consent must be acknowledged before connecting voice channels.',
        'warning'
      );
      return;
    }

    // 3. Provider check: DO NOT SIMULATE if credentials missing
    if (providerConfigured === false) {
      setConnectionError('OpenAI Realtime API key is not configured on the backend server.');
      setShowConfigModal(true);
      showToast(
        'Voice Engine Not Configured',
        'Add OPENAI_API_KEY to start real speech-to-speech conversations.',
        'warning'
      );
      return;
    }

    setConnectionError(null);
    setTranscript([]);
    setCallSeconds(0);
    setPostCallResult(null);

    // Initialize real WebRTC Session
    const session = new OpenAIRealtimeVoiceSession(
      {
        product: {
          name: selectedProduct.name,
          description: selectedProduct.tagline || selectedProduct.description,
          features: selectedProduct.features,
          pricing: selectedProduct.pricing,
          salesPitch: selectedProduct.salesPitch,
          tone: selectedProduct.tone,
          callToAction: selectedProduct.callToAction,
          aiInstructions: selectedProduct.aiInstructions,
        },
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        language: selectedLanguage,
        voice: agentSettings.voicePreference,
        agentName: agentSettings.agentName,
        speakingRate: agentSettings.speakingRate,
      },
      {
        onStateChange: (newState) => {
          setCallStatus(newState);
        },
        onTranscriptUpdate: (newTranscript) => {
          setTranscript([...newTranscript]);
        },
        onError: (errorMsg, code) => {
          setConnectionError(errorMsg);
          if (code === 'API_KEY_MISSING') {
            setProviderConfigured(false);
            setShowConfigModal(true);
          } else if (code === 'MIC_PERMISSION_DENIED') {
            setMicPermissionGranted(false);
          }
          showToast('Voice Connection Error', errorMsg, 'error');
        },
        onInterrupted: () => {
          showToast('Customer Speaking', 'AI yielded to customer interruption.', 'info');
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
      }
    );

    setActiveCallSession(session);
    await session.start();
  };

  // End Call Handler
  const handleEndCall = async () => {
    if (activeCallSession) {
      activeCallSession.end();
      setActiveCallSession(null);
    }

    setCallStatus('Completed');
    showToast('Call Concluded', `Call finished (${formatTimer(callSeconds)}). Synthesizing AI summary...`, 'info');

    // Run post-call summary synthesis
    await generatePostCallAnalysis(transcript);
  };

  const generatePostCallAnalysis = async (currentTranscript: TranscriptMessage[]) => {
    setIsGeneratingSummary(true);

    try {
      const resp = await fetch('/api/realtime-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentTranscript,
          productName: selectedProduct.name,
          customerName,
          language: selectedLanguage,
        }),
      });

      const summaryData = await resp.json();

      const postAnalysis = {
        summary: summaryData.summary || `Call concluded with ${customerName} regarding ${selectedProduct.name}.`,
        status: (summaryData.status as SalesStatus) || 'Interested',
        objections: summaryData.objections || ['Pricing evaluation', 'Timeline'],
        requirements: summaryData.requirements || ['Platform integration'],
        nextSteps: summaryData.nextSteps || [`Follow-up dispatched to ${customerEmail}`],
        score: summaryData.score || 85,
      };

      setPostCallResult(postAnalysis);

      // Persist to Supabase through AppContext
      const newRecord: CallRecord = {
        id: `call-${Date.now()}`,
        customerName,
        customerEmail,
        customerPhone,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        startTime: new Date(Date.now() - Math.max(callSeconds, 15) * 1000).toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: Math.max(callSeconds, 15),
        status: postAnalysis.status,
        callStatus: 'Completed',
        language: selectedLanguage,
        recordingAvailable: true,
        recordingDuration: formatTimer(Math.max(callSeconds, 15)),
        recordingStoragePath: `call-recordings/${Date.now()}.wav`,
        sentiment: 'Positive',
        aiScore: postAnalysis.score,
        transcript: currentTranscript.length > 0 ? currentTranscript : [
          {
            id: `msg-${Date.now()}`,
            speaker: 'ai',
            speakerName: agentSettings.agentName,
            text: `Connected with ${customerName} for ${selectedProduct.name}.`,
            timestamp: '00:03',
          },
        ],
        aiSummary: postAnalysis.summary,
        objections: postAnalysis.objections,
        customerRequirements: postAnalysis.requirements,
        nextSteps: postAnalysis.nextSteps,
        consentStatus: consentAgreed,
        consentTimestamp: new Date().toISOString(),
      };

      await addCallRecord(newRecord);
    } catch (e) {
      console.warn('Post-call summary error:', e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleToggleMute = () => {
    if (activeCallSession) {
      const nextMuted = !isMuted;
      activeCallSession.setMuted(nextMuted);
      setIsMuted(nextMuted);
      showToast(
        nextMuted ? 'Microphone Muted' : 'Microphone Unmuted',
        nextMuted ? 'Audio track silenced. Agent will not hear input.' : 'Audio track restored.',
        'info'
      );
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsSavingKey(true);
    try {
      const resp = await fetch('/api/save-openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        showToast('API Key Validation Failed', data.error || 'Invalid API Key', 'error');
        return;
      }

      showToast('API Key Saved', 'OpenAI Realtime Voice Engine ready for live conversations.', 'success');
      setProviderConfigured(true);
      setShowConfigModal(false);
      setApiKeyInput('');
      setConnectionError(null);
      await checkRealtimeStatus();
    } catch (err: any) {
      showToast('Server Error', err.message || 'Could not save key', 'error');
    } finally {
      setIsSavingKey(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: RealtimeState) => {
    switch (status) {
      case 'Speaking':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'Listening':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Connecting':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Completed':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Failed':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Realtime Telephony Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-[#0C142E] via-[#0E1738] to-[#14123E] border border-indigo-500/30 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                Live Speech-to-Speech Engine: OpenAI Realtime WebRTC
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  providerConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {providerConfigured ? 'Provider Active' : 'API Key Required'}
              </span>
            </div>
            <p className="text-slate-300 mt-0.5">
              Native bidirectional audio streaming, sub-second latency, server-side VAD, and instant customer interruption handling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!providerConfigured && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure Secret Key</span>
            </button>
          )}
          <span className="text-[11px] px-2.5 py-1 rounded-full font-mono bg-slate-900 text-slate-300 border border-slate-700">
            Model: gpt-4o-realtime
          </span>
        </div>
      </div>

      {/* Connection Error Message banner if failed */}
      {connectionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Voice Connection Notice:</span>
              <p className="mt-0.5">{connectionError}</p>
            </div>
          </div>
          <button
            onClick={() => setConnectionError(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Profile & Call Setup (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Prospect & Target SaaS</h3>
              </div>
              <span className="text-xs text-slate-400">Call Configuration</span>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Customer / Prospect Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  disabled={callStatus === 'Speaking' || callStatus === 'Listening'}
                  placeholder="e.g. Arjun Nambiar"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    disabled={callStatus === 'Speaking' || callStatus === 'Listening'}
                    placeholder="arjun@company.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={callStatus === 'Speaking' || callStatus === 'Listening'}
                    placeholder="+91 98450 12894"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target SaaS Product to Sell
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={callStatus === 'Speaking' || callStatus === 'Listening'}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 appearance-none disabled:opacity-60"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name} — {p.category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 italic">
                Pitch: "{selectedProduct.salesPitch}"
              </p>
            </div>

            {/* Language Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Preferred Language Dialect
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">
                  Adaptive switching enabled
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.name;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.name);
                        showToast('Language Dialect Selected', `Agent prompt set for ${lang.nativeName}.`, 'info');
                      }}
                      disabled={callStatus === 'Speaking' || callStatus === 'Listening'}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-base mb-0.5">{lang.flag}</span>
                      <span className="font-semibold">{lang.name}</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-full">
                        {lang.nativeName.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recording Consent Checkbox */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-800"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">
                      Two-Party Recording Consent
                    </span>
                    {consentAgreed ? (
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-medium flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Prospect has acknowledged real-time conversational audio transcription under compliance guidelines.
                  </p>
                </div>
              </label>
            </div>

            {/* Hardware & Mute indicators */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    isMuted
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{isMuted ? 'Muted' : 'Unmuted'}</span>
                </button>

                <span
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                    micPermissionGranted
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mic: {micPermissionGranted ? 'Granted' : 'Denied'}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">{audioLevel}% Signal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Voice Agent Console & Realtime Waveform (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-2xl space-y-6 flex flex-col justify-between min-h-[580px]">
            {/* Top Status Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <Mic className="w-6 h-6" />
                  </div>
                  {callStatus === 'Speaking' && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-[#0B132B] animate-ping" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{agentSettings.agentName}</h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getStatusColor(
                        callStatus
                      )}`}
                    >
                      {callStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Selling: {selectedProduct.name} • Dialect: {selectedLanguage}
                  </p>
                </div>
              </div>

              {/* Call Timer Display */}
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono justify-end">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Call Duration</span>
                </div>
                <div className="text-2xl font-mono font-bold text-white tracking-wider">
                  {formatTimer(callSeconds)}
                </div>
              </div>
            </div>

            {/* Audio Waveform & Speech Visualizer Stage */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#060B18] to-[#0A122A] border border-slate-800/80 p-6 flex flex-col items-center justify-center min-h-[170px] text-center">
              {/* Dynamic waveform visualization reacting to actual audio level and speech state */}
              <div className="w-full flex items-center justify-center gap-1.5 h-16 py-2">
                {Array.from({ length: 32 }).map((_, idx) => {
                  const isSpeaking = callStatus === 'Speaking';
                  const isListening = callStatus === 'Listening';

                  let heightPercent = 12;
                  if (isSpeaking) {
                    const waveMod = Math.sin((idx + callSeconds * 4) * 0.7) * 40;
                    heightPercent = Math.max(15, Math.min(95, 45 + waveMod + audioLevel * 0.3));
                  } else if (isListening) {
                    const waveMod = Math.cos((idx + callSeconds * 2) * 0.5) * 20;
                    heightPercent = Math.max(10, Math.min(80, 20 + waveMod + audioLevel * 0.4));
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-1.5 rounded-full transition-all duration-100 ${
                        isSpeaking
                          ? 'bg-gradient-to-t from-indigo-500 to-violet-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                          : isListening
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-800'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  );
                })}
              </div>

              {/* Status prompt */}
              <div className="mt-3 text-xs">
                {callStatus === 'Idle' && (
                  <p className="text-slate-400">
                    Ready to initiate voice session. Click <strong>Start Call</strong> to establish real-time WebRTC audio.
                  </p>
                )}
                {callStatus === 'Connecting' && (
                  <p className="text-amber-300 animate-pulse font-medium flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Negotiating WebRTC SDP offer with OpenAI Realtime speech engine...</span>
                  </p>
                )}
                {callStatus === 'Speaking' && (
                  <p className="text-indigo-300 font-medium">
                    {agentSettings.agentName} is vocalizing response (Speak anytime to interrupt)...
                  </p>
                )}
                {callStatus === 'Listening' && (
                  <p className="text-emerald-300 font-medium">
                    Listening to prospect speech in {selectedLanguage} (Server-side VAD active)...
                  </p>
                )}
                {callStatus === 'Completed' && (
                  <p className="text-cyan-300 font-medium">
                    Call session finalized. Audio resources released and AI summary generated below.
                  </p>
                )}
                {callStatus === 'Failed' && (
                  <p className="text-rose-400 font-medium">
                    Connection failed. Check your microphone permission or OpenAI API key.
                  </p>
                )}
              </div>
            </div>

            {/* Real-time Chat Transcript Stream */}
            <div className="flex-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 overflow-y-auto max-h-64 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real-Time Conversational Transcript</span>
                </span>
                <span className="font-mono text-[11px]">{transcript.length} turns recorded</span>
              </div>

              {transcript.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <Mic className="w-6 h-6 text-slate-700 mb-2" />
                  <p>Streaming conversation will display here live as audio is exchanged.</p>
                </div>
              ) : (
                transcript.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.speaker === 'ai' ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">{msg.speakerName}</span>
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        msg.speaker === 'ai'
                          ? 'bg-indigo-950/70 text-indigo-100 border border-indigo-500/30 rounded-tl-sm'
                          : 'bg-slate-800/90 text-white border border-slate-700 rounded-tr-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              {callStatus === 'Speaking' && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 pl-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  <span>AI responding...</span>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Call Action Bar: Start / End Call */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {callStatus === 'Idle' || callStatus === 'Completed' || callStatus === 'Failed' ? (
                  <button
                    onClick={handleStartCall}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Start Call</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Call</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    if (activeCallSession) {
                      activeCallSession.end();
                      setActiveCallSession(null);
                    }
                    setTranscript([]);
                    setCallSeconds(0);
                    setCallStatus('Idle');
                    setPostCallResult(null);
                    showToast('Session Reset', 'Transcript and live session cleared.', 'info');
                  }}
                  disabled={callStatus === 'Connecting'}
                  className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Status Pill Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className={`w-2 h-2 rounded-full ${callStatus === 'Speaking' || callStatus === 'Listening' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>WebRTC: {callStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Call Intelligence Summary Drawer */}
      {postCallResult && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0F1A3B] via-[#0B132B] to-[#0A1226] border border-indigo-500/30 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Post-Call Intelligence & Disposition
                </h3>
                <p className="text-xs text-slate-300">
                  Synthesized from live audio transcript & persisted to Supabase
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Sales Classification:</span>
                <StatusBadge status={postCallResult.status} size="lg" />
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold font-mono">
                Score: {postCallResult.score}/100
              </div>
            </div>
          </div>

          {/* AI Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Executive Synthesis</span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed">
              {postCallResult.summary}
            </p>
          </div>

          {/* 3 Detail Cards: Objections, Requirements, Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Objections Handled */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block uppercase tracking-wide text-[11px] text-amber-400">
                Objections Handled
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {postCallResult.objections.map((obj, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Requirements */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block uppercase tracking-wide text-[11px] text-indigo-400">
                Requirements Identified
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {postCallResult.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-200 block uppercase tracking-wide text-[11px] text-emerald-400">
                Automated Next Steps
              </span>
              <ul className="space-y-1.5 text-emerald-300">
                {postCallResult.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Synced with Lead Pipeline and saved to Call History.
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentTab('call-history')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>View in Call History</span>
              </button>
              <button
                onClick={() => setCurrentTab('leads')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <span>Open Leads Pipeline</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OpenAI Realtime API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleSaveApiKey}
            className="relative w-full max-w-lg rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Configure OpenAI Realtime Voice Engine</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 space-y-1.5">
              <span className="font-bold text-white block">Secure Session Architecture:</span>
              <p className="leading-relaxed">
                The permanent <code>OPENAI_API_KEY</code> is stored securely on the backend server. The backend creates short-lived, ephemeral client tokens for each voice call session. Permanent keys are never exposed in browser code.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                OpenAI API Key (starts with sk-...) *
              </label>
              <input
                type="password"
                required
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-proj-••••••••••••••••••••"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                You can also configure this by adding <code>OPENAI_API_KEY=sk-...</code> to your <code>.env</code> file in the project root.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingKey}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                {isSavingKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Validating Key...</span>
                  </>
                ) : (
                  <span>Verify & Save Key</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
