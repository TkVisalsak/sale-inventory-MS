import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import pool from './lib/db.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

async function findProduct(query) {
  const sql = `
    SELECT
      pb.id,
      p.name AS product,
      pb.batch_number,
      TO_CHAR(pb.expiration_date, 'YYYY-MM-DD') AS expiration,
      pb.buy_price,
      pb.market_price,
      pb.current_quantity AS stock,
      pb.warehouse_location AS location,
      CASE
        WHEN pb.expiration_date IS NULL THEN 'Unknown'
        WHEN pb.expiration_date < CURRENT_DATE THEN 'Expired'
        WHEN pb.current_quantity < 200 THEN 'Low Stock'
        WHEN pb.expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring'
        ELSE 'Good'
      END AS status
    FROM product_batches pb
    JOIN products p ON pb.product_id = p.id
    WHERE p.name ILIKE $1 OR CAST(p.id AS TEXT) = $2
    ORDER BY pb.expiration_date NULLS LAST, pb.id ASC
    LIMIT 1
  `;
  const values = [`%${query}%`, query];
  const res = await pool.query(sql, values);
  return res.rows[0];
}


bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) {
    return bot.sendMessage(chatId, '📦 Please send a product name or ID to search.');
  }

  try {
    const product = await findProduct(text);

    if (product) {
      const reply = `*Product Information:*\n` +
        ` *ID:* ${product.id}\n` +
        ` *Name:* ${product.product}\n` +
        ` *Batch:* ${product.batch_number}\n` +
        ` *Expiration:* ${product.expiration}\n` +
        ` *Buy Price:* $${product.buy_price}\n` +
        ` *Market Price:* $${product.market_price}\n` +
        ` *Stock:* ${product.stock}\n` +
        ` *Location:* ${product.location}\n` +
        ` *Status:* ${product.status}`;

      await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, '❌ Product not found. Please check the name or ID.');
    }
  } catch (err) {
    console.error('❌ Error querying product:', err);
    bot.sendMessage(chatId, '⚠️ Error fetching product info. Please try again later.');
  }
});
