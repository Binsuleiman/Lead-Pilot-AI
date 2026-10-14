import { Lead, QualificationStatus, WebsiteStatus } from '../types';

export interface SearchBusinessesParams {
  industry: string;
  location: string;
  quantity?: number;
  additionalInstructions?: string;
  searchId: string;
}

export interface BusinessDiscoveryResult {
  success: boolean;
  leads: Lead[];
  totalFound: number;
  requestedQuantity: number;
  query: string;
  isRealData: boolean;
  errorMessage?: string;
  code?: string;
}

/**
 * Checks if the Google Maps / Places business discovery backend service is configured
 */
export async function checkDiscoveryStatus(): Promise<{ configured: boolean; service: string }> {
  try {
    const res = await fetch('/api/discovery/status');
    if (!res.ok) {
      return { configured: false, service: 'Google Places API (New)' };
    }
    return await res.json();
  } catch {
    return { configured: false, service: 'Google Places API (New)' };
  }
}

/**
 * Normalizes a raw Google Places (New) response item into LeadPilot's Lead data model
 */
export function normalizePlaceToLead(place: any, searchId: string, industry: string): Lead {
  const businessName = place.displayName?.text?.trim() || 'Unnamed Business';
  const category =
    place.primaryTypeDisplayName?.text ||
    (place.primaryType ? place.primaryType.replace(/_/g, ' ') : industry);
  const address = place.formattedAddress || 'Not available';
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || 'Not available';
  const website = place.websiteUri || null;
  const placeId = place.id || '';

  // Safe Google Maps link
  const googleMapsUrl =
    place.googleMapsUri ||
    (placeId
      ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
      : `https://maps.google.com/?q=${encodeURIComponent(`${businessName} ${address}`)}`);

  const rating = typeof place.rating === 'number' ? place.rating : 0;
  const reviewCount = typeof place.userRatingCount === 'number' ? place.userRatingCount : 0;

  // Website status determination according to prompt instructions
  const websiteStatus: WebsiteStatus = website ? 'Website found' : 'No website found';
  const websiteFindings = website
    ? `Website found in business listing data: ${website}`
    : 'No website found in business listing data';

  // Qualification status is set to "Researching" as required until qualification step is implemented
  const qualificationStatus: QualificationStatus = 'Researching';
  const qualificationReason = 'Awaiting AI research';

  const now = new Date().toISOString();

  return {
    id: placeId ? `lead_${placeId}` : `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    searchId,
    businessName,
    category,
    address,
    phone,
    website,
    googleMapsUrl,
    placeId,
    rating,
    reviewCount,
    qualificationStatus,
    qualificationReason,
    websiteStatus,
    websiteFindings,
    researchStatus: 'Not researched',
    businessSummary: undefined,
    services: [],
    websiteTitle: null,
    websiteDescription: null,
    websitePages: [],
    structuredFindings: undefined,
    publicContactInformation: {
      phone: phone !== 'Not available' ? phone : null,
      email: null,
      address: address !== 'Not available' ? address : null,
      contactPageUrl: null,
      socialLinks: {},
    },
    researchSources: [],
    criteriaEvidence: undefined,
    researchedAt: null,
    researchError: null,
    email: null,
    contactPage: null,
    socialLinks: {},
    outreachEmail: null,
    outreachDm: null,
    outreachFollowUp: null,
    isRealData: true,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Executes a real business discovery search via the backend proxy
 */
export async function searchBusinesses(params: SearchBusinessesParams): Promise<BusinessDiscoveryResult> {
  const { industry, location, quantity = 20, additionalInstructions, searchId } = params;

  try {
    const response = await fetch('/api/discovery/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        industry,
        location,
        quantity,
        additionalInstructions,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        leads: [],
        totalFound: 0,
        requestedQuantity: quantity,
        query: `${industry} in ${location}`,
        isRealData: true,
        errorMessage:
          data.error ||
          "Business discovery isn't configured yet. Add the required Google API credentials and enable the appropriate Places service.",
        code: data.code || 'API_ERROR',
      };
    }

    const rawPlaces: any[] = data.places || [];

    // Deduplicate by place ID as primary identifier, fallback to business name + address
    const seen = new Set<string>();
    const normalizedLeads: Lead[] = [];

    for (const place of rawPlaces) {
      const placeId = place.id;
      const dedupeKey = placeId || `${place.displayName?.text || ''}|${place.formattedAddress || ''}`;

      if (dedupeKey && !seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        normalizedLeads.push(normalizePlaceToLead(place, searchId, industry));
      }
    }

    return {
      success: true,
      leads: normalizedLeads,
      totalFound: normalizedLeads.length,
      requestedQuantity: quantity,
      query: data.query || `${industry} in ${location}`,
      isRealData: true,
    };
  } catch (error: any) {
    console.error('searchBusinesses error:', error);
    return {
      success: false,
      leads: [],
      totalFound: 0,
      requestedQuantity: quantity,
      query: `${industry} in ${location}`,
      isRealData: true,
      errorMessage:
        'A network connection error occurred while connecting to the business discovery service. Please verify your connection and try again.',
      code: 'NETWORK_ERROR',
    };
  }
}
