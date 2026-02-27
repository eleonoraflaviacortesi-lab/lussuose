import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UndoRedoProvider } from "@/hooks/useUndoRedo";
import AppLayout from "@/components/layout/AppLayout";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

export const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UndoRedoProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* New clean routes */}
            <Route path="/" element={<AppLayout />} />
            <Route path="/properties" element={<AppLayout />} />
            <Route path="/contacts" element={<AppLayout />} />
            <Route path="/activities" element={<AppLayout />} />
            <Route path="/settings" element={<AppLayout />} />
            <Route path="/chat" element={<AppLayout />} />
            <Route path="/office" element={<AppLayout />} />
            <Route path="/inserisci" element={<AppLayout />} />

            {/* Legacy redirects */}
            <Route path="/notizie" element={<Navigate to="/properties" replace />} />
            <Route path="/clienti" element={<Navigate to="/contacts" replace />} />
            <Route path="/calendario" element={<Navigate to="/activities" replace />} />
            <Route path="/impostazioni" element={<Navigate to="/settings" replace />} />
            <Route path="/ufficio" element={<Navigate to="/office" replace />} />
            <Route path="/riunioni" element={<Navigate to="/office" replace />} />
            <Route path="/report" element={<Navigate to="/office" replace />} />
            <Route path="/agenzia" element={<Navigate to="/office" replace />} />

            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </UndoRedoProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
