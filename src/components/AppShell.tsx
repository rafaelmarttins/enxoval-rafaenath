import { Home, ListChecks, ShoppingBag, Settings, LogOut } from "lucide-react";
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

import { cn } from "@/lib/utils";

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas" className="border-r bg-sidebar">
      <SidebarContent className="flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
              E
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Enxoval</p>
              <p className="text-sm font-semibold">Painel de Casa</p>
            </div>
          </div>

          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/"
                      end
                      className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      activeClassName="bg-background text-foreground shadow-sm"
                    >
                      <ListChecks className="h-4 w-4" />
                      <span>Itens do enxoval</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled className={cn("cursor-default rounded-full px-3 py-2 text-sm text-muted-foreground/70")}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled className={cn("cursor-default rounded-full px-3 py-2 text-sm text-muted-foreground/70")}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>Compras planejadas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled className={cn("cursor-default rounded-full px-3 py-2 text-sm text-muted-foreground/70")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <div className="px-4 pb-4 pt-2 text-xs text-muted-foreground">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <LogOut className="h-3.5 w-3.5" />
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="text-sm text-muted-foreground">
                Painel de Casa
              </div>
            </div>
          </header>
          <main className="flex-1 bg-muted/40">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
