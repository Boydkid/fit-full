# -------- STAGE 1: Build TypeScript and Prisma --------
FROM node:20 AS builder
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install all dependencies (skip postinstall)
RUN npm install --ignore-scripts

# ✅ Copy Prisma schema before running generate
COPY prisma ./prisma
WORKDIR /app
RUN npx prisma generate

# Copy rest of the source code
COPY . .

# ✅ Fix permissions for TypeScript compiler
RUN chmod +x ./node_modules/.bin/tsc

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

# Copy environment file if exists
COPY .env .env

# Expose port (4000)
EXPOSE 4000

# Start the server
CMD ["node", "dist/server.js"]
