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
          <AppShell>
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={
                    <RequireAuth user={user}>
                      <Dashboard />
                    </RequireAuth>
                  }
                />

                {/* Pública (sem login) */}
                <Route path="/lista-presentes" element={<Navigate to="/lista-presentes/enxoval" replace />} />
                <Route path="/lista-presentes/:slug" element={<ListaPresentes />} />

                <Route
                  path="/itens"
                  element={
                    <RequireAuth user={user}>
                      <Index />
                    </RequireAuth>
                  }
                />
                <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            )}
          </AppShell>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
