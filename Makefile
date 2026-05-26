.PHONY: build build-all dev clean frontend-build build-win build-linux run init

# Frontend
frontend-build:
	cd frontend && npm install && npm run build

# Build current platform
build: frontend-build
	cd backend && go build -ldflags="-s -w" -o ../dist/app ./cmd/server/

# Build Windows
build-win: frontend-build
	cd backend && GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o ../dist/app.exe ./cmd/server/

# Build Linux
build-linux: frontend-build
	cd backend && GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ../dist/app ./cmd/server/

# Build all platforms
build-all: build-win build-linux

# Development
dev-backend:
	cd backend && go run ./cmd/server/

dev-frontend:
	cd frontend && npm run dev

dev:
	echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"

# Clean
clean:
	rm -rf frontend/dist
	rm -rf dist/
	rm -f backend/app

# Run production binary
run:
	./dist/app

# Initialize dev environment
init:
	cd frontend && npm install
	cd backend && go mod tidy