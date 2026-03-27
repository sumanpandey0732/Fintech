import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider, useApp } from "@/context/AppContext";
import OnboardingPage from "@/pages/Onboarding";
import HomePage from "@/pages/Home";
import AnalyticsPage from "@/pages/Analytics";
import GoalsPage from "@/pages/Goals";
import ProfilePage from "@/pages/Profile";
import AIChatPage from "@/pages/AIChat";
import Sidebar from "@/components/Sidebar";

const queryClient = new QueryClient();
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function AppRoutes() {
  const { profile } = useApp();
  const [location] = useLocation();

  if (!profile.isOnboarded && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }
  if (profile.isOnboarded && location === "/onboarding") {
    return <Redirect to="/" />;
  }

  if (!profile.isOnboarded) {
    return (
      <Switch>
        <Route path="/onboarding" component={OnboardingPage} />
      </Switch>
    );
  }

  return (
    <div className="flex h-full gradient-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/goals" component={GoalsPage} />
          <Route path="/ai-chat" component={AIChatPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route><Redirect to="/" /></Route>
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <WouterRouter base={BASE}>
          <AppRoutes />
        </WouterRouter>
      </AppProvider>
    </QueryClientProvider>
  );
}
