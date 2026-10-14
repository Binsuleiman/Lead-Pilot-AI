import {
  Lead,
  ContactEnrichmentResult,
  EnrichedEmail,
  EnrichedPhone,
  EnrichedContactPage,
  EnrichedSocialProfile,
  PublicBusinessContact,
  ContactSource,
} from '../types';

export interface EnrichLeadParams {
  lead: Lead;
  searchCriteria: string;
  industry: string;
  location: string;
  additionalInstructions?: string;
  mode?: 'real' | 'demo';
}

export interface EnrichLeadResponse {
  success: boolean;
  data?: ContactEnrichmentResult;
  error?: string;
  code?: string;
}

/**
 * Generates deterministic, evidence-based contact enrichment for demo mode
 * strictly reflecting whether a website and public contact channels exist
 */
export function generateDemoContactEnrichmentResult(lead: Lead): ContactEnrichmentResult {
  const sources: ContactSource[] = [];

  // Base source from Google Business listing
  if (lead.googleMapsUrl) {
    sources.push({
      title: `${lead.businessName} Google Business Profile`,
      url: lead.googleMapsUrl,
      sourceType: 'google_business',
      relevance: 'Verified telephone line and geographic dispatch location',
    });
  }

  // 1. Phone handling: preserve existing phone number with high confidence
  const businessPhone: EnrichedPhone = {
    value: lead.phone && lead.phone !== 'Not available' ? lead.phone : 'Not available',
    source: {
      title: 'Google Places Business Profile',
      url: lead.googleMapsUrl || 'https://maps.google.com',
    },
    confidence: lead.phone && lead.phone !== 'Not available' ? 'High' : 'Low',
  };

  // Case A: Business has NO official website
  if (!lead.website || lead.websiteStatus === 'No website found') {
    return {
      enrichmentStatus: businessPhone.value !== 'Not available' ? 'Partial' : 'Not Found',
      businessEmail: {
        value: null,
        status: 'Not Found',
        source: null,
        confidence: 'Low',
      },
      businessPhone,
      contactPage: {
        url: null,
        title: null,
      },
      socialLinks: [],
      publicBusinessContact: {
        name: null,
        role: null,
        source: null,
      },
      contactSources: sources,
      enrichedAt: new Date().toISOString(),
    };
  }

  // Case B: Business HAS official website
  const cleanDomain = lead.website.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  const websiteUrl = lead.website.startsWith('http') ? lead.website : `https://${lead.website}`;
  const contactPageUrl = `${websiteUrl.replace(/\/$/, '')}/contact`;

  sources.push({
    title: `${lead.businessName} Official Website`,
    url: websiteUrl,
    sourceType: 'official_website',
    relevance: 'Primary business web presence and domain verification',
  });

  sources.push({
    title: 'Contact & Service Intake Page',
    url: contactPageUrl,
    sourceType: 'contact_page',
    relevance: 'Public contact intake channel and service dispatch inquiry form',
  });

  // Check if lead already has an observed email in publicContactInformation
  const knownEmail = lead.publicContactInformation?.email || lead.email;
  let businessEmail: EnrichedEmail;

  if (knownEmail && !knownEmail.includes('example.com')) {
    businessEmail = {
      value: knownEmail,
      status: 'Found',
      source: {
        title: 'Official Contact Page',
        url: contactPageUrl,
      },
      confidence: 'High',
    };
  } else {
    // Lead has website but no public email listed on website
    // (Crucial rule: a lead with no email should remain a lead with no email!)
    businessEmail = {
      value: null,
      status: 'Not Found',
      source: null,
      confidence: 'Medium',
    };
  }

  const contactPage: EnrichedContactPage = {
    url: contactPageUrl,
    title: 'Contact Us',
  };

  // Structured official social profiles
  const socialLinks: EnrichedSocialProfile[] = [];
  if (lead.socialLinks?.facebook) {
    socialLinks.push({
      platform: 'Facebook',
      url: lead.socialLinks.facebook,
      source: 'Official website footer',
      confidence: 'High',
    });
  }
  if (lead.socialLinks?.linkedin) {
    socialLinks.push({
      platform: 'LinkedIn',
      url: lead.socialLinks.linkedin,
      source: 'Official website footer',
      confidence: 'High',
    });
  }
  if (lead.socialLinks?.instagram) {
    socialLinks.push({
      platform: 'Instagram',
      url: lead.socialLinks.instagram,
      source: 'Official website footer',
      confidence: 'Medium',
    });
  }

  // Optional public business-facing contact (only if clearly published on website)
  const publicBusinessContact: PublicBusinessContact = {
    name: null,
    role: null,
    source: null,
  };

  // Determine overall status
  const enrichmentStatus =
    businessEmail.status === 'Found'
      ? 'Enriched'
      : contactPageUrl || businessPhone.value !== 'Not available'
      ? 'Partial'
      : 'Not Found';

  return {
    enrichmentStatus,
    businessEmail,
    businessPhone,
    contactPage,
    socialLinks,
    publicBusinessContact,
    contactSources: sources,
    enrichedAt: new Date().toISOString(),
  };
}

/**
 * Enriches an individual lead with public business contact information
 */
export async function enrichSingleLead(
  lead: Lead,
  searchCriteria: string,
  industry: string,
  location: string,
  additionalInstructions?: string,
  mode: 'real' | 'demo' = 'real'
): Promise<EnrichLeadResponse> {
  // Demo mode: Return deterministic, evidence-based simulated enrichment
  if (mode === 'demo' || !lead.isRealData) {
    await new Promise((r) => setTimeout(r, 650));
    const demoData = generateDemoContactEnrichmentResult(lead);
    return {
      success: true,
      data: demoData,
    };
  }

  // Real mode: Call server-side Gemini contact enrichment endpoint
  try {
    const response = await fetch('/api/enrichment/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lead,
        searchCriteria,
        industry,
        location,
        additionalInstructions,
      }),
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      if (resData.code === 'MISSING_API_KEY') {
        return {
          success: false,
          error:
            resData.error ||
            'Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel to enable contact enrichment.',
          code: 'MISSING_API_KEY',
        };
      }

      return {
        success: false,
        error: resData.error || 'Contact enrichment could not be completed for this lead.',
        code: resData.code || 'ENRICHMENT_ERROR',
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
        'A network error occurred while communicating with the Contact Enrichment Engine.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Runs controlled batch enrichment over eligible leads
 * Tolerates individual lead failures without stopping the entire run
 */
export async function runControlledBatchEnrichment(
  leads: Lead[],
  searchCriteria: string,
  industry: string,
  location: string,
  additionalInstructions: string | undefined,
  mode: 'real' | 'demo',
  onLeadStart: (leadId: string) => void,
  onLeadSuccess: (leadId: string, result: ContactEnrichmentResult) => void,
  onLeadFail: (leadId: string, errorMessage: string) => void,
  concurrency = 2
): Promise<void> {
  if (leads.length === 0) return;

  const queue = [...leads];

  async function worker() {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      onLeadStart(current.id);

      try {
        const res = await enrichSingleLead(
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
            res.error || 'Contact enrichment could not be completed for this lead.'
          );
        }
      } catch (err: any) {
        onLeadFail(
          current.id,
          err?.message || 'Unexpected error occurred during contact enrichment.'
        );
      }

      // Small throttling pause between requests to prevent API rate limits
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const workerCount = Math.min(concurrency, leads.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
}
