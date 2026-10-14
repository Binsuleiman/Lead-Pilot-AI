import {
  OrchestrationTask,
  OrchestrationPlanStage,
  OrchestrationStageName,
  OrchestrationTaskStatus,
  OrchestrationExecutionMode,
  NaturalLanguageObjectiveParseResult,
  SenderProfile,
  Lead,
  Search,
  OutreachChannel,
} from '../types';

const STORAGE_KEY_ORCHESTRATION_TASKS_PREFIX = 'leadpilot_orchestration_tasks_';
const STORAGE_KEY_CURRENT_TASK_PREFIX = 'leadpilot_current_task_';

/**
 * Creates default stages for a new execution plan
 */
export function createDefaultStages(mode: OrchestrationExecutionMode): OrchestrationPlanStage[] {
  return [
    {
      name: 'discovery',
      label: '1. Business Discovery',
      description: 'Discover real local business entities via Google Places (New) or simulated dataset.',
      status: 'pending',
      enabled: true,
      requiresApproval: false,
    },
    {
      name: 'research',
      label: '2. Web & Signal Research',
      description: 'Analyze websites, public pages, and online presence with Google Search grounding.',
      status: 'pending',
      enabled: true,
      requiresApproval: false,
    },
    {
      name: 'qualification',
      label: '3. Criteria Qualification',
      description: 'Evaluate each business against criteria and assign Qualified / Potential / Not a match.',
      status: 'pending',
      enabled: true,
      requiresApproval: false,
    },
    {
      name: 'enrichment',
      label: '4. Contact Channel Enrichment',
      description: 'Identify public telephone dispatch lines, verified business email, and decision-makers.',
      status: 'pending',
      enabled: true,
      requiresApproval: false,
    },
    {
      name: 'outreach',
      label: '5. Personalized Outreach Writing',
      description: 'Prepare tailored cold pitches grounded strictly in verified findings (human approval required).',
      status: 'pending',
      enabled: true,
      requiresApproval: true, // Always requires human approval before generating
    },
  ];
}

/**
 * Parses user natural language request via the backend proxy or fallback
 */
export async function parseNaturalLanguageObjective(
  promptText: string,
  existingSettings?: Partial<SenderProfile>
): Promise<NaturalLanguageObjectiveParseResult> {
  try {
    const res = await fetch('/api/orchestrator/parse-objective', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText, existingSettings }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('Network parse error, using client-side deterministic fallback:', err);
  }

  // Client-side deterministic fallback
  const clean = promptText.trim();
  const qtyMatch = clean.match(/\b(\d{1,3})\s*(?:businesses|companies|leads|prospects|contractors|providers)?/i);
  const parsedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 20;

  let location = '';
  const inMatch = clean.match(/\bin\s+([A-Za-z\s,]+?)(?:\s+(?:that|with|without|who|and|offering|having|which|lacking)|\.|$)/i);
  if (inMatch) {
    location = inMatch[1].trim();
  }

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

  let serviceOrOffer = 'Website design and mobile modernization services';
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

  return {
    objective: clean,
    industry: industry || 'Local Businesses',
    location: location || 'United States',
    requestedQuantity: Math.max(1, Math.min(100, parsedQty)),
    criteria,
    serviceOrOffer,
    preferredChannel: 'email',
    additionalInstructions: '',
    missingFields: missing,
    clarificationQuestion: missing.length > 0 ? `Could you specify the target ${missing.join(' and ')}?` : null,
  };
}

/**
 * Validates an orchestration plan before execution (safeguards)
 */
export function validateOrchestrationPlan(task: OrchestrationTask): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!task.taskId || typeof task.taskId !== 'string') {
    errors.push('Missing unique taskId.');
  }
  if (!task.objective || !task.objective.trim()) {
    errors.push('Objective description is required.');
  }
  if (!task.industry || !task.industry.trim()) {
    errors.push('Industry or category is required.');
  }
  if (!task.location || !task.location.trim()) {
    errors.push('Location is required.');
  }
  if (!task.requestedQuantity || task.requestedQuantity < 1 || task.requestedQuantity > 100) {
    errors.push('Lead quantity must be between 1 and 100.');
  }
  if (!Array.isArray(task.criteria) || task.criteria.length === 0) {
    errors.push('At least one qualification criterion is required.');
  }
  if (!Array.isArray(task.stages) || task.stages.length === 0) {
    errors.push('Plan must contain execution stages.');
  }

  const allowedStageNames: OrchestrationStageName[] = [
    'discovery',
    'research',
    'qualification',
    'enrichment',
    'outreach',
  ];
  for (const st of task.stages) {
    if (!allowedStageNames.includes(st.name)) {
      errors.push(`Unauthorized stage name "${st.name}". Only permitted workflow stages are allowed.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Persistence helpers for orchestration tasks
 */
export class OrchestrationStorage {
  static getTasks(mode: 'real' | 'demo'): OrchestrationTask[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_ORCHESTRATION_TASKS_PREFIX}${mode}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static saveTasks(mode: 'real' | 'demo', tasks: OrchestrationTask[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_ORCHESTRATION_TASKS_PREFIX}${mode}`, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to save orchestration tasks:', err);
    }
  }

  static saveTask(mode: 'real' | 'demo', task: OrchestrationTask): void {
    const tasks = this.getTasks(mode);
    const existingIdx = tasks.findIndex((t) => t.taskId === task.taskId);
    if (existingIdx !== -1) {
      tasks[existingIdx] = task;
    } else {
      tasks.unshift(task);
    }
    this.saveTasks(mode, tasks);

    // Also update current active task pointer
    try {
      localStorage.setItem(`${STORAGE_KEY_CURRENT_TASK_PREFIX}${mode}`, JSON.stringify(task));
    } catch {
      // Ignore quota errors
    }
  }

  static getActiveTask(mode: 'real' | 'demo'): OrchestrationTask | null {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_CURRENT_TASK_PREFIX}${mode}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static clearActiveTask(mode: 'real' | 'demo'): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY_CURRENT_TASK_PREFIX}${mode}`);
    } catch {
      // Ignore
    }
  }
}

/**
 * Summarizes a completed or paused task via backend or fallback
 */
export async function summarizeOrchestrationTask(
  task: OrchestrationTask,
  metrics: {
    discoveredCount: number;
    researchedCount: number;
    qualifiedCount: number;
    potentialCount: number;
    notMatchCount: number;
    enrichedCount: number;
    outreachDraftsCount: number;
    failedCount: number;
  }
): Promise<{ summaryText: string; recommendedNextActions: string[] }> {
  try {
    const res = await fetch('/api/orchestrator/summarize-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, metrics }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch {
    // Fallback below
  }

  const summaryText = `Completed prospecting mission for ${task.industry} in ${task.location}. Successfully processed ${metrics.discoveredCount} businesses, identifying ${metrics.qualifiedCount} qualified prospect(s) and ${metrics.potentialCount} potential lead(s). Generated ${metrics.outreachDraftsCount} saved outreach draft(s).`;
  const recommendedNextActions = [
    `Inspect the ${metrics.qualifiedCount} qualified lead(s) in the Leads workspace.`,
    metrics.outreachDraftsCount > 0
      ? `Review the ${metrics.outreachDraftsCount} generated outreach draft(s) before sending.`
      : `Generate personalized outreach drafts for verified prospects.`,
    `Export CSV records for persistent CRM tracking.`,
  ];

  return { summaryText, recommendedNextActions };
}
