import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Home } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
};

const STATUS_COLORS: Record<Status, string> = {
  "Não comprado": "hsl(var(--muted-foreground))",
  Comprado: "hsl(142 76% 36%)",
  Presenteado: "hsl(var(--primary))",
};

const CATEGORIA_COLORS: Record<Categoria, string> = {
  Cozinha: "hsl(37 90% 55%)",
  Quarto: "hsl(271 81% 56%)",
  Banheiro: "hsl(199 89% 48%)",
  Sala: "hsl(142 76% 36%)",
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

  useEffect(() => {
    setItems(loadItems());
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

  const valorTotalPlanejado = useMemo(
    () => items.reduce((acc, i) => acc + i.quantidadeDesejada * i.valorUnitario, 0),
    [items],
  );
  const valorJaGasto = useMemo(
    () => items.reduce((acc, i) => (i.status === "Comprado" ? acc + i.quantidadeAdquirida * i.valorUnitario : acc), 0),
    [items],
  );
  const valorFaltante = Math.max(valorTotalPlanejado - valorJaGasto, 0);

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

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard do enxoval</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Visão geral do progresso do enxoval, itens e valores por categoria.
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Itens cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{totalItens}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{totalComprados + totalPresenteados}</p>
              <p className="text-xs text-muted-foreground">{percentualConclusao}% do enxoval concluído</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total do enxoval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatCurrency(valorTotalPlanejado)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ainda falta comprar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatCurrency(valorFaltante)}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Progresso por status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {porStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cadastre itens para visualizar o progresso.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={porStatus}
                          dataKey="valor"
                          nameKey="status"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          {porStatus.map((entry) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-sm">
                    {porStatus.map((entry) => (
                      <div key={entry.status} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[entry.status] }}
                          />
                          <span>{entry.status}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{entry.valor} item(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
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
                            valorTotalPlanejado === 0
                              ? "0%"
                              : `${Math.min(100, (categ.valor / valorTotalPlanejado) * 100).toFixed(0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Itens de alta prioridade pendentes</h2>
          {items.filter((i) => i.prioridade === "Alta" && i.status === "Não comprado").length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item de alta prioridade pendente no momento.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {items
                .filter((i) => i.prioridade === "Alta" && i.status === "Não comprado")
                .map((item) => (
                  <Card key={item.id} className="border-amber-200 bg-amber-50/60">
                    <CardContent className="flex items-center justify-between gap-3 p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="bg-amber-500 text-amber-50 hover:bg-amber-500">
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
      </main>
    </div>
  );
};

export default Dashboard;
