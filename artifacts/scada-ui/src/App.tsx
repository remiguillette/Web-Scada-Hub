import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@workspace/ui";
import NotFound from "@/pages/not-found";
import ElectricalOneLinePage from "@/pages/ElectricalOneLinePage";
import SimulationPage from "@/pages/SimulationPage";
import { GridSimulationProvider } from "@/context/GridSimulationContext";
import { GeneratorSimulationProvider } from "@/context/GeneratorSimulationContext";
import { ScadaStateProvider } from "@/hooks/use-scada-state";
import { LanguageProvider } from "@/context/LanguageContext";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={ElectricalOneLinePage} />
      <Route path="/power" component={SimulationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <GridSimulationProvider>
            <GeneratorSimulationProvider>
              <ScadaStateProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
              </ScadaStateProvider>
            </GeneratorSimulationProvider>
          </GridSimulationProvider>
        </LanguageProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
