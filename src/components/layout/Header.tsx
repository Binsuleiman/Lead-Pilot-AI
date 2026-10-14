import React from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Plus, Download, RotateCcw, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    currentTab,
    setCurrentTab,
    dataSourceMode,
    setDataSourceMode,
    resetDemoData,
    exportCsv,
    selectedLeadIds,
    leads,
  } = useApp();

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of lead discovery operations and pipeline performance.',
    },
    'new-search': {
      title: 'New Lead Search',
      subtitle: 'Instruct your AI employee to discover and qualify businesses.',
    },
    'research-progress': {
      title: 'Live Lead Research',
      subtitle: 'AI agent executing verification and qualification sequence.',
    },
    leads: {
      title: 'Lead Database',
      subtitle: 'Curated businesses, qualification reasoning, and outreach copy.',
    },
    history: {
      title: 'Search History',
      subtitle: 'Archive of past search missions and their results.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Workspace preferences, AI qualification rules, and integrations.',
    },
  };

  const currentInfo = tabTitles[currentTab] || {
    title: 'LeadPilot AI',
    subtitle: 'Autonomous Lead Generation',
  };

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu toggle with >=44px touch target */}
        <button
          onClick={onOpenMobileMenu}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-600 hover:text-zinc-900 rounded-lg md:hidden -ml-2"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Title & breadcrumbs */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight truncate">
              {currentInfo.title}
            </h1>
            <span className="hidden lg:inline-block text-[11px] text-zinc-400 font-mono">
              / binsuleiman-workspace
            </span>
          </div>
          <p className="hidden md:block text-xs text-zinc-500 font-normal truncate">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Real Data vs Demo Data Mode Switch */}
        <div className="flex items-center p-0.5 sm:p-1 bg-zinc-100 rounded-lg border border-zinc-200/80 text-[11px] sm:text-xs">
          <button
            onClick={() => setDataSourceMode('real')}
            className={`min-h-[32px] px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 sm:gap-1.5 ${
              dataSourceMode === 'real'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            title="Search real live business listings via Google Places API"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dataSourceMode === 'real' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
            <span className="hidden sm:inline">Real Data</span>
            <span className="sm:hidden">Real</span>
          </button>
          <button
            onClick={() => setDataSourceMode('demo')}
            className={`min-h-[32px] px-2 sm:px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 sm:gap-1.5 ${
              dataSourceMode === 'demo'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
            title="Use fictional demo businesses for UI testing"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dataSourceMode === 'demo' ? 'bg-amber-500' : 'bg-zinc-400'}`} />
            <span className="hidden sm:inline">Demo Data</span>
            <span className="sm:hidden">Demo</span>
          </button>
        </div>

        {/* Reset Data Button (Icon on mobile, labeled on tablet/desktop) */}
        <button
          onClick={resetDemoData}
          title={dataSourceMode === 'demo' ? 'Reset demo sample businesses' : 'Clear real search history'}
          className="inline-flex items-center justify-center gap-1.5 min-h-[36px] min-w-[36px] px-2 sm:px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200/80 rounded-lg transition-colors shadow-2xs"
          aria-label={dataSourceMode === 'demo' ? 'Reset Demo Data' : 'Clear Search History'}
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="hidden md:inline">{dataSourceMode === 'demo' ? 'Reset Demo' : 'Clear History'}</span>
        </button>

        {/* CSV Export Button if on Leads view */}
        {currentTab === 'leads' && (
          <button
            onClick={exportCsv}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100/80 hover:bg-zinc-200/70 border border-zinc-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">
              Export CSV {selectedLeadIds.length > 0 ? `(${selectedLeadIds.length})` : ''}
            </span>
            <span className="sm:hidden">
              CSV {selectedLeadIds.length > 0 ? `(${selectedLeadIds.length})` : ''}
            </span>
          </button>
        )}

        {/* New Search Primary CTA (Desktop & Tablet) */}
        {currentTab !== 'new-search' && currentTab !== 'research-progress' && (
          <button
            onClick={() => setCurrentTab('new-search')}
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[36px] px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead Search</span>
          </button>
        )}
      </div>
    </header>
  );
};
