# Sử dụng Node.js bản nhẹ (Alpine)
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy package và cài dependencies
# Lưu ý: NestJS cần devDependencies (như @nestjs/cli) để build, nên ta cài bình thường
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build ứng dụng NestJS (tạo thư mục dist)
RUN npm run build

# Tạo thư mục logs và cấp quyền (Quan trọng cho Filebeat đọc log)
RUN mkdir -p /app/logs && chown -R node:node /app/logs

# Chạy dưới quyền user node (Bảo mật)
USER node

# Start ứng dụng từ thư mục dist đã build
CMD ["node", "dist/main"]