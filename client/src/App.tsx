import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Páginas públicas
import Home from "./pages/home";
import SearchResults from "./pages/search-results";
import CharterDetail from "./pages/charter-detail";
import Assistant from "./pages/assistant";
import Help from "./pages/help";
import Login from "./pages/login";
import Signup from "./pages/signup";
import NotFound from "./pages/not-found";
import HowItWorks from "./pages/how-it-works";
import SafetyGuidelines from "./pages/safety-guidelines";
import CaptainResources from "./pages/captain/captain-resources";
import SafetyStandards from "./pages/safety-standards";
import Support from "./pages/support";
import Terms from "./pages/terms";
import Privacy from "./pages/privacy";
import Cancellation from "./pages/cancellation";
import CaptainsPage from "./pages/captainspage";
import CaptainDetail from "./pages/captain-detail"
// Usuario
import HomeUser from "./pages/user/homeuser";
import SearchResultsUser from "./pages/user/search-results-user";
import MyTrips from "./pages/user/my-trips";
import CharterDetailUser from "./pages/user/charter-detail-user";
import UserProfile from "./pages/user/profileuser"
import HelpUser from "./pages/user/helpuser"
import Messages from "./pages/user/messages";
import UserCheckout from "./pages/user/checkout"

// Capitán
import CaptainDashboard from "./pages/captain/captain-dashboard";
import CaptainOverview from "./pages/captain/overview";
import CaptainCharters from "./pages/captain/charters";
import CaptainBookings from "./pages/captain/bookings";
import CaptainMessages from "./pages/captain/messages";
import CaptainEarnings from "./pages/captain/earnings";
import CaptainProfile from "./pages/captain/profile";
import CreateCharter from "./pages/captain/create-charter";
import CaptainCalendar from "./pages/captain/calendar";
import CaptainAnalytics from "./pages/captain/analytics";
import CaptainSubscribe from "./pages/captain/subscribe";
import EditCharter from "./pages/captain/edit-charter";

// Admin
import Admin from "./pages/admin";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        {/* Público */}
        <Route path="/" component={Home} />
        <Route path="/search" component={SearchResults} />
        <Route path="/charters/:id" component={CharterDetail} />
        <Route path="/messages" component={Messages} />
        <Route path="/assistant" component={Assistant} />
        <Route path="/help" component={Help} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/cancellation" component={Cancellation} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/safety-guidelines" component={SafetyGuidelines} />
        <Route path="/captain-resources" component={CaptainResources} />
        <Route path="/safety-standards" component={SafetyStandards} />
        <Route path="/support" component={Support} />
        <Route path="/captains" component={CaptainsPage} />
        <Route path="/captains/:id" component={CaptainDetail}/>
        {/* Usuario normal */}
        <Route path="/user/home" component={HomeUser} />
        <Route path="/user/search" component={SearchResultsUser} />
        <Route path="/user/my-trips" component={MyTrips} />
        <Route path="/user/profileuser" component={UserProfile} />
        <Route path="/user/charters/:id" component={CharterDetailUser} />
        <Route path="/user/helpuser" component={HelpUser} />
        <Route path="/user/messages" component={Messages} />
        <Route path="/user/checkout" component={UserCheckout} />
        {/* Capitán */}
        <Route path="/captain/dashboard" component={CaptainDashboard} />
        <Route path="/captain" component={CaptainOverview} />
        <Route path="/captain/overview" component={CaptainOverview} />
        <Route path="/captain/charters" component={CaptainCharters} />
        <Route path="/captain/charters/new" component={CreateCharter} />
        <Route path="/captain/charters/:id/edit" component={EditCharter} />
        <Route path="/captain/bookings" component={CaptainBookings} />
        <Route path="/captain/messages" component={CaptainMessages} />
        <Route path="/captain/earnings" component={CaptainEarnings} />
        <Route path="/captain/profile" component={CaptainProfile} />
        <Route path="/captain/calendar" component={CaptainCalendar} />
        <Route path="/captain/analytics" component={CaptainAnalytics} />
        <Route path="/captain/subscribe" component={CaptainSubscribe} />

        {/* Admin */}
        <Route path="/admin" component={Admin} />

        {/* Not Found */}
        <Route component={NotFound} />
      </Switch>

      <Toaster />
    </QueryClientProvider>
  );
}

export default App;