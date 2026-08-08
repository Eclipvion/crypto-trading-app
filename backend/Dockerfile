# Base image for Node.js
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --only=production

# Bundle app source
COPY . .

# Expose port 5000 for the Express server
EXPOSE 5000

# Start command
CMD ["npm", "start"]
