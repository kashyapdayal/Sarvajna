#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SkillOS / Sarvajna - Unified Frontend & Backend Controller
# Automates starting, stopping, restarting, and status checks for both services.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
DEFAULT_PORT="3000"
WEB_PORT="${PORT:-$DEFAULT_PORT}"
MODE="dev" # "dev" or "prod"

# Color Codes
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_GREEN="\033[32m"
C_CYAN="\033[36m"
C_AMBER="\033[33m"
C_RED="\033[31m"
C_DIM="\033[2m"

mkdir -p "$RUNTIME_DIR"

log_info() {
  echo -e "${C_CYAN}[INFO]${C_RESET} $*"
}

log_success() {
  echo -e "${C_GREEN}[SUCCESS]${C_RESET} $*"
}

log_warn() {
  echo -e "${C_AMBER}[WARN]${C_RESET} $*"
}

log_error() {
  echo -e "${C_RED}[ERROR]${C_RESET} $*" >&2
}

value_from_env() {
  local key="$1"
  local env_file="$ROOT_DIR/.env.local"
  [[ -f "$env_file" ]] || return 0
  sed -n "s/^${key}=//p" "$env_file" | tail -n 1 | tr -d '\r'
}

warn_environment() {
  local supabase_url anon_key service_key ai_key
  supabase_url="$(value_from_env NEXT_PUBLIC_SUPABASE_URL)"
  anon_key="$(value_from_env NEXT_PUBLIC_SUPABASE_ANON_KEY)"
  service_key="$(value_from_env SUPABASE_SERVICE_ROLE_KEY)"
  ai_key="$(value_from_env AI_API_KEY)"

  if [[ -z "$supabase_url" || "$supabase_url" == *"your-project"* || ! "$supabase_url" =~ ^https://[a-zA-Z0-9-]+\.supabase\.co$ ]]; then
    log_info "Supabase URL is in local/mock mode. Web app and backend will use local sessions & telemetry."
  fi

  if [[ -z "$ai_key" ]]; then
    log_info "AI_API_KEY is not set. Mock adaptive learning algorithms and offline curricula active."
  fi
}

pid_is_running() {
  local pid_file="$1"
  [[ -f "$pid_file" ]] || return 1
  local pid
  pid="$(<"$pid_file")"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

kill_process_tree() {
  local pid="$1"
  if kill -0 "$pid" 2>/dev/null; then
    # Attempt process group kill first
    if kill -TERM -- "-$pid" 2>/dev/null; then
      sleep 0.5
    else
      kill -TERM "$pid" 2>/dev/null || true
    fi
    # Force kill if still lingering
    if kill -0 "$pid" 2>/dev/null; then
      sleep 0.5
      kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
  fi
}

free_port_if_occupied() {
  local port="$1"
  if command -v fuser >/dev/null 2>&1; then
    local pids
    pids="$(fuser "${port}/tcp" 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      log_warn "Port $port is currently occupied by PID(s): $pids. Reclaiming port..."
      fuser -k -9 "${port}/tcp" >/dev/null 2>&1 || true
      sleep 1
    fi
  elif command -v lsof >/dev/null 2>&1; then
    local occupied_pid
    occupied_pid="$(lsof -t -i :"$port" 2>/dev/null || true)"
    if [[ -n "$occupied_pid" ]]; then
      log_warn "Port $port is currently occupied by PID(s): $occupied_pid. Reclaiming port..."
      for p in $occupied_pid; do
        kill_process_tree "$p"
      done
      sleep 1
    fi
  fi
}

start_background_service() {
  local name="$1"
  shift

  local pid_file="$RUNTIME_DIR/$name.pid"
  local log_file="$RUNTIME_DIR/$name.log"

  if pid_is_running "$pid_file"; then
    log_warn "$name is already running (PID $(<"$pid_file"))."
    return
  fi

  rm -f "$pid_file"

  (
    cd "$ROOT_DIR"
    if command -v setsid >/dev/null 2>&1; then
      exec setsid "$@"
    else
      exec "$@"
    fi
  ) >"$log_file" 2>&1 < /dev/null &

  local new_pid="$!"
  echo "$new_pid" >"$pid_file"
  log_info "Started $name (PID $new_pid); Log: $log_file"
}

stop_service() {
  local name="$1"
  local pid_file="$RUNTIME_DIR/$name.pid"

  if [[ ! -f "$pid_file" ]]; then
    return
  fi

  local pid
  pid="$(<"$pid_file")"
  if [[ "$pid" =~ ^[0-9]+$ ]]; then
    kill_process_tree "$pid"
    log_info "Stopped $name (PID $pid)."
  fi
  rm -f "$pid_file"
}

stop_all() {
  echo -e "${C_BOLD}Stopping SkillOS / Sarvajna Services...${C_RESET}"
  stop_service "web"
  stop_service "worker"

  # Clean up any orphan processes bound to the port
  free_port_if_occupied "$WEB_PORT"

  # Remove any stray PID files
  rm -f "$RUNTIME_DIR/web.pid" "$RUNTIME_DIR/worker.pid"

  log_success "All services stopped cleanly. Port $WEB_PORT is free."
}

show_status() {
  echo -e "\n${C_BOLD}--- SkillOS / Sarvajna Service Status ---${C_RESET}"

  local web_running="false"
  local worker_running="false"

  if pid_is_running "$RUNTIME_DIR/web.pid"; then
    local web_pid
    web_pid="$(<"$RUNTIME_DIR/web.pid")"
    echo -e "Frontend Web Server: ${C_GREEN}RUNNING${C_RESET} (PID $web_pid) on Port $WEB_PORT"
    web_running="true"
  else
    echo -e "Frontend Web Server: ${C_RED}STOPPED${C_RESET}"
  fi

  if pid_is_running "$RUNTIME_DIR/worker.pid"; then
    local worker_pid
    worker_pid="$(<"$RUNTIME_DIR/worker.pid")"
    echo -e "Backend Background Worker: ${C_GREEN}RUNNING${C_RESET} (PID $worker_pid)"
    worker_running="true"
  else
    echo -e "Backend Background Worker: ${C_RED}STOPPED${C_RESET}"
  fi

  if [[ "$web_running" == "true" ]]; then
    local http_code
    http_code="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$WEB_PORT/api/health" 2>/dev/null || echo "DOWN")"
    if [[ "$http_code" == "200" ]]; then
      echo -e "API Health (/api/health): ${C_GREEN}HEALTHY (200 OK)${C_RESET}"
    else
      echo -e "API Health (/api/health): ${C_AMBER}RESPONDING ($http_code)${C_RESET}"
    fi

    local login_code
    login_code="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$WEB_PORT/login" 2>/dev/null || echo "DOWN")"
    if [[ "$login_code" == "200" ]]; then
      echo -e "Login Page (/login): ${C_GREEN}READY (200 OK)${C_RESET}"
    fi
  fi
  echo
}

wait_for_web_server() {
  local port="$1"
  local max_attempts=30
  local attempt=1

  log_info "Waiting for web server to become responsive on http://localhost:$port..."
  while [[ $attempt -le $max_attempts ]]; do
    local response
    response="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/api/health" 2>/dev/null || echo "000")"
    if [[ "$response" == "200" || "$response" == "307" || "$response" == "204" ]]; then
      log_success "Web server is active and responding (HTTP $response)!"
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done

  log_warn "Web server took longer than 30s to respond to health check. Checking logs..."
  tail -n 15 "$RUNTIME_DIR/web.log" || true
  return 0
}

start_all() {
  echo -e "\n${C_BOLD}${C_GREEN}======================================================${C_RESET}"
  echo -e "${C_BOLD}${C_GREEN}  SkillOS / Sarvajna - Integrated Webpage Launcher    ${C_RESET}"
  echo -e "${C_BOLD}${C_GREEN}======================================================${C_RESET}\n"

  if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
    log_error "node_modules missing in $ROOT_DIR. Please run 'npm install' first."
    exit 1
  fi

  warn_environment

  # 1. Clean previous runs & free port if occupied
  free_port_if_occupied "$WEB_PORT"

  # 2. Start Frontend Web Service
  log_info "Launching Frontend Web Server (Next.js) on port $WEB_PORT [mode: $MODE]..."
  if [[ "$MODE" == "prod" ]]; then
    if [[ ! -d "$ROOT_DIR/.next" ]]; then
      log_info "Building production bundles..."
      (cd "$ROOT_DIR" && npm run build)
    fi
    start_background_service "web" npm run start -- --port "$WEB_PORT"
  else
    start_background_service "web" npm run dev -- --port "$WEB_PORT"
  fi

  # 3. Start Backend Background Worker Service
  log_info "Launching Backend Background Worker..."
  start_background_service "worker" npm run worker

  # 4. Await Health Check Confirmation
  wait_for_web_server "$WEB_PORT"

  echo
  echo -e "${C_BOLD}${C_GREEN}======================================================${C_RESET}"
  echo -e "${C_BOLD}Web Application URL:${C_RESET}     ${C_CYAN}http://localhost:$WEB_PORT${C_RESET}"
  echo -e "${C_BOLD}Login Screen (Direct):${C_RESET}   ${C_CYAN}http://localhost:$WEB_PORT/login${C_RESET}"
  echo -e "${C_BOLD}Backend Health Check:${C_RESET}   ${C_CYAN}http://localhost:$WEB_PORT/api/health${C_RESET}"
  echo -e "${C_BOLD}Runtime Logs:${C_RESET}            ${C_DIM}$RUNTIME_DIR/web.log & worker.log${C_RESET}"
  echo -e "${C_BOLD}To Stop Services:${C_RESET}        ${C_AMBER}./scripts/stop.sh${C_RESET} or ${C_AMBER}npm run local:stop${C_RESET}"
  echo -e "${C_BOLD}To Check Status:${C_RESET}         ${C_CYAN}./scripts/start.sh --status${C_RESET}"
  echo -e "${C_BOLD}${C_GREEN}======================================================${C_RESET}\n"
}

# Command Line Parsing
case "${1:-start}" in
  --stop|stop)
    stop_all
    ;;
  --status|status)
    show_status
    ;;
  --restart|restart)
    stop_all
    sleep 1
    start_all
    ;;
  --prod|--production|prod)
    MODE="prod"
    start_all
    ;;
  --logs|logs)
    tail -f "$RUNTIME_DIR/web.log" "$RUNTIME_DIR/worker.log"
    ;;
  --help|-h|help)
    echo "Usage: ./scripts/start.sh [options]"
    echo
    echo "Options:"
    echo "  (default)            Start both frontend and backend in development mode"
    echo "  --prod, prod         Start both frontend and backend in production mode"
    echo "  --stop, stop         Stop all running frontend and backend services"
    echo "  --restart, restart   Restart all services cleanly"
    echo "  --status, status     Show live status and health of services"
    echo "  --logs, logs         Follow real-time service logs"
    echo "  --help, -h           Show this help message"
    echo
    echo "Environment Variables:"
    echo "  PORT                 Specify custom port (default: 3000)"
    ;;
  start|*)
    start_all
    ;;
esac
