.PHONY: bootstrap generate lint test test-contract test-e2e scan migrate seed up down

bootstrap:
	python -m pip install uv
	cd services/insight-py && uv sync --all-extras

generate:
	buf generate contracts

lint:
	cd services/gateway-go && go vet ./...
	cd services/platform-go && go vet ./...
	cd services/insight-py && uv run ruff check . && uv run mypy insight
	npm run lint

test:
	cd services/gateway-go && go test ./...
	cd services/platform-go && go test ./...
	cd services/insight-py && uv run pytest
	cd apps/web && npm test

test-contract:
	buf lint contracts
	python tools/check_contracts.py

test-e2e:
	npm run test:e2e

scan:
	python tools/check_contracts.py

migrate:
	golang-migrate -path infra/migrations/platform -database "$(GM_PLATFORM_MIGRATION_URL)" up

seed:
	go run ./tools/seed

up:
	docker compose -f infra/compose.yaml up --build

down:
	docker compose -f infra/compose.yaml down
