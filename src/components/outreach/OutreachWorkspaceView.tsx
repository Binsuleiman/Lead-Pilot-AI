import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  OutreachChannel,
  OutreachObjective,
  OutreachTone,
  OutreachLength,
  OutreachOption,
  OutreachDraft,
  DraftStatus,
} from '../../types';
import { checkObjectiveFit, getSuggestedRecipient } from '../../services/outreachService';
import { LeadStatusBadge } from '../common/LeadStatusBadge';
import { ResearchStatusBadge } from '../common/ResearchStatusBadge';
import { ContactStatusBadge } from '../common/ContactStatusBadge';
import { SpeechToTextButton } from '../common/SpeechToTextButton';
import {
  Sparkles,
  Mail,
  Instagram,
  Facebook,
  Linkedin,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Save,
  Send,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Download,
  Trash2,
  Edit3,
  Clock,
  Settings,
  Search,
  Sliders,
  AlertCircle,
  FileText,
  Phone,
  Globe,
  Loader2,
} from 'lucide-react';

const CHANNELS: { id: OutreachChannel; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'email', label: 'Cold Email', icon: Mail, description: 'Subject line + structured B2B inquiry' },
  { id: 'instagram_dm', label: 'Instagram DM', icon: Instagram, description: 'Visual & conversational short message' },
  { id: 'facebook_messenger', label: 'Facebook Messenger', icon: Facebook, description: 'Direct business page inquiry' },
  { id: 'linkedin_message', label: 'LinkedIn', icon: Linkedin, description: 'Professional B2B message' },
  { id: 'general_dm', label: 'SMS / General DM', icon: MessageSquare, description: 'Concise mobile text or web form intake' },
];

const OBJECTIVES: { id: OutreachObjective; label: string; description: string }[] = [
  { id: 'modern_website', label: 'Offer Modern Website', description: 'For businesses with no website or outdated web presence' },
  { id: 'redesign', label: 'Website Redesign / Refresh', description: 'Streamline mobile layout, navigation, and intake speed' },
  { id: 'improvements', label: 'Website Conversion Improvements', description: 'Add 1-click calls-to-action and quote intake flows' },
  { id: 'ai_chatbot', label: 'AI Estimate & Chat Assistant', description: 'Automated 24/7 customer inquiry and response bot' },
  { id: 'workflow_automation', label: 'Workflow & Booking Automation', description: 'Automated booking, dispatch, and client notifications' },
  { id: 'conversation', label: 'General Business Introduction', description: 'Open a low-friction conversation around local growth' },
  { id: 'custom', label: 'Custom Offer / Service', description: 'Provide your own specific service or value proposition' },
];

const TONES: { id: OutreachTone; label: string }[] = [
  { id: 'friendly', label: 'Friendly & Conversational' },
  { id: 'professional', label: 'Professional' },
  { id: 'confident', label: 'Confident & Respectful' },
  { id: 'direct', label: 'Direct & Concise' },
];

const LENGTHS: { id: OutreachLength; label: string; desc: string }[] = [
  { id: 'very_short', label: 'Very Short', desc: '2-3 punchy sentences' },
  { id: 'short', label: 'Short (Recommended)', desc: '3-5 clear sentences' },
  { id: 'standard', label: 'Standard', desc: '5-7 structured sentences' },
];

export const OutreachWorkspaceView: React.FC = () => {
  const {
    leads,
    selectedLeadId,
    setSelectedLeadId,
    senderProfile,
    updateSenderProfile,
    generateLeadOutreach,
    saveLeadDraft,
    updateLeadDraft,
    deleteLeadDraft,
    exportOutreachDraftsCsv,
    setCurrentTab,
    dataSourceMode,
  } = useApp();

  // Active Lead Selection
  const activeLead = useMemo(() => {
    if (selectedLeadId) {
      const found = leads.find((l) => l.id === selectedLeadId);
      if (found) return found;
    }
    // Fallback: pick first qualified or researched lead
    const qualified = leads.find((l) => l.qualificationStatus === 'Qualified');
    if (qualified) return qualified;
    return leads[0] || null;
  }, [leads, selectedLeadId]);

  // Lead search filter for the dropdown
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);

  // Configuration States
  const [channel, setChannel] = useState<OutreachChannel>('email');
  const [objective, setObjective] = useState<OutreachObjective>('modern_website');
  const [customObjective, setCustomObjective] = useState('');
  const [tone, setTone] = useState<OutreachTone>('friendly');
  const [length, setLength] = useState<OutreachLength>('short');

  // Sender Profile Drawer toggle
  const [showSenderSettings, setShowSenderSettings] = useState(false);
  const [senderDraft, setSenderDraft] = useState(senderProfile);

  // Generation & Options States
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<OutreachOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<'A' | 'B' | 'C'>('A');
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // UI feedback states
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [viewSavedDrafts, setViewSavedDrafts] = useState(false);

  // Sync sender draft when profile changes
  useEffect(() => {
    setSenderDraft(senderProfile);
  }, [senderProfile]);

  // Auto-detect best objective based on lead's status
  useEffect(() => {
    if (activeLead) {
      if (!activeLead.website || activeLead.websiteStatus === 'No website found') {
        setObjective('modern_website');
      } else if (activeLead.structuredFindings?.checklist?.visibleCallToAction === 'No') {
        setObjective('improvements');
      } else {
        setObjective('ai_chatbot');
      }
    }
  }, [activeLead?.id]);

  // Check objective fit against lead
  const fitWarning = useMemo(() => {
    if (!activeLead) return null;
    return checkObjectiveFit(activeLead, objective);
  }, [activeLead, objective]);

  // Suggested recipient
  const suggestedRecipient = useMemo(() => {
    if (!activeLead) return null;
    return getSuggestedRecipient(activeLead, channel);
  }, [activeLead, channel]);

  // Saved drafts for the active lead
  const savedDrafts = useMemo(() => {
    if (!activeLead || !Array.isArray(activeLead.outreachDrafts)) return [];
    return activeLead.outreachDrafts;
  }, [activeLead]);

  // Load existing active draft or first draft if available
  useEffect(() => {
    if (activeLead && savedDrafts.length > 0) {
      const activeD =
        savedDrafts.find((d) => d.id === activeLead.activeDraftId) || savedDrafts[0];
      if (activeD) {
        setChannel(activeD.channel);
        setObjective(activeD.objective);
        if (activeD.customObjective) setCustomObjective(activeD.customObjective);
        setTone(activeD.tone);
        setLength(activeD.length);
        setEditableSubject(activeD.subject || '');
        setEditableBody(activeD.body);
      }
    }
  }, [activeLead?.id]);

  // Handle generation
  const handleGenerate = async () => {
    if (!activeLead) return;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateLeadOutreach(activeLead.id, {
        channel,
        objective,
        customObjective: objective === 'custom' ? customObjective : undefined,
        tone,
        length,
      });

      if (result && result.options.length > 0) {
        setOptions(result.options);
        const optA = result.options[0];
        setSelectedOptionId(optA.id);
        setEditableSubject(optA.subject || '');
        setEditableBody(optA.body);
      } else {
        setGenerationError('Unable to generate options. Please check your Gemini API key or try again.');
      }
    } catch (err: any) {
      setGenerationError(err?.message || 'Unexpected error during outreach generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Switch between Option A, B, C
  const handleSelectOption = (optId: 'A' | 'B' | 'C') => {
    setSelectedOptionId(optId);
    const chosen = options.find((o) => o.id === optId);
    if (chosen) {
      setEditableSubject(chosen.subject || '');
      setEditableBody(chosen.body);
    }
  };

  // Copy helpers
  const handleCopySubject = () => {
    if (!editableSubject) return;
    navigator.clipboard.writeText(editableSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    if (!editableBody) return;
    navigator.clipboard.writeText(editableBody);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  // Save as Draft
  const handleSaveDraft = (status: DraftStatus = 'draft') => {
    if (!activeLead || !editableBody.trim()) return;

    const currentOption = options.find((o) => o.id === selectedOptionId);

    saveLeadDraft(activeLead.id, {
      leadId: activeLead.id,
      leadBusinessName: activeLead.businessName,
      channel,
      objective,
      customObjective: objective === 'custom' ? customObjective : undefined,
      tone,
      length,
      subject: channel === 'email' ? editableSubject : undefined,
      body: editableBody,
      selectedOptionId,
      evidenceUsed: currentOption?.evidencePoints || [activeLead.qualificationReason],
      sourceUrls: currentOption?.sourceUrls || (activeLead.website ? [activeLead.website] : []),
      isLimitedPersonalization: currentOption?.isLimitedPersonalization,
      recipientContact: suggestedRecipient || undefined,
      status,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Save Sender Settings
  const handleSaveSenderProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSenderProfile(senderDraft);
    setShowSenderSettings(false);
  };

  // Filtered leads for the lead switcher dropdown
  const filteredLeadOptions = useMemo(() => {
    if (!leadSearchQuery.trim()) return leads;
    const q = leadSearchQuery.toLowerCase();
    return leads.filter(
      (l) =>
        l.businessName.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
    );
  }, [leads, leadSearchQuery]);

  const currentOptionData = options.find((o) => o.id === selectedOptionId);

  // If no leads at all exist
  if (leads.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-200/80 shadow-xs">
          <Send className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">AI Outreach Engine</h2>
        <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
          No businesses found yet. Start a new lead discovery search first so LeadPilot can research and qualify businesses before crafting evidence-based outreach.
        </p>
        <button
          onClick={() => setCurrentTab('new-search')}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold text-xs hover:bg-zinc-800 transition-colors shadow-xs"
        >
          Start New Search
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Workspace Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">AI Outreach Workspace</h1>
            <span className="text-[11px] font-semibold text-purple-800 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md">
              Evidence-Grounded
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-2xl">
            Generates high-touch, thoughtful B2B communications based strictly on verified web research, technical observations, and qualification criteria. No generic AI templates or fabricated claims.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSenderSettings(!showSenderSettings)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors"
            title="Edit your sender name, business, and value proposition"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span>Sender Profile</span>
          </button>

          <button
            onClick={() => exportOutreachDraftsCsv()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 transition-colors"
            title="Export all saved outreach drafts to CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Export Drafts CSV</span>
          </button>

          <button
            onClick={() => {
              setSelectedLeadId(null);
              setCurrentTab('leads');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Back to Leads</span>
          </button>
        </div>
      </div>

      {/* Sender Profile Settings Drawer / Card */}
      {showSenderSettings && (
        <div className="p-5 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-purple-600" />
                Sender & Business Profile
              </h3>
              <p className="text-xs text-zinc-500">
                These optional details are used to naturally sign off outreach messages without fabricating credentials.
              </p>
            </div>
            <button
              onClick={() => setShowSenderSettings(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 font-medium"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSaveSenderProfile} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Your Name</label>
              <input
                type="text"
                value={senderDraft.senderName}
                onChange={(e) => setSenderDraft({ ...senderDraft, senderName: e.target.value })}
                placeholder="e.g. Alex Mercer"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Your Business / Brand</label>
              <input
                type="text"
                value={senderDraft.businessName}
                onChange={(e) => setSenderDraft({ ...senderDraft, businessName: e.target.value })}
                placeholder="e.g. Apex Studio"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Default Service Offered</label>
              <input
                type="text"
                value={senderDraft.serviceOffered}
                onChange={(e) => setSenderDraft({ ...senderDraft, serviceOffered: e.target.value })}
                placeholder="e.g. modern websites & booking automation"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Portfolio or Website URL (Optional)</label>
              <input
                type="url"
                value={senderDraft.portfolioUrl || ''}
                onChange={(e) => setSenderDraft({ ...senderDraft, portfolioUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Calendar / Booking Link (Optional)</label>
              <input
                type="url"
                value={senderDraft.bookingLink || ''}
                onChange={(e) => setSenderDraft({ ...senderDraft, bookingLink: e.target.value })}
                placeholder="https://cal.com/... or calendly.com/..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">Preferred Sign-off</label>
              <input
                type="text"
                value={senderDraft.preferredSignoff || 'Best regards'}
                onChange={(e) => setSenderDraft({ ...senderDraft, preferredSignoff: e.target.value })}
                placeholder="Best regards / Best / Warmly"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white font-semibold rounded-lg text-xs hover:bg-zinc-800 transition-colors shadow-xs"
              >
                Save Sender Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Target Lead Selector Bar */}
      <div className="p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0">
              Target Lead:
            </span>

            {/* Custom Lead Picker Dropdown */}
            <div className="relative flex-1 max-w-md">
              <button
                type="button"
                onClick={() => setLeadDropdownOpen(!leadDropdownOpen)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-xs font-semibold text-zinc-900 transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{activeLead?.businessName || 'Select lead'}</span>
                  {activeLead && <LeadStatusBadge status={activeLead.qualificationStatus} size="sm" />}
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
              </button>

              {leadDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-72 overflow-y-auto p-2 space-y-1">
                  <div className="p-1.5 pb-2 border-b border-zinc-100">
                    <input
                      type="text"
                      value={leadSearchQuery}
                      onChange={(e) => setLeadSearchQuery(e.target.value)}
                      placeholder="Filter leads by name, city..."
                      className="w-full px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  {filteredLeadOptions.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedLeadId(l.id);
                        setLeadDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        l.id === activeLead?.id ? 'bg-purple-50 text-purple-950 font-bold' : 'hover:bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="block truncate">{l.businessName}</span>
                        <span className="text-[10px] text-zinc-400 block">{l.category} · {l.address}</span>
                      </div>
                      <LeadStatusBadge status={l.qualificationStatus} size="sm" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Lead Meta & Badges */}
          {activeLead && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <ResearchStatusBadge status={activeLead.researchStatus || 'Not researched'} />
              <ContactStatusBadge status={activeLead.contactEnrichmentStatus} />
              {savedDrafts.length > 0 && (
                <button
                  onClick={() => setViewSavedDrafts(!viewSavedDrafts)}
                  className="px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold text-[11px] border border-purple-200 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-purple-600" />
                  <span>{savedDrafts.length} {savedDrafts.length === 1 ? 'Draft' : 'Drafts'} Saved</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contact Availability Strip */}
        {activeLead && (
          <div className="p-3 rounded-xl bg-zinc-50/80 border border-zinc-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-zinc-700">
              <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong className="text-zinc-900 font-semibold">Suggested Recipient:</strong>{' '}
                {suggestedRecipient ? (
                  <span className="font-mono text-zinc-800 bg-white px-2 py-0.5 rounded border border-zinc-200">
                    {suggestedRecipient.label}
                  </span>
                ) : (
                  <span className="text-zinc-400 italic">
                    No direct email found. Use official contact form or telephone line.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
              {activeLead.website ? (
                <a
                  href={activeLead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="italic text-zinc-400">No official website</span>
              )}
              <span>·</span>
              <span>{activeLead.phone || 'No phone'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Outreach Config (Left) & Generated Output Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Channel Selector */}
          <div className="p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-purple-600" />
              1. Outreach Channel
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHANNELS.map((ch) => {
                const Icon = ch.icon;
                const isSelected = channel === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setChannel(ch.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/50 shadow-2xs text-purple-950 font-bold'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-zinc-500'}`} />
                      <span className="text-xs">{ch.label}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-normal line-clamp-1">{ch.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Objective Selector */}
          <div className="p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              2. Outreach Objective
            </h3>

            {/* Objective fit warning if angle clashes with evidence */}
            {fitWarning?.hasWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">{fitWarning.warning}</p>
                </div>
                {fitWarning.suggestedObjective && (
                  <button
                    onClick={() => setObjective(fitWarning.suggestedObjective!)}
                    className="text-[11px] font-bold text-amber-950 underline hover:text-amber-800"
                  >
                    Switch to recommended: {OBJECTIVES.find((o) => o.id === fitWarning.suggestedObjective)?.label}
                  </button>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              {OBJECTIVES.map((obj) => (
                <label
                  key={obj.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    objective === obj.id
                      ? 'border-purple-600 bg-purple-50/40 text-purple-950'
                      : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="objective"
                    value={obj.id}
                    checked={objective === obj.id}
                    onChange={() => setObjective(obj.id)}
                    className="mt-0.5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold block">{obj.label}</span>
                    <span className="text-[10px] text-zinc-500 block leading-tight">{obj.description}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Objective Textarea if selected */}
            {objective === 'custom' && (
              <div className="pt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 block">Describe Your Specific Offer</label>
                  <SpeechToTextButton
                    onTranscript={(text) => setCustomObjective(text)}
                    currentValue={customObjective}
                    size="xs"
                    variant="pill"
                    label="Dictate"
                  />
                </div>
                <div className="relative">
                  <textarea
                    value={customObjective}
                    onChange={(e) => setCustomObjective(e.target.value)}
                    placeholder="e.g. specialized commercial HVAC duct cleaning equipment inspections..."
                    rows={2}
                    className="w-full p-2.5 pr-8 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <div className="absolute right-2 bottom-2.5">
                    <SpeechToTextButton
                      onTranscript={(text) => setCustomObjective(text)}
                      currentValue={customObjective}
                      size="xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tone & Length Controls */}
          <div className="p-5 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
                3. Message Tone
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      tone === t.id
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">
                4. Length
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {LENGTHS.map((len) => (
                  <button
                    key={len.id}
                    type="button"
                    onClick={() => setLength(len.id)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      length === len.id
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                    title={len.desc}
                  >
                    {len.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Generate Button */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !activeLead}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Research & Drafting 3 Options...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Generate Outreach (3 Options)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output Workspace & Review (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Generation Error Banner */}
          {generationError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{generationError}</p>
                  <p className="text-[11px] text-rose-800 mt-0.5">
                    Make sure public research is completed and your GEMINI_API_KEY is configured in Secrets.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* If options generated or draft available */}
          {options.length > 0 || editableBody ? (
            <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              {/* Option Selector Tabs (Option A, B, C) */}
              {options.length > 0 && (
                <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        selectedOptionId === opt.id
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <span>{opt.label.split('—')[0].trim()}</span>
                      <span className="text-[10px] text-zinc-400 hidden sm:inline truncate">
                        ({opt.label.split('—')[1]?.trim() || opt.angle})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Subject Line Field (Email only) */}
              {channel === 'email' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      Subject Line
                    </label>
                    <div className="flex items-center gap-2">
                      <SpeechToTextButton
                        onTranscript={(text) => setEditableSubject(text)}
                        currentValue={editableSubject}
                        size="xs"
                      />
                      <button
                        type="button"
                        onClick={handleCopySubject}
                        className="text-xs font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1"
                      >
                        {copiedSubject ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Subject</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    placeholder="Subject line..."
                  />
                </div>
              )}

              {/* Message Body Editor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs pb-1">
                  <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                    Message Body (Editable)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {editableBody.split(/\s+/).filter(Boolean).length} words
                    </span>
                    <SpeechToTextButton
                      onTranscript={(text) => setEditableBody(text)}
                      currentValue={editableBody}
                      variant="pill"
                      size="xs"
                      label="Dictate Message"
                    />
                    <button
                      type="button"
                      onClick={handleCopyBody}
                      className="text-xs font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1"
                    >
                      {copiedBody ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={editableBody}
                    onChange={(e) => setEditableBody(e.target.value)}
                    rows={9}
                    className="w-full p-4 pr-10 bg-zinc-50/70 border border-zinc-200 rounded-xl text-xs leading-relaxed font-sans text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-inner"
                    placeholder="Generated personalized outreach will appear here..."
                  />
                  <div className="absolute right-3 bottom-3">
                    <SpeechToTextButton
                      onTranscript={(text) => setEditableBody(text)}
                      currentValue={editableBody}
                      variant="icon"
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Save Draft / Ready for Outreach / Regenerate */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-zinc-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSaveDraft('draft')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-800 bg-white hover:bg-zinc-100 border border-zinc-200 shadow-2xs transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    onClick={() => handleSaveDraft('ready')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors"
                    title="Mark this draft as finalized and ready for manual sending"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Mark as Ready for Outreach</span>
                  </button>

                  {savedSuccess && (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved!</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              </div>

              {/* Evidence Transparency Section (Requirement 9) */}
              <div className="pt-3 border-t border-zinc-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Why This Message is Personalized
                  </span>
                  {currentOptionData?.isLimitedPersonalization ? (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Limited Personalization
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Grounded in Research
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/70 space-y-2 text-xs">
                  <span className="text-[11px] font-semibold text-zinc-700 block">Verified Business Facts Used:</span>
                  <div className="space-y-1 pl-4">
                    {currentOptionData?.evidencePoints && currentOptionData.evidencePoints.length > 0 ? (
                      currentOptionData.evidencePoints.map((pt, i) => (
                        <div key={i} className="text-[11px] text-zinc-700 leading-relaxed flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                          <span>{pt}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">
                        {activeLead.qualificationReason || 'Standard verified local business record.'}
                      </p>
                    )}
                  </div>

                  {/* Sources Cited */}
                  {currentOptionData?.sourceUrls && currentOptionData.sourceUrls.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200/60 flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="text-zinc-500 font-medium">Source Links:</span>
                      {currentOptionData.sourceUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline truncate max-w-[200px]"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-400 italic pt-1">
                    LeadPilot never invents customer complaints, revenue losses, or fake audits. All outreach drafts require human review before manual dispatch.
                  </p>
                </div>

                {/* Quality Checks Pill Strip */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-600 pt-1">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Verified Business Name
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Supported Claims Only
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    1 Low-Pressure CTA
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Human-Reviewed Assistant
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State for Output Workspace */
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900">Ready to Generate Outreach</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Select your channel and objective on the left, then click <strong>&quot;Generate Outreach&quot;</strong>. LeadPilot will produce 3 distinct personalized variations for {activeLead.businessName}.
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Generate Outreach for {activeLead.businessName}</span>
              </button>
            </div>
          )}

          {/* Saved Drafts Accordion / Drawer */}
          {savedDrafts.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  Saved Drafts for {activeLead.businessName} ({savedDrafts.length})
                </span>
                <span className="text-[10px] text-zinc-400">Persisted locally</span>
              </div>

              <div className="space-y-2">
                {savedDrafts.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded font-mono uppercase ${
                            d.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'archived'
                              ? 'bg-zinc-200 text-zinc-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status === 'ready' ? 'Ready for Outreach' : d.status}
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 capitalize">
                          {d.channel.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setChannel(d.channel);
                            setObjective(d.objective);
                            setTone(d.tone);
                            setLength(d.length);
                            setEditableSubject(d.subject || '');
                            setEditableBody(d.body);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-white border border-zinc-200 rounded shadow-2xs"
                        >
                          Load into Editor
                        </button>

                        <button
                          onClick={() => deleteLeadDraft(activeLead.id, d.id)}
                          className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {d.subject && (
                      <p className="text-xs font-semibold text-zinc-800 truncate">
                        Subject: {d.subject}
                      </p>
                    )}

                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed font-sans">
                      {d.body}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
                      <span>Updated: {new Date(d.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(d.subject ? `Subject: ${d.subject}\n\n${d.body}` : d.body);
                        }}
                        className="text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
