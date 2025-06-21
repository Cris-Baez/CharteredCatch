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
import HowItWorks from "./pages/how-it-works";
import SafetyGuidelines from "./pages/safety-guidelines";
import CaptainResources from "./pages/captain-resources";
import SafetyStandards from "./pages/safety-standards";
import Support from "./pages/support";
import CaptainOverview from "./pages/captain/overview";
import CaptainCharters from "./pages/captain/charters";
import CaptainBookings from "./pages/captain/bookings";
import CaptainMessages from "./pages/captain/messages";
import CaptainEarnings from "./pages/captain/earnings";
import CaptainProfile from "./pages/captain/profile";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchResults} />
        <Route path="/charter/:id" component={CharterDetail} />
        <Route path="/messages" component={Messages} />
        <Route path="/captain/dashboard" component={CaptainDashboard} />
        <Route path="/captain/overview" component={CaptainOverview} />
        <Route path="/captain/charters" component={CaptainCharters} />
        <Route path="/captain/bookings" component={CaptainBookings} />
        <Route path="/captain/messages" component={CaptainMessages} />
        <Route path="/captain/earnings" component={CaptainEarnings} />
        <Route path="/captain/profile" component={CaptainProfile} />
        <Route path="/assistant" component={Assistant} />
        <Route path="/help" component={Help} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/safety-guidelines" component={SafetyGuidelines} />
        <Route path="/captain-resources" component={CaptainResources} />
        <Route path="/safety-standards" component={SafetyStandards} />
        <Route path="/support" component={Support} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;