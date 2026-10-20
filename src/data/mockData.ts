import { Product, Lead, CallRecord, AgentSettings, AppSettings, Language } from '../types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English (US & Global)', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'OmniFlow CRM',
    tagline: 'Autonomous AI Sales & Pipeline Acceleration Platform',
    category: 'Sales Tech & CRM',
    description: 'OmniFlow CRM unifies outbound pipeline generation, automated deal intelligence, and predictive revenue forecasting for high-velocity B2B SaaS teams.',
    features: [
      'Autonomous outbound voice & email multi-channel follow-up',
      'Real-time deal risk prediction & win-rate scoring',
      'One-click bidirectional sync with Salesforce & HubSpot',
      'AI meeting summarize & action item delegation',
      'Voice-to-CRM automatic data hygiene'
    ],
    pricing: [
      { tier: 'Starter', price: '$49', period: '/user/mo', billing: 'Billed annually' },
      { tier: 'Growth AI', price: '$129', period: '/user/mo', billing: 'Billed annually (Most Popular)' },
      { tier: 'Enterprise Scale', price: '$249', period: '/user/mo', billing: 'Custom SLA & Dedicated Voice Cluster' }
    ],
    targetAudience: 'B2B SaaS companies, mid-market sales organizations, agency owners, and revenue leaders managing 10+ SDRs and AEs.',
    faqs: [
      { q: 'How long does implementation take?', a: 'Standard onboarding takes under 35 minutes with our native OAuth integrations for Google Workspace and Microsoft 365.' },
      { q: 'Can OmniFlow replace our existing CRM?', a: 'OmniFlow can run as a complete standalone CRM or sit as an intelligence acceleration layer on top of Salesforce or HubSpot.' },
      { q: 'Is our customer voice and pipeline data secure?', a: 'Yes, SOC-2 Type II certified, GDPR compliant, with zero training on your enterprise proprietary customer data.' }
    ],
    objectionHandling: [
      {
        objection: 'We already use HubSpot / Salesforce and our reps hate switching tools.',
        counter: 'OmniFlow doesn\'t force reps to switch tabs! It syncs invisibly in the background so reps get 8 extra selling hours a week without learning a complex new interface.'
      },
      {
        objection: 'Our budget is frozen until next quarter.',
        counter: 'Most customers unlock an immediate 3.4x ROI within 45 days. We can activate our 30-day deferred billing pilot so you start closing deals before the invoice arrives.'
      },
      {
        objection: 'Will AI voice agents sound robotic to our executive prospects?',
        counter: 'VoiceSell AI uses ultra-low latency conversational speech with natural breathing, pauses, and context comprehension that 94% of prospects perceive as human SDRs.'
      }
    ],
    productWebsite: 'https://omniflowcrm.io',
    salesPitch: 'OmniFlow CRM helps revenue teams recover 12+ lost selling hours every week by putting lead follow-up, voice outreach, and pipeline hygiene on autonomous autopilot.',
    tone: 'Consultative',
    preferredLanguage: 'English',
    callToAction: 'Book a 15-minute live ROI benchmark & customized architecture walkthrough',
    aiInstructions: 'Adopt an executive consultative posture. Uncover the customer\'s current outbound volume, CRM adoption challenges, and SDR ramp time before introducing tier recommendations.',
    active: true,
    createdAt: '2026-08-14',
    callCount: 684,
    conversionRate: 24.8
  },
  {
    id: 'prod-2',
    name: 'CloudPulse APM',
    tagline: 'Autonomous Cloud Observability & Anomaly Prevention',
    category: 'DevOps & Cloud Infrastructure',
    description: 'High-throughput eBPF-powered observability platform that isolates microservice regressions and memory leaks in seconds before users notice.',
    features: [
      'Zero-overhead kernel-level eBPF distributed tracing',
      'Autonomous root-cause analysis with LLM incident correlation',
      'Multi-cloud cost forecasting & unused container reclamation',
      'Native OpenTelemetry ingestion with 90-day retention'
    ],
    pricing: [
      { tier: 'Developer', price: '$89', period: '/host/mo', billing: 'Pay as you go' },
      { tier: 'Production Core', price: '$199', period: '/host/mo', billing: 'Billed annually' },
      { tier: 'Mission Critical', price: 'Custom', period: '/cluster', billing: 'Custom SLA & On-prem VPC' }
    ],
    targetAudience: 'CTOs, VP of Engineering, SRE leads, and Platform Engineers maintaining distributed Kubernetes clusters.',
    faqs: [
      { q: 'Does eBPF instrumentation impact CPU overhead?', a: 'No, kernel-level eBPF operates with less than 0.8% CPU overhead, making it drastically lighter than traditional bytecode agents.' },
      { q: 'Is OpenTelemetry supported natively?', a: 'Yes, 100% compliant with standard OTel collectors and traces.' }
    ],
    objectionHandling: [
      {
        objection: 'We are already locked into Datadog.',
        counter: 'CloudPulse provides transparent dual-shipping for 30 days. Customers typically reduce their observability bill by 42% while gaining sub-second root-cause AI diagnosis.'
      }
    ],
    productWebsite: 'https://cloudpulse-apm.tech',
    salesPitch: 'CloudPulse slashes MTTR by 78% and halves runaway observability bills with zero-overhead eBPF tracing.',
    tone: 'Direct & ROI-focused',
    preferredLanguage: 'English',
    callToAction: 'Deploy our 15-minute sandbox agent on your staging cluster',
    aiInstructions: 'Engage platform architects on latency spikes, pager alerts fatigue, and egress monitoring bills.',
    active: true,
    createdAt: '2026-09-02',
    callCount: 412,
    conversionRate: 19.4
  },
  {
    id: 'prod-3',
    name: 'Securify Zero-Trust',
    tagline: 'Next-Gen Identity Governance & Automated Posture Shield',
    category: 'Cybersecurity & Compliance',
    description: 'Continuous biometric & cryptographic access verification across cloud workloads, SaaS tools, and remote workforce endpoints.',
    features: [
      'Context-aware adaptive MFA with device health checks',
      'Just-in-time (JIT) ephemeral cloud privilege escalation',
      'Automated SOC-2, HIPAA, and ISO 27001 evidence collector',
      'Real-time credential leakage & dark-web threat radar'
    ],
    pricing: [
      { tier: 'Standard', price: '$8', period: '/user/mo', billing: 'Billed annually' },
      { tier: 'Zero-Trust Shield', price: '$18', period: '/user/mo', billing: 'Billed annually' },
      { tier: 'GovCloud & Defense', price: '$35', period: '/user/mo', billing: 'Air-gapped deployment' }
    ],
    targetAudience: 'CISOs, InfoSec Directors, Compliance Officers, and IT Security managers.',
    faqs: [
      { q: 'Does it support hybrid Active Directory?', a: 'Yes, full bi-directional sync with Azure AD / Entra ID, Okta, and on-premises LDAP.' }
    ],
    objectionHandling: [
      {
        objection: 'Users will complain about friction when logging in.',
        counter: 'Securify uses risk-based continuous scoring — 92% of everyday sessions experience zero prompts unless an anomaly or untrusted network is detected.'
      }
    ],
    productWebsite: 'https://securify.cloud',
    salesPitch: 'Protect every endpoint and automate your next security audit with zero user friction.',
    tone: 'Friendly & Professional',
    preferredLanguage: 'Hindi',
    callToAction: 'Schedule a free Attack Surface & Credential Exposure assessment',
    aiInstructions: 'Highlight regulatory audit deadlines, ransomware prevention, and frictionless employee login experience.',
    active: true,
    createdAt: '2026-09-19',
    callCount: 236,
    conversionRate: 22.1
  },
  {
    id: 'prod-4',
    name: 'DevSprint AI',
    tagline: 'Autonomous AI Code Review & Automated Regression Shield',
    category: 'Developer Productivity',
    description: 'AI code assistant that automatically writes unit tests, reviews pull requests for architectural flaws, and fixes vulnerability CVEs.',
    features: [
      'Self-healing automated unit test generation',
      'Deep architectural dependency graph analysis',
      'Instant PR review comments under 45 seconds',
      'Zero training on private repositories guarantee'
    ],
    pricing: [
      { tier: 'Team', price: '$29', period: '/dev/mo', billing: 'Billed annually' },
      { tier: 'Pro Scale', price: '$69', period: '/dev/mo', billing: 'Billed annually' },
      { tier: 'Enterprise Dedicated', price: '$120', period: '/dev/mo', billing: 'Self-hosted LLM' }
    ],
    targetAudience: 'Engineering managers, lead developers, and VP of Software Engineering.',
    faqs: [
      { q: 'Does DevSprint send code to public model providers?', a: 'No, private tenant enterprise VPC isolation with guaranteed zero data retention.' }
    ],
    objectionHandling: [
      {
        objection: 'We already use GitHub Copilot.',
        counter: 'Copilot is an autocomplete tool while you type; DevSprint operates autonomously on your GitHub PRs, writing comprehensive regression test suites and flagging race conditions before human review.'
      }
    ],
    productWebsite: 'https://devsprint.dev',
    salesPitch: 'Cut PR review cycles from 3 days to 45 minutes while achieving 85%+ branch test coverage.',
    tone: 'Challenger',
    preferredLanguage: 'Telugu',
    callToAction: 'Run a sample scan on one open-source or test repository',
    aiInstructions: 'Emphasize engineering velocity, preventing junior dev bugs from hitting production, and test coverage automation.',
    active: true,
    createdAt: '2026-10-01',
    callCount: 150,
    conversionRate: 18.0
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Vikramaditya Sharma',
    company: 'FinApex Technologies',
    email: 'vikram@finapex.co',
    phone: '+91 98201 44521',
    preferredLanguage: 'Hindi',
    associatedProductId: 'prod-1',
    associatedProductName: 'OmniFlow CRM',
    salesStatus: 'Converted',
    dealValue: 18500,
    notes: 'Approved 25-seat Growth AI license after reviewing native Salesforce sync and multilingual outbound capability.',
    createdAt: '2026-10-18',
    lastContactedAt: '2026-10-20',
    city: 'Mumbai',
    country: 'India'
  },
  {
    id: 'lead-2',
    name: 'Kavya Sree Reddy',
    company: 'Cyientrix Data Systems',
    email: 'kavya.reddy@cyientrix.io',
    phone: '+91 94408 77123',
    preferredLanguage: 'Telugu',
    associatedProductId: 'prod-2',
    associatedProductName: 'CloudPulse APM',
    salesStatus: 'Demo Requested',
    dealValue: 24000,
    notes: 'Requested a technical deep-dive on eBPF kernel tracing vs Datadog collector for their 80-node EKS cluster.',
    createdAt: '2026-10-19',
    lastContactedAt: '2026-10-20',
    city: 'Hyderabad',
    country: 'India'
  },
  {
    id: 'lead-3',
    name: 'Marcus Vance',
    company: 'Apex Venture Logistics',
    email: 'marcus.v@apexlogistics.com',
    phone: '+1 (415) 890-3329',
    preferredLanguage: 'English',
    associatedProductId: 'prod-1',
    associatedProductName: 'OmniFlow CRM',
    salesStatus: 'Interested',
    dealValue: 32000,
    notes: 'Very receptive to outbound voice SDRs. Asked for security compliance documentation and SOC-2 report.',
    createdAt: '2026-10-17',
    lastContactedAt: '2026-10-19',
    city: 'San Francisco',
    country: 'United States'
  },
  {
    id: 'lead-4',
    name: 'Ananya Rao',
    company: 'Zenith HealthCloud',
    email: 'ananya.rao@zenithhc.in',
    phone: '+91 80234 11984',
    preferredLanguage: 'English',
    associatedProductId: 'prod-3',
    associatedProductName: 'Securify Zero-Trust',
    salesStatus: 'Follow-up Required',
    dealValue: 14200,
    notes: 'Awaiting HIPAA audit committee sign-off on Thursday. Needs custom data sovereignty clause.',
    createdAt: '2026-10-16',
    lastContactedAt: '2026-10-19',
    city: 'Bengaluru',
    country: 'India'
  },
  {
    id: 'lead-5',
    name: 'Suresh Babu',
    company: 'Vanguard Retail Tech',
    email: 'suresh@vanguardretail.in',
    phone: '+91 98850 62319',
    preferredLanguage: 'Telugu',
    associatedProductId: 'prod-1',
    associatedProductName: 'OmniFlow CRM',
    salesStatus: 'Interested',
    dealValue: 12000,
    notes: 'Looking to automate retail supplier inbound and lead management. Impressed with Telugu voice flow.',
    createdAt: '2026-10-18',
    lastContactedAt: '2026-10-20',
    city: 'Vijayawada',
    country: 'India'
  },
  {
    id: 'lead-6',
    name: 'Elena Rostova',
    company: 'Nordic SaaS Labs',
    email: 'elena@nordicsaas.de',
    phone: '+49 171 4589210',
    preferredLanguage: 'German',
    associatedProductId: 'prod-4',
    associatedProductName: 'DevSprint AI',
    salesStatus: 'Demo Requested',
    dealValue: 19800,
    notes: 'Invited 4 tech leads to hands-on testing on their GitLab repositories.',
    createdAt: '2026-10-19',
    lastContactedAt: '2026-10-20',
    city: 'Berlin',
    country: 'Germany'
  },
  {
    id: 'lead-7',
    name: 'Rajesh Agarwal',
    company: 'Agarwal Global Exports',
    email: 'rajesh@agarwalexports.com',
    phone: '+91 98110 33891',
    preferredLanguage: 'Hindi',
    associatedProductId: 'prod-3',
    associatedProductName: 'Securify Zero-Trust',
    salesStatus: 'Follow-up Required',
    dealValue: 9500,
    notes: 'Agreed that ransomware risk is critical; requested Hindi proposal deck for board presentation.',
    createdAt: '2026-10-15',
    lastContactedAt: '2026-10-18',
    city: 'New Delhi',
    country: 'India'
  },
  {
    id: 'lead-8',
    name: 'David Tremblay',
    company: 'Quebec Digital Fleet',
    email: 'david.t@quebecfleet.ca',
    phone: '+1 (514) 772-9018',
    preferredLanguage: 'French',
    associatedProductId: 'prod-2',
    associatedProductName: 'CloudPulse APM',
    salesStatus: 'Not Interested',
    dealValue: 0,
    notes: 'Already renewed three-year enterprise commitment with Dynatrace last month.',
    createdAt: '2026-10-12',
    lastContactedAt: '2026-10-17',
    city: 'Montreal',
    country: 'Canada'
  },
  {
    id: 'lead-9',
    name: 'Pooja Iyer',
    company: 'NovaFin Microservices',
    email: 'pooja.iyer@novafin.co',
    phone: '+91 99401 55230',
    preferredLanguage: 'English',
    associatedProductId: 'prod-4',
    associatedProductName: 'DevSprint AI',
    salesStatus: 'Converted',
    dealValue: 27500,
    notes: 'Signed 1-year contract after trial achieved 91% automated code review coverage.',
    createdAt: '2026-10-14',
    lastContactedAt: '2026-10-19',
    city: 'Chennai',
    country: 'India'
  },
  {
    id: 'lead-10',
    name: 'Carlos Mendoza',
    company: 'Solaria Energy SaaS',
    email: 'carlos@solariasaas.mx',
    phone: '+52 55 4190 2831',
    preferredLanguage: 'Spanish',
    associatedProductId: 'prod-1',
    associatedProductName: 'OmniFlow CRM',
    salesStatus: 'No Response',
    dealValue: 15000,
    notes: 'Voice agent dialed 3 times. Left conversational voicemail with demo booking link.',
    createdAt: '2026-10-13',
    lastContactedAt: '2026-10-16',
    city: 'Mexico City',
    country: 'Mexico'
  }
];

export const INITIAL_CALLS: CallRecord[] = [
  {
    id: 'call-101',
    customerName: 'Vikramaditya Sharma',
    customerEmail: 'vikram@finapex.co',
    customerPhone: '+91 98201 44521',
    productId: 'prod-1',
    productName: 'OmniFlow CRM',
    date: '2026-10-20',
    timestamp: '11:15 AM',
    durationSeconds: 274,
    status: 'Converted',
    language: 'Hindi',
    recordingAvailable: true,
    recordingDuration: '04:34',
    sentiment: 'Positive',
    aiScore: 96,
    transcript: [
      { id: 'm1', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'नमस्ते विक्रम जी! मैं OmniFlow CRM से Aria बात कर रही हूँ। आशा है आपका दिन अच्छा जा रहा होगा। क्या आपके पास हमारी बातचीत के लिए दो मिनट का समय है?', timestamp: '00:03' },
      { id: 'm2', speaker: 'customer', speakerName: 'Vikramaditya Sharma', text: 'नमस्ते Aria जी। हाँ बोलिए, क्या बात है?', timestamp: '00:15' },
      { id: 'm3', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'धन्यवाद विक्रम जी! मैं देख रही थी कि FinApex में आपकी सेल्स टीम काफी तेजी से बढ़ रही है। क्या आपके SDRs अभी भी कॉलिंग और CRM डेटा एंट्री में दिन के 3 से 4 घंटे मैन्युअली लगा रहे हैं?', timestamp: '00:28' },
      { id: 'm4', speaker: 'customer', speakerName: 'Vikramaditya Sharma', text: 'हाँ, यह एक बहुत बड़ा सिरदर्द है। हमारे सेल्स रेप्लिका Salesforce में नोट्स भरने में ही आधा दिन गँवा देते हैं।', timestamp: '00:46' },
      { id: 'm5', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'बिल्कुल सही कहा आपने। OmniFlow CRM इसी परेशानी को खत्म करता है। हमारा वॉइस AI कॉल समाप्त होते ही स्वतः Salesforce में नोट्स, एक्शन आइटम्स और पाइपलाइन स्टेज अपडेट कर देता है। हमारे ग्राहकों का कहना है कि उनकी टीम की क्लोजिंग कैपेसिटी 40% बढ़ गई है।', timestamp: '01:05' },
      { id: 'm6', speaker: 'customer', speakerName: 'Vikramaditya Sharma', text: 'अरे वाह! क्या यह हिंदी और इंग्लिश दोनों बोलियों के साथ काम करता है?', timestamp: '01:28' },
      { id: 'm7', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'जी हाँ, बिल्कुल! यह भारत की 8 प्रमुख भाषाओं और हिंग्लिश को स्वाभाविक रूप से समझता है और ट्रांसक्राइब करता है। क्या हम कल दोपहर 3 बजे आपकी टीम के लिए एक 15 मिनट का लाइव डेमो शेड्यूल कर सकते हैं?', timestamp: '01:45' },
      { id: 'm8', speaker: 'customer', speakerName: 'Vikramaditya Sharma', text: 'ज़रूर, कल दोपहर 3 बजे बढ़िया रहेगा। मुझे कैलेंडर इनवाइट भेज दीजिए।', timestamp: '02:08' },
      { id: 'm9', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'बहुत-बहुत धन्यवाद विक्रम जी! मैंने आपके ईमेल vikram@finapex.co पर कैलेंडर इनवाइट और प्रोडक्ट ओवरव्यू भेज दिया है। कल आपसे बात होगी!', timestamp: '02:22' }
    ],
    aiSummary: 'Customer confirmed high friction with manual CRM data entry for 25 SDRs. Displayed strong interest in multilingual voice transcription and bidirectional Salesforce sync. Successfully booked a live enterprise demo for tomorrow at 3:00 PM IST.',
    objections: ['Manual data entry fatigue in Salesforce', 'Language barrier in regional calling'],
    customerRequirements: ['Salesforce bidirectional integration', 'Hinglish & Hindi voice support', '25-seat deployment'],
    nextSteps: ['Sent calendar invitation for Oct 21, 3:00 PM IST', 'Shared executive one-pager & pricing breakdown', 'Assigned deal to Enterprise AE team']
  },
  {
    id: 'call-102',
    customerName: 'Kavya Sree Reddy',
    customerEmail: 'kavya.reddy@cyientrix.io',
    customerPhone: '+91 94408 77123',
    productId: 'prod-2',
    productName: 'CloudPulse APM',
    date: '2026-10-20',
    timestamp: '10:42 AM',
    durationSeconds: 312,
    status: 'Demo Requested',
    language: 'Telugu',
    recordingAvailable: true,
    recordingDuration: '05:12',
    sentiment: 'Positive',
    aiScore: 92,
    transcript: [
      { id: 't1', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'నమస్కారం కావ్య గారు! నేను CloudPulse APM నుండి Aria మాట్లాడుతున్నాను. మీ కుబెర్నెటిస్ క్లస్టర్ల అబ్జర్వబిలిటీ గురించి ఒక నిమిషం మాట్లాడవచ్చా?', timestamp: '00:04' },
      { id: 't2', speaker: 'customer', speakerName: 'Kavya Sree Reddy', text: 'నమస్కారం అండీ. అవును చెప్పండి, మా టీమ్ ప్రస్తుతం హై లేటెన్సీ ఇష్యూస్ ఫేస్ చేస్తోంది.', timestamp: '00:19' },
      { id: 't3', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'అర్థమైంది కావ్య గారు. మైక్రోసర్వీసెస్‌లో లేటెన్సీ స్పైక్స్ రూట్-కాజ్ తెలుసుకోవడం చాలా కష్టం. CloudPulse లో eBPF టెక్నాలజీ ద్వారా జీరో CPU ఓవర్‌హెడ్‌తో ప్రతి ప్యాకెట్ ట్రేస్ చేయవచ్చు.', timestamp: '00:38' },
      { id: 't4', speaker: 'customer', speakerName: 'Kavya Sree Reddy', text: 'మా ప్రస్తుత Datadog కంటే ఇది నిజంగా కాస్ట్ సేవ్ చేస్తుందా?', timestamp: '01:02' },
      { id: 't5', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'ఖచ్చితంగా! డేటా ట్రాన్స్‌ఫర్ అండ్ లైసెన్సింగ్ ఖర్చుల్లో దాదాపు 42% వరకు ఆదా అవుతుంది. మా సొల్యూషన్స్ ఆర్కిటెక్ట్‌తో గురువారం ఉదయం 11 గంటలకు టెక్నికల్ డెమో సెట్ చేయమంటారా?', timestamp: '01:25' },
      { id: 't6', speaker: 'customer', speakerName: 'Kavya Sree Reddy', text: 'సరే అండీ, గురువారం 11 గంటలకి డెమో బుక్ చేయండి. మా డెవాప్స్ లీడ్స్ కూడా అటెండ్ అవుతారు.', timestamp: '01:50' },
      { id: 't7', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'ధన్యవాదాలు కావ్య గారు! క్యాలెండర్ ఇన్విటేషన్ మీ ఈమెయిల్‌కు పంపించాను. హావ్ ఎ గ్రేట్ డే!', timestamp: '02:08' }
    ],
    aiSummary: 'Prospect experiences recurring Kubernetes latency spikes and high Datadog expenditure on 80 nodes. Convinced of eBPF kernel tracing efficiency. Scheduled technical architecture evaluation for Thursday 11:00 AM IST with DevOps team.',
    objections: ['High Datadog switching costs', 'Kernel-level overhead concerns'],
    customerRequirements: ['eBPF zero-overhead proof of concept', 'Cost comparison calculator vs Datadog', 'Kubernetes Helm chart deployment'],
    nextSteps: ['Invite sent for Thursday 11:00 AM', 'Sent eBPF benchmark whitepaper to DevOps team']
  },
  {
    id: 'call-103',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.v@apexlogistics.com',
    customerPhone: '+1 (415) 890-3329',
    productId: 'prod-1',
    productName: 'OmniFlow CRM',
    date: '2026-10-19',
    timestamp: '08:20 PM',
    durationSeconds: 245,
    status: 'Interested',
    language: 'English',
    recordingAvailable: true,
    recordingDuration: '04:05',
    sentiment: 'Positive',
    aiScore: 88,
    transcript: [
      { id: 'e1', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'Hi Marcus! This is Aria with OmniFlow CRM. I noticed Apex Logistics expanded outbound freight operations recently. Do you have two minutes to chat about automated pipeline capture?', timestamp: '00:03' },
      { id: 'e2', speaker: 'customer', speakerName: 'Marcus Vance', text: 'Hey Aria. We do outbound via cold calls and LinkedIn, but our pipeline attribution is pretty messy right now.', timestamp: '00:16' },
      { id: 'e3', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'That is the number one pain point we hear from logistics leaders. OmniFlow maps every voice touchpoint directly to deal revenue, saving your reps 6+ hours weekly.', timestamp: '00:32' },
      { id: 'e4', speaker: 'customer', speakerName: 'Marcus Vance', text: 'Sounds promising. What does pricing look like for an 18-person brokerage team?', timestamp: '00:54' },
      { id: 'e5', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'Our Growth AI tier is $129 per user per month billed annually, which includes our full autonomous voice stack and unlimited CRM bi-directional sync.', timestamp: '01:14' },
      { id: 'e6', speaker: 'customer', speakerName: 'Marcus Vance', text: 'Send over the feature comparison sheet and your SOC-2 report. I\'ll review with our CTO on Monday.', timestamp: '01:35' },
      { id: 'e7', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'Already sent to marcus.v@apexlogistics.com! I will set a reminder to check in with you on Tuesday morning.', timestamp: '01:50' }
    ],
    aiSummary: 'Marcus Vance is evaluating outbound tooling for an 18-person freight brokerage team. Primary interest is automated call attribution and eliminating messy CRM hygiene. Requested SOC-2 compliance docs and tier comparison sheet.',
    objections: ['Need CTO security review', 'Budget allocation for 18 seats'],
    customerRequirements: ['SOC-2 Type II audit report', 'Custom freight brokerage pipeline fields'],
    nextSteps: ['Sent SOC-2 packet & growth pricing guide', 'Follow-up task scheduled for Tuesday 10:00 AM PST']
  },
  {
    id: 'call-104',
    customerName: 'Ananya Rao',
    customerEmail: 'ananya.rao@zenithhc.in',
    customerPhone: '+91 80234 11984',
    productId: 'prod-3',
    productName: 'Securify Zero-Trust',
    date: '2026-10-19',
    timestamp: '04:10 PM',
    durationSeconds: 198,
    status: 'Follow-up Required',
    language: 'English',
    recordingAvailable: true,
    recordingDuration: '03:18',
    sentiment: 'Neutral',
    aiScore: 78,
    transcript: [
      { id: 'a1', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'Hello Ananya! Aria calling from Securify Zero-Trust. Reaching out regarding Zenith HealthCloud\'s upcoming HIPAA compliance recertification.', timestamp: '00:03' },
      { id: 'a2', speaker: 'customer', speakerName: 'Ananya Rao', text: 'Hello. Yes, our audit committee meets this Thursday. We are looking for continuous identity governance.', timestamp: '00:15' },
      { id: 'a3', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'Securify automates 94% of HIPAA identity access controls and provides instant audit evidence reports. Would you like a customized compliance matrix before your committee meets?', timestamp: '00:32' },
      { id: 'a4', speaker: 'customer', speakerName: 'Ananya Rao', text: 'Yes, please email that over. I cannot commit right now, but ping me Friday post-meeting.', timestamp: '00:48' }
    ],
    aiSummary: 'Healthcare prospect preparing for HIPAA recertification audit. Requested automated compliance matrix. Requires follow-up call post-committee review on Friday.',
    objections: ['Awaiting board / committee sign-off'],
    customerRequirements: ['HIPAA evidence automation', 'Zero-trust JIT privilege escalation'],
    nextSteps: ['Dispatched HIPAA compliance matrix PDF', 'Automated follow-up sequence set for Friday morning']
  },
  {
    id: 'call-105',
    customerName: 'David Tremblay',
    customerEmail: 'david.t@quebecfleet.ca',
    customerPhone: '+1 (514) 772-9018',
    productId: 'prod-2',
    productName: 'CloudPulse APM',
    date: '2026-10-17',
    timestamp: '02:30 PM',
    durationSeconds: 85,
    status: 'Not Interested',
    language: 'French',
    recordingAvailable: true,
    recordingDuration: '01:25',
    sentiment: 'Negative',
    aiScore: 42,
    transcript: [
      { id: 'd1', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'Bonjour David! Ici Aria de CloudPulse APM pour discuter de la surveillance cloud de vos applications.', timestamp: '00:03' },
      { id: 'd2', speaker: 'customer', speakerName: 'David Tremblay', text: 'Merci, mais nous venons tout juste de signer un contrat de 3 ans avec Dynatrace le mois dernier. Nous ne cherchons rien.', timestamp: '00:15' },
      { id: 'd3', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'Je comprends tout à fait David. Nous vous souhaitons une excellente réussite avec Dynatrace. Bonne journée!', timestamp: '00:32' }
    ],
    aiSummary: 'Prospect recently renewed a 3-year commitment with Dynatrace. Disqualified gracefully with polite sign-off. Marked as Not Interested.',
    objections: ['Multi-year incumbent contract with Dynatrace'],
    customerRequirements: ['None (locked in)'],
    nextSteps: ['Set re-contact trigger for 2.5 years out', 'No immediate follow-up']
  },
  {
    id: 'call-106',
    customerName: 'Carlos Mendoza',
    customerEmail: 'carlos@solariasaas.mx',
    customerPhone: '+52 55 4190 2831',
    productId: 'prod-1',
    productName: 'OmniFlow CRM',
    date: '2026-10-16',
    timestamp: '11:00 AM',
    durationSeconds: 32,
    status: 'No Response',
    language: 'Spanish',
    recordingAvailable: false,
    sentiment: 'Neutral',
    aiScore: 30,
    transcript: [
      { id: 'c1', speaker: 'ai', speakerName: 'VoiceSell AI (Aria)', text: 'Hola Carlos! Esta es Aria de OmniFlow CRM. Su buzón de voz respondió. Dejamos un mensaje con enlace a su WhatsApp para agendar cuando le sea conveniente.', timestamp: '00:05' }
    ],
    aiSummary: 'Call routed to carrier voicemail. Aria left an automated personalized Spanish audio message with a demo scheduler link.',
    objections: ['Voicemail reached'],
    customerRequirements: [],
    nextSteps: ['Automated WhatsApp ping triggered', 'Next attempt scheduled in 48 hours']
  }
];

export const INITIAL_AGENT_SETTINGS: AgentSettings = {
  agentName: 'Aria — Enterprise Voice SDR',
  voicePreference: 'ElevenLabs Nova (Natural Expressive)',
  voiceGender: 'female',
  personality: 'Empathetic, razor-sharp enterprise consultant who actively listens, identifies acute business bottlenecks, and gently steers toward scheduling high-value demos.',
  salesApproach: 'Consultative',
  openingGreeting: 'Hello [Customer Name]! This is Aria with [Product Name]. I noticed your team has been scaling operations recently — do you have two minutes to discuss accelerating your pipeline?',
  supportedLanguages: ['English', 'Hindi', 'Telugu', 'Spanish', 'Tamil', 'German', 'French', 'Kannada'],
  conversationRules: [
    'Always address the prospect by their respectful first name or localized title (e.g., "ji" in Hindi, "Garu" in Telugu).',
    'Never interrupt while the customer is actively vocalizing; allow a 400ms buffer before responding.',
    'If the prospect expresses hesitation around price, immediately pivot to ROI and deferred trial options.',
    'Ask clarifying discovery questions before offering a product feature pitch.',
    'Ensure explicit verbal agreement before sending calendar invites or locking demo times.',
    'Maintain a calm, warm, and highly professional conversational pace.'
  ],
  followUpBehavior: 'Automatically synthesize call transcripts into CRM tasks, send personalized calendar invitations within 60 seconds, and enqueue WhatsApp/SMS recaps if requested.',
  demoBookingInstructions: 'Offer two specific time slots (e.g., "Tomorrow at 3 PM or Thursday at 11 AM"). Check company calendar availability in real time and immediately confirm email address spelling.',
  speakingRate: 1.0,
  interruptionHandling: 'Context-Aware',
  maxCallDurationMinutes: 12,
  ambientNoiseSuppression: true
};

export const INITIAL_APP_SETTINGS: AppSettings = {
  profile: {
    fullName: 'Alex Reynolds',
    email: 'alex.reynolds@voicesell.ai',
    title: 'VP of Global Revenue Operations',
    company: 'VoiceSell Enterprise Inc.',
    phone: '+1 (555) 234-9081'
  },
  workspace: {
    name: 'VoiceSell Global Production',
    tier: 'Enterprise Growth Fleet',
    callsLimit: 5000,
    callsUsed: 1482,
    minutesLimit: 25000,
    minutesUsed: 6372,
    timezone: 'UTC+05:30 (Asia/Kolkata / IST)',
    currency: 'USD ($)'
  },
  integrations: [
    {
      name: 'ElevenLabs Conversational Voice API',
      provider: 'ElevenLabs',
      category: 'Voice Engine',
      status: 'Not Configured',
      keyMasked: 'eleven_••••••••••••••••3f9a',
      lastTested: 'Awaiting API Key & Endpoint setup',
      docsUrl: 'https://elevenlabs.io/docs/conversational-ai'
    },
    {
      name: 'OpenAI Realtime WebSocket API (GPT-4o Voice)',
      provider: 'OpenAI Realtime',
      category: 'LLM Reasoning',
      status: 'Not Configured',
      keyMasked: 'sk-proj-••••••••••••••4k19',
      lastTested: 'Awaiting WebSocket endpoint configuration',
      docsUrl: 'https://platform.openai.com/docs/guides/realtime'
    },
    {
      name: 'Deepgram Nova-2 Multilingual ASR',
      provider: 'Deepgram',
      category: 'Speech-to-Text',
      status: 'Not Configured',
      keyMasked: 'dg_••••••••••••••••91bd',
      lastTested: 'Awaiting STT token activation',
      docsUrl: 'https://developers.deepgram.com'
    },
    {
      name: 'Twilio Programmable SIP & Voice Trunk',
      provider: 'Twilio Telephony',
      category: 'Telephony',
      status: 'Not Configured',
      keyMasked: 'AC••••••••••••••••e812',
      lastTested: 'Carrier trunk not connected in Stage 1 UI',
      docsUrl: 'https://www.twilio.com/docs/voice'
    },
    {
      name: 'HubSpot CRM Bi-directional Sync',
      provider: 'HubSpot CRM',
      category: 'CRM',
      status: 'Not Configured',
      keyMasked: 'pat-na1-••••••••••••49bc',
      lastTested: 'OAuth app token pending',
      docsUrl: 'https://developers.hubspot.com'
    },
    {
      name: 'Salesforce Enterprise Connected App',
      provider: 'Salesforce',
      category: 'CRM',
      status: 'Not Configured',
      keyMasked: '3MVG9••••••••••••••',
      lastTested: 'Connected App credentials required',
      docsUrl: 'https://developer.salesforce.com'
    }
  ],
  privacy: {
    recordingConsentRequired: true,
    consentDisclaimerText: 'This call may be monitored and recorded by VoiceSell AI for quality assurance and automated meeting notes. Do you agree to proceed?',
    dataRetentionDays: 90,
    autoRedactPii: true,
    gdprCompliantMode: true,
    requireOptInBeforeSpeaking: true
  }
};

export const DASHBOARD_METRICS = {
  totalCalls: 1482,
  completedCalls: 1328,
  interestedLeads: 642,
  conversions: 318,
  conversionRate: 21.5,
  averageCallDurationSec: 258, // 4m 18s
  callGrowthRate: '+18.4% vs last month',
  revenueInfluenced: 894000
};

export const CONVERSION_TREND_DATA = [
  { date: 'Mon', calls: 145, interested: 62, conversions: 28 },
  { date: 'Tue', calls: 210, interested: 94, conversions: 46 },
  { date: 'Wed', calls: 245, interested: 112, conversions: 58 },
  { date: 'Thu', calls: 280, interested: 128, conversions: 69 },
  { date: 'Fri', calls: 310, interested: 145, conversions: 74 },
  { date: 'Sat', calls: 160, interested: 58, conversions: 26 },
  { date: 'Sun', calls: 132, interested: 43, conversions: 17 }
];

export const SALES_STATUS_DISTRIBUTION = [
  { status: 'Converted', count: 318, percentage: 21.5, color: '#10B981', bg: 'bg-emerald-500' },
  { status: 'Interested', count: 324, percentage: 21.9, color: '#6366F1', bg: 'bg-indigo-500' },
  { status: 'Demo Requested', count: 285, percentage: 19.2, color: '#8B5CF6', bg: 'bg-violet-500' },
  { status: 'Follow-up Required', count: 242, percentage: 16.3, color: '#F59E0B', bg: 'bg-amber-500' },
  { status: 'Not Interested', count: 186, percentage: 12.6, color: '#EF4444', bg: 'bg-rose-500' },
  { status: 'No Response', count: 127, percentage: 8.5, color: '#64748B', bg: 'bg-slate-500' }
];

export const RECENT_ACTIVITY_FEED = [
  {
    id: 'act-1',
    type: 'conversion',
    title: 'Lead Converted to Customer',
    description: 'Vikramaditya Sharma from FinApex accepted Growth AI tier ($18,500 ARR)',
    time: '12 minutes ago',
    badge: 'Converted',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 'act-2',
    type: 'demo',
    title: 'Telugu Demo Scheduled',
    description: 'Kavya Sree Reddy booked CloudPulse eBPF architecture session for Thursday 11 AM',
    time: '42 minutes ago',
    badge: 'Demo Requested',
    badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
  },
  {
    id: 'act-3',
    type: 'call',
    title: 'Multilingual Call Finished',
    description: 'Aria completed 4m 05s call with Marcus Vance (Apex Logistics) with 88% AI score',
    time: '1 hour ago',
    badge: 'Interested',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  },
  {
    id: 'act-4',
    type: 'lead',
    title: 'Compliance Follow-up Enqueued',
    description: 'Ananya Rao requested HIPAA security compliance pack for Zenith HealthCloud',
    time: '2 hours ago',
    badge: 'Follow-up Required',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  },
  {
    id: 'act-5',
    type: 'product',
    title: 'Product Pitch Calibrated',
    description: 'OmniFlow CRM pitch updated with enterprise objection handling and Hinglish nuances',
    time: '4 hours ago',
    badge: 'Updated',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
  }
];
