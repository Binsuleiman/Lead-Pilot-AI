import {
  Lead,
  Search,
  SenderProfile,
  OutreachDraft,
  DataSourceMode,
} from '../types';
import { INITIAL_SEARCHES, INITIAL_LEADS } from '../data/demoData';

const STORAGE_KEYS = {
  REAL_SEARCHES: 'leadpilot_real_searches',
  REAL_LEADS: 'leadpilot_real_leads',
  DEMO_SEARCHES: 'leadpilot_demo_searches',
  DEMO_LEADS: 'leadpilot_demo_leads',
  SENDER_PROFILE: 'leadpilot_sender_profile',
  DATA_MODE: 'leadpilot_mode',
  BACKUP_TIMESTAMP: 'leadpilot_last_backup_time',
} as const;

/**
 * Normalizes a business name and address to create a stable identity key
 * for duplicate detection when Google Place ID is unavailable.
 */
export function normalizeBusinessIdentity(name: string, address: string): string {
  const cleanName = name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  const cleanAddress = address
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  return `${cleanName}__${cleanAddress}`;
}

/**
 * Checks if a lead already exists in a given dataset using Place ID or normalized identity
 */
export function findDuplicateLead(
  businessName: string,
  address: string,
  placeId: string | undefined,
  existingLeads: Lead[]
): Lead | null {
  if (placeId && placeId.trim() && placeId !== 'N/A') {
    const matchByPlaceId = existingLeads.find((l) => l.placeId === placeId);
    if (matchByPlaceId) return matchByPlaceId;
  }

  const targetKey = normalizeBusinessIdentity(businessName, address);
  const matchByKey = existingLeads.find((l) => {
    const key = normalizeBusinessIdentity(l.businessName, l.address);
    return key === targetKey;
  });

  return matchByKey || null;
}

/**
 * Merges newly discovered leads into an existing dataset while strictly preserving
 * existing research, qualification findings, contacts, drafts, notes, and tags.
 * If a business was previously discovered, its searchIds array is updated to link
 * it with the new search without clobbering its history.
 */
export function mergeDiscoveredLeads(
  discoveredLeads: Lead[],
  existingLeads: Lead[],
  searchId: string
): { merged: Lead[]; newCount: number; existingUpdatedCount: number } {
  const result: Lead[] = [...existingLeads];
  let newCount = 0;
  let existingUpdatedCount = 0;

  for (const discovered of discoveredLeads) {
    const existingIndex = result.findIndex((item) => {
      if (
        discovered.placeId &&
        discovered.placeId.trim() &&
        discovered.placeId !== 'N/A' &&
        item.placeId === discovered.placeId
      ) {
        return true;
      }
      return (
        normalizeBusinessIdentity(item.businessName, item.address) ===
        normalizeBusinessIdentity(discovered.businessName, discovered.address)
      );
    });

    if (existingIndex >= 0) {
      // Existing lead encountered in another search
      const existing = result[existingIndex];
      const existingSearchIds = Array.isArray(existing.searchIds)
        ? existing.searchIds
        : [existing.searchId];
      const updatedSearchIds = existingSearchIds.includes(searchId)
        ? existingSearchIds
        : [...existingSearchIds, searchId];

      result[existingIndex] = {
        ...existing,
        searchIds: updatedSearchIds,
        rating: discovered.rating || existing.rating,
        reviewCount: discovered.reviewCount || existing.reviewCount,
        phone:
          existing.phone && existing.phone !== 'Not available'
            ? existing.phone
            : discovered.phone,
        website: existing.website || discovered.website,
        googleMapsUrl: existing.googleMapsUrl || discovered.googleMapsUrl,
        updatedAt: new Date().toISOString(),
      };
      existingUpdatedCount++;
    } else {
      // Brand new lead
      result.unshift({
        ...discovered,
        searchId,
        searchIds: [searchId],
        tags: Array.isArray(discovered.tags) ? discovered.tags : [],
        notes: typeof discovered.notes === 'string' ? discovered.notes : '',
        isArchived: false,
        archivedAt: null,
        createdAt: discovered.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      newCount++;
    }
  }

  return { merged: result, newCount, existingUpdatedCount };
}

/**
 * Safe LocalStorage setter with QuotaExceeded error handling
 */
function safeSetItem(key: string, value: string): { success: boolean; error?: string } {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (err: any) {
    console.error(`Storage error writing ${key}:`, err);
    if (
      err.name === 'QuotaExceededError' ||
      err.code === 22 ||
      err.code === 1014 ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ) {
      return {
        success: false,
        error: 'Browser storage quota reached. Please export a backup and clear older searches.',
      };
    }
    return { success: false, error: err.message || 'Unknown storage error' };
  }
}

/**
 * Safe LocalStorage getter with JSON parsing and fallback
 */
function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

export class PersistenceRepository {
  private getKeys(mode: DataSourceMode) {
    return {
      searchesKey: mode === 'real' ? STORAGE_KEYS.REAL_SEARCHES : STORAGE_KEYS.DEMO_SEARCHES,
      leadsKey: mode === 'real' ? STORAGE_KEYS.REAL_LEADS : STORAGE_KEYS.DEMO_LEADS,
    };
  }

  // --- SEARCHES ---

  async getSearches(mode: DataSourceMode): Promise<Search[]> {
    const { searchesKey } = this.getKeys(mode);
    const fallback = mode === 'real' ? [] : INITIAL_SEARCHES;
    return safeGetItem<Search[]>(searchesKey, fallback);
  }

  async getSearchById(id: string, mode: DataSourceMode): Promise<Search | null> {
    const searches = await this.getSearches(mode);
    return searches.find((s) => s.id === id) || null;
  }

  async saveSearch(search: Search, mode: DataSourceMode): Promise<Search> {
    const { searchesKey } = this.getKeys(mode);
    const searches = await this.getSearches(mode);
    const index = searches.findIndex((s) => s.id === search.id);

    let updated: Search[];
    if (index >= 0) {
      updated = [...searches];
      updated[index] = { ...search };
    } else {
      updated = [search, ...searches];
    }

    safeSetItem(searchesKey, JSON.stringify(updated));
    return search;
  }

  async updateSearch(
    id: string,
    updates: Partial<Search>,
    mode: DataSourceMode
  ): Promise<Search | null> {
    const { searchesKey } = this.getKeys(mode);
    const searches = await this.getSearches(mode);
    const index = searches.findIndex((s) => s.id === id);

    if (index < 0) return null;

    const target = { ...searches[index], ...updates };
    searches[index] = target;
    safeSetItem(searchesKey, JSON.stringify(searches));
    return target;
  }

  async deleteSearch(
    id: string,
    mode: DataSourceMode,
    deleteAssociatedLeads = true
  ): Promise<{ deletedSearchId: string; affectedLeadsCount: number }> {
    const { searchesKey, leadsKey } = this.getKeys(mode);
    const searches = await this.getSearches(mode);
    const filteredSearches = searches.filter((s) => s.id !== id);
    safeSetItem(searchesKey, JSON.stringify(filteredSearches));

    let affectedLeadsCount = 0;
    if (deleteAssociatedLeads) {
      const leads = await this.getLeads(mode);
      const remainingLeads = leads.filter((l) => {
        const belongsToSearch = l.searchId === id || (l.searchIds && l.searchIds.includes(id));
        if (belongsToSearch) {
          // If lead belongs to multiple searches, keep it and simply remove this search association
          if (l.searchIds && l.searchIds.length > 1) {
            l.searchIds = l.searchIds.filter((sid) => sid !== id);
            if (l.searchId === id) {
              l.searchId = l.searchIds[0];
            }
            return true;
          }
          affectedLeadsCount++;
          return false;
        }
        return true;
      });

      safeSetItem(leadsKey, JSON.stringify(remainingLeads));
    }

    return { deletedSearchId: id, affectedLeadsCount };
  }

  // --- LEADS ---

  async getLeads(mode: DataSourceMode): Promise<Lead[]> {
    const { leadsKey } = this.getKeys(mode);
    const fallback = mode === 'real' ? [] : INITIAL_LEADS;
    const leads = safeGetItem<Lead[]>(leadsKey, fallback);
    
    // Normalize older records with default fields
    return leads.map((l) => ({
      ...l,
      tags: Array.isArray(l.tags) ? l.tags : [],
      notes: typeof l.notes === 'string' ? l.notes : '',
      isArchived: Boolean(l.isArchived),
      archivedAt: l.archivedAt || null,
      searchIds: Array.isArray(l.searchIds) ? l.searchIds : [l.searchId],
    }));
  }

  async getLeadById(id: string, mode: DataSourceMode): Promise<Lead | null> {
    const leads = await this.getLeads(mode);
    return leads.find((l) => l.id === id) || null;
  }

  async saveLead(lead: Lead, mode: DataSourceMode): Promise<Lead> {
    const { leadsKey } = this.getKeys(mode);
    const leads = await this.getLeads(mode);
    const index = leads.findIndex((l) => l.id === lead.id);

    const now = new Date().toISOString();
    const enrichedLead: Lead = {
      ...lead,
      updatedAt: now,
      tags: Array.isArray(lead.tags) ? lead.tags : [],
      notes: typeof lead.notes === 'string' ? lead.notes : '',
      isArchived: Boolean(lead.isArchived),
      searchIds: Array.isArray(lead.searchIds) ? lead.searchIds : [lead.searchId],
    };

    let updated: Lead[];
    if (index >= 0) {
      updated = [...leads];
      updated[index] = enrichedLead;
    } else {
      updated = [enrichedLead, ...leads];
    }

    safeSetItem(leadsKey, JSON.stringify(updated));
    return enrichedLead;
  }

  async saveLeads(newLeads: Lead[], mode: DataSourceMode): Promise<Lead[]> {
    const { leadsKey } = this.getKeys(mode);
    const existing = await this.getLeads(mode);
    const existingMap = new Map(existing.map((l) => [l.id, l]));

    for (const lead of newLeads) {
      existingMap.set(lead.id, {
        ...lead,
        tags: Array.isArray(lead.tags) ? lead.tags : [],
        notes: typeof lead.notes === 'string' ? lead.notes : '',
        isArchived: Boolean(lead.isArchived),
        searchIds: Array.isArray(lead.searchIds) ? lead.searchIds : [lead.searchId],
        updatedAt: new Date().toISOString(),
      });
    }

    const merged = Array.from(existingMap.values());
    safeSetItem(leadsKey, JSON.stringify(merged));
    return merged;
  }

  async updateLead(
    id: string,
    updates: Partial<Lead>,
    mode: DataSourceMode
  ): Promise<Lead | null> {
    const { leadsKey } = this.getKeys(mode);
    const leads = await this.getLeads(mode);
    const index = leads.findIndex((l) => l.id === id);

    if (index < 0) return null;

    const now = new Date().toISOString();
    const target: Lead = {
      ...leads[index],
      ...updates,
      updatedAt: now,
    };

    leads[index] = target;
    safeSetItem(leadsKey, JSON.stringify(leads));
    return target;
  }

  async deleteLead(id: string, mode: DataSourceMode): Promise<boolean> {
    const { leadsKey } = this.getKeys(mode);
    const leads = await this.getLeads(mode);
    const filtered = leads.filter((l) => l.id !== id);

    safeSetItem(leadsKey, JSON.stringify(filtered));
    return true;
  }

  async archiveLead(id: string, mode: DataSourceMode): Promise<Lead | null> {
    return this.updateLead(
      id,
      { isArchived: true, archivedAt: new Date().toISOString() },
      mode
    );
  }

  async restoreLead(id: string, mode: DataSourceMode): Promise<Lead | null> {
    return this.updateLead(
      id,
      { isArchived: false, archivedAt: null },
      mode
    );
  }

  async bulkArchiveLeads(ids: string[], mode: DataSourceMode): Promise<number> {
    const { leadsKey } = this.getKeys(mode);
    const leads = await this.getLeads(mode);
    const now = new Date().toISOString();
    let count = 0;

    const next = leads.map((l) => {
      if (ids.includes(l.id)) {
        count++;
        return { ...l, isArchived: true, archivedAt: now, updatedAt: now };
      }
      return l;
    });

    safeSetItem(leadsKey, JSON.stringify(next));
    return count;
  }

  async bulkRestoreLeads(ids: string[], mode: DataSourceMode): Promise<number> {
    const { leadsKey } = this.getKeys(mode);
    const leads = await this.getLeads(mode);
    const now = new Date().toISOString();
    let count = 0;

    const next = leads.map((l) => {
      if (ids.includes(l.id)) {
        count++;
        return { ...l, isArchived: false, archivedAt: null, updatedAt: now };
      }
      return l;
    });

    safeSetItem(leadsKey, JSON.stringify(next));
    return count;
  }

  async bulkDeleteLeads(ids: string[], mode: DataSourceMode): Promise<number> {
    const { leadsKey } = this.getKeys(mode);
    const leads = await this.getLeads(mode);
    const next = leads.filter((l) => !ids.includes(l.id));
    const deletedCount = leads.length - next.length;

    safeSetItem(leadsKey, JSON.stringify(next));
    return deletedCount;
  }

  async bulkAddTag(ids: string[], tag: string, mode: DataSourceMode): Promise<number> {
    const cleanTag = tag.trim();
    if (!cleanTag) return 0;

    const { leadsKey } = this.getKeys(mode);
    const leads = await this.getLeads(mode);
    const now = new Date().toISOString();
    let count = 0;

    const next = leads.map((l) => {
      if (ids.includes(l.id)) {
        const existingTags = Array.isArray(l.tags) ? l.tags : [];
        if (!existingTags.includes(cleanTag)) {
          count++;
          return {
            ...l,
            tags: [...existingTags, cleanTag],
            updatedAt: now,
          };
        }
      }
      return l;
    });

    safeSetItem(leadsKey, JSON.stringify(next));
    return count;
  }

  async bulkRemoveTag(ids: string[], tag: string, mode: DataSourceMode): Promise<number> {
    const { leadsKey } = this.getKeys(mode);
    const leads = await this.getLeads(mode);
    const now = new Date().toISOString();
    let count = 0;

    const next = leads.map((l) => {
      if (ids.includes(l.id)) {
        const existingTags = Array.isArray(l.tags) ? l.tags : [];
        if (existingTags.includes(tag)) {
          count++;
          return {
            ...l,
            tags: existingTags.filter((t) => t !== tag),
            updatedAt: now,
          };
        }
      }
      return l;
    });

    safeSetItem(leadsKey, JSON.stringify(next));
    return count;
  }

  // --- OUTREACH DRAFTS ---

  async saveOutreachDraft(
    leadId: string,
    draftData: Omit<OutreachDraft, 'id' | 'createdAt' | 'updatedAt'>,
    mode: DataSourceMode
  ): Promise<{ lead: Lead; draft: OutreachDraft }> {
    const now = new Date().toISOString();
    const newDraft: OutreachDraft = {
      ...draftData,
      id: `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    const lead = await this.getLeadById(leadId, mode);
    if (!lead) {
      throw new Error(`Lead with ID ${leadId} not found`);
    }

    const existingDrafts = Array.isArray(lead.outreachDrafts) ? lead.outreachDrafts : [];
    const updatedLead: Lead = {
      ...lead,
      outreachDrafts: [newDraft, ...existingDrafts],
      activeDraftId: newDraft.id,
      updatedAt: now,
    };

    await this.saveLead(updatedLead, mode);
    return { lead: updatedLead, draft: newDraft };
  }

  async getOutreachDrafts(leadId: string, mode: DataSourceMode): Promise<OutreachDraft[]> {
    const lead = await this.getLeadById(leadId, mode);
    return lead && Array.isArray(lead.outreachDrafts) ? lead.outreachDrafts : [];
  }

  // --- SENDER SETTINGS ---

  async saveSettings(settings: SenderProfile): Promise<SenderProfile> {
    safeSetItem(STORAGE_KEYS.SENDER_PROFILE, JSON.stringify(settings));
    return settings;
  }

  async getSettings(): Promise<SenderProfile> {
    return safeGetItem<SenderProfile>(STORAGE_KEYS.SENDER_PROFILE, {
      senderName: 'Alex Mercer',
      businessName: 'Apex Digital Studio',
      serviceOffered: 'modern website design and automated client intake workflows',
      portfolioUrl: '',
      bookingLink: '',
      preferredSignoff: 'Best regards',
    });
  }

  // --- BACKUP & RESTORATION (PORTABILITY) ---

  exportCompleteBackupJson(mode: DataSourceMode, searches: Search[], leads: Lead[], sender: SenderProfile): string {
    const backupObject = {
      app: 'LeadPilot AI',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      mode,
      meta: {
        totalSearches: searches.length,
        totalLeads: leads.length,
        totalQualified: leads.filter((l) => l.qualificationStatus === 'Qualified').length,
        totalDrafts: leads.reduce(
          (acc, l) => acc + (Array.isArray(l.outreachDrafts) ? l.outreachDrafts.length : 0),
          0
        ),
      },
      senderProfile: sender,
      searches,
      leads,
    };

    return JSON.stringify(backupObject, null, 2);
  }

  validateAndImportBackupJson(
    jsonString: string,
    mode: DataSourceMode
  ): {
    success: boolean;
    importedSearchesCount: number;
    importedLeadsCount: number;
    error?: string;
    preview?: {
      searchCount: number;
      leadCount: number;
      exportedAt?: string;
    };
  } {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        return { success: false, importedSearchesCount: 0, importedLeadsCount: 0, error: 'Invalid JSON format.' };
      }

      if (!Array.isArray(parsed.searches) || !Array.isArray(parsed.leads)) {
        return {
          success: false,
          importedSearchesCount: 0,
          importedLeadsCount: 0,
          error: 'Backup structure mismatch: Missing searches or leads arrays.',
        };
      }

      // Merge and save safely
      const { searchesKey, leadsKey } = this.getKeys(mode);

      // Validate searches have IDs
      const validSearches: Search[] = parsed.searches.filter(
        (s: any) => s && typeof s.id === 'string' && typeof s.name === 'string'
      );

      // Validate leads have IDs
      const validLeads: Lead[] = parsed.leads.filter(
        (l: any) => l && typeof l.id === 'string' && typeof l.businessName === 'string'
      );

      // Save to storage
      safeSetItem(searchesKey, JSON.stringify(validSearches));
      safeSetItem(leadsKey, JSON.stringify(validLeads));

      if (parsed.senderProfile && typeof parsed.senderProfile === 'object') {
        safeSetItem(STORAGE_KEYS.SENDER_PROFILE, JSON.stringify(parsed.senderProfile));
      }

      return {
        success: true,
        importedSearchesCount: validSearches.length,
        importedLeadsCount: validLeads.length,
        preview: {
          searchCount: validSearches.length,
          leadCount: validLeads.length,
          exportedAt: parsed.exportedAt,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        importedSearchesCount: 0,
        importedLeadsCount: 0,
        error: err?.message || 'Could not parse JSON backup file.',
      };
    }
  }
}

export const persistenceService = new PersistenceRepository();
