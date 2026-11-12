FROM node:24-slim
RUN npm install --global pnpm@11.22.0
WORKDIR /repo
COPY . .
ARG NEXT_PUBLIC_SERVER_URL=""
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
RUN pnpm install --frozen-lockfile --filter @mediwise/cms... \
  && pnpm --filter @mediwise/cms build \
  && cp -r apps/cms/.next/static apps/cms/.next/standalone/apps/cms/.next/static
WORKDIR /repo/apps/cms/.next/standalone/apps/cms
ENV NODE_ENV=production NO_COLOR=1 HOSTNAME=0.0.0.0 PORT=3000
CMD ["node", "server.js"]
