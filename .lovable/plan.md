
Objetivo
- Quando um item estiver com status “Comprado” ou “Presenteado”, mas a quantidade adquirida for menor que a quantidade desejada (ex.: 1 de 2), o app deve mostrar claramente que está “parcial” — sem criar um novo status no banco e sem mudar o filtro (continua multi-seleção: Não comprado / Comprado / Presenteado).
- Nos totais e no dashboard, “parcial” continua contando como Comprado/Presenteado (como você escolheu).

Decisão já tomada (a partir das suas respostas)
- Representação: Automática (recomendado)
- Vale também para: Presenteado
- Contagens/gráficos: Parcial conta como Comprado/Presenteado

O que será implementado (comportamento)
1) Detecção automática de “parcial”
- Regra:
  - Se status for “Comprado” ou “Presenteado” E
  - quantidadeAdquirida >= 1 E
  - quantidadeAdquirida < quantidadeDesejada
  - então o item é “Parcial”.
- Se quantidadeAdquirida >= quantidadeDesejada: tratado como “Completo” (continua “Comprado” / “Presenteado”).
- Se status “Não comprado”: não existe “parcial”.

2) Exibição no módulo /itens (cards e tabela)
- Manter a cor obrigatória do status:
  - “Comprado” verde
  - “Não comprado” vermelho
  - “Presenteado” mantém estilo atual
- Acrescentar uma etiqueta pequena “PARCIAL” quando detectado (sem trocar o status principal).
- Mostrar sempre um indicador simples de progresso de quantidade: “1/2” (adquirida/desejada), principalmente para casos parciais.
- Isso resolve a dúvida visual: “comprei só 1 ainda falta outro” sem precisar inventar um novo status.

3) Filtros (status multi-seleção)
- Não muda: continua permitindo selecionar mais de um status.
- Um item “Comprado (parcial)” aparece quando o filtro incluir “Comprado” (porque o status armazenado continua sendo “Comprado”).
- Idem para “Presenteado (parcial)”.

4) Dashboard (sem criar status novo)
- Não adicionaremos “Parcial” como categoria separada nos gráficos.
- O dashboard continuará contando esses itens como Comprados/Presenteados (como definido).
- Apenas melhoraremos a exibição textual onde fizer sentido (por exemplo, em listas/indicadores), sem quebrar gráficos.

Arquivos que serão ajustados
- src/pages/Index.tsx
  - Criar helper(s) para calcular:
    - isParcial(item)
    - label visual do status (ex.: “COMPRADO” + badge “PARCIAL”)
    - string de quantidade “{adquirida}/{desejada}”
  - Aplicar nos dois pontos de UI já existentes:
    - Cards (onde hoje aparece “COMPRADO / PRESENTEADO / NÃO COMPRADO”)
    - Tabela (Badge e/ou coluna de info)
- src/pages/Dashboard.tsx
  - Ajuste leve de UI (opcional, mas recomendado): quando listar “Faltam X de Y”, garantir que casos comprados/presenteados parciais fiquem coerentes visualmente.
  - Não mexeremos no filtro de status nem criaremos um quarto status.

Detalhe de UI (como vai ficar “alinhadinho” e claro)
- No card/tabela:
  - Badge principal do status (mesma cor de sempre)
  - Ao lado: mini-badge “PARCIAL” (neutro, por exemplo cinza/outline), só quando aplicável
  - Linha/trecho adicional: “Qtd: 1/2” (ou “Adquirido: 1 de 2”)

Validações e regras existentes (mantidas)
- A validação atual (quando status é Comprado/Presenteado, quantidadeAdquirida mínimo 1) permanece.
- A regra de não permitir adquirida > desejada permanece.

Casos de teste (o que você vai validar no navegador)
1) Criar item: desejada=2, status=Comprado, adquirida=1
- Deve mostrar “COMPRADO” + “PARCIAL” e “1/2”
- Deve permanecer filtrável por “Comprado”
2) Editar o mesmo item e colocar adquirida=2
- Deve sumir “PARCIAL” e continuar “COMPRADO”
3) Repetir para Presenteado (desejada=3, adquirida=1)
- Deve mostrar “PRESENTEADO” + “PARCIAL” e “1/3”
4) Confirmar que “Não comprado” continua vermelho e sem etiqueta parcial
5) Confirmar que os totais/gráficos não criaram um novo status (continua tudo dentro de Comprado/Presenteado)

Riscos/impactos
- Baixo risco: não altera banco de dados e não altera os valores salvos.
- Impacto principal é visual (melhora de entendimento) e pequenas funções auxiliares.

Próximo passo (após sua aprovação)
- Implementar os helpers e ajustar os badges no /itens (cards + tabela) e um ajuste leve no Dashboard para consistência visual.