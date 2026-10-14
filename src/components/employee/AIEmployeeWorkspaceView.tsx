import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { SpeechToTextButton } from '../common/SpeechToTextButton';
import {
  OrchestrationExecutionMode,
  OrchestrationStageName,
  OrchestrationTask,
  OutreachChannel,
} from '../../types';
import {
  Sparkles,
  Bot,
  Play,
  Pause,
  RotateCcw,
  Square,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Send,
  Users,
  Search,
  Globe,
  FileCheck,
  Phone,
  RefreshCw,
  Edit2,
  ChevronRight,
  Check,
  X,
  History,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const SUGGESTED_OBJECTIVES = [
  'Find 10 HVAC businesses in Atlanta with no website or an outdated website. Research them, qualify them against those criteria, enrich publicly listed business contact details, and prepare personalized website-design outreach drafts for qualified leads.',
  'Find 15 roofing companies in Dallas that could benefit from website improvements and mobile booking.',
  'Find 12 dental practices in Austin that lack an online patient booking system or modern intake.',
  'Find 20 commercial plumbers in Chicago with high ratings but missing or broken website domains.',
];

export const AIEmployeeWorkspaceView: React.FC = () => {
  const {
    currentOrchestrationTask,
    setCurrentOrchestrationTask,
    orchestrationTasks,
    createOrchestrationPlan,
    updateOrchestrationPlan,
    startOrchestrationTask,
    pauseOrchestrationTask,
    resumeOrchestrationTask,
    cancelOrchestrationTask,
    approveNextStage,
    retryFailedStageOrLeads,
    reopenTaskReport,
    createTaskFromTemplate,
    parseObjectiveText,
    leads,
    searches,
    dataSourceMode,
    setCurrentTab,
    viewSearchLeads,
  } = useApp();

  // Natural Language composer state
  const [nlPrompt, setNlPrompt] = useState('');
  const [isParsingPrompt, setIsParsingPrompt] = useState(false);
  const [composerMode, setComposerMode] = useState<'natural' | 'structured'>('natural');

  // Structured fields (for manual edit or fallback)
  const [formIndustry, setFormIndustry] = useState('HVAC');
  const [formLocation, setFormLocation] = useState('Atlanta, Georgia');
  const [formQuantity, setFormQuantity] = useState(10);
  const [formCriteria, setFormCriteria] = useState('No website or observable outdated website');
  const [formOffer, setFormOffer] = useState('Website design and mobile intake upgrade');
  const [formChannel, setFormChannel] = useState<OutreachChannel>('email');
  const [formMode, setFormMode] = useState<OrchestrationExecutionMode>('standard');
  const [formInstructions, setFormInstructions] = useState('');

  // Clarification warning from parser
  const [clarificationNotice, setClarificationNotice] = useState<string | null>(null);

  // Edit Plan modal state
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editablePlan, setEditablePlan] = useState<OrchestrationTask | null>(null);

  // Handle parsing natural language objective
  const handleGeneratePlanFromText = async (customText?: string) => {
    const textToParse = customText || nlPrompt;
    if (!textToParse.trim()) return;

    setIsParsingPrompt(true);
    setClarificationNotice(null);

    try {
      const parsed = await parseObjectiveText(textToParse);

      setFormIndustry(parsed.industry);
      setFormLocation(parsed.location);
      setFormQuantity(parsed.requestedQuantity);
      setFormCriteria(parsed.criteria.join(' • '));
      setFormOffer(parsed.serviceOrOffer);
      setFormChannel(parsed.preferredChannel);
      setFormInstructions(parsed.additionalInstructions || '');

      if (parsed.clarificationQuestion) {
        setClarificationNotice(parsed.clarificationQuestion);
      }

      // Propose structured plan
      createOrchestrationPlan({
        objective: parsed.objective,
        industry: parsed.industry,
        location: parsed.location,
        requestedQuantity: parsed.requestedQuantity,
        criteria: parsed.criteria,
        serviceOrOffer: parsed.serviceOrOffer,
        preferredChannel: parsed.preferredChannel,
        additionalInstructions: parsed.additionalInstructions,
        executionMode: formMode,
      });
    } catch (err: any) {
      console.error('Failed to parse objective:', err);
    } finally {
      setIsParsingPrompt(false);
    }
  };

  const handleCreateStructuredPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const criteriaArray = formCriteria
      .split('•')
      .map((c) => c.trim())
      .filter(Boolean);

    createOrchestrationPlan({
      objective: `Find ${formQuantity} ${formIndustry} prospects in ${formLocation}`,
      industry: formIndustry,
      location: formLocation,
      requestedQuantity: Number(formQuantity) || 10,
      criteria: criteriaArray.length > 0 ? criteriaArray : ['No website or observable outdated website'],
      serviceOrOffer: formOffer,
      preferredChannel: formChannel,
      additionalInstructions: formInstructions,
      executionMode: formMode,
    });
  };

  // Open Edit Plan modal
  const handleOpenEditPlan = () => {
    if (!currentOrchestrationTask) return;
    setEditablePlan(JSON.parse(JSON.stringify(currentOrchestrationTask)));
    setIsEditingPlan(true);
  };

  const handleSaveEditedPlan = () => {
    if (!editablePlan) return;
    updateOrchestrationPlan(editablePlan);
    setIsEditingPlan(false);
  };

  const task = currentOrchestrationTask;
  const isRunning = task?.status === 'running';
  const isPaused = task?.status === 'paused';
  const isWaitingApproval = Boolean(task?.waitingApprovalForStage);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              AI Employee Orchestration Engine
            </h2>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Autonomous Prospecting
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
            Stateful orchestration agent that plans, executes, monitors, and prepares prospecting missions for human review across the full workflow:
            <strong className="text-zinc-700 ml-1">UNDERSTAND → PLAN → FIND → RESEARCH → QUALIFY → ENRICH → WRITE → REVIEW</strong>.
          </p>
        </div>

        {dataSourceMode === 'real' ? (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live Google Places & Search Grounding
          </span>
        ) : (
          <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Demo Mode Sandbox
          </span>
        )}
      </div>

      {/* Main Grid: Composer & Plan (Left), Live Execution Monitor & History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Natural Language Input & Execution Plan (5 Cols on LG) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 1: Objective Composer */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                <span>Task Objective Composer</span>
              </span>

              {/* Mode toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setComposerMode('natural')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    composerMode === 'natural'
                      ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Natural Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode('structured')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    composerMode === 'structured'
                      ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Structured Fields
                </button>
              </div>
            </div>

            {composerMode === 'natural' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 block">
                      Describe your prospecting objective in plain English:
                    </label>
                    <SpeechToTextButton
                      onTranscript={(spoken) => setNlPrompt(spoken)}
                      currentValue={nlPrompt}
                      variant="pill"
                      size="xs"
                      label="Dictate"
                    />
                  </div>
                  <div className="relative">
                    <textarea
                      rows={4}
                      value={nlPrompt}
                      onChange={(e) => setNlPrompt(e.target.value)}
                      placeholder="e.g. Find 10 HVAC businesses in Atlanta with no website or an outdated website. Research them, qualify them against those criteria, enrich publicly listed business contact details, and prepare personalized website-design outreach drafts for qualified leads."
                      className="w-full px-3 py-2 pr-9 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 leading-relaxed font-sans"
                    />
                    <div className="absolute right-2 bottom-2.5">
                      <SpeechToTextButton
                        onTranscript={(spoken) => setNlPrompt(spoken)}
                        currentValue={nlPrompt}
                        variant="icon"
                        size="xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Example Quick-Pick Prompts */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    Quick prompt templates:
                  </span>
                  <div className="space-y-1">
                    {SUGGESTED_OBJECTIVES.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setNlPrompt(tpl);
                          handleGeneratePlanFromText(tpl);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[11px] line-clamp-1 border border-zinc-100 transition-colors"
                      >
                        ⚡ {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                {clarificationNotice && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Clarification Needed:</p>
                      <p className="text-[11px] mt-0.5">{clarificationNotice}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400">
                    Gemini extracts criteria & dependencies
                  </span>
                  <button
                    type="button"
                    disabled={isParsingPrompt || !nlPrompt.trim()}
                    onClick={() => handleGeneratePlanFromText()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    {isParsingPrompt ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{isParsingPrompt ? 'Planning Work...' : 'Generate Plan'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Structured Fields Input */
              <form onSubmit={handleCreateStructuredPlan} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-700 block">Industry</label>
                      <SpeechToTextButton
                        onTranscript={(text) => setFormIndustry(text)}
                        currentValue={formIndustry}
                        size="xs"
                      />
                    </div>
                    <input
                      type="text"
                      value={formIndustry}
                      onChange={(e) => setFormIndustry(e.target.value)}
                      required
                      placeholder="e.g. HVAC, Roofing"
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-zinc-700 block">Location</label>
                      <SpeechToTextButton
                        onTranscript={(text) => setFormLocation(text)}
                        currentValue={formLocation}
                        size="xs"
                      />
                    </div>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      required
                      placeholder="e.g. Atlanta, GA"
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Outreach Channel</label>
                    <select
                      value={formChannel}
                      onChange={(e) => setFormChannel(e.target.value as OutreachChannel)}
                      className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium"
                    >
                      <option value="email">Cold Email</option>
                      <option value="general_dm">Direct Message (SMS/DM)</option>
                      <option value="linkedin_message">LinkedIn Message</option>
                      <option value="instagram_dm">Instagram DM</option>
                      <option value="facebook_messenger">Facebook Messenger</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-700 block">Qualification Criteria</label>
                    <SpeechToTextButton
                      onTranscript={(text) => setFormCriteria(text)}
                      currentValue={formCriteria}
                      size="xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={formCriteria}
                    onChange={(e) => setFormCriteria(e.target.value)}
                    placeholder="No website or observable outdated website"
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-700 block">Your Service / Offer</label>
                    <SpeechToTextButton
                      onTranscript={(text) => setFormOffer(text)}
                      currentValue={formOffer}
                      size="xs"
                    />
                  </div>
                  <input
                    type="text"
                    value={formOffer}
                    onChange={(e) => setFormOffer(e.target.value)}
                    placeholder="Website design and mobile intake upgrade"
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs"
                  >
                    Build Plan
                  </button>
                </div>
              </form>
            )}
          </Card>

          {/* Section 2: Structured Execution Plan Card */}
          {task && (
            <Card padding="md" className="space-y-4 border-zinc-300">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div>
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Execution Plan</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">ID: {task.taskId}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleOpenEditPlan}
                    disabled={isRunning}
                    className="px-2 py-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Edit2 className="w-3 h-3 text-zinc-500" />
                    <span>Edit Plan</span>
                  </button>
                </div>
              </div>

              {/* Task Parameters Summary */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Objective:</span>
                  <span className="font-semibold text-zinc-900 max-w-[240px] truncate text-right">
                    {task.objective}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Target / Location:</span>
                  <span className="font-semibold text-zinc-900">
                    {task.industry} in {task.location}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Requested Quantity:</span>
                  <span className="font-mono font-bold text-zinc-900">{task.requestedQuantity} businesses</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Criteria:</span>
                  <span className="font-medium text-zinc-800 text-right max-w-[240px] truncate">
                    {task.criteria.join(' • ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Offer / Channel:</span>
                  <span className="font-medium text-indigo-700">
                    {task.preferredChannel.toUpperCase()} pitch ({task.serviceOrOffer})
                  </span>
                </div>
              </div>

              {/* Execution Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                  Execution Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'guided', label: 'Mode A: Guided', desc: 'Pauses for user approval after each stage' },
                    { id: 'standard', label: 'Mode B: Standard', desc: 'Runs through discovery & enrich, pauses before outreach' },
                    { id: 'custom', label: 'Mode C: Custom', desc: 'Configurable stages' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isRunning}
                      onClick={() => updateOrchestrationPlan({ executionMode: m.id as any })}
                      className={`p-2 rounded-lg text-left border transition-all ${
                        task.executionMode === m.id
                          ? 'border-zinc-900 bg-zinc-100 font-semibold shadow-2xs'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50/60'
                      } disabled:opacity-50`}
                    >
                      <p className="text-[11px] font-bold text-zinc-900">{m.label}</p>
                      <p className="text-[9px] text-zinc-500 line-clamp-2 mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stages Checklist */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                  Workflow Stages to Execute:
                </span>
                <div className="space-y-1.5">
                  {task.stages.map((st, idx) => (
                    <div
                      key={st.name}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        st.status === 'running'
                          ? 'border-blue-400 bg-blue-50/50'
                          : st.status === 'completed'
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                          : st.status === 'completed_with_errors'
                          ? 'border-amber-200 bg-amber-50/40'
                          : st.status === 'failed'
                          ? 'border-rose-200 bg-rose-50/40'
                          : !st.enabled
                          ? 'border-zinc-100 bg-zinc-50 opacity-50'
                          : 'border-zinc-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {st.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : st.status === 'running' ? (
                          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                        ) : st.status === 'failed' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-zinc-300 text-zinc-400 text-[10px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-zinc-900 leading-tight">{st.label}</p>
                          <p className="text-[10px] text-zinc-500 line-clamp-1">{st.description}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {st.requiresApproval && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/50">
                            Approval Gate
                          </span>
                        )}
                        <span className="text-[10px] font-mono capitalize text-zinc-500 font-medium">
                          {st.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                  Controlled dependency execution
                </span>

                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <button
                      type="button"
                      onClick={pauseOrchestrationTask}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Checkpoint</span>
                    </button>
                  ) : isPaused && !isWaitingApproval ? (
                    <button
                      type="button"
                      onClick={resumeOrchestrationTask}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Resume Task</span>
                    </button>
                  ) : task.status === 'planned' || task.status === 'draft' ? (
                    <button
                      type="button"
                      onClick={() => startOrchestrationTask()}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Task</span>
                    </button>
                  ) : null}

                  {isRunning && (
                    <button
                      type="button"
                      onClick={cancelOrchestrationTask}
                      className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Live Monitor, Human Approval Gate, Outcome Summary & Task History (7 Cols on LG) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Live Task Monitor */}
          {task ? (
            <Card padding="md" className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRunning
                        ? 'bg-blue-500 animate-ping'
                        : isPaused
                        ? 'bg-amber-500'
                        : task.status === 'completed'
                        ? 'bg-emerald-500'
                        : task.status === 'completed_with_errors'
                        ? 'bg-amber-500'
                        : task.status === 'failed'
                        ? 'bg-rose-500'
                        : 'bg-zinc-400'
                    }`}
                  />
                  <h3 className="text-sm font-bold text-zinc-900">Live Task Monitor</h3>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-0.5 rounded bg-zinc-100 font-semibold">
                    Status: {task.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  {task.searchId && (
                    <button
                      type="button"
                      onClick={() => viewSearchLeads(task.searchId!)}
                      className="px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md transition-all shadow-2xs flex items-center gap-1"
                    >
                      <span>Inspect Leads</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Current Operation Notification Banner */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  isRunning
                    ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                    : isPaused
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : task.status === 'completed'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : task.status === 'completed_with_errors'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : task.status === 'failed'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                }`}
              >
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
                ) : isPaused ? (
                  <Pause className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : task.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-xs">
                    {task.currentStageName
                      ? `Stage in progress: ${task.currentStageName.toUpperCase()}`
                      : 'Stage Status'}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-snug">
                    {task.currentOperationLabel || 'Ready to start. Awaiting user command.'}
                  </p>
                </div>
              </div>

              {/* HUMAN APPROVAL GATE BANNER */}
              {isWaitingApproval && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-purple-900">
                        Human Approval Gate: Ready for Personalized Outreach Generation
                      </h4>
                      <p className="text-[11px] text-purple-800/90 mt-0.5">
                        Discovery, research, qualification, and contact enrichment stages have completed.
                        Per safety rules, outreach generation requires explicit user approval.
                        <strong> Note: Generated drafts will be saved for review and will NEVER be automatically sent.</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-purple-200/60">
                    <button
                      type="button"
                      onClick={cancelOrchestrationTask}
                      className="px-3 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      Pause & Review Leads First
                    </button>
                    <button
                      type="button"
                      onClick={approveNextStage}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Generate Outreach Drafts</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Progress Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Discovered</span>
                  <span className="text-base font-bold text-zinc-900 font-mono">
                    {task.targetLeadIds.length} / {task.requestedQuantity}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Researched</span>
                  <span className="text-base font-bold text-blue-700 font-mono">
                    {leads.filter((l) => task.targetLeadIds.includes(l.id) && l.researchStatus === 'Researched').length}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Qualified</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {leads.filter((l) => task.targetLeadIds.includes(l.id) && l.qualificationStatus === 'Qualified').length}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
                  <span className="text-[10px] text-zinc-400 font-semibold block">Saved Drafts</span>
                  <span className="text-base font-bold text-indigo-700 font-mono">
                    {leads.filter((l) => task.targetLeadIds.includes(l.id) && Array.isArray(l.outreachDrafts) && l.outreachDrafts.length > 0).length}
                  </span>
                </div>
              </div>

              {/* Error and Retry Panel */}
              {task.errors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Partial Errors ({task.errors.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => retryFailedStageOrLeads(task.errors[0]?.stage || 'research')}
                      className="px-2 py-1 text-[10px] font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded transition-colors"
                    >
                      Retry Failed Items
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-rose-800">
                    {task.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-rose-100/80 pb-1">
                        <span className="truncate max-w-[280px]">
                          <strong>[{err.stage}]:</strong> {err.leadName ? `${err.leadName} — ` : ''}{err.message}
                        </span>
                        <span className="text-[10px] text-rose-400 font-mono shrink-0">
                          {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Task Summary Report */}
              {task.outcome && (
                <div className="p-4 rounded-xl bg-zinc-900 text-white space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Executive Task Outcome Report</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Completed {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : ''}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                    {task.outcome.summaryText}
                  </p>

                  {/* Metrics Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Discovered: {task.outcome.discoveredCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                      Qualified: {task.outcome.qualifiedCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 font-semibold">
                      Potential: {task.outcome.potentialCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-semibold">
                      Enriched: {task.outcome.enrichedCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                      Outreach Drafts: {task.outcome.outreachDraftsCount}
                    </span>
                  </div>

                  {/* Recommended Next Actions */}
                  {task.outcome.recommendedNextActions && task.outcome.recommendedNextActions.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Recommended Human Next Steps:
                      </span>
                      <ul className="space-y-1 text-xs text-zinc-300">
                        {task.outcome.recommendedNextActions.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('leads')}
                      className="px-3 py-1.5 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Open Leads Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('outreach')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Review Outreach Drafts</span>
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card padding="lg" className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">AI Prospecting Employee is Ready</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-0.5">
                  Enter an objective in natural language on the left to generate an execution plan. The AI employee will orchestrate discovery, web research, qualification, and personalized outreach writing with human approval gates.
                </p>
              </div>
            </Card>
          )}

          {/* 2. Orchestration Task History */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-600" />
                <span>Task History & Past Missions ({orchestrationTasks.length})</span>
              </span>
            </div>

            {orchestrationTasks.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-4 text-center">
                No previous orchestration tasks recorded yet.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100 max-h-64 overflow-y-auto">
                {orchestrationTasks.map((t) => (
                  <div
                    key={t.taskId}
                    className="py-2.5 flex items-center justify-between text-xs hover:bg-zinc-50 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => reopenTaskReport(t.taskId)}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-900 truncate block max-w-xs">
                          {t.objective}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 capitalize">
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {t.industry} in {t.location} • {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          createTaskFromTemplate(t.taskId);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                        title="Use this plan as template for a new task"
                      >
                        Use as Template
                      </button>
                      <button
                        type="button"
                        onClick={() => reopenTaskReport(t.taskId)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded transition-colors flex items-center gap-1"
                      >
                        <span>Reopen</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* EDIT PLAN MODAL */}
      {isEditingPlan && editablePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-700" />
                <span>Edit Structured Execution Plan</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingPlan(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Objective</label>
                <input
                  type="text"
                  value={editablePlan.objective}
                  onChange={(e) => setEditablePlan({ ...editablePlan, objective: e.target.value })}
                  className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Industry</label>
                  <input
                    type="text"
                    value={editablePlan.industry}
                    onChange={(e) => setEditablePlan({ ...editablePlan, industry: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={editablePlan.location}
                    onChange={(e) => setEditablePlan({ ...editablePlan, location: e.target.value })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Lead Target Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editablePlan.requestedQuantity}
                    onChange={(e) => setEditablePlan({ ...editablePlan, requestedQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Execution Mode</label>
                  <select
                    value={editablePlan.executionMode}
                    onChange={(e) => setEditablePlan({ ...editablePlan, executionMode: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium"
                  >
                    <option value="guided">Mode A: Guided</option>
                    <option value="standard">Mode B: Standard</option>
                    <option value="custom">Mode C: Custom</option>
                  </select>
                </div>
              </div>

              {/* Stage toggles */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-zinc-700 block">Enable/Disable Stages</label>
                <div className="space-y-1">
                  {editablePlan.stages.map((st) => (
                    <label key={st.name} className="flex items-center gap-2 cursor-pointer p-1.5 bg-zinc-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={st.enabled}
                        onChange={(e) => {
                          const nextStages = editablePlan.stages.map((s) =>
                            s.name === st.name ? { ...s, enabled: e.target.checked } : s
                          );
                          setEditablePlan({ ...editablePlan, stages: nextStages });
                        }}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      />
                      <span className="font-semibold text-zinc-800">{st.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingPlan(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedPlan}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
