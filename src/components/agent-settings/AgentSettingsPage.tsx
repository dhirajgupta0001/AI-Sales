import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { SUPPORTED_LANGUAGES } from '../../data/mockData';
import {
  Sliders,
  Volume2,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Save,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  HelpCircle,
  Radio,
  SlidersHorizontal,
  VolumeX
} from 'lucide-react';

export const AgentSettingsPage: React.FC = () => {
  const { agentSettings, updateAgentSettings, setCurrentTab } = useApp();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    ...agentSettings,
    salesTone: agentSettings.salesTone || 'Consultative',
    qualificationQuestions: agentSettings.qualificationQuestions || [],
    productSpecificInstructions: agentSettings.productSpecificInstructions || '',
    closingBehavior: agentSettings.closingBehavior || '',
  });
  const [newRuleText, setNewRuleText] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isPlayingGreeting, setIsPlayingGreeting] = useState(false);
  const [testedGreetingLang, setTestedGreetingLang] = useState('English');

  const availableVoices = [
    { id: 'v1', name: 'ElevenLabs Nova (Natural Expressive)', gender: 'female', accents: 'US & Global English' },
    { id: 'v2', name: 'ElevenLabs Aditi (Multilingual Hinglish & Indic)', gender: 'female', accents: 'Hindi, English, Telugu' },
    { id: 'v3', name: 'ElevenLabs Marcus (Consultative Enterprise)', gender: 'male', accents: 'US Corporate' },
    { id: 'v4', name: 'Browser Web Speech Native (English / Hindi / Telugu)', gender: 'neutral', accents: 'OS Native Voices' },
    { id: 'v5', name: 'Deepgram Aura Asteria (Sub-200ms Low Latency)', gender: 'female', accents: 'Conversational' }
  ];

  const salesApproaches = [
    { name: 'Consultative', desc: 'Focuses on deep discovery, uncovering pain points, and positioning tailored ROI.' },
    { name: 'Solution Selling', desc: 'Matches explicit technical bottlenecks to architectural capabilities.' },
    { name: 'Spin Selling', desc: 'Systematically walks through Situation, Problem, Implication, and Need-payoff.' },
    { name: 'Value-Based', desc: 'Centers discussion around economic impact, deferred billing, and measurable payback.' },
    { name: 'Challenger', desc: 'Teaches prospects novel perspectives, reframes status quo, and takes control.' }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAgentSettings(formData);
    showToast(
      'Agent Settings Saved',
      `${formData.agentName} conversational configuration successfully updated.`,
      'success'
    );
  };

  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setFormData({
      ...formData,
      conversationRules: [...formData.conversationRules, newRuleText.trim()]
    });
    setNewRuleText('');
    showToast('Conversation Rule Added', 'New boundary rule enqueued.', 'info');
  };

  const handleRemoveRule = (index: number) => {
    setFormData({
      ...formData,
      conversationRules: formData.conversationRules.filter((_, i) => i !== index)
    });
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setFormData({
      ...formData,
      qualificationQuestions: [...formData.qualificationQuestions, newQuestionText.trim()]
    });
    setNewQuestionText('');
    showToast('Qualification Question Added', 'Agent will discover this criteria in sequence.', 'info');
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData({
      ...formData,
      qualificationQuestions: formData.qualificationQuestions.filter((_, i) => i !== index)
    });
  };

  const toggleLanguage = (langName: string) => {
    const exists = formData.supportedLanguages.includes(langName);
    if (exists) {
      if (formData.supportedLanguages.length <= 1) {
        showToast('Error', 'At least one supported language must remain active.', 'warning');
        return;
      }
      setFormData({
        ...formData,
        supportedLanguages: formData.supportedLanguages.filter((l) => l !== langName)
      });
    } else {
      setFormData({
        ...formData,
        supportedLanguages: [...formData.supportedLanguages, langName]
      });
    }
  };

  const playGreetingPreview = (lang: string) => {
    setIsPlayingGreeting(true);
    setTestedGreetingLang(lang);
    showToast(
      'Audio Simulation Playing',
      `Streaming ${formData.agentName}'s opening greeting in ${lang}...`,
      'info'
    );
    setTimeout(() => {
      setIsPlayingGreeting(false);
    }, 4500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B132B] via-[#0E1635] to-[#12163E] border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Sales Agent Configuration & Persona Tuning
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Configure agent personality, voice engine synthesis, opening greetings, multilingual conversation rules, and automated demo scheduling protocols.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('live-call')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-colors"
          >
            <span>Test in Live Studio</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Persona, Voice & Greetings (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Agent Persona & Identity */}
            <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">Agent Identity & Personality</h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Autonomous SDR
                </span>
              </div>

              {/* Agent Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Agent Public Name & Title
                </label>
                <input
                  type="text"
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  placeholder="e.g. Aria — Enterprise Voice SDR"
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Personality Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Agent Core Personality & Behavioral Persona
                </label>
                <textarea
                  rows={3}
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Sales Approach */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Primary Sales Methodology & Approach
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {salesApproaches.map((appr) => {
                    const isSelected = formData.salesApproach === appr.name;
                    return (
                      <div
                        key={appr.name}
                        onClick={() =>
                          setFormData({ ...formData, salesApproach: appr.name as any })
                        }
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>{appr.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {appr.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conversational Sales Tone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Conversational Sales Tone
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Consultative',
                    'Challenger',
                    'Enthusiastic',
                    'Friendly & Professional',
                    'Direct & ROI-focused',
                  ].map((toneOption) => {
                    const isSelected = formData.salesTone === toneOption;
                    return (
                      <button
                        key={toneOption}
                        type="button"
                        onClick={() => setFormData({ ...formData, salesTone: toneOption as any })}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {toneOption}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Voice Engine & Audio Synthesis */}
            <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-violet-400" />
                  <h3 className="font-bold text-white text-base">
                    Voice Preference & Audio Cadence
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">ElevenLabs v2 Ultra</span>
              </div>

              {/* Voice Preference */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Selected Neural Voice Model
                </label>
                <select
                  value={formData.voicePreference}
                  onChange={(e) => setFormData({ ...formData, voicePreference: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  {availableVoices.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.gender}, {v.accents})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sliders: Rate & Interruption */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold">Speaking Pace</span>
                    <span className="font-mono text-indigo-400">{formData.speakingRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={formData.speakingRate}
                    onChange={(e) =>
                      setFormData({ ...formData, speakingRate: parseFloat(e.target.value) })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Deliberate (0.8x)</span>
                    <span>Natural (1.0x)</span>
                    <span>Brisk (1.2x)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold">Interruption Handling</span>
                    <span className="font-mono text-indigo-400">
                      {formData.interruptionHandling}
                    </span>
                  </div>
                  <select
                    value={formData.interruptionHandling}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interruptionHandling: e.target.value as any,
                      })
                    }
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                  >
                    <option value="Context-Aware">Context-Aware (400ms pause buffer)</option>
                    <option value="Polite">Polite (Finishes thought then yields)</option>
                    <option value="Aggressive">Aggressive (Immediate hard cut)</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    How agent reacts when customer talks over the audio stream.
                  </p>
                </div>
              </div>

              {/* Ambient Noise Suppression */}
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900 text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block">
                    AI Ambient Noise Suppression (DeepFilterNet)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Filters out background office noise, typing, and mobile speaker echo.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.ambientNoiseSuppression}
                  onChange={(e) =>
                    setFormData({ ...formData, ambientNoiseSuppression: e.target.checked })
                  }
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-800"
                />
              </label>
            </div>

            {/* Opening Greeting Template & Live Audio Test */}
            <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">
                    Opening Greeting & Speech Simulation
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Tokens: [Customer Name], [Product Name]</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Opening Greeting Script
                </label>
                <textarea
                  rows={3}
                  value={formData.openingGreeting}
                  onChange={(e) => setFormData({ ...formData, openingGreeting: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>

              {/* Test Greeting Audio Bar */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-[#0A1128] border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => playGreetingPreview(testedGreetingLang)}
                    disabled={isPlayingGreeting}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 shrink-0"
                  >
                    {isPlayingGreeting ? (
                      <Radio className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>

                  <div>
                    <span className="text-xs font-semibold text-white block">
                      {isPlayingGreeting
                        ? `Synthesizing ${testedGreetingLang} Voice...`
                        : 'Preview Agent Opening Voice Audio'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Using {formData.voicePreference.split('(')[0]}
                    </span>
                  </div>
                </div>

                {/* Dialect selector for preview */}
                <div className="flex items-center gap-1.5 text-xs">
                  {['English', 'Hindi', 'Telugu'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => playGreetingPreview(l)}
                      className={`px-2.5 py-1 rounded-lg border font-medium text-[11px] transition-colors ${
                        testedGreetingLang === l && isPlayingGreeting
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      Test in {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Multilingual, Rules, Demo Booking (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Multilingual Support Matrix */}
            <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Supported Languages</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {formData.supportedLanguages.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select which localized languages and dialects the agent is authorized to converse in.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isActive = formData.supportedLanguages.includes(lang.name);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.name)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600/15 border-indigo-500/80 text-white shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{lang.flag}</span>
                        <span className="font-semibold">{lang.name}</span>
                      </span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Rules & Boundaries */}
            <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-base">Conversation Rules</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {formData.conversationRules.length} Rules
                </span>
              </div>

              {/* Add rule input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  placeholder="e.g. Never mention competitor pricing without ROI..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Add
                </button>
              </div>

              {/* Rules list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {formData.conversationRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-start justify-between gap-2 text-slate-200 group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-indigo-400 text-[10px] mt-0.5">
                        #{idx + 1}
                      </span>
                      <p className="leading-relaxed">{rule}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualification Questions Framework */}
            <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-base">Discovery & Qualification Questions</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {formData.qualificationQuestions.length} Questions
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The agent asks these qualification questions <strong className="text-slate-200">one at a time</strong> during the discovery phase to uncover acute bottlenecks before positioning product benefits.
              </p>

              {/* Add question input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="e.g. What is your current team size and outbound volume?..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Add Question
                </button>
              </div>

              {/* Questions list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {formData.qualificationQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-start justify-between gap-2 text-slate-200 group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-indigo-400 text-[10px] mt-0.5 font-bold">
                        Q{idx + 1}
                      </span>
                      <p className="leading-relaxed">{q}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up Behavior, Product Instructions & Closing Behavior */}
            <div className="rounded-2xl bg-[#0B132B]/90 backdrop-blur-md border border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Closing Behavior & Guardrails</h3>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Demo Scheduling Protocol
                </label>
                <textarea
                  rows={2}
                  value={formData.demoBookingInstructions}
                  onChange={(e) =>
                    setFormData({ ...formData, demoBookingInstructions: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Product-Specific Instructions & Boundary Safeguards
                </label>
                <textarea
                  rows={2}
                  value={formData.productSpecificInstructions}
                  onChange={(e) =>
                    setFormData({ ...formData, productSpecificInstructions: e.target.value })
                  }
                  placeholder="Rules for addressing unannounced features, technical limits, or security claims..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Closing Behavior & Immediate Opt-Out Compliance
                </label>
                <textarea
                  rows={2}
                  value={formData.closingBehavior}
                  onChange={(e) =>
                    setFormData({ ...formData, closingBehavior: e.target.value })
                  }
                  placeholder="How the agent concludes the conversation and respects customer requests to end outreach..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Post-Call CRM Follow-Up Behavior
                </label>
                <textarea
                  rows={2}
                  value={formData.followUpBehavior}
                  onChange={(e) =>
                    setFormData({ ...formData, followUpBehavior: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              setFormData({ ...agentSettings });
              showToast('Reset Changes', 'Settings reverted to saved values.', 'info');
            }}
            className="px-4 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Reset Changes
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
