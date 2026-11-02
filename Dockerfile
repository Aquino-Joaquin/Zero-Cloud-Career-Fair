# Imagen del servidor local de Zero-Cloud (app compilada + API), para Green Metrics Tool o despliegue.
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY --from=build /app/dist ./dist
COPY server ./server
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.js"]
