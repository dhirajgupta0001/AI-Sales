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
  targetAudience: string; // Ideal customer profile (ICP)
  customerPainPoints?: string[]; // Core customer pain points
  faqs: ProductFaq[];
  competitorDifferentiation?: string; // Differentiation vs competitors
  objectionHandling: ObjectionGuidance[];
  demoBookingProcess?: string; // Specific demo scheduling protocol
  purchasingInstructions?: string; // Clear purchasing/CTA instructions
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

export interface EvidenceQuote {
  quote: string;
  category: 'requirement' | 'objection' | 'timeline' | 'interest' | 'action';
  speaker: 'customer' | 'ai';
}

export interface PostCallStructuredAnalysis {
  summary: string;
  customer_business_and_use_case: string;
  customer_requirements: string[];
  features_discussed: string[];
  questions_asked: string[];
  objections: string[];
  buying_intent: 'High' | 'Medium' | 'Low' | 'None';
  budget_or_timeline: string;
  promised_actions: string[];
  sales_status: SalesStatus;
  original_ai_status?: SalesStatus;
  next_steps: string[];
  follow_up_date: string | null;
  confidence: number;
  evidence_quotes: EvidenceQuote[];
  is_manually_corrected?: boolean;
  corrected_by?: string;
  corrected_at?: string;
  correction_notes?: string;
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
  originalAiStatus?: SalesStatus;
  isManuallyCorrected?: boolean;
  correctedBy?: string;
  correctedAt?: string;
  correctionNotes?: string;
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
  customerBusinessAndUseCase?: string;
  customerRequirements: string[];
  featuresDiscussed?: string[];
  questionsAsked?: string[];
  objections: string[];
  buyingIntent?: 'High' | 'Medium' | 'Low' | 'None';
  budgetOrTimeline?: string;
  promisedActions?: string[];
  nextSteps: string[];
  followUpDate?: string | null;
  evidenceQuotes?: EvidenceQuote[];
  structuredAnalysis?: PostCallStructuredAnalysis;
  consentStatus?: boolean;
  consentTimestamp?: string;
  consentText?: string;
  summaryStatus?: 'Completed' | 'Processing' | 'Failed';
}

export interface FollowUpTask {
  id: string;
  workspace_id?: string;
  call_session_id?: string;
  lead_id?: string;
  customerName?: string;
  customerEmail?: string;
  productName?: string;
  title: string;
  description: string;
  due_date: string; // ISO date string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgentSettings {
  id?: string;
  workspace_id?: string;
  agentName: string;
  voicePreference: string;
  voiceGender: 'female' | 'male' | 'neutral';
  personality: string;
  salesApproach: 'Consultative' | 'Solution Selling' | 'Spin Selling' | 'Value-Based' | 'Challenger';
  salesTone: 'Consultative' | 'Challenger' | 'Enthusiastic' | 'Friendly & Professional' | 'Direct & ROI-focused';
  openingGreeting: string;
  qualificationQuestions: string[];
  productSpecificInstructions: string;
  closingBehavior: string;
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
  provider: 'ElevenLabs' | 'Ollama Cloud' | 'Deepgram' | 'Twilio Telephony' | 'HubSpot CRM' | 'Salesforce';
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
