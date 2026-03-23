#!/bin/bash
set -e

# Colours
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m' # No Colour

# Kill both child processes cleanly on Ctrl+C or exit
cleanup() {
  echo ""
  echo "Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# Backend
echo -e "${BLUE}[backend]${NC} Activating venv and starting FastAPI..."
(
  cd backend
  source .venv/bin/activate
  uvicorn app.main:app --reload 2>&1 | sed "s/^/$(printf "${BLUE}[backend]${NC} ")/"
) &
BACKEND_PID=$!

# Give the backend a moment to bind before starting the frontend
sleep 1

# Frontend
echo -e "${GREEN}[frontend]${NC} Starting Vite dev server..."
(
  cd frontend
  npm run dev 2>&1 | sed "s/^/$(printf "${GREEN}[frontend]${NC} ")/"
) &
FRONTEND_PID=$!

echo ""
echo -e "Both running. Press ${BLUE}Ctrl+C${NC} to stop everything."
echo ""

wait
