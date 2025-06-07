import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import CharterDetail from "@/pages/charter-detail";
import SearchResults from "@/pages/search-results";
import Messages from "@/pages/messages";
import CaptainDashboard from "@/pages/captain-dashboard";
import Assistant from "@/pages/assistant";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/charters/:id" component={CharterDetail} />
      <Route path="/search" component={SearchResults} />
      <Route path="/messages" component={Messages} />
      <Route path="/captain/dashboard" component={CaptainDashboard} />
      <Route path="/assistant" component={Assistant} />
      <Route path="/help" component={Help} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
