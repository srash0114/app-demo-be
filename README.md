# 🛒 E-commerce API (Backend)

Hệ thống API backend cho ứng dụng Thương mại điện tử (E-commerce) được phát triển bằng **NestJS**.

## 🚀 Công nghệ sử dụng
- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Cơ sở dữ liệu**: TypeORM (hiện tích hợp SQLite)
- **Xác thực**: JWT (JSON Web Token) và Passport
- **Upload & Quản lý ảnh**: Cloudinary
- **Thanh toán**: Tích hợp cổng thanh toán VNPay (\
estjs-vnpay\)

## 📌 Các chức năng chính
- **🔒 Authentication & User**: 
  - Đăng ký, đăng nhập (JWT).
  - Quản lý thông tin người dùng và địa chỉ giao hàng.
- **📦 Products & Categories**: 
  - Chức năng quản lý danh mục và sản phẩm.
  - Tìm kiếm, lọc sản phẩm, hiển thị sản phẩm ngẫu nhiên.
- **🛒 Cart (Giỏ hàng)**: 
  - Thêm, sửa, xóa sản phẩm khỏi giỏ hàng.
- **❤️ Favorites (Yêu thích)**: 
  - Thêm sản phẩm vào danh sách yêu thích (Wishlist).
- **📝 Orders (Đơn hàng)**: 
  - Tạo đơn hàng và quản lý chi tiết đơn hàng (Order Items).
  - Cập nhật trạng thái giao hàng.
- **💳 Payment (Thanh toán)**: 
  - Tạo URL thanh toán VNPay, xử lý IPN và Return URL để xác nhận thanh toán trực tuyến.
- **🗺️ Địa giới hành chính (Provinces)**: 
  - Cung cấp API tra cứu toàn bộ Tỉnh/Thành phố, Quận/Huyện, Phường/Xã tại Việt Nam phục vụ việc ghi địa chỉ.

## 🛠 Cài đặt & Khởi động dự án

### 1. Tải các gói phụ thuộc
`ash
npm install
`

### 2. Khởi động Server
`ash
# Chế độ code (tự động reload)
npm run start:dev

# Build và chạy Production
npm run build
npm run start:prod
`

## 📜 Cấu trúc thư mục
- \src/auth\: Logic xác thực JWT.
- \src/user\: API lấy/sửa thông tin người dùng và sổ địa chỉ.
- \src/products\ / \src/categories\: Xử lý dữ liệu sản phẩm, phân loại.
- \src/cart\: Các nghiệp vụ về quản lý giỏ hàng tạm.
- \src/orders\: Khởi tạo và cập nhật trạng thái đơn hàng.
- \src/payment\: Dịch vụ tích hợp VNPay.
- \src/favorites\: Thêm sản phẩm yêu thích (Wishlist).
- \src/provinces\: Đọc dữ liệu local JSON phục vụ tra cứu Tỉnh/Thành.
