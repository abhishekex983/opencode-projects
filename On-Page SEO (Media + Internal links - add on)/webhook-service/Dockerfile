FROM node:20-alpine

WORKDIR /app

# Install prod dependencies first so Docker can cache this layer.
COPY package*.json ./
RUN npm install --omit=dev

# Then copy the rest of the app.
COPY . .

ENV NODE_ENV=production

# Fly routes external 80/443 to internal_port from fly.toml.
# We set PORT=8080 in fly.toml [env] so server.js binds the right port.
EXPOSE 8080

CMD ["node", "server.js"]
