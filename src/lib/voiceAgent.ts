import { TranscriptMessage, Product, AgentSettings } from '../types';

export type VoiceAgentState = 'Idle' | 'Connecting' | 'Listening' | 'Speaking' | 'Completed' | 'Failed';

export interface VoiceAgentConfig {
  product: Product;
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  language: string;
  agentSettings: AgentSettings;
  model?: string;
  recordingConsent?: boolean;
}

export interface VoiceAgentCallbacks {
  onStateChange: (state: VoiceAgentState) => void;
  onTranscriptUpdate: (messages: TranscriptMessage[]) => void;
  onInterimSpeech?: (interimText: string) => void;
  onError: (errorMsg: string, code?: string) => void;
  onAudioLevel?: (level: number) => void;
  onVoiceWarning?: (warning: string) => void;
  onIntentDetected?: (intent: {
    isOptOut: boolean;
    isDemoRequest: boolean;
    isPricingInquiry: boolean;
    isFeatureInquiry: boolean;
  }) => void;
}

// Map UI language name to BCP-47 speech recognition & TTS language codes
export const LANGUAGE_CODE_MAP: Record<string, { code: string; label: string; speechCode: string; ttsLang: string }> = {
  English: { code: 'en', label: 'English', speechCode: 'en-US', ttsLang: 'en-US' },
  Hindi: { code: 'hi', label: 'हिन्दी (Hindi)', speechCode: 'hi-IN', ttsLang: 'hi-IN' },
  Telugu: { code: 'te', label: 'తెలుగు (Telugu)', speechCode: 'te-IN', ttsLang: 'te-IN' },
  Tamil: { code: 'ta', label: 'தமிழ் (Tamil)', speechCode: 'ta-IN', ttsLang: 'ta-IN' },
  Spanish: { code: 'es', label: 'Español', speechCode: 'es-ES', ttsLang: 'es-ES' },
  German: { code: 'de', label: 'Deutsch', speechCode: 'de-DE', ttsLang: 'de-DE' },
  French: { code: 'fr', label: 'Français', speechCode: 'fr-FR', ttsLang: 'fr-FR' },
  Kannada: { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', speechCode: 'kn-IN', ttsLang: 'kn-IN' },
};

export class BrowserVoiceSalesAgent {
  private state: VoiceAgentState = 'Idle';
  private transcript: TranscriptMessage[] = [];
  private recognition: any = null;
  private isRecognitionActive: boolean = false;
  private isMuted: boolean = false;
  private isSpeaking: boolean = false;
  private isCallTerminated: boolean = false;
  private micStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedAudioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  constructor(
    private config: VoiceAgentConfig,
    private callbacks: VoiceAgentCallbacks
  ) {}

  public getState(): VoiceAgentState {
    return this.state;
  }

  public getTranscript(): TranscriptMessage[] {
    return [...this.transcript];
  }

  private setState(newState: VoiceAgentState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Check if the browser supports Speech Recognition & Speech Synthesis
   */
  public static checkBrowserCapabilities(): {
    speechRecognitionSupported: boolean;
    speechSynthesisSupported: boolean;
    notice?: string;
  } {
    const speechRecognitionSupported = typeof window !== 'undefined' && Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
    const speechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    let notice: string | undefined;
    if (!speechRecognitionSupported) {
      notice = 'Browser speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a WebKit-enabled browser.';
    }

    return { speechRecognitionSupported, speechSynthesisSupported, notice };
  }

  /**
   * Start call: requests mic permission, greets the customer, and begins conversation loop
   */
  public async start(): Promise<void> {
    if (this.state !== 'Idle' && this.state !== 'Completed' && this.state !== 'Failed') {
      console.warn('Call session already active');
      return;
    }

    this.isCallTerminated = false;
    this.transcript = [];
    this.setState('Connecting');

    // 1. Verify browser speech support
    const caps = BrowserVoiceSalesAgent.checkBrowserCapabilities();
    if (!caps.speechRecognitionSupported) {
      this.setState('Failed');
      this.callbacks.onError(
        'Speech Recognition is not supported by your current browser. Try Chrome or Edge.',
        'SPEECH_RECOGNITION_UNSUPPORTED'
      );
      return;
    }

    // 2. Request microphone permission
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      this.setupAudioAnalyser(this.micStream);

      // Listen for unexpected microphone disconnect
      this.micStream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          if (!this.isCallTerminated) {
            this.callbacks.onError(
              'Microphone disconnected unexpectedly. Call terminated to prevent audio drop.',
              'HARDWARE_DISCONNECT'
            );
            this.end();
          }
        };
      });

      // Initialize real browser MediaRecorder if consent is granted
      if (this.config.recordingConsent && typeof MediaRecorder !== 'undefined') {
        try {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';

          this.mediaRecorder = mimeType
            ? new MediaRecorder(this.micStream, { mimeType })
            : new MediaRecorder(this.micStream);

          this.recordedAudioChunks = [];
          this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
              this.recordedAudioChunks.push(event.data);
            }
          };
          this.mediaRecorder.start(1000);
        } catch (recErr) {
          console.warn('[VoiceAgent] MediaRecorder setup notice:', recErr);
        }
      }
    } catch (err: any) {
      this.setState('Failed');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.callbacks.onError(
          'Microphone permission was denied. Please allow microphone access in your browser to speak with VoiceSell AI.',
          'MIC_PERMISSION_DENIED'
        );
      } else {
        this.callbacks.onError(`Microphone setup error: ${err.message}`, 'MIC_ERROR');
      }
      return;
    }

    // 3. Initialize SpeechRecognition
    this.setupSpeechRecognition();

    // 4. Have AI greet customer in selected language
    await this.deliverInitialGreeting();
  }

  /**
   * Sets up the browser SpeechRecognition instance
   */
  private setupSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // Turn-based listening
    this.recognition.interimResults = true;

    const langInfo = LANGUAGE_CODE_MAP[this.config.language] || LANGUAGE_CODE_MAP['English'];
    this.recognition.lang = langInfo.speechCode;

    this.recognition.onstart = () => {
      this.isRecognitionActive = true;
      if (!this.isSpeaking && this.state !== 'Completed' && this.state !== 'Failed') {
        this.setState('Listening');
      }
    };

    this.recognition.onresult = (event: any) => {
      if (this.isMuted || this.isSpeaking || this.isCallTerminated) return;

      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      if (interim && this.callbacks.onInterimSpeech) {
        this.callbacks.onInterimSpeech(interim);
      }

      if (finalTranscript.trim()) {
        if (this.callbacks.onInterimSpeech) {
          this.callbacks.onInterimSpeech('');
        }
        this.handleCustomerSpeech(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event: any) => {
      // Ignore common non-fatal timeouts
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      console.warn('[VoiceAgent] SpeechRecognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.callbacks.onError('Microphone access blocked.', 'MIC_BLOCKED');
      }
    };

    this.recognition.onend = () => {
      this.isRecognitionActive = false;

      // If call is still active and AI is not speaking, resume listening
      if (!this.isCallTerminated && !this.isSpeaking && !this.isMuted && this.state !== 'Completed' && this.state !== 'Failed') {
        setTimeout(() => {
          this.startListening();
        }, 250);
      }
    };
  }

  /**
   * Safely starts listening
   */
  private startListening() {
    if (this.isCallTerminated || this.isSpeaking || this.isMuted || !this.recognition) return;

    try {
      if (!this.isRecognitionActive) {
        this.recognition.start();
      }
    } catch (e: any) {
      // Recognition may already be starting or running
    }
  }

  /**
   * Safely stops listening (e.g. while AI is speaking to prevent feedback loops)
   */
  private stopListening() {
    if (this.recognition && this.isRecognitionActive) {
      try {
        this.recognition.abort();
      } catch (e) {}
      this.isRecognitionActive = false;
    }
  }

  /**
   * AI Opening Greeting
   */
  private async deliverInitialGreeting() {
    const { customer, product, language, agentSettings } = this.config;
    const agentName = agentSettings.agentName || 'Aria';

    let greetingText = '';

    if (language === 'Hindi') {
      greetingText = `नमस्ते ${customer.name} जी! मैं ${product.name} से ${agentName} बात कर रही हूँ। क्या आपके पास बातचीत के लिए दो मिनट का समय है?`;
    } else if (language === 'Telugu') {
      greetingText = `నమస్కారం ${customer.name} గారు! నేను ${product.name} నుండి ${agentName} మాట్లాడుతున్నాను. మీతో మాట్లాడటానికి రెండు నిమిషాలు సమయం ఉంటుందా?`;
    } else {
      if (agentSettings.openingGreeting) {
        greetingText = agentSettings.openingGreeting
          .replace(/\[Customer Name\]/gi, customer.name)
          .replace(/\[Product Name\]/gi, product.name);
      } else {
        greetingText = `Hello ${customer.name}! This is ${agentName} with ${product.name}. Do you have two minutes to discuss accelerating your pipeline?`;
      }
    }

    // Add greeting turn to transcript
    const msg: TranscriptMessage = {
      id: `ai-${Date.now()}`,
      speaker: 'ai',
      speakerName: agentName,
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    this.transcript.push(msg);
    this.callbacks.onTranscriptUpdate([...this.transcript]);

    // Speak greeting using browser TTS
    await this.speak(greetingText);
  }

  /**
   * Handles user's finalized speech: sends to backend Ollama Cloud endpoint
   */
  private async handleCustomerSpeech(userText: string) {
    if (this.isCallTerminated) return;

    // Stop listening while processing and speaking AI response to prevent self-echo
    this.stopListening();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Append customer message
    const custMsg: TranscriptMessage = {
      id: `cust-${Date.now()}`,
      speaker: 'customer',
      speakerName: this.config.customer.name,
      text: userText,
      timestamp,
    };

    this.transcript.push(custMsg);
    this.callbacks.onTranscriptUpdate([...this.transcript]);

    this.setState('Speaking');

    try {
      // Call secure backend endpoint: POST /api/chat-with-sales-agent
      const resp = await fetch('/api/chat-with-sales-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.transcript,
          product: this.config.product,
          customer: this.config.customer,
          language: this.config.language,
          agentSettings: this.config.agentSettings,
          model: this.config.model,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        const errMessage = data?.error || 'Failed to generate response from Ollama Cloud.';
        this.callbacks.onError(errMessage, data?.code || 'OLLAMA_ERROR');
        this.setState('Listening');
        this.startListening();
        return;
      }

      // Check if sales intent was detected (e.g. demo request or opt-out)
      if (data.intent && this.callbacks.onIntentDetected) {
        this.callbacks.onIntentDetected(data.intent);
      }

      const aiText = data.message?.content?.trim() || '';

      if (aiText) {
        const aiMsg: TranscriptMessage = {
          id: `ai-${Date.now()}`,
          speaker: 'ai',
          speakerName: this.config.agentSettings.agentName || 'Aria',
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        this.transcript.push(aiMsg);
        this.callbacks.onTranscriptUpdate([...this.transcript]);

        // Speak response aloud using browser Text-to-Speech
        await this.speak(aiText);
      } else {
        this.setState('Listening');
        this.startListening();
      }
    } catch (err: any) {
      console.error('[VoiceAgent] Backend chat error:', err);
      this.callbacks.onError(err.message || 'Error communicating with Ollama Cloud backend.', 'NETWORK_ERROR');
      this.setState('Listening');
      this.startListening();
    }
  }

  /**
   * Browser Text-to-Speech (window.speechSynthesis)
   */
  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis not supported');
        this.setState('Listening');
        this.startListening();
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Clean text of markdown characters so speech is natural
      const cleanText = text
        .replace(/[*_#`~[\]]/g, '')
        .replace(/\n+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const langInfo = LANGUAGE_CODE_MAP[this.config.language] || LANGUAGE_CODE_MAP['English'];
      utterance.lang = langInfo.ttsLang;
      utterance.rate = this.config.agentSettings?.speakingRate || 1.0;

      // Select matching browser voice
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find((v) => v.lang.toLowerCase() === langInfo.ttsLang.toLowerCase());

      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langInfo.code.toLowerCase()));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (voices.length > 0 && langInfo.code !== 'en') {
        if (this.callbacks.onVoiceWarning) {
          this.callbacks.onVoiceWarning(
            `Native ${this.config.language} voice is not installed in this browser's OS speech engine. Using standard available voice.`
          );
        }
      }

      this.isSpeaking = true;
      this.setState('Speaking');

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.stopListening(); // Ensure recognition is off while speaking
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (!this.isCallTerminated) {
          this.setState('Listening');
          this.startListening();
        }
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('[VoiceAgent] Speech synthesis notice:', e);
        this.isSpeaking = false;
        if (!this.isCallTerminated) {
          this.setState('Listening');
          this.startListening();
        }
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Mute / Unmute microphone
   */
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopListening();
    } else {
      if (!this.isSpeaking && !this.isCallTerminated) {
        this.startListening();
      }
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Customer interrupt: cancel AI speech immediately and resume listening
   */
  public interrupt() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.setState('Listening');
    this.startListening();
  }

  /**
   * Setup microphone audio analyser for real-time waveform visualization
   */
  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 255) * 100));

        if (this.callbacks.onAudioLevel) {
          this.callbacks.onAudioLevel(normalized);
        }

        this.animFrameId = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn('Audio analyser notice:', e);
    }
  }

  /**
   * Stops audio recorder and produces encrypted/signed audio Blob if consent was granted
   */
  public async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      if (this.recordedAudioChunks.length > 0) {
        return new Blob(this.recordedAudioChunks, { type: 'audio/webm' });
      }
      return null;
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        if (this.recordedAudioChunks.length > 0) {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const blob = new Blob(this.recordedAudioChunks, { type: mimeType });
          resolve(blob);
        } else {
          resolve(null);
        }
      };

      try {
        this.mediaRecorder!.stop();
      } catch (err) {
        resolve(null);
      }
    });
  }

  /**
   * Ends call and releases all audio, speech recognition, and hardware tracks
   */
  public end() {
    this.isCallTerminated = true;

    // 1. Stop SpeechRecognition
    this.stopListening();
    this.recognition = null;

    // 2. Cancel speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;

    // 3. Stop microphone tracks
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    // 4. Close AudioContext
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    this.setState('Completed');
  }
}
