@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   DEAL HUNTER - Backend local
echo ============================================
echo.

set "SERVER_DIR="
if exist "Servidor\src\index.js" set "SERVER_DIR=Servidor"
if exist "server\src\index.js" set "SERVER_DIR=server"

if "%SERVER_DIR%"=="" (
  echo ==============================================================================
  echo ERRO: Os arquivos do servidor nao foram localizados nesta pasta!
  echo ==============================================================================
  echo.
  echo Possiveis causas:
  echo   1. Voce executou o arquivo direto de dentro do arquivo .ZIP sem extrair antes:
  echo      -> Clique com o botao direito no arquivo .zip baixado, selecione "Extrair Tudo...",
  echo         extraia para uma pasta e execute o 2-Ativar-Backend.bat de dentro dela.
  echo.
  echo   2. Este arquivo .bat foi movido sozinho para fora da pasta do sistema:
  echo      -> Mantenha o arquivo "2-Ativar-Backend.bat" dentro da pasta junto com
  echo         as pastas "Servidor" e "Extensao".
  echo.
  echo   3. A pasta "src" nao foi extraida.
  echo ==============================================================================
  echo.
  pause
  exit /b 1
)

if not exist "%SERVER_DIR%\node_modules" (
  echo ERRO: Dependencias nao instaladas. Execute 1-Instalar.bat.
  pause
  exit /b 1
)

if not exist "%SERVER_DIR%\data" mkdir "%SERVER_DIR%\data"

echo Iniciando API e banco SQLite em http://127.0.0.1:3000
echo O token de pareamento sera exibido abaixo na primeira execucao.
echo Mantenha esta janela aberta durante o uso. Ctrl+C encerra o backend.
echo.
pushd %SERVER_DIR%
set "NODE_OPTIONS=--use-system-ca %NODE_OPTIONS%"
call npm start
set SERVER_RESULT=%errorlevel%
popd

if not "%SERVER_RESULT%"=="0" (
  echo.
  echo O backend encerrou com erro %SERVER_RESULT%. Confira a mensagem acima.
  pause
)
exit /b %SERVER_RESULT%
