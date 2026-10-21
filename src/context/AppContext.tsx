import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Product,
  Lead,
  CallRecord,
  AgentSettings,
  AppSettings,
  TranscriptMessage,
  SalesStatus,
  FollowUpTask,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_LEADS,
  INITIAL_CALLS,
  INITIAL_AGENT_SETTINGS,
  INITIAL_APP_SETTINGS,
  INITIAL_FOLLOW_UP_TASKS,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { supabase, getRecordingSignedUrl, uploadRecordingFile } from '../lib/supabase';
import { useToast } from './ToastContext';

export type NavigationTab =
  | 'dashboard'
  | 'live-call'
  | 'products'
  | 'leads'
  | 'call-history'
  | 'tasks'
  | 'agent-settings'
  | 'settings';

interface AppContextValue {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  products: Product[];
  leads: Lead[];
  calls: CallRecord[];
  followUpTasks: FollowUpTask[];
  agentSettings: AgentSettings;
  appSettings: AppSettings;
  selectedCallId: string | null;
  setSelectedCallId: (id: string | null) => void;
  isLoadingData: boolean;
  dataError: string | null;
  refreshWorkspaceData: () => Promise<void>;
  // Live Call prefill
  liveCallPrefill: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    productId: string;
    preferredLanguage: string;
  } | null;
  startCallWithLead: (lead: Lead) => void;
  clearLiveCallPrefill: () => void;
  // CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'callCount' | 'conversionRate'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'lastContactedAt'>) => Promise<void>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addCallRecord: (call: CallRecord, audioBlob?: Blob) => Promise<void>;
  deleteCallRecord: (id: string) => Promise<void>;
  purgeExpiredRecords: (retentionDays: number) => Promise<{ success: boolean; purgedCount: number; message: string }>;
  manuallyCorrectCallStatus: (callId: string, newStatus: SalesStatus, notes?: string) => Promise<void>;
  createFollowUpTask: (task: Omit<FollowUpTask, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateFollowUpTask: (id: string, updates: Partial<FollowUpTask>) => Promise<void>;
  markTaskComplete: (id: string) => Promise<void>;
  deleteFollowUpTask: (id: string) => Promise<void>;
  updateAgentSettings: (settings: Partial<AgentSettings>) => Promise<void>;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateIntegrationStatus: (providerName: string, status: 'Connected' | 'Not Configured' | 'Action Required') => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { activeWorkspace, user, isConfigured } = useAuth();
  const { showToast } = useToast();

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [calls, setCalls] = useState<CallRecord[]>(INITIAL_CALLS);
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>(INITIAL_FOLLOW_UP_TASKS);
  const [agentSettings, setAgentSettings] = useState<AgentSettings>(INITIAL_AGENT_SETTINGS);
  const [appSettings, setAppSettings] = useState<AppSettings>(INITIAL_APP_SETTINGS);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [liveCallPrefill, setLiveCallPrefill] = useState<{
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    productId: string;
    preferredLanguage: string;
  } | null>(null);

  // Sync workspace details to appSettings
  useEffect(() => {
    if (activeWorkspace) {
      setAppSettings((prev) => ({
        ...prev,
        workspace: {
          id: activeWorkspace.id,
          name: activeWorkspace.name,
          tier: activeWorkspace.tier,
          callsLimit: activeWorkspace.calls_limit,
          callsUsed: activeWorkspace.calls_used,
          minutesLimit: activeWorkspace.minutes_limit,
          minutesUsed: activeWorkspace.minutes_used,
          timezone: activeWorkspace.timezone,
          currency: activeWorkspace.currency,
        },
      }));
    }
  }, [activeWorkspace]);

  // Fetch real data from Supabase whenever activeWorkspace changes
  useEffect(() => {
    if (isConfigured && activeWorkspace?.id) {
      refreshWorkspaceData();
    }
  }, [isConfigured, activeWorkspace?.id]);

  const refreshWorkspaceData = async () => {
    if (!activeWorkspace?.id) return;
    setIsLoadingData(true);
    setDataError(null);

    try {
      const wsId = activeWorkspace.id;

      // 1. Fetch Products
      const { data: dbProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;

      // Fetch FAQs for these products
      const { data: dbFaqs } = await supabase
        .from('product_faqs')
        .select('*')
        .eq('workspace_id', wsId);

      if (dbProducts && dbProducts.length > 0) {
        const mappedProducts: Product[] = dbProducts.map((p) => {
          const faqsForProd = (dbFaqs || [])
            .filter((f) => f.product_id === p.id)
            .map((f) => ({ q: f.question, a: f.answer, id: f.id }));

          return {
            id: p.id,
            workspace_id: p.workspace_id,
            name: p.name,
            tagline: p.tagline || '',
            category: p.category || 'Sales Tech & CRM',
            description: p.description || '',
            features: Array.isArray(p.features) ? p.features : [],
            pricing: Array.isArray(p.pricing) ? p.pricing : [],
            targetAudience: p.target_audience || '',
            customerPainPoints: Array.isArray(p.customer_pain_points) ? p.customer_pain_points : [],
            competitorDifferentiation: p.competitor_differentiation || '',
            demoBookingProcess: p.demo_booking_process || '',
            purchasingInstructions: p.purchasing_instructions || '',
            faqs: faqsForProd.length > 0 ? faqsForProd : [
              { q: 'What is the setup time?', a: 'Standard setup takes under 30 minutes.' }
            ],
            objectionHandling: [
              { objection: 'Budget is frozen.', counter: 'Customers save 3.4x ROI within 45 days.' }
            ],
            productWebsite: p.product_website || 'https://',
            salesPitch: p.sales_pitch || '',
            tone: p.tone || 'Consultative',
            preferredLanguage: p.preferred_language || 'English',
            callToAction: p.call_to_action || 'Book a 15-minute live architecture demo',
            aiInstructions: p.ai_instructions || '',
            active: p.active ?? true,
            createdAt: p.created_at ? p.created_at.split('T')[0] : '2026-10-20',
            callCount: p.call_count || 0,
            conversionRate: p.conversion_rate || 0,
          };
        });
        setProducts(mappedProducts);
      }

      // 2. Fetch Leads
      const { data: dbLeads, error: leadErr } = await supabase
        .from('leads')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false });

      if (leadErr) throw leadErr;

      if (dbLeads && dbLeads.length > 0) {
        const mappedLeads: Lead[] = dbLeads.map((l) => ({
          id: l.id,
          workspace_id: l.workspace_id,
          name: l.name,
          company: l.company,
          email: l.email,
          phone: l.phone || '',
          preferredLanguage: l.preferred_language || 'English',
          associatedProductId: l.associated_product_id || '',
          associatedProductName: l.associated_product_name || 'OmniFlow CRM',
          salesStatus: l.sales_status,
          dealValue: Number(l.deal_value || 0),
          notes: l.notes || '',
          city: l.city || '',
          country: l.country || '',
          createdAt: l.created_at ? l.created_at.split('T')[0] : '2026-10-20',
          lastContactedAt: l.last_contacted_at ? l.last_contacted_at.split('T')[0] : '2026-10-20',
        }));
        setLeads(mappedLeads);
      }

      // 3. Fetch Call Sessions
      const { data: dbCalls, error: callErr } = await supabase
        .from('call_sessions')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false });

      if (callErr) throw callErr;

      if (dbCalls && dbCalls.length > 0) {
        // Fetch all call messages & summaries
        const callIds = dbCalls.map((c) => c.id);
        const { data: dbMessages } = await supabase
          .from('call_messages')
          .select('*')
          .in('call_session_id', callIds)
          .order('timestamp_offset_seconds', { ascending: true });

        const { data: dbSummaries } = await supabase
          .from('call_summaries')
          .select('*')
          .in('call_session_id', callIds);

        // Map and resolve signed URLs for private recording storage
        const mappedCalls: CallRecord[] = await Promise.all(
          dbCalls.map(async (c) => {
            const msgsForCall: TranscriptMessage[] = (dbMessages || [])
              .filter((m) => m.call_session_id === c.id)
              .map((m) => ({
                id: m.id,
                speaker: m.speaker,
                speakerName: m.speaker_name,
                text: m.text,
                timestamp: m.formatted_time || '00:00',
              }));

            const sumForCall = (dbSummaries || []).find((s) => s.call_session_id === c.id);

            // Generate signed URL if recording_storage_path exists
            let signedAudioUrl: string | null = null;
            if (c.recording_storage_path) {
              signedAudioUrl = await getRecordingSignedUrl(c.recording_storage_path);
            }

            const rawAnalysis = c.ai_analysis_metadata?.analysis || sumForCall?.structured_analysis || null;

            return {
              id: c.id,
              workspace_id: c.workspace_id,
              lead_id: c.lead_id,
              productId: c.product_id || '',
              productName: c.product_name || 'OmniFlow CRM',
              customerName: c.customer_name,
              customerEmail: c.customer_email,
              customerPhone: c.customer_phone || '',
              date: c.created_at ? c.created_at.split('T')[0] : '2026-10-20',
              timestamp: c.created_at
                ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '10:00 AM',
              startTime: c.start_time,
              endTime: c.end_time,
              durationSeconds: c.duration_seconds || 0,
              status: c.sales_status,
              originalAiStatus: c.original_ai_status || rawAnalysis?.original_ai_status || c.sales_status,
              isManuallyCorrected: Boolean(c.is_manually_corrected),
              correctedBy: c.corrected_by || undefined,
              correctedAt: c.corrected_at || undefined,
              correctionNotes: c.correction_notes || undefined,
              callStatus: c.call_status,
              language: c.selected_language || 'English',
              recordingAvailable: Boolean(c.recording_storage_path),
              recordingDuration: `${Math.floor((c.duration_seconds || 0) / 60)}:${((c.duration_seconds || 0) % 60).toString().padStart(2, '0')}`,
              recordingStoragePath: c.recording_storage_path,
              recordingSignedUrl: signedAudioUrl,
              sentiment: c.sentiment || 'Positive',
              aiScore: c.ai_score || 85,
              transcript: msgsForCall.length > 0 ? msgsForCall : [
                {
                  id: `msg-${c.id}-1`,
                  speaker: 'ai',
                  speakerName: 'VoiceSell AI',
                  text: `Session recorded with ${c.customer_name}.`,
                  timestamp: '00:03',
                },
              ],
              aiSummary: sumForCall?.executive_summary || 'Customer engaged positively with the AI SDR.',
              customerBusinessAndUseCase: rawAnalysis?.customer_business_and_use_case || sumForCall?.customer_business_and_use_case || 'Unknown',
              customerRequirements: Array.isArray(c.customer_requirements) ? c.customer_requirements : [],
              featuresDiscussed: Array.isArray(rawAnalysis?.features_discussed) ? rawAnalysis.features_discussed : [],
              questionsAsked: Array.isArray(rawAnalysis?.questions_asked) ? rawAnalysis.questions_asked : [],
              objections: Array.isArray(c.objections) ? c.objections : [],
              buyingIntent: rawAnalysis?.buying_intent || c.buying_intent || 'Medium',
              budgetOrTimeline: rawAnalysis?.budget_or_timeline || sumForCall?.budget_or_timeline || 'Unknown',
              promisedActions: Array.isArray(rawAnalysis?.promised_actions) ? rawAnalysis.promised_actions : [],
              nextSteps: Array.isArray(c.next_steps) ? c.next_steps : [],
              followUpDate: c.follow_up_date || rawAnalysis?.follow_up_date || null,
              evidenceQuotes: Array.isArray(rawAnalysis?.evidence_quotes) ? rawAnalysis.evidence_quotes : (Array.isArray(sumForCall?.evidence_quotes) ? sumForCall.evidence_quotes : []),
              structuredAnalysis: rawAnalysis,
              consentStatus: c.consent_status ?? true,
              consentTimestamp: c.consent_timestamp,
              consentText: 'Two-Party Recording Consent verified prior to conversational outreach.',
              summaryStatus: sumForCall ? 'Completed' : (c.call_status === 'Completed' ? 'Completed' : 'Processing'),
            };
          })
        );

        setCalls(mappedCalls);
      }

      // 4. Fetch Agent Settings
      const { data: dbSettings } = await supabase
        .from('agent_settings')
        .select('*')
        .eq('workspace_id', wsId)
        .single();

      if (dbSettings) {
        setAgentSettings({
          id: dbSettings.id,
          workspace_id: dbSettings.workspace_id,
          agentName: dbSettings.agent_name,
          voicePreference: dbSettings.voice_preference,
          voiceGender: dbSettings.voice_gender,
          personality: dbSettings.personality,
          salesApproach: dbSettings.sales_approach,
          salesTone: dbSettings.sales_tone || 'Consultative',
          openingGreeting: dbSettings.opening_greeting,
          qualificationQuestions: Array.isArray(dbSettings.qualification_questions) && dbSettings.qualification_questions.length > 0
            ? dbSettings.qualification_questions
            : INITIAL_AGENT_SETTINGS.qualificationQuestions,
          productSpecificInstructions: dbSettings.product_specific_instructions || INITIAL_AGENT_SETTINGS.productSpecificInstructions,
          closingBehavior: dbSettings.closing_behavior || INITIAL_AGENT_SETTINGS.closingBehavior,
          supportedLanguages: dbSettings.supported_languages || [],
          conversationRules: dbSettings.conversation_rules || [],
          followUpBehavior: dbSettings.follow_up_behavior,
          demoBookingInstructions: dbSettings.demo_booking_instructions,
          speakingRate: Number(dbSettings.speaking_rate || 1.0),
          interruptionHandling: dbSettings.interruption_handling,
          maxCallDurationMinutes: dbSettings.max_call_duration_minutes || 12,
          ambientNoiseSuppression: dbSettings.ambient_noise_suppression ?? true,
        });
      }

      // 5. Fetch Follow-up Tasks
      const { data: dbTasks } = await supabase
        .from('follow_up_tasks')
        .select('*')
        .eq('workspace_id', wsId)
        .order('due_date', { ascending: true });

      if (dbTasks && dbTasks.length > 0) {
        const mappedTasks: FollowUpTask[] = dbTasks.map((t) => {
          const matchedLead = dbLeads?.find((l) => l.id === t.lead_id);
          const matchedCall = dbCalls?.find((c) => c.id === t.call_session_id);
          return {
            id: t.id,
            workspace_id: t.workspace_id,
            call_session_id: t.call_session_id,
            lead_id: t.lead_id,
            customerName: matchedLead?.name || matchedCall?.customer_name || 'Prospect',
            customerEmail: matchedLead?.email || matchedCall?.customer_email || '',
            productName: matchedCall?.product_name || matchedLead?.associated_product_name || 'SaaS Platform',
            title: t.title,
            description: t.description || '',
            due_date: t.due_date || new Date().toISOString(),
            status: t.status || 'pending',
            priority: t.priority || 'medium',
            assigned_to: t.assigned_to || 'Enterprise AE Team',
            created_at: t.created_at,
            updated_at: t.updated_at,
          };
        });
        setFollowUpTasks(mappedTasks);
      }
    } catch (err: any) {
      console.warn('Workspace sync warning:', err.message || err);
      setDataError(err.message || 'Could not sync all tables from Supabase.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const startCallWithLead = (lead: Lead) => {
    setLiveCallPrefill({
      customerName: lead.name,
      customerEmail: lead.email,
      customerPhone: lead.phone,
      productId: lead.associatedProductId,
      preferredLanguage: lead.preferredLanguage || 'English',
    });
    setCurrentTab('live-call');
  };

  const clearLiveCallPrefill = () => {
    setLiveCallPrefill(null);
  };

  // CRUD: Products
  const addProduct = async (prodData: Omit<Product, 'id' | 'createdAt' | 'callCount' | 'conversionRate'>) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const { data: inserted, error } = await supabase
          .from('products')
          .insert({
            workspace_id: activeWorkspace.id,
            name: prodData.name,
            tagline: prodData.tagline,
            category: prodData.category,
            description: prodData.description,
            features: prodData.features,
            pricing: prodData.pricing,
            target_audience: prodData.targetAudience,
            customer_pain_points: prodData.customerPainPoints || [],
            competitor_differentiation: prodData.competitorDifferentiation || '',
            demo_booking_process: prodData.demoBookingProcess || '',
            purchasing_instructions: prodData.purchasingInstructions || '',
            product_website: prodData.productWebsite,
            sales_pitch: prodData.salesPitch,
            tone: prodData.tone,
            preferred_language: prodData.preferredLanguage,
            call_to_action: prodData.callToAction,
            ai_instructions: prodData.aiInstructions,
            active: prodData.active,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert FAQs if any
        if (prodData.faqs && prodData.faqs.length > 0 && inserted) {
          const faqRows = prodData.faqs.map((f, i) => ({
            product_id: inserted.id,
            workspace_id: activeWorkspace.id,
            question: f.q,
            answer: f.a,
            display_order: i + 1,
          }));
          await supabase.from('product_faqs').insert(faqRows);
        }

        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Database Error', err.message, 'error');
      }
    }

    // Local fallback
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      callCount: 0,
      conversionRate: 0,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const payload: Record<string, any> = {};
        if (updatedFields.name !== undefined) payload.name = updatedFields.name;
        if (updatedFields.tagline !== undefined) payload.tagline = updatedFields.tagline;
        if (updatedFields.category !== undefined) payload.category = updatedFields.category;
        if (updatedFields.description !== undefined) payload.description = updatedFields.description;
        if (updatedFields.features !== undefined) payload.features = updatedFields.features;
        if (updatedFields.pricing !== undefined) payload.pricing = updatedFields.pricing;
        if (updatedFields.targetAudience !== undefined) payload.target_audience = updatedFields.targetAudience;
        if (updatedFields.customerPainPoints !== undefined) payload.customer_pain_points = updatedFields.customerPainPoints;
        if (updatedFields.competitorDifferentiation !== undefined) payload.competitor_differentiation = updatedFields.competitorDifferentiation;
        if (updatedFields.demoBookingProcess !== undefined) payload.demo_booking_process = updatedFields.demoBookingProcess;
        if (updatedFields.purchasingInstructions !== undefined) payload.purchasing_instructions = updatedFields.purchasingInstructions;
        if (updatedFields.productWebsite !== undefined) payload.product_website = updatedFields.productWebsite;
        if (updatedFields.salesPitch !== undefined) payload.sales_pitch = updatedFields.salesPitch;
        if (updatedFields.tone !== undefined) payload.tone = updatedFields.tone;
        if (updatedFields.preferredLanguage !== undefined) payload.preferred_language = updatedFields.preferredLanguage;
        if (updatedFields.callToAction !== undefined) payload.call_to_action = updatedFields.callToAction;
        if (updatedFields.aiInstructions !== undefined) payload.ai_instructions = updatedFields.aiInstructions;
        if (updatedFields.active !== undefined) payload.active = updatedFields.active;

        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Database Error', err.message, 'error');
      }
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const deleteProduct = async (id: string) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Database Error', err.message, 'error');
      }
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // CRUD: Leads
  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'lastContactedAt'>) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const { error } = await supabase.from('leads').insert({
          workspace_id: activeWorkspace.id,
          name: leadData.name,
          company: leadData.company,
          email: leadData.email,
          phone: leadData.phone,
          preferred_language: leadData.preferredLanguage,
          associated_product_id: leadData.associatedProductId || null,
          associated_product_name: leadData.associatedProductName,
          sales_status: leadData.salesStatus,
          deal_value: leadData.dealValue,
          notes: leadData.notes,
          city: leadData.city,
          country: leadData.country,
        });

        if (error) throw error;
        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Database Error', err.message, 'error');
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      createdAt: today,
      lastContactedAt: today,
    };
    setLeads((prev) => [newLead, ...prev]);
  };

  const updateLead = async (id: string, updatedFields: Partial<Lead>) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const payload: Record<string, any> = {};
        if (updatedFields.name !== undefined) payload.name = updatedFields.name;
        if (updatedFields.company !== undefined) payload.company = updatedFields.company;
        if (updatedFields.email !== undefined) payload.email = updatedFields.email;
        if (updatedFields.phone !== undefined) payload.phone = updatedFields.phone;
        if (updatedFields.preferredLanguage !== undefined) payload.preferred_language = updatedFields.preferredLanguage;
        if (updatedFields.associatedProductId !== undefined) payload.associated_product_id = updatedFields.associatedProductId;
        if (updatedFields.associatedProductName !== undefined) payload.associated_product_name = updatedFields.associatedProductName;
        if (updatedFields.salesStatus !== undefined) payload.sales_status = updatedFields.salesStatus;
        if (updatedFields.dealValue !== undefined) payload.deal_value = updatedFields.dealValue;
        if (updatedFields.notes !== undefined) payload.notes = updatedFields.notes;
        if (updatedFields.city !== undefined) payload.city = updatedFields.city;
        if (updatedFields.country !== undefined) payload.country = updatedFields.country;
        payload.last_contacted_at = new Date().toISOString();

        const { error } = await supabase.from('leads').update(payload).eq('id', id);
        if (error) throw error;
        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Database Error', err.message, 'error');
      }
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updatedFields } : l))
    );
  };

  const deleteLead = async (id: string) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Database Error', err.message, 'error');
      }
    }

    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  // Live Call & History Persistence
  const addCallRecord = async (call: CallRecord, audioBlob?: Blob) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const wsId = activeWorkspace.id;

        // Find associated lead if any
        const matchedLead = leads.find((l) => l.email.toLowerCase() === call.customerEmail.toLowerCase());

        let storagePath: string | null = null;
        if (audioBlob && call.consentStatus !== false) {
          storagePath = await uploadRecordingFile(wsId, call.id, audioBlob);
        } else if (call.recordingStoragePath && call.consentStatus !== false) {
          storagePath = call.recordingStoragePath;
        } else {
          storagePath = null;
        }

        // 1. Insert or update call_session (retry idempotency)
        const sessionPayload = {
          workspace_id: wsId,
          lead_id: matchedLead ? matchedLead.id : null,
          product_id: call.productId || null,
          customer_name: call.customerName,
          customer_email: call.customerEmail,
          customer_phone: call.customerPhone,
          product_name: call.productName,
          start_time: call.startTime || new Date().toISOString(),
          end_time: call.endTime || new Date().toISOString(),
          duration_seconds: call.durationSeconds,
          call_status: 'Completed',
          selected_language: call.language,
          consent_status: call.consentStatus ?? true,
          consent_timestamp: new Date().toISOString(),
          recording_storage_path: storagePath,
          customer_requirements: call.customerRequirements || [],
          objections: call.objections || [],
          next_steps: call.nextSteps || [],
          sales_status: call.status,
          original_ai_status: call.originalAiStatus || call.status,
          is_manually_corrected: Boolean(call.isManuallyCorrected),
          corrected_by: call.correctedBy || null,
          corrected_at: call.correctedAt || null,
          correction_notes: call.correctionNotes || null,
          follow_up_date: call.followUpDate || null,
          buying_intent: call.buyingIntent || 'Medium',
          ai_score: call.aiScore || 85,
          sentiment: call.sentiment || 'Positive',
          ai_analysis_metadata: {
            analysis: call.structuredAnalysis || null,
            evidenceQuotes: call.evidenceQuotes || [],
            timestamp: new Date().toISOString(),
          },
        };

        const existingCall = calls.find((c) => c.id === call.id);
        let sessionId = call.id;

        if (existingCall) {
          await supabase.from('call_sessions').update(sessionPayload).eq('id', call.id);
        } else {
          const { data: sessionRow, error: sessionErr } = await supabase
            .from('call_sessions')
            .insert(sessionPayload)
            .select()
            .single();

          if (sessionErr) throw sessionErr;
          sessionId = sessionRow.id;
        }

        // 2. Insert call_messages if new
        if (!existingCall && call.transcript && call.transcript.length > 0) {
          const msgRows = call.transcript.map((m, i) => ({
            call_session_id: sessionId,
            workspace_id: wsId,
            speaker: m.speaker,
            speaker_name: m.speakerName,
            text: m.text,
            timestamp_offset_seconds: i * 4,
            formatted_time: m.timestamp,
          }));
          await supabase.from('call_messages').insert(msgRows);
        }

        // 3. Upsert call_summaries
        const summaryPayload = {
          call_session_id: sessionId,
          workspace_id: wsId,
          executive_summary: call.aiSummary,
          customer_sentiment: call.sentiment,
          objections_summary: call.objections,
          requirements_summary: call.customerRequirements,
          next_steps_summary: call.nextSteps,
          confidence_score: call.aiScore,
          structured_analysis: call.structuredAnalysis || {},
          evidence_quotes: call.evidenceQuotes || [],
          customer_business_and_use_case: call.customerBusinessAndUseCase || 'Unknown',
          features_discussed: call.featuresDiscussed || [],
          questions_asked: call.questionsAsked || [],
          budget_or_timeline: call.budgetOrTimeline || 'Unknown',
          promised_actions: call.promisedActions || [],
        };

        if (existingCall) {
          await supabase.from('call_summaries').update(summaryPayload).eq('call_session_id', sessionId);
        } else {
          await supabase.from('call_summaries').insert(summaryPayload);
        }

        // 4. Insert call_recordings
        if (storagePath && !existingCall) {
          await supabase.from('call_recordings').insert({
            call_session_id: sessionId,
            workspace_id: wsId,
            storage_bucket: 'call-recordings',
            storage_path: storagePath,
            duration_seconds: call.durationSeconds,
            file_size_bytes: 2048000,
            mime_type: 'audio/wav',
          });
        }

        // 5. Insert recording_consents
        if (!existingCall) {
          await supabase.from('recording_consents').insert({
            call_session_id: sessionId,
            lead_id: matchedLead ? matchedLead.id : null,
            workspace_id: wsId,
            consent_given: call.consentStatus ?? true,
            consent_text: 'Two-Party Recording Consent verified prior to conversational outreach.',
          });
        }

        // 6. Update lead sales status in database
        if (matchedLead) {
          await supabase
            .from('leads')
            .update({
              sales_status: call.status,
              last_contacted_at: new Date().toISOString(),
            })
            .eq('id', matchedLead.id);
        }

        // 7. Enqueue follow-up task if action required
        if (call.status === 'Demo Requested' || call.status === 'Follow-up Required') {
          await supabase.from('follow_up_tasks').insert({
            call_session_id: sessionId,
            lead_id: matchedLead ? matchedLead.id : null,
            workspace_id: wsId,
            title: call.status === 'Demo Requested'
              ? `Schedule Live Demo for ${call.customerName}`
              : `Follow-up with ${call.customerName} (${call.productName})`,
            description: (call.nextSteps && call.nextSteps.join('; ')) || call.aiSummary,
            due_date: call.followUpDate ? `${call.followUpDate}T10:00:00Z` : new Date(Date.now() + 86400000 * 2).toISOString(),
            status: 'pending',
            priority: call.status === 'Demo Requested' ? 'high' : 'medium',
            assigned_to: 'Enterprise AE Team',
          });
        }

        // Refresh all workspace tables
        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Call Persistence Error', err.message, 'error');
      }
    }

    // Local fallback with idempotency check
    setCalls((prev) => {
      const idx = prev.findIndex((c) => c.id === call.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = call;
        return updated;
      }
      return [call, ...prev];
    });

    setLeads((prev) =>
      prev.map((l) => {
        if (l.email.toLowerCase() === call.customerEmail.toLowerCase()) {
          return {
            ...l,
            salesStatus: call.status,
            lastContactedAt: new Date().toISOString().split('T')[0],
          };
        }
        return l;
      })
    );
  };

  // Manual Classification Override with Auditing
  const manuallyCorrectCallStatus = async (
    callId: string,
    newStatus: SalesStatus,
    notes?: string
  ) => {
    const existingCall = calls.find((c) => c.id === callId);
    if (!existingCall) return;

    const originalAi = existingCall.originalAiStatus || existingCall.status;
    const now = new Date().toISOString();
    const actor = user?.email || 'Authorized Auditor';

    if (isConfigured && activeWorkspace?.id) {
      try {
        const { error } = await supabase
          .from('call_sessions')
          .update({
            sales_status: newStatus,
            original_ai_status: originalAi,
            is_manually_corrected: true,
            corrected_by: actor,
            corrected_at: now,
            correction_notes: notes || 'Manual audit classification override',
          })
          .eq('id', callId);

        if (error) throw error;

        // Update lead sales status if lead exists
        if (existingCall.customerEmail) {
          await supabase
            .from('leads')
            .update({
              sales_status: newStatus,
              last_contacted_at: now,
            })
            .eq('email', existingCall.customerEmail);
        }

        await refreshWorkspaceData();
        showToast('Classification Updated', `Status changed to ${newStatus}. Original AI status (${originalAi}) preserved for audit.`, 'success');
        return;
      } catch (err: any) {
        showToast('Update Failed', err.message, 'error');
      }
    }

    // Local fallback update
    setCalls((prev) =>
      prev.map((c) =>
        c.id === callId
          ? {
              ...c,
              status: newStatus,
              originalAiStatus: originalAi,
              isManuallyCorrected: true,
              correctedBy: actor,
              correctedAt: now,
              correctionNotes: notes || 'Manual audit classification override',
            }
          : c
      )
    );
    setLeads((prev) =>
      prev.map((l) =>
        l.email.toLowerCase() === existingCall.customerEmail.toLowerCase()
          ? { ...l, salesStatus: newStatus, lastContactedAt: now.split('T')[0] }
          : l
      )
    );
    showToast('Classification Updated', `Status changed to ${newStatus}. Original AI status (${originalAi}) preserved.`, 'success');
  };

  // Secure Individual Call Record Deletion
  const deleteCallRecord = async (id: string) => {
    const targetCall = calls.find((c) => c.id === id);
    if (!targetCall) return;

    if (isConfigured && activeWorkspace?.id) {
      try {
        if (targetCall.recordingStoragePath) {
          try {
            await supabase.storage
              .from('call-recordings')
              .remove([targetCall.recordingStoragePath]);
          } catch (stErr) {
            console.warn('Storage delete notice:', stErr);
          }
        }

        const { error } = await supabase.from('call_sessions').delete().eq('id', id);
        if (error) throw error;

        await refreshWorkspaceData();
        showToast('Call Record Deleted', 'Call session, transcript, and recording purged.', 'success');
        return;
      } catch (err: any) {
        showToast('Delete Error', err.message, 'error');
        return;
      }
    }

    setCalls((prev) => prev.filter((c) => c.id !== id));
    showToast('Call Record Deleted', 'Call session purged from workspace.', 'success');
  };

  // Retention Purge Policy Execution
  const purgeExpiredRecords = async (
    retentionDays: number
  ): Promise<{ success: boolean; purgedCount: number; message: string }> => {
    if (retentionDays < 7) {
      return { success: false, purgedCount: 0, message: 'Retention threshold cannot be under 7 days.' };
    }

    if (isConfigured && activeWorkspace?.id) {
      try {
        const { data, error } = await supabase.rpc('purge_expired_call_records', {
          retention_days: retentionDays,
        });

        if (error) {
          const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString();
          const { error: delErr } = await supabase
            .from('call_sessions')
            .delete()
            .eq('workspace_id', activeWorkspace.id)
            .lt('start_time', cutoff);

          if (delErr) throw delErr;
          await refreshWorkspaceData();
          return { success: true, purgedCount: 0, message: `Purged records older than ${retentionDays} days.` };
        }

        await refreshWorkspaceData();
        const count = data?.purged_count || 0;
        return {
          success: true,
          purgedCount: count,
          message: `Successfully purged ${count} call records older than ${retentionDays} days.`,
        };
      } catch (err: any) {
        return { success: false, purgedCount: 0, message: err.message || 'Error purging records' };
      }
    }

    const cutoffDate = new Date(Date.now() - retentionDays * 86400000);
    let count = 0;
    setCalls((prev) => {
      const remaining = prev.filter((c) => {
        const callTime = new Date(c.startTime || c.date);
        if (callTime < cutoffDate) {
          count++;
          return false;
        }
        return true;
      });
      return remaining;
    });

    return {
      success: true,
      purgedCount: count,
      message: `Purged ${count} call records older than ${retentionDays} days based on workspace retention policy.`,
    };
  };

  // Follow-Up Task Management
  const createFollowUpTask = async (taskData: Omit<FollowUpTask, 'id' | 'created_at' | 'updated_at'>) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const { error } = await supabase.from('follow_up_tasks').insert({
          workspace_id: activeWorkspace.id,
          call_session_id: taskData.call_session_id || null,
          lead_id: taskData.lead_id || null,
          title: taskData.title,
          description: taskData.description || '',
          due_date: taskData.due_date,
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          assigned_to: taskData.assigned_to || 'Enterprise AE Team',
        });

        if (error) throw error;
        await refreshWorkspaceData();
        showToast('Task Scheduled', `Follow-up task "${taskData.title}" queued successfully.`, 'success');
        return;
      } catch (err: any) {
        showToast('Task Creation Error', err.message, 'error');
      }
    }

    const newTask: FollowUpTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFollowUpTasks((prev) => [newTask, ...prev]);
    showToast('Task Scheduled', `Follow-up task "${taskData.title}" queued successfully.`, 'success');
  };

  const updateFollowUpTask = async (id: string, updates: Partial<FollowUpTask>) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const payload: Record<string, any> = { updated_at: new Date().toISOString() };
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.due_date !== undefined) payload.due_date = updates.due_date;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.priority !== undefined) payload.priority = updates.priority;
        if (updates.assigned_to !== undefined) payload.assigned_to = updates.assigned_to;

        const { error } = await supabase.from('follow_up_tasks').update(payload).eq('id', id);
        if (error) throw error;
        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Task Update Error', err.message, 'error');
      }
    }

    setFollowUpTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    );
  };

  const markTaskComplete = async (id: string) => {
    await updateFollowUpTask(id, { status: 'completed' });
    showToast('Task Completed', 'Task marked as completed.', 'success');
  };

  const deleteFollowUpTask = async (id: string) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const { error } = await supabase.from('follow_up_tasks').delete().eq('id', id);
        if (error) throw error;
        await refreshWorkspaceData();
        showToast('Task Deleted', 'Follow-up task removed.', 'info');
        return;
      } catch (err: any) {
        showToast('Task Delete Error', err.message, 'error');
      }
    }

    setFollowUpTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task Deleted', 'Follow-up task removed.', 'info');
  };

  // Agent Settings Persistence
  const updateAgentSettings = async (updated: Partial<AgentSettings>) => {
    if (isConfigured && activeWorkspace?.id) {
      try {
        const wsId = activeWorkspace.id;
        const payload: Record<string, any> = {
          workspace_id: wsId,
        };
        if (updated.agentName !== undefined) payload.agent_name = updated.agentName;
        if (updated.voicePreference !== undefined) payload.voice_preference = updated.voicePreference;
        if (updated.voiceGender !== undefined) payload.voice_gender = updated.voiceGender;
        if (updated.personality !== undefined) payload.personality = updated.personality;
        if (updated.salesApproach !== undefined) payload.sales_approach = updated.salesApproach;
        if (updated.salesTone !== undefined) payload.sales_tone = updated.salesTone;
        if (updated.openingGreeting !== undefined) payload.opening_greeting = updated.openingGreeting;
        if (updated.qualificationQuestions !== undefined) payload.qualification_questions = updated.qualificationQuestions;
        if (updated.productSpecificInstructions !== undefined) payload.product_specific_instructions = updated.productSpecificInstructions;
        if (updated.closingBehavior !== undefined) payload.closing_behavior = updated.closingBehavior;
        if (updated.supportedLanguages !== undefined) payload.supported_languages = updated.supportedLanguages;
        if (updated.conversationRules !== undefined) payload.conversation_rules = updated.conversationRules;
        if (updated.followUpBehavior !== undefined) payload.follow_up_behavior = updated.followUpBehavior;
        if (updated.demoBookingInstructions !== undefined) payload.demo_booking_instructions = updated.demoBookingInstructions;
        if (updated.speakingRate !== undefined) payload.speaking_rate = updated.speakingRate;
        if (updated.interruptionHandling !== undefined) payload.interruption_handling = updated.interruptionHandling;
        if (updated.ambientNoiseSuppression !== undefined) payload.ambient_noise_suppression = updated.ambientNoiseSuppression;

        const { error } = await supabase
          .from('agent_settings')
          .upsert(payload, { onConflict: 'workspace_id' });

        if (error) throw error;
        await refreshWorkspaceData();
        return;
      } catch (err: any) {
        showToast('Settings Save Error', err.message, 'error');
      }
    }

    setAgentSettings((prev) => ({ ...prev, ...updated }));
  };

  // App / Workspace Settings Persistence
  const updateAppSettings = async (updated: Partial<AppSettings>) => {
    if (isConfigured && activeWorkspace?.id && updated.workspace) {
      try {
        const { error } = await supabase
          .from('workspaces')
          .update({
            name: updated.workspace.name,
            timezone: updated.workspace.timezone,
            currency: updated.workspace.currency,
          })
          .eq('id', activeWorkspace.id);

        if (error) throw error;
      } catch (err: any) {
        showToast('Workspace Save Error', err.message, 'error');
      }
    }

    setAppSettings((prev) => ({ ...prev, ...updated }));
  };

  const updateIntegrationStatus = (
    providerName: string,
    status: 'Connected' | 'Not Configured' | 'Action Required'
  ) => {
    setAppSettings((prev) => ({
      ...prev,
      integrations: prev.integrations.map((item) =>
        item.provider === providerName ? { ...item, status } : item
      ),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        products,
        leads,
        calls,
        followUpTasks,
        agentSettings,
        appSettings,
        selectedCallId,
        setSelectedCallId,
        isLoadingData,
        dataError,
        refreshWorkspaceData,
        liveCallPrefill,
        startCallWithLead,
        clearLiveCallPrefill,
        addProduct,
        updateProduct,
        deleteProduct,
        addLead,
        updateLead,
        deleteLead,
        addCallRecord,
        deleteCallRecord,
        purgeExpiredRecords,
        manuallyCorrectCallStatus,
        createFollowUpTask,
        updateFollowUpTask,
        markTaskComplete,
        deleteFollowUpTask,
        updateAgentSettings,
        updateAppSettings,
        updateIntegrationStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
