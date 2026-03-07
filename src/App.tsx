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
import { lazy, Suspense } from "react";

// Lazy-load page components
const PersonalDashboard = lazy(() => import('@/components/dashboard/PersonalDashboard'));
const NotiziePage = lazy(() => import('@/components/notizie/NotiziePage'));
const ClientiPage = lazy(() => import('@/components/clienti/ClientiPage'));
const CalendarPage = lazy(() => import('@/components/calendar/CalendarPage'));
const SettingsPage = lazy(() => import('@/components/settings/SettingsPage'));
const SedeTargetsPage = lazy(() => import('@/components/settings/SedeTargetsPage'));
const OfficeChatPage = lazy(() => import('@/components/chat/OfficeChatPage'));
const UfficioPage = lazy(() => import('@/components/ufficio/UfficioPage'));
const ReportForm = lazy(() => import('@/components/dashboard/ReportPage'));

export const queryClient = new QueryClient();

const PageSuspense = ({ children }: { children: React.ReactNode }) => (
  <Suspense
    fallback={
      <div className="py-10 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    }
  >
    {children}
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UndoRedoProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><PageSuspense><PersonalDashboard /></PageSuspense></AppLayout>} />
            <Route path="/properties" element={<AppLayout><PageSuspense><NotiziePage /></PageSuspense></AppLayout>} />
            <Route path="/contacts" element={<AppLayout><PageSuspense><ClientiPage /></PageSuspense></AppLayout>} />
            <Route path="/activities" element={<AppLayout><PageSuspense><CalendarPage /></PageSuspense></AppLayout>} />
            <Route path="/settings" element={<AppLayout><PageSuspense><SettingsPage /></PageSuspense></AppLayout>} />
            <Route path="/sede-targets" element={<AppLayout><PageSuspense><SedeTargetsPage /></PageSuspense></AppLayout>} />
            <Route path="/chat" element={<AppLayout><PageSuspense><OfficeChatPage /></PageSuspense></AppLayout>} />
            <Route path="/office" element={<AppLayout><PageSuspense><UfficioPage /></PageSuspense></AppLayout>} />
            <Route path="/inserisci" element={<AppLayout><PageSuspense><ReportForm /></PageSuspense></AppLayout>} />

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
