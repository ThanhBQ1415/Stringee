import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 8081, // Đặt cổng mà bạn muốn sử dụng
    host: '0.0.0.0', // Nếu bạn muốn cho phép truy cập từ các thiết bị khác trong cùng mạng LAN
  }
});
