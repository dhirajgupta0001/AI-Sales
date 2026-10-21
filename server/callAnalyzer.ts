/**
 * VoiceSell AI — Post-Call AI Conversation Analyzer
 * 
 * Generates structured, validated post-call intelligence for every completed
 * voice conversation. Enforces anti-hallucination rules, documented precedence
 * classification policies, evidence quote extraction, and audit tracking.
 */

export type SalesStatus = 
  | 'Converted'
  | 'Interested'
  | 'Follow-up Required'
  | 'Not Interested'
  | 'Demo Requested'
  | 'No Response';

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
  confidence: number; // 0 to 100
  evidence_quotes: EvidenceQuote[];
  is_manually_corrected?: boolean;
  corrected_by?: string;
  corrected_at?: string;
  correction_notes?: string;
}

export interface CallAnalyzerMetadata {
  productName: string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  language?: string;
  durationSeconds?: number;
  confirmedActions?: string[];
  actionConfirmed?: boolean;
}

export interface TranscriptTurn {
  speaker: 'ai' | 'customer';
  speakerName?: string;
  text: string;
  timestamp?: string;
}

/**
 * Calculates default follow-up date (e.g. +2 business days from today).
 */
export function calculateDefaultFollowUpDate(daysAhead: number = 2): string {
  const date = new Date();
  let added = 0;
  while (added < daysAhead) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
      added++;
    }
  }
  return date.toISOString().split('T')[0];
}

/**
 * Documented Precedence Policy for Sales Status Classification:
 * 
 * 1. No Response: Insufficient customer engagement (0 customer turns, or fewer than 3 customer words).
 * 2. Not Interested: Explicit customer opt-out, refusal, or clear negative sentiment overrides generic interest.
 * 3. Converted: Only when explicitly confirmed by a trusted system/metadata (never solely from AI persuasion).
 * 4. Demo Requested: Explicit request or agreement to attend a live demo overrides generic interest.
 * 5. Follow-up Required: Customer requested future callback or unresolved pricing/technical questions remain.
 * 6. Interested: Genuine engagement, positive inquiry, but no committed next step.
 */
export function applyPrecedencePolicy(
  transcript: TranscriptTurn[],
  metadata: CallAnalyzerMetadata,
  llmSuggestedStatus?: string
): { status: SalesStatus; reason: string } {
  const customerTurns = transcript.filter((t) => t.speaker === 'customer');
  const totalCustomerWords = customerTurns
    .map((t) => t.text.trim())
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  // Rule 1: No Response Precedence
  if (customerTurns.length === 0 || totalCustomerWords < 3) {
    return {
      status: 'No Response',
      reason: 'Customer did not speak or provided insufficient conversational engagement (< 3 words).',
    };
  }

  const allCustomerText = customerTurns.map((t) => t.text.toLowerCase()).join(' ');

  // Rule 2: Not Interested Precedence
  const notInterestedTriggers = [
    'not interested',
    'stop calling',
    'do not call',
    'remove me',
    'unsubscribe',
    'hang up',
    'leave me alone',
    'dont want',
    "don't want",
    'no thanks',
    'nahi chahiye',
    'call mat karna',
    'vaddu',
    'aapeyandi',
  ];
  if (notInterestedTriggers.some((trig) => allCustomerText.includes(trig))) {
    return {
      status: 'Not Interested',
      reason: 'Customer explicitly declined the product or requested outreach to cease.',
    };
  }

  // Rule 3: Converted Precedence (Strict: Verified Confirmation Only)
  const isExplicitlyConfirmed =
    Boolean(metadata.actionConfirmed) ||
    (metadata.confirmedActions || []).some((act) =>
      /purchase|order|payment|txn|checkout|converted/i.test(act)
    );
  if (isExplicitlyConfirmed) {
    return {
      status: 'Converted',
      reason: 'Subscription or purchase transaction verified by trusted billing system.',
    };
  }

  // Rule 4: Demo Requested Precedence
  const demoRegex = /(?:book|schedule|set up|arrange|request|give me|show me|want a|need a|can we|calendar).{0,50}demo/i;
  const demoTriggers = [
    'book a demo',
    'schedule a demo',
    'schedule demo',
    'show me a demo',
    'send calendar',
    'send the calendar',
    'send invite',
    'tomorrow at',
    'thursday at',
    'calendar invite',
    'set up a demo',
    'live demo',
    'walkthrough',
    'डेमो',
    'డెమో',
  ];
  if (
    demoRegex.test(allCustomerText) ||
    demoTriggers.some((trig) => allCustomerText.includes(trig)) ||
    llmSuggestedStatus === 'Demo Requested'
  ) {
    return {
      status: 'Demo Requested',
      reason: 'Customer explicitly requested or confirmed a scheduled demonstration.',
    };
  }

  // Rule 5: Follow-up Required Precedence
  const followUpTriggers = [
    'call me later',
    'call me tomorrow',
    'call me next',
    'email me the',
    'send me details',
    'send over the deck',
    'need to check with',
    'talk to my boss',
    'discuss with team',
    'check budget',
    'unresolved',
  ];
  if (
    followUpTriggers.some((trig) => allCustomerText.includes(trig)) ||
    llmSuggestedStatus === 'Follow-up Required'
  ) {
    return {
      status: 'Follow-up Required',
      reason: 'Customer requested a future contact or material questions remain unresolved.',
    };
  }

  // Rule 6: Interested
  if (
    llmSuggestedStatus === 'Interested' ||
    customerTurns.length >= 2 ||
    allCustomerText.includes('price') ||
    allCustomerText.includes('features') ||
    allCustomerText.includes('sounds good') ||
    allCustomerText.includes('interesting')
  ) {
    return {
      status: 'Interested',
      reason: 'Customer engaged in dialogue and expressed positive interest in features without specific commitment.',
    };
  }

  // Fallback
  return {
    status: 'Interested',
    reason: 'Conversational engagement recorded without explicit next step commitment.',
  };
}

/**
 * Extracts verbatim evidence quotes from the transcript.
 */
export function extractEvidenceQuotes(transcript: TranscriptTurn[]): EvidenceQuote[] {
  const quotes: EvidenceQuote[] = [];

  for (const turn of transcript) {
    const text = turn.text.trim();
    const lower = text.toLowerCase();

    if (turn.speaker === 'customer') {
      if (lower.includes('need') || lower.includes('want') || lower.includes('require') || lower.includes('looking for')) {
        quotes.push({ quote: text, category: 'requirement', speaker: 'customer' });
      } else if (lower.includes('but') || lower.includes('expensive') || lower.includes('already use') || lower.includes('worry') || lower.includes('concern')) {
        quotes.push({ quote: text, category: 'objection', speaker: 'customer' });
      } else if (lower.includes('q1') || lower.includes('q2') || lower.includes('q3') || lower.includes('month') || lower.includes('quarter') || lower.includes('timeline')) {
        quotes.push({ quote: text, category: 'timeline', speaker: 'customer' });
      } else if (lower.includes('demo') || lower.includes('interested') || lower.includes('great') || lower.includes('yes')) {
        quotes.push({ quote: text, category: 'interest', speaker: 'customer' });
      }
    } else if (turn.speaker === 'ai') {
      if (lower.includes('i will send') || lower.includes('calendar invite') || lower.includes('submit that demo') || lower.includes('email you')) {
        quotes.push({ quote: text, category: 'action', speaker: 'ai' });
      }
    }
  }

  return quotes.slice(0, 5);
}

/**
 * Builds the structured Ollama Cloud JSON prompt for post-call analysis.
 */
export function buildAnalysisPrompt(
  transcript: TranscriptTurn[],
  metadata: CallAnalyzerMetadata
): { system: string; user: string } {
  const transcriptFormatted = transcript
    .map((t) => `[${t.speaker === 'ai' ? 'AI Voice SDR' : metadata.customerName}]: ${t.text}`)
    .join('\n');

  const system = `You are a certified enterprise sales operations analyst and revenue auditor.
Analyze the provided phone call transcript between an AI Voice SDR and the prospect "${metadata.customerName}" regarding the product "${metadata.productName}".

### CRITICAL INSTRUCTIONS:
1. DO NOT INVENT FACTS. If any item is not explicitly mentioned in the conversation, mark it as "Unknown" or leave the array empty. Do not guess budgets, company names, or timelines.
2. DO NOT mark a lead "Converted" solely because the AI gave a persuasive pitch. Converted is only valid if a purchase was confirmed.
3. The sales_status MUST be exactly one of:
   - "Converted"
   - "Interested"
   - "Follow-up Required"
   - "Not Interested"
   - "Demo Requested"
   - "No Response"
4. Follow this precedence order for classification:
   No Response > Not Interested > Converted > Demo Requested > Follow-up Required > Interested.
5. Return ONLY a single valid JSON object with the exact keys described below, with no surrounding markdown or explanation:

{
  "summary": "Concise 1-2 sentence overview of the conversation",
  "customer_business_and_use_case": "Customer's business type, current setup, and target use case. If not stated, return 'Unknown'.",
  "customer_requirements": ["List of acute pain points and specific requirements stated by customer"],
  "features_discussed": ["List of product capabilities discussed during the call"],
  "questions_asked": ["List of questions asked by the customer"],
  "objections": ["List of objections, hesitations, or competitor comparisons raised by customer"],
  "buying_intent": "Must be exactly one of: 'High', 'Medium', 'Low', 'None'",
  "budget_or_timeline": "Specific budget or implementation timeline stated by customer. If not stated, return 'Unknown'.",
  "promised_actions": ["List of promised follow-up actions (e.g. send invite, email deck)"],
  "sales_status": "Must be one of: Converted, Interested, Follow-up Required, Not Interested, Demo Requested, No Response",
  "next_steps": ["Concrete, actionable next steps for the account executive team"],
  "follow_up_date": "YYYY-MM-DD date if explicitly agreed upon, otherwise null",
  "confidence": integer between 50 and 100 representing classification confidence,
  "evidence_quotes": [
    {
      "quote": "Exact verbatim excerpt from transcript",
      "category": "requirement" | "objection" | "timeline" | "interest" | "action",
      "speaker": "customer" | "ai"
    }
  ]
}`;

  const user = `CALL METADATA:
- Product: ${metadata.productName}
- Prospect Name: ${metadata.customerName}
- Company: ${metadata.customerCompany || 'Unknown'}
- Language: ${metadata.language || 'English'}
- Duration: ${metadata.durationSeconds || 0} seconds

TRANSCRIPT:
${transcriptFormatted || '[No conversational turns recorded]'}`;

  return { system, user };
}

/**
 * Validates and sanitizes raw JSON output from the LLM.
 * Falls back to deterministic extraction if LLM output is malformed.
 */
export function validateAndSanitizeAnalysis(
  rawJsonText: string,
  transcript: TranscriptTurn[],
  metadata: CallAnalyzerMetadata
): PostCallStructuredAnalysis {
  let parsed: any = null;

  try {
    parsed = JSON.parse(rawJsonText);
  } catch (_) {
    // Regex fallback for JSON inside markdown blocks
    const match = rawJsonText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (e) {}
    }
  }

  // Precedence policy check
  const precedence = applyPrecedencePolicy(transcript, metadata, parsed?.sales_status);

  // Fallback defaults
  const validBuyingIntents = ['High', 'Medium', 'Low', 'None'] as const;
  const buyingIntent = validBuyingIntents.includes(parsed?.buying_intent)
    ? parsed.buying_intent
    : precedence.status === 'Demo Requested'
    ? 'High'
    : precedence.status === 'Not Interested'
    ? 'None'
    : 'Medium';

  const defaultDate = (precedence.status === 'Demo Requested' || precedence.status === 'Follow-up Required')
    ? calculateDefaultFollowUpDate(2)
    : null;

  const validFollowUpDate = (typeof parsed?.follow_up_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.follow_up_date))
    ? parsed.follow_up_date
    : defaultDate;

  // Evidence quotes
  let evidenceQuotes: EvidenceQuote[] = [];
  if (Array.isArray(parsed?.evidence_quotes) && parsed.evidence_quotes.length > 0) {
    evidenceQuotes = parsed.evidence_quotes.filter(
      (eq: any) => typeof eq?.quote === 'string' && eq.quote.length > 0
    );
  }
  if (evidenceQuotes.length === 0) {
    evidenceQuotes = extractEvidenceQuotes(transcript);
  }

  const result: PostCallStructuredAnalysis = {
    summary: typeof parsed?.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : `Voice consultation concluded between ${metadata.productName} and ${metadata.customerName}.`,
    customer_business_and_use_case: typeof parsed?.customer_business_and_use_case === 'string'
      ? parsed.customer_business_and_use_case
      : 'Unknown',
    customer_requirements: Array.isArray(parsed?.customer_requirements) && parsed.customer_requirements.length > 0
      ? parsed.customer_requirements
      : ['Product demonstration and workflow evaluation'],
    features_discussed: Array.isArray(parsed?.features_discussed) && parsed.features_discussed.length > 0
      ? parsed.features_discussed
      : [metadata.productName],
    questions_asked: Array.isArray(parsed?.questions_asked)
      ? parsed.questions_asked
      : [],
    objections: Array.isArray(parsed?.objections)
      ? parsed.objections
      : [],
    buying_intent: buyingIntent,
    budget_or_timeline: typeof parsed?.budget_or_timeline === 'string' && parsed.budget_or_timeline.trim()
      ? parsed.budget_or_timeline
      : 'Unknown',
    promised_actions: Array.isArray(parsed?.promised_actions) && parsed.promised_actions.length > 0
      ? parsed.promised_actions
      : [`Email follow-up to ${metadata.customerEmail || metadata.customerName}`],
    sales_status: precedence.status,
    original_ai_status: precedence.status,
    next_steps: Array.isArray(parsed?.next_steps) && parsed.next_steps.length > 0
      ? parsed.next_steps
      : precedence.status === 'Demo Requested'
      ? ['Send calendar invite for 15-minute live architecture demo', 'Assign lead AE']
      : precedence.status === 'Not Interested'
      ? ['Mark lead as closed/opt-out', 'Cease active outreach']
      : ['Follow up with customer within 48 hours'],
    follow_up_date: validFollowUpDate,
    confidence: typeof parsed?.confidence === 'number' && parsed.confidence >= 40 && parsed.confidence <= 100
      ? parsed.confidence
      : precedence.status === 'No Response'
      ? 95
      : 85,
    evidence_quotes: evidenceQuotes,
    is_manually_corrected: false,
  };

  return result;
}
