import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/home";
import SearchResults from "./pages/search-results";
import CharterDetail from "./pages/charter-detail";
import Messages from "./pages/messages";
import CaptainDashboard from "./pages/captain-dashboard";
import Assistant from "./pages/assistant";
import Help from "./pages/help";
import Login from "./pages/login";
import Signup from "./pages/signup";
import NotFound from "./pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchResults} />
        <Route path="/charter/:id" component={CharterDetail} />
        <Route path="/messages" component={Messages} />
        <Route path="/captain/dashboard" component={CaptainDashboard} />
        <Route path="/assistant" component={Assistant} />
        <Route path="/help" component={Help} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;