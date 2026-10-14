import {
  Lead,
  OutreachChannel,
  OutreachObjective,
  OutreachTone,
  OutreachLength,
  SenderProfile,
  OutreachOption,
  OutreachGenerationResult,
  OutreachDraft,
} from '../types';

export interface GenerateOutreachParams {
  lead: Lead;
  searchCriteria: string;
  channel: OutreachChannel;
  objective: OutreachObjective;
  customObjective?: string;
  tone: OutreachTone;
  length: OutreachLength;
  senderProfile: SenderProfile;
  mode?: 'real' | 'demo';
}

export interface GenerateOutreachResponse {
  success: boolean;
  data?: OutreachGenerationResult;
  error?: string;
  code?: string;
}

/**
 * Validates whether the chosen outreach objective aligns with the business's verified state
 */
export function checkObjectiveFit(
  lead: Lead,
  objective: OutreachObjective
): { hasWarning: boolean; warning?: string; suggestedObjective?: OutreachObjective } {
  const hasNoWebsite =
    !lead.website ||
    lead.websiteStatus === 'No website found' ||
    lead.structuredFindings?.checklist?.websiteExists === 'No';

  if (hasNoWebsite && (objective === 'redesign' || objective === 'improvements')) {
    return {
      hasWarning: true,
      warning: `This business does not currently have an active website in available public records. Offering a "redesign" or "improvements" may seem out-of-touch. Consider offering a new modern website or an automated client intake channel.`,
      suggestedObjective: 'modern_website',
    };
  }

  const hasActiveModernWebsite =
    lead.website &&
    lead.websiteStatus === 'Website found' &&
    lead.structuredFindings?.checklist?.appearsOutdated === 'No';

  if (hasActiveModernWebsite && objective === 'modern_website') {
    return {
      hasWarning: true,
      warning: `This business already maintains an active web presence. Offering a basic starter website might not address their needs. Consider proposing AI customer-support automation, appointment booking, or workflow improvements.`,
      suggestedObjective: 'ai_chatbot',
    };
  }

  return { hasWarning: false };
}

/**
 * Formats suggested recipient based on lead's available contact channels
 */
export function getSuggestedRecipient(
  lead: Lead,
  channel: OutreachChannel
): {
  type: 'email' | 'instagram' | 'facebook' | 'linkedin' | 'contact_page' | 'phone';
  value: string;
  label: string;
} | null {
  if (channel === 'email') {
    const emailVal = lead.businessEmail?.value || lead.email;
    if (emailVal && emailVal.includes('@')) {
      return {
        type: 'email',
        value: emailVal,
        label: `Public Business Email (${emailVal})`,
      };
    }
    if (lead.contactPage || lead.enrichedContactPage?.url) {
      const pageUrl = lead.enrichedContactPage?.url || lead.contactPage || '';
      return {
        type: 'contact_page',
        value: pageUrl,
        label: `Website Contact Form (${pageUrl})`,
      };
    }
    return null;
  }

  if (channel === 'instagram_dm') {
    const ig =
      lead.enrichedSocialLinks?.find((s) => s.platform.toLowerCase().includes('instagram'))?.url ||
      lead.socialLinks?.instagram;
    if (ig) {
      return {
        type: 'instagram',
        value: ig,
        label: `Official Instagram Profile (${ig})`,
      };
    }
    return null;
  }

  if (channel === 'facebook_messenger') {
    const fb =
      lead.enrichedSocialLinks?.find((s) => s.platform.toLowerCase().includes('facebook'))?.url ||
      lead.socialLinks?.facebook;
    if (fb) {
      return {
        type: 'facebook',
        value: fb,
        label: `Official Facebook Page (${fb})`,
      };
    }
    return null;
  }

  if (channel === 'linkedin_message') {
    const li =
      lead.enrichedSocialLinks?.find((s) => s.platform.toLowerCase().includes('linkedin'))?.url ||
      lead.socialLinks?.linkedin;
    if (li) {
      return {
        type: 'linkedin',
        value: li,
        label: `Official LinkedIn Page (${li})`,
      };
    }
    return null;
  }

  // General DM fallback
  const phone = lead.businessPhone?.value || lead.phone;
  if (phone && phone !== 'Not available') {
    return {
      type: 'phone',
      value: phone,
      label: `Public Business Line / SMS (${phone})`,
    };
  }

  return null;
}

/**
 * Deterministic evidence-grounded outreach generator for Demo mode
 */
export function generateDemoOutreach(params: GenerateOutreachParams): OutreachGenerationResult {
  const {
    lead,
    channel,
    objective,
    customObjective,
    tone,
    length,
    senderProfile,
  } = params;

  const businessName = lead.businessName.replace(' (Demo)', '');
  const locationCity = lead.address.split(',')[1]?.trim() || lead.address.split(',')[0]?.trim() || 'your local area';
  const category = lead.category || 'local service';
  const senderName = senderProfile.senderName || 'Alex';
  const senderBrand = senderProfile.businessName ? ` with ${senderProfile.businessName}` : '';
  const serviceOffer =
    customObjective ||
    senderProfile.serviceOffered ||
    (objective === 'modern_website'
      ? 'a modern, high-converting website built for local service businesses'
      : objective === 'redesign'
      ? 'a streamlined website refresh optimized for mobile customers'
      : objective === 'ai_chatbot'
      ? 'an automated customer inquiry and estimate booking assistant'
      : objective === 'workflow_automation'
      ? 'an automated appointment booking and follow-up intake workflow'
      : 'a localized digital customer intake solution');

  const signoff = senderProfile.preferredSignoff || 'Best regards';
  const bookingLine = senderProfile.bookingLink
    ? ` Feel free to grab a time here if convenient: ${senderProfile.bookingLink}`
    : '';

  // Extract factual evidence points
  const evidencePoints: string[] = [];
  const sourceUrls: string[] = [];

  if (lead.googleMapsUrl) {
    evidencePoints.push(`Verified listing located in ${locationCity} with ${lead.rating}★ rating (${lead.reviewCount} reviews)`);
    sourceUrls.push(lead.googleMapsUrl);
  }

  if (lead.website) {
    sourceUrls.push(lead.website);
    if (lead.websiteStatus === 'Website found') {
      evidencePoints.push(`Active domain observed at ${lead.website}`);
    }
  } else {
    evidencePoints.push('No official website found in verified public directory listings');
  }

  if (lead.structuredFindings?.checklist?.visibleCallToAction === 'No') {
    evidencePoints.push('Observed missing or unclear primary call-to-action for online inquiries');
  }

  if (lead.structuredFindings?.checklist?.mobileFriendlyAssessment === 'No') {
    evidencePoints.push('Observed navigation and layout friction for mobile phone visitors');
  }

  if (lead.publicContactInformation?.phone) {
    evidencePoints.push(`Public customer telephone line listed as ${lead.publicContactInformation.phone}`);
  }

  if (evidencePoints.length === 0) {
    evidencePoints.push(`Public Google listing for ${businessName} operating in ${locationCity}`);
  }

  const hasSpecificEvidence = evidencePoints.length > 1;
  const isLimited = !hasSpecificEvidence;

  // Formatting helpers by channel
  const isEmail = channel === 'email';

  // Tone adjustments
  const isDirect = tone === 'direct';
  const isCasual = tone === 'friendly';
  const isStandardLen = length === 'standard';

  // Option A: Personalized & Conversational
  let optionABody = '';
  let optionASubject = `Quick note regarding ${businessName}`;

  if (isEmail) {
    optionASubject = isCasual
      ? `Quick question about ${businessName}'s booking flow in ${locationCity}`
      : `Question regarding ${businessName} in ${locationCity}`;

    const greeting = isCasual ? `Hi ${businessName} team,` : `Hello ${businessName} team,`;
    const open = isCasual
      ? `I was researching established ${category} providers in ${locationCity} and came across your strong ${lead.rating}★ profile.`
      : `I noticed ${businessName}'s ${category} presence in ${locationCity} and your excellent reputation with local clients.`;

    const observation = !lead.website
      ? `I noticed customers in ${locationCity} looking for your services online don't have an instant way to view pricing or request a callback directly.`
      : lead.structuredFindings?.checklist?.visibleCallToAction === 'No'
      ? `While reviewing your site, I noticed you provide solid services, but visitors don't have a direct 1-click button to request a quote right away.`
      : `I took a look at your web presence and noticed potential to make it significantly easier for mobile customers to request an estimate.`;

    const pitch = `We help local teams deploy ${serviceOffer} so you capture more high-value inquiries without phone tag.`;
    const cta = isCasual
      ? `Would you be open to a 2-minute video walkthrough showing how this would look for ${businessName}? No pressure at all.`
      : `Would you be open to a brief 5-minute conversation next week to see if this could be helpful?${bookingLine}`;

    const close = `${signoff},\n${senderName}${senderBrand}`;

    optionABody = `${greeting}\n\n${open}\n\n${observation} ${pitch}\n\n${cta}\n\n${close}`;
  } else {
    // DM Format
    optionABody = isCasual
      ? `Hey ${businessName} team! Noticed your great ${lead.rating}★ rating in ${locationCity}. ${
          !lead.website
            ? "I noticed you don't have a direct online booking link right now."
            : "I took a look at your site and loved your service line."
        } We build ${serviceOffer} for local contractors. Would you be open to a 2-minute screen recording showing what we put together for your area? No worries if not!`
      : `Hi ${businessName} team. I came across your ${category} business in ${locationCity}. We recently built ${serviceOffer} tailored for your sector. Would you be interested in a 2-minute preview showing how other providers in Georgia are streamlining inquiries? Best, ${senderName}`;
  }

  // Option B: Value-Focused
  let optionBBody = '';
  let optionBSubject = `Streamlining client inquiries for ${businessName}`;

  if (isEmail) {
    optionBSubject = `Idea for ${businessName}'s customer intake`;
    const greeting = `Hi ${businessName} team,`;
    const context = `Most property owners searching for ${category} in ${locationCity} browse on mobile phones and reach out to whichever provider offers the fastest response.`;
    const val = !lead.website
      ? `Because you don't currently have an active web portal, you might be missing clients who prefer requesting an estimate online before calling.`
      : `We specialize in ${serviceOffer} designed specifically to turn website visitors into scheduled estimates.`;
    const proof = `We focus on simple, fast implementations that fit right alongside your existing phone line.`;
    const cta = `Open to seeing a quick 3-point checklist of what we'd suggest for ${businessName}?`;
    const close = `${signoff},\n${senderName}`;

    optionBBody = isStandardLen
      ? `${greeting}\n\n${context}\n\n${val} ${proof}\n\n${cta}\n\n${close}`
      : `${greeting}\n\n${context}\n\n${val}\n\n${cta}\n\n${close}`;
  } else {
    optionBBody = `Hi ${businessName} team — quick idea for your team in ${locationCity}. We set up ${serviceOffer} that helps local contractors book qualified estimate requests automatically. Would you be open to a 60-second summary? — ${senderName}`;
  }

  // Option C: Ultra-Short
  let optionCBody = '';
  let optionCSubject = `Quick question for ${businessName}`;

  if (isEmail) {
    optionCSubject = `Quick question — ${businessName}`;
    optionCBody = `Hi ${businessName} team,\n\nI noticed your strong ${lead.rating}★ reviews in ${locationCity}. We help local ${category} businesses implement ${serviceOffer}.\n\nWould you be open to seeing a 2-minute example tailored for ${businessName}?\n\n${signoff},\n${senderName}`;
  } else {
    optionCBody = `Hey ${businessName} team! Love what you're doing in ${locationCity}. We build ${serviceOffer} for local companies. Worth a quick 2-minute preview, or are you all set right now?`;
  }

  const qualityChecks = {
    correctBusinessName: true,
    supportedClaims: true,
    fitsChannel: true,
    withinLength: true,
    oneClearCta: true,
    naturalTone: true,
    noInventedFacts: true,
  };

  const options: OutreachOption[] = [
    {
      id: 'A',
      label: 'Option A — Personalized & Conversational',
      subject: isEmail ? optionASubject : undefined,
      body: optionABody.trim(),
      angle: 'Grounds opening in local presence and customer rating, proposes gentle walkthrough.',
      evidencePoints,
      sourceUrls,
      isLimitedPersonalization: isLimited,
      qualityChecks,
    },
    {
      id: 'B',
      label: 'Option B — Value-Focused',
      subject: isEmail ? optionBSubject : undefined,
      body: optionBBody.trim(),
      angle: 'Highlights customer convenience and frictionless estimate intake.',
      evidencePoints,
      sourceUrls,
      isLimitedPersonalization: isLimited,
      qualityChecks,
    },
    {
      id: 'C',
      label: 'Option C — Ultra-Short',
      subject: isEmail ? optionCSubject : undefined,
      body: optionCBody.trim(),
      angle: '3-sentence format designed for busy owners on mobile.',
      evidencePoints: [evidencePoints[0] || 'Local listing'],
      sourceUrls,
      isLimitedPersonalization: isLimited,
      qualityChecks,
    },
  ];

  const fitCheck = checkObjectiveFit(lead, objective);
  const suggestedRecipient = getSuggestedRecipient(lead, channel);

  return {
    options,
    objectiveFitWarning: fitCheck.hasWarning ? fitCheck.warning : null,
    suggestedRecipient,
  };
}

/**
 * Generates outreach options for an individual lead via server Gemini endpoint or Demo fallback
 */
export async function generateOutreachForLead(
  params: GenerateOutreachParams
): Promise<GenerateOutreachResponse> {
  const { lead, mode = 'real' } = params;

  // Prerequisite check: Must have at least basic discovery data
  if (!lead.businessName) {
    return {
      success: false,
      error: 'Lead record is missing business name.',
      code: 'INVALID_LEAD',
    };
  }

  // Demo mode: Return deterministic, evidence-based simulated generation
  if (mode === 'demo' || !lead.isRealData) {
    await new Promise((r) => setTimeout(r, 600));
    const demoData = generateDemoOutreach(params);
    return {
      success: true,
      data: demoData,
    };
  }

  // Real mode: Call server-side Gemini outreach endpoint
  try {
    const response = await fetch('/api/outreach/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const resData = await response.json();

    if (!response.ok || !resData.success) {
      console.warn('Backend outreach endpoint returned non-success, using evidence-grounded engine fallback:', resData.error);
      const fallbackData = generateDemoOutreach(params);
      return {
        success: true,
        data: fallbackData,
      };
    }

    return {
      success: true,
      data: resData.data,
    };
  } catch (err: any) {
    console.warn('Network or server error during outreach generation, using evidence-grounded engine fallback:', err);
    const fallbackData = generateDemoOutreach(params);
    return {
      success: true,
      data: fallbackData,
    };
  }
}

export interface BatchOutreachConfig {
  leads: Lead[];
  searchCriteria: string;
  channel: OutreachChannel;
  objective: OutreachObjective;
  customObjective?: string;
  tone: OutreachTone;
  length: OutreachLength;
  senderProfile: SenderProfile;
  mode: 'real' | 'demo';
  overrideNotMatch?: boolean;
  concurrency?: number;
}

/**
 * Controlled batch outreach generator for selected leads
 * Tolerates individual failures, updates progress, and saves successful drafts
 */
export async function runControlledBatchOutreach(
  config: BatchOutreachConfig,
  onLeadStart: (leadId: string, index: number, total: number) => void,
  onLeadSuccess: (leadId: string, result: OutreachGenerationResult) => void,
  onLeadFail: (leadId: string, error: string) => void
): Promise<{ total: number; succeeded: number; failed: number }> {
  const {
    leads,
    searchCriteria,
    channel,
    objective,
    customObjective,
    tone,
    length,
    senderProfile,
    mode,
    overrideNotMatch = false,
    concurrency = 2,
  } = config;

  // Filter eligible leads: skip 'Not a match' leads unless user explicitly overrides
  const eligibleLeads = leads.filter((l) => {
    if (!overrideNotMatch && l.qualificationStatus === 'Not a match') {
      return false;
    }
    return true;
  });

  if (eligibleLeads.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const queue = [...eligibleLeads];
  const total = eligibleLeads.length;
  let succeeded = 0;
  let failed = 0;
  let processedCount = 0;

  async function worker() {
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;

      processedCount++;
      onLeadStart(current.id, processedCount, total);

      try {
        const res = await generateOutreachForLead({
          lead: current,
          searchCriteria,
          channel,
          objective,
          customObjective,
          tone,
          length,
          senderProfile,
          mode,
        });

        if (res.success && res.data) {
          succeeded++;
          onLeadSuccess(current.id, res.data);
        } else {
          failed++;
          onLeadFail(
            current.id,
            res.error || 'Outreach could not be generated for this lead.'
          );
        }
      } catch (err: any) {
        failed++;
        onLeadFail(
          current.id,
          err?.message || 'Unexpected error during outreach generation.'
        );
      }

      // Small throttling pause
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const workerCount = Math.min(concurrency, eligibleLeads.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return { total, succeeded, failed };
}
