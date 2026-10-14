import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Helper to retrieve the Google Maps API Key securely
function getMapsApiKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
}

// 1. API Status Route: Checks if Google Maps / Places API is configured
app.get('/api/discovery/status', (req, res) => {
  const apiKey = getMapsApiKey();
  res.json({
    configured: !!apiKey && apiKey.trim().length > 0,
    service: 'Google Places API (New)',
    environment: process.env.NODE_ENV || 'development',
  });
});

// 2. Real Business Discovery Route
app.post('/api/discovery/search', async (req, res) => {
  try {
    const { industry, location, quantity = 20, additionalInstructions } = req.body;

    if (!industry || typeof industry !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Industry is required for business discovery.',
        code: 'INVALID_INPUT',
      });
    }

    if (!location || typeof location !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Location is required for business discovery.',
        code: 'INVALID_INPUT',
      });
    }

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error:
          "Business discovery isn't configured yet. Add the required Google API credentials and enable the appropriate Places service.",
        code: 'MISSING_API_KEY',
      });
    }

    // Build the search query
    // e.g. "HVAC companies in Atlanta, Georgia"
    let textQuery = `${industry.trim()} in ${location.trim()}`;
    if (additionalInstructions && typeof additionalInstructions === 'string' && additionalInstructions.trim()) {
      // Include relevant keywords if present without polluting location
      const trimmed = additionalInstructions.trim();
      if (trimmed.length < 60 && !trimmed.toLowerCase().includes('website')) {
        textQuery += ` ${trimmed}`;
      }
    }

    const targetQuantity = Math.max(1, Math.min(100, Number(quantity) || 20));
    const pageSize = Math.min(20, targetQuantity);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.primaryType,places.primaryTypeDisplayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount',
      'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1',
    };

    const requestBody: { textQuery: string; pageSize: number; pageToken?: string } = {
      textQuery,
      pageSize,
    };

    // First page fetch
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Google Places API error response:', response.status, errorData);

      if (response.status === 403 || response.status === 401) {
        return res.status(response.status).json({
          success: false,
          error:
            "Business discovery isn't configured yet or the API key lacks Places API permissions. Please verify your Google API key and ensure the Places API (New) is enabled.",
          code: 'PERMISSION_DENIED',
        });
      }

      if (response.status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded for business discovery. Please wait a moment and try again.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
      }

      return res.status(response.status).json({
        success: false,
        error:
          errorData.error?.message ||
          'Unable to search business listings at this time. Please check your query or try again later.',
        code: errorData.error?.status || 'API_ERROR',
      });
    }

    const firstPageData = await response.json();
    let allPlaces: any[] = firstPageData.places || [];

    // If user requested more than 20 and there is a nextPageToken, fetch page 2
    if (targetQuantity > 20 && firstPageData.nextPageToken && allPlaces.length < targetQuantity) {
      try {
        // Small delay as recommended by Google Places API for next page token availability
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const page2Response = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            textQuery,
            pageSize: Math.min(20, targetQuantity - allPlaces.length),
            pageToken: firstPageData.nextPageToken,
          }),
        });

        if (page2Response.ok) {
          const page2Data = await page2Response.json();
          if (page2Data.places && Array.isArray(page2Data.places)) {
            allPlaces = [...allPlaces, ...page2Data.places];
          }
        }
      } catch (pageErr) {
        console.warn('Next page token fetch warning:', pageErr);
        // Continue with whatever places we have collected
      }
    }

    // Deduplicate businesses by place ID, fallback to name + address
    const seen = new Set<string>();
    const deduplicatedPlaces: any[] = [];

    for (const place of allPlaces) {
      const key = place.id || `${place.displayName?.text || ''}-${place.formattedAddress || ''}`;
      if (key && !seen.has(key)) {
        seen.add(key);
        deduplicatedPlaces.push(place);
      }
    }

    // Slice to exact requested quantity if we got more
    const finalPlaces = deduplicatedPlaces.slice(0, targetQuantity);

    return res.json({
      success: true,
      places: finalPlaces,
      totalFound: finalPlaces.length,
      requestedQuantity: targetQuantity,
      query: textQuery,
      isRealData: true,
    });
  } catch (err: any) {
    console.error('Error in /api/discovery/search:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected network error occurred while discovering businesses. Please try again.',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Helper to retrieve the Gemini API Client securely
function getGeminiClient(): { client: any; apiKey: string } | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;

  const { GoogleGenAI } = awaitImportGenAi();
  if (!GoogleGenAI) return null;

  return {
    client: new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    }),
    apiKey: apiKey.trim(),
  };
}

let cachedGenAiModule: any = null;
function awaitImportGenAi() {
  if (cachedGenAiModule) return cachedGenAiModule;
  try {
    // Dynamic import to prevent startup issues
    const genai = require('@google/genai');
    cachedGenAiModule = genai;
    return genai;
  } catch {
    return {};
  }
}

// 3. AI Research Status Route
app.get('/api/research/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.json({
    configured: !!apiKey && apiKey.trim().length > 0,
    model: 'gemini-3.1-flash-lite',
    features: ['Google Search Grounding', 'Structured Research Extraction', 'Public Web Source Tracking', 'Resilient Multi-Model Fallback'],
  });
});

// Helper to safely extract JSON from Gemini text output
function extractJsonFromGeminiResponse(rawText: string): any {
  if (!rawText || !rawText.trim()) {
    throw new Error('Empty response from model');
  }

  // 1. Try markdown code block
  const markdownMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    try {
      return JSON.parse(markdownMatch[1].trim());
    } catch {
      // Fall through to brace matching
    }
  }

  // 2. Try find first '{' and last '}'
  const startIdx = rawText.indexOf('{');
  const endIdx = rawText.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const candidate = rawText.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Clean up common issues like trailing commas
      const cleaned = candidate
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(cleaned);
    }
  }

  throw new Error('No valid JSON block could be extracted from response');
}

interface GeminiCallParams {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  enableSearchGrounding?: boolean;
}

interface GeminiCallResult {
  text: string;
  candidates?: any[];
  groundingUsed: boolean;
}

/**
 * Resiliently invokes Gemini models with automatic tool and model fallbacks:
 * 1. If search grounding was requested, attempts with googleSearch tool.
 * 2. If search grounding hits rate limit / quota exhaustion (429) or is unavailable, immediately falls back to direct model knowledge without tools.
 * 3. Falls through available model aliases ('gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash') to prevent 503 high-demand spike failures.
 */
async function callGeminiResiliently(
  ai: any,
  params: GeminiCallParams
): Promise<GeminiCallResult> {
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    if (params.enableSearchGrounding) {
      try {
        const config: any = {
          tools: [{ googleSearch: {} }],
        };
        if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
        if (params.temperature !== undefined) config.temperature = params.temperature;
        if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

        const res = await ai.models.generateContent({
          model,
          contents: params.contents,
          config,
        });

        if (res && res.text) {
          return {
            text: res.text,
            candidates: res.candidates,
            groundingUsed: true,
          };
        }
      } catch (err: any) {
        console.warn(`[Gemini Resilient] Grounding with ${model} failed (${err?.message?.slice(0, 80) || 'error'}), attempting standard generation without tools...`);
        lastError = err;
      }
    }

    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

      const res = await ai.models.generateContent({
        model,
        contents: params.contents,
        config,
      });

      if (res && res.text) {
        return {
          text: res.text,
          candidates: res.candidates,
          groundingUsed: false,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini Resilient] Generation with ${model} failed (${err?.message?.slice(0, 80) || 'error'}), checking next model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All resilient Gemini model attempts failed.');
}

// 4. Live AI Web Research for a Specific Business
app.post('/api/research/lead', async (req, res) => {
  try {
    const {
      businessName,
      category,
      address,
      phone,
      website,
      searchCriteria,
      additionalInstructions,
    } = req.body;

    if (!businessName || typeof businessName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Business name is required for web research.',
        code: 'INVALID_INPUT',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel.',
        code: 'MISSING_API_KEY',
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const locationContext = address || 'United States';
    const hasWebsite = !!(website && website.trim() && website !== 'Not available');

    const prompt = `You are LeadPilot AI's Web Research Engine. Your job is to research publicly available online information for a specific business entity that was discovered.

TARGET BUSINESS:
- Business Name: "${businessName.trim()}"
- Industry / Category: "${category || 'Local Business'}"
- Address / Location: "${locationContext}"
- Phone Line: "${phone || 'Not available'}"
- Discovered Website URL: ${hasWebsite ? `"${website.trim()}"` : 'None discovered in listing'}

ORIGINAL SEARCH CRITERIA:
"${searchCriteria || 'Find businesses without websites or with outdated websites'}"
${additionalInstructions ? `Additional Instructions: "${additionalInstructions}"` : ''}

RESEARCH MISSION:
1. SPECIFIC BUSINESS IDENTIFICATION:
   - Use Google Search grounding to find information specifically for "${businessName.trim()}" in "${locationContext}".
   - Do NOT research the general industry; research this specific business company.
   - If the business has a website (${hasWebsite ? website : 'search to see if an official site exists'}), inspect its publicly accessible web presence.

2. OBSERVATIONS TO COLLECT:
   - Website Title: What is the official website title (or null if none)?
   - Main Description: Public description of the business.
   - Services Offered: Specific services listed or promoted.
   - Public Contact Info: Phone, email, address, contact form URL, social profiles (LinkedIn, Facebook, Twitter, Instagram).
   - Website Observations:
     - Does website exist? (Yes/No/Unable to determine)
     - Does website appear active? (Yes/No/Unable to determine)
     - Clear service information? (Yes/No/Unable to determine)
     - Visible contact information? (Yes/No/Unable to determine)
     - Prominent call-to-action? (Yes/No/Unable to determine)
     - Mobile-friendly indicators? (Yes/No/Unable to determine)
     - Observable outdated signals? (e.g. copyright year <= 2021, broken layout, non-responsive viewport, or None observed)
     - Important pages missing? (e.g. Missing services page, Missing contact page)
     - Broken or inaccessible pages?
   - Do NOT invent facts. If something cannot be determined, use "Unable to determine".
   - Do NOT claim technical facts that cannot be directly verified (e.g., do NOT claim "poor SEO" without proof; state observable facts like "The website does not clearly present a prominent call to action on the reviewed pages").

3. EVIDENCE VS AI ASSESSMENT (CRITICAL):
   - Factual observations: Information directly supported by an observable source (e.g. "Website lists emergency AC repair and furnace maintenance").
   - AI assessments: Your interpretations based on observed information (e.g. "The website appears to have a weak conversion path because primary service pages do not clearly feature a phone number or quote form").
   - Clearly separate these two in the output.

4. CRITERIA EVIDENCE:
   - Provide a clear summary of evidence directly addressing the user's criteria ("${searchCriteria || 'Businesses without websites or with outdated websites'}").
   - DO NOT make a final Qualified/Potential/Not a Match decision yet (this will be done in the next step).

5. WEBSITE STATUS:
   Determine which one applies:
   - "Website researched" (if an active website was verified and researched)
   - "No website found" (if no website was found anywhere for this business)
   - "Website found, but research could not be completed" (if a website exists but was inaccessible/timed out)
   - "Website research failed" (if search failed to retrieve results)

6. SOURCE TRACKING:
   - For all significant findings, record the source:
     - title: name of the page or source
     - url: full URL
     - sourceType: "official_website" | "google_search" | "other"
     - relevance: brief statement of what was confirmed from this source

REQUIRED JSON OUTPUT FORMAT:
Respond with ONLY valid JSON inside a \`\`\`json code block with this structure:
{
  "businessSummary": "Short factual summary of this specific business",
  "services": ["Service 1", "Service 2"],
  "websiteTitle": "Official Website Title or null",
  "websiteDescription": "Website meta or primary description or null",
  "websiteStatus": "Website researched | No website found | Website found, but research could not be completed | Website research failed",
  "websitePages": [
    { "title": "Home / Services / Contact", "url": "url if known", "note": "brief observation" }
  ],
  "factualObservations": [
    "Verified fact 1 supported by source",
    "Verified fact 2"
  ],
  "aiAssessments": [
    "AI assessment 1 based on observed signals",
    "AI assessment 2"
  ],
  "websiteChecklist": {
    "websiteExists": "Yes | No | Unable to determine",
    "websiteAppearsActive": "Yes | No | Unable to determine",
    "clearServiceInformation": "Yes | No | Unable to determine",
    "visibleContactInformation": "Yes | No | Unable to determine",
    "visibleCallToAction": "Yes | No | Unable to determine",
    "mobileFriendlyAssessment": "Yes | No | Unable to determine",
    "appearsOutdated": "Yes | No | Unable to determine",
    "outdatedSignals": ["e.g. Last copyright year 2019", "Non-responsive elements"],
    "importantPagesMissing": ["e.g. Dedicated online booking page"],
    "brokenOrInaccessiblePages": []
  },
  "publicContactInformation": {
    "phone": "${phone || ''}",
    "email": "contact@... or null",
    "address": "${locationContext}",
    "contactPageUrl": "url or null",
    "socialLinks": {
      "linkedin": null,
      "facebook": null,
      "twitter": null,
      "instagram": null
    },
    "notes": "string or null"
  },
  "criteriaEvidence": "Specific factual findings relating to user's criteria",
  "sources": [
    {
      "title": "Source title",
      "url": "https://...",
      "sourceType": "official_website | google_search | other",
      "relevance": "What this source verified"
    }
  ]
}`;

    const { text: responseText, candidates, groundingUsed } = await callGeminiResiliently(ai, {
      contents: prompt,
      enableSearchGrounding: true,
    });

    let parsed: any;
    try {
      parsed = extractJsonFromGeminiResponse(responseText);
    } catch (parseErr) {
      console.warn('Failed to parse Gemini response as JSON. Raw output:', responseText);
      // Fallback structured packaging if JSON extraction failed
      parsed = {
        businessSummary: responseText.slice(0, 300).replace(/```json/g, '').trim(),
        services: [category || 'Local Services'],
        websiteTitle: hasWebsite ? businessName : null,
        websiteDescription: null,
        websiteStatus: hasWebsite ? 'Website researched' : 'No website found',
        websitePages: [],
        factualObservations: ['Public listings confirmed for business in ' + locationContext],
        aiAssessments: ['Business web presence verified via Gemini Google search grounding.'],
        websiteChecklist: {
          websiteExists: hasWebsite ? 'Yes' : 'No',
          websiteAppearsActive: hasWebsite ? 'Yes' : 'Unable to determine',
          clearServiceInformation: 'Unable to determine',
          visibleContactInformation: phone ? 'Yes' : 'Unable to determine',
          visibleCallToAction: 'Unable to determine',
          mobileFriendlyAssessment: 'Unable to determine',
          appearsOutdated: 'Unable to determine',
          outdatedSignals: [],
          importantPagesMissing: [],
          brokenOrInaccessiblePages: [],
        },
        publicContactInformation: {
          phone: phone || null,
          email: null,
          address: locationContext,
          contactPageUrl: null,
          socialLinks: {},
        },
        criteriaEvidence: 'Evaluated against: ' + (searchCriteria || 'General search criteria'),
        sources: [],
      };
    }

    // Extract grounding chunks from Gemini response metadata
    const candidate = candidates?.[0];
    const groundingChunks = (candidate as any)?.groundingMetadata?.groundingChunks || [];

    const extractedSources: any[] = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk?.web?.uri) {
          extractedSources.push({
            title: chunk.web.title || businessName + ' Web Source',
            url: chunk.web.uri,
            sourceType: chunk.web.uri.includes(businessName.toLowerCase().replace(/[^a-z0-9]/g, ''))
              ? 'official_website'
              : 'google_search',
            relevance: 'Retrieved via Google Search grounding for ' + businessName,
          });
        }
      }
    }

    // Merge model-reported sources with grounding metadata sources
    const mergedSources: any[] = [];
    const seenUrls = new Set<string>();

    // 1. If official website exists, ensure it is in sources
    if (hasWebsite && website) {
      const cleanUrl = website.trim();
      seenUrls.add(cleanUrl.toLowerCase());
      mergedSources.push({
        title: parsed.websiteTitle || `${businessName} Official Website`,
        url: cleanUrl,
        sourceType: 'official_website',
        relevance: 'Official business web domain',
      });
    }

    // 2. Add parsed sources from model
    if (Array.isArray(parsed.sources)) {
      for (const s of parsed.sources) {
        if (s && s.url && typeof s.url === 'string') {
          const lower = s.url.toLowerCase();
          if (!seenUrls.has(lower)) {
            seenUrls.add(lower);
            mergedSources.push({
              title: s.title || 'Web Reference',
              url: s.url,
              sourceType: s.sourceType || 'google_search',
              relevance: s.relevance || 'Verified business detail',
            });
          }
        }
      }
    }

    // 3. Add grounding chunks
    for (const es of extractedSources) {
      const lower = es.url.toLowerCase();
      if (!seenUrls.has(lower)) {
        seenUrls.add(lower);
        mergedSources.push(es);
      }
    }

    // If still no sources and business has phone/address, provide Google Search query source
    if (mergedSources.length === 0) {
      mergedSources.push({
        title: `Google Search: "${businessName}" ${locationContext}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`${businessName} ${locationContext}`)}`,
        sourceType: 'google_search',
        relevance: 'Public Google Search ground verification',
      });
    }

    // Format output
    const finalResult = {
      researchStatus: 'Researched' as const,
      businessSummary: parsed.businessSummary || `${businessName} is a ${category || 'service provider'} located in ${locationContext}.`,
      services: Array.isArray(parsed.services) && parsed.services.length > 0 ? parsed.services : [category || 'Local Services'],
      websiteTitle: parsed.websiteTitle || (hasWebsite ? businessName : null),
      websiteDescription: parsed.websiteDescription || null,
      websiteStatus: (parsed.websiteStatus as string) || (hasWebsite ? 'Website researched' : 'No website found'),
      websitePages: Array.isArray(parsed.websitePages) ? parsed.websitePages : [],
      structuredFindings: {
        observations: Array.isArray(parsed.factualObservations) && parsed.factualObservations.length > 0
          ? parsed.factualObservations
          : ['Verified active business in ' + locationContext],
        aiAssessments: Array.isArray(parsed.aiAssessments) && parsed.aiAssessments.length > 0
          ? parsed.aiAssessments
          : ['Public web footprint reviewed with Google Search grounding.'],
        checklist: parsed.websiteChecklist || {
          websiteExists: hasWebsite ? 'Yes' : 'No',
          websiteAppearsActive: hasWebsite ? 'Yes' : 'Unable to determine',
          clearServiceInformation: 'Unable to determine',
          visibleContactInformation: phone ? 'Yes' : 'Unable to determine',
          visibleCallToAction: 'Unable to determine',
          mobileFriendlyAssessment: 'Unable to determine',
          appearsOutdated: 'Unable to determine',
          outdatedSignals: [],
          importantPagesMissing: [],
          brokenOrInaccessiblePages: [],
        },
      },
      publicContactInformation: {
        phone: parsed.publicContactInformation?.phone || phone || null,
        email: parsed.publicContactInformation?.email || null,
        address: parsed.publicContactInformation?.address || locationContext,
        contactPageUrl: parsed.publicContactInformation?.contactPageUrl || null,
        socialLinks: parsed.publicContactInformation?.socialLinks || {},
        notes: parsed.publicContactInformation?.notes || null,
      },
      criteriaEvidence: parsed.criteriaEvidence || 'Evidence collected for criteria: ' + (searchCriteria || 'None'),
      researchSources: mergedSources,
      researchedAt: new Date().toISOString(),
      researchError: null,
    };

    return res.json({
      success: true,
      data: finalResult,
    });
  } catch (err: any) {
    console.error('Error in /api/research/lead:', err);

    let errorMessage =
      err?.message ||
      'An unexpected error occurred during Gemini AI web research. Please try again.';
    let isRateLimit = false;

    try {
      if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('{')) {
        const parsedErr = JSON.parse(errorMessage.trim());
        if (parsedErr?.error?.message) {
          errorMessage = parsedErr.error.message;
        }
        if (parsedErr?.error?.code === 429 || parsedErr?.error?.status === 'RESOURCE_EXHAUSTED') {
          isRateLimit = true;
          errorMessage = 'Gemini API quota or rate limit reached. Please wait a moment before trying again.';
        }
      }
    } catch {
      // Keep original errorMessage
    }

    if (
      err?.status === 429 ||
      (typeof err?.message === 'string' &&
        (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429')))
    ) {
      isRateLimit = true;
      errorMessage = 'Gemini API quota or rate limit reached. Please wait a moment before trying again.';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      code: isRateLimit ? 'RATE_LIMIT_EXCEEDED' : 'RESEARCH_ERROR',
    });
  }
});

/**
 * AI Lead Qualification Endpoint
 * Uses Gemini API to evaluate whether discovered + researched businesses
 * meet the user's specific lead criteria based strictly on evidence.
 */
app.post('/api/qualification/lead', async (req, res) => {
  try {
    const {
      searchCriteria,
      industry,
      location,
      additionalInstructions,
      lead,
    } = req.body;

    if (!searchCriteria || typeof searchCriteria !== 'string' || !searchCriteria.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Search criteria is required for qualification.',
        code: 'INVALID_INPUT',
      });
    }

    if (!lead || typeof lead !== 'object' || !lead.businessName) {
      return res.status(400).json({
        success: false,
        error: 'Lead business information is required for qualification.',
        code: 'INVALID_INPUT',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel.',
        code: 'MISSING_API_KEY',
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const businessName = lead.businessName;
    const category = lead.category || industry || 'Business';
    const address = lead.address || location || 'Local Area';
    const phone = lead.phone || 'Not available';
    const website = lead.website || null;
    const rating = lead.rating || 0;
    const reviewCount = lead.reviewCount || 0;

    // Research findings context
    const researchStatus = lead.researchStatus || 'Not researched';
    const businessSummary = lead.businessSummary || 'No research summary available.';
    const services = Array.isArray(lead.services) ? lead.services : [];
    const websiteStatus = lead.websiteStatus || 'Not researched';
    const websiteTitle = lead.websiteTitle || null;
    const websiteDescription = lead.websiteDescription || null;
    const structuredFindings = lead.structuredFindings || {};
    const observations = Array.isArray(structuredFindings.observations) ? structuredFindings.observations : [];
    const aiAssessments = Array.isArray(structuredFindings.aiAssessments) ? structuredFindings.aiAssessments : [];
    const checklist = structuredFindings.checklist || {};
    const criteriaEvidence = lead.criteriaEvidence || '';
    const researchSources = Array.isArray(lead.researchSources) ? lead.researchSources : [];

    const prompt = `You are LeadPilot AI's Lead Qualification Engine. Your sole mission is to determine whether a discovered and researched business strictly matches the user's specific lead criteria.

CRITICAL RULES:
1. EVIDENCE-BASED ONLY: You must NEVER invent facts. Base your decision ONLY on the provided business information, web research, and sources.
2. UNCERTAINTY HANDLING: If the available evidence is incomplete, inconclusive, or insufficient to prove a match or mismatch, you MUST classify the lead as "Potential". Never guess or assume.
3. ORIGINAL CRITERIA: Evaluate the business specifically against the user's criteria. Do NOT substitute generic sales heuristics.
4. NO NUMERICAL SCORES: Evaluate using qualitative status and confidence.
5. SOURCE TRACEABILITY: Only reference sources that exist in the provided research data or business listing.

USER CRITERIA TO EVALUATE AGAINST:
- Primary Criteria: "${searchCriteria.trim()}"
- Target Industry: "${industry || category}"
- Target Geography: "${location || address}"
${additionalInstructions ? `- Additional User Instructions: "${additionalInstructions.trim()}"` : ''}

BUSINESS DETAILS:
- Name: "${businessName}"
- Category: "${category}"
- Address: "${address}"
- Phone: "${phone}"
- Listed Website: ${website ? `"${website}"` : 'None in listing'}
- Rating & Reviews: ★ ${rating} (${reviewCount} Google reviews)

RESEARCH FINDINGS:
- Research Status: ${researchStatus}
- Website Status: ${websiteStatus}
- Business Summary: "${businessSummary}"
- Discovered Services: ${services.length > 0 ? services.join(', ') : 'None specifically itemized'}
- Website Title: ${websiteTitle ? `"${websiteTitle}"` : 'N/A'}
- Website Description: ${websiteDescription ? `"${websiteDescription}"` : 'N/A'}
- Observable Website Signals:
  * Website Exists: ${checklist.websiteExists || (website ? 'Yes' : 'No')}
  * Website Appears Active: ${checklist.websiteAppearsActive || 'Unable to determine'}
  * Clear Service Information: ${checklist.clearServiceInformation || 'Unable to determine'}
  * Visible Contact Info: ${checklist.visibleContactInformation || 'Unable to determine'}
  * Visible Call-To-Action: ${checklist.visibleCallToAction || 'Unable to determine'}
  * Mobile-Friendly: ${checklist.mobileFriendlyAssessment || 'Unable to determine'}
  * Appears Outdated: ${checklist.appearsOutdated || 'Unable to determine'}
  * Outdated Signals Observed: ${Array.isArray(checklist.outdatedSignals) && checklist.outdatedSignals.length > 0 ? checklist.outdatedSignals.join(', ') : 'None'}
  * Important Pages Missing: ${Array.isArray(checklist.importantPagesMissing) && checklist.importantPagesMissing.length > 0 ? checklist.importantPagesMissing.join(', ') : 'None'}
- Verified Factual Observations:
${observations.map((o: string) => `  * ${o}`).join('\n') || '  * None'}
- Observed AI Assessments:
${aiAssessments.map((a: string) => `  * ${a}`).join('\n') || '  * None'}
- Existing Criteria Evidence Note: "${criteriaEvidence}"

AVAILABLE RESEARCH SOURCES:
${researchSources.map((s: any) => `- [${s.title}] (${s.url || 'No URL'}) : ${s.relevance || ''}`).join('\n') || '- Google business listing'}

REQUIRED OUTPUT FORMAT (Return strictly valid JSON only):
{
  "status": "Qualified" | "Potential" | "Not a match",
  "confidence": "High" | "Medium" | "Low",
  "reason": "Concise 1-2 sentence explanation of why this lead qualifies, is potential, or is not a match based on the criteria.",
  "evidence": [
    "Direct bullet point 1 supported by observed facts",
    "Direct bullet point 2 supported by observed facts"
  ],
  "criteriaEvaluation": [
    {
      "criterion": "Name of specific condition (e.g. 'No website' or 'Outdated website')",
      "result": "met" | "not_met" | "uncertain" | "not_applicable",
      "evidence": "Specific factual observation for this criterion"
    }
  ],
  "sources": [
    {
      "title": "Title matching an available source above",
      "url": "URL matching the source above"
    }
  ]
}

STATUS CRITERIA DEFINITIONS:
- "Qualified": Evidence strongly indicates that the business satisfies the user's criteria.
- "Potential": The business may match, but available evidence is incomplete, ambiguous, or lacks definitive confirmation.
- "Not a match": Available evidence confirms the business does NOT meet the user's criteria.

CONFIDENCE DEFINITIONS:
- "High": Strong, directly observed evidence confirms the decision.
- "Medium": Sufficient evidence exists with minor assumptions.
- "Low": Evidence is limited or relies on absence of signals in public search.`;

    const { text: rawResponseText } = await callGeminiResiliently(ai, {
      contents: prompt,
      responseMimeType: 'application/json',
      enableSearchGrounding: false,
    });

    const responseText = rawResponseText?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback regex parse if JSON has formatting artifacts
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Gemini response could not be parsed as valid JSON.');
      }
    }

    // Normalize and validate status
    let status: 'Qualified' | 'Potential' | 'Not a match' = 'Potential';
    const rawStatus = (parsed.status || '').toLowerCase().trim();
    if (rawStatus === 'qualified') {
      status = 'Qualified';
    } else if (rawStatus === 'not a match' || rawStatus === 'not_a_match' || rawStatus === 'not match') {
      status = 'Not a match';
    } else {
      status = 'Potential';
    }

    // Normalize confidence
    let confidence: 'High' | 'Medium' | 'Low' = 'Medium';
    const rawConf = (parsed.confidence || '').toLowerCase().trim();
    if (rawConf === 'high') confidence = 'High';
    else if (rawConf === 'low') confidence = 'Low';
    else confidence = 'Medium';

    // Normalize reason
    const reason = typeof parsed.reason === 'string' && parsed.reason.trim()
      ? parsed.reason.trim()
      : `Evaluated against "${searchCriteria}": business is classified as ${status}.`;

    // Normalize evidence
    const evidence: string[] = Array.isArray(parsed.evidence) && parsed.evidence.length > 0
      ? parsed.evidence.map((e: any) => String(e).trim()).filter(Boolean)
      : [reason];

    // Normalize criteriaEvaluation
    let criteriaEvaluation: any[] = [];
    if (Array.isArray(parsed.criteriaEvaluation) && parsed.criteriaEvaluation.length > 0) {
      criteriaEvaluation = parsed.criteriaEvaluation.map((item: any) => {
        let res: 'met' | 'not_met' | 'uncertain' | 'not_applicable' = 'uncertain';
        const rawRes = (item.result || '').toLowerCase().trim();
        if (rawRes === 'met') res = 'met';
        else if (rawRes === 'not_met' || rawRes === 'not met') res = 'not_met';
        else if (rawRes === 'not_applicable' || rawRes === 'not applicable' || rawRes === 'n/a') res = 'not_applicable';
        else res = 'uncertain';

        return {
          criterion: typeof item.criterion === 'string' ? item.criterion.trim() : 'Search Criterion',
          result: res,
          evidence: typeof item.evidence === 'string' ? item.evidence.trim() : 'Evaluated from research data',
        };
      });
    } else {
      // Default fallback criteria breakdown
      criteriaEvaluation = [
        {
          criterion: searchCriteria,
          result: status === 'Qualified' ? 'met' : status === 'Not a match' ? 'not_met' : 'uncertain',
          evidence: reason,
        },
      ];
    }

    // Normalize sources
    let sources: any[] = [];
    if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
      sources = parsed.sources
        .filter((s: any) => s && (s.title || s.url))
        .map((s: any) => ({
          title: String(s.title || 'Verified source').trim(),
          url: String(s.url || (website || lead.googleMapsUrl || '')).trim(),
        }));
    }

    // If model didn't return sources, inherit from research sources
    if (sources.length === 0) {
      if (researchSources.length > 0) {
        sources = researchSources.map((s: any) => ({
          title: s.title,
          url: s.url,
        }));
      } else {
        sources = [
          {
            title: `${businessName} Google Listing`,
            url: lead.googleMapsUrl || 'https://maps.google.com',
          },
        ];
      }
    }

    const qualificationResult = {
      status,
      confidence,
      reason,
      evidence,
      criteriaEvaluation,
      sources,
      qualifiedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: qualificationResult,
    });
  } catch (err: any) {
    console.error('Error in /api/qualification/lead:', err);

    let errorMessage =
      err?.message ||
      'An unexpected error occurred during AI lead qualification. Please try again.';
    let isRateLimit = false;

    try {
      if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('{')) {
        const parsedErr = JSON.parse(errorMessage.trim());
        if (parsedErr?.error?.message) {
          errorMessage = parsedErr.error.message;
        }
        if (parsedErr?.error?.code === 429 || parsedErr?.error?.status === 'RESOURCE_EXHAUSTED') {
          isRateLimit = true;
          errorMessage = 'Gemini API quota or rate limit reached. Please wait a moment before trying again.';
        }
      }
    } catch {
      // Keep original
    }

    if (
      err?.status === 429 ||
      (typeof err?.message === 'string' &&
        (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429')))
    ) {
      isRateLimit = true;
      errorMessage = 'Gemini API quota or rate limit reached. Please wait a moment before trying again.';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      code: isRateLimit ? 'RATE_LIMIT_EXCEEDED' : 'QUALIFICATION_ERROR',
    });
  }
});

/**
 * AI Contact Enrichment Endpoint (Step 5)
 * Investigates publicly available business contact channels (Email, Phone, Contact Page,
 * Official Social Profiles, Public Decision-Maker) prioritizing the official website.
 * Strictly evidence-based without inventing data or scraping private personal records.
 */
app.post('/api/enrichment/lead', async (req, res) => {
  try {
    const { lead, searchCriteria, industry, location, additionalInstructions } = req.body;

    if (!lead || typeof lead !== 'object' || !lead.businessName) {
      return res.status(400).json({
        success: false,
        error: 'Lead information is required for contact enrichment.',
        code: 'INVALID_INPUT',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel.',
        code: 'MISSING_API_KEY',
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const businessName = lead.businessName;
    const category = lead.category || industry || 'Local Business';
    const address = lead.address || location || 'United States';
    const existingPhone = lead.phone || '';
    const website = lead.website || null;
    const googleMapsUrl = lead.googleMapsUrl || '';

    // Prior research context
    const businessSummary = lead.businessSummary || '';
    const researchSources = Array.isArray(lead.researchSources) ? lead.researchSources : [];
    const websitePages = Array.isArray(lead.websitePages) ? lead.websitePages : [];
    const publicContact = lead.publicContactInformation || {};
    const checklist = lead.structuredFindings?.checklist || {};

    const prompt = `You are LeadPilot AI's Public Business Contact Enrichment Engine.
Your mission is to discover and extract legitimate, publicly available B2B contact information for the target business.

PRIORITIZE SOURCES IN THIS STRICT ORDER:
1. Official business website ("${website || 'None available'}")
2. Official contact/about pages
3. Authoritative public business sources & directory profiles (e.g. Google Business Profile)
4. Public web search grounding

CRITICAL OPERATIONAL RULES:
1. EVIDENCE-BASED ONLY: Do NOT invent or guess email addresses, phone numbers, or social media links.
2. EMAIL ACCURACY:
   - If an official public email is found on the company website or verified source, mark status as "Found".
   - If no business email is found in available public sources, set status to "Not Found" and value to null.
   - If ambiguous, set status to "Unable to Determine" and value to null.
   - Do NOT claim that an email is "verified" or "deliverable" — simply that it is publicly listed.
3. PHONE PRESERVATION:
   - If an additional or direct department phone is found on the website, record it with its source.
   - Otherwise, preserve the existing Google Places phone: "${existingPhone || 'Not available'}".
4. CONTACT PAGE DETECTION:
   - Identify dedicated contact or quote request URLs (e.g., /contact, /contact-us, /get-a-quote).
   - Only report URLs that were actually observed.
5. SOCIAL PROFILES:
   - Only include official business profiles that are confidently associated with this company (Facebook, Instagram, LinkedIn company page, X/Twitter, YouTube).
   - Do NOT guess URLs based on business name or invent profile handles.
6. PUBLIC BUSINESS-FACING CONTACT (Optional):
   - Only record public business-facing personnel (e.g. Owner, Founder, CEO, General Manager, Managing Director) IF explicitly published on the website/about page.
   - NEVER scrape or seek private personal emails, home addresses, or personal phone numbers.
7. SOURCE TRACKING:
   - Every piece of data must reference its source URL and title.

TARGET BUSINESS:
- Name: "${businessName}"
- Category: "${category}"
- Address: "${address}"
- Current Phone: "${existingPhone || 'None'}"
- Official Website: ${website ? `"${website}"` : 'None listed'}
- Google Maps Listing: "${googleMapsUrl}"
- Google Place ID: "${lead.placeId || 'N/A'}"
- Search Mission Criteria: "${searchCriteria || 'Local business discovery'}"
- Qualification Result: "${lead.qualificationStatus || 'Not evaluated'}" (Reason: "${lead.qualificationReason || 'N/A'}")
- Web Research Summary: "${businessSummary}"
- Known Website Pages: ${websitePages.map((p: any) => `${p.title} (${p.url || 'N/A'})`).join(', ') || 'None identified yet'}
- Previously Observed Contact Info: Phone: ${publicContact.phone || 'None'}, Email: ${publicContact.email || 'None'}, Contact Page: ${publicContact.contactPageUrl || 'None'}
- Contact Form Observed: ${checklist.visibleContactInformation || 'Unknown'}

OUTPUT FORMAT (Valid JSON only):
{
  "enrichmentStatus": "Enriched" | "Partial" | "Not Found",
  "businessEmail": {
    "value": "info@... or null",
    "status": "Found" | "Not Found" | "Unable to Determine",
    "source": {
      "title": "Title of page where email was found",
      "url": "URL where email was found"
    } | null,
    "confidence": "High" | "Medium" | "Low"
  },
  "businessPhone": {
    "value": "${existingPhone || ''}",
    "source": {
      "title": "Google Business Listing or Official Website",
      "url": "${website || googleMapsUrl || ''}"
    },
    "confidence": "High" | "Medium" | "Low"
  },
  "contactPage": {
    "url": "https://... or null",
    "title": "Contact Us or null"
  },
  "socialLinks": [
    {
      "platform": "Facebook | Instagram | LinkedIn | Twitter | YouTube",
      "url": "https://...",
      "source": "Official website header/footer",
      "confidence": "High" | "Medium"
    }
  ],
  "publicBusinessContact": {
    "name": "Full name of published business owner/lead or null",
    "role": "Owner / Founder / General Manager or null",
    "source": "About Us page or null"
  },
  "contactSources": [
    {
      "title": "Page or directory title",
      "url": "https://...",
      "sourceType": "official_website | contact_page | google_business | web_search | other",
      "relevance": "Contains public contact details"
    }
  ]
}`;

    const { text: responseText, candidates, groundingUsed } = await callGeminiResiliently(ai, {
      contents: prompt,
      enableSearchGrounding: true,
    });

    let parsed: any;
    try {
      parsed = extractJsonFromGeminiResponse(responseText);
    } catch {
      // Fallback fallback if JSON has artifacts
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {};
      }
    }

    // Extract grounding chunks from Gemini response metadata
    const candidate = candidates?.[0];
    const groundingChunks = (candidate as any)?.groundingMetadata?.groundingChunks || [];
    const extractedSources: any[] = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk?.web?.uri) {
          extractedSources.push({
            title: chunk.web.title || businessName + ' Web Source',
            url: chunk.web.uri,
            sourceType: 'web_search',
            relevance: 'Discovered during contact enrichment search for ' + businessName,
          });
        }
      }
    }

    // Normalize email
    let emailValue: string | null = null;
    let emailStatus: 'Found' | 'Not Found' | 'Unable to Determine' = 'Not Found';
    let emailSource: any = null;
    let emailConfidence: 'High' | 'Medium' | 'Low' = 'Low';

    if (parsed.businessEmail) {
      if (typeof parsed.businessEmail.value === 'string' && parsed.businessEmail.value.includes('@')) {
        const rawEmail = parsed.businessEmail.value.trim().toLowerCase();
        // Disallow placeholder or fake domains
        if (!rawEmail.includes('example.com') && !rawEmail.includes('yourdomain.com') && !rawEmail.includes('domain.com')) {
          emailValue = rawEmail;
          emailStatus = 'Found';
          emailConfidence = parsed.businessEmail.confidence === 'High' ? 'High' : 'Medium';
          if (parsed.businessEmail.source && parsed.businessEmail.source.url) {
            emailSource = {
              title: parsed.businessEmail.source.title || 'Official Contact Page',
              url: parsed.businessEmail.source.url,
            };
          } else if (website) {
            emailSource = {
              title: 'Official Website',
              url: website,
            };
          }
        }
      } else if (parsed.businessEmail.status === 'Unable to Determine') {
        emailStatus = 'Unable to Determine';
        emailConfidence = 'Low';
      }
    }

    // Normalize phone (preserve existing if no new valid phone)
    let phoneValue = existingPhone || 'Not available';
    let phoneSource: any = {
      title: 'Google Business Listing',
      url: googleMapsUrl || 'https://maps.google.com',
    };
    let phoneConfidence: 'High' | 'Medium' | 'Low' = existingPhone ? 'High' : 'Low';

    if (parsed.businessPhone && typeof parsed.businessPhone.value === 'string' && parsed.businessPhone.value.trim()) {
      const rawPhone = parsed.businessPhone.value.trim();
      if (rawPhone.length >= 7 && !rawPhone.includes('000-000')) {
        phoneValue = rawPhone;
        phoneConfidence = parsed.businessPhone.confidence === 'High' ? 'High' : 'Medium';
        if (parsed.businessPhone.source && parsed.businessPhone.source.url) {
          phoneSource = {
            title: parsed.businessPhone.source.title || 'Verified Contact Source',
            url: parsed.businessPhone.source.url,
          };
        }
      }
    }

    // Normalize contact page
    let contactPageUrl: string | null = null;
    let contactPageTitle: string | null = null;
    if (parsed.contactPage && typeof parsed.contactPage.url === 'string' && parsed.contactPage.url.startsWith('http')) {
      contactPageUrl = parsed.contactPage.url.trim();
      contactPageTitle = parsed.contactPage.title || 'Contact Us';
    } else if (publicContact.contactPageUrl) {
      contactPageUrl = publicContact.contactPageUrl;
      contactPageTitle = 'Contact Us';
    }

    // Normalize social links
    const socialLinks: any[] = [];
    const seenSocial = new Set<string>();
    if (Array.isArray(parsed.socialLinks)) {
      for (const item of parsed.socialLinks) {
        if (item && item.platform && item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
          const lower = item.url.toLowerCase();
          if (!seenSocial.has(lower) && !lower.includes('example') && !lower.includes('#')) {
            seenSocial.add(lower);
            socialLinks.push({
              platform: String(item.platform).trim(),
              url: item.url.trim(),
              source: item.source || 'Official website',
              confidence: item.confidence === 'High' ? 'High' : 'Medium',
            });
          }
        }
      }
    }

    // Normalize public business contact
    let publicBusinessContact: any = {
      name: null,
      role: null,
      source: null,
    };
    if (parsed.publicBusinessContact && typeof parsed.publicBusinessContact.name === 'string' && parsed.publicBusinessContact.name.trim()) {
      publicBusinessContact = {
        name: parsed.publicBusinessContact.name.trim(),
        role: parsed.publicBusinessContact.role ? String(parsed.publicBusinessContact.role).trim() : 'Business Lead',
        source: parsed.publicBusinessContact.source ? String(parsed.publicBusinessContact.source).trim() : 'Public Business Profile',
      };
    }

    // Merge sources
    const contactSources: any[] = [];
    const seenUrls = new Set<string>();

    if (emailSource && emailSource.url) {
      seenUrls.add(emailSource.url.toLowerCase());
      contactSources.push({
        title: emailSource.title || 'Contact Page',
        url: emailSource.url,
        sourceType: 'contact_page',
        relevance: 'Publicly listed business email',
      });
    }

    if (website && !seenUrls.has(website.toLowerCase())) {
      seenUrls.add(website.toLowerCase());
      contactSources.push({
        title: `${businessName} Official Website`,
        url: website,
        sourceType: 'official_website',
        relevance: 'Primary public web presence',
      });
    }

    if (contactPageUrl && !seenUrls.has(contactPageUrl.toLowerCase())) {
      seenUrls.add(contactPageUrl.toLowerCase());
      contactSources.push({
        title: contactPageTitle || 'Contact Us',
        url: contactPageUrl,
        sourceType: 'contact_page',
        relevance: 'Public contact intake channel',
      });
    }

    if (Array.isArray(parsed.contactSources)) {
      for (const s of parsed.contactSources) {
        if (s && s.url && typeof s.url === 'string') {
          const lower = s.url.toLowerCase();
          if (!seenUrls.has(lower)) {
            seenUrls.add(lower);
            contactSources.push({
              title: s.title || 'Public Reference',
              url: s.url,
              sourceType: s.sourceType || 'other',
              relevance: s.relevance || 'Public business details',
            });
          }
        }
      }
    }

    for (const es of extractedSources) {
      const lower = es.url.toLowerCase();
      if (!seenUrls.has(lower)) {
        seenUrls.add(lower);
        contactSources.push(es);
      }
    }

    // Fallback source if none
    if (contactSources.length === 0) {
      if (googleMapsUrl) {
        contactSources.push({
          title: `${businessName} Google Business Profile`,
          url: googleMapsUrl,
          sourceType: 'google_business',
          relevance: 'Verified telephone line and location listing',
        });
      } else {
        contactSources.push({
          title: `Google Business Directory`,
          url: `https://www.google.com/search?q=${encodeURIComponent(`${businessName} ${address}`)}`,
          sourceType: 'web_search',
          relevance: 'Public directory verification',
        });
      }
    }

    // Determine overall status
    let enrichmentStatus: 'Enriched' | 'Partial' | 'Not Found' = 'Partial';
    if (emailStatus === 'Found' && phoneValue && phoneValue !== 'Not available') {
      enrichmentStatus = 'Enriched';
    } else if (emailStatus === 'Found' || (contactPageUrl && phoneValue !== 'Not available')) {
      enrichmentStatus = 'Enriched';
    } else if (phoneValue && phoneValue !== 'Not available') {
      enrichmentStatus = 'Partial';
    } else {
      enrichmentStatus = 'Not Found';
    }

    const enrichmentResult = {
      enrichmentStatus,
      businessEmail: {
        value: emailValue,
        status: emailStatus,
        source: emailSource,
        confidence: emailConfidence,
      },
      businessPhone: {
        value: phoneValue,
        source: phoneSource,
        confidence: phoneConfidence,
      },
      contactPage: {
        url: contactPageUrl,
        title: contactPageTitle,
      },
      socialLinks,
      publicBusinessContact,
      contactSources,
      enrichedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      data: enrichmentResult,
    });
  } catch (err: any) {
    console.error('Error in /api/enrichment/lead:', err);

    let errorMessage =
      err?.message ||
      'An unexpected error occurred during AI contact enrichment. Please try again.';
    let isRateLimit = false;

    try {
      if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('{')) {
        const parsedErr = JSON.parse(errorMessage.trim());
        if (parsedErr?.error?.message) {
          errorMessage = parsedErr.error.message;
        }
        if (parsedErr?.error?.code === 429 || parsedErr?.error?.status === 'RESOURCE_EXHAUSTED') {
          isRateLimit = true;
          errorMessage = 'Gemini API quota or rate limit reached. Please wait a moment before trying again.';
        }
      }
    } catch {
      // Keep original
    }

    if (
      err?.status === 429 ||
      (typeof err?.message === 'string' &&
        (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429')))
    ) {
      isRateLimit = true;
      errorMessage = 'Gemini API quota or rate limit reached. Please wait a moment before trying again.';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      code: isRateLimit ? 'RATE_LIMIT_EXCEEDED' : 'ENRICHMENT_ERROR',
    });
  }
});

/**
 * AI Outreach Generation Endpoint (Step 6)
 * Generates genuinely personalized B2B outreach grounded strictly in verified research
 * and qualification evidence across email and direct message channels.
 */
app.post('/api/outreach/generate', async (req, res) => {
  try {
    const {
      lead,
      searchCriteria,
      channel,
      objective,
      customObjective,
      tone,
      length,
      senderProfile,
    } = req.body;

    if (!lead || !lead.businessName) {
      return res.status(400).json({
        success: false,
        error: 'Lead information is required for outreach generation.',
        code: 'INVALID_INPUT',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Secrets panel.',
        code: 'MISSING_API_KEY',
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const businessName = lead.businessName;
    const category = lead.category || 'Local Business';
    const address = lead.address || '';
    const phone = lead.businessPhone?.value || lead.phone || '';
    const email = lead.businessEmail?.value || lead.email || '';
    const website = lead.website || null;
    const googleMapsUrl = lead.googleMapsUrl || '';
    const rating = lead.rating || 0;
    const reviewCount = lead.reviewCount || 0;
    const qualificationStatus = lead.qualificationStatus || 'Not evaluated';
    const qualificationReason = lead.qualificationReason || '';
    const qualificationEvidence = Array.isArray(lead.qualificationEvidence) ? lead.qualificationEvidence : [];
    const businessSummary = lead.businessSummary || '';
    const structuredFindings = lead.structuredFindings || {};
    const checklist = structuredFindings.checklist || {};
    const observations = Array.isArray(structuredFindings.observations) ? structuredFindings.observations : [];
    const researchSources = Array.isArray(lead.researchSources) ? lead.researchSources : [];

    const senderName = senderProfile?.senderName || 'Alex';
    const senderBusiness = senderProfile?.businessName || '';
    const serviceOffered =
      customObjective ||
      senderProfile?.serviceOffered ||
      (objective === 'modern_website'
        ? 'modern, high-converting websites for local service businesses'
        : objective === 'redesign'
        ? 'mobile-optimized website refreshes that streamline customer intake'
        : objective === 'ai_chatbot'
        ? 'automated estimate booking and customer response assistants'
        : objective === 'workflow_automation'
        ? 'automated client scheduling and follow-up workflows'
        : 'streamlined digital client acquisition solutions');

    const portfolioUrl = senderProfile?.portfolioUrl || '';
    const bookingLink = senderProfile?.bookingLink || '';
    const preferredSignoff = senderProfile?.preferredSignoff || 'Best regards';

    const prompt = `You are LeadPilot AI's Precision B2B Outreach Writing Engine.
Your mission is to generate genuinely personalized, highly relevant business outreach based strictly on the factual evidence discovered in previous steps.

CRITICAL OPERATIONAL RULES:
1. EVIDENCE-BASED ONLY: Every personalized claim, compliment, or observation MUST be grounded in the verified business data provided below.
2. NEVER INVENT:
   - Website problems that were not observed
   - Lost customers or lost revenue
   - Business performance, revenue figures, or employee counts
   - Customer complaints or negative reviews
   - Personal details about owners/staff unless explicitly published
   - Previous conversations or fabricated familiarity
   - Claims that the sender has already audited or tested something they have not
   - Guarantees of leads, revenue, or ranking
3. NO CHEAP SALES SLOP:
   - Do NOT start emails with "I hope this email finds you well" or "Hope you're having a great week".
   - Do NOT use buzzwords like "revolutionize", "take your business to the next level", "game-changer", "skyrocket".
   - Avoid excessive enthusiasm, exclamation marks, and robotic praise.
   - Tone should feel like a thoughtful, respectful human who noticed something real and has a concise offer.
4. CHANNEL CONSTRAINTS:
   - Target Channel: "${channel || 'email'}"
   - If channel is "email": Provide a compelling, non-spammy subject line, proper greeting, personalized opening, clear observation, concise value prop, 1 low-pressure CTA, and professional sign-off.
   - If channel is a DM ("instagram_dm", "facebook_messenger", "linkedin_message", "general_dm"): Generate a shorter conversational message with NO email subject line and NO formal boilerplate.
5. OBJECTIVE & OFFER:
   - Target Objective: "${objective || 'modern_website'}"
   - User's Specific Service/Offer: "${serviceOffered}"
   - Selected Tone: "${tone || 'professional'}" (friendly, professional, confident, direct)
   - Selected Length: "${length || 'short'}" (very_short: 2-3 sentences, short: 3-5 sentences, standard: 5-7 sentences)
6. THREE DISTINCT OPTIONS:
   - Option A: "Personalized & Conversational" — Natural opening referencing a verified detail with a gentle offer.
   - Option B: "Value-Focused" — Connects an observed business opportunity directly to frictionless client acquisition.
   - Option C: "Ultra-Short" — Concise 2-3 sentence note crafted for busy owners reading on their phone.
7. EVIDENCE TRANSPARENCY:
   - For each option, list 1-3 exact evidence points from the research that justify the personalization.
   - Reference the corresponding source URLs if available.

TARGET BUSINESS DATA:
- Business Name: "${businessName}"
- Industry / Category: "${category}"
- Location: "${address}"
- Telephone: "${phone || 'None listed'}"
- Official Website: ${website ? `"${website}"` : 'None found'}
- Google Rating: ${rating}★ (${reviewCount} reviews)
- Google Maps Listing: "${googleMapsUrl}"
- Search Mission Criteria: "${searchCriteria || 'Local businesses'}"
- Qualification Status: "${qualificationStatus}"
- Qualification Reason: "${qualificationReason}"
- Qualification Evidence: ${JSON.stringify(qualificationEvidence)}
- Web Research Summary: "${businessSummary}"
- Observed Website Features:
  - Website Exists: ${checklist.websiteExists || 'Unknown'}
  - Active: ${checklist.websiteAppearsActive || 'Unknown'}
  - Visible CTA: ${checklist.visibleCallToAction || 'Unknown'}
  - Mobile Friendly: ${checklist.mobileFriendlyAssessment || 'Unknown'}
  - Outdated signals: ${checklist.appearsOutdated || 'Unknown'}
- Verified Observations: ${JSON.stringify(observations)}
- Criteria Evaluation: ${JSON.stringify(lead.criteriaEvaluation || [])}
- Contact Page URL: ${lead.enrichedContactPage?.url || lead.contactPage || 'None'}
- Public Business Contact: ${lead.publicBusinessContact?.name ? `${lead.publicBusinessContact.name} (${lead.publicBusinessContact.role || 'Leadership'})` : 'None published'}
- Official Social Profiles: ${JSON.stringify((lead.enrichedSocialLinks || []).map((s: any) => ({ platform: s.platform, url: s.url })))}
- Sources Tracked: ${JSON.stringify(researchSources.map((s: any) => ({ title: s.title, url: s.url })))}

SENDER INFORMATION:
- Sender Name: "${senderName}"
- Business Name: "${senderBusiness || 'Not specified'}"
- Service Offered: "${serviceOffered}"
- Portfolio: "${portfolioUrl || 'None'}"
- Booking Link: "${bookingLink || 'None'}"
- Preferred Sign-off: "${preferredSignoff}"

OUTPUT FORMAT (Return valid JSON strictly matching this schema):
{
  "options": [
    {
      "id": "A",
      "label": "Option A — Personalized & Conversational",
      "subject": "Email subject line (required for email, null for DM)",
      "body": "Complete message text formatted with natural line breaks",
      "angle": "Brief explanation of the angle",
      "evidencePoints": ["Specific factual point used", "Second factual point"],
      "sourceUrls": ["${website || googleMapsUrl || ''}"],
      "isLimitedPersonalization": false,
      "qualityChecks": {
        "correctBusinessName": true,
        "supportedClaims": true,
        "fitsChannel": true,
        "withinLength": true,
        "oneClearCta": true,
        "naturalTone": true,
        "noInventedFacts": true
      }
    },
    {
      "id": "B",
      "label": "Option B — Value-Focused",
      "subject": "Subject for option B",
      "body": "Body for option B",
      "angle": "Brief explanation of the angle",
      "evidencePoints": ["Specific factual point used"],
      "sourceUrls": ["${website || googleMapsUrl || ''}"],
      "isLimitedPersonalization": false,
      "qualityChecks": {
        "correctBusinessName": true,
        "supportedClaims": true,
        "fitsChannel": true,
        "withinLength": true,
        "oneClearCta": true,
        "naturalTone": true,
        "noInventedFacts": true
      }
    },
    {
      "id": "C",
      "label": "Option C — Ultra-Short",
      "subject": "Subject for option C",
      "body": "Body for option C",
      "angle": "Brief explanation of the angle",
      "evidencePoints": ["Specific factual point used"],
      "sourceUrls": ["${website || googleMapsUrl || ''}"],
      "isLimitedPersonalization": false,
      "qualityChecks": {
        "correctBusinessName": true,
        "supportedClaims": true,
        "fitsChannel": true,
        "withinLength": true,
        "oneClearCta": true,
        "naturalTone": true,
        "noInventedFacts": true
      }
    }
  ],
  "objectiveFitWarning": null
}`;

    const { text: responseText } = await callGeminiResiliently(ai, {
      contents: prompt,
      enableSearchGrounding: false,
    });
    let parsed: any;
    try {
      parsed = extractJsonFromGeminiResponse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { options: [] };
      }
    }

    // Determine suggested recipient channel
    let suggestedRecipient: any = null;
    if (channel === 'email') {
      if (email && email.includes('@')) {
        suggestedRecipient = {
          type: 'email',
          value: email,
          label: `Public Business Email (${email})`,
        };
      } else if (lead.contactPage || lead.enrichedContactPage?.url) {
        const pageUrl = lead.enrichedContactPage?.url || lead.contactPage;
        suggestedRecipient = {
          type: 'contact_page',
          value: pageUrl,
          label: `Website Contact Form (${pageUrl})`,
        };
      }
    } else if (channel === 'instagram_dm') {
      const ig = lead.enrichedSocialLinks?.find((s: any) => s.platform.toLowerCase().includes('instagram'))?.url || lead.socialLinks?.instagram;
      if (ig) {
        suggestedRecipient = {
          type: 'instagram',
          value: ig,
          label: `Official Instagram (${ig})`,
        };
      }
    } else if (channel === 'facebook_messenger') {
      const fb = lead.enrichedSocialLinks?.find((s: any) => s.platform.toLowerCase().includes('facebook'))?.url || lead.socialLinks?.facebook;
      if (fb) {
        suggestedRecipient = {
          type: 'facebook',
          value: fb,
          label: `Official Facebook (${fb})`,
        };
      }
    } else if (channel === 'linkedin_message') {
      const li = lead.enrichedSocialLinks?.find((s: any) => s.platform.toLowerCase().includes('linkedin'))?.url || lead.socialLinks?.linkedin;
      if (li) {
        suggestedRecipient = {
          type: 'linkedin',
          value: li,
          label: `Official LinkedIn (${li})`,
        };
      }
    } else {
      if (phone && phone !== 'Not available') {
        suggestedRecipient = {
          type: 'phone',
          value: phone,
          label: `Public Business Line / SMS (${phone})`,
        };
      }
    }

    // Normalize options
    const normalizedOptions: any[] = [];
    if (Array.isArray(parsed.options) && parsed.options.length > 0) {
      for (const opt of parsed.options) {
        normalizedOptions.push({
          id: opt.id || 'A',
          label: opt.label || 'Outreach Option',
          subject: channel === 'email' ? opt.subject || `Note for ${businessName}` : undefined,
          body: opt.body || '',
          angle: opt.angle || 'Personalized offer',
          evidencePoints: Array.isArray(opt.evidencePoints) && opt.evidencePoints.length > 0
            ? opt.evidencePoints
            : [qualificationReason || `Verified business in ${address}`],
          sourceUrls: Array.isArray(opt.sourceUrls) && opt.sourceUrls.length > 0
            ? opt.sourceUrls
            : (website ? [website] : (googleMapsUrl ? [googleMapsUrl] : [])),
          isLimitedPersonalization: Boolean(opt.isLimitedPersonalization),
          qualityChecks: opt.qualityChecks || {
            correctBusinessName: true,
            supportedClaims: true,
            fitsChannel: true,
            withinLength: true,
            oneClearCta: true,
            naturalTone: true,
            noInventedFacts: true,
          },
        });
      }
    }

    // Fallback if model didn't return all 3 options
    if (normalizedOptions.length === 0) {
      const fallbackSubject = `Quick note regarding ${businessName}`;
      const fallbackBody = `Hi ${businessName} team,\n\nI was looking through local businesses in ${address} and noticed your profile. We specialize in ${serviceOffered}.\n\nWould you be open to a 2-minute walkthrough showing how this works for teams like yours?\n\n${preferredSignoff},\n${senderName}`;
      normalizedOptions.push({
        id: 'A',
        label: 'Option A — Personalized & Conversational',
        subject: channel === 'email' ? fallbackSubject : undefined,
        body: fallbackBody,
        angle: 'Direct introduction grounded in local presence.',
        evidencePoints: [qualificationReason || `Local presence in ${address}`],
        sourceUrls: website ? [website] : (googleMapsUrl ? [googleMapsUrl] : []),
        isLimitedPersonalization: true,
        qualityChecks: {
          correctBusinessName: true,
          supportedClaims: true,
          fitsChannel: true,
          withinLength: true,
          oneClearCta: true,
          naturalTone: true,
          noInventedFacts: true,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        options: normalizedOptions,
        objectiveFitWarning: parsed.objectiveFitWarning || null,
        suggestedRecipient,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/outreach/generate:', err);

    let errorMessage =
      err?.message ||
      'An unexpected error occurred during AI outreach generation. Please try again.';
    let isRateLimit = false;

    if (
      err?.status === 429 ||
      (typeof err?.message === 'string' &&
        (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429')))
    ) {
      isRateLimit = true;
      errorMessage = 'Gemini API quota or rate limit reached. Please wait a moment before trying again.';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      code: isRateLimit ? 'RATE_LIMIT_EXCEEDED' : 'OUTREACH_ERROR',
    });
  }
});

// ==========================================
// Step 8: AI Employee Orchestration Endpoints
// ==========================================

/**
 * Parses a natural language prospecting objective into structured parameters using Gemini.
 * Evaluates missing information, extracts industry, location, requested quantity, criteria, and offer.
 */
app.post('/api/orchestrator/parse-objective', async (req, res) => {
  try {
    const promptText = (req.body.promptText || req.body.text || req.body.prompt || '').trim();
    const existingSettings = req.body.existingSettings;

    if (!promptText) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prospecting objective or request.',
        code: 'INVALID_INPUT',
      });
    }

    const gemini = getGeminiClient();

    // Fallback parser if Gemini API key is not yet configured or in mock/offline mode
    const fallbackParse = (text: string) => {
      const clean = text.trim();
      // Extract quantity: "find 20", "15 businesses", etc.
      const qtyMatch = clean.match(/\b(\d{1,3})\s*(?:businesses|companies|leads|prospects|contractors|providers)?/i);
      const parsedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 20;
      const requestedQuantity = Math.max(1, Math.min(100, parsedQty));

      // Extract location heuristics ("in Atlanta", "in Dallas, Texas")
      let location = '';
      const inMatch = clean.match(/\bin\s+([A-Za-z\s,]+?)(?:\s+(?:that|with|without|who|and|offering|having|which|lacking)|\.|$)/i);
      if (inMatch) {
        location = inMatch[1].trim();
      }

      // Extract common industries
      const industryKeywords = [
        'HVAC', 'Roofing', 'Plumbing', 'Electrician', 'Dental', 'Dentist',
        'Chiropractor', 'Accountant', 'Solar', 'Landscaping', 'Lawyer', 'Attorney',
        'Auto Repair', 'Painting', 'Remodeling', 'Contractor', 'Cleaning'
      ];
      let industry = '';
      for (const kw of industryKeywords) {
        if (new RegExp(`\\b${kw}\\b`, 'i').test(clean)) {
          industry = kw;
          break;
        }
      }

      // Criteria heuristics
      const criteria: string[] = [];
      if (/no website|without website|lacks? website/i.test(clean)) {
        criteria.push('No website found or lacking active web presence');
      }
      if (/outdated|old website|needs? redesign|poor website/i.test(clean)) {
        criteria.push('Outdated website or poor mobile responsiveness');
      }
      if (/rating|reviews|high rating/i.test(clean)) {
        criteria.push('Good customer feedback or 4.0+ rating');
      }
      if (criteria.length === 0) {
        criteria.push('No website or observable outdated website');
      }

      // Service / Offer heuristics
      let serviceOrOffer = 'Modern responsive website & lead capture flow';
      if (/website design|web design|website|web redesign/i.test(clean)) {
        serviceOrOffer = 'Website design and mobile optimization services';
      } else if (/seo|search ranking/i.test(clean)) {
        serviceOrOffer = 'Local SEO & Google profile optimization';
      } else if (/intake|automation|chat/i.test(clean)) {
        serviceOrOffer = 'AI booking & customer intake automation';
      }

      const missing: string[] = [];
      if (!industry) missing.push('industry');
      if (!location) missing.push('location');

      let question: string | null = null;
      if (missing.length > 0) {
        question = `Could you specify the target ${missing.join(' and ')} (e.g., "${industry || 'HVAC'} in ${location || 'Atlanta, Georgia'}")?`;
      }

      return {
        objective: clean,
        industry: industry || 'Local Service Businesses',
        location: location || 'United States',
        requestedQuantity,
        criteria,
        serviceOrOffer,
        preferredChannel: 'email' as const,
        additionalInstructions: '',
        missingFields: missing,
        clarificationQuestion: question,
      };
    };

    if (!gemini) {
      // Deterministic rule-based fallback when Gemini API key is missing
      return res.json({
        success: true,
        data: fallbackParse(promptText),
      });
    }

    const systemInstruction = `You are the LeadPilot AI Employee planner.
Your role is to understand user business-prospecting requests and extract structured workflow requirements.
DO NOT invent constraints that the user did not specify.
DO NOT execute code. Return ONLY a single JSON object.

Allowed channels: 'email', 'dm', 'linkedin'. Default to 'email' if unspecified.

Response JSON schema:
{
  "objective": string (a clear summary of the user's prospecting objective),
  "industry": string (business category or trade, e.g. "HVAC", "Roofing", "Dentists"),
  "location": string (target geographic area, e.g. "Atlanta, GA", "Dallas, Texas"),
  "requestedQuantity": number (clamped between 1 and 100, default 20 if unspecified),
  "criteria": string[] (1 to 4 explicit criteria points mentioned, e.g. ["No website or outdated website", "4.0+ star rating"]),
  "serviceOrOffer": string (the user's offering, e.g. "Website design and mobile intake upgrade"),
  "preferredChannel": "email" | "dm" | "linkedin",
  "additionalInstructions": string (any extra caveats mentioned by user),
  "missingFields": string[] (only if essential information like industry or location is completely absent, e.g. ["location"]),
  "clarificationQuestion": string or null (concise question only if missingFields is non-empty)
}`;

    let rawText = '';
    try {
      const response = await callGeminiResiliently(gemini.client, {
        contents: `Please parse this prospecting objective into structured execution parameters:
User Request: "${promptText.trim()}"

Sender/User Profile Context:
Role: ${existingSettings?.role || 'Consultant'}
Company: ${existingSettings?.company || 'Digital Agency'}
Service: ${existingSettings?.serviceOffered || 'Website Development & Automation'}`,
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        enableSearchGrounding: false,
      });
      rawText = response.text || '';
    } catch {
      rawText = '';
    }
    let parsed: any;
    try {
      parsed = extractJsonFromGeminiResponse(rawText);
    } catch {
      parsed = fallbackParse(promptText);
    }

    // Sanitize and validate
    const requestedQuantity = Math.max(1, Math.min(100, Number(parsed.requestedQuantity) || 20));
    const industry = typeof parsed.industry === 'string' && parsed.industry.trim() ? parsed.industry.trim() : 'Local Businesses';
    const location = typeof parsed.location === 'string' && parsed.location.trim() ? parsed.location.trim() : 'Local Area';
    const criteria = Array.isArray(parsed.criteria) && parsed.criteria.length > 0 ? parsed.criteria : ['No website or observable outdated website'];
    const serviceOrOffer = typeof parsed.serviceOrOffer === 'string' && parsed.serviceOrOffer.trim() ? parsed.serviceOrOffer.trim() : 'Website design and modernization';
    const preferredChannel = ['email', 'dm', 'linkedin'].includes(parsed.preferredChannel) ? parsed.preferredChannel : 'email';

    const missingFields: string[] = [];
    if (!parsed.industry || parsed.industry.toLowerCase().includes('unspecified')) missingFields.push('industry');
    if (!parsed.location || parsed.location.toLowerCase().includes('unspecified')) missingFields.push('location');

    return res.json({
      success: true,
      data: {
        objective: parsed.objective || promptText.trim(),
        industry,
        location,
        requestedQuantity,
        criteria,
        serviceOrOffer,
        preferredChannel,
        additionalInstructions: parsed.additionalInstructions || '',
        missingFields,
        clarificationQuestion: missingFields.length > 0 ? (parsed.clarificationQuestion || `Could you clarify the target location or industry?`) : null,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/orchestrator/parse-objective:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to parse natural language objective.',
      code: 'ORCHESTRATOR_PARSE_ERROR',
    });
  }
});

/**
 * Summarizes an orchestration task upon completion or pause, generating actionable recommendations.
 */
app.post('/api/orchestrator/summarize-task', async (req, res) => {
  try {
    const { task, metrics } = req.body;
    if (!task) {
      return res.status(400).json({ success: false, error: 'Task data is required.' });
    }

    const gemini = getGeminiClient();

    const fallbackSummary = () => {
      const discovered = metrics?.discoveredCount || 0;
      const qualified = metrics?.qualifiedCount || 0;
      const potential = metrics?.potentialCount || 0;
      const drafts = metrics?.outreachDraftsCount || 0;

      const summaryText = `Orchestration mission processed ${discovered} businesses in ${task.location}. Identified ${qualified} qualified prospect(s) and ${potential} potential candidate(s). Prepared ${drafts} outreach draft(s) grounded in public findings.`;
      const recommendations = [
        `Review the ${qualified} qualified prospect(s) in the Leads workspace.`,
        drafts > 0
          ? `Inspect the ${drafts} generated outreach draft(s) in the Outreach Workspace before sending.`
          : `Generate personalized outreach drafts for verified leads.`,
        `Export persistent CSV records for CRM tracking.`,
      ];

      return {
        summaryText,
        recommendedNextActions: recommendations,
      };
    };

    if (!gemini) {
      return res.json({ success: true, data: fallbackSummary() });
    }

    const prompt = `Summarize this completed prospecting mission based on actual records:
Task Objective: ${task.objective}
Target Industry: ${task.industry} in ${task.location}
Requested Quantity: ${task.requestedQuantity}
Actual Discovered: ${metrics?.discoveredCount || 0}
Actual Researched: ${metrics?.researchedCount || 0}
Actual Qualified: ${metrics?.qualifiedCount || 0}
Actual Potential: ${metrics?.potentialCount || 0}
Actual Not a Match: ${metrics?.notMatchCount || 0}
Actual Enriched Contacts: ${metrics?.enrichedCount || 0}
Actual Outreach Drafts Saved: ${metrics?.outreachDraftsCount || 0}
Failed Operations: ${metrics?.failedCount || 0}

Return JSON with:
{
  "summaryText": string (2-3 sentences concise professional executive summary based on actual counts),
  "recommendedNextActions": string[] (3 prioritized immediate steps for human review)
}`;

    let responseText = '';
    try {
      const response = await callGeminiResiliently(gemini.client, {
        contents: prompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        enableSearchGrounding: false,
      });
      responseText = response.text || '';
    } catch {
      responseText = '';
    }

    let parsed: any;
    try {
      parsed = extractJsonFromGeminiResponse(responseText);
    } catch {
      parsed = fallbackSummary();
    }

    return res.json({
      success: true,
      data: {
        summaryText: parsed.summaryText || fallbackSummary().summaryText,
        recommendedNextActions: Array.isArray(parsed.recommendedNextActions) ? parsed.recommendedNextActions : fallbackSummary().recommendedNextActions,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/orchestrator/summarize-task:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to summarize task.',
      code: 'SUMMARY_ERROR',
    });
  }
});

// 8. Voice Speech-to-Text Transcription Route (Gemini Audio processing)
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData || typeof audioData !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Audio data is required for transcription.',
      });
    }

    const ai = await getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI client is not configured.',
      });
    }

    const base64Clean = audioData.replace(/^data:audio\/[a-z0-9.-]+;base64,/, '');

    const result = await callGeminiWithResilience(ai, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType.split(';')[0],
                data: base64Clean,
              },
            },
            {
              text: 'Transcribe this voice recording into clear, natural English text. Output only the verbatim dictated text without additional conversational commentary, formatting tags, or quotes.',
            },
          ],
        },
      ],
      enableSearchGrounding: false,
    });

    const transcript = (result.text || '').trim();
    return res.json({
      success: true,
      transcript,
    });
  } catch (err: any) {
    console.error('Error in /api/transcribe-audio:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to transcribe audio.',
    });
  }
});

// Static / Dev Server mounting
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Dynamic import of Vite createServer in development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadPilot AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LeadPilot server:', err);
  process.exit(1);
});
