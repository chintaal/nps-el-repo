COMPOSE := docker compose -f mirage/docker-compose.yml
ENV_FILE := mirage/.env

.PHONY: help setup run up up-d down logs build restart restart-local restart-local-d ps clean health attack demo

help: ## Show available commands
	@echo "Project Mirage"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Services: dashboard :3000 | API :8000 | honeypot :8080"

setup: ## Copy mirage/.env.example to mirage/.env if missing
	@test -f $(ENV_FILE) || (cp mirage/.env.example $(ENV_FILE) && \
		echo "Created $(ENV_FILE) — add ANTHROPIC_API_KEY before running.")
	@test -f $(ENV_FILE) && echo "$(ENV_FILE) already exists."

run: up ## Alias for up

up: setup ## Build and start all services (foreground)
	$(COMPOSE) up --build

up-d: setup ## Build and start all services (detached)
	$(COMPOSE) up --build -d

down: ## Stop and remove containers
	$(COMPOSE) down

logs: ## Follow service logs
	$(COMPOSE) logs -f

build: ## Build images without starting
	$(COMPOSE) build

restart: down up-d ## Restart all services in the background

restart-local: ## Stop related processes and start fresh (foreground)
	bash mirage/scripts/restart_local.sh

restart-local-d: ## Stop related processes and start fresh (detached)
	bash mirage/scripts/restart_local.sh -d

ps: ## Show running containers
	$(COMPOSE) ps

clean: down ## Stop containers and remove volumes
	$(COMPOSE) down -v

health: ## Verify backend, dashboard, and proxy are up
	python3 mirage/scripts/health_check.py

attack: ## Run live attack simulation against the honeypot
	bash mirage/scripts/attack_sim.sh

demo: ## Print the full demo workflow
	@echo "Terminal 1: make run"
	@echo "Terminal 2: make health"
	@echo "Terminal 3: make attack"
	@echo "Dashboard:  http://localhost:3000"
