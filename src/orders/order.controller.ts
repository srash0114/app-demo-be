import { Controller, Post, Get, Delete, Body, Req, Query, Res, UseGuards, Param, ParseIntPipe, Header } from '@nestjs/common';
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

  // API 2: Thống kê đơn hàng (public hoặc có thể thêm guard admin)
  @Get('statistics')
  async getStatistics() {
    return this.orderService.getOrderStatistics();
  }

  // API 3: VNPay IPN (Instant Payment Notification)
  // Đây là API VNPay sẽ gọi ngầm (Server-to-Server) để báo kết quả
  @Get('vnpay_ipn')
  async vnpayIpn(@Query() query) {
    return this.orderService.handleVnpayIpn(query);
  }
    
  // API 3: VNPay Return URL (Frontend redirect về đây)
  // Hiển thị trang HTML thông báo kết quả thanh toán
  @Get('vnpay_return')
  @Header('Content-Type', 'text/html')
  async vnpayReturn(@Query() query, @Res() res) {
    const result = await this.orderService.handleVnpayReturn(query);

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${result.success ? 'Thanh toán thành công' : 'Thanh toán thất bại'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, ${result.success ? '#667eea 0%, #764ba2 100%' : '#ff6b6b 0%, #c92a2a 100%'});
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 450px;
            width: 90%;
        }
        .icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
            ${result.success
              ? 'background: linear-gradient(135deg, #11998e, #38ef7d); color: white;'
              : 'background: linear-gradient(135deg, #ff6b6b, #c92a2a); color: white;'}
        }
        h1 {
            color: ${result.success ? '#11998e' : '#c92a2a'};
            margin-bottom: 10px;
            font-size: 24px;
        }
        .message {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: left;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .details-row:last-child { border-bottom: none; }
        .details-label { color: #888; }
        .details-value { font-weight: 600; color: #333; }
        .amount { color: ${result.success ? '#11998e' : '#c92a2a'}; font-size: 18px; }
        .btn {
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            text-decoration: none;
            border-radius: 30px;
            font-weight: 600;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">${result.success ? '✓' : '✕'}</div>
        <h1>${result.success ? 'Thanh toán thành công!' : 'Thanh toán thất bại!'}</h1>
        <p class="message">${result.message}</p>

        <div class="details">
            <div class="details-row">
                <span class="details-label">Mã đơn hàng</span>
                <span class="details-value">#${result.orderId}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Số tiền</span>
                <span class="details-value amount">${result.amount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            ${result.transactionNo ? `
            <div class="details-row">
                <span class="details-label">Mã giao dịch</span>
                <span class="details-value">${result.transactionNo}</span>
            </div>
            ` : ''}
        </div>

        // <a href="/" class="btn">Về trang chủ</a>
    </div>
</body>
</html>
    `;

    res.send(html);
  }

  // API 4: Lấy danh sách đơn hàng của user
  @Get('my-orders')
  @UseGuards(AuthGuard('jwt'))
  async getMyOrders(@Req() req) {
    const userId = req.user.userId;
    return this.orderService.getOrdersByUser(userId);
  }

  // API 5: Lấy chi tiết 1 đơn hàng
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getOrderDetail(@Req() req, @Param('id', ParseIntPipe) orderId: number) {
    const userId = req.user.userId;
    return this.orderService.getOrderById(userId, orderId);
  }

  // API 6: Hủy đơn hàng (chỉ khi đang PENDING)
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async cancelOrder(@Req() req, @Param('id', ParseIntPipe) orderId: number) {
    const userId = req.user.userId;
    return this.orderService.cancelOrder(userId, orderId);
  }

  // API 7: Lấy lại link thanh toán (nếu còn hạn) hoặc tạo mới
  @Post(':id/payment')
  @UseGuards(AuthGuard('jwt'))
  async getPaymentUrl(@Req() req, @Param('id', ParseIntPipe) orderId: number) {
    const userId = req.user.userId;
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    return this.orderService.getPaymentUrl(userId, orderId, ipAddr);
  }
}