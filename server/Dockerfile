FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY shared /shared
COPY server .
RUN npx tsc -p tsconfig.json --rootDir /

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV PORT=3001
EXPOSE ${PORT}
CMD ["node", "dist/app/src/index.js"]
