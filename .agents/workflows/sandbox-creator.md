# 🧪 Workflow: Sandbox Creator (`sandbox-creator.md`)

Este workflow descreve as tarefas e passos necessários para criar e testar novos componentes/widgets de forma isolada dentro do ambiente de Sandbox antes de os integrar em produção.

---

## Passo 1: Localização e Estrutura do Novo Widget
1. Crie o ficheiro do seu widget na pasta de desenvolvimento isolado da Sandbox:
   * **Caminho**: `client/src/components/sandbox/`
   * **Nome**: Use PascalCase (ex: `MyNewWidget.jsx`).
2. Utilize dados estáticos/mockados ou simulações locais no início para garantir que o componente renderiza sem depender de ligações ativas à base de dados.

---

## Passo 2: Registo no Sandbox Registry
Para tornar o componente acessível através do painel de controlo da Sandbox, registe-o no ficheiro `sandboxRegistry.jsx` (ou correspondente):
1. Importe o seu componente no ficheiro de registo:
   ```javascript
   import MyNewWidget from './MyNewWidget';
   ```
2. Adicione uma entrada no objeto de mapeamento principal contendo:
   * **`id`**: Identificador único em minúsculas (ex: `'my_new_widget'`).
   * **`name`**: Nome legível para o menu de seleção (ex: `'My New Component'`).
   * **`component`**: Referência direta ao componente importado.
   * **`layout`**: Dimensões padrão (w, h, minW, minH) na grelha de 12 colunas.

---

## Passo 3: Verificação de Responsividade e Escala
1. Execute o ambiente de desenvolvimento local (`npm run dev`) e navegue até à rota ou vista da Sandbox.
2. Utilize os controlos de viewport (`Mobile`, `Tablet`, `Desktop`) para testar o comportamento do widget sob diferentes larguras de ecrã.
3. Garanta que o widget não causa quebras de altura e que gráficos (ex: Recharts) utilizam `ResponsiveContainer` com alturas explícitas para evitar o colapso do elemento.
