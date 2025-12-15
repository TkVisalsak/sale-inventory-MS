import pool from "../lib/db.js";
import { logUserActivity } from "./auth.controller.js";


// Dashboard

export const total_products = async (req, res) => {
    try {
        const result = await pool.query("SELECT COUNT(*) FROM products");
        res.status(200).json({ total: parseInt(result.rows[0].count, 10) });
    } catch (err) {
        console.error("Error fetching total products:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const inventory_value = async (req, res) => {
    try {   
        const buy_in_result = await pool.query(`
            SELECT SUM(pb.price * b.quantity) AS total_value
            FROM products p
            JOIN batches b ON p.id = b.product_id
        `);
        res.status(200).json({ total_value: parseFloat(result.rows[0].total_value) });
    } catch (err) {
        console.error("Error fetching inventory value:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export const profit_margin = async (req, res) => {
}

export const countProductsByCategory = async (req, res) => {
  const { categoryName } = req.query;

  try {
    const query = `
        SELECT c.name AS category, COUNT(*) AS total
        FROM products p
        JOIN categories c ON p.category_id = c.id
        GROUP BY c.name
        ORDER BY c.name;

    `;

    const result = await pool.query(query, [categoryName]);
    res.status(200).json({ total: parseInt(result.rows[0].total, 10) });
  } catch (err) {
    console.error("Error counting products by category:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
