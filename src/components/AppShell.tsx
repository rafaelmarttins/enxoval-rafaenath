import type { CSSProperties } from "react";
import { Home, ListChecks, LogOut, Moon, Sun, Laptop, BookmarkCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const current = theme ?? "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {current === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : current === "light" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Laptop className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Laptop className="mr-2 h-4 w-4" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navItemBase =
    "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
  const navItemActive =
    "bg-sidebar-accent text-sidebar-foreground ring-1 ring-sidebar-border shadow-sm";

  return (
    <Sidebar collapsible="offcanvas" className="border-r bg-sidebar shadow-sm">
      <SidebarContent className="flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-6 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold shadow-sm">
              E
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">Enxoval</p>
              <p className="text-base font-semibold tracking-tight">Painel de Casa</p>
            </div>
          </div>

          <SidebarGroup className="mt-1">
            <SidebarGroupLabel className="px-6 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-4">
              <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/" end className={navItemBase} activeClassName={navItemActive}>
                      <Home className="h-5 w-5" />
                      <span>Dashboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/itens" className={navItemBase} activeClassName={navItemActive}>
                      <ListChecks className="h-5 w-5" />
                      <span>Itens do enxoval</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/reservados" className={navItemBase} activeClassName={navItemActive}>
                      <BookmarkCheck className="h-5 w-5" />
                      <span>Lista Reservados</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <div className="px-6 pb-6 pt-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </span>
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
          "--sidebar-width-icon": "3.5rem",
        } as CSSProperties
      }
    >
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col bg-background">
          <header className="flex h-20 items-center justify-between border-b bg-background/80 px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="text-sm font-medium text-muted-foreground">Painel de Casa</div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 bg-background px-8 py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
