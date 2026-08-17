FROM node:20-alpine

WORKDIR /app

# Prisma requires OpenSSL inside the Alpine container
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["npm", "start"]