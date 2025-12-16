// src/payment/vnpay.service.ts
import { Injectable } from '@nestjs/common';
import * as querystring from 'qs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

// Hàm sortObject theo chuẩn VNPay - encode cả key và value
function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const str: string[] = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }

  str.sort();

  for (let i = 0; i < str.length; i++) {
    const key = str[i];
    // Decode key để lấy giá trị gốc từ obj, sau đó encode value
    const originalKey = decodeURIComponent(key);
    sorted[key] = encodeURIComponent(String(obj[originalKey])).replace(/%20/g, '+');
  }

  return sorted;
}

@Injectable()
export class VnpayService {
  private vnp_TmnCode: string;
  private vnp_HashSecret: string;
  private vnp_Url: string;
  private vnp_ReturnUrl: string;

  constructor(private configService: ConfigService) {
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    if (!tmnCode) {
        throw new Error('Missing VNPAY_TMN_CODE in environment configuration.');
    }
    this.vnp_TmnCode = tmnCode;

    // Lặp lại cho các biến còn lại: HASH_SECRET, URL, RETURN_URL
    this.vnp_HashSecret = this.configService.get<string>('VNPAY_HASH_SECRET')!;
    this.vnp_Url = this.configService.get<string>('VNPAY_URL')!;
    this.vnp_ReturnUrl = this.configService.get<string>('VNPAY_RETURN_URL')!;
  }

  createPaymentUrl(data: { amount: number; orderId: number; orderDescription: string; ipAddr: string }): string {
    const date = new Date();

    // Helper function để format date theo múi giờ Việt Nam (GMT+7)
    const formatVnpayDate = (d: Date): string => {
      const year = d.getFullYear();
      const month = ('0' + (d.getMonth() + 1)).slice(-2);
      const day = ('0' + d.getDate()).slice(-2);
      const hours = ('0' + d.getHours()).slice(-2);
      const minutes = ('0' + d.getMinutes()).slice(-2);
      const seconds = ('0' + d.getSeconds()).slice(-2);
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };

    const createDate = formatVnpayDate(date);
    const expireDate = formatVnpayDate(new Date(date.getTime() + 15 * 60000)); // +15 phút

    const orderId = data.orderId;

    let vnp_Params: Record<string, string | number> = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId; // Mã đơn hàng của bạn
    vnp_Params['vnp_OrderInfo'] = data.orderDescription;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = data.amount * 100; // Số tiền phải nhân 100 (đơn vị: VNĐ)
    vnp_Params['vnp_ReturnUrl'] = this.vnp_ReturnUrl;
    vnp_Params['vnp_IpAddr'] = data.ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;

    vnp_Params = sortObject(vnp_Params);

    // Tạo signData KHÔNG encode để hash
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = vnp_SecureHash;

    // Trả về URL thanh toán - KHÔNG encode vì đã encode trong sortObject
    return this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
  }

  /**
   * Hàm xác thực chữ ký (Checksum) từ VNPay gửi về
   * Dùng cho cả Return URL và IPN
   */
  verifyReturnUrl(vnp_Params: any): boolean {
    const secureHash = vnp_Params['vnp_SecureHash'];

    // 1. Xóa các tham số hash và hashType để chuẩn bị tính toán lại
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // 2. Sắp xếp lại tham số theo alphabet (BẮT BUỘC theo chuẩn VNPay)
    vnp_Params = sortObject(vnp_Params);

    // 3. Tạo chuỗi dữ liệu cần hash (KHÔNG encode, giống lúc tạo URL)
    const signData = querystring.stringify(vnp_Params, { encode: false });

    // 4. Tính toán hash bằng thuật toán SHA512
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // 5. So sánh hash tính được với hash VNPay gửi về
    return secureHash === signed;
  }

  getHashSecret(): string {
        return this.vnp_HashSecret;
  }
}