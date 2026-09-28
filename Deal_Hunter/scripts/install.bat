@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
call "1-Instalar.bat"
exit /b %errorlevel%
