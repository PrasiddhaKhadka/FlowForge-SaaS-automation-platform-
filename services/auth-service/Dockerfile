# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci 

COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

RUN npm run build
RUN npx prisma generate


# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma


EXPOSE 5000

CMD [ "node", "dist/src/index.js" ]

