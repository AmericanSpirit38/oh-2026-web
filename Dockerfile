FROM node:16-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --legacy-peer-deps

COPY . .

ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_API_URL
ARG AZURE_CLIENT_ID
ARG AZURE_CLIENT_SECRET
ARG AZURE_TENANT_ID
ARG JWT_SECRET
ARG API_KEY
ENV NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    AZURE_CLIENT_ID=$AZURE_CLIENT_ID \
    AURE_CLIENT_ID=$AZURE_CLIENT_ID \
    AZURE_CLIENT_SECRET=$AZURE_CLIENT_SECRET \
    AZURE_TENANT_ID=$AZURE_TENANT_ID \
    JWT_SECRET=$JWT_SECRET \
    API_KEY=$API_KEY

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
