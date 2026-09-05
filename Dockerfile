FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile=false && pnpm build

FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
