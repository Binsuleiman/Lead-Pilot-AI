import {
  Lead,
  ResearchSource,
  WebsiteObservationsChecklist,
  WebsiteFindingsDetail,
  PublicContactInformation,
  WebsitePageInfo,
  WebsiteStatus,
} from '../types';

export interface ResearchLeadParams {
  businessName: string;
  category: string;
  address: string;
  phone: string;
  website: string | null;
  searchCriteria: string;
  additionalInstructions?: string;
  isDemo?: boolean;
}

export interface ResearchLeadResponse {
  success: boolean;
  data?: {
    businessSummary: string;
    services: string[];
    websiteTitle: string | null;
    websiteDescription: string | null;
    websiteStatus: WebsiteStatus;
    websitePages: WebsitePageInfo[];
    structuredFindings: WebsiteFindingsDetail;
    publicContactInformation: PublicContactInformation;
    criteriaEvidence: string;
    researchSources: ResearchSource[];
    researchedAt: string;
    researchError?: string | null;
  };
  error?: string;
  code?: string;
}

/**
 * Checks if the Gemini AI research backend is configured
 */
export async function checkResearchConfig(): Promise<{ configured: boolean; model: string }> {
  try {
    const res = await fetch('/api/research/status');
    if (!res.ok) {
      return { configured: false, model: 'gemini-3.8-flash' };
    }
    return await res.json();
  } catch {
    return { configured: false, model: 'gemini-3.8-flash' };
  }
}

/**
 * Generates high-fidelity research findings for simulated / demo mode leads
 */
function generateDemoResearchResult(
  lead: Lead,
  criteria: string
): ResearchLeadResponse['data'] {
  const hasWebsite = !!(lead.website && lead.website.trim() && lead.website !== 'Not available');
  const cleanCity = lead.address.split(',')[1]?.trim() || 'Local Area';
  const now = new Date().toISOString();

  if (!hasWebsite) {
    return {
      businessSummary: `${lead.businessName} is a local ${lead.category.toLowerCase()} operating in ${lead.address}. The business has accumulated a ${lead.rating || 4.7}-star customer rating across ${lead.reviewCount || 30}+ verified public reviews.`,
      services: [
        `${lead.category} Diagnostics & Repair`,
        'Emergency Service Calls',
        'Residential & Commercial Maintenance',
        'Local Service Coverage in ' + cleanCity,
      ],
      websiteTitle: null,
      websiteDescription: null,
      websiteStatus: 'No website found',
      websitePages: [],
      structuredFindings: {
        observations: [
          'No official web domain registered or linked in public Google Places data.',
          'Business listing operates dispatch exclusively via telephone line (' + (lead.phone || 'Phone dispatch') + ').',
          'Active business location verified at ' + lead.address + '.',
          'High public customer rating: ' + (lead.rating || 4.8) + ' stars with ' + (lead.reviewCount || 40) + ' reviews.',
        ],
        aiAssessments: [
          'High potential for digital intake capture: customers seeking after-hours quotes currently have no web intake mechanism.',
          'Relying purely on telephone calls introduces friction during high-demand peak seasons or missed call scenarios.',
        ],
        checklist: {
          websiteExists: 'No',
          websiteAppearsActive: 'No',
          clearServiceInformation: 'Unable to determine',
          visibleContactInformation: lead.phone ? 'Yes' : 'Unable to determine',
          visibleCallToAction: 'No',
          mobileFriendlyAssessment: 'Unable to determine',
          appearsOutdated: 'Unable to determine',
          outdatedSignals: ['No digital web presence found'],
          importantPagesMissing: ['Official homepage', 'Services list', 'Online quote form'],
          brokenOrInaccessiblePages: [],
        },
      },
      publicContactInformation: {
        phone: lead.phone || null,
        email: null,
        address: lead.address,
        contactPageUrl: null,
        socialLinks: {},
        notes: 'Public phone is the primary contact method discovered for this business.',
      },
      criteriaEvidence: `Matches criteria "${criteria}": Business has zero active website found and handles all operations via direct phone.`,
      researchSources: [
        {
          title: `Google Maps Verified Profile: ${lead.businessName}`,
          url: lead.googleMapsUrl,
          sourceType: 'google_search',
          relevance: 'Confirmed verified local operating address and phone dispatch line',
        },
        {
          title: `Google Search Record: "${lead.businessName}" ${cleanCity}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${lead.businessName} ${cleanCity}`)}`,
          sourceType: 'google_search',
          relevance: 'Public search verification showing no indexed corporate website',
        },
      ],
      researchedAt: now,
      researchError: null,
    };
  }

    const websiteDomain = lead.website ? lead.website.replace(/^https?:\/\//, '').split('/')[0] : '';
    const websiteUrl = lead.website || `https://www.google.com/search?q=${encodeURIComponent(lead.businessName)}`;

    return {
      businessSummary: `${lead.businessName} provides ${lead.category.toLowerCase()} across ${cleanCity}. Public web presence was audited via the domain ${lead.website}.`,
      services: [
        `${lead.category} Solutions`,
        'System Inspections & Estimates',
        'Preventative Maintenance Agreements',
        'Emergency Dispatch in ' + cleanCity,
      ],
      websiteTitle: `${lead.businessName} | Official Website`,
      websiteDescription: `Local ${lead.category} serving ${cleanCity} and surrounding areas. Call for estimates and service bookings.`,
      websiteStatus: 'Website researched',
      websitePages: [
        { title: 'Home Page', url: lead.website || '', note: 'Standard landing banner' },
        { title: 'Services', url: lead.website ? `${lead.website}/services` : '', note: 'Lists primary service scopes' },
        { title: 'Contact Us', url: lead.website ? `${lead.website}/contact` : '', note: 'Static contact info' },
      ],
      structuredFindings: {
        observations: [
          'Domain is actively hosted and accessible online.',
          'Contact telephone ' + (lead.phone || '') + ' is displayed on header.',
          'Website does not provide an instant online self-service estimate calculator.',
          'Site relies on standard static email or contact form submission.',
        ],
        aiAssessments: [
          'The website does not clearly present a prominent call to action on the reviewed pages.',
          'Mobile conversion path could be improved with direct tap-to-SMS or online scheduling widgets.',
        ],
        checklist: {
          websiteExists: 'Yes',
          websiteAppearsActive: 'Yes',
          clearServiceInformation: 'Yes',
          visibleContactInformation: 'Yes',
          visibleCallToAction: 'Unable to determine',
          mobileFriendlyAssessment: 'Yes',
          appearsOutdated: 'Unable to determine',
          outdatedSignals: [],
          importantPagesMissing: ['Instant booking engine', 'Online pricing estimator'],
          brokenOrInaccessiblePages: [],
        },
      },
      publicContactInformation: {
        phone: lead.phone || null,
        email: lead.email || (websiteDomain ? `contact@${websiteDomain}` : null),
        address: lead.address,
        contactPageUrl: lead.contactPage || (lead.website ? `${lead.website}/contact` : null),
        socialLinks: lead.socialLinks || {},
        notes: 'Website publicly provides contact details and phone line.',
      },
      criteriaEvidence: `Evidence relating to "${criteria}": Website exists and is active, but lacks streamlined online conversion flows.`,
      researchSources: [
        {
          title: `${lead.businessName} Official Web Domain`,
          url: websiteUrl,
          sourceType: 'official_website',
          relevance: 'Primary company website reviewed for services and contact points',
        },
        {
          title: `Google Search Record: "${lead.businessName}" ${cleanCity}`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${lead.businessName} ${cleanCity}`)}`,
          sourceType: 'google_search',
          relevance: 'Search grounding cross-referencing public listings and reputation',
        },
      ],
      researchedAt: now,
      researchError: null,
    };
}

/**
 * Researches an individual lead using Gemini Web Research with Google Search Grounding
 */
export async function researchSingleLead(
  lead: Lead,
  criteria: string,
  additionalInstructions?: string,
  mode: 'real' | 'demo' = 'real'
): Promise<ResearchLeadResponse> {
  // If demo mode, provide realistic simulated research findings immediately
  if (mode === 'demo' || !lead.isRealData) {
    // Artificial small delay for realistic UX feeling
    await new Promise((r) => setTimeout(r, 800));
    const demoData = generateDemoResearchResult(lead, criteria);
    return {
      success: true,
      data: demoData,
    };
  }

  // Real Mode: Call backend proxy with Gemini API and Google Search Grounding
  try {
    const response = await fetch('/api/research/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: lead.businessName,
        category: lead.category,
        address: lead.address,
        phone: lead.phone,
        website: lead.website,
        searchCriteria: criteria,
        additionalInstructions,
      }),
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      // Check if it's a missing API key error
      if (resData.code === 'MISSING_API_KEY') {
        return {
          success: false,
          error:
            resData.error ||
            'Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel to enable live AI web research.',
          code: 'MISSING_API_KEY',
        };
      }

      return {
        success: false,
        error: resData.error || 'Research could not be completed for this lead.',
        code: resData.code || 'API_ERROR',
      };
    }

    return {
      success: true,
      data: resData.data,
    };
  } catch (networkErr: any) {
    console.error('Network error during lead research:', networkErr);
    return {
      success: false,
      error: 'Network connection failed while researching lead. Please check connection and retry.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Runs controlled batch research over a list of leads with concurrency limiting
 * Ensures individual failures do NOT halt the batch!
 */
export async function runControlledBatchResearch(
  leadsToResearch: Lead[],
  criteria: string,
  additionalInstructions: string | undefined,
  mode: 'real' | 'demo',
  onLeadStart: (leadId: string) => void,
  onLeadSuccess: (leadId: string, result: NonNullable<ResearchLeadResponse['data']>) => void,
  onLeadFail: (leadId: string, errorMsg: string) => void,
  concurrencyLimit = 2
): Promise<{ succeeded: number; failed: number }> {
  let completedCount = 0;
  let succeeded = 0;
  let failed = 0;

  const total = leadsToResearch.length;
  if (total === 0) return { succeeded: 0, failed: 0 };

  let currentIndex = 0;

  async function worker() {
    while (currentIndex < total) {
      const idx = currentIndex++;
      const currentLead = leadsToResearch[idx];
      if (!currentLead) break;

      onLeadStart(currentLead.id);

      try {
        const result = await researchSingleLead(currentLead, criteria, additionalInstructions, mode);
        if (result.success && result.data) {
          succeeded++;
          onLeadSuccess(currentLead.id, result.data);
        } else {
          failed++;
          onLeadFail(currentLead.id, result.error || 'Research could not be completed for this lead.');
        }
      } catch (err: any) {
        failed++;
        onLeadFail(currentLead.id, err?.message || 'Research could not be completed for this lead.');
      }

      completedCount++;
      // Polite inter-request breather to respect rate limits
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // Launch worker pool
  const workers = Array.from({ length: Math.min(concurrencyLimit, total) }, () => worker());
  await Promise.all(workers);

  return { succeeded, failed };
}
