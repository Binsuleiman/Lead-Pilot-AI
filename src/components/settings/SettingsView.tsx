import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import {
  User,
  Sliders,
  Plug,
  Save,
  Check,
  Shield,
  Sparkles,
  Database,
  Mail,
  Share2,
  Lock,
  Info,
  Download,
  Upload,
  AlertTriangle,
  X,
  RotateCcw,
  FileJson,
  FolderArchive,
  HardDrive,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    user,
    isDiscoveryConfigured,
    dataSourceMode,
    setDataSourceMode,
    searches,
    leads,
    exportWorkspaceBackupJson,
    importWorkspaceBackupJson,
    previewWorkspaceBackupJson,
    resetDemoData,
  } = useApp();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [company, setCompany] = useState(user.company);
  const [role, setRole] = useState(user.role);

  // AI Preferences
  const [strictness, setStrictness] = useState<'moderate' | 'strict' | 'relaxed'>('moderate');
  const [outreachTone, setOutreachTone] = useState<'consultative' | 'direct' | 'friendly'>('consultative');
  const [defaultBatchSize, setDefaultBatchSize] = useState(25);
  const [autoDraftFollowups, setAutoDraftFollowups] = useState(true);

  const [saved, setSaved] = useState(false);

  // Backup & Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{ searchCount: number; leadCount: number; exportedAt?: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const previewRes = previewWorkspaceBackupJson(content);
      if (previewRes.success && previewRes.preview) {
        setImportFileContent(content);
        setImportPreview(previewRes.preview);
        setImportError(null);
      } else {
        setImportError(previewRes.error || 'Failed to read valid backup JSON');
        setImportFileContent(null);
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importFileContent) return;
    const res = importWorkspaceBackupJson(importFileContent);
    if (res.success) {
      setImportSuccessMessage(
        `Successfully restored ${res.importedSearchesCount} searches and ${res.importedLeadsCount} leads!`
      );
      setImportFileContent(null);
      setImportPreview(null);
      setTimeout(() => setImportSuccessMessage(null), 4000);
    } else {
      setImportError(res.error || 'Failed to import backup');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Settings</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Configure profile attributes, autonomous AI employee parameters, and integration channels.
        </p>
      </div>

      {/* Section 1: Profile */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-zinc-700" />
          <h3 className="text-sm font-bold text-zinc-900">Profile & Organization</h3>
        </div>

        <form onSubmit={handleSaveProfile}>
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-14 h-14 rounded-full object-cover border border-zinc-200"
              />
              <div>
                <h4 className="text-sm font-bold text-zinc-900">{name}</h4>
                <p className="text-xs text-zinc-500">{email}</p>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                  Verified Workspace Admin
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saved ? 'Saved!' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </Card>
        </form>
      </section>

      {/* Section 2: AI Preferences */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-zinc-700" />
          <h3 className="text-sm font-bold text-zinc-900">AI Preferences</h3>
        </div>

        <Card padding="md" className="space-y-5">
          {/* Qualification Strictness */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-900">Qualification Strictness</label>
            <p className="text-xs text-zinc-500">
              Controls how strictly the AI filters businesses that deviate from your exact criteria.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {[
                { id: 'relaxed', label: 'Relaxed', desc: 'Captures more leads with borderline matches' },
                { id: 'moderate', label: 'Balanced (Recommended)', desc: 'Standard qualification balance' },
                { id: 'strict', label: 'Strict', desc: 'Rejects any business without full proof' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setStrictness(lvl.id as any)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    strictness === lvl.id
                      ? 'border-zinc-900 bg-zinc-50/80 shadow-2xs font-semibold'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50/50'
                  }`}
                >
                  <p className="font-bold text-zinc-900">{lvl.label}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Outreach Tone */}
          <div className="space-y-2 pt-3 border-t border-zinc-100">
            <label className="text-xs font-semibold text-zinc-900">Default Outreach Tone</label>
            <p className="text-xs text-zinc-500">
              Determines the vocabulary, pacing, and approach of generated cold emails and DMs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {[
                { id: 'consultative', label: 'Consultative', desc: 'Problem-solving, value-first, diagnostic' },
                { id: 'direct', label: 'Direct & Concise', desc: 'Short sentences, fast CTA, no fluff' },
                { id: 'friendly', label: 'Warm & Friendly', desc: 'Supportive, conversational, localized' },
              ].map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => setOutreachTone(tone.id as any)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    outreachTone === tone.id
                      ? 'border-zinc-900 bg-zinc-50/80 shadow-2xs font-semibold'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50/50'
                  }`}
                >
                  <p className="font-bold text-zinc-900">{tone.label}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{tone.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Default Search Batch Size */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-900">Default Lead Batch Target</p>
              <p className="text-xs text-zinc-500">Default number of leads per mission</p>
            </div>
            <select
              value={defaultBatchSize}
              onChange={(e) => setDefaultBatchSize(Number(e.target.value))}
              className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-800"
            >
              <option value={10}>10 leads</option>
              <option value={25}>25 leads (Default)</option>
              <option value={50}>50 leads</option>
              <option value={100}>100 leads</option>
            </select>
          </div>
        </Card>
      </section>

      {/* Section 3: API Integrations (Placeholders as specified in prompt) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-900">API Integrations</h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
            Next Development Phase
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600 flex items-start gap-3">
          <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <p>
            <strong className="text-zinc-900 font-semibold">Integrations will be configured in subsequent steps:</strong>{' '}
            To maintain zero third-party dependencies during initial foundation testing, external API
            keys and live connector pipes are safely isolated until Step 2.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Integration 1: Google Maps / Places */}
          <Card padding="md" className="space-y-2 border-zinc-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                  GM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Google Places API (New)</h4>
                  <p className="text-[11px] text-zinc-400">Business Discovery Engine</p>
                </div>
              </div>
              {isDiscoveryConfigured ? (
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active & Connected
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Configuration Needed
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Provides real-time local business discovery, Google Maps coordinates, review totals,
              and verified phone lines with strict field masking.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-100">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Shield className="w-3 h-3 text-emerald-600" /> Server-side proxy active
              </span>
              <span className="font-mono text-[10px]">places:searchText</span>
            </div>
          </Card>

          {/* Integration 2: Email Enrichment */}
          <Card padding="md" className="space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                  EN
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Email Discovery Engine</h4>
                  <p className="text-[11px] text-zinc-400">Apollo / Hunter.io Connector</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                Pending Setup
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Enriches discovered business listings with owner/decision-maker email addresses and
              deliverability validation.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Step 2 Integration
              </span>
              <span className="italic">No keys required yet</span>
            </div>
          </Card>

          {/* Integration 3: Email Dispatch */}
          <Card padding="md" className="space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  TX
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Email Sending Service</h4>
                  <p className="text-[11px] text-zinc-400">Gmail / Outlook / Resend</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                Pending Setup
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Enables 1-click sequence sending directly from LeadPilot once outreach copy is
              reviewed and approved.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Step 2 Integration
              </span>
              <span className="italic">No keys required yet</span>
            </div>
          </Card>

          {/* Integration 4: CRM Pipeline */}
          <Card padding="md" className="space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
                  CRM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">CRM Sync Pipe</h4>
                  <p className="text-[11px] text-zinc-400">HubSpot / Salesforce / Notion</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                Pending Setup
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Automatically pipes qualified leads into your pipeline with qualification notes and
              contact records.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Step 2 Integration
              </span>
              <span className="italic">No keys required yet</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Section 4: Workspace Persistence & Data Portability (Step 7) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-700" />
            <h3 className="text-sm font-bold text-zinc-900">
              Workspace Persistence & Portability
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active Browser Adapter
          </span>
        </div>

        {importSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccessMessage}</span>
          </div>
        )}

        {importError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        <Card padding="md" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h4 className="text-xs font-bold text-zinc-900">
                Single-Browser Local Persistence
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                All searches, verified observations, qualification scores, enriched contacts, working notes, tags, and drafts survive page refreshes and browser restarts within this browser profile.
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2 py-1 rounded shrink-0">
              Local Adapter
            </span>
          </div>

          {/* Database metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 font-semibold block">Missions Saved</span>
              <span className="text-sm font-bold text-zinc-900 font-mono">{searches.length}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 font-semibold block">Leads Saved</span>
              <span className="text-sm font-bold text-zinc-900 font-mono">{leads.length}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 font-semibold block">Qualified Leads</span>
              <span className="text-sm font-bold text-emerald-700 font-mono">
                {leads.filter((l) => l.qualificationStatus === 'Qualified').length}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/60">
              <span className="text-[10px] text-zinc-400 font-semibold block">Outreach Drafts</span>
              <span className="text-sm font-bold text-indigo-700 font-mono">
                {leads.reduce(
                  (acc, l) => acc + (Array.isArray(l.outreachDrafts) ? l.outreachDrafts.length : 0),
                  0
                )}
              </span>
            </div>
          </div>

          {/* Export & Import Backup */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-zinc-900">
                Workspace Backup & Restoration (JSON)
              </h5>
              <p className="text-[11px] text-zinc-500">
                Export a complete portable archive containing all campaigns, leads, evidence, drafts, notes, and tags (zero API keys or secrets).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={exportWorkspaceBackupJson}
                className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                title="Download full JSON archive of your prospecting database"
              >
                <Download className="w-3.5 h-3.5 text-zinc-300" />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Restore workspace from a JSON archive"
              >
                <Upload className="w-3.5 h-3.5 text-zinc-500" />
                <span>Import Backup</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Reset Database / Re-seed */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-800">
                Reset Workspace Data
              </p>
              <p className="text-[11px] text-zinc-400">
                {dataSourceMode === 'real'
                  ? 'Clears stored real search records and leads.'
                  : 'Re-seeds default sample prospecting dataset.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Reset Data
            </button>
          </div>
        </Card>
      </section>

      {/* IMPORT PREVIEW MODAL */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-600" />
                <span>Preview Workspace Backup</span>
              </h3>
              <button
                onClick={() => {
                  setImportPreview(null);
                  setImportFileContent(null);
                }}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              The backup file was parsed and validated successfully. Review contents before restoring:
            </p>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-700">
                <span>Searches in Backup:</span>
                <span className="font-mono font-bold text-zinc-900">{importPreview.searchCount}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-700">
                <span>Leads in Backup:</span>
                <span className="font-mono font-bold text-zinc-900">{importPreview.leadCount}</span>
              </div>
              {importPreview.exportedAt && (
                <div className="flex items-center justify-between text-zinc-700">
                  <span>Export Timestamp:</span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {new Date(importPreview.exportedAt).toLocaleDateString()} {new Date(importPreview.exportedAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Restoring this backup will update your current {dataSourceMode} workspace dataset with the records from the file.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setImportPreview(null);
                  setImportFileContent(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRM MODAL */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-zinc-900">
                  Reset Workspace Records?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Are you sure you want to reset your {dataSourceMode} prospecting records?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemoData();
                  setResetConfirmOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
