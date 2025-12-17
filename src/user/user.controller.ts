import { Controller, Get, Post, Body, Patch, UseGuards, Req, Param, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  findMe(@Req() req: Request & { user: { userId: number } }) {
    return this.userService.findOne(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  update(@Req() req: Request & { user: { userId: number } }, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(req.user.userId, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/addresses')
  listAddresses(@Req() req: Request & { user: { userId: number } }) {
    return this.userService.listShippingAddresses(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/addresses')
  addAddress(@Req() req: Request & { user: { userId: number } }, @Body() body: CreateShippingAddressDto) {
    return this.userService.addShippingAddress(req.user.userId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/addresses/:addressId')
  updateAddress(
    @Req() req: Request & { user: { userId: number } },
    @Param('addressId') addressId: string,
    @Body() body: UpdateShippingAddressDto,
  ) {
    return this.userService.updateShippingAddress(req.user.userId, +addressId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me/addresses/:addressId')
  removeAddress(@Req() req: Request & { user: { userId: number } }, @Param('addressId') addressId: string) {
    return this.userService.removeShippingAddress(req.user.userId, +addressId);
  }
}
