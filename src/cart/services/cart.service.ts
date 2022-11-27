import { Injectable } from '@nestjs/common';
import { Client } from 'pg';

import { Cart } from '../models';

@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};

  async findByUserId(userId: string, cartId: string): Promise<Cart> {
    const dbClient = await this.getClient();
    const cartQuery = {
      text: `SELECT * FROM carts WHERE id = $1`,
      values: [cartId],
    };
    const cart = await dbClient.query(cartQuery);

    if(!cart.rows?.length) {
      return
    }

    const itemsQuery = {
      text: `SELECT * FROM cart_items WHERE cart_id = $1`,
      values: [cartId],
    };

    const items = await dbClient.query(itemsQuery);
    dbClient.end();

    return {
      id: cartId,
      items: items?.rows,
    };
  }

  async createByUserId(userId: string): Promise<Cart> {
    const dbClient = await this.getClient();
    const createDate = new Date().toISOString().split("T")[0];
    const query = `
        insert into carts (created_at, updated_at) values
        ('${createDate}', '${createDate}')
        returning id;
    `;
    const { rows } = await dbClient.query(query);

    return {
      id: rows[0].id,
      items: [],
    };
  }

  async findOrCreateByUserId(userId: string, cartId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId, cartId);

    if (userCart) {
      return userCart;
    }

    return await this.createByUserId(userId);
  }

  async updateByUserId(userId: string, body: any, cartId: string): Promise<Cart> {
    const dbClient = await this.getClient();
    const { product } = body;
    const findQuery = {
      text: 'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      values: [cartId, body?.product?.product_id],
    };

    const item = await dbClient.query(findQuery);

    const updateQuery = {
      text: "",
      values: [cartId, product?.product_id, product?.count],
    };

    if (item.rows.length) {
      updateQuery.text = `UPDATE cart_items
      SET count = $3
      WHERE cart_id = $1 AND product_id = $2
      RETURNING *`;
    } else {
      updateQuery.text = `insert into cart_items (cart_id, product_id, count) values
      ($1, $2, $3)`
    }

    const updatedCart = await dbClient.query(updateQuery);
    dbClient.end();

    return {
      id: cartId,
      items: updatedCart.rows,
    };
  }

  async removeByUserId(userId: string, cartId: string): Promise<void> {
    const dbClient = await this.getClient();
    const queryCartItems = `delete from cart_items where cart_items.cart_id='${cartId}';`;
    const queryCarts = `delete from carts where carts.id='${cartId}';`;

    await Promise.all([
      await dbClient.query(queryCartItems),
      await dbClient.query(queryCarts)
    ]);

    dbClient.end();
    this.userCarts[userId] = null;
  }

  async getClient() {
    const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;
    const dbOptions = {
      host: PG_HOST,
      port: PG_PORT,
      database: PG_DATABASE,
      user: PG_USERNAME,
      password: PG_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000,
    };
    const client = new Client(dbOptions);
    await client.connect();

    return client;
  }
}
