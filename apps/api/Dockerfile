FROM node:24-slim
RUN apt-get update \
  && apt-get install --yes --no-install-recommends poppler-utils \
  && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@11.22.0
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter @mediwise/api... \
  && pnpm --filter @mediwise/api... build
WORKDIR /repo/apps/api
ENV NODE_ENV=production RUN_WORKER=true NO_COLOR=1
CMD ["node", "dist/index.js"]
