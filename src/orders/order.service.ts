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
        item.product && dto.productIds.includes(item.product.id)
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
}