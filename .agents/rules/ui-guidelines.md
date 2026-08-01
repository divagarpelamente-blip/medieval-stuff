# 🎨 Diretivas de UI e Transições CSS (`ui-guidelines.md`)

Este documento estabelece as regras para manipulação de estilos e transições CSS de forma a evitar conflitos de renderização com a grelha dinâmica do Dashboard.

---

## 1. Conflito de Transições Dinâmicas (`react-grid-layout`)
O `react-grid-layout` calcula a posição e o tamanho dos widgets em tempo real usando propriedades CSS de `transform` (ex: `translate3d(x, y, z)`). 
Se aplicar transições globais de forma indiscriminada, criará problemas graves de desempenho e saltos visuais:

> [!WARNING]
> **NÃO utilize `transition-all`** nos cartões ou wrappers principais dos widgets. 
> O uso de `transition-all` tenta animar a transição do `transform` que o `react-grid-layout` aplica ao arrastar ou redimensionar, provocando lag e um efeito de atraso visual (jitter) inaceitável.

---

## 2. Transições Direcionadas e Seguras
Sempre que necessitar de adicionar animações suaves de hover ou foco (ex: mudança de cor de borda, sombras ou cor de fundo), declare transições específicas de forma direcionada:

### Exemplo Incorreto (Proibido)
```html
<div className="transition-all duration-300 hover:border-amber-500 hover:shadow-lg">
```

### Exemplo Correto (Recomendado)
```html
<div className="transition-[border-color,box-shadow,background-color] duration-300 hover:border-amber-500 hover:shadow-lg">
```

---

## 3. Diretivas Gerais de Estética
* **Bordas e Sombras**: Use sombras discretas e suaves, combinadas com contornos dourados ou amber semitransparentes (`border-amber-900/30`), alinhados com a temática de fantasia escura do jogo.
* **Scrollbars Personalizadas**: Utilize classes focadas (`scrollbar-thin scrollbar-thumb-amber-900/50`) para que a barra de deslocamento se integre organicamente na interface e fique oculta por padrão até que ocorra interação do utilizador.
