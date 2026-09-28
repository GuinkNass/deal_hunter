@echo off
title Deal Hunter - Setup completo
cd /d "%~dp0"

call scripts\install.bat
if errorlevel 1 exit /b 1

echo.
echo Iniciando o backend agora...
call scripts\start.bat
