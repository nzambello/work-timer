# base node image
FROM node:16-bullseye-slim as base

# set for base and all layer that inherit from it
ENV NODE_ENV production

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl sqlite3

# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /timer

ADD package.json .npmrc ./
RUN npm install --include=dev

# Setup production node_modules
FROM base as production-deps

WORKDIR /timer

COPY --from=deps /timer/node_modules /timer/node_modules
ADD package.json .npmrc ./
RUN npm prune --omit=dev

# Build the app
FROM base as build

WORKDIR /timer

COPY --from=deps /timer/node_modules /timer/node_modules

ADD prisma .
RUN npx prisma generate

ADD . .
RUN npm run build

# Finally, build the production image with minimal footprint
FROM base

ENV DATABASE_URL=file:/data/sqlite.db
ENV PORT="8080"
ENV NODE_ENV="production"
ENV SESSION_SECRET="${SESSION_SECRET:-za1W297qRgKq6PNtm5EXJlOfIto6WTS}"
ENV ALLOW_USER_SIGNUP=0

# add shortcut for connecting to database CLI
RUN echo "#!/bin/sh\nset -x\nsqlite3 \$DATABASE_URL" > /usr/local/bin/database-cli && chmod +x /usr/local/bin/database-cli

WORKDIR /timer

COPY --from=production-deps /timer/node_modules /timer/node_modules
COPY --from=build /timer/node_modules/.prisma /timer/node_modules/.prisma

COPY --from=build /timer/build /timer/build
COPY --from=build /timer/public /timer/public
COPY --from=build /timer/package.json /timer/package.json
COPY --from=build /timer/start.sh /timer/start.sh
COPY --from=build /timer/prisma /timer/prisma

RUN chmod +x start.sh

ENTRYPOINT [ "./start.sh" ]

EXPOSE 8080
