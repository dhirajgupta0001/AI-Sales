import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../common/StatusBadge';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import { SalesStatus, TranscriptMessage, CallRecord } from '../../types';
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
  Save,
  MessageSquare,
  Flame,
  Info,
  ChevronDown
} from 'lucide-react';

type CallState = 'Idle' | 'Connecting' | 'Listening' | 'Speaking' | 'Completed' | 'Failed';

export const LiveCallPage: React.FC = () => {
  const {
    products,
    agentSettings,
    liveCallPrefill,
    clearLiveCallPrefill,
    addCallRecord,
    setCurrentTab,
    setSelectedCallId
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
  const [audioVolume, setAudioVolume] = useState(85);

  // Call runtime state
  const [callStatus, setCallStatus] = useState<CallState>('Idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isSimulatingAudio, setIsSimulatingAudio] = useState(false);

  // Post-call AI analysis result
  const [postCallResult, setPostCallResult] = useState<{
    summary: string;
    status: SalesStatus;
    objections: string[];
    requirements: string[];
    nextSteps: string[];
    score: number;
  } | null>(null);

  const timerRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

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

  // Call timer interval
  useEffect(() => {
    if (callStatus === 'Speaking' || callStatus === 'Listening' || callStatus === 'Connecting') {
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

  // Helper for conversational scripts based on selected language and product
  const getSimulatedConversationFlow = (lang: string, prodName: string, name: string) => {
    if (lang === 'Hindi') {
      return [
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `नमस्ते ${name} जी! मैं ${prodName} से Aria बात कर रही हूँ। मुझे उम्मीद है आप ठीक होंगे। क्या आपके पास 2 मिनट का समय है?`,
          delayMs: 1500,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `हाँ नमस्ते Aria जी। मैं ${prodName} के बारे में कुछ सवाल पूछना चाहता था। क्या यह हमारी मौजूदा पाइपलाइन के साथ आसानी से इंटीग्रेट हो जाता है?`,
          delayMs: 3800,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `बिल्कुल ${name} जी! ${prodName} आपके सभी प्रमुख टूल्स के साथ केवल 15 मिनट में कनेक्ट हो जाता है और ऑटोमैटिक डेटा सिंक करता है। आपकी टीम का लगभग 40% समय बचता है।`,
          delayMs: 7000,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `यह बहुत मददगार लग रहा है। क्या आप मुझे और मेरी टीम को इसका लाइव डेमो दिखा सकते हैं?`,
          delayMs: 10500,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `जी अवश्य! क्या कल दोपहर 3 बजे या परसों सुबह 11 बजे आपके लिए सही रहेगा? मैं तुरंत इनवाइट भेज देती हूँ।`,
          delayMs: 14000,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `कल दोपहर 3 बजे का समय एकदम उत्तम है। मेरे ईमेल पर भेज दीजिए। बहुत-बहुत धन्यवाद!`,
          delayMs: 17500,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `बहुत बढ़िया! मैंने इनवाइट भेज दिया है। कल दोपहर 3 बजे आपसे विस्तृत चर्चा होगी। आपका दिन शुभ हो!`,
          delayMs: 21000,
        },
      ];
    } else if (lang === 'Telugu') {
      return [
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `నమస్కారం ${name} గారు! నేను ${prodName} నుండి Aria మాట్లాడుతున్నాను. మీ బిజినెస్ ఆటోమేషన్ గురించి మాట్లాడటానికి ఒక నిమిషం దొరుకుతుందా?`,
          delayMs: 1500,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `నమస్కారం Aria గారు, అవును చెప్పండి. మీ ప్లాట్‌ఫామ్ కాస్ట్ మరియు ఫీచర్స్ ఎలా ఉన్నాయి?`,
          delayMs: 3800,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `${name} గారు, ${prodName} తో మీ టీమ్ ప్రొడక్టివిటీ దాదాపు రెట్టింపు అవుతుంది. మీ ప్రస్తుత టూల్స్ తో పోలిస్తే దాదాపు 35% కాస్ట్ సేవ్ అవుతుంది.`,
          delayMs: 7000,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `చాలా బాగుంది! మా టెక్నికల్ లీడ్స్‌కి ఒక డెమో చూపించగలరా?`,
          delayMs: 10500,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `తప్పకుండా అండీ! గురువారం ఉదయం 11 గంటలకు టెక్నికల్ డెమో సెట్ చేయమంటారా? మీ ఈమెయిల్‌కి లింక్ పంపుతాను.`,
          delayMs: 14000,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `సరేనండీ, గురువారం 11 గంటలకి డెమో పంపండి. కలుద్దాం.`,
          delayMs: 17500,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `ధన్యవాదాలు ${name} గారు! ఇన్విటేషన్ పంపించాను. హావ్ ఏ గ్రేట్ డే!`,
          delayMs: 21000,
        },
      ];
    } else {
      // English default
      return [
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `Hello ${name}! This is Aria from ${prodName}. I noticed your company is scaling sales and infrastructure operations — do you have two minutes to discuss accelerating your workflow?`,
          delayMs: 1500,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `Hi Aria, thanks for calling. We are actually evaluating options right now. How does ${prodName} compare to traditional solutions on pricing and implementation speed?`,
          delayMs: 4000,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `Great question, ${name}. Unlike legacy tools that take months to configure, ${prodName} deploys in under 35 minutes and delivers an average 3.4x ROI within 45 days. We also offer turnkey bi-directional sync with zero friction.`,
          delayMs: 7500,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `That is really impressive. We have a team meeting on Thursday — can you walk our engineering and sales leads through a live demo?`,
          delayMs: 11000,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `I would be delighted to! I have an open slot this Thursday at 2:00 PM EST or Friday at 10:30 AM EST. Which works better for your calendar?`,
          delayMs: 14500,
        },
        {
          speaker: 'customer' as const,
          speakerName: name,
          text: `Thursday at 2:00 PM EST works great. Please send the calendar invite to ${customerEmail}.`,
          delayMs: 18000,
        },
        {
          speaker: 'ai' as const,
          speakerName: agentSettings.agentName,
          text: `Confirmed! Calendar invite and technical brief dispatched to ${customerEmail}. Looking forward to connecting on Thursday, ${name}!`,
          delayMs: 21500,
        },
      ];
    }
  };

  // Start Call Handler
  const handleStartCall = () => {
    if (!consentAgreed) {
      showToast(
        'Recording Consent Required',
        'Customer recording consent must be acknowledged before connecting voice channels.',
        'warning'
      );
      return;
    }

    if (!micPermissionGranted) {
      showToast(
        'Microphone Permission Denied',
        'Enable browser microphone access to allow the voice agent to hear speech input.',
        'error'
      );
      return;
    }

    setTranscript([]);
    setCallSeconds(0);
    setPostCallResult(null);
    setCallStatus('Connecting');
    setIsSimulatingAudio(true);

    showToast(
      'Voice Call Initialized',
      `Connecting to ${customerName} in ${selectedLanguage} via VoiceSell AI fleet...`,
      'info'
    );

    // Sequence the conversation turns
    setTimeout(() => {
      setCallStatus('Speaking');
    }, 1200);

    const script = getSimulatedConversationFlow(selectedLanguage, selectedProduct.name, customerName);

    script.forEach((item, index) => {
      setTimeout(() => {
        // Toggle speaking vs listening states
        setCallStatus(item.speaker === 'ai' ? 'Speaking' : 'Listening');

        const newMsg: TranscriptMessage = {
          id: `live-m-${Date.now()}-${index}`,
          speaker: item.speaker,
          speakerName: item.speakerName,
          text: item.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setTranscript((prev) => [...prev, newMsg]);

        // If this is the last message, conclude call
        if (index === script.length - 1) {
          setTimeout(() => {
            handleCompleteCall(script);
          }, 3500);
        }
      }, item.delayMs);
    });
  };

  // End Call Handler
  const handleEndCall = () => {
    if (callStatus === 'Idle' || callStatus === 'Completed') return;

    setCallStatus('Completed');
    setIsSimulatingAudio(false);
    showToast('Call Concluded', `Call ended after ${formatTimer(callSeconds)}. Synthesizing AI summary...`, 'info');

    generatePostCallAnalysis();
  };

  const handleCompleteCall = (script: any[]) => {
    setCallStatus('Completed');
    setIsSimulatingAudio(false);
    showToast('Call Successfully Completed', 'AI conversation finished. Post-call analysis generated.', 'success');
    generatePostCallAnalysis();
  };

  const generatePostCallAnalysis = () => {
    // Generate realistic AI summary
    const isTelugu = selectedLanguage === 'Telugu';
    const isHindi = selectedLanguage === 'Hindi';

    const resultSummary = isHindi
      ? `${customerName} ने ${selectedProduct.name} के ऑटोमेशन और आसान इंटीग्रेशन में गहरी रुचि दिखाई। टीम ने कल दोपहर 3 बजे लाइव डेमो के लिए सहमति दी है।`
      : isTelugu
      ? `${customerName} గారు ${selectedProduct.name} ఫీచర్స్ మరియు ROI గురించి విచారించారు. గురువారం 11 గంటల టెక్నికల్ డెమో బుక్ చేశారు.`
      : `${customerName} was highly receptive to ${selectedProduct.name}'s rapid 35-minute deployment and 3.4x ROI benchmark. Successfully locked in a live team demonstration for Thursday.`;

    const status: SalesStatus = 'Demo Requested';

    const postAnalysis = {
      summary: resultSummary,
      status: status,
      objections: [
        'Implementation timeframe vs legacy vendors',
        'Multi-seat licensing and budget allocation'
      ],
      requirements: [
        'Bi-directional CRM & API integration',
        'Executive team live demonstration'
      ],
      nextSteps: [
        `Calendar invitation confirmed for ${customerEmail}`,
        'Dispatched product collateral & pricing breakdown',
        'Assigned lead to Enterprise Account Executive'
      ],
      score: 95
    };

    setPostCallResult(postAnalysis);

    const callStartTime = new Date(Date.now() - Math.max(callSeconds, 24) * 1000).toISOString();
    const callEndTime = new Date().toISOString();

    // Create a mock audio recording blob for private Supabase Storage upload
    const mockAudioBlob = new Blob(['RIFF....WAVEfmt ....data....voicesell-recording-sample'], {
      type: 'audio/wav',
    });

    // Automatically construct a CallRecord with full schema fields
    const newRecord: CallRecord = {
      id: `call-${Date.now()}`,
      customerName,
      customerEmail,
      customerPhone,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startTime: callStartTime,
      endTime: callEndTime,
      durationSeconds: Math.max(callSeconds, 24),
      status: postAnalysis.status,
      callStatus: 'Completed',
      language: selectedLanguage,
      recordingAvailable: true,
      recordingDuration: formatTimer(Math.max(callSeconds, 24)),
      recordingStoragePath: `call-recordings/${Date.now()}.wav`,
      sentiment: 'Positive',
      aiScore: postAnalysis.score,
      transcript: transcript.length > 0 ? transcript : [
        {
          id: 't-default-1',
          speaker: 'ai',
          speakerName: agentSettings.agentName,
          text: `Connected with ${customerName} for ${selectedProduct.name}.`,
          timestamp: '00:05'
        }
      ],
      aiSummary: postAnalysis.summary,
      objections: postAnalysis.objections,
      customerRequirements: postAnalysis.requirements,
      nextSteps: postAnalysis.nextSteps,
      consentStatus: consentAgreed,
      consentTimestamp: new Date().toISOString(),
      aiAnalysisMetadata: {
        voiceModel: agentSettings.voicePreference,
        speakingRate: agentSettings.speakingRate,
        dispositionEngine: 'VoiceSell-Telemetry-v1',
      },
    };

    addCallRecord(newRecord, mockAudioBlob);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: CallState) => {
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
      {/* Notice Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-white">Live Voice Agent Studio (Stage 1 Interface)</span>
            <p className="text-slate-300 mt-0.5">
              Interactive voice simulation engine with multilingual conversation cadence, animated audio waveforms, and instant post-call disposition.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full font-mono bg-slate-900 text-slate-300 border border-slate-700">
            Engine: ElevenLabs + GPT-4o
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Profile & Call Setup (4 cols) */}
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Conversation Language
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.name;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.name);
                        showToast('Voice Dialect Switched', `Aria will converse in ${lang.nativeName}.`, 'info');
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
                        <CheckCircle2 className="w-3 h-3" /> Consent Confirmed
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-medium flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> Consent Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Prospect has been informed and agreed to call audio monitoring and transcription under enterprise compliance policies.
                  </p>
                </div>
              </label>
            </div>

            {/* Hardware & Mute indicators */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMicPermissionGranted(!micPermissionGranted);
                    showToast(
                      micPermissionGranted ? 'Microphone Access Suspended' : 'Microphone Access Granted',
                      micPermissionGranted ? 'Agent will not capture local mic.' : 'Browser audio permissions active.',
                      micPermissionGranted ? 'warning' : 'success'
                    );
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    micPermissionGranted
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mic: {micPermissionGranted ? 'Allowed' : 'Blocked'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMuted(!isMuted);
                    showToast(
                      isMuted ? 'Microphone Unmuted' : 'Microphone Muted',
                      isMuted ? 'Agent is now listening to user speech.' : 'Microphone input silenced.',
                      'info'
                    );
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    isMuted
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isMuted ? 'Muted' : 'Unmuted'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="font-mono text-[11px]">{audioVolume}% Vol</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Voice Agent Console & Waveform (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-2xl space-y-6 flex flex-col justify-between min-h-[560px]">
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
                    Target: {selectedProduct.name} • {selectedLanguage}
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

            {/* Audio Waveform & Visualizer Stage */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#060B18] to-[#0A122A] border border-slate-800/80 p-6 flex flex-col items-center justify-center min-h-[160px] text-center">
              {/* Dynamic waveform visualization */}
              <div className="w-full flex items-center justify-center gap-1.5 h-16 py-2">
                {[
                  8, 14, 24, 38, 52, 28, 44, 60, 48, 32, 58, 72, 45, 62, 35, 20, 45, 68, 50, 30, 22, 12, 6,
                ].map((val, idx) => {
                  const isSpeaking = callStatus === 'Speaking';
                  const isListening = callStatus === 'Listening';
                  const height = isSpeaking
                    ? `${Math.max(10, Math.sin((idx + callSeconds * 3) * 0.8) * 45 + 50)}%`
                    : isListening
                    ? `${Math.max(10, Math.cos((idx + callSeconds * 2) * 0.5) * 30 + 35)}%`
                    : '15%';

                  return (
                    <div
                      key={idx}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isSpeaking
                          ? 'bg-gradient-to-t from-indigo-500 to-violet-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                          : isListening
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : 'bg-slate-800'
                      }`}
                      style={{ height }}
                    />
                  );
                })}
              </div>

              {/* Status prompt */}
              <div className="mt-3">
                {callStatus === 'Idle' && (
                  <p className="text-xs text-slate-400">
                    Ready to initiate voice call. Click <strong>Start Call</strong> below to launch.
                  </p>
                )}
                {callStatus === 'Connecting' && (
                  <p className="text-xs text-amber-300 animate-pulse font-medium">
                    Establishing low-latency WebRTC telephony trunk & voice stream...
                  </p>
                )}
                {callStatus === 'Speaking' && (
                  <p className="text-xs text-indigo-300 font-medium">
                    {agentSettings.agentName} is vocalizing value proposition & qualifying requirements...
                  </p>
                )}
                {callStatus === 'Listening' && (
                  <p className="text-xs text-emerald-300 font-medium">
                    Listening to customer speech in {selectedLanguage} (Deepgram ASR active)...
                  </p>
                )}
                {callStatus === 'Completed' && (
                  <p className="text-xs text-cyan-300 font-medium">
                    Call session completed. AI intelligence summary generated below.
                  </p>
                )}
              </div>
            </div>

            {/* Real-time Chat Transcript */}
            <div className="flex-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 p-4 overflow-y-auto max-h-64 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Live Conversational Transcript</span>
                </span>
                <span className="font-mono text-[11px]">{transcript.length} turns recorded</span>
              </div>

              {transcript.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <Mic className="w-6 h-6 text-slate-700 mb-2" />
                  <p>Transcript will stream here in real time as the conversation progresses.</p>
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
              <div ref={transcriptEndRef} />
            </div>

            {/* Call Action Bar: Start / End Call */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {callStatus === 'Idle' || callStatus === 'Completed' ? (
                  <button
                    onClick={handleStartCall}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Start Live Call</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Voice Call</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setTranscript([]);
                    setCallSeconds(0);
                    setCallStatus('Idle');
                    setPostCallResult(null);
                    showToast('Session Reset', 'Transcript and live session cleared.', 'info');
                  }}
                  disabled={callStatus === 'Speaking' || callStatus === 'Listening'}
                  className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Status Pill Indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ASR / TTS: Connected (Simulation)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Call Intelligence Summary Drawer / Box */}
      {postCallResult && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0F1A3B] via-[#0B132B] to-[#0A1226] border border-indigo-500/30 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Post-Call Intelligence & Classification
                </h3>
                <p className="text-xs text-slate-300">
                  AI analysis synthesized from live audio transcript
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
                onClick={() => {
                  setCurrentTab('call-history');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>View in Call History</span>
              </button>
              <button
                onClick={() => {
                  setCurrentTab('leads');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <span>Open Leads Pipeline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
