# Instalação da extensão

A extensão usada pelo fluxo principal fica diretamente nesta pasta e conversa com o servidor local em `http://127.0.0.1:3000`.

1. Inicie o backend com `2-Ativar-Backend.bat`.
2. Copie o token exibido no terminal.
3. Abra `chrome://extensions/` e habilite **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação** e selecione a pasta `extension` (esta pasta, que contém `manifest.json`).
5. Abra as opções da extensão, entre em **Pareamento**, confirme a URL `http://127.0.0.1:3000` e cole o token.
6. Recarregue a extensão se ela já estava instalada. O Chrome pedirá acesso às páginas Amazon, Magalu e Eletroclub para a leitura das categorias.
7. Em **Lojas e categorias**, clique em **Entrar no Eletroclub** e faça login na página oficial. A extensão não pede nem armazena sua senha ou cookies; a sessão permanece no perfil do Chrome.
8. Marque as categorias, ajuste o desconto mínimo e o intervalo de leitura. Configure o Telegram se quiser receber notificações.

As varreduras são executadas pelo Chrome em abas de fundo para ler páginas renderizadas e usar a sessão do Eletroclub. Mantenha o Chrome e a extensão ativos junto com o backend. Use **Verificar agora no Chrome** para iniciar uma leitura imediata.

O backend exige Node.js 22.13 ou superior; a extensão não precisa de build nem de Node.js. Ao atualizar os arquivos, recarregue a extensão em `chrome://extensions/`.

Para remover, use **Remover** em `chrome://extensions/`. O banco e as configurações ficam em `server/data`; removê-los manualmente apaga o histórico e as credenciais locais.
