# 🧹 Workflow: Workspace Cleanup (`workspace-cleanup.md`)

Este workflow orienta na remoção segura de ficheiros temporários, scripts de teste e reversão de alterações experimentais de injeção de código na sandbox.

---

## Passo 1: Identificação de Scripts Temporários
* **Scripts Globais e CJS**: Ficheiros de teste criados na raiz da pasta `client` (ex: `*.cjs`, `check_tables_count.cjs`, `signup_and_call.cjs`) podem ser eliminados com segurança assim que os testes de integração ou auditorias terminarem.
* **Comando de Limpeza Rápida (PowerShell)**:
  ```powershell
  Remove-Item client/*.cjs -ErrorAction SilentlyContinue
  ```

---

## Passo 2: Reversão de Injeções Experimentais
Se injetou temporariamente uma vista ou modal sandbox no ficheiro principal de rotas (ex: `App.jsx` ou `MainMenu.jsx`):
1. Abra o ficheiro modificado e localize os blocos de importação ou renderização do componente de teste.
2. Restaure o estado de produção original removendo as linhas importadas e restabelecendo os componentes padrão.
3. Certifique-se de que a aplicação compila corretamente correndo localmente:
   ```bash
   npm run build
   ```

---

## Passo 3: Limpeza de Cache e Artefactos Locais
* Certifique-se de que a pasta `dist` ou `build` gerada localmente é ignorada pelo Git.
* Se necessário, execute um prune no gestor de pacotes para garantir que nenhuma dependência temporária ficou pendente no `package.json`.
