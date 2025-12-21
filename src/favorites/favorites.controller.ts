import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  addFavorite(@Request() req, @Body() addFavoriteDto: AddFavoriteDto) {
    return this.favoritesService.addFavorite(req.user.userId, addFavoriteDto.productId);
  }

  @Delete(':productId')
  removeFavorite(@Request() req, @Param('productId') productId: string) {
    return this.favoritesService.removeFavorite(req.user.userId, +productId);
  }

  @Get()
  getUserFavorites(@Request() req) {
    return this.favoritesService.getUserFavorites(req.user.userId);
  }
}
