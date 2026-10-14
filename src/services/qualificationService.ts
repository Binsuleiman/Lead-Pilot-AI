import {
  Lead,
  QualificationResult,
  QualificationStatus,
  QualificationConfidence,
  CriterionEvaluationItem,
  QualificationSourceReference,
} from '../types';

export interface QualifyLeadParams {
  lead: Lead;
  searchCriteria: string;
  industry: string;
  location: string;
  additionalInstructions?: string;
  mode?: 'real' | 'demo';
}

export interface QualifyLeadResponse {
  success: boolean;
  data?: QualificationResult;
  error?: string;
  code?: string;
}

/**
 * Generates high-fidelity, deterministic simulated qualification for demo mode
 * strictly adhering to criteria analysis, observable signals, and uncertainty handling
 */
function generateDemoQualificationResult(
  lead: Lead,
  criteria: string,
  industry: string,
  location: string
): QualificationResult {
  const criteriaLower = criteria.toLowerCase();
  const hasNoWebsiteCriteria =
    criteriaLower.includes('without website') ||
    criteriaLower.includes('no website') ||
    criteriaLower.includes('lacks website');
  const hasOutdatedCriteria =
    criteriaLower.includes('outdated') ||
    criteriaLower.includes('poor website') ||
    criteriaLower.includes('old website') ||
    criteriaLower.includes('website issue');

  const sources: QualificationSourceReference[] = (lead.researchSources || []).map((s) => ({
    title: s.title,
    url: s.url,
  }));

  if (sources.length === 0) {
    sources.push({
      title: `${lead.businessName} Google Business Profile`,
      url: lead.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(lead.businessName)}`,
    });
  }

  // Case 1: Lead has NO website
  if (!lead.website || lead.websiteStatus === 'No website found') {
    if (hasNoWebsiteCriteria) {
      return {
        status: 'Qualified',
        confidence: 'High',
        reason: 'Matches your criteria because no official website was found in the business listing data or public web research.',
        evidence: [
          'No website URL appears in the Google Places listing data.',
          'Public web search grounding confirmed active phone dispatch line but no indexed official business domain.',
          `Business has active phone (${lead.phone}) and local footprint in ${lead.address}.`,
        ],
        criteriaEvaluation: [
          {
            criterion: 'No official website',
            result: 'met',
            evidence: 'Listing has no website URL and public web search identified no company domain.',
          },
          {
            criterion: 'Active local business',
            result: 'met',
            evidence: `Verified local presence in ${lead.address} with ${lead.reviewCount} reviews.`,
          },
        ],
        sources,
        qualifiedAt: new Date().toISOString(),
      };
    } else if (hasOutdatedCriteria) {
      // User only asked for outdated websites, but this business has NO website at all
      return {
        status: 'Potential',
        confidence: 'Medium',
        reason: 'No website was found to evaluate for outdated signals. May be an opportunity for a brand-new website build.',
        evidence: [
          'Criteria specifically requested outdated websites.',
          'No website exists in available records, so website design/content signals cannot be directly reviewed.',
        ],
        criteriaEvaluation: [
          {
            criterion: 'Outdated website signals',
            result: 'not_applicable',
            evidence: 'Cannot evaluate website age/signals because no website was discovered.',
          },
        ],
        sources,
        qualifiedAt: new Date().toISOString(),
      };
    }
  }

  // Case 2: Lead HAS website with observable outdated or missing conversion signals
  const checklist = lead.structuredFindings?.checklist;
  const outdatedSignals = checklist?.outdatedSignals || [];
  const importantPagesMissing = checklist?.importantPagesMissing || [];
  const hasOutdatedSignals =
    outdatedSignals.length > 0 ||
    checklist?.appearsOutdated === 'Yes' ||
    importantPagesMissing.length > 0 ||
    checklist?.visibleCallToAction === 'No';

  if (hasOutdatedCriteria && hasOutdatedSignals) {
    const evidenceList: string[] = [
      `Official website reviewed at ${lead.website}.`,
      outdatedSignals.length > 0
        ? `Observed design/content signals: ${outdatedSignals.join(', ')}.`
        : 'Website lacks a prominent primary call-to-action on service pages.',
    ];

    if (importantPagesMissing.length > 0) {
      evidenceList.push(`Missing conversion flows: ${importantPagesMissing.join(', ')}.`);
    }

    return {
      status: 'Qualified',
      confidence: 'High',
      reason: 'Matches your criteria because the business website exhibits observable outdated layout signals and lacks clear conversion paths.',
      evidence: evidenceList,
      criteriaEvaluation: [
        {
          criterion: 'Outdated website or conversion issues',
          result: 'met',
          evidence: outdatedSignals.length > 0 ? outdatedSignals.join('; ') : 'Missing online scheduling or instant estimate capture.',
        },
        {
          criterion: 'Active operations',
          result: 'met',
          evidence: `Active business profile with ★ ${lead.rating} (${lead.reviewCount} reviews).`,
        },
      ],
      sources,
      qualifiedAt: new Date().toISOString(),
    };
  }

  // Case 3: Lead HAS an active, modern website with no detectable issues
  if (hasNoWebsiteCriteria && !hasOutdatedCriteria && lead.website) {
    return {
      status: 'Not a match',
      confidence: 'High',
      reason: 'Does not match your criteria because an active official website was found and verified.',
      evidence: [
        `Active official website confirmed at ${lead.website}.`,
        `Website title: "${lead.websiteTitle || 'Active business website'}".`,
        'Search criteria specifically requested businesses without websites.',
      ],
      criteriaEvaluation: [
        {
          criterion: 'No website',
          result: 'not_met',
          evidence: `Verified active website operates at ${lead.website}.`,
        },
      ],
      sources,
      qualifiedAt: new Date().toISOString(),
    };
  }

  // Case 4: Default or ambiguous criteria — Uncertainty handling
  return {
    status: 'Potential',
    confidence: 'Medium',
    reason: `Evaluated against "${criteria}". Available public evidence partially satisfies the criteria, but requires manual confirmation.`,
    evidence: [
      `Public listing reviewed for ${lead.businessName} in ${lead.address}.`,
      lead.website ? `Website present at ${lead.website}.` : 'No website listed in primary directory.',
      'Evidence is insufficient to definitively classify as Qualified or Not a match.',
    ],
    criteriaEvaluation: [
      {
        criterion: criteria,
        result: 'uncertain',
        evidence: 'Public web footprint is ambiguous regarding the exact requirement.',
      },
    ],
    sources,
    qualifiedAt: new Date().toISOString(),
  };
}

/**
 * Qualifies an individual lead against user criteria using evidence from research
 */
export async function qualifySingleLead(
  lead: Lead,
  searchCriteria: string,
  industry: string,
  location: string,
  additionalInstructions?: string,
  mode: 'real' | 'demo' = 'real'
): Promise<QualifyLeadResponse> {
  // Prerequisite check: Cannot qualify a lead that has not been researched
  if (lead.researchStatus !== 'Researched' && !lead.businessSummary && !lead.structuredFindings) {
    return {
      success: false,
      error: 'Research this lead before qualification.',
      code: 'MISSING_RESEARCH',
    };
  }

  // Demo mode: Return deterministic, evidence-based simulated qualification
  if (mode === 'demo' || !lead.isRealData) {
    await new Promise((r) => setTimeout(r, 600));
    const demoData = generateDemoQualificationResult(lead, searchCriteria, industry, location);
    return {
      success: true,
      data: demoData,
    };
  }

  // Real mode: Call server-side Gemini qualification endpoint
  try {
    const response = await fetch('/api/qualification/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchCriteria,
        industry,
        location,
        additionalInstructions,
        lead,
      }),
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      if (resData.code === 'MISSING_API_KEY') {
        return {
          success: false,
          error:
            resData.error ||
            'Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel to enable AI lead qualification.',
          code: 'MISSING_API_KEY',
        };
      }

      return {
        success: false,
        error: resData.error || 'Qualification could not be completed for this lead.',
        code: resData.code || 'QUALIFICATION_ERROR',
      };
    }

    return {
      success: true,
      data: resData.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        'A network error occurred while communicating with the AI Qualification Engine.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Runs controlled batch qualification over a collection of leads
 * Tolerates individual lead failures without stopping the entire run
 */
export async function runControlledBatchQualification(
  leads: Lead[],
  searchCriteria: string,
  industry: string,
  location: string,
  additionalInstructions: string | undefined,
  mode: 'real' | 'demo',
  onLeadStart: (leadId: string) => void,
  onLeadSuccess: (leadId: string, result: QualificationResult) => void,
  onLeadFail: (leadId: string, errorMessage: string) => void,
  concurrency = 2
): Promise<void> {
  // Only qualify leads that have been researched and whose research did not fail
  const eligibleLeads = leads.filter(
    (l) => l.researchStatus === 'Researched' || !!l.businessSummary
  );

  if (eligibleLeads.length === 0) return;

  const queue = [...eligibleLeads];

  async function worker() {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      onLeadStart(current.id);

      try {
        const res = await qualifySingleLead(
          current,
          searchCriteria,
          industry,
          location,
          additionalInstructions,
          mode
        );

        if (res.success && res.data) {
          onLeadSuccess(current.id, res.data);
        } else {
          onLeadFail(
            current.id,
            res.error || 'Qualification could not be completed for this lead.'
          );
        }
      } catch (err: any) {
        onLeadFail(
          current.id,
          err?.message || 'Unexpected error occurred during lead qualification.'
        );
      }

      // Small throttling pause between requests to prevent API rate limits
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const workerCount = Math.min(concurrency, eligibleLeads.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
}
