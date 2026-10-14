import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import {
  Users,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Layers,
  Building2,
  ExternalLink,
  Send,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { searches, leads, setCurrentTab, viewSearchLeads, setSelectedLeadId, dataSourceMode } = useApp();

  const totalLeads = leads.length;
  const researchingLeads = leads.filter((l) => l.qualificationStatus === 'Researching').length;
  const qualifiedLeads = leads.filter((l) => l.qualificationStatus === 'Qualified').length;
  const potentialLeads = leads.filter((l) => l.qualificationStatus === 'Potential').length;
  const searchesCompleted = searches.filter((s) => s.status === 'completed').length;
  const qualificationRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  const totalDrafts = leads.reduce(
    (acc, l) => acc + (Array.isArray(l.outreachDrafts) ? l.outreachDrafts.length : 0),
    0
  );

  // Recent 5 searches
  const recentSearches = searches.slice(0, 5);

  // Recent 4 qualified leads for quick review
  const recentQualifiedLeads = leads
    .filter((l) => l.qualificationStatus === 'Qualified')
    .slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100/90 border border-zinc-200/80 text-xs font-semibold text-zinc-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Autonomous Lead Engine
              </div>
              {dataSourceMode === 'real' ? (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  Real Data Mode (Google Places API)
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  Demo Mode — sample businesses
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Your AI employee is ready.
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 font-normal leading-relaxed">
              Find, research, and qualify your next leads. Tell LeadPilot who you're looking for—it
              finds them, researches them, qualifies them, and prepares personalized outreach.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setCurrentTab('ai-employee')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-sm hover:shadow active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Launch AI Employee</span>
            </button>

            <button
              onClick={() => setCurrentTab('new-search')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 transition-colors"
            >
              <Search className="w-4 h-4 text-zinc-500" />
              <span>+ New Search</span>
            </button>

            <button
              onClick={() => setCurrentTab('leads')}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/80 transition-colors"
            >
              <Users className="w-4 h-4 text-zinc-500" />
              <span>View All Leads</span>
            </button>
          </div>
        </div>
      </div>

      {/* Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-6">
        {/* Total Leads */}
        <Card padding="md" className="relative group hover:border-zinc-300">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Leads
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-2 font-mono">
                {totalLeads}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-1.5">
                <span>{potentialLeads} potential</span>
                <span className="text-zinc-300">·</span>
                <span>{totalLeads - qualifiedLeads - potentialLeads} rejected</span>
                {researchingLeads > 0 && (
                  <>
                    <span className="text-zinc-300">·</span>
                    <span className="text-blue-600 font-medium">{researchingLeads} researching</span>
                  </>
                )}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200/60 shrink-0">
              <Users className="w-5 h-5 text-zinc-800" />
            </div>
          </div>
        </Card>

        {/* Qualified Leads */}
        <Card padding="md" className="relative group hover:border-zinc-300">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Qualified Leads
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2 font-mono">
                {qualifiedLeads}
              </h3>
              <p className="text-xs text-emerald-700/90 mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>{qualificationRate}% match rate against criteria</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Outreach Drafts */}
        <Card
          padding="md"
          className="relative group hover:border-zinc-300 cursor-pointer"
          onClick={() => setCurrentTab('outreach')}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Outreach Prepared
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2 font-mono">
                {totalDrafts}
              </h3>
              <p className="text-xs text-indigo-700/90 mt-1 flex items-center gap-1 font-medium group-hover:underline">
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span>Open Outreach Engine</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200/60 shrink-0">
              <Send className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Searches Completed */}
        <Card padding="md" className="relative group hover:border-zinc-300">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Searches Completed
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-2 font-mono">
                {searchesCompleted}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-1.5">
                <span>Across {new Set(searches.map((s) => s.location)).size} distinct markets</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200/60 shrink-0">
              <Search className="w-5 h-5 text-zinc-800" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Searches & Qualified Leads Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Searches (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">Recent Searches</h3>
              <p className="text-xs text-zinc-500">Missions dispatched to your AI employee</p>
            </div>
            {recentSearches.length > 0 && (
              <button
                onClick={() => setCurrentTab('history')}
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1 transition-colors"
              >
                <span>View all history</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Card padding="none">
            {recentSearches.length === 0 ? (
              <EmptyState
                title="No Searches Found"
                description="Launch your first search to let LeadPilot discover and qualify leads for you."
                actionText="+ New Lead Search"
                onAction={() => setCurrentTab('new-search')}
              />
            ) : (
              <>
                {/* Mobile Touch Cards (< md) */}
                <div className="divide-y divide-zinc-100 md:hidden">
                  {recentSearches.map((search) => (
                    <div
                      key={search.id}
                      onClick={() => viewSearchLeads(search.id)}
                      className="p-4 hover:bg-zinc-50/70 transition-colors cursor-pointer flex flex-col gap-2.5 active:bg-zinc-100/70"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">
                            {search.name}
                          </h4>
                          <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="truncate">{search.location}</span>
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Completed
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100/80">
                        <div className="flex items-center gap-3 text-[11px] font-mono">
                          <span className="text-zinc-600">
                            Found: <strong>{search.leadCount}</strong>
                          </span>
                          <span className="text-emerald-700">
                            Qualified: <strong>{search.qualifiedCount}</strong>
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-900 flex items-center gap-1">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tablet & Desktop Table (>= md) */}
                <div className="hidden md:block divide-y divide-zinc-100 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="bg-zinc-50/70 text-zinc-500 font-semibold border-b border-zinc-100">
                      <tr>
                        <th className="py-3 px-4">Search Name</th>
                        <th className="py-3 px-4">Industry</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4 text-center">Leads</th>
                        <th className="py-3 px-4 text-center">Qualified</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {recentSearches.map((search) => {
                        const formattedDate = new Date(search.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                          }
                        );

                        return (
                          <tr
                            key={search.id}
                            className="hover:bg-zinc-50/60 transition-colors group cursor-pointer"
                            onClick={() => viewSearchLeads(search.id)}
                          >
                            <td className="py-3.5 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                              <span className="group-hover:text-blue-600 transition-colors">
                                {search.name}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-zinc-600 whitespace-nowrap">
                              {search.industry}
                            </td>
                            <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-400" />
                                {search.location}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-medium text-zinc-700">
                              {search.leadCount}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-semibold text-emerald-600">
                              {search.qualifiedCount}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Completed
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewSearchLeads(search.id);
                                }}
                                className="min-h-[36px] text-xs font-semibold text-zinc-700 hover:text-zinc-900 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1"
                              >
                                <span>View Leads</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
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
        </div>

        {/* High-Impact Qualified Leads (1 col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">Top Qualified Leads</h3>
              <p className="text-xs text-zinc-500">Highest upside candidates</p>
            </div>
            <button
              onClick={() => setCurrentTab('leads')}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
            >
              All leads
            </button>
          </div>

          <div className="space-y-3">
            {recentQualifiedLeads.length === 0 ? (
              <Card padding="md">
                <p className="text-xs text-zinc-400 text-center py-4">No qualified leads yet.</p>
              </Card>
            ) : (
              recentQualifiedLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => {
                    setSelectedLeadId(lead.id);
                    setCurrentTab('outreach');
                  }}
                  className="p-4 bg-white rounded-xl border border-zinc-200/80 hover:border-zinc-300 hover:shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                        {lead.businessName}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-400" />
                        <span className="truncate max-w-[200px]">{lead.address}</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 shrink-0">
                      ★ {lead.rating}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 mt-2.5 line-clamp-2 leading-relaxed bg-zinc-50/70 p-2 rounded border border-zinc-100">
                    {lead.qualificationReason}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
                    <span className="font-medium text-emerald-700">
                      {lead.websiteStatus === 'No website found' ? 'No Website' : 'Outdated Web'}
                    </span>
                    <span className="group-hover:text-zinc-900 font-semibold flex items-center gap-1">
                      <span>Review Outreach</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
