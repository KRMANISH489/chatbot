FROM node:20-alpine

WORKDIR /app

COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm install --prefix client && npm install --prefix server

COPY client ./client
COPY server ./server

RUN CI=false npm run build --prefix client

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

WORKDIR /app/server
CMD ["npm", "start"]
