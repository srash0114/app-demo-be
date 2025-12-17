export class CreateShippingAddressDto {
  address: string;
  recipientName?: string;
  phone?: string;
  isDefault?: boolean;
}
