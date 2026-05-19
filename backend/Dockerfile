FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# Install ALL deps (including devDeps) for the build step
COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl docker-cli
WORKDIR /app

# Re-copy package files and install only prod deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# node_modules has prisma client — regenerate in runner too
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
