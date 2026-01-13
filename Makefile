.PHONY: dev build start lint install clean build-local push-local build-push

# Development
dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

install:
	npm install

clean:
	rm -rf .next node_modules

# =============================================================================
# Local ARM64 Build & Push (for Apple Silicon development)
# =============================================================================

GHCR_IMAGE = ghcr.io/prodigy90/affiliate-frontend

build-local:
	@echo "Building Docker image for arm64 (Apple Silicon)..."
	@docker build -t $(GHCR_IMAGE):arm64 .
	@echo "Build complete! Image: $(GHCR_IMAGE):arm64"

push-local:
	@docker push $(GHCR_IMAGE):arm64 && \
		(echo "Push complete!"; \
		 echo ""; \
		 echo "To deploy in K8s:"; \
		 echo "  kubectl -n wasbot-e2e rollout restart deployment/affiliate-frontend") || \
		(echo ""; \
		 echo "ERROR: Push failed. If unauthorized, run:"; \
		 echo "  gh auth token | docker login ghcr.io -u YOUR_USERNAME --password-stdin"; \
		 exit 1)

build-push: build-local push-local
