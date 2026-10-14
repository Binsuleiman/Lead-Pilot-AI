import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Lead,
  Search,
  User,
  NavigationTab,
  QualificationStatus,
  QualificationConfidence,
  WebsiteStatus,
  DataSourceMode,
  ResearchStatus,
  QualificationResult,
  ContactEnrichmentStatus,
  EmailStatus,
  ContactEnrichmentResult,
  OutreachChannel,
  OutreachObjective,
  OutreachTone,
  OutreachLength,
  SenderProfile,
  OutreachDraft,
  OutreachGenerationResult,
  DraftStatus,
} from '../types';
import { DEMO_USER, INITIAL_SEARCHES, INITIAL_LEADS } from '../data/demoData';
import { exportLeadsToCsv, exportOutreachDraftsToCsv } from '../utils/csvExport';
import { searchBusinesses, checkDiscoveryStatus } from '../services/businessDiscoveryService';
import {
  researchSingleLead,
  runControlledBatchResearch,
  checkResearchConfig,
} from '../services/webResearchService';
import {
  qualifySingleLead,
  runControlledBatchQualification,
} from '../services/qualificationService';
import {
  enrichSingleLead,
  runControlledBatchEnrichment,
} from '../services/contactEnrichmentService';
import {
  generateOutreachForLead,
  runControlledBatchOutreach,
} from '../services/outreachService';
import {
  persistenceService,
  mergeDiscoveredLeads,
} from '../services/persistenceService';
import {
  OrchestrationTask,
  OrchestrationPlanStage,
  OrchestrationStageName,
  OrchestrationExecutionMode,
  OrchestrationLeadProgress,
  OrchestrationTaskError,
  NaturalLanguageObjectiveParseResult,
} from '../types';
import {
  OrchestrationStorage,
  createDefaultStages,
  validateOrchestrationPlan,
  parseNaturalLanguageObjective,
  summarizeOrchestrationTask,
} from '../services/leadPilotOrchestrator';

interface AppContextType {
  user: User;
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  
  // Data Source Mode
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;
  
  searches: Search[];
  leads: Lead[];
  activeSearchId: string | null;
  setActiveSearchId: (id: string | null) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedLead: Lead | null;
  
  // Research state
  inProgressSearch: Search | null;
  researchStep: number;
  isResearching: boolean;
  researchLogs: string[];
  researchError: string | null;
  isDiscoveryConfigured: boolean;
  isAiResearchConfigured: boolean;

  // Batch AI Research state
  isBatchResearching: boolean;
  batchResearchProgress: {
    total: number;
    completed: number;
    currentLeadName?: string;
  };

  // Batch AI Qualification state
  isBatchQualifying: boolean;
  batchQualifyProgress: {
    total: number;
    completed: number;
    currentLeadName?: string;
  };

  // Batch AI Contact Enrichment state (Step 5)
  isBatchEnriching: boolean;
  batchEnrichProgress: {
    total: number;
    completed: number;
    currentLeadName?: string;
  };

  // Batch AI Outreach Engine state (Step 6)
  isBatchOutreachGenerating: boolean;
  batchOutreachProgress: {
    total: number;
    completed: number;
    currentLeadName?: string;
    failedCount: number;
  };

  // Sender Profile & Settings
  senderProfile: SenderProfile;
  updateSenderProfile: (updates: Partial<SenderProfile>) => void;
  
  // Filtering & Selection
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  qualificationFilter: 'All' | QualificationStatus;
  setQualificationFilter: (status: 'All' | QualificationStatus) => void;
  confidenceFilter: 'All' | QualificationConfidence;
  setConfidenceFilter: (conf: 'All' | QualificationConfidence) => void;
  websiteFilter: 'All' | WebsiteStatus;
  setWebsiteFilter: (status: 'All' | WebsiteStatus) => void;
  researchFilter: 'All' | ResearchStatus;
  setResearchFilter: (status: 'All' | ResearchStatus) => void;
  emailFilter: 'All' | EmailStatus;
  setEmailFilter: (status: 'All' | EmailStatus) => void;
  contactFilter: 'All' | ContactEnrichmentStatus;
  setContactFilter: (status: 'All' | ContactEnrichmentStatus) => void;
  selectedLeadIds: string[];
  toggleSelectLead: (id: string) => void;
  selectAllLeads: (select: boolean) => void;
  clearSelection: () => void;

  // Step 7: Persistence & Lead Management
  archiveFilter: 'active' | 'archived' | 'all';
  setArchiveFilter: (filter: 'active' | 'archived' | 'all') => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  locationFilter: string;
  setLocationFilter: (location: string) => void;
  outreachDraftFilter: 'All' | 'Has Draft' | 'No Draft';
  setOutreachDraftFilter: (filter: 'All' | 'Has Draft' | 'No Draft') => void;
  tagFilter: string;
  setTagFilter: (tag: string) => void;
  sortBy: 'updated_desc' | 'name_asc' | 'name_desc' | 'qualification' | 'rating_desc' | 'reviews_desc';
  setSortBy: (sort: 'updated_desc' | 'name_asc' | 'name_desc' | 'qualification' | 'rating_desc' | 'reviews_desc') => void;
  resetAllFilters: () => void;

  // Search Management
  renameSearch: (searchId: string, customLabel: string) => void;
  deleteSearch: (searchId: string, deleteAssociatedLeads?: boolean) => { deletedSearchId: string; affectedLeadsCount: number };

  // Lead Management & Notes
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  archiveLead: (leadId: string) => void;
  restoreLead: (leadId: string) => void;
  deleteLead: (leadId: string) => void;
  bulkArchiveLeads: (leadIds: string[]) => void;
  bulkRestoreLeads: (leadIds: string[]) => void;
  bulkDeleteLeads: (leadIds: string[]) => void;
  bulkAddTag: (leadIds: string[], tag: string) => void;
  bulkRemoveTag: (leadIds: string[], tag: string) => void;
  addLeadTag: (leadId: string, tag: string) => void;
  removeLeadTag: (leadId: string, tag: string) => void;
  updateLeadNotes: (leadId: string, notes: string) => void;

  // Portability & Backup
  exportWorkspaceBackupJson: () => void;
  importWorkspaceBackupJson: (jsonString: string) => { success: boolean; importedSearchesCount: number; importedLeadsCount: number; error?: string };
  previewWorkspaceBackupJson: (jsonString: string) => { success: boolean; preview?: { searchCount: number; leadCount: number; exportedAt?: string }; error?: string };

  // Step 8: AI Employee Orchestration
  orchestrationTasks: OrchestrationTask[];
  currentOrchestrationTask: OrchestrationTask | null;
  setCurrentOrchestrationTask: (task: OrchestrationTask | null) => void;
  createOrchestrationPlan: (params: {
    objective: string;
    industry: string;
    location: string;
    requestedQuantity: number;
    criteria: string[];
    serviceOrOffer: string;
    preferredChannel: OutreachChannel;
    additionalInstructions?: string;
    executionMode: OrchestrationExecutionMode;
    customStages?: OrchestrationPlanStage[];
  }) => OrchestrationTask;
  updateOrchestrationPlan: (updates: Partial<OrchestrationTask>) => void;
  startOrchestrationTask: (taskId?: string) => Promise<void>;
  pauseOrchestrationTask: () => void;
  resumeOrchestrationTask: () => Promise<void>;
  cancelOrchestrationTask: () => void;
  approveNextStage: () => Promise<void>;
  retryFailedStageOrLeads: (stageName: OrchestrationStageName, onlyFailedLeads?: boolean) => Promise<void>;
  reopenTaskReport: (taskId: string) => void;
  createTaskFromTemplate: (previousTaskId: string) => OrchestrationTask | null;
  parseObjectiveText: (text: string) => Promise<NaturalLanguageObjectiveParseResult>;

  // Actions
  startNewSearch: (params: {
    industry: string;
    location: string;
    quantity: number;
    criteria: string;
    additionalInstructions?: string;
  }) => Promise<void>;
  finishResearchNow: () => void;
  viewSearchLeads: (searchId: string) => void;
  researchLead: (leadId: string, forceRefresh?: boolean) => Promise<boolean>;
  researchAllLeads: (targetSearchId?: string) => Promise<void>;
  qualifyLead: (leadId: string) => Promise<boolean>;
  qualifyAllLeads: (targetSearchId?: string) => Promise<void>;
  enrichLead: (leadId: string) => Promise<boolean>;
  enrichAllLeads: (targetSearchId?: string) => Promise<void>;
  generateLeadOutreach: (
    leadId: string,
    options: {
      channel: OutreachChannel;
      objective: OutreachObjective;
      customObjective?: string;
      tone: OutreachTone;
      length: OutreachLength;
    }
  ) => Promise<OutreachGenerationResult | null>;
  batchGenerateOutreach: (
    leadIds: string[],
    options: {
      channel: OutreachChannel;
      objective: OutreachObjective;
      customObjective?: string;
      tone: OutreachTone;
      length: OutreachLength;
      overrideNotMatch?: boolean;
    }
  ) => Promise<{ succeeded: number; failed: number }>;
  saveLeadDraft: (
    leadId: string,
    draftData: Omit<OutreachDraft, 'id' | 'createdAt' | 'updatedAt'>
  ) => OutreachDraft;
  updateLeadDraft: (
    leadId: string,
    draftId: string,
    updates: Partial<OutreachDraft>
  ) => void;
  deleteLeadDraft: (leadId: string, draftId: string) => void;
  setLeadActiveDraft: (leadId: string, draftId: string | null) => void;
  exportOutreachDraftsCsv: (leadIds?: string[]) => void;
  updateLeadOutreach: (
    leadId: string,
    updates: {
      outreachEmail?: { subject: string; body: string };
      outreachDm?: string;
      outreachFollowUp?: { subject: string; body: string };
    }
  ) => void;
  regenerateOutreach: (leadId: string, type: 'email' | 'dm' | 'followup') => void;
  exportCsv: () => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User>(DEMO_USER);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  
  // Mode: 'real' (live Google Places API) vs 'demo' (sample businesses)
  const [dataSourceMode, setDataSourceModeState] = useState<DataSourceMode>(() => {
    const saved = localStorage.getItem('leadpilot_mode');
    return saved === 'demo' ? 'demo' : 'real';
  });

  const setDataSourceMode = (mode: DataSourceMode) => {
    setDataSourceModeState(mode);
    localStorage.setItem('leadpilot_mode', mode);
    setActiveSearchId(null);
    setSelectedLeadId(null);
    setSelectedLeadIds([]);
    setSearchQuery('');
  };

  // Demo datasets
  const [demoSearches, setDemoSearches] = useState<Search[]>(() => {
    try {
      const saved = localStorage.getItem('leadpilot_demo_searches');
      return saved ? JSON.parse(saved) : INITIAL_SEARCHES;
    } catch {
      return INITIAL_SEARCHES;
    }
  });

  const [demoLeads, setDemoLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('leadpilot_demo_leads');
      return saved ? JSON.parse(saved) : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  // Real datasets (never mixed with demo)
  const [realSearches, setRealSearches] = useState<Search[]>(() => {
    try {
      const saved = localStorage.getItem('leadpilot_real_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [realLeads, setRealLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('leadpilot_real_leads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Synchronous refs to prevent stale closure reads during long-running orchestrator execution
  const realLeadsRef = useRef<Lead[]>(realLeads);
  const demoLeadsRef = useRef<Lead[]>(demoLeads);
  const realSearchesRef = useRef<Search[]>(realSearches);
  const demoSearchesRef = useRef<Search[]>(demoSearches);

  useEffect(() => {
    realLeadsRef.current = realLeads;
  }, [realLeads]);

  useEffect(() => {
    demoLeadsRef.current = demoLeads;
  }, [demoLeads]);

  useEffect(() => {
    realSearchesRef.current = realSearches;
  }, [realSearches]);

  useEffect(() => {
    demoSearchesRef.current = demoSearches;
  }, [demoSearches]);

  // Active dataset depending on mode
  const searches = dataSourceMode === 'real' ? realSearches : demoSearches;
  const leads = dataSourceMode === 'real' ? realLeads : demoLeads;

  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  // Research progress state
  const [inProgressSearch, setInProgressSearch] = useState<Search | null>(null);
  const [researchStep, setResearchStep] = useState<number>(1);
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [researchLogs, setResearchLogs] = useState<string[]>([]);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [isDiscoveryConfigured, setIsDiscoveryConfigured] = useState<boolean>(true);

  // Filters & selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [qualificationFilter, setQualificationFilter] = useState<'All' | QualificationStatus>('All');
  const [confidenceFilter, setConfidenceFilter] = useState<'All' | QualificationConfidence>('All');
  const [websiteFilter, setWebsiteFilter] = useState<'All' | WebsiteStatus>('All');
  const [researchFilter, setResearchFilter] = useState<'All' | ResearchStatus>('All');
  const [emailFilter, setEmailFilter] = useState<'All' | EmailStatus>('All');
  const [contactFilter, setContactFilter] = useState<'All' | ContactEnrichmentStatus>('All');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // Step 7: Archive, Category, Location, Outreach draft, Tag filters & Sorting
  const [archiveFilter, setArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [outreachDraftFilter, setOutreachDraftFilter] = useState<'All' | 'Has Draft' | 'No Draft'>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<
    'updated_desc' | 'name_asc' | 'name_desc' | 'qualification' | 'rating_desc' | 'reviews_desc'
  >('updated_desc');

  const resetAllFilters = () => {
    setSearchQuery('');
    setQualificationFilter('All');
    setConfidenceFilter('All');
    setWebsiteFilter('All');
    setResearchFilter('All');
    setEmailFilter('All');
    setContactFilter('All');
    setCategoryFilter('All');
    setLocationFilter('');
    setOutreachDraftFilter('All');
    setTagFilter('All');
    setArchiveFilter('active');
    setSortBy('updated_desc');
    setActiveSearchId(null);
  };
  const [isAiResearchConfigured, setIsAiResearchConfigured] = useState<boolean>(true);
  const [isBatchResearching, setIsBatchResearching] = useState<boolean>(false);
  const [batchResearchProgress, setBatchResearchProgress] = useState<{
    total: number;
    completed: number;
    currentLeadName?: string;
  }>({ total: 0, completed: 0 });

  // Batch AI Qualification state
  const [isBatchQualifying, setIsBatchQualifying] = useState<boolean>(false);
  const [batchQualifyProgress, setBatchQualifyProgress] = useState<{
    total: number;
    completed: number;
    currentLeadName?: string;
  }>({ total: 0, completed: 0 });

  // Batch AI Contact Enrichment state (Step 5)
  const [isBatchEnriching, setIsBatchEnriching] = useState<boolean>(false);
  const [batchEnrichProgress, setBatchEnrichProgress] = useState<{
    total: number;
    completed: number;
    currentLeadName?: string;
  }>({ total: 0, completed: 0 });

  // Batch AI Outreach Engine state (Step 6)
  const [isBatchOutreachGenerating, setIsBatchOutreachGenerating] = useState<boolean>(false);
  const [batchOutreachProgress, setBatchOutreachProgress] = useState<{
    total: number;
    completed: number;
    currentLeadName?: string;
    failedCount: number;
  }>({ total: 0, completed: 0, failedCount: 0 });

  // Sender Profile & Settings (Step 6)
  const [senderProfile, setSenderProfile] = useState<SenderProfile>(() => {
    try {
      const saved = localStorage.getItem('leadpilot_sender_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      senderName: 'Alex Mercer',
      businessName: 'Apex Digital Studio',
      serviceOffered: 'modern website design and automated client intake workflows',
      portfolioUrl: '',
      bookingLink: '',
      preferredSignoff: 'Best regards',
    };
  });

  const updateSenderProfile = (updates: Partial<SenderProfile>) => {
    setSenderProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('leadpilot_sender_profile', JSON.stringify(next));
      return next;
    });
  };

  // Check discovery and research status on initial mount
  useEffect(() => {
    checkDiscoveryStatus().then((res) => {
      setIsDiscoveryConfigured(res.configured);
    });
    checkResearchConfig().then((res) => {
      setIsAiResearchConfigured(res.configured);
    });
  }, []);

  // Persist datasets
  useEffect(() => {
    localStorage.setItem('leadpilot_demo_searches', JSON.stringify(demoSearches));
  }, [demoSearches]);

  useEffect(() => {
    localStorage.setItem('leadpilot_demo_leads', JSON.stringify(demoLeads));
  }, [demoLeads]);

  useEffect(() => {
    localStorage.setItem('leadpilot_real_searches', JSON.stringify(realSearches));
  }, [realSearches]);

  useEffect(() => {
    localStorage.setItem('leadpilot_real_leads', JSON.stringify(realLeads));
  }, [realLeads]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllLeads = (select: boolean) => {
    if (select) {
      const filtered = getFilteredLeads();
      setSelectedLeadIds(filtered.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const clearSelection = () => {
    setSelectedLeadIds([]);
  };

  const getFilteredLeads = () => {
    return leads
      .filter((lead) => {
        // Archive filter: 'active' (default), 'archived', or 'all'
        if (archiveFilter === 'active' && lead.isArchived) return false;
        if (archiveFilter === 'archived' && !lead.isArchived) return false;

        // Search mission filter
        if (activeSearchId) {
          const belongs =
            lead.searchId === activeSearchId ||
            (Array.isArray(lead.searchIds) && lead.searchIds.includes(activeSearchId));
          if (!belongs) return false;
        }

        // Standard stage filters
        if (qualificationFilter !== 'All' && lead.qualificationStatus !== qualificationFilter) return false;
        if (confidenceFilter !== 'All' && lead.qualificationConfidence !== confidenceFilter) return false;
        if (websiteFilter !== 'All' && lead.websiteStatus !== websiteFilter) return false;
        if (researchFilter !== 'All' && (lead.researchStatus || 'Not researched') !== researchFilter) return false;
        if (emailFilter !== 'All') {
          const leadEmailStatus = lead.businessEmail?.status || (lead.email ? 'Found' : 'Not Found');
          if (leadEmailStatus !== emailFilter) return false;
        }
        if (contactFilter !== 'All') {
          const leadContactStatus = lead.contactEnrichmentStatus || 'Not Enriched';
          if (leadContactStatus !== contactFilter) return false;
        }

        // Industry / Category filter
        if (categoryFilter !== 'All' && lead.category !== categoryFilter) return false;

        // Location filter
        if (locationFilter.trim()) {
          const locQ = locationFilter.toLowerCase();
          if (!lead.address.toLowerCase().includes(locQ)) return false;
        }

        // Outreach Drafts filter
        if (outreachDraftFilter === 'Has Draft') {
          if (!Array.isArray(lead.outreachDrafts) || lead.outreachDrafts.length === 0) return false;
        } else if (outreachDraftFilter === 'No Draft') {
          if (Array.isArray(lead.outreachDrafts) && lead.outreachDrafts.length > 0) return false;
        }

        // Tag filter
        if (tagFilter !== 'All') {
          if (!Array.isArray(lead.tags) || !lead.tags.includes(tagFilter)) return false;
        }

        // Global search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = lead.businessName.toLowerCase().includes(q);
          const matchesLocation = lead.address.toLowerCase().includes(q);
          const matchesCat = lead.category.toLowerCase().includes(q);
          const matchesPhone = lead.phone.toLowerCase().includes(q);
          const matchesNotes = typeof lead.notes === 'string' && lead.notes.toLowerCase().includes(q);
          const matchesTags = Array.isArray(lead.tags) && lead.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchesName && !matchesLocation && !matchesCat && !matchesPhone && !matchesNotes && !matchesTags) {
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
  };

  // Start new search: Real or Demo execution
  const startNewSearch = async (params: {
    industry: string;
    location: string;
    quantity: number;
    criteria: string;
    additionalInstructions?: string;
  }) => {
    const searchId = `srch_${Date.now()}`;
    const newSearch: Search = {
      id: searchId,
      userId: user.id,
      name: `${params.industry} in ${params.location}`,
      industry: params.industry,
      location: params.location,
      quantity: params.quantity,
      requestedQuantity: params.quantity,
      foundQuantity: 0,
      criteria: params.criteria,
      additionalInstructions: params.additionalInstructions,
      status: 'in_progress',
      isRealData: dataSourceMode === 'real',
      createdAt: new Date().toISOString(),
      leadCount: 0,
      qualifiedCount: 0,
    };

    setInProgressSearch(newSearch);
    setIsResearching(true);
    setResearchStep(1);
    setResearchError(null);
    setCurrentTab('research-progress');

    if (dataSourceMode === 'real') {
      // REAL DATA EXECUTION via Google Places API (New)
      setResearchLogs([
        'LeadPilot is finding businesses...',
        `Understanding your criteria: "${params.industry}" in "${params.location}"`,
        `Criteria rule applied: "${params.criteria}"`,
      ]);

      // Stage 1 completed
      await new Promise((r) => setTimeout(r, 600));
      setResearchStep(2); // Finding businesses (active)
      setResearchLogs((prev) => [
        ...prev,
        `Searching business listings for "${params.industry} in ${params.location}"...`,
        `Querying Google Places (New) endpoint with requested quantity: ${params.quantity}`,
      ]);

      const result = await searchBusinesses({
        industry: params.industry,
        location: params.location,
        quantity: params.quantity,
        additionalInstructions: params.additionalInstructions,
        searchId,
      });

      if (!result.success) {
        setIsResearching(false);
        setResearchError(
          result.errorMessage ||
            "Business discovery isn't configured yet. Add the required Google API credentials and enable the appropriate Places service."
        );
        setResearchLogs((prev) => [
          ...prev,
          `Error: ${result.errorMessage || 'Discovery request failed'}`,
        ]);

        const failedSearch: Search = {
          ...newSearch,
          status: 'failed',
          errorMessage: result.errorMessage,
        };
        setRealSearches((prev) => [failedSearch, ...prev]);
        return;
      }

      if (result.leads.length === 0) {
        setIsResearching(false);
        const zeroMsg = `No businesses were found for "${params.industry} in ${params.location}". Try a broader industry or location.`;
        setResearchError(zeroMsg);
        setResearchLogs((prev) => [
          ...prev,
          zeroMsg,
        ]);

        const zeroSearch: Search = {
          ...newSearch,
          status: 'completed',
          completedAt: new Date().toISOString(),
          leadCount: 0,
          foundQuantity: 0,
        };
        setRealSearches((prev) => [zeroSearch, ...prev]);
        return;
      }

      // Found real businesses!
      setResearchLogs((prev) => [
        ...prev,
        `Found ${result.totalFound} businesses.`,
        'Extracted verified phone numbers, addresses, and website status from listings.',
        'Normalization complete. Awaiting AI research & qualification in next step.',
      ]);

      const completedSearch: Search = {
        ...newSearch,
        status: 'completed',
        completedAt: new Date().toISOString(),
        leadCount: result.totalFound,
        foundQuantity: result.totalFound,
        qualifiedCount: 0, // Researching status until AI qualification step
      };

      // Brief pause so users can view the completed discovery summary and logs
      await new Promise((r) => setTimeout(r, 1200));

      setRealSearches((prev) => [completedSearch, ...prev]);
      setRealLeads((prev) => {
        const { merged } = mergeDiscoveredLeads(result.leads, prev, completedSearch.id);
        return merged;
      });
      setActiveSearchId(completedSearch.id);
      setIsResearching(false);
      setInProgressSearch(null);

      // Navigate to Leads view
      setCurrentTab('leads');
    } else {
      // DEMO MODE EXECUTION
      setResearchLogs([
        `Demo Mode: Initializing simulated criteria for "${params.industry}" in "${params.location}"`,
        `Simulating stage 1: Understanding criteria...`,
      ]);

      let step = 1;
      const interval = setInterval(() => {
        step += 1;
        setResearchStep(step);
        if (step === 2) {
          setResearchLogs((prev) => [...prev, 'Simulating stage 2: Finding businesses...']);
        } else if (step === 3) {
          setResearchLogs((prev) => [...prev, 'Simulating stage 3: Researching businesses...']);
        } else if (step === 4) {
          setResearchLogs((prev) => [...prev, 'Simulating stage 4: Checking websites...']);
        } else if (step === 5) {
          setResearchLogs((prev) => [...prev, 'Simulating stage 5: Qualifying leads...']);
        } else if (step === 6) {
          setResearchLogs((prev) => [...prev, 'Simulating stage 6: Finding contact information...']);
        } else if (step >= 7) {
          clearInterval(interval);
          setResearchLogs((prev) => [...prev, 'Simulating stage 7: Preparing outreach...']);
          setTimeout(() => {
            completeSimulatedResearch(newSearch);
          }, 800);
        }
      }, 900);
    }
  };

  const finishResearchNow = () => {
    if (inProgressSearch) {
      if (dataSourceMode === 'demo') {
        completeSimulatedResearch(inProgressSearch);
      }
    }
  };

  const completeSimulatedResearch = (search: Search) => {
    setIsResearching(false);
    setResearchStep(7);

    // Generate 4 demo sample leads
    const generatedLeads: Lead[] = [
      {
        id: `lead_${Date.now()}_1`,
        searchId: search.id,
        businessName: `${search.location.split(',')[0]} Elite ${search.industry.replace(/companies|services/gi, '').trim()} Pros (Demo)`,
        category: search.industry,
        address: `100 Main Blvd, ${search.location}`,
        phone: '(555) 019-2834',
        website: null,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(search.industry + ' ' + search.location)}`,
        placeId: `ChIJ_gen_${Date.now()}_1`,
        rating: 4.8,
        reviewCount: 76,
        qualificationStatus: 'Qualified',
        qualificationReason: `Found 76 reviews with a 4.8-star rating. Strictly adheres to your criteria: no website found, active phone line, high local service density.`,
        websiteStatus: 'No website found',
        websiteFindings: 'No website found in business listing data. Listing operates via phone dispatch.',
        researchStatus: 'Not researched',
        email: null,
        contactPage: null,
        socialLinks: {},
        outreachEmail: {
          subject: `Online estimate inquiries for ${search.industry} in ${search.location}`,
          body: `Hi there,\n\nI noticed your high 4.8-star standing in ${search.location}, but saw that homeowners looking for quick online quotes currently have no central page to submit details.\n\nWe put together a streamlined 1-page mobile estimate system tailored for ${search.industry} operators.\n\nWould you be open to a quick 2-minute preview this week?\n\nBest,\n${user.name}`,
        },
        outreachDm: `Hey team! Loved your stellar Google reviews in ${search.location}. Noticed you don't have an online quote link yet—would love to share a 60-second dispatch setup we built for contractors!`,
        isRealData: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `lead_${Date.now()}_2`,
        searchId: search.id,
        businessName: `Metro ${search.location.split(',')[0]} Specialists (Demo)`,
        category: search.industry,
        address: `450 Commerce Pkwy, ${search.location}`,
        phone: '(555) 018-9921',
        website: `http://metro${search.industry.replace(/\s+/g, '').toLowerCase()}-demo.com`,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(search.industry + ' ' + search.location)}`,
        placeId: `ChIJ_gen_${Date.now()}_2`,
        rating: 4.5,
        reviewCount: 42,
        qualificationStatus: 'Qualified',
        qualificationReason: `Website is non-responsive on modern smartphones with broken contact form script. Strong candidate for mobile booking modernization.`,
        websiteStatus: 'Website found',
        websiteFindings: 'HTTP connection without SSL. Contact form returns server 500 error on submit. Missing mobile viewport meta tags.',
        researchStatus: 'Not researched',
        email: `dispatch@metro${search.industry.replace(/\s+/g, '').toLowerCase()}-demo.com`,
        contactPage: `http://metro${search.industry.replace(/\s+/g, '').toLowerCase()}-demo.com/contact`,
        socialLinks: {
          facebook: 'https://facebook.com/demo-metro',
        },
        outreachEmail: {
          subject: `Quick note: form error on your mobile website`,
          body: `Hi Metro team,\n\nWhen reviewing ${search.industry} businesses in ${search.location}, I attempted to test your estimate request page on mobile and encountered a script error on form submission.\n\nLocal customers needing fast service often abandon broken forms immediately. We built a fast responsive module that fixes this.\n\nHappy to send over the diagnostic notes!\n\nBest,\n${user.name}`,
        },
        outreachDm: `Hi there! Noticed your website form is returning an error on smartphones for visitors in ${search.location}. Can I share a quick fix walkthrough?`,
        isRealData: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const completedSearch: Search = {
      ...search,
      status: 'completed',
      completedAt: new Date().toISOString(),
      leadCount: generatedLeads.length,
      foundQuantity: generatedLeads.length,
      qualifiedCount: generatedLeads.filter((l) => l.qualificationStatus === 'Qualified').length,
    };

    setDemoSearches((prev) => [completedSearch, ...prev]);
    setDemoLeads((prev) => {
      const { merged } = mergeDiscoveredLeads(generatedLeads, prev, completedSearch.id);
      return merged;
    });
    setActiveSearchId(completedSearch.id);
    setInProgressSearch(null);

    setCurrentTab('leads');
  };

  const viewSearchLeads = (searchId: string) => {
    setActiveSearchId(searchId);
    setSearchQuery('');
    setQualificationFilter('All');
    setWebsiteFilter('All');
    setResearchFilter('All');
    setCurrentTab('leads');
  };

  /**
   * Researches a single lead with Gemini AI web research + search grounding
   * Handles caching, failures, error reporting, and safe state updates
   */
  const researchLead = async (leadId: string, forceRefresh = false): Promise<boolean> => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return false;

    // Cache check: If lead is already researched and not forcing refresh, do nothing
    if (lead.researchStatus === 'Researched' && !forceRefresh) {
      return true;
    }

    const updateLeadState = (status: ResearchStatus, updates?: Partial<Lead>) => {
      const mapper = (prev: Lead[]) =>
        prev.map((item) => {
          if (item.id !== leadId) return item;
          return {
            ...item,
            researchStatus: status,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        });

      if (dataSourceMode === 'real') {
        setRealLeads(mapper);
      } else {
        setDemoLeads(mapper);
      }
    };

    updateLeadState('Researching');

    // Find the associated search criteria
    const associatedSearch = searches.find((s) => s.id === lead.searchId) || inProgressSearch;
    const criteria = associatedSearch?.criteria || 'Businesses without websites or with outdated websites';
    const additional = associatedSearch?.additionalInstructions;

    const result = await researchSingleLead(lead, criteria, additional, dataSourceMode);

    if (result.success && result.data) {
      updateLeadState('Researched', {
        businessSummary: result.data.businessSummary,
        services: result.data.services,
        websiteTitle: result.data.websiteTitle,
        websiteDescription: result.data.websiteDescription,
        websiteStatus: result.data.websiteStatus,
        websitePages: result.data.websitePages,
        structuredFindings: result.data.structuredFindings,
        publicContactInformation: result.data.publicContactInformation,
        researchSources: result.data.researchSources,
        criteriaEvidence: result.data.criteriaEvidence,
        researchedAt: result.data.researchedAt,
        researchError: null,
        email: result.data.publicContactInformation?.email || lead.email,
        contactPage: result.data.publicContactInformation?.contactPageUrl || lead.contactPage,
        websiteFindings:
          result.data.structuredFindings?.observations?.[0] ||
          result.data.businessSummary ||
          lead.websiteFindings,
      });
      return true;
    } else {
      updateLeadState('Research failed', {
        researchError: result.error || 'Research could not be completed for this lead.',
        websiteStatus: (lead.website ? 'Website research failed' : 'No website found') as WebsiteStatus,
      });
      return false;
    }
  };

  /**
   * Researches all leads for a search or all current leads in controlled concurrent batches
   * Tolerates individual lead failures without stopping the entire run
   */
  const researchAllLeads = async (targetSearchId?: string) => {
    const searchIdToUse = targetSearchId || activeSearchId;
    // Gather leads to research
    const leadsToResearch = leads.filter((l) => {
      if (searchIdToUse && l.searchId !== searchIdToUse) return false;
      return true;
    });

    if (leadsToResearch.length === 0) return;

    setIsBatchResearching(true);
    setBatchResearchProgress({ total: leadsToResearch.length, completed: 0 });

    const associatedSearch = searches.find((s) => s.id === searchIdToUse) || inProgressSearch;
    const criteria = associatedSearch?.criteria || 'Businesses without websites or with outdated websites';
    const additional = associatedSearch?.additionalInstructions;

    await runControlledBatchResearch(
      leadsToResearch,
      criteria,
      additional,
      dataSourceMode,
      (id) => {
        // onLeadStart
        const currentL = leadsToResearch.find((x) => x.id === id);
        setBatchResearchProgress((prev) => ({
          ...prev,
          currentLeadName: currentL?.businessName,
        }));
        const mapper = (prev: Lead[]) =>
          prev.map((item) => (item.id === id ? { ...item, researchStatus: 'Researching' as const } : item));
        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);
      },
      (id, data) => {
        // onLeadSuccess
        const mapper = (prev: Lead[]) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              researchStatus: 'Researched' as const,
              businessSummary: data.businessSummary,
              services: data.services,
              websiteTitle: data.websiteTitle,
              websiteDescription: data.websiteDescription,
              websiteStatus: data.websiteStatus,
              websitePages: data.websitePages,
              structuredFindings: data.structuredFindings,
              publicContactInformation: data.publicContactInformation,
              researchSources: data.researchSources,
              criteriaEvidence: data.criteriaEvidence,
              researchedAt: data.researchedAt,
              researchError: null,
              email: data.publicContactInformation?.email || item.email,
              contactPage: data.publicContactInformation?.contactPageUrl || item.contactPage,
              websiteFindings:
                data.structuredFindings?.observations?.[0] || data.businessSummary || item.websiteFindings,
              updatedAt: new Date().toISOString(),
            };
          });
        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);
        setBatchResearchProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      },
      (id, errorMsg) => {
        // onLeadFail (individual lead failure does not stop the batch)
        const mapper = (prev: Lead[]) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              researchStatus: 'Research failed' as const,
              researchError: errorMsg,
              websiteStatus: (item.website ? 'Website research failed' : 'No website found') as WebsiteStatus,
              updatedAt: new Date().toISOString(),
            };
          });
        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);
        setBatchResearchProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      },
      2 // concurrency limit of 2 requests
    );

    setIsBatchResearching(false);
  };

  /**
   * Recalculates and persists summary counts for a given search
   * from actual lead records
   */
  const syncSearchCounts = (searchId: string, currentLeads: Lead[]) => {
    const searchLeads = currentLeads.filter((l) => l.searchId === searchId);
    const qualified = searchLeads.filter((l) => l.qualificationStatus === 'Qualified').length;
    const potential = searchLeads.filter((l) => l.qualificationStatus === 'Potential').length;
    const notMatch = searchLeads.filter((l) => l.qualificationStatus === 'Not a match').length;

    const updater = (prev: Search[]) =>
      prev.map((s) => {
        if (s.id !== searchId) return s;
        return {
          ...s,
          leadCount: searchLeads.length,
          qualifiedCount: qualified,
          potentialCount: potential,
          notMatchCount: notMatch,
        };
      });

    if (dataSourceMode === 'real') {
      setRealSearches(updater);
    } else {
      setDemoSearches(updater);
    }
  };

  /**
   * Qualifies an individual lead using Gemini AI against the original search criteria
   */
  const qualifyLead = async (leadId: string): Promise<boolean> => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return false;

    // Prerequisite: Lead must be researched before qualification
    if (lead.researchStatus !== 'Researched' && !lead.businessSummary) {
      return false;
    }

    const updateLeadState = (
      status: QualificationStatus,
      updates?: Partial<Lead>
    ) => {
      let nextLeads: Lead[] = [];
      const mapper = (prev: Lead[]) => {
        nextLeads = prev.map((item) => {
          if (item.id !== leadId) return item;
          return {
            ...item,
            qualificationStatus: status,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        });
        return nextLeads;
      };

      if (dataSourceMode === 'real') {
        setRealLeads(mapper);
      } else {
        setDemoLeads(mapper);
      }

      if (lead.searchId) {
        syncSearchCounts(lead.searchId, nextLeads);
      }
    };

    updateLeadState('Researching');

    const associatedSearch = searches.find((s) => s.id === lead.searchId) || inProgressSearch;
    const criteria = associatedSearch?.criteria || 'Businesses without websites or with outdated websites';
    const industry = associatedSearch?.industry || lead.category;
    const location = associatedSearch?.location || lead.address;
    const additional = associatedSearch?.additionalInstructions;

    const result = await qualifySingleLead(
      lead,
      criteria,
      industry,
      location,
      additional,
      dataSourceMode
    );

    if (result.success && result.data) {
      updateLeadState(result.data.status, {
        qualificationConfidence: result.data.confidence,
        qualificationReason: result.data.reason,
        qualificationEvidence: result.data.evidence,
        criteriaEvaluation: result.data.criteriaEvaluation,
        qualificationSources: result.data.sources,
        qualifiedAt: result.data.qualifiedAt,
        qualificationError: null,
      });
      return true;
    } else {
      updateLeadState('Qualification Failed', {
        qualificationError: result.error || 'Qualification could not be completed for this lead.',
      });
      return false;
    }
  };

  /**
   * Qualifies all researched leads belonging to the current/target search
   * in controlled batches with independent error handling
   */
  const qualifyAllLeads = async (targetSearchId?: string) => {
    const searchIdToUse = targetSearchId || activeSearchId;

    // Only qualify leads for this search that have been researched (skip unresearched or failed research)
    const eligibleLeads = leads.filter((l) => {
      if (searchIdToUse && l.searchId !== searchIdToUse) return false;
      return l.researchStatus === 'Researched' || !!l.businessSummary;
    });

    if (eligibleLeads.length === 0) return;

    setIsBatchQualifying(true);
    setBatchQualifyProgress({ total: eligibleLeads.length, completed: 0 });

    const associatedSearch = searches.find((s) => s.id === searchIdToUse) || inProgressSearch;
    const criteria = associatedSearch?.criteria || 'Businesses without websites or with outdated websites';
    const industry = associatedSearch?.industry || eligibleLeads[0]?.category || 'Local Business';
    const location = associatedSearch?.location || eligibleLeads[0]?.address || 'Local Area';
    const additional = associatedSearch?.additionalInstructions;

    await runControlledBatchQualification(
      eligibleLeads,
      criteria,
      industry,
      location,
      additional,
      dataSourceMode,
      (id) => {
        // onLeadStart
        const currentL = eligibleLeads.find((x) => x.id === id);
        setBatchQualifyProgress((prev) => ({
          ...prev,
          currentLeadName: currentL?.businessName,
        }));
        const mapper = (prev: Lead[]) =>
          prev.map((item) => (item.id === id ? { ...item, qualificationStatus: 'Researching' as const } : item));
        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);
      },
      (id, data) => {
        // onLeadSuccess
        let nextLeads: Lead[] = [];
        const mapper = (prev: Lead[]) => {
          nextLeads = prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              qualificationStatus: data.status,
              qualificationConfidence: data.confidence,
              qualificationReason: data.reason,
              qualificationEvidence: data.evidence,
              criteriaEvaluation: data.criteriaEvaluation,
              qualificationSources: data.sources,
              qualifiedAt: data.qualifiedAt,
              qualificationError: null,
              updatedAt: new Date().toISOString(),
            };
          });
          return nextLeads;
        };

        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);

        if (searchIdToUse) {
          syncSearchCounts(searchIdToUse, nextLeads);
        }

        setBatchQualifyProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      },
      (id, errorMsg) => {
        // onLeadFail (individual lead failure does not stop the batch)
        const mapper = (prev: Lead[]) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              qualificationStatus: 'Qualification Failed' as const,
              qualificationError: errorMsg,
              updatedAt: new Date().toISOString(),
            };
          });

        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);

        setBatchQualifyProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      },
      2 // concurrency limit of 2 requests
    );

    setIsBatchQualifying(false);
  };

  /**
   * Enriches an individual lead with public business contact information (Step 5)
   */
  const enrichLead = async (leadId: string): Promise<boolean> => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return false;

    // Prerequisite: Lead must be researched before contact enrichment
    if (lead.researchStatus !== 'Researched' && !lead.businessSummary) {
      return false;
    }

    const updateLeadState = (
      status: ContactEnrichmentStatus,
      updates?: Partial<Lead>
    ) => {
      const mapper = (prev: Lead[]) =>
        prev.map((item) => {
          if (item.id !== leadId) return item;
          return {
            ...item,
            contactEnrichmentStatus: status,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        });

      if (dataSourceMode === 'real') {
        setRealLeads(mapper);
      } else {
        setDemoLeads(mapper);
      }
    };

    updateLeadState('Enriching');

    const associatedSearch = searches.find((s) => s.id === lead.searchId) || inProgressSearch;
    const criteria = associatedSearch?.criteria || 'Public business contact enrichment';
    const industry = associatedSearch?.industry || lead.category;
    const location = associatedSearch?.location || lead.address;
    const additional = associatedSearch?.additionalInstructions;

    const result = await enrichSingleLead(
      lead,
      criteria,
      industry,
      location,
      additional,
      dataSourceMode
    );

    if (result.success && result.data) {
      updateLeadState(result.data.enrichmentStatus, {
        businessEmail: result.data.businessEmail,
        businessPhone: result.data.businessPhone,
        enrichedContactPage: result.data.contactPage,
        enrichedSocialLinks: result.data.socialLinks,
        publicBusinessContact: result.data.publicBusinessContact,
        contactSources: result.data.contactSources,
        enrichedAt: result.data.enrichedAt,
        enrichmentError: null,
        // Also keep top-level fields synced
        email: result.data.businessEmail.value || lead.email,
        phone: result.data.businessPhone.value || lead.phone,
        contactPage: result.data.contactPage.url || lead.contactPage,
      });
      return true;
    } else {
      updateLeadState('Enrichment Failed', {
        enrichmentError: result.error || 'Contact enrichment could not be completed for this lead.',
      });
      return false;
    }
  };

  /**
   * Enriches all researched leads belonging to the current/target search
   * in controlled batches with independent error handling
   */
  const enrichAllLeads = async (targetSearchId?: string) => {
    const searchIdToUse = targetSearchId || activeSearchId;

    // Enrich leads belonging to the current/target search
    const eligibleLeads = leads.filter((l) => {
      if (searchIdToUse && l.searchId !== searchIdToUse) return false;
      return true;
    });

    if (eligibleLeads.length === 0) return;

    setIsBatchEnriching(true);
    setBatchEnrichProgress({ total: eligibleLeads.length, completed: 0 });

    const associatedSearch = searches.find((s) => s.id === searchIdToUse) || inProgressSearch;
    const criteria = associatedSearch?.criteria || 'Public business contact enrichment';
    const industry = associatedSearch?.industry || eligibleLeads[0]?.category || 'Local Business';
    const location = associatedSearch?.location || eligibleLeads[0]?.address || 'Local Area';
    const additional = associatedSearch?.additionalInstructions;

    await runControlledBatchEnrichment(
      eligibleLeads,
      criteria,
      industry,
      location,
      additional,
      dataSourceMode,
      (id) => {
        // onLeadStart
        const currentL = eligibleLeads.find((x) => x.id === id);
        setBatchEnrichProgress((prev) => ({
          ...prev,
          currentLeadName: currentL?.businessName,
        }));
        const mapper = (prev: Lead[]) =>
          prev.map((item) => (item.id === id ? { ...item, contactEnrichmentStatus: 'Enriching' as const } : item));
        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);
      },
      (id, data) => {
        // onLeadSuccess
        const mapper = (prev: Lead[]) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              contactEnrichmentStatus: data.enrichmentStatus,
              businessEmail: data.businessEmail,
              businessPhone: data.businessPhone,
              enrichedContactPage: data.contactPage,
              enrichedSocialLinks: data.socialLinks,
              publicBusinessContact: data.publicBusinessContact,
              contactSources: data.contactSources,
              enrichedAt: data.enrichedAt,
              enrichmentError: null,
              email: data.businessEmail.value || item.email,
              phone: data.businessPhone.value || item.phone,
              contactPage: data.contactPage.url || item.contactPage,
              updatedAt: new Date().toISOString(),
            };
          });

        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);

        setBatchEnrichProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      },
      (id, errorMsg) => {
        // onLeadFail (individual lead failure does not stop the batch)
        const mapper = (prev: Lead[]) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            return {
              ...item,
              contactEnrichmentStatus: 'Enrichment Failed' as const,
              enrichmentError: errorMsg,
              updatedAt: new Date().toISOString(),
            };
          });

        if (dataSourceMode === 'real') setRealLeads(mapper);
        else setDemoLeads(mapper);

        setBatchEnrichProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      },
      2 // concurrency limit of 2 requests
    );

    setIsBatchEnriching(false);
  };

  const updateLeadOutreach = (
    leadId: string,
    updates: {
      outreachEmail?: { subject: string; body: string };
      outreachDm?: string;
      outreachFollowUp?: { subject: string; body: string };
    }
  ) => {
    const updateFn = (prev: Lead[]) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          outreachEmail: updates.outreachEmail !== undefined ? updates.outreachEmail : lead.outreachEmail,
          outreachDm: updates.outreachDm !== undefined ? updates.outreachDm : lead.outreachDm,
          outreachFollowUp: updates.outreachFollowUp !== undefined ? updates.outreachFollowUp : lead.outreachFollowUp,
          updatedAt: new Date().toISOString(),
        };
      });

    if (dataSourceMode === 'real') {
      setRealLeads(updateFn);
    } else {
      setDemoLeads(updateFn);
    }
  };

  const regenerateOutreach = (leadId: string, type: 'email' | 'dm' | 'followup') => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    if (type === 'email') {
      const newSubject = `Quick idea for ${lead.businessName.replace(' (Demo)', '')}`;
      const newBody = `Hi ${lead.businessName.replace(' (Demo)', '')} team,\n\nI was reviewing top-performing local businesses in ${lead.address.split(',')[1] || 'your area'} and noticed your strong ${lead.rating}-star customer feedback.\n\n${
        lead.websiteStatus === 'No website found'
          ? "Because you don't currently have a direct online estimate link, customers on mobile often call competitors who offer instant booking."
          : 'I noticed your website could capture significantly more appointments with a streamlined mobile intake flow.'
      }\n\nWe put together a lightweight system tailored for contractors. Would you be open to a 2-minute video showing how it works?\n\nBest,\n${user.name}`;

      updateLeadOutreach(leadId, { outreachEmail: { subject: newSubject, body: newBody } });
    } else if (type === 'dm') {
      const newDm = `Hey there! Noticed ${lead.businessName.replace(' (Demo)', '')} has fantastic ${lead.rating}-star ratings. We designed an automated dispatch intake that helps businesses in ${lead.address.split(',')[1] || 'your area'} book more high-margin service calls. May I share a 1-minute preview?`;
      updateLeadOutreach(leadId, { outreachDm: newDm });
    } else if (type === 'followup') {
      const newFollowUp = {
        subject: `Re: Quick idea for ${lead.businessName.replace(' (Demo)', '')}`,
        body: `Hi team,\n\nFollowing up briefly on my earlier note. We recently helped a similar service provider increase qualified inbound estimates by 35% in under 30 days.\n\nHappy to send over the case breakdown whenever you have a second!\n\nBest,\n${user.name}`,
      };
      updateLeadOutreach(leadId, { outreachFollowUp: newFollowUp });
    }
  };

  /**
   * Generates 3 evidence-grounded outreach options for an individual lead
   */
  const generateLeadOutreach = async (
    leadId: string,
    options: {
      channel: OutreachChannel;
      objective: OutreachObjective;
      customObjective?: string;
      tone: OutreachTone;
      length: OutreachLength;
    }
  ): Promise<OutreachGenerationResult | null> => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const associatedSearch = searches.find((s) => s.id === lead.searchId) || inProgressSearch;
    const criteria = associatedSearch?.criteria || 'Local business outreach';

    const res = await generateOutreachForLead({
      lead,
      searchCriteria: criteria,
      channel: options.channel,
      objective: options.objective,
      customObjective: options.customObjective,
      tone: options.tone,
      length: options.length,
      senderProfile,
      mode: dataSourceMode,
    });

    if (res.success && res.data) {
      return res.data;
    }
    return null;
  };

  /**
   * Saves a draft to the lead's drafts collection and sets it as active
   */
  const saveLeadDraft = (
    leadId: string,
    draftData: Omit<OutreachDraft, 'id' | 'createdAt' | 'updatedAt'>
  ): OutreachDraft => {
    const now = new Date().toISOString();
    const newDraft: OutreachDraft = {
      ...draftData,
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    const mapper = (prev: Lead[]) =>
      prev.map((item) => {
        if (item.id !== leadId) return item;
        const existingDrafts = Array.isArray(item.outreachDrafts) ? item.outreachDrafts : [];
        return {
          ...item,
          outreachDrafts: [newDraft, ...existingDrafts],
          activeDraftId: newDraft.id,
          // Sync top-level outreach fields for backward compatibility
          outreachEmail:
            newDraft.channel === 'email'
              ? { subject: newDraft.subject || 'Follow up', body: newDraft.body }
              : item.outreachEmail,
          outreachDm: newDraft.channel !== 'email' ? newDraft.body : item.outreachDm,
          updatedAt: now,
        };
      });

    if (dataSourceMode === 'real') {
      setRealLeads(mapper);
    } else {
      setDemoLeads(mapper);
    }

    return newDraft;
  };

  /**
   * Updates an existing draft for a lead
   */
  const updateLeadDraft = (
    leadId: string,
    draftId: string,
    updates: Partial<OutreachDraft>
  ) => {
    const now = new Date().toISOString();
    const mapper = (prev: Lead[]) =>
      prev.map((item) => {
        if (item.id !== leadId) return item;
        const existingDrafts = Array.isArray(item.outreachDrafts) ? item.outreachDrafts : [];
        const nextDrafts = existingDrafts.map((d) =>
          d.id === draftId ? { ...d, ...updates, updatedAt: now } : d
        );
        return {
          ...item,
          outreachDrafts: nextDrafts,
          updatedAt: now,
        };
      });

    if (dataSourceMode === 'real') {
      setRealLeads(mapper);
    } else {
      setDemoLeads(mapper);
    }
  };

  /**
   * Deletes a draft from a lead
   */
  const deleteLeadDraft = (leadId: string, draftId: string) => {
    const mapper = (prev: Lead[]) =>
      prev.map((item) => {
        if (item.id !== leadId) return item;
        const existingDrafts = Array.isArray(item.outreachDrafts) ? item.outreachDrafts : [];
        const nextDrafts = existingDrafts.filter((d) => d.id !== draftId);
        return {
          ...item,
          outreachDrafts: nextDrafts,
          activeDraftId: item.activeDraftId === draftId ? (nextDrafts[0]?.id || null) : item.activeDraftId,
          updatedAt: new Date().toISOString(),
        };
      });

    if (dataSourceMode === 'real') {
      setRealLeads(mapper);
    } else {
      setDemoLeads(mapper);
    }
  };

  /**
   * Sets the active draft for a lead
   */
  const setLeadActiveDraft = (leadId: string, draftId: string | null) => {
    const mapper = (prev: Lead[]) =>
      prev.map((item) =>
        item.id === leadId ? { ...item, activeDraftId: draftId } : item
      );

    if (dataSourceMode === 'real') {
      setRealLeads(mapper);
    } else {
      setDemoLeads(mapper);
    }
  };

  /**
   * Batch generates outreach drafts for selected leads
   */
  const batchGenerateOutreach = async (
    leadIds: string[],
    options: {
      channel: OutreachChannel;
      objective: OutreachObjective;
      customObjective?: string;
      tone: OutreachTone;
      length: OutreachLength;
      overrideNotMatch?: boolean;
    }
  ): Promise<{ succeeded: number; failed: number }> => {
    const targetLeads = leads.filter((l) => leadIds.includes(l.id));
    if (targetLeads.length === 0) return { succeeded: 0, failed: 0 };

    setIsBatchOutreachGenerating(true);
    setBatchOutreachProgress({
      total: targetLeads.length,
      completed: 0,
      failedCount: 0,
    });

    const associatedSearch =
      searches.find((s) => s.id === targetLeads[0]?.searchId) || inProgressSearch;
    const criteria = associatedSearch?.criteria || 'Local business outreach';

    const result = await runControlledBatchOutreach(
      {
        leads: targetLeads,
        searchCriteria: criteria,
        channel: options.channel,
        objective: options.objective,
        customObjective: options.customObjective,
        tone: options.tone,
        length: options.length,
        senderProfile,
        mode: dataSourceMode,
        overrideNotMatch: options.overrideNotMatch,
      },
      (id, index, total) => {
        const lead = targetLeads.find((l) => l.id === id);
        setBatchOutreachProgress((prev) => ({
          ...prev,
          currentLeadName: lead?.businessName,
        }));
      },
      (id, genResult) => {
        const lead = targetLeads.find((l) => l.id === id);
        if (lead && genResult.options.length > 0) {
          const primaryOption = genResult.options[0];
          saveLeadDraft(id, {
            leadId: id,
            leadBusinessName: lead.businessName,
            channel: options.channel,
            objective: options.objective,
            customObjective: options.customObjective,
            tone: options.tone,
            length: options.length,
            subject: primaryOption.subject,
            body: primaryOption.body,
            selectedOptionId: primaryOption.id,
            evidenceUsed: primaryOption.evidencePoints,
            sourceUrls: primaryOption.sourceUrls,
            isLimitedPersonalization: primaryOption.isLimitedPersonalization,
            recipientContact: genResult.suggestedRecipient || undefined,
            status: 'draft',
          });
        }
        setBatchOutreachProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
        }));
      },
      (id, error) => {
        setBatchOutreachProgress((prev) => ({
          ...prev,
          completed: prev.completed + 1,
          failedCount: prev.failedCount + 1,
        }));
      }
    );

    setIsBatchOutreachGenerating(false);
    return { succeeded: result.succeeded, failed: result.failed };
  };

  /**
   * Exports outreach drafts to CSV (either for selected leads or all leads with drafts)
   */
  const exportOutreachDraftsCsv = (leadIds?: string[]) => {
    const targetLeads = leadIds && leadIds.length > 0
      ? leads.filter((l) => leadIds.includes(l.id))
      : leads;

    const items: { draft: OutreachDraft; lead: Lead }[] = [];
    for (const lead of targetLeads) {
      if (Array.isArray(lead.outreachDrafts) && lead.outreachDrafts.length > 0) {
        for (const draft of lead.outreachDrafts) {
          items.push({ draft, lead });
        }
      }
    }

    if (items.length === 0) return;

    exportOutreachDraftsToCsv(
      items,
      `leadpilot-${dataSourceMode}-outreach-drafts-${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const exportCsv = () => {
    const targetLeads = selectedLeadIds.length > 0
      ? leads.filter((l) => selectedLeadIds.includes(l.id))
      : getFilteredLeads();

    exportLeadsToCsv(targetLeads, `leadpilot-${dataSourceMode}-leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // --- Step 7: Lead Mutations, Tags, Notes, Archive & Search Management ---

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    const updater = (prev: Lead[]) => {
      const idx = prev.findIndex((l) => l.id === leadId);
      if (idx < 0) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return next;
    };
    if (dataSourceMode === 'real') {
      setRealLeads(updater);
    } else {
      setDemoLeads(updater);
    }
  };

  const archiveLead = (leadId: string) => {
    updateLead(leadId, { isArchived: true, archivedAt: new Date().toISOString() });
  };

  const restoreLead = (leadId: string) => {
    updateLead(leadId, { isArchived: false, archivedAt: null });
  };

  const deleteLead = (leadId: string) => {
    const filter = (prev: Lead[]) => prev.filter((l) => l.id !== leadId);
    if (dataSourceMode === 'real') {
      setRealLeads(filter);
    } else {
      setDemoLeads(filter);
    }
    if (selectedLeadId === leadId) {
      setSelectedLeadId(null);
    }
    setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
  };

  const bulkArchiveLeads = (leadIds: string[]) => {
    const now = new Date().toISOString();
    const updater = (prev: Lead[]) =>
      prev.map((l) =>
        leadIds.includes(l.id)
          ? { ...l, isArchived: true, archivedAt: now, updatedAt: now }
          : l
      );
    if (dataSourceMode === 'real') {
      setRealLeads(updater);
    } else {
      setDemoLeads(updater);
    }
    setSelectedLeadIds([]);
  };

  const bulkRestoreLeads = (leadIds: string[]) => {
    const now = new Date().toISOString();
    const updater = (prev: Lead[]) =>
      prev.map((l) =>
        leadIds.includes(l.id)
          ? { ...l, isArchived: false, archivedAt: null, updatedAt: now }
          : l
      );
    if (dataSourceMode === 'real') {
      setRealLeads(updater);
    } else {
      setDemoLeads(updater);
    }
    setSelectedLeadIds([]);
  };

  const bulkDeleteLeads = (leadIds: string[]) => {
    const filter = (prev: Lead[]) => prev.filter((l) => !leadIds.includes(l.id));
    if (dataSourceMode === 'real') {
      setRealLeads(filter);
    } else {
      setDemoLeads(filter);
    }
    if (selectedLeadId && leadIds.includes(selectedLeadId)) {
      setSelectedLeadId(null);
    }
    setSelectedLeadIds([]);
  };

  const addLeadTag = (leadId: string, tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const currentTags = Array.isArray(lead.tags) ? lead.tags : [];
    if (!currentTags.includes(clean)) {
      updateLead(leadId, { tags: [...currentTags, clean] });
    }
  };

  const removeLeadTag = (leadId: string, tag: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    const currentTags = Array.isArray(lead.tags) ? lead.tags : [];
    updateLead(leadId, { tags: currentTags.filter((t) => t !== tag) });
  };

  const bulkAddTag = (leadIds: string[], tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    const now = new Date().toISOString();
    const updater = (prev: Lead[]) =>
      prev.map((l) => {
        if (leadIds.includes(l.id)) {
          const currentTags = Array.isArray(l.tags) ? l.tags : [];
          if (!currentTags.includes(clean)) {
            return { ...l, tags: [...currentTags, clean], updatedAt: now };
          }
        }
        return l;
      });
    if (dataSourceMode === 'real') {
      setRealLeads(updater);
    } else {
      setDemoLeads(updater);
    }
  };

  const bulkRemoveTag = (leadIds: string[], tag: string) => {
    const clean = tag.trim();
    const now = new Date().toISOString();
    const updater = (prev: Lead[]) =>
      prev.map((l) => {
        if (leadIds.includes(l.id)) {
          const currentTags = Array.isArray(l.tags) ? l.tags : [];
          return { ...l, tags: currentTags.filter((t) => t !== clean), updatedAt: now };
        }
        return l;
      });
    if (dataSourceMode === 'real') {
      setRealLeads(updater);
    } else {
      setDemoLeads(updater);
    }
  };

  const updateLeadNotes = (leadId: string, notes: string) => {
    updateLead(leadId, { notes });
  };

  const renameSearch = (searchId: string, customLabel: string) => {
    const trimmed = customLabel.trim();
    const updater = (prev: Search[]) =>
      prev.map((s) => (s.id === searchId ? { ...s, customLabel: trimmed || undefined } : s));
    if (dataSourceMode === 'real') {
      setRealSearches(updater);
    } else {
      setDemoSearches(updater);
    }
  };

  const deleteSearch = (searchId: string, deleteAssociatedLeads = true) => {
    let affectedLeadsCount = 0;
    const searchUpdater = (prev: Search[]) => prev.filter((s) => s.id !== searchId);

    if (deleteAssociatedLeads) {
      const leadFilter = (prev: Lead[]) =>
        prev.filter((l) => {
          const belongs =
            l.searchId === searchId ||
            (Array.isArray(l.searchIds) && l.searchIds.includes(searchId));
          if (belongs) {
            if (Array.isArray(l.searchIds) && l.searchIds.length > 1) {
              l.searchIds = l.searchIds.filter((sid) => sid !== searchId);
              if (l.searchId === searchId) {
                l.searchId = l.searchIds[0];
              }
              return true; // Keep lead since it also belongs to another search
            }
            affectedLeadsCount++;
            return false;
          }
          return true;
        });

      if (dataSourceMode === 'real') {
        setRealLeads(leadFilter);
      } else {
        setDemoLeads(leadFilter);
      }
    }

    if (dataSourceMode === 'real') {
      setRealSearches(searchUpdater);
    } else {
      setDemoSearches(searchUpdater);
    }

    if (activeSearchId === searchId) {
      setActiveSearchId(null);
    }

    return { deletedSearchId: searchId, affectedLeadsCount };
  };

  const exportWorkspaceBackupJson = () => {
    const json = persistenceService.exportCompleteBackupJson(
      dataSourceMode,
      searches,
      leads,
      senderProfile
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadpilot-${dataSourceMode}-workspace-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importWorkspaceBackupJson = (jsonString: string) => {
    const res = persistenceService.validateAndImportBackupJson(jsonString, dataSourceMode);
    if (res.success) {
      try {
        const searchesKey =
          dataSourceMode === 'real'
            ? 'leadpilot_real_searches'
            : 'leadpilot_demo_searches';
        const leadsKey =
          dataSourceMode === 'real'
            ? 'leadpilot_real_leads'
            : 'leadpilot_demo_leads';
        const s = JSON.parse(localStorage.getItem(searchesKey) || '[]');
        const l = JSON.parse(localStorage.getItem(leadsKey) || '[]');
        if (dataSourceMode === 'real') {
          setRealSearches(s);
          setRealLeads(l);
        } else {
          setDemoSearches(s);
          setDemoLeads(l);
        }
      } catch (err) {
        console.error('Error reloading after import:', err);
      }
    }
    return res;
  };

  const previewWorkspaceBackupJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON format.' };
      }
      if (!Array.isArray(parsed.searches) || !Array.isArray(parsed.leads)) {
        return {
          success: false,
          error: 'File is missing required searches or leads arrays.',
        };
      }
      return {
        success: true,
        preview: {
          searchCount: parsed.searches.length,
          leadCount: parsed.leads.length,
          exportedAt: parsed.exportedAt,
        },
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Invalid JSON format.' };
    }
  };

  const resetDemoData = () => {
    if (dataSourceMode === 'demo') {
      localStorage.removeItem('leadpilot_demo_searches');
      localStorage.removeItem('leadpilot_demo_leads');
      setDemoSearches(INITIAL_SEARCHES);
      setDemoLeads(INITIAL_LEADS);
    } else {
      localStorage.removeItem('leadpilot_real_searches');
      localStorage.removeItem('leadpilot_real_leads');
      setRealSearches([]);
      setRealLeads([]);
    }
    resetAllFilters();
    setSelectedLeadId(null);
    setSelectedLeadIds([]);
  };

  // ====================================================
  // Step 8: AI Employee Orchestration Engine Integration
  // ====================================================
  const [orchestrationTasks, setOrchestrationTasks] = useState<OrchestrationTask[]>(() => {
    return OrchestrationStorage.getTasks(dataSourceMode);
  });

  const [currentOrchestrationTask, setCurrentOrchestrationTaskState] = useState<OrchestrationTask | null>(() => {
    return OrchestrationStorage.getActiveTask(dataSourceMode);
  });

  // Keep tasks synced on dataSourceMode switch
  useEffect(() => {
    const loaded = OrchestrationStorage.getTasks(dataSourceMode);
    setOrchestrationTasks(loaded);
    const active = OrchestrationStorage.getActiveTask(dataSourceMode);
    setCurrentOrchestrationTaskState(active);
  }, [dataSourceMode]);

  // Synchronized setter that updates persistence
  const setCurrentOrchestrationTask = (task: OrchestrationTask | null) => {
    setCurrentOrchestrationTaskState(task);
    if (task) {
      OrchestrationStorage.saveTask(dataSourceMode, task);
      setOrchestrationTasks(OrchestrationStorage.getTasks(dataSourceMode));
    } else {
      OrchestrationStorage.clearActiveTask(dataSourceMode);
    }
  };

  /**
   * Translates a natural language user request via backend or local parser
   */
  const parseObjectiveText = async (text: string): Promise<NaturalLanguageObjectiveParseResult> => {
    return await parseNaturalLanguageObjective(text, senderProfile);
  };

  /**
   * Creates a structured Orchestration Task
   */
  const createOrchestrationPlan = (params: {
    objective: string;
    industry: string;
    location: string;
    requestedQuantity: number;
    criteria: string[];
    serviceOrOffer: string;
    preferredChannel: OutreachChannel;
    additionalInstructions?: string;
    executionMode: OrchestrationExecutionMode;
    customStages?: OrchestrationPlanStage[];
  }): OrchestrationTask => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const stages = params.customStages && params.customStages.length > 0
      ? params.customStages
      : createDefaultStages(params.executionMode);

    const newTask: OrchestrationTask = {
      taskId,
      objective: params.objective,
      industry: params.industry,
      location: params.location,
      requestedQuantity: params.requestedQuantity,
      criteria: params.criteria,
      serviceOrOffer: params.serviceOrOffer,
      preferredChannel: params.preferredChannel,
      additionalInstructions: params.additionalInstructions,
      executionMode: params.executionMode,
      stages,
      status: 'planned',
      targetLeadIds: [],
      leadProgress: {},
      errors: [],
      createdAt: now,
      updatedAt: now,
    };

    setCurrentOrchestrationTask(newTask);
    return newTask;
  };

  /**
   * Updates an in-flight or planned task
   */
  const updateOrchestrationPlan = (updates: Partial<OrchestrationTask>) => {
    if (!currentOrchestrationTask) return;
    const now = new Date().toISOString();
    const updated: OrchestrationTask = {
      ...currentOrchestrationTask,
      ...updates,
      updatedAt: now,
    };
    setCurrentOrchestrationTask(updated);
  };

  /**
   * Reopens a previous task report
   */
  const reopenTaskReport = (taskId: string) => {
    const found = orchestrationTasks.find((t) => t.taskId === taskId);
    if (found) {
      setCurrentOrchestrationTask(found);
      setCurrentTab('ai-employee');
    }
  };

  /**
   * Uses an existing task as a template to create a new task record
   */
  const createTaskFromTemplate = (previousTaskId: string): OrchestrationTask | null => {
    const prev = orchestrationTasks.find((t) => t.taskId === previousTaskId);
    if (!prev) return null;
    return createOrchestrationPlan({
      objective: prev.objective,
      industry: prev.industry,
      location: prev.location,
      requestedQuantity: prev.requestedQuantity,
      criteria: prev.criteria,
      serviceOrOffer: prev.serviceOrOffer,
      preferredChannel: prev.preferredChannel,
      additionalInstructions: prev.additionalInstructions,
      executionMode: prev.executionMode,
    });
  };

  /**
   * Pauses the running task at a safe checkpoint
   */
  const pauseOrchestrationTask = () => {
    if (!currentOrchestrationTask) return;
    updateOrchestrationPlan({
      status: 'paused',
      isPausedByUser: true,
      currentOperationLabel: 'Task paused at checkpoint by user.',
    });
  };

  /**
   * Cancels the running task
   */
  const cancelOrchestrationTask = () => {
    if (!currentOrchestrationTask) return;
    updateOrchestrationPlan({
      status: 'cancelled',
      isCancelledByUser: true,
      currentOperationLabel: 'Task cancelled by user. Completed work preserved.',
    });
  };

  /**
   * Human approval gate to advance when waiting for approval
   */
  const approveNextStage = async () => {
    if (!currentOrchestrationTask || !currentOrchestrationTask.waitingApprovalForStage) return;
    const stageToRun = currentOrchestrationTask.waitingApprovalForStage;
    updateOrchestrationPlan({
      waitingApprovalForStage: null,
      status: 'running',
    });
    await executeOrchestrationWorkflow(currentOrchestrationTask.taskId, stageToRun);
  };

  /**
   * Resumes a paused or interrupted task
   */
  const resumeOrchestrationTask = async () => {
    if (!currentOrchestrationTask) return;
    updateOrchestrationPlan({
      status: 'running',
      isPausedByUser: false,
    });
    await executeOrchestrationWorkflow(currentOrchestrationTask.taskId);
  };

  /**
   * Starts or restarts execution of an approved task
   */
  const startOrchestrationTask = async (taskId?: string) => {
    const id = taskId || currentOrchestrationTask?.taskId;
    if (!id) return;
    const task = orchestrationTasks.find((t) => t.taskId === id) || currentOrchestrationTask;
    if (!task) return;

    const validation = validateOrchestrationPlan(task);
    if (!validation.valid) {
      alert(`Plan validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    updateOrchestrationPlan({
      status: 'running',
      isPausedByUser: false,
      isCancelledByUser: false,
    });

    await executeOrchestrationWorkflow(id);
  };

  /**
   * Executes the state machine workflow across stages
   */
  const executeOrchestrationWorkflow = async (
    taskId: string,
    resumeFromStage?: OrchestrationStageName
  ) => {
    let task = OrchestrationStorage.getTasks(dataSourceMode).find((t) => t.taskId === taskId);
    if (!task) return;

    const shouldStop = () => {
      const live = OrchestrationStorage.getActiveTask(dataSourceMode);
      return !live || live.isPausedByUser || live.isCancelledByUser || live.status === 'paused' || live.status === 'cancelled';
    };

    const recordError = (stage: OrchestrationStageName, message: string, leadId?: string, leadName?: string) => {
      const err: OrchestrationTaskError = {
        stage,
        leadId,
        leadName,
        message,
        retryable: true,
        retryCount: 0,
        timestamp: new Date().toISOString(),
      };
      const current = OrchestrationStorage.getActiveTask(dataSourceMode);
      if (current) {
        const nextErrors = [...current.errors, err];
        setCurrentOrchestrationTask({
          ...current,
          errors: nextErrors,
        });
      }
    };

    // Helper to update a single stage's status
    const setStageStatus = (
      stageName: OrchestrationStageName,
      status: OrchestrationPlanStage['status'],
      extra?: Partial<OrchestrationPlanStage>
    ) => {
      const current = OrchestrationStorage.getActiveTask(dataSourceMode);
      if (!current) return;
      const nextStages = current.stages.map((st) =>
        st.name === stageName ? { ...st, status, ...extra } : st
      );
      setCurrentOrchestrationTask({
        ...current,
        currentStageName: status === 'running' ? stageName : current.currentStageName,
        stages: nextStages,
      });
    };

    // Maintain synchronous working copies to prevent React state closure stalls during sequential execution
    let currentWorkingLeads = dataSourceMode === 'real' ? [...realLeadsRef.current] : [...demoLeadsRef.current];
    let currentWorkingSearches = dataSourceMode === 'real' ? [...realSearchesRef.current] : [...demoSearchesRef.current];

    // Helper to commit lead mutations to both synchronous working copy and React state / localStorage
    const commitLeadUpdate = (leadId: string, mutator: (lead: Lead) => Lead) => {
      currentWorkingLeads = currentWorkingLeads.map((l) => (l.id === leadId ? mutator(l) : l));
      if (dataSourceMode === 'real') {
        realLeadsRef.current = currentWorkingLeads;
        setRealLeads([...currentWorkingLeads]);
        localStorage.setItem('leadpilot_real_leads', JSON.stringify(currentWorkingLeads));
      } else {
        demoLeadsRef.current = currentWorkingLeads;
        setDemoLeads([...currentWorkingLeads]);
        localStorage.setItem('leadpilot_demo_leads', JSON.stringify(currentWorkingLeads));
      }
    };

    try {
      // -----------------------------------------------------------
      // STAGE 1: DISCOVERY
      // -----------------------------------------------------------
      const discoveryStage = task.stages.find((s) => s.name === 'discovery');
      if (
        discoveryStage &&
        discoveryStage.enabled &&
        (!resumeFromStage || resumeFromStage === 'discovery') &&
        discoveryStage.status !== 'completed'
      ) {
        if (shouldStop()) return;

        setStageStatus('discovery', 'running', { error: null });
        updateOrchestrationPlan({ currentOperationLabel: `Discovering real businesses in ${task.location}...` });

        const searchId = task.searchId || `search_${Date.now()}`;
        const searchName = `${task.industry} in ${task.location}`;
        const criteriaString = task.criteria.join(' • ');

        let discoveredLeads: Lead[] = [];

        if (dataSourceMode === 'real') {
          const res = await searchBusinesses({
            industry: task.industry,
            location: task.location,
            quantity: task.requestedQuantity,
            additionalInstructions: task.additionalInstructions,
            searchId,
          });

          if (!res.success || res.leads.length === 0) {
            const errStr = res.errorMessage || 'No businesses discovered matching this location/industry.';
            recordError('discovery', errStr);
            setStageStatus('discovery', 'failed', { error: errStr });
            updateOrchestrationPlan({
              status: 'failed',
              currentOperationLabel: `Discovery failed: ${errStr}`,
            });
            return;
          }
          discoveredLeads = res.leads;
        } else {
          // Demo Mode Discovery
          await new Promise((r) => setTimeout(r, 600));
          discoveredLeads = demoLeadsRef.current.slice(0, task.requestedQuantity).map((l) => ({
            ...l,
            searchId,
            searchIds: [searchId],
          }));
          if (discoveredLeads.length === 0) {
            discoveredLeads = INITIAL_LEADS.slice(0, task.requestedQuantity).map((l) => ({
              ...l,
              searchId,
              searchIds: [searchId],
            }));
          }
        }

        // Save Search Record
        const newSearchRecord: Search = {
          id: searchId,
          userId: user.id,
          name: searchName,
          customLabel: task.objective.slice(0, 40),
          industry: task.industry,
          location: task.location,
          quantity: task.requestedQuantity,
          requestedQuantity: task.requestedQuantity,
          foundQuantity: discoveredLeads.length,
          criteria: criteriaString,
          additionalInstructions: task.additionalInstructions,
          status: 'completed',
          isRealData: dataSourceMode === 'real',
          createdAt: new Date().toISOString(),
          leadCount: discoveredLeads.length,
          qualifiedCount: 0,
        };

        // Merge discovered leads with synchronous working array
        const mergeResult = mergeDiscoveredLeads(currentWorkingLeads, discoveredLeads, searchId);
        currentWorkingLeads = mergeResult.merged;
        currentWorkingSearches = [newSearchRecord, ...currentWorkingSearches.filter((s) => s.id !== searchId)];

        if (dataSourceMode === 'real') {
          realLeadsRef.current = currentWorkingLeads;
          realSearchesRef.current = currentWorkingSearches;
          setRealSearches(currentWorkingSearches);
          setRealLeads(currentWorkingLeads);
          localStorage.setItem('leadpilot_real_leads', JSON.stringify(currentWorkingLeads));
          localStorage.setItem('leadpilot_real_searches', JSON.stringify(currentWorkingSearches));
        } else {
          demoLeadsRef.current = currentWorkingLeads;
          demoSearchesRef.current = currentWorkingSearches;
          setDemoSearches(currentWorkingSearches);
          setDemoLeads(currentWorkingLeads);
          localStorage.setItem('leadpilot_demo_leads', JSON.stringify(currentWorkingLeads));
          localStorage.setItem('leadpilot_demo_searches', JSON.stringify(currentWorkingSearches));
        }

        const leadProgressMap: Record<string, OrchestrationLeadProgress> = {};
        for (const dl of discoveredLeads) {
          leadProgressMap[dl.id] = {
            leadId: dl.id,
            leadName: dl.businessName,
            discoveryStatus: 'found',
            researchStatus: dl.researchStatus === 'Researched' ? 'reused' : 'pending',
            qualificationStatus: dl.qualificationStatus === 'Qualified' ? 'qualified' : 'pending',
            enrichmentStatus: dl.contactEnrichmentStatus === 'Enriched' ? 'enriched' : 'pending',
            outreachStatus: Array.isArray(dl.outreachDrafts) && dl.outreachDrafts.length > 0 ? 'drafted' : 'pending',
          };
        }

        task = {
          ...task,
          searchId,
          targetLeadIds: discoveredLeads.map((l) => l.id),
          leadProgress: leadProgressMap,
        };

        setStageStatus('discovery', 'completed', {
          leadsTotal: discoveredLeads.length,
          leadsCompleted: discoveredLeads.length,
        });

        // Mode A Checkpoint: Guided mode pause
        if (task.executionMode === 'guided') {
          updateOrchestrationPlan({
            status: 'paused',
            waitingApprovalForStage: 'research',
            currentOperationLabel: `Discovered ${discoveredLeads.length} entities. Waiting for user approval to proceed to Web Research.`,
          });
          return;
        }
      }

      // Refresh task snapshot
      task = OrchestrationStorage.getActiveTask(dataSourceMode) || task;
      if (shouldStop()) return;

      // -----------------------------------------------------------
      // STAGE 2: WEB RESEARCH
      // -----------------------------------------------------------
      const researchStage = task.stages.find((s) => s.name === 'research');
      if (
        researchStage &&
        researchStage.enabled &&
        (!resumeFromStage || resumeFromStage === 'research' || resumeFromStage === 'discovery') &&
        researchStage.status !== 'completed'
      ) {
        if (shouldStop()) return;

        setStageStatus('research', 'running');
        const criteriaString = task.criteria.join(' • ');
        const targetIds = task.targetLeadIds;
        let completedResearchCount = 0;
        let failedResearchCount = 0;

        for (let i = 0; i < targetIds.length; i++) {
          if (shouldStop()) return;
          const leadId = targetIds[i];
          const lead = currentWorkingLeads.find((l) => l.id === leadId);

          if (!lead) continue;

          // Reuse existing research if present unless failed
          if (lead.researchStatus === 'Researched' && lead.businessSummary) {
            completedResearchCount++;
            continue;
          }

          updateOrchestrationPlan({
            currentOperationLabel: `Researching ${lead.businessName} (${i + 1}/${targetIds.length})...`,
          });

          try {
            const res = await researchSingleLead(
              lead,
              criteriaString,
              task.additionalInstructions,
              dataSourceMode
            );

            if (res.success && res.data) {
              const data = res.data;
              commitLeadUpdate(leadId, (l) => ({
                ...l,
                researchStatus: 'Researched' as const,
                businessSummary: data.businessSummary,
                services: data.services,
                websiteTitle: data.websiteTitle,
                websiteDescription: data.websiteDescription,
                websiteStatus: data.websiteStatus,
                websitePages: data.websitePages,
                structuredFindings: data.structuredFindings,
                publicContactInformation: data.publicContactInformation,
                criteriaEvidence: data.criteriaEvidence,
                researchSources: data.researchSources,
                researchedAt: data.researchedAt,
                researchError: null,
                updatedAt: new Date().toISOString(),
              }));

              completedResearchCount++;
            } else {
              failedResearchCount++;
              const errStr = res.error || 'Failed to analyze website';
              recordError('research', errStr, lead.id, lead.businessName);
            }
          } catch (err: any) {
            failedResearchCount++;
            recordError('research', err?.message || 'Research error', lead.id, lead.businessName);
          }
        }

        setStageStatus('research', failedResearchCount > 0 ? 'completed_with_errors' : 'completed', {
          leadsTotal: targetIds.length,
          leadsCompleted: completedResearchCount,
          leadsFailed: failedResearchCount,
        });

        // Mode A Checkpoint: Guided mode pause
        if (task.executionMode === 'guided') {
          updateOrchestrationPlan({
            status: 'paused',
            waitingApprovalForStage: 'qualification',
            currentOperationLabel: `Completed research for ${completedResearchCount} leads. Waiting for approval to Qualify.`,
          });
          return;
        }
      }

      // Refresh task snapshot
      task = OrchestrationStorage.getActiveTask(dataSourceMode) || task;
      if (shouldStop()) return;

      // -----------------------------------------------------------
      // STAGE 3: QUALIFICATION
      // -----------------------------------------------------------
      const qualificationStage = task.stages.find((s) => s.name === 'qualification');
      if (
        qualificationStage &&
        qualificationStage.enabled &&
        (!resumeFromStage || resumeFromStage === 'qualification' || resumeFromStage === 'research' || resumeFromStage === 'discovery') &&
        qualificationStage.status !== 'completed'
      ) {
        if (shouldStop()) return;

        setStageStatus('qualification', 'running');
        const criteriaString = task.criteria.join(' • ');
        const targetIds = task.targetLeadIds;
        let qualifiedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < targetIds.length; i++) {
          if (shouldStop()) return;
          const leadId = targetIds[i];
          const lead = currentWorkingLeads.find((l) => l.id === leadId);

          if (!lead) continue;

          // Reuse existing qualification if already finished
          if (['Qualified', 'Potential', 'Not a match'].includes(lead.qualificationStatus)) {
            if (lead.qualificationStatus === 'Qualified') qualifiedCount++;
            continue;
          }

          updateOrchestrationPlan({
            currentOperationLabel: `Qualifying ${lead.businessName} against criteria (${i + 1}/${targetIds.length})...`,
          });

          try {
            const res = await qualifySingleLead(
              lead,
              criteriaString,
              task.industry,
              task.location,
              task.additionalInstructions,
              dataSourceMode
            );

            if (res.success && res.data) {
              const q = res.data;
              commitLeadUpdate(leadId, (l) => ({
                ...l,
                qualificationStatus: q.status,
                qualificationConfidence: q.confidence,
                qualificationReason: q.reason,
                qualificationEvidence: q.evidence,
                criteriaEvaluation: q.criteriaEvaluation,
                qualificationSources: q.sources,
                qualifiedAt: q.qualifiedAt,
                qualificationError: null,
                updatedAt: new Date().toISOString(),
              }));

              if (q.status === 'Qualified') qualifiedCount++;
            } else {
              failedCount++;
              recordError('qualification', res.error || 'Qualification evaluation failed', lead.id, lead.businessName);
            }
          } catch (err: any) {
            failedCount++;
            recordError('qualification', err?.message || 'Qualification error', lead.id, lead.businessName);
          }
        }

        setStageStatus('qualification', failedCount > 0 ? 'completed_with_errors' : 'completed', {
          leadsTotal: targetIds.length,
          leadsCompleted: targetIds.length - failedCount,
          leadsFailed: failedCount,
        });

        // Mode A Checkpoint: Guided mode pause
        if (task.executionMode === 'guided') {
          updateOrchestrationPlan({
            status: 'paused',
            waitingApprovalForStage: 'enrichment',
            currentOperationLabel: `Criteria qualification completed (${qualifiedCount} Qualified). Waiting for approval to Enrich Contacts.`,
          });
          return;
        }
      }

      // Refresh task snapshot
      task = OrchestrationStorage.getActiveTask(dataSourceMode) || task;
      if (shouldStop()) return;

      // -----------------------------------------------------------
      // STAGE 4: CONTACT ENRICHMENT
      // -----------------------------------------------------------
      const enrichmentStage = task.stages.find((s) => s.name === 'enrichment');
      if (
        enrichmentStage &&
        enrichmentStage.enabled &&
        (!resumeFromStage || resumeFromStage === 'enrichment' || resumeFromStage === 'qualification' || resumeFromStage === 'research' || resumeFromStage === 'discovery') &&
        enrichmentStage.status !== 'completed'
      ) {
        if (shouldStop()) return;

        setStageStatus('enrichment', 'running');
        const criteriaString = task.criteria.join(' • ');
        const targetIds = task.targetLeadIds;
        let enrichedCount = 0;
        let failedEnrichCount = 0;

        for (let i = 0; i < targetIds.length; i++) {
          if (shouldStop()) return;
          const leadId = targetIds[i];
          const lead = currentWorkingLeads.find((l) => l.id === leadId);

          if (!lead) continue;

          // Reuse existing enrichment if present
          if (lead.contactEnrichmentStatus && ['Enriched', 'Partial', 'Not Found'].includes(lead.contactEnrichmentStatus)) {
            enrichedCount++;
            continue;
          }

          updateOrchestrationPlan({
            currentOperationLabel: `Enriching contact channels for ${lead.businessName} (${i + 1}/${targetIds.length})...`,
          });

          try {
            const res = await enrichSingleLead(
              lead,
              criteriaString,
              task.industry,
              task.location,
              task.additionalInstructions,
              dataSourceMode
            );

            if (res.success && res.data) {
              const d = res.data;
              commitLeadUpdate(leadId, (l) => ({
                ...l,
                contactEnrichmentStatus: d.enrichmentStatus,
                businessEmail: d.businessEmail,
                businessPhone: d.businessPhone,
                enrichedContactPage: d.contactPage,
                enrichedSocialLinks: d.socialLinks,
                publicBusinessContact: d.publicBusinessContact,
                contactSources: d.contactSources,
                enrichedAt: d.enrichedAt,
                enrichmentError: null,
                email: d.businessEmail?.value || l.email,
                phone: d.businessPhone?.value || l.phone,
                contactPage: d.contactPage?.url || l.contactPage,
                updatedAt: new Date().toISOString(),
              }));

              enrichedCount++;
            } else {
              failedEnrichCount++;
              recordError('enrichment', res.error || 'Contact enrichment failed', lead.id, lead.businessName);
            }
          } catch (err: any) {
            failedEnrichCount++;
            recordError('enrichment', err?.message || 'Contact enrichment error', lead.id, lead.businessName);
          }
        }

        setStageStatus('enrichment', failedEnrichCount > 0 ? 'completed_with_errors' : 'completed', {
          leadsTotal: targetIds.length,
          leadsCompleted: enrichedCount,
          leadsFailed: failedEnrichCount,
        });

        // Mode B and Mode A Checkpoint: ALWAYS pause for Human Approval before generating Outreach drafts
        const outreachStageDef = task.stages.find((s) => s.name === 'outreach');
        if (outreachStageDef && outreachStageDef.enabled && outreachStageDef.status !== 'completed') {
          updateOrchestrationPlan({
            status: 'paused',
            waitingApprovalForStage: 'outreach',
            currentOperationLabel: `Enrichment completed. Waiting for human approval before generating personalized outreach drafts.`,
          });
          return;
        }
      }

      // Refresh task snapshot
      task = OrchestrationStorage.getActiveTask(dataSourceMode) || task;
      if (shouldStop()) return;

      // -----------------------------------------------------------
      // STAGE 5: OUTREACH DRAFTS (Post-Approval)
      // -----------------------------------------------------------
      const outreachStage = task.stages.find((s) => s.name === 'outreach');
      if (
        outreachStage &&
        outreachStage.enabled &&
        (!resumeFromStage || resumeFromStage === 'outreach') &&
        outreachStage.status !== 'completed'
      ) {
        if (shouldStop()) return;

        setStageStatus('outreach', 'running');
        const targetIds = task.targetLeadIds;
        // Prioritize Qualified and Potential leads. Exclude "Not a match" leads by default.
        const candidateLeads = currentWorkingLeads.filter(
          (l) => targetIds.includes(l.id) && l.qualificationStatus !== 'Not a match'
        );

        let draftsGenerated = 0;
        let failedDrafts = 0;

        for (let i = 0; i < candidateLeads.length; i++) {
          if (shouldStop()) return;
          const lead = candidateLeads[i];

          // Do NOT overwrite existing drafts without user permission
          if (Array.isArray(lead.outreachDrafts) && lead.outreachDrafts.length > 0) {
            draftsGenerated++;
            continue;
          }

          updateOrchestrationPlan({
            currentOperationLabel: `Drafting ${task.preferredChannel} pitch for ${lead.businessName} (${i + 1}/${candidateLeads.length})...`,
          });

          try {
            const res = await generateOutreachForLead({
              lead,
              searchCriteria: task.criteria.join(' • '),
              channel: task.preferredChannel,
              objective: 'modern_website',
              customObjective: task.serviceOrOffer,
              tone: 'professional',
              length: 'standard',
              senderProfile,
              mode: dataSourceMode,
            });

            if (res.success && res.data && res.data.options.length > 0) {
              const bestOpt = res.data.options[0];
              const createdDraft = saveLeadDraft(lead.id, {
                leadId: lead.id,
                leadBusinessName: lead.businessName,
                channel: task.preferredChannel,
                objective: 'modern_website',
                customObjective: task.serviceOrOffer,
                tone: 'professional',
                length: 'standard',
                subject: bestOpt.subject,
                body: bestOpt.body,
                selectedOptionId: bestOpt.id,
                evidenceUsed: bestOpt.evidencePoints,
                sourceUrls: bestOpt.sourceUrls,
                recipientContact: res.data.suggestedRecipient || undefined,
                status: 'draft',
              });

              // Keep currentWorkingLeads in sync with newly created draft
              commitLeadUpdate(lead.id, (l) => {
                const prevDrafts = Array.isArray(l.outreachDrafts) ? l.outreachDrafts : [];
                return {
                  ...l,
                  outreachDrafts: [createdDraft, ...prevDrafts],
                  activeDraftId: createdDraft.id,
                };
              });

              draftsGenerated++;
            } else {
              failedDrafts++;
              recordError('outreach', res.error || 'Outreach writing failed', lead.id, lead.businessName);
            }
          } catch (err: any) {
            failedDrafts++;
            recordError('outreach', err?.message || 'Outreach generation error', lead.id, lead.businessName);
          }
        }

        setStageStatus('outreach', failedDrafts > 0 ? 'completed_with_errors' : 'completed', {
          leadsTotal: candidateLeads.length,
          leadsCompleted: draftsGenerated,
          leadsFailed: failedDrafts,
        });
      }

      // -----------------------------------------------------------
      // FINAL TASK REPORT & WRAP-UP
      // -----------------------------------------------------------
      const finalTask = OrchestrationStorage.getActiveTask(dataSourceMode) || task;
      const associatedLeads = currentWorkingLeads.filter((l) => finalTask.targetLeadIds.includes(l.id));

      const qualifiedCount = associatedLeads.filter((l) => l.qualificationStatus === 'Qualified').length;
      const potentialCount = associatedLeads.filter((l) => l.qualificationStatus === 'Potential').length;
      const notMatchCount = associatedLeads.filter((l) => l.qualificationStatus === 'Not a match').length;
      const researchedCount = associatedLeads.filter((l) => l.researchStatus === 'Researched').length;
      const enrichedCount = associatedLeads.filter(
        (l) => l.contactEnrichmentStatus === 'Enriched' || l.contactEnrichmentStatus === 'Partial'
      ).length;
      const draftsCount = associatedLeads.filter(
        (l) => Array.isArray(l.outreachDrafts) && l.outreachDrafts.length > 0
      ).length;

      const metrics = {
        discoveredCount: associatedLeads.length,
        researchedCount,
        qualifiedCount,
        potentialCount,
        notMatchCount,
        enrichedCount,
        outreachDraftsCount: draftsCount,
        failedCount: finalTask.errors.length,
      };

      const summaryData = await summarizeOrchestrationTask(finalTask, metrics);

      const reviewList = associatedLeads
        .filter((l) => l.qualificationStatus === 'Potential' || l.qualificationStatus === 'Qualification Failed')
        .slice(0, 5)
        .map((l) => ({
          leadId: l.id,
          businessName: l.businessName,
          reason: l.qualificationReason || 'Evidence requires human verification',
        }));

      const finalOutcome = {
        requestedQuantity: finalTask.requestedQuantity,
        ...metrics,
        summaryText: summaryData.summaryText,
        recommendedNextActions: summaryData.recommendedNextActions,
        leadsNeedingReview: reviewList,
      };

      const finalStatus =
        finalTask.errors.length > 0 ? ('completed_with_errors' as const) : ('completed' as const);

      setCurrentOrchestrationTask({
        ...finalTask,
        status: finalStatus,
        outcome: finalOutcome,
        currentStageName: null,
        currentOperationLabel: 'Mission finished. All stages completed and ready for human review.',
        completedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Fatal error during orchestration execution:', err);
      updateOrchestrationPlan({
        status: 'failed',
        currentOperationLabel: `Orchestration interrupted: ${err?.message || 'Unexpected failure'}`,
      });
    }
  };

  /**
   * Retries a failed stage or only the failed leads in that stage
   */
  const retryFailedStageOrLeads = async (stageName: OrchestrationStageName, onlyFailedLeads = true) => {
    if (!currentOrchestrationTask) return;
    updateOrchestrationPlan({
      status: 'running',
      isPausedByUser: false,
    });
    await executeOrchestrationWorkflow(currentOrchestrationTask.taskId, stageName);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentTab,
        setCurrentTab,
        dataSourceMode,
        setDataSourceMode,
        searches,
        leads,
        activeSearchId,
        setActiveSearchId,
        selectedLeadId,
        setSelectedLeadId,
        selectedLead,
        inProgressSearch,
        researchStep,
        isResearching,
        researchLogs,
        researchError,
        isDiscoveryConfigured,
        isAiResearchConfigured,
        isBatchResearching,
        batchResearchProgress,
        isBatchQualifying,
        batchQualifyProgress,
        isBatchEnriching,
        batchEnrichProgress,
        isBatchOutreachGenerating,
        batchOutreachProgress,
        senderProfile,
        updateSenderProfile,
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
        renameSearch,
        deleteSearch,
        updateLead,
        archiveLead,
        restoreLead,
        deleteLead,
        bulkArchiveLeads,
        bulkRestoreLeads,
        bulkDeleteLeads,
        bulkAddTag,
        bulkRemoveTag,
        addLeadTag,
        removeLeadTag,
        updateLeadNotes,
        exportWorkspaceBackupJson,
        importWorkspaceBackupJson,
        previewWorkspaceBackupJson,

        // Step 8: AI Employee Orchestration
        orchestrationTasks,
        currentOrchestrationTask,
        setCurrentOrchestrationTask,
        createOrchestrationPlan,
        updateOrchestrationPlan,
        startOrchestrationTask,
        pauseOrchestrationTask,
        resumeOrchestrationTask,
        cancelOrchestrationTask,
        approveNextStage,
        retryFailedStageOrLeads,
        reopenTaskReport,
        createTaskFromTemplate,
        parseObjectiveText,

        startNewSearch,
        finishResearchNow,
        viewSearchLeads,
        researchLead,
        researchAllLeads,
        qualifyLead,
        qualifyAllLeads,
        enrichLead,
        enrichAllLeads,
        generateLeadOutreach,
        batchGenerateOutreach,
        saveLeadDraft,
        updateLeadDraft,
        deleteLeadDraft,
        setLeadActiveDraft,
        exportOutreachDraftsCsv,
        updateLeadOutreach,
        regenerateOutreach,
        exportCsv,
        resetDemoData,
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
