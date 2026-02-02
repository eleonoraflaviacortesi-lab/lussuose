import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Export queryClient so it can be used to clear cache on auth changes
export const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* Tab routes - avoid 404s on deep links, PWA cache, or old navigation */}
            <Route path="/calendario" element={<Index initialTab="calendario" />} />
            <Route path="/notizie" element={<Index initialTab="notizie" />} />
            <Route path="/clienti" element={<Index initialTab="clienti" />} />
            <Route path="/report" element={<Index initialTab="report" />} />
            <Route path="/agenzia" element={<Index initialTab="agenzia" />} />
            <Route path="/impostazioni" element={<Index initialTab="impostazioni" />} />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
