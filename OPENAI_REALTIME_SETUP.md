# OpenAI Realtime WebRTC Voice Integration Guide

VoiceSell AI incorporates a low-latency, two-way speech-to-speech voice agent powered by the **OpenAI Realtime API** via native **WebRTC** (`gpt-4o-realtime-preview-2024-12-17`).

---

## 1. Architecture & Security

```
[ Browser Client ]
       │
       │ 1. POST /api/realtime-session (Requests ephemeral session)
       ▼
[ Secure Backend Endpoint ]
       │ 2. Validates server OPENAI_API_KEY
       │ 3. POST https://api.openai.com/v1/realtime/sessions
       ▼
[ OpenAI Realtime Server ]
       │ 4. Returns ephemeral client_secret (valid ~1 min)
       ▼
[ Browser Client ]
       │ 5. Requests user microphone (navigator.mediaDevices.getUserMedia)
       │ 6. Initiates WebRTC SDP offer with ephemeral client_secret
       ▼
[ OpenAI WebRTC Gateway ] ─── Native Audio (PCM16) & DataChannel (oai-events) ─── [ Browser Client ]
```

### Key Security Guarantees:
- **No permanent keys in the browser:** `OPENAI_API_KEY` stays on the backend server. The client receives only a short-lived ephemeral `client_secret.value`.
- **Browser microphone permissions:** The microphone is requested strictly after the user clicks **Start Call**, never on page load.
- **Resource cleanup:** On **End Call**, all microphone tracks are stopped (`track.stop()`), the `RTCPeerConnection` is closed, and audio resources are released.

---

## 2. Setting Up Your OpenAI API Key

You can configure your `OPENAI_API_KEY` using either of these two methods:

### Method A: Via `.env` File
In your project root `.env` file, add:
```env
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here
```
The server picks this up automatically.

### Method B: Via the Live Voice Agent or Settings UI
1. Navigate to the **Live Voice Agent** page.
2. If unconfigured, click **Configure Secret Key** in the top banner.
3. Paste your OpenAI API key (`sk-...`).
4. Click **Verify & Save Key**. The backend verifies connectivity with OpenAI and saves it securely to `.env`.

---

## 3. Supported Languages & Audio Behavior

- **English** (`en`)
- **Hindi** (`hi` / हिन्दी)
- **Telugu** (`te` / తెలుగు)
- **Tamil**, **Kannada**, **Spanish**, **French**, **German**

### Adaptive Language Matching:
- If a call is started in **English**, but the customer begins speaking in **Hindi** or **Telugu**, the model recognizes the spoken dialect and naturally transitions.
- **Brand Name & Pricing Preservation:** Product names (e.g. *OmniFlow CRM*, *CloudPulse APM*), technical terms (*Kubernetes*, *eBPF*), and pricing figures (*$129/user/mo*) are preserved without translation corruption.

---

## 4. Interruption Handling & Server VAD

- **Server-Side Voice Activity Detection (VAD):** Configured with 500ms silence detection and 300ms prefix padding.
- **Real-time Interruption:** When the customer speaks while the AI is vocalizing, `input_audio_buffer.speech_started` immediately dispatches a `response.cancel` event over the WebRTC data channel, pausing audio playback and switching UI state from **Speaking** to **Listening**.

---

## 5. Live Transcripts & Post-Call Telemetry

- **Customer Transcripts:** Delivered by `conversation.item.input_audio_transcription.completed` using Whisper.
- **AI Streaming Transcripts:** Streamed chunk-by-chunk through `response.audio_transcript.delta`.
- **Post-Call Synthesis:** On call completion, `/api/realtime-summary` generates structured executive summaries, detected objections, customer requirements, next steps, and sales classification, persisting the session to Supabase.
