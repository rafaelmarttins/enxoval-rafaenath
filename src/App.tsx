import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ListaPresentes from "./pages/ListaPresentes";
import { AppShell } from "./components/AppShell";

const queryClient = new QueryClient();

function RequireAuth({ children, user }: { children: React.ReactNode; user: unknown }) {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

const App = () => {
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {loading ? (
            <div className="flex min-h-screen items-center justify-center bg-background">
              <span className="text-sm text-muted-foreground">Carregando...</span>
            </div>
          ) : (
            <Routes>
              {/* Pública (sem sidebar / sem login) */}
              <Route path="/lista-presentes" element={<Navigate to="/lista-presentes/enxoval" replace />} />
              <Route path="/lista-presentes/:slug" element={<ListaPresentes />} />

              {/* Rotas protegidas (com AppShell) */}
              <Route
                path="/"
                element={
                  <AppShell>
                    <RequireAuth user={user}>
                      <Dashboard />
                    </RequireAuth>
                  </AppShell>
                }
              />
              <Route
                path="/itens"
                element={
                  <AppShell>
                    <RequireAuth user={user}>
                      <Index />
                    </RequireAuth>
                  </AppShell>
                }
              />

              <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
