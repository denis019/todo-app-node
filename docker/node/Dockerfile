#--------------------------------------------------------------------------
# Base Image
#--------------------------------------------------------------------------
FROM node:12.16.1 as base

ENV NODE_ENV=production
ENV PORT 3000
ENV PATH /app/node_modules/.bin:$PATH
ENV TINI_VERSION v0.18.0

EXPOSE ${PORT}

WORKDIR /app

COPY package*.json ./

RUN npm config list
RUN npm install \
    && npm cache clean --force

# need this in docker container to properly exit since node doesn't handle SIGINT/SIGTERM
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

ENTRYPOINT ["/tini", "--"]
CMD ["node", "app.js"]

#--------------------------------------------------------------------------
# Dev Image
#--------------------------------------------------------------------------
FROM base as dev

ENV NODE_ENV=development

RUN apt-get update -qq && apt-get install -qy \
    curl \
    --no-install-recommends
RUN npm config list
RUN npm install --only=development \
    && npm cache clean --force

USER node
CMD ["npm", "run", "dev"]

#--------------------------------------------------------------------------
# Test Image
#--------------------------------------------------------------------------
FROM dev as test

# scan project for vulnerabilities
RUN npm audit
