FROM node:18.20.4 as builder 

# Set working directory
WORKDIR /app

# Copy only package files
COPY package.json package-lock.json ./

# Set NPM mirror for faster installs
RUN npm config set registry https://registry.npmmirror.com

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the source code
COPY . .

RUN npm run build:prod

# Expose port 4200 for development server
EXPOSE 4200
# FROM nginx

# COPY --from=builder /app/dist/vuexy /usr/share/nginx/html
# #COPY .well-known/  /usr/share/nginx/html/
# COPY nginx.conf /etc/nginx/
# COPY default.conf /etc/nginx/conf.d

# Command to start Angular development server
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0","--disable-host-check"]