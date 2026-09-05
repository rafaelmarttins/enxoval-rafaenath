import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ArrowRight, CheckCircle2, CircleDollarSign, Copy, ExternalLink, Gift, Package, ShoppingBag, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";


const STORAGE_KEY = "enxoval_casamento_itens_v1";

const CATEGORIAS = [
  "Cozinha",
  "Quarto",
  "Banheiro",
  "Sala",
  "Decoração",
  "Eletrodomésticos",
  "Outros",
] as const;

type Categoria = (typeof CATEGORIAS)[number];

type Prioridade = "Alta" | "Média" | "Baixa";
type Status = "Não comprado" | "Comprado" | "Presenteado";

type EnxovalItem = {
  id: string;
  nome: string;
  categoria: Categoria;
  quantidadeDesejada: number;
  quantidadeAdquirida: number;
  valorUnitario: number;
  prioridade: Prioridade;
  status: Status;
  presenteadoPor: string | null;
};


const STATUS_COLORS: Record<Status, string> = {
  "Não comprado": "hsl(var(--muted-foreground))",
  Comprado: "hsl(var(--success))",
  Presenteado: "hsl(var(--primary))",
};

const CATEGORIA_COLORS: Record<Categoria, string> = {
  Cozinha: "hsl(37 90% 55%)",
  Quarto: "hsl(271 81% 56%)",
  Banheiro: "hsl(199 89% 48%)",
  Sala: "hsl(var(--success))",
  Decoração: "hsl(326 74% 55%)",
  Eletrodomésticos: "hsl(210 80% 45%)",
  Outros: "hsl(215 14% 34%)",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

function loadItems(): EnxovalItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EnxovalItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      quantidadeDesejada: Number(item.quantidadeDesejada) || 0,
      quantidadeAdquirida: Number(item.quantidadeAdquirida) || 0,
      valorUnitario: Number(item.valorUnitario) || 0,
    }));
  } catch {
    return [];
  }
}

const Dashboard = () => {
  const [items, setItems] = useState<EnxovalItem[]>([]);

  const carregarItens = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      setItems(loadItems());
      return;
    }

    const { data, error } = await supabase
      .from("enxoval_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Erro ao carregar itens do backend no Dashboard:", error);
      setItems(loadItems());
      return;
    }

    const mapeados: EnxovalItem[] = data.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      categoria: row.categoria as Categoria,
      quantidadeDesejada: Number(row.quantidade_desejada) || 0,
      quantidadeAdquirida: Number(row.quantidade_adquirida) || 0,
      valorUnitario: Number(row.valor_unitario) || 0,
      prioridade: row.prioridade as Prioridade,
      status: row.status as Status,
    }));

    setItems(mapeados);
  };

  useEffect(() => {
    carregarItens();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("enxoval_items_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "enxoval_items",
        },
        () => {
          carregarItens();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalItens = items.length;
  const totalComprados = useMemo(
    () => items.filter((i) => i.status === "Comprado").length,
    [items],
  );
  const totalPresenteados = useMemo(
    () => items.filter((i) => i.status === "Presenteado").length,
    [items],
  );
  const totalNaoComprados = totalItens - totalComprados - totalPresenteados;

  const percentualConclusao = totalItens === 0 ? 0 : Math.round(((totalComprados + totalPresenteados) / totalItens) * 100);

  const valorTotalPlanejadoGeral = useMemo(
    () => items.reduce((acc, i) => acc + i.quantidadeDesejada * i.valorUnitario, 0),
    [items],
  );

  const valorTotalEnxoval = useMemo(
    () => items.reduce((acc, i) => (i.status !== "Não comprado" ? acc + i.quantidadeDesejada * i.valorUnitario : acc), 0),
    [items],
  );

  const valorFaltante = useMemo(
    () => items.reduce((acc, i) => (i.status === "Não comprado" ? acc + i.quantidadeDesejada * i.valorUnitario : acc), 0),
    [items],
  );

  const porCategoria = useMemo(() => {
    const mapa = new Map<Categoria, { categoria: Categoria; valor: number }>();
    items.forEach((item) => {
      const atual = mapa.get(item.categoria) ?? { categoria: item.categoria, valor: 0 };
      atual.valor += item.quantidadeDesejada * item.valorUnitario;
      mapa.set(item.categoria, atual);
    });
    return Array.from(mapa.values());
  }, [items]);

  const porStatus = [
    { status: "Comprado" as Status, valor: totalComprados },
    { status: "Presenteado" as Status, valor: totalPresenteados },
    { status: "Não comprado" as Status, valor: totalNaoComprados },
  ].filter((s) => s.valor > 0);

  const porCategoriaValores = useMemo(
    () => {
      const mapa = new Map<Categoria, { categoria: Categoria; gasto: number; faltante: number }>();

      items.forEach((item) => {
        const gasto = item.status === "Comprado" ? item.quantidadeAdquirida * item.valorUnitario : 0;
        const faltante = item.status === "Não comprado" ? item.quantidadeDesejada * item.valorUnitario : 0;

        const atual =
          mapa.get(item.categoria) ?? ({ categoria: item.categoria, gasto: 0, faltante: 0 } as const);

        mapa.set(item.categoria, {
          categoria: item.categoria,
          gasto: atual.gasto + gasto,
          faltante: atual.faltante + faltante,
        });
      });

      return Array.from(mapa.values());
    },
    [items],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-7">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold text-primary">Visão geral</p>
          <h1 className="font-serif text-3xl font-semibold md:text-4xl">Como está o nosso enxoval?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe o que já conquistamos e planeje as próximas compras.</p>
        </div>
        <Link to="/itens" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          Ver meu enxoval <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-primary bg-primary text-primary-foreground md:col-span-2">
            <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-foreground/70">Progresso total</p>
                  <p className="mt-2 font-serif text-5xl font-semibold">{percentualConclusao}%</p>
                </div>
                <CheckCircle2 className="h-7 w-7 text-primary-foreground/70" />
              </div>
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20">
                  <div className="h-full rounded-full bg-primary-foreground transition-all" style={{ width: `${percentualConclusao}%` }} />
                </div>
                <p className="mt-3 text-sm text-primary-foreground/70">{totalComprados + totalPresenteados} de {totalItens} itens concluídos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Itens cadastrados</p><Package className="h-5 w-5 text-primary" /></div>
              <p className="mt-4 font-serif text-3xl font-semibold">{totalItens}</p>
              <p className="mt-1 text-xs text-muted-foreground">Em todas as categorias</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold text-muted-foreground">Total investido</p><CircleDollarSign className="h-5 w-5 text-success" /></div>
              <p className="mt-4 font-serif text-3xl font-semibold">{formatCurrency(valorTotalEnxoval)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Faltam {formatCurrency(valorFaltante)}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progresso por status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {porStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cadastre itens para visualizar o progresso.</p>
              ) : (
                <div className="space-y-5 py-2">
                  <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                    {porStatus.map((entry) => (
                      <div key={entry.status} style={{ width: `${(entry.valor / totalItens) * 100}%`, backgroundColor: STATUS_COLORS[entry.status] }} />
                    ))}
                  </div>
                  <div className="space-y-3 text-sm">
                    {porStatus.map((entry) => (
                      <div key={entry.status} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                          />
                          <span>{entry.status}</span>
                        </div>
                        <span className="font-semibold">{entry.valor} <span className="font-normal text-muted-foreground">item(s)</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor estimado por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {porCategoria.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ainda não há itens cadastrados.</p>
              ) : (
                porCategoria.map((categ) => (
                  <div key={categ.categoria} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: CATEGORIA_COLORS[categ.categoria] }}
                        />
                        <span>{categ.categoria}</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatCurrency(categ.valor)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{
                          width:
                            valorTotalPlanejadoGeral === 0
                              ? "0%"
                              : `${Math.min(100, (categ.valor / valorTotalPlanejadoGeral) * 100).toFixed(0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="font-serif text-xl font-semibold">Próximas compras</h2><p className="text-sm text-muted-foreground">Itens de alta prioridade que ainda precisam de atenção.</p></div><ShoppingBag className="h-5 w-5 text-primary" /></div>
          {items.filter((i) => i.prioridade === "Alta" && i.status === "Não comprado").length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item de alta prioridade pendente no momento.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {items
                .filter((i) => i.prioridade === "Alta" && i.status === "Não comprado")
                .map((item) => (
                  <Card key={item.id} className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-3 p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                            Alta prioridade
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.categoria}</span>
                        </div>
                        <p className="text-sm font-medium leading-snug">{item.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          Faltam {item.quantidadeDesejada - item.quantidadeAdquirida} de {item.quantidadeDesejada} unidade(s)
                        </p>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency((item.quantidadeDesejada - item.quantidadeAdquirida) * item.valorUnitario)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Quanto já foi gasto x quanto falta por categoria</h2>
          {porCategoriaValores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre itens para visualizar os valores por categoria.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={porCategoriaValores}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  barSize={20}
                >
                  <XAxis dataKey="categoria" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickFormatter={(value) => formatCurrency(value).replace("R$", "R$")} fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label: string) => `Categoria: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="gasto" name="Já gasto" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faltante" name="Ainda falta" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
    </div>
  );
};

export default Dashboard;
