import { Controller, Get, Delete, Put, Body, Req, Post, UseGuards, HttpStatus, Query } from '@nestjs/common';

// import { BasicAuthGuard, JwtAuthGuard } from '../auth';
import { OrderService } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private orderService: OrderService
  ) { }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Query() query, @Req() req: AppRequest) {
    const cartId = query?.cartId;
    const cart = await this.cartService.findOrCreateByUserId(getUserIdFromRequest(req), cartId);

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {
        cart,
        // total: calculateCartTotal(cart)
      },
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(@Query() query, @Req() req: AppRequest, @Body() body) { // TODO: validate body payload...
    const cartId = query?.cartId;
    const cart = await this.cartService.updateByUserId(getUserIdFromRequest(req), body, cartId);

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: {
        cart,
        // total: calculateCartTotal(cart),
      }
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Delete()
  async clearUserCart(@Query() query, @Req() req: AppRequest) {
    const cartId = query?.cartId;
    await this.cartService.removeByUserId(getUserIdFromRequest(req), cartId);

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
    }
  }

  // @UseGuards(JwtAuthGuard)
  // @UseGuards(BasicAuthGuard)
  @Post('checkout')
  async checkout(@Query() query, @Req() req: AppRequest, @Body() body) {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.findByUserId(userId, query.cartId);

    if (!(cart && cart.items.length)) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode

      return {
        statusCode,
        message: 'Cart is empty',
      }
    }

    const { id: cartId, items } = cart;
    const total = calculateCartTotal(cart);
    const order = this.orderService.create({
      ...body, // TODO: validate and pick only necessary data
      userId,
      cartId,
      items,
      total,
    });
    this.cartService.removeByUserId(userId, cartId);

    return {
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: { order }
    }
  }
}
