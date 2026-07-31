# syntax=docker/dockerfile:1

# Debian-Basis statt Alpine: better-sqlite3 und bcrypt sind native Module.
# Für Alpine (musl) gibt es oft keine passenden Prebuilds, dann müsste alles
# aus dem Quelltext übersetzt werden — auf einem Raspberry Pi dauert das lange.
#
# Node 24 wegen npm 11: die package-lock.json wurde mit npm 11 erzeugt, und
# npm 10 (in node:22) lehnt sie mit "Missing … from lock file" ab.
ARG NODE_VERSION=24-bookworm-slim

# ---------------------------------------------------------------------------
# 1. Abhängigkeiten inkl. Dev-Pakete — hier wird kompiliert
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# node-gyp braucht diese Werkzeuge, falls kein Prebuild zur CPU-Architektur passt
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# .npmrc muss mit: darin steht, welche Installationsskripte laufen dürfen.
# Ohne sie bleiben die nativen Module ungebaut (siehe Kommentar in der Datei).
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ---------------------------------------------------------------------------
# 2. TypeScript übersetzen
# ---------------------------------------------------------------------------
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# 3. Nur die Laufzeit-Abhängigkeiten, erneut nativ übersetzt
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json .npmrc ./
# --foreground-scripts zeigt die Ausgabe von prebuild-install bzw. node-gyp.
# Auf arm64 gibt es nicht für jede Node-Version ein fertiges Binary; dann
# übersetzt node-gyp, und man will sehen, ob das gelingt.
RUN npm ci --omit=dev --foreground-scripts

# Sicherheitsnetz: lieber scheitert der Build hier, als dass ein Image entsteht,
# das erst beim Start mit "Could not locate the bindings file" umfällt — auf
# einem Raspberry Pi merkt man das sonst erst nach einer halben Stunde.
RUN node -e "require('better-sqlite3'); require('bcrypt'); console.log('native Module in Ordnung')"

# ---------------------------------------------------------------------------
# 4. Laufzeit — ohne Compiler, ohne Quelltext
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Verzeichnis für die SQLite-Datei; darauf zeigt später das Volume
RUN mkdir -p /app/data && chown -R node:node /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

ENV PORT=3000 \
    DATABASE_PATH=/app/data/db.sqlite

# Nicht als root laufen lassen
USER node
EXPOSE 3000

# Node 18+ bringt fetch mit — spart curl/wget im Image
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
