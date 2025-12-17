
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { User } from './entities/user.entity';
import { ShippingAddress } from './entities/shipping-address.entity.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ShippingAddress)
    private shippingAddressRepository: Repository<ShippingAddress>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // create-user.dto.ts chỉ cần có email và password
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['shippingAddresses'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } }) ;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mergedUser = this.userRepository.merge(user, {
      ...updateUserDto,
      ...(updateUserDto.password
        ? { password: await bcrypt.hash(updateUserDto.password, 10) }
        : {}),
    });

    return this.userRepository.save(mergedUser);
  }

  async listShippingAddresses(userId: number): Promise<ShippingAddress[]> {
    return this.shippingAddressRepository.find({ where: { user: { id: userId } } });
  }

  async addShippingAddress(userId: number, dto: CreateShippingAddressDto): Promise<ShippingAddress> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['shippingAddresses'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.isDefault) {
      await this.shippingAddressRepository.update({ user: { id: userId } }, { isDefault: false });
    }

    const address = this.shippingAddressRepository.create({
      ...dto,
      isDefault: dto.isDefault ?? user.shippingAddresses.length === 0,
      user,
    });

    return this.shippingAddressRepository.save(address);
  }

  async updateShippingAddress(userId: number, addressId: number, dto: UpdateShippingAddressDto): Promise<ShippingAddress> {
    const address = await this.shippingAddressRepository.findOne({ where: { id: addressId, user: { id: userId } } });
    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    if (dto.isDefault) {
      await this.shippingAddressRepository.update({ user: { id: userId } }, { isDefault: false });
    }

    const merged = this.shippingAddressRepository.merge(address, dto);
    return this.shippingAddressRepository.save(merged);
  }

  async removeShippingAddress(userId: number, addressId: number): Promise<void> {
    const address = await this.shippingAddressRepository.findOne({ where: { id: addressId, user: { id: userId } } });
    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }
    await this.shippingAddressRepository.remove(address);

    if (address.isDefault) {
      const nextAddress = await this.shippingAddressRepository.findOne({ where: { user: { id: userId } } });
      if (nextAddress) {
        await this.shippingAddressRepository.update({ id: nextAddress.id }, { isDefault: true });
      }
    }
  }

}

