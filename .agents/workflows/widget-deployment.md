# 🚀 Workflow: Widget Deployment (`widget-deployment.md`)

Este workflow define as etapas necessárias para promover um widget que foi validado com sucesso no ambiente de Sandbox para a produção no Dashboard do utilizador.

---

## Passo 1: Migração de Ficheiros do Componente
1. Mova o ficheiro do widget de `client/src/components/sandbox/` para a pasta de produção correspondente (ex: `client/src/components/dashboard/` ou `client/src/components/widgets/`).
2. Atualize os caminhos de importação do componente (como CSS, ícones Lucide ou bibliotecas de gráficos) para refletir a nova localização na pasta de componentes de produção.

---

## Passo 2: Ligação ao Estado Global (Zustand)
Substitua os dados mockados utilizados na Sandbox pelas queries dinâmicas de produção:
1. Remova dependências de ficheiros estáticos de mock data (ex: `MOCK_LEDGER`).
2. Utilize os hooks de subscrição do Zustand ou do TanStack Query adequados (ex: `useInteractiveData()` ou `useKingdomStore` para puxar `transactions` e `dashboardMetrics` em tempo real).

---

## Passo 3: Registo no Component Registry de Produção
1. Abra o ficheiro de registo dos componentes ativos do Dashboard (ex: `interactiveRegistry.js` ou `treasuryRegistry.js`).
2. Importe o componente a partir da sua nova pasta de produção.
3. Adicione o objeto do widget à lista de registos ativos, garantindo que define os limites padrão da grelha de 12 colunas:
   ```javascript
   my_widget: {
     name: "Nome do Widget",
     component: MyWidget,
     defaultLayout: { w: 6, h: 3, minW: 4, minH: 2 }
   }
   ```

---

## Passo 4: Validação em Produção e Build Check
1. Execute `npm run build` na pasta do cliente para garantir que todas as novas referências de caminhos compilam sem erros de lint ou ficheiros em falta.
2. Abra a aplicação no browser, adicione o novo widget ao painel e confirme que as posições e o arrastamento persistem corretamente no LocalStorage/Supabase.
