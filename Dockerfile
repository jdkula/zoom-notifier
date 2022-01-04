FROM --platform=$BUILDPLATFORM node:16-alpine AS deps-builder
WORKDIR /zoom-notifier
ENV YARN_CACHE_FOLDER=/yarn-cache
COPY package.json yarn.lock ./
RUN apk add --update --no-cache python3 libc6-compat && ln -sf python3 /usr/bin/python
RUN yarn install --frozen-lockfile --network-timeout 1000000

FROM --platform=$BUILDPLATFORM node:17-alpine AS builder
WORKDIR /zoom-notifier
COPY . ./
COPY --from=deps-builder /zoom-notifier/package.json ./package.json
COPY --from=deps-builder /zoom-notifier/node_modules ./node_modules
RUN yarn build


FROM node:16-alpine AS deps
WORKDIR /zoom-notifier
ENV YARN_CACHE_FOLDER=/yarn-cache
COPY package.json yarn.lock ./
COPY --from=deps-builder /yarn-cache /yarn-cache
COPY --from=deps-builder /zoom-notifier/node_modules ./node_modules
RUN apk add --update --no-cache python3 libc6-compat && ln -sf python3 /usr/bin/python
RUN yarn install --frozen-lockfile --prefer-offline --network-timeout 1000000

FROM deps AS deps-prod
WORKDIR /zoom-notifier
RUN yarn install --production --ignore-scripts --prefer-offline --frozen-lockfile --network-timeout 1000000

FROM node:16-alpine AS runner-base
ENV NODE_ENV production
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

FROM runner-base AS runner
WORKDIR /zoom-notifier

COPY --from=deps-prod /zoom-notifier/node_modules ./node_modules
COPY --from=builder /zoom-notifier ./
COPY --from=builder --chown=nextjs:nodejs /zoom-notifier/.next ./.next
COPY --from=builder /zoom-notifier/.env* ./
USER nextjs

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["yarn", "start"]
