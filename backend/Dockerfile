FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies (including devDependencies for tsx)
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
