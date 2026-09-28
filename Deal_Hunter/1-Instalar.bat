@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   DEAL HUNTER - Instalacao local
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERRO: Instale o Node.js 22.13 ou superior em https://nodejs.org
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 (
  echo ERRO: Este backend precisa do Node.js 22.13 ou superior.
  node -v
  pause
  exit /b 1
)
node -v

set "SERVER_DIR="
if exist "Servidor\package.json" set "SERVER_DIR=Servidor"
if exist "server\package.json" set "SERVER_DIR=server"
if "%SERVER_DIR%"=="" set "SERVER_DIR=Servidor"

if not exist "%SERVER_DIR%\data" mkdir "%SERVER_DIR%\data"
if not exist "%SERVER_DIR%\.env" copy "%SERVER_DIR%\.env.example" "%SERVER_DIR%\.env" >nul

echo Instalando dependencias do backend local...
pushd %SERVER_DIR%
call npm install
set INSTALL_RESULT=%errorlevel%
popd
if not "%INSTALL_RESULT%"=="0" (
  echo ERRO: npm ci falhou. Confira a conexao e tente novamente.
  pause
  exit /b %INSTALL_RESULT%
)

echo.
echo ============================================
echo   Instalacao concluida
echo ============================================
echo Proximos passos:
echo   1. Execute 2-Ativar-Backend.bat e mantenha a janela aberta.
echo   2. Execute 3-Exportar-Extensao-Chrome.bat.
echo   3. Na extensao, cole o token exibido pelo backend e configure a busca.
echo O banco SQLite e criado automaticamente em server\data.
echo.
pause
