#!/usr/bin/env bash
# Stop Mirage-related containers and free service ports, then start fresh.
#
# Usage:
#   bash mirage/scripts/restart_local.sh        # foreground (logs in terminal)
#   bash mirage/scripts/restart_local.sh -d     # detached (background)
#   make restart-local                          # same as above

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE=(docker compose -f mirage/docker-compose.yml)
ENV_FILE="mirage/.env"
PORTS=(3000 8000 8080)
DETACH=false

usage() {
  echo "Usage: $(basename "$0") [-d|--detach]"
  echo ""
  echo "  Stops Mirage docker compose services, frees ports ${PORTS[*]},"
  echo "  ensures mirage/.env exists, then starts the stack locally."
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--detach) DETACH=true; shift ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

require_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running. Start Docker Desktop and retry." >&2
    exit 1
  fi
}

stop_compose_stack() {
  echo "==> Stopping Mirage compose project"
  "${COMPOSE[@]}" kill 2>/dev/null || true
  "${COMPOSE[@]}" down --remove-orphans --timeout 5 2>/dev/null || true
  "${COMPOSE[@]}" rm -f -s 2>/dev/null || true

  # Legacy project name had corrupted container state (ghost target container).
  docker compose -f mirage/docker-compose.yml -p mirage down --remove-orphans --timeout 5 2>/dev/null || true
  docker compose -f mirage/docker-compose.yml -p mirage-clean down --remove-orphans --timeout 5 2>/dev/null || true

  local by_project by_name by_network
  by_project="$(docker ps -aq --filter "label=com.docker.compose.project=mirage" 2>/dev/null || true)"
  by_project+=$'\n'"$(docker ps -aq --filter "label=com.docker.compose.project=mirage-lab" 2>/dev/null || true)"
  by_project+=$'\n'"$(docker ps -aq --filter "label=com.docker.compose.project=mirage-clean" 2>/dev/null || true)"
  by_name="$(docker ps -aq --filter "name=mirage" 2>/dev/null || true)"
  by_network="$(docker ps -aq --filter "network=mirage_default" 2>/dev/null || true)"
  lingering="$(printf '%s\n%s\n%s' "$by_project" "$by_name" "$by_network" | sort -u | grep -v '^$' || true)"
  if [[ -n "$lingering" ]]; then
    echo "==> Removing lingering Mirage containers"
    echo "$lingering" | xargs docker rm -f 2>/dev/null || true
  fi

  for name in mirage-backend mirage-frontend mirage-target; do
    docker rm -f "$name" 2>/dev/null || true
  done

  for net in mirage_default mirage-lab_default mirage-clean_default; do
    docker network rm "$net" 2>/dev/null || true
  done
  docker container prune -f >/dev/null 2>&1 || true
}

stop_docker_port_bindings() {
  echo "==> Releasing Docker port bindings (${PORTS[*]})"
  for port in "${PORTS[@]}"; do
    local ids
    ids="$(docker ps -aq --filter "publish=${port}" 2>/dev/null || true)"
    [[ -z "$ids" ]] && continue
    while read -r id; do
      [[ -z "$id" ]] && continue
      local name
      name="$(docker inspect -f '{{.Name}}' "$id" 2>/dev/null | sed 's#^/##' || echo "$id")"
      echo "  Removing ${name} (was bound to :${port})"
      docker rm -f "$id" 2>/dev/null || true
    done <<< "$ids"
  done
}

is_docker_process() {
  local pid="$1"
  local cmd
  cmd="$(ps -p "$pid" -o comm= 2>/dev/null || true)"
  [[ "$cmd" == *docker* ]] || [[ "$cmd" == "com.docke" ]]
}

free_local_port_listeners() {
  echo "==> Stopping non-Docker listeners on (${PORTS[*]})"
  for port in "${PORTS[@]}"; do
    local pids
    pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
    [[ -z "$pids" ]] && continue

    while read -r pid; do
      [[ -z "$pid" ]] && continue
      if is_docker_process "$pid"; then
        continue
      fi
      local cmd
      cmd="$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")"
      echo "  :${port} stopping ${cmd} (pid ${pid})"
      kill -TERM "$pid" 2>/dev/null || true
    done <<< "$pids"
  done

  sleep 0.5

  for port in "${PORTS[@]}"; do
    local pids
    pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
    [[ -z "$pids" ]] && continue

    while read -r pid; do
      [[ -z "$pid" ]] && continue
      is_docker_process "$pid" && continue
      echo "  :${port} force-killing pid ${pid}"
      kill -9 "$pid" 2>/dev/null || true
    done <<< "$pids"
  done
}

verify_ports_free() {
  local blocked=()
  for port in "${PORTS[@]}"; do
    if docker ps -aq --filter "publish=${port}" 2>/dev/null | grep -q .; then
      blocked+=("$port")
    fi
  done
  if [[ ${#blocked[@]} -gt 0 ]]; then
    echo "Error: port(s) still claimed by Docker after cleanup: ${blocked[*]}" >&2
    echo "Run: docker ps -a --filter publish=8000" >&2
    exit 1
  fi
}

cd "$ROOT"
require_docker
stop_compose_stack
stop_docker_port_bindings
free_local_port_listeners
verify_ports_free

if [[ ! -f "$ENV_FILE" ]]; then
  cp mirage/.env.example "$ENV_FILE"
  echo "==> Created $ENV_FILE — add ANTHROPIC_API_KEY before deception will work."
elif ! grep -q '^ANTHROPIC_API_KEY=.\+' "$ENV_FILE" 2>/dev/null; then
  echo "==> Warning: ANTHROPIC_API_KEY is missing or empty in $ENV_FILE"
fi

echo "==> Starting Mirage ($( $DETACH && echo detached || echo foreground ))"
if $DETACH; then
  "${COMPOSE[@]}" up --build --force-recreate --remove-orphans -d
  echo ""
  echo "Services:"
  echo "  Dashboard  http://localhost:3000"
  echo "  API        http://localhost:8000"
  echo "  Honeypot   http://localhost:8080"
  echo ""
  echo "Follow logs: make logs"
  echo "Health check: make health"
else
  "${COMPOSE[@]}" up --build --force-recreate --remove-orphans
fi
