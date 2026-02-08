import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const reserveSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome").max(60, "Nome muito longo"),
});

type PublicItem = {
  id: string;
  nome: string;
  categoria: string;
  quantidadeDesejada: number;
  imageUrl?: string;
  productUrl?: string;
  presenteadoPor?: string;
};

type SortMode = "categoria" | "nome";

export default function ListaPresentes() {
  const { toast } = useToast();
  const { slug } = useParams();

  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [sortMode, setSortMode] = useState<SortMode>("categoria");

  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveItem, setReserveItem] = useState<PublicItem | null>(null);
  const [reserveName, setReserveName] = useState("");
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("enxoval_items")
      .select("id, nome, categoria, quantidade_desejada, image_url, product_url, presenteado_por")
      .eq("status", "Não comprado");

    if (error || !data) {
      console.error("Erro ao carregar lista pública:", error);
      setItems([]);
      setLoading(false);
      return;
    }

    const mapped: PublicItem[] = data.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      categoria: row.categoria,
      quantidadeDesejada: Number(row.quantidade_desejada) || 0,
      imageUrl: row.image_url ?? undefined,
      productUrl: row.product_url ?? undefined,
      presenteadoPor: row.presenteado_por ?? undefined,
    }));

    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("enxoval_items_public_gift_list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "enxoval_items" },
        () => {
          // simples e consistente: recarrega a lista
          carregar();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.categoria));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [items]);

  const filtrados = useMemo(() => {
    let out = [...items];

    const termo = busca.trim().toLowerCase();
    if (termo) out = out.filter((i) => i.nome.toLowerCase().includes(termo));

    if (categoria !== "todas") out = out.filter((i) => i.categoria === categoria);

    out.sort((a, b) => {
      if (sortMode === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
      const c = a.categoria.localeCompare(b.categoria, "pt-BR");
      if (c !== 0) return c;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

    return out;
  }, [items, busca, categoria, sortMode]);

  const disponiveisCount = useMemo(() => filtrados.filter((i) => !i.presenteadoPor).length, [filtrados]);

  function abrirReserva(item: PublicItem) {
    setReserveItem(item);
    setReserveName("");
    setReserveError(null);
    setReserveOpen(true);
  }

  async function confirmarReserva() {
    if (!reserveItem) return;

    const parsed = reserveSchema.safeParse({ nome: reserveName });
    if (!parsed.success) {
      setReserveError(parsed.error.issues[0]?.message ?? "Nome inválido");
      return;
    }

    setReserveLoading(true);
    setReserveError(null);

    // Otimista: já marca como reservado na UI
    setItems((prev) => prev.map((i) => (i.id === reserveItem.id ? { ...i, presenteadoPor: parsed.data.nome } : i)));

    const { data, error } = await supabase.rpc("reserve_enxoval_item", {
      p_item_id: reserveItem.id,
      p_nome: parsed.data.nome,
    });

    if (error) {
      console.error("Erro ao reservar:", error);
      // Recarrega para refletir estado real do backend
      await carregar();
      setReserveLoading(false);
      toast({
        title: "Não foi possível reservar",
        description: "Este item pode ter sido reservado por outra pessoa agora.",
        variant: "destructive",
      });
      return;
    }

    if (data !== true) {
      await carregar();
      setReserveLoading(false);
      toast({
        title: "Item já reservado",
        description: "Parece que alguém reservou este item antes de você.",
      });
      return;
    }

    setReserveLoading(false);
    setReserveOpen(false);

    toast({
      title: "Reserva confirmada",
      description: `Item reservado por ${parsed.data.nome}. Obrigado!`,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Lista de presentes</h1>
              <p className="text-sm text-muted-foreground">
                Escolha um item do nosso enxoval para presentear. {slug ? `(${slug})` : ""}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {disponiveisCount} itens disponíveis para presente
            </Badge>
          </div>

          <Card className="border-primary/10 bg-card/50">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label htmlFor="busca" className="text-xs text-muted-foreground">
                  Buscar
                </Label>
                <Input
                  id="busca"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Ex.: jogo de panelas"
                />
              </div>

              <div className="sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="todas">Todas</SelectItem>
                    {categorias.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Ordenar</Label>
                <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="categoria">Por categoria</SelectItem>
                    <SelectItem value="nome">A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </header>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Carregando lista...</div>
        ) : filtrados.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">Nenhum item disponível no momento.</div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((item) => {
              const reservado = Boolean(item.presenteadoPor);

              return (
                <Card key={item.id} className="overflow-hidden">
                  {item.imageUrl ? (
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={item.imageUrl}
                        alt={`Foto do item ${item.nome}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] w-full bg-muted" />
                  )}

                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="secondary">{item.categoria}</Badge>
                      <Badge variant="outline">Qtd: {item.quantidadeDesejada}</Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">{item.nome}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {item.productUrl ? (
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Ver na loja
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Link da loja não informado.</p>
                    )}

                    {reservado ? (
                      <div className="flex items-center justify-between gap-2">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                          Reservado por {item.presenteadoPor}
                        </Badge>
                        <Button type="button" variant="secondary" disabled>
                          Reservado
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" className="w-full" onClick={() => abrirReserva(item)}>
                        Quero presentear
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </main>

      <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reserveName">Seu nome</Label>
            <Input
              id="reserveName"
              value={reserveName}
              onChange={(e) => setReserveName(e.target.value)}
              placeholder="Ex.: Tia Maria"
              autoComplete="name"
              disabled={reserveLoading}
            />
            {reserveError ? <p className="text-sm text-destructive">{reserveError}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReserveOpen(false)} disabled={reserveLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmarReserva} disabled={reserveLoading}>
              {reserveLoading ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
