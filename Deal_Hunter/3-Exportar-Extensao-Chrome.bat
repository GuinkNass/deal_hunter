@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================
echo   DEAL HUNTER - Exportar extensao para Chrome
echo ============================================
echo.

if not exist "server\node_modules" (
    echo ERRO: O backend ainda nao foi instalado.
    echo Execute primeiro o arquivo "1-Instalar.bat".
    echo.
    pause
    exit /b 1
)

echo Abrindo a extensao compativel com o backend local e a pagina de extensoes...
echo.
echo   No Chrome que vai abrir:
echo     1. Ative a chave "Modo do desenvolvedor" (canto superior direito)
echo     2. Clique em "Carregar sem compactacao"
echo     3. Selecione a pasta que vai abrir no Explorador de Arquivos
echo        (a pasta extension)
echo.

start "" "%CD%\extension"
start "" "chrome" "chrome://extensions/"

echo ============================================
echo   Carregue a pasta: %CD%\extension
echo ============================================
echo.
pause
