import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  Search,
  Users,
  History,
  Settings,
  Send,
  Bot,
} from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const { currentTab, setCurrentTab, leads, searches } = useApp();

  const totalDraftsCount = leads.reduce(
    (acc, lead) => acc + (Array.isArray(lead.outreachDrafts) ? lead.outreachDrafts.length : 0),
    0
  );

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-employee', label: 'AI Agent', icon: Bot },
    { id: 'new-search', label: 'Search', icon: Search },
    { id: 'leads', label: 'Leads', icon: Users, badge: leads.length },
    { id: 'outreach', label: 'Outreach', icon: Send, badge: totalDraftsCount > 0 ? totalDraftsCount : undefined },
    { id: 'history', label: 'History', icon: History, badge: searches.length },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-6 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all select-none ${
                isActive
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-zinc-900 text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-2xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
                  isActive ? 'text-zinc-950 font-bold' : 'text-zinc-500 font-medium'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-zinc-900 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
