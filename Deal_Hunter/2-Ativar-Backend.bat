@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   DEAL HUNTER - Backend local
echo ============================================
echo.

if not exist "server\node_modules" (
  echo ERRO: Dependencias nao instaladas. Execute 1-Instalar.bat.
  pause
  exit /b 1
)

if not exist "server\data" mkdir "server\data"

echo Iniciando API e banco SQLite em http://127.0.0.1:3000
echo O token de pareamento sera exibido abaixo na primeira execucao.
echo Mantenha esta janela aberta durante o uso. Ctrl+C encerra o backend.
echo.
pushd server
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
