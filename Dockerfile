FROM node:20

# Install build tools needed for sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies (sqlite3 will be compiled here)
RUN npm ci --no-audit --no-fund

# Copy the rest of the project
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
