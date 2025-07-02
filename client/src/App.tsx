import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import DomainsPage from "@/pages/domains";
import StakingPage from "@/pages/staking";
import GovernancePage from "@/pages/governance";
import MarketplacePage from "@/pages/marketplace";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen cosmic-bg">
      <Navigation />
      <main className="pt-20">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/domains" component={DomainsPage} />
          <Route path="/staking" component={StakingPage} />
          <Route path="/governance" component={GovernancePage} />
          <Route path="/marketplace" component={MarketplacePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
