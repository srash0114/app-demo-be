import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm'; // Nhớ import In
import { Cart } from 'src/cart/entities/cart.entity';
import { CartItem } from 'src/cart/entities/cart-item.entity'; // Import CartItem entity
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductsService } from 'src/products/products.service';
import { VnpayService } from 'src/payment/vnpay.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem) // Inject Repository này để xóa item
    private cartItemRepository: Repository<CartItem>,
    private readonly vnpayService: VnpayService,
  ) {}

  // --- 1. TẠO ORDER & URL THANH TOÁN ---
  async createOrderAndGetPaymentUrl(
    userId: number,
    ipAddr: string,
    dto: CreateOrderDto
  ): Promise<{ orderId: number, paymentUrl: string }> {
    
    // A. Lấy giỏ hàng của user
    const cart = await this.cartRepository.findOne({
      where: { userId: String(userId) },
      relations: ['items', 'items.product'],
    });

    if (!cart || !cart.items.length) {
      throw new BadRequestException('Giỏ hàng trống.');
    }

    // B. Lọc các sản phẩm user chọn mua (dựa trên dto.productIds)
    const selectedItems = cart.items.filter(item =>
        item.product && dto.productIds.includes(item.id)
    );

    if (selectedItems.length === 0) {
      throw new BadRequestException('Không có sản phẩm nào hợp lệ được chọn.');
    }

    // C. Tính tổng tiền & Tạo OrderItems
    let totalPrice = 0;
    const orderItems: OrderItem[] = [];

    for (const item of selectedItems) {
      const itemPrice = parseFloat(item.product.price) * item.quantity;
      totalPrice += itemPrice;

      const orderItem = this.orderItemRepository.create({
        quantity: item.quantity,
        price: item.product.price,
        product: item.product,
      });
      orderItems.push(orderItem);
    }

    // D. Lưu Order vào DB với trạng thái PENDING
    const newOrder = this.orderRepository.create({
      totalPrice: totalPrice.toFixed(0),
      status: 'PENDING', // Chưa thanh toán
      user: { id: userId } as any,
      items: orderItems, // TypeORM cascade sẽ lưu luôn OrderItem
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
    });

    const savedOrder = await this.orderRepository.save(newOrder);

    // E. Tạo URL VNPay
    // Lưu ý: Lúc này chưa xóa CartItem, chờ VNPay báo về thành công mới xóa
    const paymentUrl = this.vnpayService.createPaymentUrl({
      amount: totalPrice,
      orderId: savedOrder.id,
      orderDescription: `Thanh toan don hang #${savedOrder.id}`,
      ipAddr: ipAddr,
    });

    return { 
        orderId: savedOrder.id,
        paymentUrl: paymentUrl 
    };
  }

  // --- 2. XỬ LÝ KHI VNPAY GỌI VỀ (IPN) ---
  // Hàm này sẽ được gọi bởi Controller khi nhận request từ VNPay
  async handleVnpayIpn(vnpayParams: any) {
    // 1. Kiểm tra Checksum (quan trọng để bảo mật)
    const isValidSignature = this.vnpayService.verifyReturnUrl(vnpayParams);
    if (!isValidSignature) {
        return { RspCode: '97', Message: 'Invalid Signature' };
    }

    const orderId = vnpayParams['vnp_TxnRef'];
    const rspCode = vnpayParams['vnp_ResponseCode']; // '00' là thành công

    // 2. Tìm đơn hàng
    const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'items', 'items.product']
    });

    if (!order) {
        return { RspCode: '01', Message: 'Order not found' };
    }

    // 3. Kiểm tra nếu đơn hàng đã xử lý rồi thì bỏ qua
    if (order.status === 'COMPLETED') {
        return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // 4. Xử lý Logic khi thanh toán thành công
    if (rspCode === '00') {
        // A. Cập nhật trạng thái đơn hàng
        order.status = 'COMPLETED';
        await this.orderRepository.save(order);

        // B. XÓA SẢN PHẨM KHỎI GIỎ HÀNG (Logic bạn yêu cầu)
        // Tìm giỏ hàng của user
        const cart = await this.cartRepository.findOne({
            where: { userId: order.user.id.toString() }, // map userId cho đúng kiểu dữ liệu
            relations: ['items', 'items.product']
        });

        if (cart && cart.items.length > 0) {
            // Lấy danh sách Product ID đã mua trong đơn hàng
            const purchasedProductIds = order.items.map(oi => oi.product.id);

            // Tìm các CartItem tương ứng với sản phẩm đã mua
            const cartItemsToDelete = cart.items
                .filter(ci => purchasedProductIds.includes(ci.product.id))
                .map(ci => ci.id);

            // Xóa các CartItem này
            if (cartItemsToDelete.length > 0) {
                await this.cartItemRepository.delete({
                    id: In(cartItemsToDelete)
                });
            }
        }
        
        return { RspCode: '00', Message: 'Success' };
    } else {
        // Thanh toán thất bại -> Cập nhật trạng thái CANCELLED hoặc FAILED
        order.status = 'CANCELLED';
        await this.orderRepository.save(order);
        return { RspCode: '00', Message: 'Success' }; // Vẫn trả về 00 để VNPay biết mình đã nhận tin
    }
  }

  // --- 3. LẤY DANH SÁCH ĐƠN HÀNG CỦA USER ---
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  // --- 4. LẤY CHI TIẾT 1 ĐƠN HÀNG ---
  async getOrderById(userId: number, orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại.');
    }

    return order;
  }

  // --- 5. XỬ LÝ KHI USER REDIRECT VỀ TỪ VNPAY ---
  async handleVnpayReturn(vnpayParams: any): Promise<{
    success: boolean;
    orderId: string;
    amount: number;
    message: string;
    transactionNo?: string;
  }> {
    const orderId = vnpayParams['vnp_TxnRef'];
    const rspCode = vnpayParams['vnp_ResponseCode'];
    const amount = parseInt(vnpayParams['vnp_Amount']) / 100;
    const transactionNo = vnpayParams['vnp_TransactionNo'];

    // Tìm đơn hàng
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product']
    });

    if (!order) {
      return {
        success: false,
        orderId,
        amount,
        message: 'Đơn hàng không tồn tại'
      };
    }

    // Nếu đơn hàng chưa được xử lý và thanh toán thành công
    if (order.status === 'PENDING' && rspCode === '00') {
      order.status = 'COMPLETED';
      await this.orderRepository.save(order);

      // Xóa sản phẩm khỏi giỏ hàng
      const cart = await this.cartRepository.findOne({
        where: { userId: order.user.id.toString() },
        relations: ['items', 'items.product']
      });

      if (cart && cart.items.length > 0) {
        const purchasedProductIds = order.items.map(oi => oi.product.id);
        const cartItemsToDelete = cart.items
          .filter(ci => purchasedProductIds.includes(ci.product.id))
          .map(ci => ci.id);

        if (cartItemsToDelete.length > 0) {
          await this.cartItemRepository.delete({ id: In(cartItemsToDelete) });
        }
      }

      return {
        success: true,
        orderId,
        amount,
        transactionNo,
        message: 'Thanh toán thành công'
      };
    }

    // Đơn hàng đã xử lý trước đó
    if (order.status === 'COMPLETED') {
      return {
        success: true,
        orderId,
        amount,
        transactionNo,
        message: 'Đơn hàng đã được thanh toán'
      };
    }

    // Thanh toán thất bại
    if (rspCode !== '00') {
      order.status = 'CANCELLED';
      await this.orderRepository.save(order);
    }

    return {
      success: false,
      orderId,
      amount,
      message: 'Thanh toán thất bại'
    };
  }

  // --- 6. HỦY ĐƠN HÀNG KHI ĐANG PENDING ---
  async cancelOrder(userId: number, orderId: number): Promise<{ success: boolean; message: string }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại.');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `Không thể hủy đơn hàng. Trạng thái hiện tại: ${order.status}`
      );
    }

    order.status = 'CANCELLED';
    await this.orderRepository.save(order);

    return {
      success: true,
      message: `Đơn hàng #${orderId} đã được hủy thành công.`
    };
  }
}