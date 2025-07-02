import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen cosmic-bg">
      <Navigation />
      <main className="pt-20">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/domains" component={Home} />
          <Route path="/staking" component={Home} />
          <Route path="/governance" component={Home} />
          <Route path="/marketplace" component={Home} />
          <Route path="/ai" component={Home} />
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
