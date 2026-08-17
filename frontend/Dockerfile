FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Backend URL must be available while Next.js is being built
ARG BACKEND_URL=http://backend:5000
ENV BACKEND_URL=$BACKEND_URL

# NEXT_PUBLIC_* vars are baked in at build time
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

RUN npm run build

# Next.js production server
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 5173
ENV PORT=5173
CMD ["node", "server.js"]