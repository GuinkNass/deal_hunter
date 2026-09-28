@echo off
chcp 65001 >nul
cd /d "%~dp0\.."
call "2-Ativar-Backend.bat"
exit /b %errorlevel%
