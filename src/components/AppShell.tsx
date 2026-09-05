import type { CSSProperties } from "react";
import { Home, ListChecks, LogOut, Moon, Sun, Laptop, BookmarkCheck, Heart, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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
    "flex items-center gap-3 rounded-md px-4 py-3 text-base font-semibold text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
  const navItemActive =
    "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm";

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-7">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div className="space-y-0.5">
              <p className="font-serif text-xl font-semibold leading-tight">Rafa &amp; Nath</p>
              <p className="text-xs font-semibold uppercase text-sidebar-foreground/50">Enxoval de casamento</p>
            </div>
          </div>

          <SidebarGroup className="mt-1">
            <SidebarGroupLabel className="px-6 text-xs font-semibold uppercase text-sidebar-foreground/40">
              Seu espaço
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
                       <span>Meu Enxoval</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/reservados" className={navItemBase} activeClassName={navItemActive}>
                      <BookmarkCheck className="h-5 w-5" />
                       <span>Lista de Reservados</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <div className="space-y-1 border-t border-sidebar-border px-4 py-5">
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground" disabled>
            <Settings className="h-5 w-5" />
            Configurações
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={handleLogout}
            className="w-full justify-start gap-3 px-4 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const page = location.pathname === "/" ? "Dashboard" : location.pathname === "/itens" ? "Meu Enxoval" : "Lista de Reservados";
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17rem",
          "--sidebar-width-icon": "3.5rem",
        } as CSSProperties
      }
    >
       <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col bg-background">
           <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/90 px-4 backdrop-blur md:px-8 supports-[backdrop-filter]:bg-card/80">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
               <span className="text-sm font-semibold text-foreground">{page}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
           <main className="flex-1 bg-background px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
