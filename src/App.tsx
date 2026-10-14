import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { NewLeadSearch } from './components/search/NewLeadSearch';
import { ResearchProgressView } from './components/search/ResearchProgressView';
import { LeadsView } from './components/leads/LeadsView';
import { LeadDetailDrawer } from './components/leads/LeadDetailDrawer';
import { OutreachWorkspaceView } from './components/outreach/OutreachWorkspaceView';
import { SearchHistoryView } from './components/history/SearchHistoryView';
import { SettingsView } from './components/settings/SettingsView';
import { AIEmployeeWorkspaceView } from './components/employee/AIEmployeeWorkspaceView';
import { BottomNavigation } from './components/layout/BottomNavigation';

const MainLayout: React.FC = () => {
  const { currentTab } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row">
      {/* Sidebar Navigation (Offcanvas on mobile, rail on tablet, expanded on desktop) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-20 lg:pl-64 flex flex-col min-w-0 min-h-screen transition-all">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {currentTab === 'dashboard' && <DashboardView />}
          {currentTab === 'ai-employee' && <AIEmployeeWorkspaceView />}
          {currentTab === 'new-search' && <NewLeadSearch />}
          {currentTab === 'research-progress' && <ResearchProgressView />}
          {currentTab === 'leads' && <LeadsView />}
          {currentTab === 'outreach' && <OutreachWorkspaceView />}
          {currentTab === 'history' && <SearchHistoryView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Fixed Ergonomic Bottom Tab Navigation for Mobile (<768px) */}
      <BottomNavigation />

      {/* Slide-over Lead Detail Drawer */}
      <LeadDetailDrawer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
