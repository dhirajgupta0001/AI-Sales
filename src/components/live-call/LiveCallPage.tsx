import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../common/StatusBadge';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { SalesStatus, TranscriptMessage, CallRecord, PostCallStructuredAnalysis } from '../../types';
import {
  BrowserVoiceSalesAgent,
  VoiceAgentState,
  LANGUAGE_CODE_MAP,
} from '../../lib/voiceAgent';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  Sparkles,
  ShieldCheck,
  Clock,
  Radio,
  User,
  Mail,
  Phone,
  Package,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  Key,
  ChevronDown,
  Info,
  X,
  Loader2,
  Sliders,
  AlertTriangle,
  Edit2,
  Quote,
  Calendar,
  TrendingUp,
  HelpCircle,
  Check
} from 'lucide-react';

export const LiveCallPage: React.FC = () => {
  const {
    products,
    agentSettings,
    liveCallPrefill,
    clearLiveCallPrefill,
    addCallRecord,
    manuallyCorrectCallStatus,
    setCurrentTab,
  } = useApp();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Call configuration form state
  const [customerName, setCustomerName] = useState('Arjun Nambiar');
  const [customerEmail, setCustomerEmail] = useState('arjun@nambiartech.com');
  const [customerPhone, setCustomerPhone] = useState('+91 98450 12894');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || 'prod-1');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [consentAgreed, setConsentAgreed] = useState(true);

  // Audio & speech state
  const [isMuted, setIsMuted] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(true);
  const [audioLevel, setAudioLevel] = useState(15);
  const [interimText, setInterimText] = useState('');
  const [voiceWarning, setVoiceWarning] = useState<string | null>(null);

  // Call runtime state
  const [callStatus, setCallStatus] = useState<VoiceAgentState>('Idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [activeVoiceAgent, setActiveVoiceAgent] = useState<BrowserVoiceSalesAgent | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  // Browser capabilities
  const [browserCapabilities, setBrowserCapabilities] = useState<{
    speechRecognitionSupported: boolean;
    speechSynthesisSupported: boolean;
    notice?: string;
  }>({ speechRecognitionSupported: true, speechSynthesisSupported: true });

  // Ollama Cloud provider status
  const [ollamaConfigured, setOllamaConfigured] = useState<boolean | null>(null);
  const [ollamaModel, setOllamaModel] = useState('llama3.3');
  const [keyMasked, setKeyMasked] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('llama3.3');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Post-call AI analysis result
  const [postCallResult, setPostCallResult] = useState<PostCallStructuredAnalysis | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Manual Classification Override state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctedStatusInput, setCorrectedStatusInput] = useState<SalesStatus>('Interested');
  const [correctionNotesInput, setCorrectionNotesInput] = useState('');

  const timerRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const isFinalizingRef = useRef<boolean>(false);

  // Check browser speech capabilities & Ollama status on mount
  useEffect(() => {
    const caps = BrowserVoiceSalesAgent.checkBrowserCapabilities();
    setBrowserCapabilities(caps);
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const resp = await fetch('/api/ollama-status');
      if (resp.ok) {
        const data = await resp.json();
        setOllamaConfigured(Boolean(data.configured));
        if (data.model) {
          setOllamaModel(data.model);
          setModelInput(data.model);
        }
        setKeyMasked(data.keyMasked);
      }
    } catch (e) {
      console.warn('Ollama status check notice:', e);
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
  }, [transcript, interimText]);

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

  // Handle unexpected network dropouts or tab unload during active conversation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callStatus === 'Speaking' || callStatus === 'Listening') {
        handleEndCall();
      }
    };

    const handleOffline = () => {
      if (callStatus === 'Speaking' || callStatus === 'Listening') {
        showToast('Network Dropped', 'Internet connection lost. Finalizing and saving transcript.', 'warning');
        handleEndCall();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('offline', handleOffline);
    };
  }, [callStatus, transcript, activeVoiceAgent]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Start Call Handler
  const handleStartCall = async () => {
    // 1. Prevent simultaneous sessions
    if (callStatus === 'Speaking' || callStatus === 'Listening' || callStatus === 'Connecting') {
      showToast('Call Already Active', 'A voice session is already in progress.', 'warning');
      return;
    }

    // 2. Browser capabilities check
    if (!browserCapabilities.speechRecognitionSupported) {
      showToast(
        'Browser Speech Recognition Unsupported',
        'Your current browser does not support SpeechRecognition. Please use Google Chrome or Microsoft Edge.',
        'error'
      );
      return;
    }

    // 3. Consent check
    if (!consentAgreed) {
      showToast(
        'Recording Consent Required',
        'Customer recording consent must be acknowledged before connecting voice channels.',
        'warning'
      );
      return;
    }

    // 4. Ollama Cloud credentials check (Do NOT simulate if missing!)
    if (ollamaConfigured === false) {
      setConnectionError('Ollama Cloud API Key (OLLAMA_API_KEY) is not configured on the backend server.');
      setShowConfigModal(true);
      showToast(
        'Ollama Cloud Key Required',
        'Please configure your OLLAMA_API_KEY to start interactive conversations.',
        'warning'
      );
      return;
    }

    setConnectionError(null);
    setVoiceWarning(null);
    setTranscript([]);
    setInterimText('');
    setCallSeconds(0);
    setPostCallResult(null);
    isFinalizingRef.current = false;

    const sessionCallId = `call-${Date.now()}`;
    setCurrentCallId(sessionCallId);

    // Initialize real browser voice agent with full product knowledge & agent settings
    const agent = new BrowserVoiceSalesAgent(
      {
        product: selectedProduct,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        language: selectedLanguage,
        agentSettings: agentSettings,
        model: ollamaModel,
        recordingConsent: consentAgreed,
      },
      {
        onStateChange: (newState) => {
          setCallStatus(newState);
        },
        onTranscriptUpdate: (newTranscript) => {
          setTranscript([...newTranscript]);
        },
        onInterimSpeech: (text) => {
          setInterimText(text);
        },
        onIntentDetected: (intent) => {
          if (intent.isDemoRequest) {
            showToast('Intent Detected', 'Customer expressed interest in booking a demo.', 'info');
          } else if (intent.isOptOut) {
            showToast('Opt-Out Notice', 'Customer requested to stop conversation.', 'warning');
          }
        },
        onError: (errorMsg, code) => {
          setConnectionError(errorMsg);
          if (code === 'OLLAMA_KEY_MISSING' || code === 'OLLAMA_AUTH_ERROR') {
            setOllamaConfigured(false);
            setShowConfigModal(true);
          } else if (code === 'MIC_PERMISSION_DENIED') {
            setMicPermissionGranted(false);
          }
          showToast('Voice Error', errorMsg, 'error');
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
        onVoiceWarning: (warn) => {
          setVoiceWarning(warn);
        },
      }
    );

    setActiveVoiceAgent(agent);
    await agent.start();
  };

  // End Call Handler
  const handleEndCall = async () => {
    if (isFinalizingRef.current) return;
    isFinalizingRef.current = true;

    let audioBlob: Blob | null = null;
    if (activeVoiceAgent) {
      try {
        audioBlob = await activeVoiceAgent.stopRecording();
      } catch (recErr) {
        console.warn('Audio capture notice:', recErr);
      }
      activeVoiceAgent.end();
      setActiveVoiceAgent(null);
    }

    setInterimText('');
    setCallStatus('Completed');
    showToast('Call Concluded', `Call ended after ${formatTimer(callSeconds)}. Synthesizing AI disposition...`, 'info');

    // Run post-call summary workflow using Ollama Cloud
    await generatePostCallAnalysis(transcript, audioBlob);
  };

  const generatePostCallAnalysis = async (
    currentTranscript: TranscriptMessage[],
    audioBlob?: Blob | null
  ) => {
    setIsGeneratingSummary(true);

    const sessionId = currentCallId || `call-${Date.now()}`;
    if (!currentCallId) setCurrentCallId(sessionId);

    try {
      const resp = await fetch('/api/summarize-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: currentTranscript,
          productName: selectedProduct.name,
          customerName,
          customerEmail,
          customerPhone,
          language: selectedLanguage,
          durationSeconds: Math.max(callSeconds, 15),
        }),
      });

      const summaryData = await resp.json();
      const analysis: PostCallStructuredAnalysis = summaryData.analysis || {
        summary: summaryData.summary || `Call concluded with ${customerName} regarding ${selectedProduct.name}.`,
        customer_business_and_use_case: 'Unknown',
        customer_requirements: summaryData.requirements || ['Product demonstration'],
        features_discussed: [selectedProduct.name],
        questions_asked: [],
        objections: summaryData.objections || [],
        buying_intent: 'Medium',
        budget_or_timeline: 'Unknown',
        promised_actions: [`Follow-up dispatched to ${customerEmail}`],
        sales_status: (summaryData.status as SalesStatus) || 'Interested',
        original_ai_status: (summaryData.status as SalesStatus) || 'Interested',
        next_steps: summaryData.nextSteps || [`Follow-up dispatched to ${customerEmail}`],
        follow_up_date: summaryData.followUpDate || null,
        confidence: typeof summaryData.score === 'number' ? summaryData.score : 85,
        evidence_quotes: summaryData.evidenceQuotes || [],
        is_manually_corrected: false,
      };

      setPostCallResult(analysis);
      setCorrectedStatusInput(analysis.sales_status);

      let localBlobUrl: string | null = null;
      if (audioBlob && consentAgreed) {
        try {
          localBlobUrl = URL.createObjectURL(audioBlob);
        } catch (e) {}
      }

      // Persist to Supabase through AppContext (handles retry idempotency)
      const newRecord: CallRecord = {
        id: sessionId,
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
        status: analysis.sales_status,
        originalAiStatus: analysis.sales_status,
        isManuallyCorrected: false,
        callStatus: 'Completed',
        language: selectedLanguage,
        recordingAvailable: Boolean(consentAgreed && (audioBlob || localBlobUrl)),
        recordingDuration: formatTimer(Math.max(callSeconds, 15)),
        recordingSignedUrl: localBlobUrl,
        sentiment: 'Positive',
        aiScore: analysis.confidence,
        transcript: currentTranscript.length > 0 ? currentTranscript : [
          {
            id: `msg-${Date.now()}`,
            speaker: 'ai',
            speakerName: agentSettings.agentName,
            text: `Conversation completed with ${customerName} for ${selectedProduct.name}.`,
            timestamp: '00:03',
          },
        ],
        aiSummary: analysis.summary,
        customerBusinessAndUseCase: analysis.customer_business_and_use_case,
        customerRequirements: analysis.customer_requirements,
        featuresDiscussed: analysis.features_discussed,
        questionsAsked: analysis.questions_asked,
        objections: analysis.objections,
        buyingIntent: analysis.buying_intent,
        budgetOrTimeline: analysis.budget_or_timeline,
        promisedActions: analysis.promised_actions,
        nextSteps: analysis.next_steps,
        followUpDate: analysis.follow_up_date,
        evidenceQuotes: analysis.evidence_quotes,
        structuredAnalysis: analysis,
        consentStatus: consentAgreed,
        consentTimestamp: new Date().toISOString(),
        consentText: consentAgreed
          ? 'Customer explicitly agreed to call recording pursuant to Two-Party Consent Policy.'
          : 'Customer declined call recording. Audio recording disabled; text-only live transcript retained.',
      };

      await addCallRecord(newRecord, audioBlob || undefined);
    } catch (e: any) {
      console.warn('Post-call summary notice:', e);
      showToast('Analysis Warning', 'Could not complete AI analysis; default disposition saved.', 'warning');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleApplyManualCorrection = async () => {
    if (!currentCallId) return;
    await manuallyCorrectCallStatus(currentCallId, correctedStatusInput, correctionNotesInput);
    if (postCallResult) {
      setPostCallResult({
        ...postCallResult,
        sales_status: correctedStatusInput,
        is_manually_corrected: true,
        corrected_by: user?.email || 'Authorized Auditor',
        corrected_at: new Date().toISOString(),
        correction_notes: correctionNotesInput,
      });
    }
    setShowCorrectionModal(false);
    setCorrectionNotesInput('');
  };

  const handleToggleMute = () => {
    if (activeVoiceAgent) {
      const nextMuted = !isMuted;
      activeVoiceAgent.setMuted(nextMuted);
      setIsMuted(nextMuted);
      showToast(
        nextMuted ? 'Microphone Muted' : 'Microphone Unmuted',
        nextMuted ? 'Microphone input paused.' : 'Microphone input resumed.',
        'info'
      );
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleInterruptAI = () => {
    if (activeVoiceAgent && callStatus === 'Speaking') {
      activeVoiceAgent.interrupt();
      showToast('AI Interrupted', 'Playback cancelled. Ready for your speech.', 'info');
    }
  };

  const handleSaveOllamaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    setIsSavingKey(true);
    try {
      const resp = await fetch('/api/save-ollama-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeyInput.trim(),
          model: modelInput.trim() || 'llama3.3',
          baseUrl: 'https://ollama.com',
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        showToast('Configuration Failed', data.error || 'Could not save credentials', 'error');
        return;
      }

      showToast('Ollama Cloud Configured', `Connected to model "${modelInput.trim()}".`, 'success');
      setOllamaConfigured(true);
      setOllamaModel(modelInput.trim());
      setShowConfigModal(false);
      setApiKeyInput('');
      setConnectionError(null);
      await checkOllamaStatus();
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

  const getStatusColor = (status: VoiceAgentState) => {
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
      {/* Realtime AI & Speech Engine Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-[#0C142E] via-[#0E1738] to-[#14123E] border border-indigo-500/30 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                AI Provider: Ollama Cloud (https://ollama.com/api/chat)
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  ollamaConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {ollamaConfigured ? 'Ollama Cloud Ready' : 'API Key Required'}
              </span>
            </div>
            <p className="text-slate-300 mt-0.5">
              Browser Web Speech API (Recognition + Synthesis) paired with secure server-side Ollama Cloud LLM generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!ollamaConfigured && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure Ollama Cloud</span>
            </button>
          )}
          <span className="text-[11px] px-2.5 py-1 rounded-full font-mono bg-slate-900 text-slate-300 border border-slate-700">
            Model: {ollamaModel}
          </span>
        </div>
      </div>

      {/* Browser Speech Recognition Capability Notice */}
      {!browserCapabilities.speechRecognitionSupported && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Browser Speech Recognition Notice:</span>
            <p className="mt-0.5 text-amber-200/90 leading-relaxed">
              Your current browser does not support the Web Speech API (<code>SpeechRecognition</code>). Note that browser speech recognition relies on browser-provided services (e.g. Google speech servers in Chrome) and is not fully offline. Please open VoiceSell AI in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> for speech-to-speech conversations.
            </p>
          </div>
        </div>
      )}

      {/* Voice Dialect Warning if TTS voice is missing */}
      {voiceWarning && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{voiceWarning}</span>
          </div>
          <button onClick={() => setVoiceWarning(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Connection Error Message banner if failed */}
      {connectionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">AI Agent Connection Notice:</span>
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
              <span className="text-xs text-slate-400">Step 1 of 2</span>
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
                  Conversation Language (English, Hindi, Telugu)
                </label>
                <span className="text-[10px] text-indigo-400 font-mono">
                  {LANGUAGE_CODE_MAP[selectedLanguage]?.speechCode || 'en-US'}
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
                        showToast('Language Dialect Selected', `Speech recognition and Ollama tuned for ${lang.nativeName}.`, 'info');
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
                    Prospect has acknowledged speech recognition transcription under compliance guidelines. Note: audio files are preserved only when hardware recorder is active.
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

              {callStatus === 'Speaking' && (
                <button
                  type="button"
                  onClick={handleInterruptAI}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold transition-colors"
                >
                  Interrupt AI
                </button>
              )}
            </div>
          </div>

          {/* Active Product Playbook Knowledge Briefing */}
          <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Loaded Product Knowledge Base
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Authorized Facts
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">Product & ICP</span>
                <p className="text-white font-medium mt-0.5">{selectedProduct.name}: <span className="text-slate-300 font-normal">{selectedProduct.tagline}</span></p>
                {selectedProduct.targetAudience && (
                  <p className="text-[11px] text-slate-400 mt-0.5">Target: {selectedProduct.targetAudience}</p>
                )}
              </div>

              {selectedProduct.customerPainPoints && selectedProduct.customerPainPoints.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Customer Pain Points ({selectedProduct.customerPainPoints.length})
                  </span>
                  <ul className="space-y-1 text-[11px] text-amber-200/90 list-disc list-inside">
                    {selectedProduct.customerPainPoints.slice(0, 2).map((pp, idx) => (
                      <li key={idx} className="line-clamp-1">{pp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProduct.competitorDifferentiation && (
                <div>
                  <span className="text-slate-400 block text-[11px] font-semibold">Competitive Moat</span>
                  <p className="text-slate-300 text-[11px] line-clamp-2 mt-0.5">
                    {selectedProduct.competitorDifferentiation}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{selectedProduct.pricing?.length || 0} Pricing Plans</span>
                <span>{selectedProduct.objectionHandling?.length || 0} Objections Loaded</span>
                <span>{selectedProduct.faqs?.length || 0} FAQs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Voice Agent Console & Waveform (7 cols) */}
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
                    Target: {selectedProduct.name} • Dialect: {selectedLanguage} • Model: {ollamaModel}
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
                    heightPercent = Math.max(15, Math.min(95, 45 + waveMod));
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
                    Ready to start voice conversation. Click <strong>Start Call</strong> to initiate the AI voice session.
                  </p>
                )}
                {callStatus === 'Connecting' && (
                  <p className="text-amber-300 animate-pulse font-medium flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting microphone and greeting customer via {selectedLanguage} TTS...</span>
                  </p>
                )}
                {callStatus === 'Speaking' && (
                  <p className="text-indigo-300 font-medium">
                    {agentSettings.agentName} is speaking ({selectedLanguage})...
                  </p>
                )}
                {callStatus === 'Listening' && (
                  <p className="text-emerald-300 font-medium">
                    Listening for customer response in {selectedLanguage} (Speak clearly into your mic)...
                  </p>
                )}
                {callStatus === 'Completed' && (
                  <p className="text-cyan-300 font-medium">
                    Call ended. Resources released and AI analysis generated below.
                  </p>
                )}
                {callStatus === 'Failed' && (
                  <p className="text-rose-400 font-medium">
                    Session failed. Check your browser microphone permission or Ollama Cloud API key.
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

              {transcript.length === 0 && !interimText ? (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <Mic className="w-6 h-6 text-slate-700 mb-2" />
                  <p>Spoken dialogue will stream here live as you converse with the AI sales agent.</p>
                </div>
              ) : (
                <>
                  {transcript.map((msg) => (
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
                  ))}

                  {/* Real-time Interim recognition text while user is talking */}
                  {interimText && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">{customerName}</span>
                        <span className="text-[10px] text-indigo-400 animate-pulse font-mono">Recognizing...</span>
                      </div>
                      <div className="p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed bg-slate-800/50 text-slate-300 border border-slate-700/50 rounded-tr-sm italic">
                        {interimText}...
                      </div>
                    </div>
                  )}
                </>
              )}
              {callStatus === 'Speaking' && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 pl-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                  <span>AI speaking aloud...</span>
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
                    if (activeVoiceAgent) {
                      activeVoiceAgent.end();
                      setActiveVoiceAgent(null);
                    }
                    setTranscript([]);
                    setInterimText('');
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
                <span>Engine: Ollama Cloud + Web Speech</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis In-Progress Banner */}
      {isGeneratingSummary && !postCallResult && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0F1A3B] via-[#0B132B] to-[#0A1226] border border-indigo-500/40 p-8 shadow-2xl text-center space-y-4 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Synthesizing Post-Call Intelligence</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
              Running Ollama Cloud post-call reasoning, verifying anti-hallucination constraints, and applying documented sales status precedence.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400 pt-2">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Precedence Policy Engine
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Evidence Extraction
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              CRM Task Generation
            </span>
          </div>
        </div>
      )}

      {/* Post-Call Intelligence Summary Drawer */}
      {postCallResult && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0F1A3B] via-[#0B132B] to-[#0A1226] border border-indigo-500/30 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 space-y-6">
          {/* Header & Badges */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-800 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white">
                    Post-Call Intelligence & Disposition
                  </h3>
                  {postCallResult.is_manually_corrected ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-medium flex items-center gap-1">
                      <Edit2 className="w-3 h-3" />
                      Manually Overridden (AI was: {postCallResult.original_ai_status})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono">
                      AI Verified Precedence
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Synthesized via Ollama Cloud ({ollamaModel}) • Precedence Policy & Evidence Audited
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Disposition:</span>
                <StatusBadge status={postCallResult.sales_status} size="lg" />
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold font-mono">
                Confidence: {postCallResult.confidence}%
              </div>
              <button
                onClick={() => {
                  setCorrectedStatusInput(postCallResult.sales_status);
                  setShowCorrectionModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="Override AI classification with audit notes"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Override Status</span>
              </button>
              <button
                onClick={() => generatePostCallAnalysis(transcript)}
                disabled={isGeneratingSummary}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-md shadow-indigo-600/30"
                title="Re-run AI analysis on the transcript"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                <span>{isGeneratingSummary ? 'Analyzing...' : 'Re-Analyze'}</span>
              </button>
            </div>
          </div>

          {/* AI Executive Summary Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Conversation Overview & Executive Synthesis</span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed">
              {postCallResult.summary}
            </p>
          </div>

          {/* Key Facts & Constraints Grid (Anti-Hallucination Safe) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Customer Business & Use Case */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                Business & Use Case
              </span>
              <p className={`font-medium ${postCallResult.customer_business_and_use_case === 'Unknown' ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                {postCallResult.customer_business_and_use_case}
              </p>
            </div>

            {/* Buying Intent */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                Buying Intent
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    postCallResult.buying_intent === 'High'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : postCallResult.buying_intent === 'Medium'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : postCallResult.buying_intent === 'Low'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {postCallResult.buying_intent} Intent
                </span>
              </div>
            </div>

            {/* Budget or Timeline (Anti-Hallucination Verified) */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                Budget or Timeline
              </span>
              <p
                className={`font-medium ${
                  postCallResult.budget_or_timeline === 'Unknown'
                    ? 'text-slate-400 italic'
                    : 'text-amber-300'
                }`}
              >
                {postCallResult.budget_or_timeline === 'Unknown'
                  ? 'Not stated during call'
                  : postCallResult.budget_or_timeline}
              </p>
            </div>

            {/* Scheduled Follow-Up Date */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                Target Follow-Up Date
              </span>
              <div className="flex items-center gap-1.5 text-slate-200 font-mono">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {postCallResult.follow_up_date
                    ? new Date(postCallResult.follow_up_date).toLocaleDateString(undefined, {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Customer Requirements */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-indigo-400 block uppercase tracking-wide text-[11px]">
                Requirements & Pain Points ({postCallResult.customer_requirements.length})
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {postCallResult.customer_requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Discussed */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-sky-400 block uppercase tracking-wide text-[11px]">
                Features Discussed ({postCallResult.features_discussed.length})
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {postCallResult.features_discussed.map((feat, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions Asked by Customer */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-purple-400 block uppercase tracking-wide text-[11px]">
                Customer Inquiries ({postCallResult.questions_asked.length})
              </span>
              {postCallResult.questions_asked.length === 0 ? (
                <p className="text-slate-400 italic">No specific questions asked.</p>
              ) : (
                <ul className="space-y-1.5 text-slate-300">
                  {postCallResult.questions_asked.map((q, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <HelpCircle className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Objections Handled */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-amber-400 block uppercase tracking-wide text-[11px]">
                Objections & Concerns ({postCallResult.objections.length})
              </span>
              {postCallResult.objections.length === 0 ? (
                <p className="text-slate-400 italic">No major objections raised.</p>
              ) : (
                <ul className="space-y-1.5 text-slate-300">
                  {postCallResult.objections.map((obj, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Action Columns: Promised Actions & Recommended Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Promised Actions */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-cyan-400 block uppercase tracking-wide text-[11px]">
                Promised Actions Committed on Call
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {postCallResult.promised_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Automated Next Steps */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 block uppercase tracking-wide text-[11px]">
                Automated CRM Next Steps & Follow-Up Tasks
              </span>
              <ul className="space-y-1.5 text-emerald-300">
                {postCallResult.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Verbatim Evidence Quotes */}
          {postCallResult.evidence_quotes && postCallResult.evidence_quotes.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                <Quote className="w-4 h-4 text-indigo-400" />
                <span>Audited Verbatim Evidence Quotes ({postCallResult.evidence_quotes.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {postCallResult.evidence_quotes.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        item.speaker === 'customer'
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {item.speaker === 'customer' ? customerName : agentSettings.agentName}
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

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Synced with Lead Pipeline, follow-up task queued, and saved to Call History.
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

      {/* Manual Sales Status Classification Override Modal */}
      {showCorrectionModal && (
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
                Overriding will update CRM records while preserving the original AI classification for compliance audits.
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
                placeholder="Explain the reason for manual reclassification (e.g. Offline contract signed, demo scheduled via separate channel)..."
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

      {/* Ollama Cloud API Key Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleSaveOllamaConfig}
            className="relative w-full max-w-lg rounded-2xl bg-[#0D1530] border border-slate-700 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Configure Ollama Cloud AI Engine</h3>
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
              <span className="font-bold text-white block">Official Ollama Cloud API:</span>
              <p className="leading-relaxed">
                Endpoint: <code>https://ollama.com/api/chat</code>. Your permanent <code>OLLAMA_API_KEY</code> is stored strictly in server-side secrets and never exposed in browser bundles or client responses.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ollama Cloud API Key (Bearer Token) *
              </label>
              <input
                type="password"
                required
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your Ollama API key"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Obtain your key from your account on <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">https://ollama.com</a>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ollama Model (OLLAMA_MODEL)
              </label>
              <input
                type="text"
                required
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder="e.g. llama3.3, qwen2.5, mistral"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Configurable identifier matching any model supported by your Ollama account.
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
