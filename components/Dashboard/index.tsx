'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInterface } from './ChatInterface';
import { AnalyticsPanel } from './AnalyticsPanel';
import Navbar from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { PortfolioStyleModal, OnboardingData } from '@/components/Onboarding';

export function Dashboard() {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isMobileAnalyticsOpen, setIsMobileAnalyticsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Show onboarding modal after a short delay (always show for debugging)
    const timer = setTimeout(() => {
      setShowOnboarding(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = (data: OnboardingData) => {
    // Don't save to localStorage - just close the modal
    setShowOnboarding(false);
    console.log('Onboarding completed:', data);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Onboarding Modal */}
      <PortfolioStyleModal 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete}
      />

      {/* Main Content */}
      <main className="flex-1 relative flex">
        {/* Left Panel: Chat (Expands/Contracts on Desktop, Full Width on Mobile) */}
        <div 
          className={`relative z-10 flex flex-col w-full transition-all duration-300 ${
            hasInteracted ? 'md:w-[35%]' : 'md:w-full'
          }`}
          style={{
            borderRight: hasInteracted ? '1px solid hsl(var(--border))' : '0px solid transparent'
          }}
        >
          <ChatInterface 
            onMessageSent={() => setHasInteracted(true)}
            onBotResponseComplete={() => setShowAnalytics(true)}
            onToggleAnalytics={() => setIsMobileAnalyticsOpen(!isMobileAnalyticsOpen)}
            isExpanded={hasInteracted}
            showAnalyticsButton={showAnalytics}
          />
        </div>

        {/* Right Panel: Analytics (Desktop: Slides in, Mobile: Drawer) */}
        <AnimatePresence>
          {showAnalytics && (
            <>
              {/* Desktop View */}
              <motion.div 
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden md:block flex-1 bg-background relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-card/50">
                  <AnalyticsPanel />
                </div>
              </motion.div>

              {/* Mobile Drawer */}
              {isMobileAnalyticsOpen && (
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="md:hidden fixed inset-0 z-50 bg-background"
                  style={{ top: '4rem' }} // 64px (h-16) for navbar height
                >
                  <AnalyticsPanel onClose={() => setIsMobileAnalyticsOpen(false)} />
                </motion.div>
              )}

              {/* Mobile Backdrop */}
              {isMobileAnalyticsOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileAnalyticsOpen(false)}
                  className="md:hidden fixed inset-0 bg-black/60 z-40"
                  style={{ top: '4rem' }} // 64px (h-16) for navbar height
                />
              )}
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

