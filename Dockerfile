FROM node:14-alpine

# Install Meteor
RUN curl https://install.meteor.com/ | sh

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN meteor npm install --production

# Copy app files
COPY . .

# Build the app
RUN meteor build --directory /build --server-only

# Production stage
FROM node:14-alpine

WORKDIR /app

# Copy built app
COPY --from=0 /build/bundle /app

# Install production dependencies
WORKDIR /app/programs/server
RUN npm install

# Set environment variables
ENV PORT=3000
ENV ROOT_URL=http://localhost:3000
ENV MONGO_URL=mongodb://mongo:27017/printify

WORKDIR /app

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "main.js"]
