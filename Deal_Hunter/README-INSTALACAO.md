# Deal Hunter — instalação em outro PC (Windows)

Este pacote instala o backend local e a extensão do Chrome. O banco, o token de pareamento e as credenciais ficam fora do ZIP; serão criados/configurados no computador de destino.

## Requisitos

- Windows 10 ou 11.
- Google Chrome atualizado.
- Node.js 22.13 ou superior (recomendado Node.js 24 LTS). Instale pelo site oficial: <https://nodejs.org/>.
- Internet durante a instalação das dependências e durante as varreduras.

## Instalação

1. Extraia `Deal-Hunter-Instalacao.zip` para uma pasta permanente, por exemplo `C:\Programas\Deal-Hunter`. Não execute os arquivos diretamente de dentro do ZIP.
2. Execute `1-Instalar.bat`. Ele verifica o Node.js, cria os diretórios locais e instala as dependências do backend. É necessária conexão com a internet nesta etapa.
3. Execute `2-Ativar-Backend.bat`. Mantenha a janela aberta enquanto usar a extensão. Na primeira inicialização, copie o **token de pareamento** exibido no terminal.
4. Carregue a extensão no Chrome:
   - Abra `chrome://extensions/`.
   - Ative **Modo do desenvolvedor**.
   - Clique em **Carregar sem compactação**.
   - Selecione a pasta `extension` que está dentro da pasta extraída.
5. Abra as opções do Deal Hunter. Na seção **Pareamento**, informe `http://127.0.0.1:3000` e cole o token copiado do backend. Salve e confirme que o status do backend aparece online.
6. Em **Lojas e categorias**, selecione as lojas/categorias que deseja monitorar. Para a Eletroclub, use a opção de entrar e faça login no Chrome, se necessário.
7. Em **Filtros de alerta**, configure desconto mínimo, preço máximo e intervalo para repetir alertas.
8. Em **Agendamento**, configure páginas por categoria e intervalo entre varreduras. O Chrome e o backend precisam permanecer abertos para os agendamentos.
9. Opcionalmente, configure o Bot Token e o Chat ID do Telegram nas configurações da extensão e envie uma mensagem de teste.
10. Use **Verificar agora no Chrome** para iniciar uma varredura manual.

`3-Exportar-Extensao-Chrome.bat` é um atalho que abre a pasta da extensão e a página de extensões do Chrome. Também é possível fazer o passo 4 manualmente.

## Uso diário

1. Inicie o backend com `2-Ativar-Backend.bat` e mantenha a janela aberta.
2. Mantenha o Chrome aberto com a extensão instalada e ativada.
3. O painel lateral mostra conexão e andamento. Use **Parar varredura** para interromper uma execução manual.

O banco SQLite e o token local são criados em `server/data`. As credenciais do Telegram são configuradas pela extensão e armazenadas localmente no banco. Não compartilhe `server/data`, `server/.env` ou o token.

## Atualizar ou mover

- Para instalar uma atualização, feche o backend, substitua os arquivos do programa e execute novamente `1-Instalar.bat`; depois reinicie o backend e clique em **Atualizar** na página `chrome://extensions/`.
- Para preservar histórico e configurações ao mover uma instalação existente, faça uma cópia privada de `server/data` e `server/.env` antes da mudança. Esses arquivos não estão neste pacote por conterem dados locais e credenciais.
- Não compartilhe a pasta de dados: ela contém o token usado para autorizar a extensão e pode conter as credenciais do Telegram.

## Solução rápida de problemas

- **Node.js não encontrado ou versão antiga:** instale Node.js 22.13+ e reabra o Prompt/PowerShell antes de executar `1-Instalar.bat`.
- **`npm ci` falhou:** confirme acesso à internet e execute `1-Instalar.bat` novamente.
- **Extensão não conecta:** confirme que a janela do backend continua aberta, que o endereço é `http://127.0.0.1:3000` e que foi copiado o token completo daquela instalação. Recarregue a extensão no Chrome.
- **Chrome não mostra a extensão:** verifique se selecionou a pasta `extension` que contém `manifest.json`, e não a pasta externa do projeto.
- **Telegram não envia:** confirme Bot Token, Chat ID, internet e use o teste de conexão nas configurações.

O monitor lê páginas renderizadas pelo Chrome. Algumas lojas podem limitar ou alterar o acesso/catálogo; nesse caso, a categoria pode falhar ou retornar apenas parte dos produtos.
