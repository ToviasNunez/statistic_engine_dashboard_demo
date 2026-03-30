# STEP 1: Build the React app using Vite
FROM node:18-alpine as build

WORKDIR /app

# Only copy package.json and package-lock.json first for better caching
COPY package*.json ./

# ✅ Install all declared dependencies (react-hot-toast must be in package.json)
RUN npm config set strict-ssl false && npm install
RUN npm install react-date-range date-fns


# Then copy the rest of your app code
COPY . .

# Build the frontend app
RUN npm run build
# STEP 2: Use nginx to serve the built app
FROM nginx:stable-alpine

# Copy the built files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
