@echo off
echo ========================================================
echo        Starting SHE Twin AI Full-Stack Platform
echo ========================================================
echo.
echo 1. Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "SHE Twin AI - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo 2. Starting Vite React Frontend on http://127.0.0.1:5173 ...
start "SHE Twin AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo 3. Opening browser...
timeout /t 3 /nobreak >nul
start http://127.0.0.1:5173/

echo.
echo Both servers are launching!
echo Frontend: http://127.0.0.1:5173/
echo Backend:  http://127.0.0.1:8000/
echo ========================================================
