export type QualificationStatus =
  | 'Qualified'
  | 'Potential'
  | 'Not a match'
  | 'Researching'
  | 'Qualification Failed';

export type QualificationConfidence = 'High' | 'Medium' | 'Low';

export type CriterionResult = 'met' | 'not_met' | 'uncertain' | 'not_applicable';

export interface CriterionEvaluationItem {
  criterion: string;
  result: CriterionResult;
  evidence: string;
}

export interface QualificationSourceReference {
  title: string;
  url: string;
}

export interface QualificationResult {
  status: 'Qualified' | 'Potential' | 'Not a match';
  confidence: QualificationConfidence;
  reason: string;
  evidence: string[];
  criteriaEvaluation: CriterionEvaluationItem[];
  sources: QualificationSourceReference[];
  qualifiedAt: string;
}
export type WebsiteStatus =
  | 'No website found'
  | 'Website found'
  | 'Website researched'
  | 'Website research failed'
  | 'Website found, but research could not be completed'
  | 'Not researched';

export type ResearchStatus =
  | 'Not researched'
  | 'Researching'
  | 'Researched'
  | 'Research failed';

// Contact Enrichment Types (Step 5)
export type ContactEnrichmentStatus =
  | 'Not Enriched'
  | 'Enriching'
  | 'Enriched'
  | 'Partial'
  | 'Not Found'
  | 'Enrichment Failed';

export type EmailStatus = 'Found' | 'Not Found' | 'Unable to Determine';
export type EnrichmentConfidence = 'High' | 'Medium' | 'Low';

export interface EnrichedEmail {
  value: string | null;
  status: EmailStatus;
  source?: {
    title: string;
    url: string;
  } | null;
  confidence: EnrichmentConfidence;
}

export interface EnrichedPhone {
  value: string;
  source?: {
    title: string;
    url: string;
  } | null;
  confidence: EnrichmentConfidence;
}

export interface EnrichedContactPage {
  url: string | null;
  title?: string | null;
}

export interface EnrichedSocialProfile {
  platform: 'Facebook' | 'Instagram' | 'LinkedIn' | 'Twitter' | 'YouTube' | 'TikTok' | string;
  url: string;
  source?: string | null;
  confidence: EnrichmentConfidence;
}

export interface PublicBusinessContact {
  name: string | null;
  role: string | null;
  source: string | null;
}

export interface ContactSource {
  title: string;
  url: string;
  sourceType?: 'official_website' | 'contact_page' | 'google_business' | 'web_search' | 'other';
  relevance?: string;
}

export interface ContactEnrichmentResult {
  enrichmentStatus: 'Enriched' | 'Partial' | 'Not Found';
  businessEmail: EnrichedEmail;
  businessPhone: EnrichedPhone;
  contactPage: EnrichedContactPage;
  socialLinks: EnrichedSocialProfile[];
  publicBusinessContact: PublicBusinessContact;
  contactSources: ContactSource[];
  enrichedAt: string;
}

export type DataSourceMode = 'real' | 'demo';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string;
  avatarUrl?: string;
}

export type OutreachChannel =
  | 'email'
  | 'instagram_dm'
  | 'facebook_messenger'
  | 'linkedin_message'
  | 'general_dm';

export type OutreachObjective =
  | 'modern_website'
  | 'redesign'
  | 'improvements'
  | 'ai_chatbot'
  | 'workflow_automation'
  | 'conversation'
  | 'custom';

export type OutreachTone =
  | 'friendly'
  | 'professional'
  | 'confident'
  | 'direct';

export type OutreachLength =
  | 'very_short'
  | 'short'
  | 'standard';

export type DraftStatus = 'draft' | 'ready' | 'archived';

export interface SenderProfile {
  senderName: string;
  businessName: string;
  serviceOffered: string;
  portfolioUrl?: string;
  bookingLink?: string;
  preferredSignoff?: string;
}

export interface OutreachQualityChecks {
  correctBusinessName: boolean;
  supportedClaims: boolean;
  fitsChannel: boolean;
  withinLength: boolean;
  oneClearCta: boolean;
  naturalTone: boolean;
  noInventedFacts: boolean;
}

export interface OutreachOption {
  id: 'A' | 'B' | 'C';
  label: string; // e.g. 'Option A — Personalized & Conversational'
  subject?: string; // Only for email
  body: string;
  angle: string;
  evidencePoints: string[];
  sourceUrls: string[];
  isLimitedPersonalization?: boolean;
  qualityChecks?: OutreachQualityChecks;
}

export interface OutreachDraft {
  id: string;
  leadId: string;
  leadBusinessName: string;
  channel: OutreachChannel;
  objective: OutreachObjective;
  customObjective?: string;
  tone: OutreachTone;
  length: OutreachLength;
  subject?: string;
  body: string;
  selectedOptionId?: 'A' | 'B' | 'C';
  evidenceUsed: string[];
  sourceUrls: string[];
  isLimitedPersonalization?: boolean;
  recipientContact?: {
    type: 'email' | 'instagram' | 'facebook' | 'linkedin' | 'contact_page' | 'phone';
    value: string;
    label: string;
  };
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachGenerationResult {
  options: OutreachOption[];
  objectiveFitWarning?: string | null;
  suggestedRecipient?: {
    type: 'email' | 'instagram' | 'facebook' | 'linkedin' | 'contact_page' | 'phone';
    value: string;
    label: string;
  } | null;
}

export interface OutreachContent {
  subject: string;
  body: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  sourceType: 'official_website' | 'google_search' | 'other';
  relevance: string;
}

export interface WebsitePageInfo {
  title: string;
  url?: string;
  note?: string;
}

export interface WebsiteObservationsChecklist {
  websiteExists: 'Yes' | 'No' | 'Unable to determine';
  websiteAppearsActive: 'Yes' | 'No' | 'Unable to determine';
  clearServiceInformation: 'Yes' | 'No' | 'Unable to determine';
  visibleContactInformation: 'Yes' | 'No' | 'Unable to determine';
  visibleCallToAction: 'Yes' | 'No' | 'Unable to determine';
  mobileFriendlyAssessment: 'Yes' | 'No' | 'Unable to determine';
  appearsOutdated: 'Yes' | 'No' | 'Unable to determine';
  outdatedSignals?: string[];
  importantPagesMissing?: string[];
  brokenOrInaccessiblePages?: string[];
}

export interface WebsiteFindingsDetail {
  observations: string[]; // Factual / verified information directly supported by a source
  aiAssessments: string[]; // AI assessments / interpretations based on observed info
  checklist?: WebsiteObservationsChecklist;
}

export interface PublicContactInformation {
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contactPageUrl?: string | null;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  notes?: string;
}

export interface Lead {
  id: string;
  searchId: string;
  businessName: string;
  category: string;
  address: string;
  phone: string;
  website: string | null;
  googleMapsUrl: string;
  placeId: string;
  rating: number;
  reviewCount: number;
  qualificationStatus: QualificationStatus;
  qualificationConfidence?: QualificationConfidence | null;
  qualificationReason: string;
  qualificationEvidence?: string[];
  criteriaEvaluation?: CriterionEvaluationItem[];
  qualificationSources?: QualificationSourceReference[];
  qualifiedAt?: string | null;
  qualificationError?: string | null;
  websiteStatus: WebsiteStatus;
  websiteFindings: string;

  // AI Web Research Layer fields
  researchStatus: ResearchStatus;
  businessSummary?: string;
  services?: string[];
  websiteTitle?: string | null;
  websiteDescription?: string | null;
  websitePages?: WebsitePageInfo[];
  structuredFindings?: WebsiteFindingsDetail;
  publicContactInformation?: PublicContactInformation;
  researchSources?: ResearchSource[];
  criteriaEvidence?: string;
  researchedAt?: string | null;
  researchError?: string | null;

  email: string | null; // e.g. "contact@..." or null
  contactPage: string | null;
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };

  // Contact Enrichment Layer fields (Step 5)
  contactEnrichmentStatus?: ContactEnrichmentStatus;
  businessEmail?: EnrichedEmail | null;
  businessPhone?: EnrichedPhone | null;
  enrichedContactPage?: EnrichedContactPage | null;
  enrichedSocialLinks?: EnrichedSocialProfile[];
  publicBusinessContact?: PublicBusinessContact | null;
  contactSources?: ContactSource[];
  enrichedAt?: string | null;
  enrichmentError?: string | null;

  outreachEmail: OutreachContent | null;
  outreachDm: string | null;
  outreachFollowUp?: OutreachContent | null;
  outreachDrafts?: OutreachDraft[];
  activeDraftId?: string | null;
  
  // Step 7: Persistence & Lead Management fields
  tags?: string[];
  notes?: string;
  isArchived?: boolean;
  archivedAt?: string | null;
  searchIds?: string[];

  isRealData?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Search {
  id: string;
  userId: string;
  name: string;
  customLabel?: string;
  industry: string;
  location: string;
  quantity: number;
  requestedQuantity?: number;
  foundQuantity?: number;
  criteria: string;
  additionalInstructions?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  isRealData?: boolean;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  leadCount: number;
  qualifiedCount: number;
  potentialCount?: number;
  notMatchCount?: number;
}

export type LeadSortOption =
  | 'recently_updated'
  | 'name_asc'
  | 'name_desc'
  | 'qualification'
  | 'rating_desc'
  | 'review_count_desc';

export type LeadArchiveFilter = 'active' | 'archived' | 'all';

export interface Activity {
  id: string;
  type: 'search_started' | 'search_completed' | 'lead_qualified' | 'outreach_generated' | 'csv_exported';
  description: string;
  timestamp: string;
  searchId?: string;
  leadId?: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'ai-employee'
  | 'new-search'
  | 'research-progress'
  | 'leads'
  | 'outreach'
  | 'history'
  | 'settings';

export interface ResearchStage {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

// ==========================================
// Step 8: AI Employee Orchestration Types
// ==========================================

export type OrchestrationStageName =
  | 'discovery'
  | 'research'
  | 'qualification'
  | 'enrichment'
  | 'outreach';

export type OrchestrationStageStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export type OrchestrationTaskStatus =
  | 'draft'
  | 'planned'
  | 'running'
  | 'paused'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'
  | 'cancelled';

export type OrchestrationExecutionMode =
  | 'guided'    // Mode A: AI proposes each next stage and waits for user approval
  | 'standard'  // Mode B: Executes through discovery, research, qualify, enrich, then pauses for outreach approval
  | 'custom';   // Mode C: User explicitly picks which stages to run

export interface OrchestrationPlanStage {
  name: OrchestrationStageName;
  label: string;
  description: string;
  status: OrchestrationStageStatus;
  enabled: boolean;
  requiresApproval?: boolean;
  leadsTotal?: number;
  leadsCompleted?: number;
  leadsFailed?: number;
  error?: string | null;
}

export interface OrchestrationTaskError {
  stage: OrchestrationStageName;
  leadId?: string;
  leadName?: string;
  message: string;
  retryable: boolean;
  retryCount: number;
  timestamp: string;
}

export interface OrchestrationLeadProgress {
  leadId: string;
  leadName: string;
  discoveryStatus: 'found' | 'reused' | 'skipped' | 'failed';
  researchStatus: 'pending' | 'running' | 'completed' | 'reused' | 'failed';
  qualificationStatus: 'pending' | 'running' | 'qualified' | 'potential' | 'not_match' | 'failed';
  enrichmentStatus: 'pending' | 'running' | 'enriched' | 'partial' | 'not_found' | 'failed';
  outreachStatus: 'pending' | 'waiting_approval' | 'running' | 'drafted' | 'skipped' | 'failed';
  lastError?: string;
}

export interface OrchestrationTaskOutcome {
  requestedQuantity: number;
  discoveredCount: number;
  researchedCount: number;
  qualifiedCount: number;
  potentialCount: number;
  notMatchCount: number;
  enrichedCount: number;
  outreachDraftsCount: number;
  failedCount: number;
  summaryText: string;
  recommendedNextActions: string[];
  leadsNeedingReview: { leadId: string; businessName: string; reason: string }[];
}

export interface OrchestrationTask {
  taskId: string;
  objective: string;
  industry: string;
  location: string;
  requestedQuantity: number;
  criteria: string[];
  serviceOrOffer: string;
  preferredChannel: OutreachChannel;
  additionalInstructions?: string;
  executionMode: OrchestrationExecutionMode;
  stages: OrchestrationPlanStage[];
  status: OrchestrationTaskStatus;
  currentStageName?: OrchestrationStageName | null;
  currentOperationLabel?: string | null;
  searchId?: string | null;
  targetLeadIds: string[];
  leadProgress: Record<string, OrchestrationLeadProgress>;
  errors: OrchestrationTaskError[];
  outcome?: OrchestrationTaskOutcome;
  waitingApprovalForStage?: OrchestrationStageName | null;
  isPausedByUser?: boolean;
  isCancelledByUser?: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface NaturalLanguageObjectiveParseResult {
  objective: string;
  industry: string;
  location: string;
  requestedQuantity: number;
  criteria: string[];
  serviceOrOffer: string;
  preferredChannel: OutreachChannel;
  additionalInstructions?: string;
  missingFields: string[];
  clarificationQuestion?: string | null;
}
