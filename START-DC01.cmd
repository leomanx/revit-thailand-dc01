@echo off
cd /d "%~dp0"
echo DC01 Data Center learning case
echo Open http://127.0.0.1:4173 in your browser.
echo Keep this window open while using the local preview. Press Ctrl+C to stop.
node tools\serve.cjs
pause
