export type SalesStatus = 
  | 'Converted'
  | 'Interested'
  | 'Follow-up Required'
  | 'Not Interested'
  | 'Demo Requested'
  | 'No Response';

export type CallStatus = 'Idle' | 'Connecting' | 'Listening' | 'Speaking' | 'Completed' | 'Failed';

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'es' | 'de' | 'fr';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export interface ProductFaq {
  id?: string;
  product_id?: string;
  workspace_id?: string;
  q: string;
  a: string;
}

export interface ObjectionGuidance {
  objection: string;
  counter: string;
}

export interface ProductPricing {
  tier: string;
  price: string;
  period: string;
  billing: string;
}

export interface Product {
  id: string;
  workspace_id?: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  pricing: ProductPricing[];
  targetAudience: string;
  faqs: ProductFaq[];
  objectionHandling: ObjectionGuidance[];
  productWebsite: string;
  salesPitch: string;
  tone: 'Consultative' | 'Challenger' | 'Enthusiastic' | 'Friendly & Professional' | 'Direct & ROI-focused';
  preferredLanguage: string;
  callToAction: string;
  aiInstructions: string;
  active: boolean;
  category: string;
  createdAt: string;
  callCount?: number;
  conversionRate?: number;
}

export interface Lead {
  id: string;
  workspace_id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  associatedProductId: string;
  associatedProductName: string;
  salesStatus: SalesStatus;
  dealValue: number;
  notes: string;
  createdAt: string;
  lastContactedAt: string;
  city?: string;
  country?: string;
}

export interface TranscriptMessage {
  id: string;
  call_session_id?: string;
  workspace_id?: string;
  speaker: 'ai' | 'customer';
  speakerName: string;
  text: string;
  timestamp: string;
  offsetSeconds?: number;
}

export interface CallRecord {
  id: string;
  workspace_id?: string;
  lead_id?: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  timestamp: string;
  startTime?: string;
  endTime?: string;
  durationSeconds: number;
  status: SalesStatus;
  callStatus?: CallStatus;
  language: string;
  recordingAvailable: boolean;
  recordingDuration?: string;
  recordingStoragePath?: string;
  recordingSignedUrl?: string | null;
  sentiment: 'Positive' | 'Neutral' | 'Hesitant' | 'Negative';
  aiScore: number;
  aiAnalysisMetadata?: Record<string, any>;
  transcript: TranscriptMessage[];
  aiSummary: string;
  objections: string[];
  customerRequirements: string[];
  nextSteps: string[];
  consentStatus?: boolean;
  consentTimestamp?: string;
}

export interface AgentSettings {
  id?: string;
  workspace_id?: string;
  agentName: string;
  voicePreference: string;
  voiceGender: 'female' | 'male' | 'neutral';
  personality: string;
  salesApproach: 'Consultative' | 'Solution Selling' | 'Spin Selling' | 'Value-Based' | 'Challenger';
  openingGreeting: string;
  supportedLanguages: string[];
  conversationRules: string[];
  followUpBehavior: string;
  demoBookingInstructions: string;
  speakingRate: number; // 0.8 to 1.2
  interruptionHandling: 'Polite' | 'Aggressive' | 'Context-Aware';
  maxCallDurationMinutes: number;
  ambientNoiseSuppression: boolean;
}

export interface IntegrationConfig {
  name: string;
  provider: 'ElevenLabs' | 'OpenAI Realtime' | 'Deepgram' | 'Twilio Telephony' | 'HubSpot CRM' | 'Salesforce';
  category: 'Voice Engine' | 'LLM Reasoning' | 'Speech-to-Text' | 'Telephony' | 'CRM';
  status: 'Connected' | 'Not Configured' | 'Action Required';
  keyMasked?: string;
  lastTested?: string;
  docsUrl: string;
}

export interface AppSettings {
  profile: {
    fullName: string;
    email: string;
    title: string;
    company: string;
    phone: string;
  };
  workspace: {
    id?: string;
    name: string;
    tier: string;
    callsLimit: number;
    callsUsed: number;
    minutesLimit: number;
    minutesUsed: number;
    timezone: string;
    currency: string;
  };
  integrations: IntegrationConfig[];
  privacy: {
    recordingConsentRequired: boolean;
    consentDisclaimerText: string;
    dataRetentionDays: number;
    autoRedactPii: boolean;
    gdprCompliantMode: boolean;
    requireOptInBeforeSpeaking: boolean;
  };
}
