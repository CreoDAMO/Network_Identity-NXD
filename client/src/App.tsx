import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/home";
import Domains from "./pages/domains";
import Marketplace from "./pages/marketplace";
import Staking from "./pages/staking";
import Governance from "./pages/governance";
import NotFound from "./pages/not-found";
import { AdminPanel } from "@/components/admin-panel";
import { InvestorDashboard } from './components/investor-dashboard';
import { InvestorDashboardEnhanced } from './components/investor-dashboard-enhanced';
import ComprehensiveFinalDashboard from './components/comprehensive-final-dashboard';
import Navigation from "@/components/navigation";
import { UnifiedDashboard } from "@/components/unified-dashboard";
import AIAssistant from "@/components/ai-assistant";
import VoiceNavigation from "@/components/voice-navigation";
import { queryClient } from "@/lib/queryClient";
import { Web3Provider } from "@/components/Web3Provider";
import { useState } from "react";
import { TokenGenerator } from "@/components/token-generator";

export default function App() {
  const [isAIMinimized, setIsAIMinimized] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-galaxy-gray via-cosmic-purple/20 to-nebula-blue/20">
          <Navigation />
          <main className="flex-1 flex">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/domains" component={Domains} />
              <Route path="/marketplace" component={Marketplace} />
              <Route path="/staking" component={Staking} />
              <Route path="/governance" component={Governance} />
              <Route path="/services" component={() => <UnifiedDashboard />} />
              <Route path="/investor" component={InvestorDashboard} />
              <Route path="/investor-enhanced" component={InvestorDashboardEnhanced} />
              <Route path="/comprehensive" component={ComprehensiveFinalDashboard} />
              <Route path="/admin" component={AdminPanel} />
              <Route path="/tokens" component={TokenGenerator} />
              <Route component={NotFound} />
            </Switch>
          </main>

          {/* AI Assistant */}
          <AIAssistant 
            isMinimized={isAIMinimized} 
            onToggle={() => setIsAIMinimized(!isAIMinimized)} 
          />

          {/* Voice Navigation */}
          <VoiceNavigation />
        </div>
        <Toaster />
        </TooltipProvider>
      </Web3Provider>
    </QueryClientProvider>
  );
}