FROM node:20-alpine

WORKDIR /app

RUN npm install -g expo-cli@6

COPY package*.json ./
# ⭐️ ここにオプションを追記
RUN npm install --legacy-peer-deps

COPY . .

# v6では 0.0.0.0 は使えないので lan を指定！
CMD ["npx", "expo", "start", "--web", "--host", "lan"]