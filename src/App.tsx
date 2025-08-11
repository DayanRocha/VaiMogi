
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DriverApp from "./pages/DriverApp";
import { GuardianApp } from "./pages/GuardianApp";
import NotFound from "./pages/NotFound";
import { AuthFlow } from "./components/AuthFlow";
import { NotificationContainer } from "./components/NotificationToast";
import { useNotificationToasts } from "./hooks/useNotificationToasts";


const queryClient = new QueryClient();

const App = () => {
  const {
    notifications,
    dismissNotification,
    handleNotificationAction
  } = useNotificationToasts();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DriverApp />} />
            <Route path="/guardian" element={<GuardianApp />} />
            <Route path="/auth" element={<AuthFlow />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        
        {/* Container de Notificações Toast */}
        <NotificationContainer
          notifications={notifications}
          onDismiss={dismissNotification}
          onAction={handleNotificationAction}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
