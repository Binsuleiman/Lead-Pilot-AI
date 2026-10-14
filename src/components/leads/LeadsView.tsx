import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeadStatusBadge } from '../common/LeadStatusBadge';
import { WebsiteStatusBadge } from '../common/WebsiteStatusBadge';
import { ResearchStatusBadge } from '../common/ResearchStatusBadge';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { ContactStatusBadge } from '../common/ContactStatusBadge';
import { EmailStatusBadge } from '../common/EmailStatusBadge';
import { EmptyState } from '../common/EmptyState';
import {
  QualificationStatus,
  QualificationConfidence,
  WebsiteStatus,
  ResearchStatus,
  ContactEnrichmentStatus,
  EmailStatus,
  Lead,
} from '../../types';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  Phone,
  CheckSquare,
  Square,
  Sparkles,
  MapPin,
  X,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Star,
  ArrowRight,
  Loader2,
  RotateCcw,
  CheckCircle2,
  UserCheck,
  Mail,
  Send,
  Tag,
  Archive,
  ArchiveRestore,
  Trash2,
  FileText,
  AlertTriangle,
  Check,
  Plus,
  ArrowUpDown,
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

export const LeadsView: React.FC = () => {
  const {
    leads,
    searches,
    activeSearchId,
    setActiveSearchId,
    setSelectedLeadId,
    searchQuery,
    setSearchQuery,
    qualificationFilter,
    setQualificationFilter,
    confidenceFilter,
    setConfidenceFilter,
    websiteFilter,
    setWebsiteFilter,
    researchFilter,
    setResearchFilter,
    emailFilter,
    setEmailFilter,
    contactFilter,
    setContactFilter,
    selectedLeadIds,
    toggleSelectLead,
    selectAllLeads,
    clearSelection,
    exportCsv,
    setCurrentTab,
    dataSourceMode,
    researchAllLeads,
    isBatchResearching,
    batchResearchProgress,
    qualifyAllLeads,
    isBatchQualifying,
    batchQualifyProgress,
    enrichAllLeads,
    enrichLead,
    isBatchEnriching,
    batchEnrichProgress,
    isBatchOutreachGenerating,
    batchOutreachProgress,
    archiveFilter,
    setArchiveFilter,
    categoryFilter,
    setCategoryFilter,
    locationFilter,
    setLocationFilter,
    outreachDraftFilter,
    setOutreachDraftFilter,
    tagFilter,
    setTagFilter,
    sortBy,
    setSortBy,
    resetAllFilters,
    archiveLead,
    restoreLead,
    deleteLead,
    bulkArchiveLeads,
    bulkRestoreLeads,
    bulkDeleteLeads,
    bulkAddTag,
    addLeadTag,
    removeLeadTag,
  } = useApp();

  // View mode toggle: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals state
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');

  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [singleDeleteLead, setSingleDeleteLead] = useState<Lead | null>(null);

  const [quickTagLeadId, setQuickTagLeadId] = useState<string | null>(null);
  const [quickTagInput, setQuickTagInput] = useState('');

  // Active search info if filtered by mission
  const activeSearch = searches.find((s) => s.id === activeSearchId);

  // Available unique categories and tags across all leads in database
  const availableCategories = Array.from(
    new Set(leads.map((l) => l.category).filter(Boolean))
  ).sort();

  const availableTags = Array.from(
    new Set(leads.flatMap((l) => (Array.isArray(l.tags) ? l.tags : [])).filter(Boolean))
  ).sort();

  // Counts for top archive tabs
  const activeLeadsCount = leads.filter((l) => !l.isArchived).length;
  const archivedLeadsCount = leads.filter((l) => l.isArchived).length;
  const totalLeadsCount = leads.length;

  // Filter leads dynamically
  const filteredLeads = leads
    .filter((lead) => {
      // 1. Archive filter
      if (archiveFilter === 'active' && lead.isArchived) return false;
      if (archiveFilter === 'archived' && !lead.isArchived) return false;

      // 2. Active search filter
      if (activeSearchId) {
        const belongs =
          lead.searchId === activeSearchId ||
          (Array.isArray(lead.searchIds) && lead.searchIds.includes(activeSearchId));
        if (!belongs) return false;
      }

      // 3. Status filters
      if (qualificationFilter !== 'All' && lead.qualificationStatus !== qualificationFilter) return false;
      if (confidenceFilter !== 'All' && lead.qualificationConfidence !== confidenceFilter) return false;
      if (websiteFilter !== 'All' && lead.websiteStatus !== websiteFilter) return false;
      if (researchFilter !== 'All' && (lead.researchStatus || 'Not researched') !== researchFilter) return false;
      if (emailFilter !== 'All') {
        const emailStatus = lead.businessEmail?.status || (lead.email ? 'Found' : 'Not Found');
        if (emailStatus !== emailFilter) return false;
      }
      if (contactFilter !== 'All') {
        const contactStatus = lead.contactEnrichmentStatus || 'Not Enriched';
        if (contactStatus !== contactFilter) return false;
      }

      // 4. Category filter
      if (categoryFilter !== 'All' && lead.category !== categoryFilter) return false;

      // 5. Location filter
      if (locationFilter.trim()) {
        const locQ = locationFilter.toLowerCase();
        if (!lead.address.toLowerCase().includes(locQ)) return false;
      }

      // 6. Outreach Draft filter
      if (outreachDraftFilter === 'Has Draft') {
        if (!Array.isArray(lead.outreachDrafts) || lead.outreachDrafts.length === 0) return false;
      } else if (outreachDraftFilter === 'No Draft') {
        if (Array.isArray(lead.outreachDrafts) && lead.outreachDrafts.length > 0) return false;
      }

      // 7. Tag filter
      if (tagFilter !== 'All') {
        if (!Array.isArray(lead.tags) || !lead.tags.includes(tagFilter)) return false;
      }

      // 8. Search keywords
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.businessName.toLowerCase().includes(q);
        const matchesLocation = lead.address.toLowerCase().includes(q);
        const matchesCategory = lead.category.toLowerCase().includes(q);
        const matchesPhone = lead.phone.toLowerCase().includes(q);
        const matchesNotes = typeof lead.notes === 'string' && lead.notes.toLowerCase().includes(q);
        const matchesTags = Array.isArray(lead.tags) && lead.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesLocation && !matchesCategory && !matchesPhone && !matchesNotes && !matchesTags) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.businessName.localeCompare(b.businessName);
      }
      if (sortBy === 'name_desc') {
        return b.businessName.localeCompare(a.businessName);
      }
      if (sortBy === 'rating_desc') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'reviews_desc') {
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      }
      if (sortBy === 'qualification') {
        const priority: Record<string, number> = {
          Qualified: 1,
          Potential: 2,
          Researching: 3,
          'Not a match': 4,
          'Qualification Failed': 5,
        };
        const pA = priority[a.qualificationStatus] || 99;
        const pB = priority[b.qualificationStatus] || 99;
        return pA - pB;
      }
      // Default: updated_desc
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

  const allFilteredSelected =
    filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l.id));

  const handleSelectAllChange = () => {
    selectAllLeads(!allFilteredSelected);
  };

  const handleApplyBulkTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    bulkAddTag(selectedLeadIds, clean);
    setBulkTagModalOpen(false);
    setBulkTagInput('');
  };

  const handleQuickAddTag = (leadId: string) => {
    const clean = quickTagInput.trim();
    if (clean) {
      addLeadTag(leadId, clean);
    }
    setQuickTagLeadId(null);
    setQuickTagInput('');
  };

  const isAnyFilterActive =
    qualificationFilter !== 'All' ||
    confidenceFilter !== 'All' ||
    websiteFilter !== 'All' ||
    researchFilter !== 'All' ||
    emailFilter !== 'All' ||
    contactFilter !== 'All' ||
    categoryFilter !== 'All' ||
    locationFilter.trim() !== '' ||
    outreachDraftFilter !== 'All' ||
    tagFilter !== 'All' ||
    archiveFilter !== 'active' ||
    searchQuery.trim() !== '' ||
    Boolean(activeSearchId);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Context Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Leads Database</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            </span>
            {dataSourceMode === 'real' ? (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Real Data
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Demo Mode — sample businesses
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Organize, qualify, enrich, tag, note, and prepare personalized outreach for discovered business prospects.
          </p>
        </div>

        {/* Action Buttons & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Card View (Touch Optimized)"
              className={`p-1.5 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                viewMode === 'cards'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-md transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Research All Leads Button */}
          <button
            onClick={() => researchAllLeads(activeSearchId || undefined)}
            disabled={isBatchResearching || isBatchQualifying || filteredLeads.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-900 bg-amber-300 hover:bg-amber-400 border border-amber-400/80 rounded-lg shadow-2xs transition-colors disabled:opacity-50 min-h-[36px]"
            title="Research all discovered leads with Gemini Google Search grounding"
          >
            {isBatchResearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-900" />
                <span>
                  Researching ({batchResearchProgress.completed}/{batchResearchProgress.total})...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                <span>Research All</span>
              </>
            )}
          </button>

          {/* Qualify All Button */}
          <button
            onClick={() => qualifyAllLeads(activeSearchId || undefined)}
            disabled={
              isBatchQualifying ||
              isBatchResearching ||
              isBatchEnriching ||
              filteredLeads.filter((l) => l.researchStatus === 'Researched' || !!l.businessSummary).length === 0
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-700/80 rounded-lg shadow-2xs transition-colors disabled:opacity-50 min-h-[36px]"
            title="Evaluate all researched leads against your search criteria with Gemini AI"
          >
            {isBatchQualifying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>
                  Qualifying ({batchQualifyProgress.completed}/{batchQualifyProgress.total})...
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Qualify All</span>
              </>
            )}
          </button>

          {/* Enrich All Button */}
          <button
            onClick={() => enrichAllLeads(activeSearchId || undefined)}
            disabled={
              isBatchEnriching ||
              isBatchQualifying ||
              isBatchResearching ||
              filteredLeads.length === 0
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 border border-purple-700/80 rounded-lg shadow-2xs transition-colors disabled:opacity-50 min-h-[36px]"
            title="Enrich all leads with public business contact details"
          >
            {isBatchEnriching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>
                  Enriching ({batchEnrichProgress.completed}/{batchEnrichProgress.total})...
                </span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-purple-200" />
                <span>Enrich All</span>
              </>
            )}
          </button>

          {/* Outreach Workspace Button */}
          <button
            onClick={() => {
              if (selectedLeadIds.length > 0) {
                setSelectedLeadId(selectedLeadIds[0]);
              }
              setCurrentTab('outreach');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors min-h-[36px]"
            title="Open AI Outreach Workspace"
          >
            <Send className="w-3.5 h-3.5 text-indigo-200" />
            <span>Outreach</span>
          </button>

          {/* New Search Button */}
          <button
            onClick={() => setCurrentTab('new-search')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors min-h-[36px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span>New Search</span>
          </button>
        </div>
      </div>

      {/* Archive / Active Tabs Row */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setArchiveFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              archiveFilter === 'active'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <span>Active Leads</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                archiveFilter === 'active' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {activeLeadsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setArchiveFilter('archived')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              archiveFilter === 'archived'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                archiveFilter === 'archived' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {archivedLeadsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setArchiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              archiveFilter === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <span>All Leads</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                archiveFilter === 'all' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {totalLeadsCount}
            </span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 font-medium text-[11px] hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-2xs font-medium"
          >
            <option value="updated_desc">Recently Updated</option>
            <option value="name_asc">Business Name (A-Z)</option>
            <option value="name_desc">Business Name (Z-A)</option>
            <option value="qualification">Qualification (Qualified First)</option>
            <option value="rating_desc">Highest Rating</option>
            <option value="reviews_desc">Most Reviews</option>
          </select>
        </div>
      </div>

      {/* Batch Progress Banners */}
      {isBatchResearching && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
              <span>
                Researching business web presence ({batchResearchProgress.completed} of{' '}
                {batchResearchProgress.total} completed)
              </span>
            </span>
            <span className="font-mono text-[11px] text-amber-800 font-bold">
              {Math.round(
                (batchResearchProgress.completed / (batchResearchProgress.total || 1)) * 100
              )}
              %
            </span>
          </div>
          {batchResearchProgress.currentLeadName && (
            <p className="text-[11px] text-amber-800 truncate">
              Currently analyzing: <span className="font-semibold">{batchResearchProgress.currentLeadName}</span>
            </p>
          )}
          <div className="w-full bg-amber-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(
                  (batchResearchProgress.completed / (batchResearchProgress.total || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {isBatchQualifying && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              <span>
                Qualifying leads against criteria ({batchQualifyProgress.completed} of{' '}
                {batchQualifyProgress.total} completed)
              </span>
            </span>
            <span className="font-mono text-[11px] text-emerald-800 font-bold">
              {Math.round(
                (batchQualifyProgress.completed / (batchQualifyProgress.total || 1)) * 100
              )}
              %
            </span>
          </div>
          {batchQualifyProgress.currentLeadName && (
            <p className="text-[11px] text-emerald-800 truncate">
              Evaluating evidence for: <span className="font-semibold">{batchQualifyProgress.currentLeadName}</span>
            </p>
          )}
          <div className="w-full bg-emerald-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(
                  (batchQualifyProgress.completed / (batchQualifyProgress.total || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {isBatchEnriching && (
        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-700" />
              <span>
                Enriching business contacts ({batchEnrichProgress.completed} of{' '}
                {batchEnrichProgress.total} completed)
              </span>
            </span>
            <span className="font-mono text-[11px] text-purple-800 font-bold">
              {Math.round(
                (batchEnrichProgress.completed / (batchEnrichProgress.total || 1)) * 100
              )}
              %
            </span>
          </div>
          {batchEnrichProgress.currentLeadName && (
            <p className="text-[11px] text-purple-800 truncate">
              Investigating public channels for: <span className="font-semibold">{batchEnrichProgress.currentLeadName}</span>
            </p>
          )}
          <div className="w-full bg-purple-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(
                  (batchEnrichProgress.completed / (batchEnrichProgress.total || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {isBatchOutreachGenerating && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
              <span>
                Crafting evidence-based outreach ({batchOutreachProgress.completed} of{' '}
                {batchOutreachProgress.total} completed)
              </span>
            </span>
            <span className="font-mono text-[11px] text-indigo-800 font-bold">
              {Math.round(
                (batchOutreachProgress.completed / (batchOutreachProgress.total || 1)) * 100
              )}
              %
            </span>
          </div>
          {batchOutreachProgress.currentLeadName && (
            <p className="text-[11px] text-indigo-800 truncate">
              Generating personalized options for: <span className="font-semibold">{batchOutreachProgress.currentLeadName}</span>
            </p>
          )}
          <div className="w-full bg-indigo-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(
                  (batchOutreachProgress.completed / (batchOutreachProgress.total || 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Active Search Mission Banner */}
      {activeSearch && (
        <div className="px-4 py-3 rounded-xl bg-blue-50/80 border border-blue-200/70 text-xs text-blue-900 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-xs shrink-0 text-blue-950">Mission Filter:</span>
              <span className="font-semibold truncate">{activeSearch.customLabel || activeSearch.name}</span>
              <span className="text-blue-400 hidden sm:inline">·</span>
              <span className="text-blue-700 hidden sm:inline truncate">{activeSearch.location}</span>
            </div>
            <button
              onClick={() => setActiveSearchId(null)}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Clear Mission Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-200/50">
            <span className="font-semibold text-blue-900">
              {leads.filter((l) => l.searchId === activeSearch.id || (l.searchIds && l.searchIds.includes(activeSearch.id))).length} Total:
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-semibold text-[11px]">
              {leads.filter((l) => (l.searchId === activeSearch.id || (l.searchIds && l.searchIds.includes(activeSearch.id))) && l.qualificationStatus === 'Qualified').length} Qualified
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-[11px]">
              {leads.filter((l) => (l.searchId === activeSearch.id || (l.searchIds && l.searchIds.includes(activeSearch.id))) && l.qualificationStatus === 'Potential').length} Potential
            </span>
            <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 font-semibold text-[11px]">
              {leads.filter((l) => (l.searchId === activeSearch.id || (l.searchIds && l.searchIds.includes(activeSearch.id))) && l.qualificationStatus === 'Not a match').length} No Match
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-semibold text-[11px]">
              {leads.filter((l) => (l.searchId === activeSearch.id || (l.searchIds && l.searchIds.includes(activeSearch.id))) && (l.contactEnrichmentStatus === 'Enriched' || l.contactEnrichmentStatus === 'Partial')).length} Enriched
            </span>
          </div>
        </div>
      )}

      {/* Comprehensive Filter Controls */}
      <div className="p-3.5 bg-white rounded-xl border border-zinc-200/80 shadow-2xs space-y-3">
        {/* Top search & quick select */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search business name, location, phone, notes, tags..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 hover:bg-zinc-100/60 focus:bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 min-h-[38px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectAllChange}
              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-zinc-900" />
              ) : (
                <Square className="w-4 h-4 text-zinc-400" />
              )}
              <span>{allFilteredSelected ? 'Deselect All' : 'Select All'}</span>
            </button>

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-700 transition-colors flex items-center gap-1"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-filter Dropdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-zinc-100">
          {/* 1. Qualification Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Qualification
            </label>
            <select
              value={qualificationFilter}
              onChange={(e) => setQualificationFilter(e.target.value as any)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 min-h-[36px]"
            >
              <option value="All">All Statuses</option>
              <option value="Qualified">Qualified</option>
              <option value="Potential">Potential</option>
              <option value="Not a match">Not a Match</option>
              <option value="Researching">Researching</option>
              <option value="Qualification Failed">Failed</option>
            </select>
          </div>

          {/* 2. Industry / Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Industry
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 min-h-[36px]"
            >
              <option value="All">All Industries</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Location filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Location Filter
            </label>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="e.g. Austin, TX"
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 min-h-[36px]"
            />
          </div>

          {/* 4. Contact Enrichment */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Contact Status
            </label>
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value as any)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 min-h-[36px]"
            >
              <option value="All">All Contacts</option>
              <option value="Enriched">Enriched</option>
              <option value="Partial">Partial</option>
              <option value="Not Found">Not Found</option>
              <option value="Not Enriched">Not Enriched</option>
            </select>
          </div>

          {/* 5. Outreach Drafts */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Outreach Drafts
            </label>
            <select
              value={outreachDraftFilter}
              onChange={(e) => setOutreachDraftFilter(e.target.value as any)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 min-h-[36px]"
            >
              <option value="All">All Outreach</option>
              <option value="Has Draft">Has Saved Draft</option>
              <option value="No Draft">No Draft Yet</option>
            </select>
          </div>

          {/* 6. Tags filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Custom Tags
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900 min-h-[36px]"
            >
              <option value="All">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Floating Selected Action Bar in thumb zone */}
      {selectedLeadIds.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-8 sm:w-auto max-w-xl mx-auto z-30 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs">{selectedLeadIds.length} selected</span>
            <button
              onClick={clearSelection}
              className="text-zinc-400 hover:text-white underline text-[11px]"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Bulk Outreach */}
            <button
              onClick={() => {
                if (selectedLeadIds.length > 0) {
                  setSelectedLeadId(selectedLeadIds[0]);
                }
                setCurrentTab('outreach');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              title="Open selected leads in AI Outreach Workspace"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Outreach</span>
            </button>

            {/* Bulk Add Tag */}
            <button
              onClick={() => setBulkTagModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-lg transition-colors border border-zinc-700"
              title="Add a custom organization tag to selected leads"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Tag</span>
            </button>

            {/* Bulk Archive / Restore */}
            {archiveFilter === 'archived' ? (
              <button
                onClick={() => bulkRestoreLeads(selectedLeadIds)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-lg transition-colors border border-zinc-700"
                title="Restore selected leads to active database"
              >
                <ArchiveRestore className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            ) : (
              <button
                onClick={() => bulkArchiveLeads(selectedLeadIds)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-lg transition-colors border border-zinc-700"
                title="Archive selected leads"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </button>
            )}

            {/* Bulk Delete */}
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-semibold text-xs rounded-lg transition-colors border border-rose-800"
              title="Delete selected leads with confirmation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      )}

      {/* Content Rendering */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
          <EmptyState
            title={archiveFilter === 'archived' ? 'No archived leads found' : 'No leads match criteria'}
            description={
              archiveFilter === 'archived'
                ? 'Archived leads will appear here when you archive them from your active pipeline.'
                : 'Try loosening your filters or keyword query, or launch a new discovery mission.'
            }
            actionText="Clear Filters"
            onAction={resetAllFilters}
          />
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS VIEW */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              const draftsCount = Array.isArray(lead.outreachDrafts) ? lead.outreachDrafts.length : 0;
              const leadTags = Array.isArray(lead.tags) ? lead.tags : [];

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer relative flex flex-col justify-between group active:scale-[0.99] ${
                    isSelected
                      ? 'border-zinc-900 ring-1 ring-zinc-900/10 shadow-sm bg-zinc-50/30'
                      : 'border-zinc-200/80 hover:border-zinc-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top row: Checkbox, Name, Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectLead(lead.id);
                          }}
                          className="min-h-[44px] min-w-[44px] -m-2 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors shrink-0"
                          aria-label={`Select ${lead.businessName}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-zinc-900" />
                          ) : (
                            <Square className="w-5 h-5 text-zinc-300 hover:text-zinc-600" />
                          )}
                        </button>

                        <div className="min-w-0 pt-0.5">
                          <h3 className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition-colors leading-tight truncate">
                            {lead.businessName}
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-medium mt-0.5 truncate">
                            {lead.category}
                          </p>
                        </div>
                      </div>

                      {lead.rating > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-900 text-xs font-mono font-semibold shrink-0">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>{lead.rating}</span>
                          <span className="text-[10px] text-amber-700/80 font-sans">({lead.reviewCount})</span>
                        </div>
                      )}
                    </div>

                    {/* Workflow Stages Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <LeadStatusBadge status={lead.qualificationStatus} />
                      {lead.qualificationConfidence && (
                        <ConfidenceBadge confidence={lead.qualificationConfidence} size="sm" />
                      )}
                      <WebsiteStatusBadge status={lead.websiteStatus} />
                      <ResearchStatusBadge status={lead.researchStatus || 'Not researched'} />
                      <ContactStatusBadge status={lead.contactEnrichmentStatus} />
                      {draftsCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200/60 font-mono">
                          <Send className="w-2.5 h-2.5 text-indigo-600" />
                          {draftsCount} {draftsCount === 1 ? 'Draft' : 'Drafts'}
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{lead.address}</span>
                    </div>

                    {/* Custom Tags Pill List */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      {leadTags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200"
                        >
                          <Tag className="w-2.5 h-2.5 text-zinc-400" />
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLeadTag(lead.id, t);
                            }}
                            className="hover:text-rose-600 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {quickTagLeadId === lead.id ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1"
                        >
                          <input
                            type="text"
                            value={quickTagInput}
                            onChange={(e) => setQuickTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickAddTag(lead.id);
                              if (e.key === 'Escape') setQuickTagLeadId(null);
                            }}
                            placeholder="New tag..."
                            autoFocus
                            className="px-2 py-0.5 text-[10px] border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900 w-24"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickAddTag(lead.id)}
                            className="text-[10px] font-bold text-zinc-900 px-1 hover:text-blue-600"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickTagLeadId(null)}
                            className="text-[10px] text-zinc-400 hover:text-zinc-700"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickTagLeadId(lead.id);
                            setQuickTagInput('');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border border-dashed border-zinc-200"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Tag</span>
                        </button>
                      )}
                    </div>

                    {/* Private Working Notes Preview (if any) */}
                    {lead.notes && (
                      <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/50 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="line-clamp-2 leading-relaxed">
                          <strong className="font-semibold">Notes:</strong> {lead.notes}
                        </p>
                      </div>
                    )}

                    {/* Qualification reason snippet */}
                    <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
                      {lead.qualificationReason}
                    </p>
                  </div>

                  {/* Bottom Touch Actions Row */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {lead.phone && lead.phone !== 'Not available' ? (
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="min-h-[36px] px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/70 text-zinc-800 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
                          title="Call business directly"
                        >
                          <Phone className="w-3.5 h-3.5 text-zinc-600" />
                          <span className="text-[11px]">{lead.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-zinc-400 font-mono italic">No phone</span>
                      )}

                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="min-h-[36px] px-2 py-1 rounded-lg bg-zinc-100/70 hover:bg-zinc-200/70 text-blue-700 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Open website"
                        >
                          <span className="text-[11px]">Site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Archive / Restore Button */}
                      {lead.isArchived ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreLead(lead.id);
                          }}
                          className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                          title="Restore lead to active pipeline"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveLead(lead.id);
                          }}
                          className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                          title="Archive lead"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}

                      {/* Outreach Workspace Quick Action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(lead.id);
                          setCurrentTab('outreach');
                        }}
                        className="min-h-[36px] px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                        title="Open in AI Outreach Workspace"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Outreach</span>
                      </button>

                      {/* Open drawer details */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(lead.id);
                        }}
                        className="min-h-[36px] px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs shrink-0"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-200/80 select-none">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllChange}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors mx-auto"
                      title={allFilteredSelected ? 'Deselect all' : 'Select all'}
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-zinc-900" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">Business & Tags</th>
                  <th className="py-3 px-4 min-w-[140px]">Location</th>
                  <th className="py-3 px-4 min-w-[120px]">Qualification</th>
                  <th className="py-3 px-4 min-w-[110px]">Research</th>
                  <th className="py-3 px-4 min-w-[110px]">Contact</th>
                  <th className="py-3 px-4 min-w-[90px]">Outreach</th>
                  <th className="py-3 px-4 min-w-[200px]">Notes & Evidence</th>
                  <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  const draftsCount = Array.isArray(lead.outreachDrafts) ? lead.outreachDrafts.length : 0;
                  const leadTags = Array.isArray(lead.tags) ? lead.tags : [];

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`hover:bg-zinc-50/70 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-zinc-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectLead(lead.id);
                        }}
                      >
                        <div className="flex items-center justify-center">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-zinc-900" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-300 group-hover:text-zinc-600" />
                          )}
                        </div>
                      </td>

                      {/* Business & Tags */}
                      <td className="py-3 px-4 font-semibold text-zinc-900">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="group-hover:text-blue-600 transition-colors truncate max-w-[200px] block">
                              {lead.businessName}
                            </span>
                            {lead.notes && (
                              <span title={`Note: ${lead.notes}`}>
                                <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-normal block truncate max-w-[180px]">
                            {lead.category}
                          </span>

                          {leadTags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {leadTags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-100 text-zinc-600 font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                              {leadTags.length > 2 && (
                                <span className="text-[9px] text-zinc-400">+{leadTags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-[11px] truncate max-w-[130px]">
                          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span className="truncate">{lead.address}</span>
                        </span>
                      </td>

                      {/* Qualification */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <LeadStatusBadge status={lead.qualificationStatus} />
                          {lead.qualificationConfidence && (
                            <div>
                              <ConfidenceBadge confidence={lead.qualificationConfidence} size="sm" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Research */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <ResearchStatusBadge status={lead.researchStatus || 'Not researched'} />
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <ContactStatusBadge status={lead.contactEnrichmentStatus} />
                      </td>

                      {/* Outreach Status */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        {draftsCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200/50">
                            {draftsCount} Draft{draftsCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[10px]">None</span>
                        )}
                      </td>

                      {/* Notes / Reason */}
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        <p className="line-clamp-2 max-w-[220px]">
                          {lead.notes ? (
                            <span><strong className="text-zinc-700">Note:</strong> {lead.notes}</span>
                          ) : (
                            lead.qualificationReason
                          )}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.isArchived ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreLead(lead.id);
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                              title="Restore lead"
                            >
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveLead(lead.id);
                              }}
                              className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                              title="Archive lead"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadId(lead.id);
                              setCurrentTab('outreach');
                            }}
                            className="p-1 text-zinc-400 hover:text-indigo-600 rounded"
                            title="Outreach Workspace"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLeadId(lead.id);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BULK TAG MODAL */}
      {bulkTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-zinc-700" />
                <span>Add Tag to {selectedLeadIds.length} Selected Leads</span>
              </h3>
              <button
                onClick={() => setBulkTagModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Apply a label across selected prospects to organize campaigns and follow-ups.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider block">
                Choose a suggested tag:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TAG_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleApplyBulkTag(tag)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider block">
                Or type a custom tag name:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bulkTagInput}
                  onChange={(e) => setBulkTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyBulkTag(bulkTagInput);
                  }}
                  placeholder="e.g. Q4 Website Pitch"
                  className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => handleApplyBulkTag(bulkTagInput)}
                  disabled={!bulkTagInput.trim()}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg disabled:opacity-50 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-zinc-900">
                  Delete {selectedLeadIds.length} Selected Leads?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  This will permanently delete these prospects, their verified observations, qualification scores, and outreach drafts from your storage.
                </p>
              </div>
              <button
                onClick={() => setBulkDeleteModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
              Tip: If you simply want to hide these leads from your active view without erasing work, use <strong>Archive</strong> instead.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  bulkDeleteLeads(selectedLeadIds);
                  setBulkDeleteModalOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Bulk Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
