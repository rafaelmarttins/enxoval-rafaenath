import { useEffect, useMemo, useState } from "react";
import { Heart, Plus, Download, Pencil, Trash2, CheckCircle2, Gift, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

const PRIORIDADES = ["Alta", "Média", "Baixa"] as const;

const STATUS = ["Não comprado", "Comprado", "Presenteado"] as const;

type Categoria = (typeof CATEGORIAS)[number];
type Prioridade = (typeof PRIORIDADES)[number];
type Status = (typeof STATUS)[number];

type EnxovalItem = {
  id: string;
  nome: string;
  categoria: Categoria;
  quantidadeDesejada: number;
  quantidadeAdquirida: number;
  valorUnitario: number;
  prioridade: Prioridade;
  status: Status;
  loja?: string;
  observacoes?: string;
  imageUrl?: string;
  productUrl?: string;
};

type SortField = "nome" | "prioridade";

type SortDirection = "asc" | "desc";

const prioridadePeso: Record<Prioridade, number> = {
  Alta: 3,
  Média: 2,
  Baixa: 1,
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

function saveItems(items: EnxovalItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // falha silenciosa
  }
}

const Index = () => {
  const { toast } = useToast();

  const [items, setItems] = useState<EnxovalItem[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [sortField, setSortField] = useState<SortField>("nome");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EnxovalItem | null>(null);

  const [formNome, setFormNome] = useState("");
  const [formCategoria, setFormCategoria] = useState<Categoria | "">("");
  const [formQuantidadeDesejada, setFormQuantidadeDesejada] = useState("1");
  const [formQuantidadeAdquirida, setFormQuantidadeAdquirida] = useState("0");
  const [formValorUnitario, setFormValorUnitario] = useState("0");
  const [formPrioridade, setFormPrioridade] = useState<Prioridade | "">("");
  const [formStatus, setFormStatus] = useState<Status | "">("");
  const [formLoja, setFormLoja] = useState("");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formProductUrl, setFormProductUrl] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [itemParaExcluir, setItemParaExcluir] = useState<EnxovalItem | null>(null);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const totalItens = items.length;
  const totalItensAdquiridos = useMemo(
    () => items.filter((i) => i.status === "Comprado" || i.status === "Presenteado").length,
    [items],
  );

  const percentualConclusao = totalItens === 0 ? 0 : Math.round((totalItensAdquiridos / totalItens) * 100);

  const valorTotalEstimado = useMemo(
    () => items.reduce((acc, i) => acc + i.quantidadeDesejada * i.valorUnitario, 0),
    [items],
  );

  const valorJaAdquirido = useMemo(
    () => items.reduce((acc, i) => acc + i.quantidadeAdquirida * i.valorUnitario, 0),
    [items],
  );

  const valorRestante = Math.max(valorTotalEstimado - valorJaAdquirido, 0);

  const itensFiltradosEOrdenados = useMemo(() => {
    let resultado = [...items];

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      resultado = resultado.filter((i) => i.nome.toLowerCase().includes(termo));
    }

    if (filtroCategoria !== "todas") {
      resultado = resultado.filter((i) => i.categoria === filtroCategoria);
    }

    if (filtroStatus !== "todos") {
      resultado = resultado.filter((i) => i.status === filtroStatus);
    }

    resultado.sort((a, b) => {
      let comp = 0;
      if (sortField === "nome") {
        comp = a.nome.localeCompare(b.nome, "pt-BR");
      } else if (sortField === "prioridade") {
        comp = prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade];
      }
      return sortDirection === "asc" ? comp : -comp;
    });

    return resultado;
  }, [items, busca, filtroCategoria, filtroStatus, sortField, sortDirection]);

  function limparFormulario() {
    setEditingItem(null);
    setFormNome("");
    setFormCategoria("");
    setFormQuantidadeDesejada("1");
    setFormQuantidadeAdquirida("0");
    setFormValorUnitario("0");
    setFormPrioridade("");
    setFormStatus("");
    setFormLoja("");
    setFormObservacoes("");
    setFormImageUrl("");
    setFormProductUrl("");
    setFormErrors({});
  }

  function abrirNovoItem() {
    limparFormulario();
    setIsDialogOpen(true);
  }

  function abrirEdicao(item: EnxovalItem) {
    setEditingItem(item);
    setFormNome(item.nome);
    setFormCategoria(item.categoria);
    setFormQuantidadeDesejada(String(item.quantidadeDesejada));
    setFormQuantidadeAdquirida(String(item.quantidadeAdquirida));
    setFormValorUnitario(String(item.valorUnitario));
    setFormPrioridade(item.prioridade);
    setFormStatus(item.status);
    setFormLoja(item.loja ?? "");
    setFormObservacoes(item.observacoes ?? "");
    setFormImageUrl(item.imageUrl ?? "");
    setFormProductUrl(item.productUrl ?? "");
    setFormErrors({});
    setIsDialogOpen(true);
  }

  function validarFormulario() {
    const errors: Record<string, string> = {};

    if (!formNome.trim()) errors.nome = "Informe o nome do item.";
    if (!formCategoria) errors.categoria = "Selecione uma categoria.";
    const qtdDesejadaNum = Number(formQuantidadeDesejada);
    const qtdAdquiridaNum = Number(formQuantidadeAdquirida);
    const valorUnitarioNum = Number(formValorUnitario);

    if (!Number.isFinite(qtdDesejadaNum) || qtdDesejadaNum < 1) {
      errors.quantidadeDesejada = "Quantidade desejada deve ser pelo menos 1.";
    }

    if (!Number.isFinite(qtdAdquiridaNum) || qtdAdquiridaNum < 0) {
      errors.quantidadeAdquirida = "Quantidade adquirida não pode ser negativa.";
    } else if (qtdAdquiridaNum > qtdDesejadaNum) {
      errors.quantidadeAdquirida = "Adquirida não pode ser maior que desejada.";
    }

    if (!Number.isFinite(valorUnitarioNum) || valorUnitarioNum < 0) {
      errors.valorUnitario = "Valor unitário deve ser maior ou igual a zero.";
    }

    if (!formPrioridade) errors.prioridade = "Selecione a prioridade.";
    if (!formStatus) errors.status = "Selecione o status.";

    if (formProductUrl && !/^https?:\/\//i.test(formProductUrl.trim())) {
      errors.productUrl = "Informe um link válido começando com http:// ou https://";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSalvarItem() {
    if (!validarFormulario()) {
      toast({
        title: "Verifique o formulário",
        description: "Alguns campos precisam de atenção.",
        variant: "destructive",
      });
      return;
    }

    const novoItemBase: Omit<EnxovalItem, "id"> = {
      nome: formNome.trim(),
      categoria: formCategoria as Categoria,
      quantidadeDesejada: Number(formQuantidadeDesejada),
      quantidadeAdquirida: Number(formQuantidadeAdquirida),
      valorUnitario: Number(formValorUnitario),
      prioridade: formPrioridade as Prioridade,
      status: formStatus as Status,
      loja: formLoja.trim() || undefined,
      observacoes: formObservacoes.trim() || undefined,
      imageUrl: formImageUrl.trim() || undefined,
      productUrl: formProductUrl.trim() || undefined,
    };

    if (editingItem) {
      setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, ...novoItemBase } : i)));
      toast({ title: "Item atualizado", description: "As informações do item foram salvas." });
    } else {
      const novoItem: EnxovalItem = {
        id: crypto.randomUUID(),
        ...novoItemBase,
      };
      setItems((prev) => [novoItem, ...prev]);
      toast({ title: "Item adicionado", description: "O item foi incluído no enxoval." });
    }

    setIsDialogOpen(false);
    limparFormulario();
  }

  function marcarStatus(item: EnxovalItem, novoStatus: Status) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: novoStatus } : i)));
  }

  function confirmarExclusao(item: EnxovalItem) {
    setItemParaExcluir(item);
  }

  function excluirItemConfirmado() {
    if (!itemParaExcluir) return;
    const nome = itemParaExcluir.nome;
    setItems((prev) => prev.filter((i) => i.id !== itemParaExcluir.id));
    setItemParaExcluir(null);
    toast({ title: "Item excluído", description: `O item "${nome}" foi removido.` });
  }

  function limparFiltros() {
    setBusca("");
    setFiltroCategoria("todas");
    setFiltroStatus("todos");
    setSortField("nome");
    setSortDirection("asc");
  }

  function alternarOrdenacao(campo: SortField) {
    if (sortField === campo) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(campo);
      setSortDirection("asc");
    }
  }

  function exportarCSV() {
    if (items.length === 0) {
      toast({ title: "Nada para exportar", description: "Adicione alguns itens antes de exportar." });
      return;
    }

    const linhas = [
      [
        "Nome do item",
        "Categoria",
        "Quantidade desejada",
        "Quantidade adquirida",
        "Valor unitário (R$)",
        "Prioridade",
        "Status",
        "Loja / fornecedor",
        "Link do produto",
        "Observações",
      ],
      ...items.map((i) => [
        i.nome,
        i.categoria,
        String(i.quantidadeDesejada),
        String(i.quantidadeAdquirida),
        i.valorUnitario.toString().replace(".", ","),
        i.prioridade,
        i.status,
        i.loja ?? "",
        i.productUrl ?? "",
        (i.observacoes ?? "").replace(/\n/g, " "),
      ]),
    ];

    const csvContent = linhas
      .map((linha) => linha.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "enxoval-casamento.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "CSV exportado", description: "O arquivo foi gerado com sucesso." });
  }

  const temFiltrosAtivos =
    busca.trim() || filtroCategoria !== "todas" || filtroStatus !== "todos" || sortField !== "nome" || sortDirection !== "asc";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Heart className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Itens do enxoval</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Veja tudo o que você já comprou e o que ainda falta.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportarCSV} className="gap-2">
              <Download className="h-4 w-4" />
              <span>Exportar para CSV</span>
            </Button>
            <Button onClick={abrirNovoItem} className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Adicionar item</span>
            </Button>
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
              <CardTitle className="text-sm font-medium">Itens adquiridos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{totalItensAdquiridos}</p>
              <p className="text-xs text-muted-foreground">{percentualConclusao}% do enxoval concluído</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor estimado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatCurrency(valorTotalEstimado)}</p>
              <p className="text-xs text-muted-foreground">Com base na quantidade desejada</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor restante</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatCurrency(valorRestante)}</p>
              <p className="text-xs text-muted-foreground">Valor estimado a adquirir</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-1 flex-col gap-2 md:flex-row">
              <div className="flex-1">
                <Label htmlFor="busca">Buscar item</Label>
                <Input
                  id="busca"
                  placeholder="Digite o nome do item"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>Categoria</Label>
                <Select
                  value={filtroCategoria}
                  onValueChange={(value) => setFiltroCategoria(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todos os ambientes</SelectItem>
                    {CATEGORIAS.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:w-56">
              <Label>Ordenar por</Label>
              <div className="flex gap-2">
                <Button
                  variant={sortField === "nome" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 justify-between"
                  onClick={() => alternarOrdenacao("nome")}
                >
                  <span>Nome</span>
                  <span className="text-xs text-muted-foreground">
                    {sortField === "nome" ? (sortDirection === "asc" ? "A → Z" : "Z → A") : ""}
                  </span>
                </Button>
                <Button
                  variant={sortField === "prioridade" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 justify-between"
                  onClick={() => alternarOrdenacao("prioridade")}
                >
                  <span>Prioridade</span>
                  <span className="text-xs text-muted-foreground">
                    {sortField === "prioridade" ? (sortDirection === "asc" ? "Baixa → Alta" : "Alta → Baixa") : ""}
                  </span>
                </Button>
              </div>
              {temFiltrosAtivos && (
                <Button variant="ghost" size="sm" className="self-start px-0 text-xs" onClick={limparFiltros}>
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {itensFiltradosEOrdenados.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">
                Nenhum item encontrado. Adicione um novo item para começar.
              </p>
            ) : (
              itensFiltradosEOrdenados.map((item) => (
                <Card key={item.id} className="flex h-full flex-col overflow-hidden">
                  {item.imageUrl && (
                    <div className="relative h-40 w-full overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.nome}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="flex flex-1 flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {item.status === "Comprado" ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              COMPRADO
                            </span>
                          ) : item.status === "Presenteado" ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              PRESENTEADO
                            </span>
                          ) : (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              NÃO COMPRADO
                            </span>
                          )}
                        </p>
                        <h2 className="text-sm font-semibold leading-snug">{item.nome}</h2>
                      </div>
                      <Badge
                        variant={
                          item.prioridade === "Alta" ? "destructive" : item.prioridade === "Média" ? "default" : "secondary"
                        }
                      >
                        {item.prioridade}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1 text-xs">
                      <Badge variant="outline">{item.categoria}</Badge>
                      {item.loja && <Badge variant="outline">{item.loja}</Badge>}
                    </div>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>
                        Quantidade: <span className="font-medium">{item.quantidadeAdquirida}</span> de
                        <span className="font-medium"> {item.quantidadeDesejada}</span>
                      </p>
                      {item.productUrl && (
                        <a
                          href={item.productUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Ver link da loja <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {item.observacoes && <p className="line-clamp-2">{item.observacoes}</p>}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">Valor unitário</p>
                        <p className="text-base font-semibold">{formatCurrency(item.valorUnitario)}</p>
                      </div>
                      <div className="flex gap-1">
                        {item.status !== "Comprado" && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title="Marcar como comprado"
                            onClick={() => marcarStatus(item, "Comprado")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        {item.status !== "Presenteado" && (
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            title="Marcar como presenteado"
                            onClick={() => marcarStatus(item, "Presenteado")}
                          >
                            <Gift className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-3 border-t pt-3 text-xs">
                      <button
                        type="button"
                        className="font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => abrirEdicao(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="font-medium text-destructive hover:underline"
                        onClick={() => confirmarExclusao(item)}
                      >
                        Excluir
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) limparFormulario();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar item do enxoval" : "Adicionar item ao enxoval"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="nome">Nome do item</Label>
                <Input
                  id="nome"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex.: Jogo de copos de vidro"
                />
                {formErrors.nome && <p className="text-xs text-destructive">{formErrors.nome}</p>}
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="imageUrl">URL da imagem (opcional)</Label>
                <Input
                  id="imageUrl"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Cole aqui o link da foto do produto"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="productUrl">Link do produto (opcional)</Label>
                <Input
                  id="productUrl"
                  value={formProductUrl}
                  onChange={(e) => setFormProductUrl(e.target.value)}
                  placeholder="Ex.: https://www.sualoja.com/produto"
                />
                {formErrors.productUrl && <p className="text-xs text-destructive">{formErrors.productUrl}</p>}
              </div>
              <div className="space-y-1">
                <Label>Categoria</Label>
                <Select
                  value={formCategoria}
                  onValueChange={(value: Categoria) => setFormCategoria(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoria && <p className="text-xs text-destructive">{formErrors.categoria}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantidadeDesejada">Quantidade desejada</Label>
                <Input
                  id="quantidadeDesejada"
                  type="number"
                  min={1}
                  value={formQuantidadeDesejada}
                  onChange={(e) => setFormQuantidadeDesejada(e.target.value)}
                />
                {formErrors.quantidadeDesejada && (
                  <p className="text-xs text-destructive">{formErrors.quantidadeDesejada}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantidadeAdquirida">Quantidade já adquirida</Label>
                <Input
                  id="quantidadeAdquirida"
                  type="number"
                  min={0}
                  value={formQuantidadeAdquirida}
                  onChange={(e) => setFormQuantidadeAdquirida(e.target.value)}
                />
                {formErrors.quantidadeAdquirida && (
                  <p className="text-xs text-destructive">{formErrors.quantidadeAdquirida}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="valorUnitario">Valor unitário estimado (R$)</Label>
                <Input
                  id="valorUnitario"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formValorUnitario}
                  onChange={(e) => setFormValorUnitario(e.target.value)}
                />
                {formErrors.valorUnitario && (
                  <p className="text-xs text-destructive">{formErrors.valorUnitario}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Prioridade</Label>
                <Select
                  value={formPrioridade}
                  onValueChange={(value: Prioridade) => setFormPrioridade(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.prioridade && <p className="text-xs text-destructive">{formErrors.prioridade}</p>}
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(value: Status) => setFormStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.status && <p className="text-xs text-destructive">{formErrors.status}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="loja">Loja / fornecedor (opcional)</Label>
                <Input
                  id="loja"
                  value={formLoja}
                  onChange={(e) => setFormLoja(e.target.value)}
                  placeholder="Ex.: Loja X, site Y"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  placeholder="Ex.: Prioridade para a lista de presentes, cor preferida, tamanho, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarItem}>{editingItem ? "Salvar alterações" : "Adicionar item"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!itemParaExcluir} onOpenChange={(open) => !open && setItemParaExcluir(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir item</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o item "{itemParaExcluir?.nome}"? Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={excluirItemConfirmado}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Index;
