# -------- STAGE 1: Build TypeScript and Prisma --------
FROM node:20 AS builder
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install all dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript -> dist/
RUN npm run build

# -------- STAGE 2: Run production build --------
FROM node:20
WORKDIR /app

# Copy only built artifacts and essentials
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy env file if exists
COPY .env .env

# Expose port (4000)
EXPOSE 4000

# Start the server
CMD ["node", "dist/server.js"]
