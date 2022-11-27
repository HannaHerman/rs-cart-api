import { Injectable } from '@nestjs/common';
import { Client } from 'pg';

import { v4 } from 'uuid';

import { Cart } from '../models';

const CART_ID = "1eb136f4-dda4-4b89-9b27-0ae548237b84"; // TODO: remove stub and add auth

@Injectable()
export class CartService {
  private userCarts: Record<string, Cart> = {};

  async findByUserId(userId: string): Promise<Cart> {
    const dbClient = await this.getClient();
    const itemsQuery = {
      text: `SELECT * FROM cart_items WHERE cart_id = $1`,
      values: [CART_ID],
    };

    const items = await dbClient.query(itemsQuery);

    return {
      id: CART_ID,
      items: items?.rows,
    };
  }

  createByUserId(userId: string) {
    const id = v4(v4());
    const userCart = {
      id,
      items: [],
    };

    this.userCarts[userId] = userCart;

    return userCart;
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, body: any): Promise<Cart> {
    const dbClient = await this.getClient();
    const { product } = body;
    const findQuery = {
      text: 'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      values: [CART_ID, body?.product?.product_id],
    };

    const item = await dbClient.query(findQuery);

    const updateQuery = {
      text: "",
      values: [CART_ID, product?.product_id, product?.count],
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

    return {
      id: CART_ID,
      items: updatedCart.rows,
    };
  }

  removeByUserId(userId): void {
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
