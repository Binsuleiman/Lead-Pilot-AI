import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import {
  History,
  MapPin,
  Building2,
  Calendar,
  ArrowRight,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  Send,
  UserCheck,
  AlertTriangle,
  X,
  Check,
  Search as SearchIcon,
  HelpCircle,
} from 'lucide-react';
import { Search } from '../../types';

export const SearchHistoryView: React.FC = () => {
  const {
    searches,
    leads,
    viewSearchLeads,
    setCurrentTab,
    dataSourceMode,
    renameSearch,
    deleteSearch,
    startNewSearch,
  } = useApp();

  // Rename modal state
  const [renamingSearch, setRenamingSearch] = useState<Search | null>(null);
  const [customLabelInput, setCustomLabelInput] = useState('');

  // Delete modal state
  const [deletingSearch, setDeletingSearch] = useState<Search | null>(null);
  const [deleteAssociatedLeadsOption, setDeleteAssociatedLeadsOption] = useState(true);

  // Search filter query within history
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const filteredSearches = searches.filter((s) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(q);
    const labelMatch = s.customLabel?.toLowerCase().includes(q);
    const indMatch = s.industry.toLowerCase().includes(q);
    const locMatch = s.location.toLowerCase().includes(q);
    return nameMatch || labelMatch || indMatch || locMatch;
  });

  const handleOpenRename = (search: Search, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingSearch(search);
    setCustomLabelInput(search.customLabel || search.name);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (renamingSearch) {
      renameSearch(renamingSearch.id, customLabelInput);
      setRenamingSearch(null);
    }
  };

  const handleOpenDelete = (search: Search, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSearch(search);
    setDeleteAssociatedLeadsOption(true);
  };

  const handleConfirmDelete = () => {
    if (deletingSearch) {
      deleteSearch(deletingSearch.id, deleteAssociatedLeadsOption);
      setDeletingSearch(null);
    }
  };

  // Helper to compute exact dynamic counts from leads storage for a search
  const getSearchMetrics = (searchId: string) => {
    const searchLeads = leads.filter(
      (l) => l.searchId === searchId || (Array.isArray(l.searchIds) && l.searchIds.includes(searchId))
    );
    const qualified = searchLeads.filter((l) => l.qualificationStatus === 'Qualified').length;
    const potential = searchLeads.filter((l) => l.qualificationStatus === 'Potential').length;
    const notMatch = searchLeads.filter((l) => l.qualificationStatus === 'Not a match').length;
    const unresearched = searchLeads.filter(
      (l) => !l.researchStatus || l.researchStatus === 'Not researched'
    ).length;
    const contactFound = searchLeads.filter(
      (l) =>
        l.contactEnrichmentStatus === 'Enriched' ||
        l.contactEnrichmentStatus === 'Partial' ||
        l.businessEmail?.status === 'Found' ||
        Boolean(l.email)
    ).length;
    const withDrafts = searchLeads.filter(
      (l) => Array.isArray(l.outreachDrafts) && l.outreachDrafts.length > 0
    ).length;

    const hasIncompleteWork = unresearched > 0 || qualified === 0 || withDrafts < qualified;

    return {
      searchLeads,
      totalCount: searchLeads.length,
      qualified,
      potential,
      notMatch,
      unresearched,
      contactFound,
      withDrafts,
      hasIncompleteWork,
    };
  };

  // Aggregate stats across all searches
  const totalMissions = searches.length;
  const totalLeadsFound = searches.reduce(
    (acc, s) => acc + (s.foundQuantity ?? s.leadCount ?? 0),
    0
  );
  const totalQualifiedAll = leads.filter((l) => l.qualificationStatus === 'Qualified').length;
  const totalDraftsAll = leads.reduce(
    (acc, l) => acc + (Array.isArray(l.outreachDrafts) ? l.outreachDrafts.length : 0),
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Search History & Missions</h2>
            {dataSourceMode === 'real' ? (
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Real Data Storage
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Demo Mode History
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Durable log of all prospecting missions. Reopen leads, resume incomplete stages, rename campaigns, and manage stored records.
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('new-search')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          <span>New Lead Search</span>
        </button>
      </div>

      {/* Overview Stat Badges */}
      {searches.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-zinc-400" />
              Total Missions
            </span>
            <p className="text-lg font-bold text-zinc-900 mt-1">{totalMissions}</p>
          </div>
          <div className="p-3.5 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              Discovered Leads
            </span>
            <p className="text-lg font-bold text-zinc-900 mt-1">{totalLeadsFound}</p>
          </div>
          <div className="p-3.5 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Qualified Leads
            </span>
            <p className="text-lg font-bold text-zinc-900 mt-1">{totalQualifiedAll}</p>
          </div>
          <div className="p-3.5 bg-white border border-zinc-200/80 rounded-xl shadow-2xs">
            <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-500" />
              Saved Outreach Drafts
            </span>
            <p className="text-lg font-bold text-zinc-900 mt-1">{totalDraftsAll}</p>
          </div>
        </div>
      )}

      {/* Search Filter for History */}
      {searches.length > 0 && (
        <div className="relative max-w-sm">
          <SearchIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            placeholder="Filter previous search missions..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400 shadow-2xs"
          />
        </div>
      )}

      {/* Main Table / Cards */}
      <Card padding="none">
        {searches.length === 0 ? (
          <EmptyState
            title="No search history yet"
            description={
              dataSourceMode === 'real'
                ? 'Run your first real business search mission to populate historical records.'
                : 'Run a search in demo mode to populate simulated history.'
            }
            actionText="+ New Lead Search"
            onAction={() => setCurrentTab('new-search')}
            icon={History}
          />
        ) : filteredSearches.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
            <p>No search missions match "{historySearchQuery}".</p>
            <button
              onClick={() => setHistorySearchQuery('')}
              className="text-xs font-semibold text-zinc-900 underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Touch Cards (< md) */}
            <div className="divide-y divide-zinc-100 md:hidden">
              {filteredSearches.map((search) => {
                const date = new Date(search.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const requested = search.requestedQuantity || search.quantity;
                const metrics = getSearchMetrics(search.id);
                const found = metrics.totalCount || search.foundQuantity || search.leadCount || 0;

                return (
                  <div
                    key={search.id}
                    onClick={() => viewSearchLeads(search.id)}
                    className="p-4 hover:bg-zinc-50/70 transition-colors cursor-pointer flex flex-col gap-3 active:bg-zinc-100/70"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-zinc-900 leading-tight">
                            {search.customLabel || search.name}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => handleOpenRename(search, e)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors"
                            title="Rename Search Label"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        {search.customLabel && (
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                            {search.name}
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                          {search.criteria}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {search.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        ) : search.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50">
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50">
                            In Progress
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleOpenDelete(search, e)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Search"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{search.industry}</span>
                      </span>
                      <span className="text-zinc-300">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">{search.location}</span>
                      </span>
                    </div>

                    {/* Live Metric Breakdown Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
                        Req: {requested}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200/60">
                        Found: {found}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60">
                        {metrics.qualified} Qualified
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200/60">
                        {metrics.potential} Potential
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                        {metrics.notMatch} No Match
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 font-semibold border border-purple-200/60">
                        {metrics.contactFound} Contacts
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 font-semibold border border-indigo-200/60">
                        {metrics.withDrafts} Drafts
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                      <span className="text-zinc-400 text-[10px]">{date}</span>
                      <div className="flex items-center gap-2">
                        {metrics.hasIncompleteWork && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewSearchLeads(search.id);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 text-[11px] font-semibold hover:bg-amber-200 transition-colors"
                          >
                            Resume Work
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewSearchLeads(search.id);
                          }}
                          className="min-h-[32px] px-3 py-1 rounded-lg bg-zinc-900 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
                        >
                          <span>View Leads</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tablet & Desktop Table (>= md) */}
            <div className="hidden md:block divide-y divide-zinc-100 overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-xs">
                <thead className="bg-zinc-50/80 text-zinc-500 font-semibold border-b border-zinc-100 select-none">
                  <tr>
                    <th className="py-3 px-4 min-w-[220px]">Mission & Custom Label</th>
                    <th className="py-3 px-4 min-w-[130px]">Industry</th>
                    <th className="py-3 px-4 min-w-[140px]">Location</th>
                    <th className="py-3 px-4 min-w-[90px]">Req / Found</th>
                    <th className="py-3 px-4 min-w-[240px]">Actual Lead Pipeline Status</th>
                    <th className="py-3 px-4 min-w-[100px]">Status</th>
                    <th className="py-3 px-4 min-w-[120px]">Created</th>
                    <th className="py-3 px-4 text-right min-w-[160px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredSearches.map((search) => {
                    const date = new Date(search.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    const time = new Date(search.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const requested = search.requestedQuantity || search.quantity;
                    const metrics = getSearchMetrics(search.id);
                    const found = metrics.totalCount || search.foundQuantity || search.leadCount || 0;

                    return (
                      <tr
                        key={search.id}
                        onClick={() => viewSearchLeads(search.id)}
                        className="hover:bg-zinc-50/70 transition-colors cursor-pointer group"
                      >
                        {/* Name / Custom Label */}
                        <td className="py-4 px-4 font-semibold text-zinc-900">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="group-hover:text-blue-600 transition-colors font-bold text-xs block truncate max-w-[220px]">
                                {search.customLabel || search.name}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleOpenRename(search, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-800 rounded transition-opacity"
                                title="Rename Custom Label"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                            {search.customLabel && (
                              <span className="text-[10px] text-zinc-400 font-mono block truncate max-w-[200px]">
                                {search.name}
                              </span>
                            )}
                            <span className="text-[11px] text-zinc-400 font-normal line-clamp-1 max-w-[260px] mt-0.5">
                              {search.criteria}
                            </span>
                          </div>
                        </td>

                        {/* Industry */}
                        <td className="py-4 px-4 text-zinc-600 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>{search.industry}</span>
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-4 text-zinc-600 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{search.location}</span>
                          </span>
                        </td>

                        {/* Requested vs Found */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px]">
                          <div>
                            <span className="text-zinc-600">Req: {requested}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-blue-700">Found: {found}</span>
                          </div>
                        </td>

                        {/* Live Lead Breakdown from actual persistent records */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                            <span
                              className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/50 font-semibold"
                              title={`${metrics.qualified} leads verified as Qualified`}
                            >
                              {metrics.qualified} Q
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/50 font-semibold"
                              title={`${metrics.potential} leads marked Potential`}
                            >
                              {metrics.potential} Pot
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600"
                              title={`${metrics.notMatch} leads Not a match`}
                            >
                              {metrics.notMatch} No
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200/50 font-semibold"
                              title={`${metrics.contactFound} leads with contact info found`}
                            >
                              {metrics.contactFound} Contacts
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/50 font-semibold"
                              title={`${metrics.withDrafts} leads with saved outreach drafts`}
                            >
                              {metrics.withDrafts} Drafts
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {search.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Completed
                            </span>
                          ) : search.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              In Progress
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-zinc-500 whitespace-nowrap text-[11px]">
                          <div>{date}</div>
                          <div className="text-zinc-400">{time}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {metrics.hasIncompleteWork && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewSearchLeads(search.id);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 rounded-md transition-colors"
                                title="Resume incomplete research, qualification, or outreach"
                              >
                                Resume
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                viewSearchLeads(search.id);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-md transition-all inline-flex items-center gap-1 shadow-2xs group-hover:border-zinc-300"
                              title="Open previous search leads without rerunning API calls"
                            >
                              <span>View Leads</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleOpenDelete(search, e)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                              title="Delete Search Mission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* RENAME MODAL */}
      {renamingSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-zinc-700" />
                <span>Rename Search Label</span>
              </h3>
              <button
                onClick={() => setRenamingSearch(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Give this prospecting mission a recognizable campaign name (e.g. "Q4 Commercial Roofers", "Miami Dentists Tier 1").
            </p>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider block mb-1">
                  Custom Campaign Label
                </label>
                <input
                  type="text"
                  value={customLabelInput}
                  onChange={(e) => setCustomLabelInput(e.target.value)}
                  placeholder="e.g. Q4 HVAC Outreach"
                  autoFocus
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  Original search title: {renamingSearch.name}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setRenamingSearch(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Label</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-zinc-900">
                  Delete Search Mission?
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  You are about to delete <strong className="text-zinc-800">{deletingSearch.customLabel || deletingSearch.name}</strong>.
                </p>
              </div>
              <button
                onClick={() => setDeletingSearch(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const metrics = getSearchMetrics(deletingSearch.id);
              return (
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-700">
                    <span>Associated Leads Found:</span>
                    <span className="font-mono font-bold">{metrics.totalCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-700">
                    <span>Saved Outreach Drafts:</span>
                    <span className="font-mono font-bold text-indigo-700">{metrics.withDrafts}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={deleteAssociatedLeadsOption}
                        onChange={(e) => setDeleteAssociatedLeadsOption(e.target.checked)}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 mt-0.5"
                      />
                      <span className="text-[11px] text-zinc-700 leading-snug">
                        Also delete exclusive leads and outreach drafts belonging to this search
                        <span className="block text-[10px] text-zinc-400">
                          (Leads that appear in multiple searches will be safely retained in other campaigns)
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setDeletingSearch(null)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
