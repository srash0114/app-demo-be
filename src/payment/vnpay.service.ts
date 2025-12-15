// src/payment/vnpay.service.ts
import { Injectable } from '@nestjs/common';
import * as querystring from 'qs';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

// Giả định hàm sortObject() sắp xếp các key theo Alphabet
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
};

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
    const createDate = date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2) + 
                       ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2) + ('0' + date.getSeconds()).slice(-2);
    
    const orderId = data.orderId;

    let vnp_Params = {};
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
    vnp_Params['vnp_ExpireDate'] = (new Date(date.getTime() + 15*60000)).toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
    
    vnp_Params = sortObject(vnp_Params);
    
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const vnp_SecureHash = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
    
    vnp_Params['vnp_SecureHash'] = vnp_SecureHash;

    // Trả về URL thanh toán đầy đủ
    return this.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
  }

  /**
   * Hàm xác thực chữ ký (Checksum) từ VNPay gửi về
   * Dùng cho cả Return URL và IPN
   */
  verifyReturnUrl(vnp_Params: any): boolean {
    let secureHash = vnp_Params['vnp_SecureHash'];

    // 1. Xóa các tham số hash và hashType để chuẩn bị tính toán lại
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // 2. Sắp xếp lại tham số theo alphabet (BẮT BUỘC theo chuẩn VNPay)
    vnp_Params = this.sortObject(vnp_Params);

    // 3. Tạo chuỗi dữ liệu cần hash
    // Lưu ý: Dùng querystring.stringify hoặc custom logic như dưới đây
    const signData = querystring.stringify(vnp_Params, { encode: false });
    
    // 4. Tính toán hash bằng thuật toán SHA512 (hoặc SHA256 tùy config VNPay của em)
    // Đa số Sandbox VNPay hiện tại dùng SHA512
    const hmac = crypto.createHmac("sha512", this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 

    // 5. So sánh hash tính được với hash VNPay gửi về
    return secureHash === signed;
  }

  /**
   * Hàm sắp xếp object theo key (A-Z) để phục vụ việc tạo chữ ký (Checksum)
   */
  private sortObject(obj: any): any {
    const sorted = {};
    const str: string[] = []; // KHẮC PHỤC LỖI: Khai báo rõ đây là mảng string
    let key;
    
    for (key in obj) {
      // Dùng Object.prototype.hasOwnProperty.call an toàn hơn obj.hasOwnProperty
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    
    // Sắp xếp các key theo bảng chữ cái
    str.sort();
    
    for (let i = 0; i < str.length; i++) {
        // Lấy key đã sort
        const currentKey = str[i];
        // Gán vào object mới, đồng thời mã hóa value
        sorted[currentKey] = encodeURIComponent(obj[currentKey]).replace(/%20/g, "+");
    }
    
    return sorted;
  }

  getHashSecret(): string {
        return this.vnp_HashSecret;
  }
}