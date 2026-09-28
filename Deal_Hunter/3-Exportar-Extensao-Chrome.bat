@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   DEAL HUNTER - Exportar extensao para Chrome
echo ============================================
echo.

set "SERVER_DIR="
if exist "Servidor\package.json" set "SERVER_DIR=Servidor"
if exist "server\package.json" set "SERVER_DIR=server"
if "%SERVER_DIR%"=="" set "SERVER_DIR=Servidor"

set "EXT_DIR="
if exist "Extensao\manifest.json" set "EXT_DIR=Extensao"
if exist "extension\manifest.json" set "EXT_DIR=extension"
if "%EXT_DIR%"=="" set "EXT_DIR=Extensao"

if not exist "%SERVER_DIR%\node_modules" (
    echo AVISO: As dependencias do backend ainda nao foram detectadas.
    echo Lembre-se de iniciar o backend executando "2-Ativar-Backend.bat".
    echo.
)

echo Abrindo a extensao compativel com o backend local e a pagina de extensoes...
echo.
echo   No Chrome que vai abrir:
echo     1. Ative a chave "Modo do desenvolvedor" (canto superior direito)
echo     2. Clique em "Carregar sem compactacao"
echo     3. Selecione a pasta que vai abrir no Explorador de Arquivos
echo        (a pasta %EXT_DIR%)
echo.

start "" "%CD%\%EXT_DIR%"
start "" "chrome" "chrome://extensions/"

echo ============================================
echo   Carregue a pasta: %CD%\%EXT_DIR%
echo ============================================
echo.
pause
