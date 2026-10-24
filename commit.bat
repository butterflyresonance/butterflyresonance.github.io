@echo off
setlocal
cd /d "%~dp0"

rem Commit message: when the chess folder has changes, the chess app's build
rem number (e.g. "chess 2026-10-25.5-peer-questions"); otherwise just "commit".
rem If the build number can't be read for any reason, the message falls back to
rem "commit" and the commit still goes ahead as before.
set "MSG=commit"
set "VER="
for /f "tokens=2 delims='" %%v in ('findstr /c:"const VERSION = '" "chess\index.html" 2^>nul') do if not defined VER set "VER=%%v"
set "CHANGED="
for /f "delims=" %%c in ('git status --porcelain -- chess 2^>nul') do set "CHANGED=1"
if defined CHANGED if defined VER set "MSG=chess %VER%"
echo Commit message: %MSG%

git pull
git add .
git commit -a -m "%MSG%"
git push
pause
