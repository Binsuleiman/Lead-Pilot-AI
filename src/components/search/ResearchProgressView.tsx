import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import {
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  Globe,
  FileCheck,
  Mail,
  Zap,
  Bot,
  AlertCircle,
  RotateCcw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export const ResearchProgressView: React.FC = () => {
  const {
    inProgressSearch,
    researchStep,
    isResearching,
    finishResearchNow,
    setCurrentTab,
    dataSourceMode,
    researchLogs,
    researchError,
    startNewSearch,
    setDataSourceMode,
    isBatchResearching,
    batchResearchProgress,
    isBatchQualifying,
    batchQualifyProgress,
    qualifyAllLeads,
    isBatchEnriching,
    batchEnrichProgress,
    enrichAllLeads,
    isBatchOutreachGenerating,
    batchOutreachProgress,
    leads,
  } = useApp();

  // If there is no search in progress and not researching, let user start one
  if (!inProgressSearch && !isResearching && !researchError) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">No active research mission</h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          Start a new search to watch your AI employee discover and qualify businesses.
        </p>
        <button
          onClick={() => setCurrentTab('new-search')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-xs"
        >
          Start New Search
        </button>
      </div>
    );
  }

  const isReal = dataSourceMode === 'real';

  // 7 sequential stages representing exact application state
  const stages = [
    {
      id: 1,
      name: 'Understanding your criteria',
      description: 'Parsing industry parameters, local geography, and qualification rules.',
      icon: Bot,
    },
    {
      id: 2,
      name: 'Finding businesses',
      description: isReal
        ? 'Querying Google Places (New) for verified local businesses matching your search.'
        : 'Discovering active service providers, contractors, and local listings.',
      icon: Search,
    },
    {
      id: 3,
      name: 'Researching businesses',
      description:
        'Gemini Google Search grounding to research websites, public web presence, and criteria evidence.',
      icon: Globe,
    },
    {
      id: 4,
      name: 'Checking websites',
      description:
        'Automated DOM analysis, mobile responsiveness, and technical scans.',
      icon: Clock,
    },
    {
      id: 5,
      name: 'Qualifying leads',
      description:
        'Evaluating candidates strictly against your criteria to filter matches.',
      icon: FileCheck,
    },
    {
      id: 6,
      name: 'Finding contact information',
      description:
        'Enriching decision-maker emails, dispatch lines, and contact pages.',
      icon: Mail,
    },
    {
      id: 7,
      name: 'Preparing outreach',
      description:
        'AI-crafted personalized email, SMS, and direct message sequences.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md text-xs font-semibold">
              {isReal ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Real Business Discovery
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Demo Mode Simulation
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {isResearching
                ? `Searching for ${inProgressSearch?.name}`
                : researchError
                ? 'Search Interrupted'
                : `Completed ${inProgressSearch?.name}`}
            </h2>
            <p className="text-xs text-zinc-500">
              {isReal
                ? 'Connecting to Google Places discovery engine to return actual verified listings.'
                : 'Executing full automated research and qualification demo simulation.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isReal && isResearching && (
              <button
                onClick={finishResearchNow}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 transition-colors shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Instant Finish</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('new-search')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 transition-colors shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-500" />
              <span>Edit Criteria</span>
            </button>

            {!isResearching && (
              <button
                onClick={() => setCurrentTab('leads')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-2xs"
              >
                <span>View Leads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Real Progress Status / Stage description */}
        <div className="mt-5 p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-700 font-medium">
            {isBatchOutreachGenerating ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : isBatchEnriching ? (
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            ) : isBatchQualifying ? (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : isBatchResearching ? (
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
            ) : isResearching ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : researchError ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>
              {isBatchOutreachGenerating
                ? `Crafting personalized outreach (${
                    batchOutreachProgress.completed + 1 <= batchOutreachProgress.total
                      ? batchOutreachProgress.completed + 1
                      : batchOutreachProgress.total
                  } of ${batchOutreachProgress.total} leads)${
                    batchOutreachProgress.currentLeadName
                      ? `: ${batchOutreachProgress.currentLeadName}`
                      : ''
                  }`
                : isBatchEnriching
                ? `Enriching contact channels (${
                    batchEnrichProgress.completed + 1 <= batchEnrichProgress.total
                      ? batchEnrichProgress.completed + 1
                      : batchEnrichProgress.total
                  } of ${batchEnrichProgress.total} leads)${
                    batchEnrichProgress.currentLeadName
                      ? `: ${batchEnrichProgress.currentLeadName}`
                      : ''
                  }`
                : isBatchQualifying
                ? `Qualifying ${
                    batchQualifyProgress.completed + 1 <= batchQualifyProgress.total
                      ? batchQualifyProgress.completed + 1
                      : batchQualifyProgress.total
                  } of ${batchQualifyProgress.total} leads${
                    batchQualifyProgress.currentLeadName
                      ? `: ${batchQualifyProgress.currentLeadName}`
                      : ''
                  }`
                : isBatchResearching
                ? `Researching ${
                    batchResearchProgress.completed + 1 <= batchResearchProgress.total
                      ? batchResearchProgress.completed + 1
                      : batchResearchProgress.total
                  } of ${batchResearchProgress.total} leads${
                    batchResearchProgress.currentLeadName
                      ? `: ${batchResearchProgress.currentLeadName}`
                      : ''
                  }`
                : isResearching
                ? isReal
                  ? 'Searching business listings...'
                  : `Stage ${researchStep} of 7: ${stages[researchStep - 1]?.name || 'Working'}`
                : researchError
                ? 'Discovery encountered an issue'
                : 'Business discovery completed successfully'}
            </span>
          </div>

          <span className="text-[11px] font-mono text-zinc-400">
            {isReal ? 'Real Places API' : 'Sample Data Mode'}
          </span>
        </div>

        {/* Error notification if search failed */}
        {researchError && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-900 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-950">Business Discovery Notice</h4>
                <p className="text-xs text-rose-800/90 mt-1 leading-relaxed">{researchError}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              {inProgressSearch && (
                <button
                  onClick={() =>
                    startNewSearch({
                      industry: inProgressSearch.industry,
                      location: inProgressSearch.location,
                      quantity: inProgressSearch.quantity,
                      criteria: inProgressSearch.criteria,
                      additionalInstructions: inProgressSearch.additionalInstructions,
                    })
                  }
                  className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Search</span>
                </button>
              )}

              <button
                onClick={() => {
                  setDataSourceMode('demo');
                  if (inProgressSearch) {
                    startNewSearch({
                      industry: inProgressSearch.industry,
                      location: inProgressSearch.location,
                      quantity: inProgressSearch.quantity,
                      criteria: inProgressSearch.criteria,
                      additionalInstructions: inProgressSearch.additionalInstructions,
                    });
                  }
                }}
                className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <span>Switch to Demo Mode to Test UI</span>
              </button>

              <button
                onClick={() => setCurrentTab('new-search')}
                className="px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 font-semibold"
              >
                Change Parameters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Stages list on left, Execution Log on right */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* 7 Stages (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Research Stages
          </h3>

          <div className="space-y-2.5">
            {(() => {
              const currentSearchLeads = inProgressSearch
                ? leads.filter((l) => l.searchId === inProgressSearch.id)
                : leads;
              const hasResearched = currentSearchLeads.some(
                (l) => l.researchStatus === 'Researched' || !!l.businessSummary
              );
              const allQualified =
                currentSearchLeads.length > 0 &&
                currentSearchLeads.every((l) =>
                  ['Qualified', 'Potential', 'Not a match'].includes(l.qualificationStatus)
                );
              const hasEnriched = currentSearchLeads.some(
                (l) =>
                  l.contactEnrichmentStatus === 'Enriched' ||
                  l.contactEnrichmentStatus === 'Partial'
              );
              const allEnriched =
                currentSearchLeads.length > 0 &&
                currentSearchLeads.every(
                  (l) =>
                    l.contactEnrichmentStatus &&
                    ['Enriched', 'Partial', 'Not Found'].includes(l.contactEnrichmentStatus)
                );
              const hasDrafts = currentSearchLeads.some(
                (l) => Array.isArray(l.outreachDrafts) && l.outreachDrafts.length > 0
              );

              return stages.map((stage) => {
                let isPast = false;
                let isCurrent = false;

                if (isBatchOutreachGenerating) {
                  // Currently batch generating outreach (Stage 7)
                  if (stage.id <= 6) isPast = true;
                  else if (stage.id === 7) isCurrent = true;
                } else if (isBatchEnriching) {
                  // Currently batch enriching leads (Stage 6)
                  if (stage.id <= 5) isPast = true;
                  else if (stage.id === 6) isCurrent = true;
                  else {
                    isPast = false;
                    isCurrent = false;
                  }
                } else if (isBatchQualifying) {
                  // Currently batch qualifying leads (Stage 5)
                  if (stage.id <= 4) isPast = true;
                  else if (stage.id === 5) isCurrent = true;
                  else {
                    isPast = false;
                    isCurrent = false;
                  }
                } else if (hasDrafts) {
                  // Outreach has been drafted for at least one lead
                  isPast = true;
                } else if (allEnriched && allQualified) {
                  // Both qualification and contact enrichment completed
                  if (stage.id <= 6) isPast = true;
                  else if (stage.id === 7) isCurrent = true;
                } else if (allQualified && hasResearched && !isResearching) {
                  // Researched and all qualified -> ready for or performing contact enrichment
                  if (stage.id <= 5) isPast = true;
                  else if (stage.id === 6) isCurrent = true;
                  else {
                    isPast = false;
                    isCurrent = false;
                  }
                } else if (hasResearched && !isResearching && !isBatchResearching) {
                  // Web research completed
                  if (stage.id <= 4) {
                    isPast = true;
                  } else if (stage.id === 5) {
                    if (allQualified) isPast = true;
                    else isCurrent = true;
                  } else {
                    isPast = false;
                    isCurrent = false;
                  }
                } else if (isBatchResearching) {
                  if (stage.id <= 2) isPast = true;
                  else if (stage.id === 3 || stage.id === 4) isCurrent = true;
                  else {
                    isPast = false;
                    isCurrent = false;
                  }
                } else if (isReal) {
                  if (stage.id === 1) {
                    isPast = true;
                  } else if (stage.id === 2) {
                    if (isResearching && researchStep <= 2) isCurrent = true;
                    else if (!researchError) isPast = true;
                  } else if (stage.id === 3) {
                    if (isResearching && researchStep >= 3) isCurrent = true;
                    else if (!isResearching && !researchError) isCurrent = true;
                  } else {
                    isPast = false;
                    isCurrent = false;
                  }
                } else {
                  isPast = researchStep > stage.id;
                  isCurrent = researchStep === stage.id;
                }

                return (
                  <div
                    key={stage.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-white border-zinc-900 shadow-xs ring-1 ring-zinc-900/5'
                        : isPast
                        ? 'bg-zinc-50/60 border-zinc-200/70 text-zinc-600'
                        : 'bg-white/60 border-zinc-200/50 text-zinc-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                          isPast
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCurrent
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-400'
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                        ) : (
                          <span className="text-zinc-400 text-xs">○</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs font-semibold ${
                              isCurrent ? 'text-zinc-900' : isPast ? 'text-zinc-800' : 'text-zinc-500'
                            }`}
                          >
                            {stage.name}
                          </h4>
                          <span className="text-[10px] font-mono">
                            {isPast
                              ? '✓ Done'
                              : isCurrent
                              ? '● In Progress'
                              : '○ Pending'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Live Activity Log (2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
            Execution Log
          </h3>

          <Card padding="sm" className="bg-zinc-900 text-zinc-300 font-mono text-[11px] border-zinc-800">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                leadpilot-discovery-worker
              </span>
              <span>{isReal ? 'LIVE API' : 'SIMULATION'}</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {researchLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-zinc-300">
                  <span className="text-zinc-500 shrink-0 select-none">
                    [{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                  </span>
                  <span className="text-zinc-200">
                    <span className="text-emerald-400 select-none">&gt; </span>
                    {log}
                  </span>
                </div>
              ))}

              {isResearching && (
                <div className="flex items-center gap-2 text-zinc-400 pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  <span className="text-xs">Processing...</span>
                </div>
              )}
            </div>
          </Card>

          {/* Real data notice */}
          {isReal && (
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-white text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Google Places Live Results</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Discovered businesses are normalized and saved directly to your workspace. At this
                stage, qualification status is set to "Researching" awaiting AI qualification in
                subsequent steps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
