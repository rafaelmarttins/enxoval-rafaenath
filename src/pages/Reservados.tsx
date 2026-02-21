import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type ReservadoItem = {
  id: string;
  nome: string;
  categoria: string;
  status: string;
  presenteadoPor: string;
};

export default function Reservados() {
  const { toast } = useToast();

  const [items, setItems] = useState<ReservadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreserveLoadingId, setUnreserveLoadingId] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("enxoval_items")
      .select("id, nome, categoria, status, presenteado_por")
      .eq("user_id", user.id)
      .not("presenteado_por", "is", null)
      .order("updated_at", { ascending: false });

    if (error || !data) {
      console.error("Erro ao carregar reservados:", error);
      setItems([]);
      setLoading(false);
      return;
    }

    const mapped: ReservadoItem[] = data
      .map((row: any) => ({
        id: row.id,
        nome: row.nome,
        categoria: row.categoria,
        status: row.status,
        presenteadoPor: row.presenteado_por,
      }))
      .filter((i) => Boolean(i.presenteadoPor));

    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    // Atualiza automaticamente quando houver mudanças na tabela
    const channel = supabase
      .channel("enxoval_items_reserved_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "enxoval_items" },
        () => {
          carregar();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const total = items.length;

  const agrupadosPorCategoria = useMemo(() => {
    const map = new Map<string, ReservadoItem[]>();
    for (const item of items) {
      const key = item.categoria || "(Sem categoria)";
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [items]);

  async function desreservar(item: ReservadoItem) {
    setUnreserveLoadingId(item.id);

    // Otimista
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      await carregar();
      setUnreserveLoadingId(null);
      return;
    }

    const { error } = await supabase
      .from("enxoval_items")
      .update({ presenteado_por: null })
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao desreservar:", error);
      await carregar();
      toast({
        title: "Não foi possível desreservar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
      setUnreserveLoadingId(null);
      return;
    }

    toast({
      title: "Reserva removida",
      description: `O item "${item.nome}" voltou a ficar disponível na lista pública.`,
    });

    setUnreserveLoadingId(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Lista Reservados</h1>
          </div>
          <p className="text-sm text-muted-foreground">Itens que convidados já reservaram na lista pública.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Itens reservados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{total}</p>
            </CardContent>
          </Card>
        </section>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Carregando reservas...</div>
        ) : total === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Nenhum item reservado no momento.</div>
        ) : (
          <section className="space-y-6">
            {agrupadosPorCategoria.map(([categoria, itemsCategoria]) => (
              <Card key={categoria}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{categoria}</CardTitle>
                    <Badge variant="secondary">{itemsCategoria.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Reservado por</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itemsCategoria.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.nome}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.presenteadoPor}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{item.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={unreserveLoadingId === item.id}
                                  onClick={() => desreservar(item)}
                                >
                                  {unreserveLoadingId === item.id ? "Desreservando..." : "Desreservar"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
