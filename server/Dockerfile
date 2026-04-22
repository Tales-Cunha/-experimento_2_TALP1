FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
# Copy shared first
COPY ../shared /shared
# Copy server source
COPY . .
RUN npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
# Bring shared for runtime if needed (though usually only types are needed for build)
COPY --from=builder /shared /shared
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
ENV PORT=3001
EXPOSE ${PORT}
CMD ["node", "dist/index.js"]
