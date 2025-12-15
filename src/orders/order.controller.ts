import { Controller, Post, Get, Body, Req, Query, Res, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthGuard } from '@nestjs/passport';
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // API 1: Tạo đơn hàng & Lấy link thanh toán
  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async createOrder(@Req() req, @Body() dto: CreateOrderDto) {
    // Giả sử lấy userId từ JWT token trong request
    const userId = req.user.userId; 
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    return this.orderService.createOrderAndGetPaymentUrl(userId, ipAddr, dto);
  }

  // API 2: VNPay IPN (Instant Payment Notification)
  // Đây là API VNPay sẽ gọi ngầm (Server-to-Server) để báo kết quả
  @Get('vnpay_ipn')
  async vnpayIpn(@Query() query) {
    return this.orderService.handleVnpayIpn(query);
  }
    
  // API 3: VNPay Return URL (Frontend redirect về đây)
  // Chỉ dùng để hiển thị UI "Thanh toán thành công/thất bại" cho user
  @Get('vnpay_return')
  async vnpayReturn(@Query() query) {
      // Logic kiểm tra và hiển thị giao diện tương ứng
      // (Thực tế nên redirect về trang Frontend React/Angular)
      return { message: 'Giao dịch hoàn tất', data: query };
  }
}