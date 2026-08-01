# 🎨 Workflow: Conformidade de UI/UX (`ui-compliance.md`)

Este workflow detalha os passos para auditar o código frontend e garantir a conformidade estética e de performance com as diretivas do Eldoria V3.0.

---

## 1. Auditoria de Performance e Escala do Dashboard
* **Resolução Virtual Estrita**: Confirme que o Dashboard utiliza uma base de grelha de 12 colunas dimensionada a uma largura de ecrã virtual constante (ex: `1200px` ou `1400px`).
* **Uso de CSS Transform Scale**: Verifique se o redimensionamento fluido para ecrãs mais pequenos é realizado através do motor de escala CSS (`transform: scale()`) em vez de múltiplos `ResizeObserver`s ou listeners de resize de Javascript que recalculam posições pesadas e causam lag.

---

## 2. Validação do Mecanismo de Event Shielding
* **Modo de Edição**: Verifique se a classe utilitária `pointer-events-none` é aplicada à área de conteúdo interna dos widgets quando o modo de edição do layout está ativo, evitando interações acidentais de clique ou scroll.
* **Modo de Visualização**: Certifique-se de que os elementos interativos do widget (como cabeçalhos de ordenação, inputs ou botões) contêm o método `e.stopPropagation()` nos seus event handlers de clique para evitar que o `react-grid-layout` detete o clique como o início de um arrastamento de cartão.

---

## 3. Prevenção de Layout Jitter (Tremor de Layout)
* **Sem Animações Gerais**: Audite o código CSS e as classes utilitárias do Tailwind para garantir que **não** é utilizado `transition-all` nos wrappers principais dos widgets do `react-grid-layout`.
* **Transições Direcionadas**: Garanta o uso de propriedades de transição explícitas (ex: `transition-[border-color,box-shadow,background-color]`) para animar apenas alterações estéticas seguras que não interfiram com o posicionamento calculado pelo layout da grelha.

---

## 4. Fidelidade Estética e Paleta de Cores
* **Paleta Dark-Fantasy**: Garanta a conformidade com as cores padrão descritas nas regras visuais:
  * Tons escuros de pedra e couro para fundos e painéis.
  * Ouro (`amber-500`, `amber-400`, `#d4af37`) para destaques e detalhes de bordas.
  * Tons de pergaminho claro para textos e tabelas temáticas (ex: alertas financeiros).
* **Scrollbars Temáticas**: Certifique-se de que as áreas roláveis utilizam scrollbars customizadas e discretas que não quebram o design medieval da janela.
