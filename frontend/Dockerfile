FROM node:22-alpine

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4173
CMD ["npx", "vite", "preview", "--host", "--port", "4173"]
