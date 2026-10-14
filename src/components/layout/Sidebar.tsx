import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  Search,
  Users,
  History,
  Settings,
  Sparkles,
  ChevronRight,
  Database,
  ShieldCheck,
  X,
  Send,
  Bot,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentTab, setCurrentTab, leads, searches, user, dataSourceMode } = useApp();

  const totalDraftsCount = leads.reduce(
    (acc, lead) => acc + (Array.isArray(lead.outreachDrafts) ? lead.outreachDrafts.length : 0),
    0
  );

  const navItems: { id: NavigationTab; label: string; icon: React.ElementType; badge?: number; highlight?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-employee', label: 'AI Employee', icon: Bot, highlight: true },
    { id: 'new-search', label: 'New Lead Search', icon: Search },
    { id: 'leads', label: 'Leads', icon: Users, badge: leads.length },
    { id: 'outreach', label: 'Outreach', icon: Send, badge: totalDraftsCount > 0 ? totalDraftsCount : undefined },
    { id: 'history', label: 'Search History', icon: History, badge: searches.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: NavigationTab) => {
    setCurrentTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const qualifiedCount = leads.filter((l) => l.qualificationStatus === 'Qualified').length;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] md:w-20 lg:w-64 bg-white border-r border-zinc-200/80 flex flex-col justify-between transition-all duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col">
          {/* Brand header */}
          <div className="h-16 px-4 lg:px-5 border-b border-zinc-100 flex items-center justify-between md:justify-center lg:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-xs shrink-0">
                LP
              </div>
              <div className="md:hidden lg:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-zinc-900 text-sm tracking-tight">LeadPilot</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium">Autonomous Lead Employee</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-zinc-400 hover:text-zinc-600 rounded-md md:hidden"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick primary action banner */}
          <div className="p-3">
            <button
              onClick={() => handleNavClick('new-search')}
              title="New Lead Search"
              className="w-full min-h-[44px] flex items-center justify-center lg:justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-xs group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-300 shrink-0" />
                <span className="md:hidden lg:inline">+ New Lead Search</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform hidden lg:block" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-2 lg:px-3 space-y-1 mt-1">
            <div className="px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400 md:hidden lg:block">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={`w-full min-h-[44px] flex items-center justify-center lg:justify-between px-2.5 lg:px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 font-semibold'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'
                      }`}
                    />
                    <span className="md:hidden lg:inline truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${
                        isActive ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      <span className="md:hidden lg:inline">{item.badge}</span>
                      <span className="hidden md:inline lg:hidden text-[9px] font-bold px-1 py-0.2 bg-zinc-900 text-white rounded-full">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Assistant Status Mini Card */}
          <div className="mx-3 mt-6 p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/70 md:hidden lg:block">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                AI Employee Ready
              </span>
              <span className="text-[10px] font-mono text-zinc-400 font-medium">v1.0</span>
            </div>
            <p className="text-xs text-zinc-700 font-medium leading-relaxed">
              {qualifiedCount} qualified leads ready for outreach review.
            </p>
          </div>
        </div>

        {/* Bottom User & Environment Section */}
        <div className="p-3 border-t border-zinc-100 space-y-2">
          {/* Active Mode Note (Full on desktop/mobile drawer, compact on tablet rail) */}
          <div className="md:hidden lg:block">
            {dataSourceMode === 'real' ? (
              <div className="px-3 py-1.5 rounded-md bg-emerald-50/90 border border-emerald-200/70 flex items-center gap-2 text-[11px] text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate font-semibold">Real Data (Places API)</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-md bg-amber-50/80 border border-amber-200/60 flex items-center gap-2 text-[11px] text-amber-800">
                <Database className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate font-medium">Demo Mode</span>
              </div>
            )}
          </div>

          {/* Tablet rail mode icon indicator */}
          <div className="hidden md:flex lg:hidden justify-center py-1" title={dataSourceMode === 'real' ? 'Real Data Mode (Active)' : 'Demo Data Mode'}>
            <span
              className={`w-2.5 h-2.5 rounded-full ring-2 ${
                dataSourceMode === 'real'
                  ? 'bg-emerald-500 ring-emerald-100'
                  : 'bg-amber-500 ring-amber-100'
              }`}
            />
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-lg bg-zinc-50/50 border border-zinc-100">
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-zinc-200 shrink-0"
            />
            <div className="min-w-0 flex-1 md:hidden lg:block">
              <p className="text-xs font-semibold text-zinc-900 truncate">{user.name}</p>
              <p className="text-[11px] text-zinc-400 truncate">{user.company}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
