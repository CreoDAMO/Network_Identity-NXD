import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/home";
import Domains from "./pages/domains";
import Staking from "./pages/staking";
import Governance from "./pages/governance";
import Marketplace from "./pages/marketplace";
import NotFound from "./pages/not-found";
import Navigation from "./components/navigation";
import UnifiedDashboard from "./components/unified-dashboard";
import AIAssistant from "./components/ai-assistant";
import { useState } from "react";

const queryClient = new QueryClient();

function App() {
  const [isAIMinimized, setIsAIMinimized] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-galaxy-gray via-cosmic-purple/20 to-nebula-blue/20">
          <Navigation />
          <main className="flex-1 flex">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/domains" component={Domains} />
              <Route path="/staking" component={Staking} />
              <Route path="/governance" component={Governance} />
              <Route path="/marketplace" component={Marketplace} />
              <Route path="/services" component={() => <UnifiedDashboard />} />
              <Route component={NotFound} />
            </Switch>
          </main>

          {/* AI Assistant */}
          <AIAssistant 
            isMinimized={isAIMinimized} 
            onToggle={() => setIsAIMinimized(!isAIMinimized)} 
          />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}