# Redesign completo — Rafa & Nath

## Objetivo
Reconstruir a interface administrativa e a lista pública com uma identidade moderna, sofisticada e simples, preservando integralmente dados, regras, integrações, rotas e ações existentes.

## Direção aprovada
- Paleta: azul, preto e branco; verde para comprado, vermelho para alertas/destrutivo e roxo apenas para parcial.
- Tipografia: Lora nos títulos e Nunito Sans nos textos.
- Estrutura: dashboard minimalista em composição bento equilibrada.
- Aparência: superfícies claras, azul profundo como assinatura, contraste preto, bordas discretas, poucos blocos grandes e microinterações sutis.

## O que será construído
1. **Base visual e navegação**
   - Renovar tokens de cores, tipografia, bordas e sombras para temas claro e escuro.
   - Criar uma navegação compacta com marca Rafa & Nath, Dashboard, Meu Enxoval e Lista de Reservados.
   - Adotar cabeçalho contextual no desktop/tablet e navegação própria no celular, mantendo tema e saída acessíveis.

2. **Dashboard**
   - Reorganizar a tela para responder “Como está o nosso enxoval?”.
   - Dar protagonismo ao progresso total e agrupar resumo de itens, financeiro, categorias e próximas compras em um bento com poucos blocos maiores.
   - Preservar cálculos e dados existentes; melhorar estados de carregamento e vazio.

3. **Meu Enxoval**
   - Transformar a listagem em catálogo pessoal com cabeçalho e ações mais claros.
   - Compactar busca e filtros; usar painel móvel apropriado sem perder seleção múltipla de status.
   - Redesenhar cards e tabela mantendo imagens, status, parcial, prioridade, quantidades, valores e todas as ações.
   - Reorganizar o formulário em “Produto”, “Compra” e “Observações”, mantendo validações e upload atuais.

4. **Lista de Reservados**
   - Destacar item, reservante e quantidade restante.
   - Criar estado vazio útil e manter atualização em tempo real e ação de desreservar.

5. **Lista pública e autenticação**
   - Aplicar a mesma identidade à vitrine pública e ao acesso, sem sidebar administrativa.
   - Preservar busca, filtros, ordenação, reserva segura, atualização em tempo real e todos os retornos de erro.

6. **Responsividade e acabamento**
   - Ajustar desktop, tablet e celular com dimensões estáveis e sem sobreposições.
   - Padronizar botões, campos, selects, badges, tabelas, modais, estados vazios, skeletons e confirmações.
   - Validar rotas, ações principais, temas e os três tamanhos de tela no navegador.

## Restrições
- Nenhuma alteração no banco, dados salvos, autenticação, políticas, funções ou regras de negócio.
- Nenhuma funcionalidade existente será removida.
- O redesign seguirá a composição aprovada, adaptada à paleta azul/preto/branco e às fontes Lora + Nunito Sans.
