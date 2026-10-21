# VoiceSell AI — Ollama Cloud & Browser-Native Voice Integration Guide

VoiceSell AI powers real-time, interactive voice sales conversations using **Ollama Cloud** for conversational AI intelligence and **browser-native Web Speech APIs** for low-latency speech recognition and text-to-speech.

---

## 1. Architecture Overview

```
 [ Customer (Microphone) ]
           │ (Audio Stream)
           ▼
 [ Web Speech Recognition (window.SpeechRecognition) ]
           │ (Interim & Finalized Transcripts in en-US, hi-IN, te-IN)
           ▼
 [ VoiceSell AI Client Engine (BrowserVoiceSalesAgent) ]
           │ (Product Knowledge, Sales Playbook, Chat History)
           ▼
 [ Vite Backend Plugin (/api/chat-with-sales-agent) ]
           │ (Bearer OLLAMA_API_KEY, System Prompt, Context)
           ▼
 [ Ollama Cloud API (POST https://ollama.com/api/chat) ]
           │ (Concise, Conversational SDR Response)
           ▼
 [ Browser Speech Synthesis (window.speechSynthesis) ]
           │ (Audio Output via OS-Native Multilingual TTS Voices)
           ▼
 [ Customer (Speakers/Headphones) ]
```

### Key Security & Design Guarantees:
- **No Secret Keys in Browser:** `OLLAMA_API_KEY` is strictly held on the server side (`.env` or server environment). Client calls proxy through `POST /api/chat-with-sales-agent`.
- **Zero OpenAI Dependencies:** Completely free of OpenAI SDKs, endpoints, and billing tokens.
- **Configurable Models:** Driven by `OLLAMA_MODEL` (default: `llama3.3`, or switch to `llama3.2`, `mistral`, `deepseek-r1`, etc.).
- **Echo & Feedback Prevention:** Speech recognition is automatically suspended while the AI is speaking aloud through `window.speechSynthesis`, and automatically restarts when playback completes.
- **Interruption Handling:** If the user speaks or taps the mute/unmute control, ongoing speech synthesis is stopped immediately via `window.speechSynthesis.cancel()`.
- **Accurate Persistence:** Call sessions, live messages, consent records, and structured post-call summaries (objections, requirements, next steps, sales status) are persisted directly to Supabase with Row Level Security.

---

## 2. Configuration & Credentials

### Option A: Via Application UI
1. Navigate to **Live Voice Agent** or **Settings > API Integrations**.
2. Click **Configure Ollama Cloud**.
3. Enter your **Ollama Cloud API Key** (and optionally change the model identifier, e.g., `llama3.3`).
4. Click **Verify & Save Credentials**. The backend validates and writes the configuration to `.env`.

### Option B: Via `.env` File
In the project root, open `.env` and set:
```bash
# Ollama Cloud Configuration
OLLAMA_API_KEY=your_actual_ollama_cloud_key
OLLAMA_MODEL=llama3.3
OLLAMA_BASE_URL=https://ollama.com
```
Then restart or refresh the application.

---

## 3. Multilingual Support & Browser Requirements

### Supported Languages:
- **English** (`en-US` / `en-IN`): Universal support across all modern browsers.
- **Hindi** (`hi-IN`): High recognition accuracy on Chromium-based browsers (Google Chrome, Microsoft Edge, Brave).
- **Telugu** (`te-IN`): Full STT and TTS support in Google Chrome and Android WebViews.

### Browser Speech Engine Notes:
- Browser speech recognition uses `window.SpeechRecognition` / `window.webkitSpeechRecognition`. In Google Chrome and Edge, recognition leverages browser-provided cloud recognition services.
- **Important:** Browser speech recognition is not fully offline. If running in Safari or Firefox where `SpeechRecognition` may be limited, VoiceSell AI gracefully displays an informational notice and allows text-assisted interaction.
- Headsets or headphones are recommended to ensure the highest voice recognition quality.

---

## 4. Post-Call Intelligence & Structured Summary

When a call concludes via **End Call**:
1. All turns are logged to `call_messages` in Supabase.
2. The backend sends the full transcript to `POST /api/summarize-call` on Ollama Cloud.
3. The LLM extracts:
   - Concise executive summary
   - Key customer requirements & technical bottlenecks
   - Objections raised
   - Next steps & action items
   - Sales status constrained to: `Converted`, `Interested`, `Follow-up Required`, `Not Interested`, `Demo Requested`, or `No Response`.
4. Stored in `call_summaries` and updated in `call_sessions` under the active user's workspace.
