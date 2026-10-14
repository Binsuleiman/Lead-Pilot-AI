import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LeadStatusBadge } from '../common/LeadStatusBadge';
import { WebsiteStatusBadge } from '../common/WebsiteStatusBadge';
import { ResearchStatusBadge } from '../common/ResearchStatusBadge';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { ContactStatusBadge } from '../common/ContactStatusBadge';
import { EmailStatusBadge } from '../common/EmailStatusBadge';
import { SpeechToTextButton } from '../common/SpeechToTextButton';
import {
  X,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Star,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  Share2,
  Sparkles,
  MessageSquare,
  Send,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  FileText,
  RotateCcw,
  Loader2,
  Layers,
  ShieldCheck,
  Clock,
  FileCheck,
  UserCheck,
  Building2,
  User,
  Tag,
  Archive,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const COMMON_TAG_SUGGESTIONS = [
  'High Priority',
  'Follow Up',
  'Website Opportunity',
  'Contact Found',
  'Review Later',
  'Decision Maker Verified',
  'Qualified Candidate',
];

export const LeadDetailDrawer: React.FC = () => {
  const {
    selectedLead,
    setSelectedLeadId,
    researchLead,
    qualifyLead,
    enrichLead,
    updateLeadOutreach,
    regenerateOutreach,
    setCurrentTab,
    currentTab,
    updateLeadNotes,
    addLeadTag,
    removeLeadTag,
    archiveLead,
    restoreLead,
    deleteLead,
    dataSourceMode,
  } = useApp();

  const [activeOutreachTab, setActiveOutreachTab] = useState<'email' | 'dm' | 'followup'>('email');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [researchLoading, setResearchLoading] = useState(false);
  const [qualifyLoading, setQualifyLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Step 7: Notes, Tags, Delete confirm
  const [notesText, setNotesText] = useState(selectedLead?.notes || '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Sync notes when selected lead changes
  useEffect(() => {
    if (selectedLead) {
      setNotesText(selectedLead.notes || '');
      setNotesSaved(false);
    }
  }, [selectedLead?.id]);

  const handleSaveNotes = () => {
    if (!selectedLead) return;
    updateLeadNotes(selectedLead.id, notesText);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleAddTag = (tag: string) => {
    if (!selectedLead) return;
    const clean = tag.trim();
    if (!clean) return;
    addLeadTag(selectedLead.id, clean);
    setNewTagInput('');
  };

  // Edit draft states
  const [subjectDraft, setSubjectDraft] = useState('');
  const [bodyDraft, setBodyDraft] = useState('');

  if (!selectedLead || currentTab === 'outreach') return null;

  const handleResearchLead = async (force = false) => {
    if (!selectedLead) return;
    setResearchLoading(true);
    try {
      await researchLead(selectedLead.id, force);
    } finally {
      setResearchLoading(false);
    }
  };

  const handleQualifyLead = async () => {
    if (!selectedLead) return;
    setQualifyLoading(true);
    try {
      await qualifyLead(selectedLead.id);
    } finally {
      setQualifyLoading(false);
    }
  };

  const handleEnrichLead = async () => {
    if (!selectedLead) return;
    setEnrichLoading(true);
    try {
      await enrichLead(selectedLead.id);
    } finally {
      setEnrichLoading(false);
    }
  };

  const handleRefreshAndRequalify = async () => {
    if (!selectedLead) return;
    setQualifyLoading(true);
    try {
      await researchLead(selectedLead.id, true);
      await qualifyLead(selectedLead.id);
    } finally {
      setQualifyLoading(false);
    }
  };

  // Sync draft states when opening or switching tabs
  const handleTabSwitch = (tab: 'email' | 'dm' | 'followup') => {
    setActiveOutreachTab(tab);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    if (activeOutreachTab === 'email' && selectedLead.outreachEmail) {
      setSubjectDraft(selectedLead.outreachEmail.subject);
      setBodyDraft(selectedLead.outreachEmail.body);
    } else if (activeOutreachTab === 'dm' && selectedLead.outreachDm) {
      setBodyDraft(selectedLead.outreachDm);
    } else if (activeOutreachTab === 'followup' && selectedLead.outreachFollowUp) {
      setSubjectDraft(selectedLead.outreachFollowUp.subject);
      setBodyDraft(selectedLead.outreachFollowUp.body);
    }
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (activeOutreachTab === 'email') {
      updateLeadOutreach(selectedLead.id, {
        outreachEmail: { subject: subjectDraft, body: bodyDraft },
      });
    } else if (activeOutreachTab === 'dm') {
      updateLeadOutreach(selectedLead.id, {
        outreachDm: bodyDraft,
      });
    } else if (activeOutreachTab === 'followup') {
      updateLeadOutreach(selectedLead.id, {
        outreachFollowUp: { subject: subjectDraft, body: bodyDraft },
      });
    }
    setIsEditing(false);
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (activeOutreachTab === 'email' && selectedLead.outreachEmail) {
      textToCopy = `Subject: ${selectedLead.outreachEmail.subject}\n\n${selectedLead.outreachEmail.body}`;
    } else if (activeOutreachTab === 'dm' && selectedLead.outreachDm) {
      textToCopy = selectedLead.outreachDm;
    } else if (activeOutreachTab === 'followup' && selectedLead.outreachFollowUp) {
      textToCopy = `Subject: ${selectedLead.outreachFollowUp.subject}\n\n${selectedLead.outreachFollowUp.body}`;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      regenerateOutreach(selectedLead.id, activeOutreachTab);
      setIsRegenerating(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-2xs transition-opacity"
        onClick={() => setSelectedLeadId(null)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-xl md:max-w-2xl bg-white shadow-2xl flex flex-col border-l border-zinc-200">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/50">
            <div className="min-w-0 pr-2 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <LeadStatusBadge status={selectedLead.qualificationStatus} size="md" />
                <ResearchStatusBadge status={selectedLead.researchStatus || 'Not researched'} size="md" />
                <ContactStatusBadge status={selectedLead.contactEnrichmentStatus} size="md" />
                <WebsiteStatusBadge status={selectedLead.websiteStatus} />
              </div>
              <h2 className="text-base sm:text-xl font-bold text-zinc-900 tracking-tight truncate">
                {selectedLead.businessName}
              </h2>
              <p className="text-xs text-zinc-500 truncate">{selectedLead.category}</p>

              {/* Research & Enrichment Action Buttons */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                {selectedLead.researchStatus === 'Researching' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Researching Web Presence...</span>
                  </span>
                ) : selectedLead.researchStatus === 'Researched' ? (
                  <button
                    onClick={() => handleResearchLead(true)}
                    disabled={researchLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-2xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${researchLoading ? 'animate-spin' : ''}`} />
                    <span>{researchLoading ? 'Refreshing...' : 'Refresh Research'}</span>
                  </button>
                ) : selectedLead.researchStatus === 'Research failed' ? (
                  <button
                    onClick={() => handleResearchLead(true)}
                    disabled={researchLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-900 hover:bg-rose-800 text-white shadow-xs transition-colors"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${researchLoading ? 'animate-spin' : ''}`} />
                    <span>{researchLoading ? 'Retrying...' : 'Retry Research'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleResearchLead(false)}
                    disabled={researchLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{researchLoading ? 'Researching...' : 'Research Lead'}</span>
                  </button>
                )}

                {/* Quick Enrich Button in Header */}
                {selectedLead.contactEnrichmentStatus === 'Enriching' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>Enriching...</span>
                  </span>
                ) : selectedLead.contactEnrichmentStatus === 'Enriched' || selectedLead.contactEnrichmentStatus === 'Partial' ? (
                  <button
                    onClick={handleEnrichLead}
                    disabled={enrichLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors"
                    title="Re-enrich public contact channels"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${enrichLoading ? 'animate-spin' : ''}`} />
                    <span>{enrichLoading ? 'Enriching...' : 'Re-enrich'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleEnrichLead}
                    disabled={enrichLoading || (selectedLead.researchStatus !== 'Researched' && !selectedLead.businessSummary)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors disabled:opacity-50"
                    title="Enrich public business contact information"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-purple-200" />
                    <span>{enrichLoading ? 'Enriching...' : 'Enrich Contacts'}</span>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedLeadId(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors shrink-0 -mr-2"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 pb-20 sm:pb-8">
            {/* Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 text-xs">
              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  Address
                </span>
                <p className="font-semibold text-zinc-800 leading-snug">{selectedLead.address}</p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  Phone Line
                </span>
                {selectedLead.phone && selectedLead.phone !== 'Not available' ? (
                  <a
                    href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`}
                    className="font-semibold text-zinc-800 font-mono hover:text-blue-600 transition-colors inline-block"
                    title="Tap to call"
                  >
                    {selectedLead.phone}
                  </a>
                ) : (
                  <p className="font-semibold text-zinc-800 font-mono">Not available</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Customer Rating
                </span>
                <p className="font-semibold text-zinc-800 flex items-center gap-1.5">
                  <span className="font-mono text-sm">{selectedLead.rating}</span>
                  <span className="text-zinc-400 font-normal">({selectedLead.reviewCount} reviews)</span>
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                  Web & Maps
                </span>
                <div className="flex items-center gap-3">
                  {selectedLead.website ? (
                    <a
                      href={selectedLead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 truncate max-w-[130px]"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-zinc-400 italic">No URL</span>
                  )}
                  <a
                    href={selectedLead.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-600 hover:text-zinc-900 font-medium inline-flex items-center gap-1"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* 5-Stage Prospecting Workflow Tracking */}
            <div className="p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                  Prospecting Workflow Stages
                </span>
                {selectedLead.isArchived && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-200 text-zinc-700 flex items-center gap-1">
                    <Archive className="w-3 h-3" />
                    Archived Lead
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {/* 1. Discovery */}
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200/80 space-y-0.5">
                  <span className="text-[10px] text-zinc-400 font-semibold block">1. Discovery</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>

                {/* 2. Web Research */}
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200/80 space-y-0.5">
                  <span className="text-[10px] text-zinc-400 font-semibold block">2. Research</span>
                  <span
                    className={`text-[11px] font-semibold ${
                      selectedLead.researchStatus === 'Researched'
                        ? 'text-blue-700'
                        : selectedLead.researchStatus === 'Research failed'
                        ? 'text-rose-700'
                        : 'text-zinc-500'
                    }`}
                  >
                    {selectedLead.researchStatus || 'Not started'}
                  </span>
                </div>

                {/* 3. Qualification */}
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200/80 space-y-0.5">
                  <span className="text-[10px] text-zinc-400 font-semibold block">3. Qualify</span>
                  <span
                    className={`text-[11px] font-semibold ${
                      selectedLead.qualificationStatus === 'Qualified'
                        ? 'text-emerald-700'
                        : selectedLead.qualificationStatus === 'Potential'
                        ? 'text-amber-700'
                        : selectedLead.qualificationStatus === 'Not a match'
                        ? 'text-zinc-600'
                        : 'text-zinc-400'
                    }`}
                  >
                    {selectedLead.qualificationStatus}
                  </span>
                </div>

                {/* 4. Contact Enrichment */}
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200/80 space-y-0.5">
                  <span className="text-[10px] text-zinc-400 font-semibold block">4. Enrichment</span>
                  <span
                    className={`text-[11px] font-semibold ${
                      selectedLead.contactEnrichmentStatus === 'Enriched'
                        ? 'text-purple-700'
                        : selectedLead.contactEnrichmentStatus === 'Partial'
                        ? 'text-purple-600'
                        : 'text-zinc-500'
                    }`}
                  >
                    {selectedLead.contactEnrichmentStatus || 'Not Enriched'}
                  </span>
                </div>

                {/* 5. Outreach */}
                <div className="p-2.5 rounded-lg bg-white border border-zinc-200/80 space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-zinc-400 font-semibold block">5. Outreach</span>
                  <span
                    className={`text-[11px] font-semibold ${
                      Array.isArray(selectedLead.outreachDrafts) && selectedLead.outreachDrafts.length > 0
                        ? 'text-indigo-700'
                        : 'text-zinc-500'
                    }`}
                  >
                    {Array.isArray(selectedLead.outreachDrafts) && selectedLead.outreachDrafts.length > 0
                      ? `${selectedLead.outreachDrafts.length} Saved`
                      : 'No Draft'}
                  </span>
                </div>
              </div>
            </div>

            {/* Private Working Notes & Tags Card */}
            <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-2xs space-y-4">
              {/* Private Working Notes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Private Working Notes</span>
                  </label>
                  {notesSaved && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Notes Saved!
                    </span>
                  )}
                  <SpeechToTextButton
                    onTranscript={(text) => {
                      setNotesText(text);
                      setNotesSaved(false);
                    }}
                    currentValue={notesText}
                    size="xs"
                    variant="pill"
                    label="Dictate Note"
                  />
                </div>

                <p className="text-[11px] text-zinc-400">
                  Private CRM notes for your eyes only. Kept strictly separate from verified public web research and AI qualification evidence.
                </p>

                <div className="relative">
                  <textarea
                    value={notesText}
                    onChange={(e) => {
                      setNotesText(e.target.value);
                      setNotesSaved(false);
                    }}
                    rows={3}
                    placeholder="Record private prospecting observations, follow-up schedule, conversation history, or pricing terms..."
                    className="w-full px-3 py-2 pr-9 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-sans leading-relaxed"
                  />
                  <div className="absolute right-2.5 bottom-2.5">
                    <SpeechToTextButton
                      onTranscript={(text) => {
                        setNotesText(text);
                        setNotesSaved(false);
                      }}
                      currentValue={notesText}
                      size="xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Save Working Notes</span>
                  </button>
                </div>
              </div>

              {/* Custom Lead Tags */}
              <div className="pt-3 border-t border-zinc-100 space-y-2">
                <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-zinc-600" />
                  <span>Lead Tags & Organization</span>
                </label>

                <div className="flex flex-wrap items-center gap-1.5">
                  {(selectedLead.tags || []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200"
                    >
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removeLeadTag(selectedLead.id, t)}
                        className="text-zinc-400 hover:text-rose-600 ml-1 text-sm font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {(selectedLead.tags || []).length === 0 && (
                    <span className="text-xs text-zinc-400 italic">No tags assigned yet.</span>
                  )}
                </div>

                {/* Suggested Tag Chips */}
                <div className="pt-1 flex flex-wrap gap-1.5">
                  {COMMON_TAG_SUGGESTIONS.filter((s) => !(selectedLead.tags || []).includes(s)).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddTag(tag)}
                      className="px-2 py-0.5 rounded text-[11px] bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                {/* Custom Tag Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag(newTagInput);
                      }
                    }}
                    placeholder="Add custom tag name..."
                    className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(newTagInput)}
                    disabled={!newTagInput.trim()}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* AI Qualification Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  AI Qualification
                </h3>
                <div className="flex items-center gap-2">
                  <LeadStatusBadge status={selectedLead.qualificationStatus} />
                  {selectedLead.qualificationConfidence && (
                    <ConfidenceBadge confidence={selectedLead.qualificationConfidence} size="sm" />
                  )}
                  {selectedLead.qualifiedAt && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(selectedLead.qualifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* 1. If Lead Has NOT been researched yet */}
              {selectedLead.researchStatus !== 'Researched' && !selectedLead.businessSummary && (
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/80 space-y-3 text-xs text-center">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500">
                    <Globe className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-800">Research this lead before qualification.</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto mt-0.5">
                      Qualification evaluates real evidence from public web research. Run web research first to gather business signals.
                    </p>
                  </div>
                  <button
                    onClick={() => handleResearchLead(false)}
                    disabled={researchLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{researchLoading ? 'Researching...' : 'Research Lead'}</span>
                  </button>
                </div>
              )}

              {/* 2. If Qualification Failed Banner */}
              {selectedLead.qualificationStatus === 'Qualification Failed' && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-950">Qualification could not be completed for this lead.</p>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        {selectedLead.qualificationError || 'The AI qualification engine encountered an error evaluating the research evidence.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleQualifyLead}
                    disabled={qualifyLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-semibold text-xs transition-colors shadow-2xs"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${qualifyLoading ? 'animate-spin' : ''}`} />
                    <span>Retry Qualification</span>
                  </button>
                </div>
              )}

              {/* 3. If Researched but not yet evaluated or in progress */}
              {(selectedLead.researchStatus === 'Researched' || !!selectedLead.businessSummary) &&
                selectedLead.qualificationStatus === 'Researching' && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 space-y-3 text-xs">
                  <div>
                    <p className="font-semibold text-blue-950">Ready for Lead Qualification</p>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Web research findings are available. Evaluate this business against your search criteria.
                    </p>
                  </div>
                  <button
                    onClick={handleQualifyLead}
                    disabled={qualifyLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    {qualifyLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Qualifying with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Qualify Lead</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 4. If Evaluated (Qualified, Potential, Not a match) */}
              {['Qualified', 'Potential', 'Not a match'].includes(selectedLead.qualificationStatus) && (
                <div className="space-y-3.5">
                  {/* Action toolbar for re-qualifying */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge confidence={selectedLead.qualificationConfidence} size="sm" />
                      <span className="text-[11px] text-zinc-500">
                        {selectedLead.qualifiedAt ? `Evaluated ${new Date(selectedLead.qualifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Evaluated'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleQualifyLead}
                        disabled={qualifyLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 text-[11px] font-semibold border border-zinc-200 shadow-2xs transition-colors"
                        title="Re-run criteria qualification using latest research"
                      >
                        <RotateCcw className={`w-3 h-3 text-zinc-500 ${qualifyLoading ? 'animate-spin' : ''}`} />
                        <span>Requalify Lead</span>
                      </button>

                      <button
                        onClick={handleRefreshAndRequalify}
                        disabled={qualifyLoading || researchLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-semibold shadow-2xs transition-colors"
                        title="Run fresh web research and then re-evaluate qualification"
                      >
                        <RefreshCw className={`w-3 h-3 text-zinc-300 ${(qualifyLoading || researchLoading) ? 'animate-spin' : ''}`} />
                        <span>Refresh Research & Requalify</span>
                      </button>
                    </div>
                  </div>

                  {/* Why this lead qualifies */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                    <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-zinc-600" />
                      Why This Lead Qualifies
                    </span>
                    <p className="text-xs text-zinc-800 leading-relaxed font-normal bg-zinc-50/80 p-3 rounded-lg border border-zinc-100">
                      {selectedLead.qualificationReason || 'Evaluated against your criteria.'}
                    </p>
                  </div>

                  {/* Evidence Bullet Points */}
                  {selectedLead.qualificationEvidence && selectedLead.qualificationEvidence.length > 0 && (
                    <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                      <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Evidence
                      </span>
                      <div className="space-y-1.5 pt-0.5">
                        {selectedLead.qualificationEvidence.map((ev, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700 leading-relaxed">
                            <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Multi-Criteria Evaluation Breakdown */}
                  {selectedLead.criteriaEvaluation && selectedLead.criteriaEvaluation.length > 0 && (
                    <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2.5">
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 text-xs">
                        <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                          Criteria Breakdown
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {selectedLead.criteriaEvaluation.length} evaluated
                        </span>
                      </div>

                      <div className="space-y-2 pt-0.5">
                        {selectedLead.criteriaEvaluation.map((item, idx) => {
                          const isMet = item.result === 'met';
                          const isNotMet = item.result === 'not_met';
                          const isUncertain = item.result === 'uncertain';

                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                                isMet
                                  ? 'bg-emerald-50/50 border-emerald-200/70 text-emerald-950'
                                  : isNotMet
                                  ? 'bg-rose-50/50 border-rose-200/70 text-rose-950'
                                  : isUncertain
                                  ? 'bg-amber-50/50 border-amber-200/70 text-amber-950'
                                  : 'bg-zinc-50 border-zinc-200/70 text-zinc-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs">{item.criterion}</span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono ${
                                    isMet
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isNotMet
                                      ? 'bg-rose-100 text-rose-800'
                                      : isUncertain
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-zinc-200 text-zinc-700'
                                  }`}
                                >
                                  {isMet
                                    ? '✓ Met'
                                    : isNotMet
                                    ? '✕ Not Met'
                                    : isUncertain
                                    ? '? Uncertain'
                                    : '— N/A'}
                                </span>
                              </div>
                              <p className="text-[11px] opacity-90 leading-relaxed">{item.evidence}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Qualification Sources */}
                  {selectedLead.qualificationSources && selectedLead.qualificationSources.length > 0 && (
                    <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                      <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                        Qualification Sources
                      </span>
                      <div className="space-y-1.5">
                        {selectedLead.qualificationSources.map((src, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/80 border border-zinc-100 text-xs"
                          >
                            <span className="font-medium text-zinc-800 truncate">{src.title}</span>
                            {src.url ? (
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 shrink-0 ml-2 text-[11px]"
                              >
                                <span>Open Source</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Web Research Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  AI Web Research
                </h3>
                <div className="flex items-center gap-2">
                  <ResearchStatusBadge status={selectedLead.researchStatus || 'Not researched'} />
                  {selectedLead.researchedAt && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(selectedLead.researchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Research Failure Banner */}
              {selectedLead.researchStatus === 'Research failed' && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-950">Research could not be completed for this lead.</p>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        {selectedLead.researchError || 'The public online research service encountered an issue while retrieving listings for this business.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResearchLead(true)}
                    disabled={researchLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-white font-semibold text-xs transition-colors shadow-2xs"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${researchLoading ? 'animate-spin' : ''}`} />
                    <span>Retry Research</span>
                  </button>
                </div>
              )}

              {/* Researching in progress banner */}
              {selectedLead.researchStatus === 'Researching' && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  <span>Researching public web presence, website, and criteria evidence with Gemini...</span>
                </div>
              )}

              {/* Already Researched Banner with Refresh Research action */}
              {selectedLead.researchStatus === 'Researched' && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Already researched</span>
                    {selectedLead.researchedAt && (
                      <span className="text-[11px] text-emerald-700 font-normal hidden sm:inline">
                        · {new Date(selectedLead.researchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleResearchLead(true)}
                    disabled={researchLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs border border-zinc-200 shadow-2xs transition-colors"
                    title="Intentionally perform new research"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 text-zinc-600 ${researchLoading ? 'animate-spin' : ''}`} />
                    <span>{researchLoading ? 'Refreshing...' : 'Refresh Research'}</span>
                  </button>
                </div>
              )}

              {/* Not Researched Banner */}
              {selectedLead.researchStatus === 'Not researched' && (
                <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/80 space-y-3 text-xs text-center">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500">
                    <Globe className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-800">Public web presence not researched yet</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto mt-0.5">
                      Analyze this business&apos;s website, public search footprint, and criteria evidence with Gemini Google Search grounding.
                    </p>
                  </div>
                  <button
                    onClick={() => handleResearchLead(false)}
                    disabled={researchLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{researchLoading ? 'Researching...' : 'Research Lead'}</span>
                  </button>
                </div>
              )}

              {/* Researched or Populated Findings */}
              {(selectedLead.researchStatus === 'Researched' ||
                selectedLead.businessSummary ||
                (selectedLead.researchSources && selectedLead.researchSources.length > 0)) && (
                <div className="space-y-3.5">
                  {/* 1. Business Summary Card */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-zinc-600" />
                        Business Summary
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Factual synthesis</span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed font-normal bg-zinc-50/80 p-3 rounded-lg border border-zinc-100">
                      {selectedLead.businessSummary || 'Unable to determine'}
                    </p>
                  </div>

                  {/* 2. Services Card */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-zinc-600" />
                        Services Offered
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {selectedLead.services?.length || 0} discovered
                      </span>
                    </div>
                    {selectedLead.services && selectedLead.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {selectedLead.services.map((svc, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-200/60"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {svc}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">Unable to determine specific services</p>
                    )}
                  </div>

                  {/* 3. Website Analysis Card */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        Website Presence
                      </span>
                      <WebsiteStatusBadge status={selectedLead.websiteStatus} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 space-y-1">
                        <span className="text-[11px] text-zinc-400 font-medium">Domain / URL</span>
                        {selectedLead.website ? (
                          <a
                            href={selectedLead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                          >
                            <span className="truncate">{selectedLead.website}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <p className="text-zinc-500 italic">No website found</p>
                        )}
                      </div>

                      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 space-y-1">
                        <span className="text-[11px] text-zinc-400 font-medium">Website Title</span>
                        <p className="font-medium text-zinc-800 truncate">
                          {selectedLead.websiteTitle || (selectedLead.website ? 'Unable to determine' : 'No website found')}
                        </p>
                      </div>
                    </div>

                    {selectedLead.websiteDescription && (
                      <div className="text-xs space-y-1">
                        <span className="text-[11px] font-semibold text-zinc-500">Website Description:</span>
                        <p className="text-zinc-700 bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-100 leading-relaxed">
                          {selectedLead.websiteDescription}
                        </p>
                      </div>
                    )}

                    {/* Discovered Pages */}
                    {selectedLead.websitePages && selectedLead.websitePages.length > 0 && (
                      <div className="space-y-1.5 pt-1 text-xs">
                        <span className="text-[11px] font-semibold text-zinc-500">Important Pages Discovered:</span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {selectedLead.websitePages.map((page, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/70 border border-zinc-100 text-[11px]"
                            >
                              <span className="font-medium text-zinc-800">{page.title}</span>
                              {page.url ? (
                                <a
                                  href={page.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                                >
                                  <span className="truncate">{page.url}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-zinc-400 italic">{page.note || 'Reviewed'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observable Checklist Matrix */}
                    {selectedLead.structuredFindings?.checklist && (
                      <div className="space-y-2 pt-2 border-t border-zinc-100">
                        <span className="text-[11px] font-semibold text-zinc-700 block">
                          Website Observations Matrix:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                          {[
                            { label: 'Website exists', val: selectedLead.structuredFindings.checklist.websiteExists },
                            { label: 'Appears active', val: selectedLead.structuredFindings.checklist.websiteAppearsActive },
                            { label: 'Clear services', val: selectedLead.structuredFindings.checklist.clearServiceInformation },
                            { label: 'Visible contact', val: selectedLead.structuredFindings.checklist.visibleContactInformation },
                            { label: 'Visible CTA', val: selectedLead.structuredFindings.checklist.visibleCallToAction },
                            { label: 'Mobile friendly', val: selectedLead.structuredFindings.checklist.mobileFriendlyAssessment },
                          ].map((item, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 flex flex-col justify-between">
                              <span className="text-zinc-500 text-[10px]">{item.label}</span>
                              <span
                                className={`font-semibold mt-0.5 ${
                                  item.val === 'Yes'
                                    ? 'text-emerald-700'
                                    : item.val === 'No'
                                    ? 'text-rose-700'
                                    : 'text-zinc-500'
                                }`}
                              >
                                {item.val || 'Unable to determine'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {selectedLead.structuredFindings.checklist.outdatedSignals &&
                          selectedLead.structuredFindings.checklist.outdatedSignals.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] text-zinc-500 font-semibold block">Observed Outdated Signals:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedLead.structuredFindings.checklist.outdatedSignals.map((sig, idx) => (
                                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    {sig}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  {/* 4. Verified Sourced Findings VS AI Assessment (Requirement #8) */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <div>
                        <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] block">
                          Website Findings & Evidence
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Clear distinction between verified facts and AI interpretations
                        </span>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>

                    {/* Sourced Observations */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified / Sourced Information</span>
                        <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                          Directly supported by source
                        </span>
                      </div>
                      <div className="space-y-1 pl-5">
                        {selectedLead.structuredFindings?.observations &&
                        selectedLead.structuredFindings.observations.length > 0 ? (
                          selectedLead.structuredFindings.observations.map((obs, idx) => (
                            <div key={idx} className="text-xs text-zinc-700 leading-relaxed flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                              <span>{obs}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-zinc-500 italic">
                            {selectedLead.websiteFindings || 'No specific sourced observation recorded.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* AI Assessment */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>AI Assessment</span>
                        <span className="text-[10px] font-normal text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60">
                          Interpretation based on observed information
                        </span>
                      </div>
                      <div className="space-y-1 pl-5">
                        {selectedLead.structuredFindings?.aiAssessments &&
                        selectedLead.structuredFindings.aiAssessments.length > 0 ? (
                          selectedLead.structuredFindings.aiAssessments.map((assess, idx) => (
                            <div key={idx} className="text-xs text-zinc-700 leading-relaxed flex items-start gap-1.5">
                              <span className="text-purple-500 font-bold shrink-0 mt-0.5">•</span>
                              <span>{assess}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-zinc-500 italic">No AI assessments recorded.</p>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-zinc-50 rounded-lg text-[11px] text-zinc-500 border border-zinc-100 italic">
                      Note: AI assessments are analytical interpretations based on observed information and are never presented as certified technical audits.
                    </div>
                  </div>

                  {/* 5. Criteria Evidence Card */}
                  {selectedLead.criteriaEvidence && (
                    <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-1.5">
                      <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Search Criteria Evidence
                      </span>
                      <p className="text-xs text-zinc-700 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 leading-relaxed">
                        {selectedLead.criteriaEvidence}
                      </p>
                    </div>
                  )}

                  {/* 6. Sources Card (Requirement #6) */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-100">
                      <div>
                        <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-700" />
                          Research Sources
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {selectedLead.researchSources?.length || 0} public references tracked
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Verified links</span>
                    </div>

                    {selectedLead.researchSources && selectedLead.researchSources.length > 0 ? (
                      <div className="space-y-2">
                        {selectedLead.researchSources.map((source, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-zinc-50/80 hover:bg-zinc-100/70 border border-zinc-200/80 transition-colors space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-semibold text-xs text-zinc-900 truncate">
                                    {source.title}
                                  </h5>
                                  <span
                                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase ${
                                      source.sourceType === 'official_website'
                                        ? 'bg-blue-100 text-blue-800'
                                        : source.sourceType === 'google_search'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    {source.sourceType.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{source.relevance}</p>
                              </div>

                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[28px] px-2.5 py-1 text-xs font-semibold rounded-md bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-2xs inline-flex items-center gap-1 shrink-0 transition-colors"
                                title="Open source safely in new browser tab"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3 text-zinc-500" />
                              </a>
                            </div>

                            <p className="text-[10px] font-mono text-zinc-400 truncate max-w-full">
                              {source.url}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic py-2 text-center">
                        No sources recorded yet. Click &quot;Research Lead&quot; to discover web presence.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Contact Enrichment & Public Channels Section (Step 5) */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    Public Contact Enrichment
                  </h3>
                  <ContactStatusBadge status={selectedLead.contactEnrichmentStatus} size="sm" />
                </div>

                <div className="flex items-center gap-2">
                  {selectedLead.enrichedAt && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {new Date(selectedLead.enrichedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}

                  {/* Enrich / Re-enrich Button */}
                  {selectedLead.contactEnrichmentStatus === 'Enriching' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                      <span>Enriching Contacts...</span>
                    </span>
                  ) : selectedLead.contactEnrichmentStatus === 'Enriched' || selectedLead.contactEnrichmentStatus === 'Partial' ? (
                    <button
                      onClick={handleEnrichLead}
                      disabled={enrichLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-2xs transition-colors"
                      title="Re-enrich contact channels from public web sources"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${enrichLoading ? 'animate-spin' : ''}`} />
                      <span>{enrichLoading ? 'Enriching...' : 'Re-enrich Contacts'}</span>
                    </button>
                  ) : selectedLead.contactEnrichmentStatus === 'Enrichment Failed' ? (
                    <button
                      onClick={handleEnrichLead}
                      disabled={enrichLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-900 hover:bg-rose-800 text-white shadow-xs transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${enrichLoading ? 'animate-spin' : ''}`} />
                      <span>{enrichLoading ? 'Retrying...' : 'Retry Enrichment'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleEnrichLead}
                      disabled={enrichLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors disabled:opacity-50"
                      title="Enrich public B2B contact details with Gemini"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                      <span>{enrichLoading ? 'Enriching...' : 'Enrich Contacts'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Enrichment Failed Banner */}
              {selectedLead.contactEnrichmentStatus === 'Enrichment Failed' && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-950">Contact enrichment could not be completed.</p>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        {selectedLead.enrichmentError || 'Encountered an issue verifying public business contact channels.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Contact Channels Card */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-4 text-xs">
                {/* 1. Public Business Email */}
                <div className="space-y-1.5 pb-3 border-b border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-600" />
                      Primary Business Email
                    </span>
                    <div className="flex items-center gap-1.5">
                      <EmailStatusBadge
                        status={selectedLead.businessEmail?.status || (selectedLead.email ? 'Found' : 'Not Found')}
                        emailValue={selectedLead.businessEmail?.value || selectedLead.email}
                      />
                      {selectedLead.businessEmail?.confidence && (
                        <ConfidenceBadge confidence={selectedLead.businessEmail.confidence} size="sm" />
                      )}
                    </div>
                  </div>

                  {selectedLead.businessEmail?.value || selectedLead.email ? (
                    <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/70">
                      <span className="font-mono font-bold text-zinc-900 text-xs truncate">
                        {selectedLead.businessEmail?.value || selectedLead.email}
                      </span>
                      <button
                        onClick={() => {
                          const em = selectedLead.businessEmail?.value || selectedLead.email || '';
                          navigator.clipboard.writeText(em);
                          setCopiedEmail(true);
                          setTimeout(() => setCopiedEmail(false), 2000);
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded shadow-2xs flex items-center gap-1 transition-colors shrink-0 ml-2"
                        title="Copy email to clipboard"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-zinc-50/70 rounded-lg border border-zinc-100 text-zinc-500 italic text-[11px]">
                      {selectedLead.businessEmail?.status === 'Unable to Determine'
                        ? 'Unable to determine public email from available online listings.'
                        : 'No public business email address was found in official sources.'}
                    </div>
                  )}

                  {/* Email Source Citation & Disclosure */}
                  {selectedLead.businessEmail?.source && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                      <span className="truncate">
                        Source: <span className="font-medium text-zinc-700">{selectedLead.businessEmail.source.title}</span>
                      </span>
                      {selectedLead.businessEmail.source.url && (
                        <a
                          href={selectedLead.businessEmail.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 shrink-0 ml-2"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-400 italic">
                    Publicly listed on official business channels. Deliverability is not certified.
                  </p>
                </div>

                {/* 2. Business Phone Line */}
                <div className="space-y-1.5 pb-3 border-b border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-600" />
                      Business Phone Line
                    </span>
                    {selectedLead.businessPhone?.confidence && (
                      <ConfidenceBadge confidence={selectedLead.businessPhone.confidence} size="sm" />
                    )}
                  </div>

                  {selectedLead.phone && selectedLead.phone !== 'Not available' ? (
                    <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/70">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <a
                          href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`}
                          className="font-mono font-bold text-zinc-900 text-xs hover:text-blue-600 transition-colors"
                        >
                          {selectedLead.phone}
                        </a>
                      </div>
                      <a
                        href={`tel:${selectedLead.phone.replace(/[^0-9+]/g, '')}`}
                        className="px-2.5 py-1 text-[11px] font-semibold text-zinc-800 bg-white border border-zinc-200 rounded shadow-2xs hover:bg-zinc-100 transition-colors inline-flex items-center gap-1 shrink-0"
                      >
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>Call</span>
                      </a>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-zinc-50/70 rounded-lg border border-zinc-100 text-zinc-500 italic text-[11px]">
                      No telephone line recorded.
                    </div>
                  )}

                  {selectedLead.businessPhone?.source && (
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                      <span className="truncate">
                        Source: <span className="font-medium text-zinc-700">{selectedLead.businessPhone.source.title}</span>
                      </span>
                      {selectedLead.businessPhone.source.url && (
                        <a
                          href={selectedLead.businessPhone.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 shrink-0 ml-2"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Official Contact & Intake Page */}
                <div className="space-y-1.5 pb-3 border-b border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-zinc-600" />
                      Official Contact / Inquiry Page
                    </span>
                  </div>

                  {selectedLead.enrichedContactPage?.url || selectedLead.contactPage ? (
                    <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/70">
                      <span className="font-medium text-zinc-800 truncate text-xs">
                        {selectedLead.enrichedContactPage?.title || 'Contact Page'}
                      </span>
                      <a
                        href={selectedLead.enrichedContactPage?.url || selectedLead.contactPage || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white border border-zinc-200 rounded shadow-2xs hover:bg-zinc-50 transition-colors inline-flex items-center gap-1 shrink-0 ml-2"
                      >
                        <span>Visit Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-zinc-50/70 rounded-lg border border-zinc-100 text-zinc-500 italic text-[11px]">
                      No dedicated contact page URL observed.
                    </div>
                  )}
                </div>

                {/* 4. Official Business Social Profiles */}
                <div className="space-y-2 pb-3 border-b border-zinc-100">
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-zinc-600" />
                    Official Business Social Profiles
                  </span>

                  {selectedLead.enrichedSocialLinks && selectedLead.enrichedSocialLinks.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedLead.enrichedSocialLinks.map((item, idx) => (
                        <a
                          key={idx}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/70 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {item.platform.toLowerCase().includes('facebook') ? (
                              <Facebook className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            ) : item.platform.toLowerCase().includes('linkedin') ? (
                              <Linkedin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            ) : item.platform.toLowerCase().includes('instagram') ? (
                              <Instagram className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                            ) : item.platform.toLowerCase().includes('twitter') || item.platform.toLowerCase().includes('x') ? (
                              <Twitter className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                            ) : (
                              <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            )}
                            <span className="font-semibold text-zinc-800 truncate">{item.platform}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="text-[10px] text-zinc-400 font-mono">{item.confidence}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-400" />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : Object.values(selectedLead.socialLinks).some(Boolean) ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedLead.socialLinks.linkedin && (
                        <a
                          href={selectedLead.socialLinks.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center gap-1.5 text-xs font-medium"
                        >
                          <Linkedin className="w-3.5 h-3.5 text-blue-700" />
                          <span>LinkedIn</span>
                          <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                        </a>
                      )}
                      {selectedLead.socialLinks.facebook && (
                        <a
                          href={selectedLead.socialLinks.facebook}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center gap-1.5 text-xs font-medium"
                        >
                          <Facebook className="w-3.5 h-3.5 text-blue-600" />
                          <span>Facebook</span>
                          <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                        </a>
                      )}
                      {selectedLead.socialLinks.twitter && (
                        <a
                          href={selectedLead.socialLinks.twitter}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center gap-1.5 text-xs font-medium"
                        >
                          <Twitter className="w-3.5 h-3.5 text-zinc-900" />
                          <span>Twitter</span>
                          <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                        </a>
                      )}
                      {selectedLead.socialLinks.instagram && (
                        <a
                          href={selectedLead.socialLinks.instagram}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 flex items-center gap-1.5 text-xs font-medium"
                        >
                          <Instagram className="w-3.5 h-3.5 text-pink-600" />
                          <span>Instagram</span>
                          <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-zinc-500 italic text-[11px] p-2 bg-zinc-50/70 rounded-lg border border-zinc-100">
                      No official social media profiles identified in public sources.
                    </p>
                  )}
                </div>

                {/* 5. Public Decision-Maker (Optional B2B Info) */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-600" />
                    Public Business Decision-Maker
                  </span>

                  {selectedLead.publicBusinessContact?.name ? (
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-950">
                          {selectedLead.publicBusinessContact.name}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                          {selectedLead.publicBusinessContact.role || 'Leadership'}
                        </span>
                      </div>
                      {selectedLead.publicBusinessContact.source && (
                        <p className="text-[11px] text-purple-800/80">
                          Published on: {selectedLead.publicBusinessContact.source}
                        </p>
                      )}
                      <p className="text-[10px] text-purple-700/70 italic pt-1">
                        Public professional title published on company website. Private records are never scraped.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-zinc-50/70 rounded-lg border border-zinc-100 text-zinc-500 italic text-[11px]">
                      No individual business-facing owner or executive was published on available public pages.
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Sources List */}
              {selectedLead.contactSources && selectedLead.contactSources.length > 0 && (
                <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2">
                  <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                    Contact Enrichment Sources
                  </span>
                  <div className="space-y-1.5">
                    {selectedLead.contactSources.map((src, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/80 border border-zinc-100 text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-medium text-zinc-800 truncate block">{src.title}</span>
                          {src.relevance && (
                            <span className="text-[10px] text-zinc-400 truncate block">{src.relevance}</span>
                          )}
                        </div>
                        {src.url ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 shrink-0 text-[11px]"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Outreach Section */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI Outreach Engine
                  </h3>
                  <span className="text-[10px] text-zinc-400">Personalized to findings & verified channels</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedLeadId(selectedLead.id);
                    setCurrentTab('outreach');
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5"
                  title="Open full AI Outreach Workspace for multi-option generation, channel switching, and custom offers"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open Full Workspace</span>
                </button>
              </div>

              {/* Outreach Generation Tabs */}
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
                <button
                  onClick={() => handleTabSwitch('email')}
                  className={`flex-1 py-1.5 px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    activeOutreachTab === 'email'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Cold Email</span>
                </button>
                <button
                  onClick={() => handleTabSwitch('dm')}
                  className={`flex-1 py-1.5 px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    activeOutreachTab === 'dm'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">SMS / DM</span>
                </button>
                <button
                  onClick={() => handleTabSwitch('followup')}
                  className={`flex-1 py-1.5 px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                    activeOutreachTab === 'followup'
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Follow-up</span>
                </button>
              </div>

              {/* Outreach Box */}
              <div className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 bg-white space-y-3">
                {/* Actions Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100">
                  <span className="text-xs font-semibold text-zinc-700">
                    {activeOutreachTab === 'email'
                      ? 'Email Pitch Template'
                      : activeOutreachTab === 'dm'
                      ? 'Short-form DM Pitch'
                      : 'Follow-up Email (Day 3)'}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {/* Edit Button */}
                    {isEditing ? (
                      <button
                        onClick={handleSaveEdit}
                        className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Regenerate Button */}
                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-zinc-400 ${
                          isRegenerating ? 'animate-spin' : ''
                        }`}
                      />
                      <span>Regenerate</span>
                    </button>
                  </div>
                </div>

                {/* Display / Edit View */}
                {isEditing ? (
                  <div className="space-y-3">
                    {activeOutreachTab !== 'dm' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-zinc-500 uppercase">
                            Subject Line
                          </label>
                          <SpeechToTextButton
                            onTranscript={(text) => setSubjectDraft(text)}
                            currentValue={subjectDraft}
                            size="xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={subjectDraft}
                          onChange={(e) => setSubjectDraft(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase">
                          Body Text
                        </label>
                        <SpeechToTextButton
                          onTranscript={(text) => setBodyDraft(text)}
                          currentValue={bodyDraft}
                          size="xs"
                          variant="pill"
                          label="Dictate"
                        />
                      </div>
                      <div className="relative">
                        <textarea
                          rows={7}
                          value={bodyDraft}
                          onChange={(e) => setBodyDraft(e.target.value)}
                          className="w-full px-3 py-2 pr-9 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 font-sans leading-relaxed"
                        />
                        <div className="absolute right-2.5 bottom-2.5">
                          <SpeechToTextButton
                            onTranscript={(text) => setBodyDraft(text)}
                            currentValue={bodyDraft}
                            size="xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {activeOutreachTab === 'email' && (
                      <>
                        {selectedLead.outreachEmail ? (
                          <>
                            <div className="p-2 bg-zinc-50 rounded border border-zinc-100">
                              <span className="font-semibold text-zinc-500">Subject: </span>
                              <span className="font-medium text-zinc-900">
                                {selectedLead.outreachEmail.subject}
                              </span>
                            </div>
                            <div className="p-3 bg-zinc-50/50 rounded border border-zinc-100 whitespace-pre-line text-zinc-700 leading-relaxed font-sans">
                              {selectedLead.outreachEmail.body}
                            </div>
                          </>
                        ) : (
                          <p className="text-zinc-400 italic py-4 text-center">
                            No email outreach template generated for this lead.
                          </p>
                        )}
                      </>
                    )}

                    {activeOutreachTab === 'dm' && (
                      <>
                        {selectedLead.outreachDm ? (
                          <div className="p-3 bg-zinc-50/50 rounded border border-zinc-100 whitespace-pre-line text-zinc-700 leading-relaxed font-sans">
                            {selectedLead.outreachDm}
                          </div>
                        ) : (
                          <p className="text-zinc-400 italic py-4 text-center">
                            No DM outreach template generated.
                          </p>
                        )}
                      </>
                    )}

                    {activeOutreachTab === 'followup' && (
                      <>
                        {selectedLead.outreachFollowUp ? (
                          <>
                            <div className="p-2 bg-zinc-50 rounded border border-zinc-100">
                              <span className="font-semibold text-zinc-500">Subject: </span>
                              <span className="font-medium text-zinc-900">
                                {selectedLead.outreachFollowUp.subject}
                              </span>
                            </div>
                            <div className="p-3 bg-zinc-50/50 rounded border border-zinc-100 whitespace-pre-line text-zinc-700 leading-relaxed font-sans">
                              {selectedLead.outreachFollowUp.body}
                            </div>
                          </>
                        ) : (
                          <p className="text-zinc-400 italic py-4 text-center">
                            No follow-up template generated.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
            <span>
              {dataSourceMode === 'real'
                ? 'Verified prospect • Persistent record'
                : 'Simulated business lead • Demo mode'}
            </span>

            <div className="flex items-center gap-2">
              {/* Archive / Restore Button */}
              {selectedLead.isArchived ? (
                <button
                  type="button"
                  onClick={() => restoreLead(selectedLead.id)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors flex items-center gap-1"
                >
                  <ArchiveRestore className="w-3.5 h-3.5" />
                  <span>Restore Lead</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => archiveLead(selectedLead.id)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive Lead</span>
                </button>
              )}

              {/* Delete Lead Button */}
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => setSelectedLeadId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Lead Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-zinc-900">
                  Delete "{selectedLead.businessName}"?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Are you sure you want to permanently remove this lead from persistent storage?
                </p>
              </div>
            </div>

            <p className="text-[11px] text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
              This will remove all research evidence, contact details, notes, and saved outreach drafts for this business.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteLead(selectedLead.id);
                  setDeleteConfirmOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
