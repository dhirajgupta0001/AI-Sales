import { TranscriptMessage } from '../types';

export type RealtimeState = 'Idle' | 'Connecting' | 'Listening' | 'Speaking' | 'Completed' | 'Failed';

export interface RealtimeConfig {
  product: {
    name: string;
    description: string;
    features: string[];
    pricing: any[];
    salesPitch: string;
    tone: string;
    callToAction: string;
    aiInstructions?: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  language: string;
  voice: string;
  agentName: string;
  speakingRate?: number;
}

export interface RealtimeCallbacks {
  onStateChange: (state: RealtimeState) => void;
  onTranscriptUpdate: (messages: TranscriptMessage[]) => void;
  onError: (errorMsg: string, code?: string) => void;
  onInterrupted: () => void;
  onAudioLevel?: (level: number) => void;
}

export class OpenAIRealtimeVoiceSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  private state: RealtimeState = 'Idle';
  private transcript: TranscriptMessage[] = [];
  private currentAiMessageId: string | null = null;
  private currentCustomerMessageId: string | null = null;

  private isMuted: boolean = false;
  private isAIResponding: boolean = false;

  constructor(
    private config: RealtimeConfig,
    private callbacks: RealtimeCallbacks
  ) {}

  public getState(): RealtimeState {
    return this.state;
  }

  public getTranscript(): TranscriptMessage[] {
    return [...this.transcript];
  }

  private setState(newState: RealtimeState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Builds the system prompt tailored to the selected SaaS product and language
   */
  private buildSystemPrompt(): string {
    const { product, customer, language, agentName } = this.config;

    return `
You are ${agentName}, an autonomous enterprise AI voice sales development representative (SDR) for "${product.name}".
You are on a live, interactive phone conversation with a prospect named "${customer.name}".

### Primary Objectives:
1. Greet the customer warmly and ask if they have 2 minutes to discuss improving their workflow.
2. Deliver the core value pitch: "${product.salesPitch}".
3. Discover their current challenges before proposing tiers.
4. Answer questions accurately based on the product features and pricing.
5. Guide the conversation toward the call-to-action: "${product.callToAction}".

### Product Knowledge:
- Product: ${product.name}
- Tagline: ${product.description}
- Key Features: ${product.features.join(', ')}
- Pricing: ${JSON.stringify(product.pricing)}
- Sales Tone: ${product.tone}

### Multilingual & Language Rules:
- Primary Conversation Language: ${language}.
- When starting, begin speaking in ${language}.
- If the customer switches to or speaks in another language (such as Hindi, Telugu, English, or Tamil), seamlessly and naturally match their language!
- CRITICAL: Never mistranslate technical terms, brand names, product names, or pricing (e.g. keep "${product.name}", "Kubernetes", "$129/user/mo", "Salesforce", "API" intact without transliteration corruption).
- In Hindi, address the customer respectfully with localized titles (e.g. "${customer.name} ji").
- In Telugu, address the customer respectfully (e.g. "${customer.name} Garu").

### Conversational Voice Pacing Rules:
- This is a natural spoken conversation over low-latency WebRTC.
- Keep responses short, concise, and punchy (1 to 2 sentences per turn).
- Never speak in long paragraphs or read bulleted lists.
- Allow the prospect room to reply.
- When interrupted, yield immediately.
${product.aiInstructions ? `\n### Specific Playbook Instructions:\n${product.aiInstructions}` : ''}
`.trim();
  }

  /**
   * Maps voice name preference to OpenAI Realtime voice
   */
  private getOpenAIVoice(): string {
    const voicePref = this.config.voice?.toLowerCase() || '';
    if (voicePref.includes('shimmer') || voicePref.includes('nova')) return 'shimmer';
    if (voicePref.includes('echo') || voicePref.includes('marcus')) return 'echo';
    if (voicePref.includes('verse')) return 'verse';
    if (voicePref.includes('coral') || voicePref.includes('aditi')) return 'coral';
    if (voicePref.includes('sage')) return 'sage';
    if (voicePref.includes('ash')) return 'ash';
    return 'alloy';
  }

  /**
   * Initializes and starts the WebRTC session
   */
  public async start(): Promise<void> {
    if (this.state !== 'Idle' && this.state !== 'Completed' && this.state !== 'Failed') {
      console.warn('Session already active or connecting');
      return;
    }

    this.setState('Connecting');
    this.transcript = [];
    this.currentAiMessageId = null;
    this.currentCustomerMessageId = null;

    try {
      // Step 1: Request short-lived ephemeral session token from secure backend endpoint
      const sessionResp = await fetch('/api/realtime-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: this.buildSystemPrompt(),
          voice: this.getOpenAIVoice(),
          language: this.config.language,
          productName: this.config.product.name,
        }),
      });

      const sessionJson = await sessionResp.json();

      if (!sessionResp.ok || !sessionJson.ok) {
        const errorMsg = sessionJson.error || 'Failed to initialize session with backend.';
        const code = sessionJson.code || 'SESSION_ERROR';
        this.setState('Failed');
        this.callbacks.onError(errorMsg, code);
        return;
      }

      const ephemeralKey = sessionJson.client_secret;
      if (!ephemeralKey) {
        throw new Error('Backend returned missing client_secret token.');
      }

      // Step 2: Request microphone access from user
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 24000,
          },
        });
      } catch (micErr: any) {
        this.setState('Failed');
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
          this.callbacks.onError('Microphone access was denied. Please allow microphone permission in your browser to talk with VoiceSell AI.', 'MIC_PERMISSION_DENIED');
        } else {
          this.callbacks.onError(`Could not access microphone: ${micErr.message}`, 'MIC_ERROR');
        }
        return;
      }

      // Setup audio analyzer for waveform visualizer
      this.setupAudioAnalyser(this.localStream);

      // Step 3: Setup WebRTC PeerConnection
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Setup remote audio playback element
      this.remoteAudio = document.createElement('audio');
      this.remoteAudio.autoplay = true;

      this.pc.ontrack = (event) => {
        if (this.remoteAudio && event.streams[0]) {
          this.remoteAudio.srcObject = event.streams[0];
          // Connect remote audio to visualizer as well when speaking
          this.setupAudioAnalyser(event.streams[0]);
        }
      };

      // Add local microphone tracks to PeerConnection
      this.localStream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });

      // Setup data channel for Realtime events (oai-events)
      this.dc = this.pc.createDataChannel('oai-events');
      this.setupDataChannel(this.dc);

      // Step 4: Create SDP Offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Step 5: Send SDP offer to OpenAI Realtime WebRTC endpoint using the ephemeral token
      const model = sessionJson.model || 'gpt-4o-realtime-preview-2024-12-17';
      const sdpUrl = `https://api.openai.com/v1/realtime?model=${model}`;

      const sdpResponse = await fetch(sdpUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        throw new Error(`OpenAI WebRTC SDP negotiation failed (${sdpResponse.status}): ${errorText}`);
      }

      const answerSdp = await sdpResponse.text();
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      // Connection is live!
      this.setState('Listening');
    } catch (err: any) {
      console.error('[RealtimeClient] Start error:', err);
      this.cleanup();
      this.setState('Failed');
      this.callbacks.onError(err.message || 'Error establishing Realtime WebRTC connection', 'CONNECTION_ERROR');
    }
  }

  /**
   * Sets up Data Channel event handlers for real-time speech and transcript
   */
  private setupDataChannel(dc: RTCDataChannel) {
    dc.onopen = () => {
      // Trigger initial greeting automatically once channel opens
      this.sendInitialGreeting();
    };

    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerEvent(data);
      } catch (err) {
        console.warn('[RealtimeClient] Failed to parse message:', event.data);
      }
    };

    dc.onerror = (err) => {
      console.warn('[RealtimeClient] Data channel error:', err);
    };

    dc.onclose = () => {
      if (this.state !== 'Completed') {
        this.setState('Completed');
      }
    };
  }

  /**
   * Dispatches initial greeting prompt to the AI agent
   */
  private sendInitialGreeting() {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const { customer, product, language } = this.config;

    const event = {
      type: 'response.create',
      response: {
        modalities: ['audio', 'text'],
        instructions: `Say a brief, professional opening greeting to ${customer.name} introducing yourself from ${product.name} in ${language}. Ask if they have two minutes to speak.`,
      },
    };

    this.dc.send(JSON.stringify(event));
  }

  /**
   * Handles incoming Realtime events from OpenAI server
   */
  private handleServerEvent(data: any) {
    const type = data.type;

    switch (type) {
      // 1. User Speech Started (Customer speaks)
      case 'input_audio_buffer.speech_started': {
        // Customer interrupted the AI!
        if (this.isAIResponding) {
          this.interruptAI();
        }
        this.setState('Listening');
        this.currentCustomerMessageId = `msg-cust-${Date.now()}`;
        break;
      }

      // 2. User Speech Stopped
      case 'input_audio_buffer.speech_stopped': {
        break;
      }

      // 3. Customer Speech Transcription Completed
      case 'conversation.item.input_audio_transcription.completed': {
        const userText = data.transcript?.trim();
        if (userText) {
          const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const msg: TranscriptMessage = {
            id: `cust-${Date.now()}`,
            speaker: 'customer',
            speakerName: this.config.customer.name,
            text: userText,
            timestamp,
          };

          this.transcript.push(msg);
          this.callbacks.onTranscriptUpdate([...this.transcript]);
        }
        break;
      }

      // 4. AI Response Created / Started
      case 'response.created': {
        this.isAIResponding = true;
        this.setState('Speaking');
        this.currentAiMessageId = `ai-${Date.now()}`;
        break;
      }

      // 5. Streaming partial transcript delta for AI response
      case 'response.audio_transcript.delta': {
        const delta = data.delta;
        if (!delta) break;

        const currentMsg = this.transcript.find((m) => m.id === this.currentAiMessageId);
        if (currentMsg) {
          currentMsg.text += delta;
        } else if (this.currentAiMessageId) {
          const timestamp = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          this.transcript.push({
            id: this.currentAiMessageId,
            speaker: 'ai',
            speakerName: this.config.agentName,
            text: delta,
            timestamp,
          });
        }

        this.callbacks.onTranscriptUpdate([...this.transcript]);
        break;
      }

      // 6. AI response finished turn
      case 'response.audio_transcript.done':
      case 'response.done': {
        this.isAIResponding = false;
        this.currentAiMessageId = null;
        if (this.state === 'Speaking') {
          this.setState('Listening');
        }
        break;
      }

      // 7. Error from OpenAI
      case 'error': {
        console.error('[RealtimeClient] OpenAI Server Error:', data.error);
        const errMsg = data.error?.message || 'Realtime API encountered an error';
        this.callbacks.onError(errMsg, data.error?.code);
        break;
      }

      default:
        break;
    }
  }

  /**
   * Interrupts the AI when the customer speaks
   */
  public interruptAI() {
    this.isAIResponding = false;
    this.callbacks.onInterrupted();

    if (this.dc && this.dc.readyState === 'open') {
      try {
        this.dc.send(JSON.stringify({ type: 'response.cancel' }));
      } catch (err) {
        console.warn('Could not cancel AI response:', err);
      }
    }
  }

  /**
   * Mutes or unmutes the local microphone track
   */
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Audio frequency analyser for real-time waveform animation
   */
  private setupAudioAnalyser(stream: MediaStream) {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }

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
      console.warn('Audio analyser setup notice:', e);
    }
  }

  /**
   * Cleanly ends the call session and releases all hardware & network resources
   */
  public end() {
    this.cleanup();
    this.setState('Completed');
  }

  private cleanup() {
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

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.dc) {
      try {
        this.dc.close();
      } catch (e) {}
      this.dc = null;
    }

    if (this.pc) {
      try {
        this.pc.close();
      } catch (e) {}
      this.pc = null;
    }

    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
      this.remoteAudio = null;
    }

    this.isAIResponding = false;
  }
}
