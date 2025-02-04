# Build Stage - Using Node.js to build the frontend
FROM node:16 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the application for production
RUN npm run build

# Production Stage - Using Nginx to serve the built frontend
FROM nginx:alpine

# Set the working directory inside the container
WORKDIR /usr/share/nginx/html

# Copy the built files from the previous stage
COPY --from=build /app/dist .

# Ensure the /health endpoint exists (for ALB health checks)
RUN echo "OK" > /usr/share/nginx/html/health

# Copy a custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the ports
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]