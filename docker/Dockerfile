# =============================================================================
# SentinelGate — Hardened Multi-Stage Non-Root Dockerfile
# Stage 1: Isolated Build Environment
# =============================================================================
FROM node:20.12-alpine3.19 AS builder

WORKDIR /app

# Copy lockfiles first for deterministic layer caching
COPY package.json package-lock.json* ./

# Mitigate supply-chain postinstall script execution via --ignore-scripts
RUN npm install --ignore-scripts

COPY . .
RUN npm run build

# =============================================================================
# Stage 2: Distroless / Unprivileged Nginx Runtime (UID 101)
# =============================================================================
FROM nginxinc/nginx-unprivileged:1.25-alpine-slim AS runtime

LABEL org.opencontainers.image.title="SentinelGate Telemetry Observatory" \
      org.opencontainers.image.description="Hardened Non-Root Container Image" \
      org.opencontainers.image.vendor="SentinelGate DevSecOps"

# Copy custom security headers config
COPY docker/nginx-security.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets with strict non-root ownership
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html

# Enforce non-root execution (UID 101 = nginx unprivileged user)
USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
