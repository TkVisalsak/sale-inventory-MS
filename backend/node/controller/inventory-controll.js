import pool from "../lib/db.js";
import { logUserActivity } from "./auth.controller.js";

//Dashboard

//Batches
export const getbatches = async (req, res) => {

  try {
    const result = await pool.query(`
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
      ORDER BY pb.id DESC
    `)

    res.status(200).json(result.rows)
  } catch (err) {
    console.error("❌ Fetch failed:", err.message)
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
};
export const addbatch = async (req, res) => {
  const b = req.body;
  const userId = req.user?.id;
  if (!b || !b.product_id || !b.batch_number) {
    return res.status(400).json({ error: 'No batch provided or missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO product_batches 
        (product_id, batch_number, expiration_date, current_quantity, buy_price, market_price, warehouse_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [b.product_id, b.batch_number, b.expiration_date, b.current_quantity, b.buy_price, b.market_price, b.warehouse_location]
    );
    const batchId = result.rows[0].id;

    await logUserActivity({
      userId,
      activityType: "CREATE",
      description: `Created new batch for product_id=${b.product_id}, quantity=${b.current_quantity}`,
      entityType: "Batch",
      entityId: batchId,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(201).json({ message: 'Batch inserted', id: result.rows[0].id });
  } catch (err) {
    console.error('❌ Insert failed:', err.message);
    res.status(500).json({ error: 'Insert failed', details: err.message });
  }
};
export const getbatchesbyid = async (req, res) => {
  const { product_id } = req.query;

  if (!product_id) {
    return res.status(400).json({ error: "Missing product_id" });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        pb.id AS batch_id,
        p.name AS product_name,
        TO_CHAR(pb.expiration_date, 'YYYY-MM-DD') AS expiration_date,
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
      WHERE pb.product_id = $1
      ORDER BY pb.expiration_date NULLS LAST, pb.id ASC
      `,
      [product_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch product batches:", err.message);
    res.status(500).json({ error: "Failed to fetch product batches", details: err.message });
  }
};

//=======================================================


//cutomers
export const addCustomer = async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    customer_type,
    credit_limit
  } = req.body;

  // Assuming userId comes from authenticated request (adjust as needed)
  const userId = req.user?.id;

  try {
    const result = await pool.query(
      `
      INSERT INTO customers (name, email, phone, address, customer_type, credit_limit)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [name, email, phone, address, customer_type, credit_limit]
    );

    const newCustomer = result.rows[0];
    
    // Log user activity with correct details
    await logUserActivity({
      userId,
      activityType: "CREATE",
      description: `Added new customer: name=${newCustomer.name}`,
      entityType: "customer",
      entityId: newCustomer.id,  // Use the actual inserted customer's id
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    console.log("✅ Customer inserted:", newCustomer);
    res.status(201).json(newCustomer);

  } catch (err) {
    console.error("❌ Failed to insert customer:", err.message);
    res.status(500).json({ error: "Failed to insert customer", details: err.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM customers ORDER BY id DESC`
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch customers:", err.message);
    res.status(500).json({ error: "Failed to fetch customers", details: err.message });
  }
};
export const getAllCustomers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.customer_type,
        c.credit_limit,
        cb.outstanding,
        (c.credit_limit - COALESCE(cb.outstanding, 0)) AS available_credit,
        CASE 
          WHEN cb.outstanding IS NULL OR (c.credit_limit - cb.outstanding) >= 0 THEN 'Good'
          ELSE 'Overdue'
        END AS status
      FROM customers c
      LEFT JOIN customer_balances cb ON cb.customer_id = c.id
      ORDER BY c.name
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch customers:", err.message);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};
//=======================================================


//category
export const addcategory = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Missing name or description' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
      [name, description]
    );

    res.status(201).json({
      message: 'Category inserted',
      inserted: {
        id: result.rows[0].id,
        name,
        description
      }
    });
  } catch (err) {
    console.error('❌ Insert failed:', err.message);
    res.status(500).json({ error: 'Insert failed', details: err.message });
  }
};
export const getcategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
};
export const getProductsByCategory = async (req, res) => {
  const { categoryId } = req.body;

  if (!categoryId) {
    return res.status(400).json({ error: "categoryId is required" });
  }

  try {
    const query = `
      SELECT id, name
      FROM products
      WHERE category_id = $1
      ORDER BY name ASC
    `;

    const result = await pool.query(query, [categoryId]); // Use query(), not execute()

    res.status(200).json(result.rows); // pg returns result.rows with data
  } catch (err) {
    console.error("❌ Error fetching products by category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const editProduct = async (req, res) => {
  const { id, supplier_id, category_id, name, description, availability, unit, barcode } = req.body;

  // Basic validation
  if (!id || !name || !barcode || !supplier_id || !category_id || !unit) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET supplier_id = $1,
           category_id = $2,
           name = $3,
           description = $4,
           availability = $5,
           unit = $6,
           barcode = $7
       WHERE id = $8
       RETURNING *`,
      [supplier_id, category_id, name, description || "", availability, unit, barcode, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ message: "Product updated", product: result.rows[0] });

  } catch (err) {
    // Handle unique barcode conflict
    if (err.code === '23505' && err.constraint === 'products_barcode_key') {
      return res.status(409).json({ error: "Barcode already exists" });
    }

    console.error("❌ Update failed:", err.message);
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};
export const editCategory = async (req, res) => {
  const { id, name, description } = req.body;

  // Basic validation
  if (!id || !name) {
    return res.status(400).json({ error: "Missing required fields: id and name are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE categories
       SET name = $1,
           description = $2
       WHERE id = $3
       RETURNING *`,
      [name, description || "", id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category updated", category: result.rows[0] });

  } catch (err) {
    // Handle possible unique constraint violation if you add it later
    console.error("❌ Update failed:", err.message);
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};

//=======================================================


//products
export const addproduct = async (req, res) => {
  const products = req.body.products;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'No products provided' });
  }

  try {
    const inserted = [];

    for (const p of products) {
      const { supplier_id, category_id, name, description, availability, unit, barcode } = p;

      const result = await pool.query(
        'INSERT INTO products (supplier_id, category_id, name, description, availability, unit, barcode) VALUES ($1, $2, $3, $4, $5, $6 ,$7) RETURNING id',
        [supplier_id, category_id, name, description, availability, unit, barcode]
      );

      inserted.push({
        id: result.rows[0].id,
        supplier_id, category_id, name, description, availability, unit, barcode
      });
    }

    res.status(201).json({ message: 'product inserted', inserted });
  } catch (err) {
    console.error('❌ Insert failed:', err.message);
    res.status(500).json({ error: 'Insert failed', details: err.message });
  }
};
export const getproducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.barcode,
        s.name AS supplier,
        c.name AS category,
        p.unit,
        p.availability
      FROM products p
      LEFT JOIN supplier s ON p.supplier_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
};
//=======================================================


//Purchase Requests
export const getPurchaseRequests = async (req, res) => {
  try {
    const query = `
      SELECT pr.*, s.name AS supplier_name
      FROM purchase_requests pr
      JOIN supplier s ON pr.supplier_id = s.id
      ORDER BY pr.request_date DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const addPurchaseRequest = async (req, res) => {
  try {
    const {
      request_number,
      supplier_id,
      requested_by,
      request_date,
      expected_delivery,
      priority,
      amount,
      status,
      items_requested,
      notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO purchase_requests
        (request_number, supplier_id, requested_by, request_date, expected_delivery,
         priority, amount, status, items_requested, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        request_number,
        supplier_id,
        requested_by,
        request_date,
        expected_delivery,
        priority,
        amount,
        status,
        items_requested,
        notes,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error adding purchase request:", err); 
    res.status(500).json({ error: err.message });         
  }
};
//=======================================================


//supplier
export const addsupplier = async (req, res) => {
  const { name, address, contact_info } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Missing name or address' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO supplier (name, address, contact_info) VALUES ($1, $2, $3) RETURNING id',
      [name, address, contact_info]
    );

    res.status(201).json({
      message: 'Supplier inserted',
      inserted: {
        id: result.rows[0].id,
        name,
        address,
        contact_info,
      },
    });
  } catch (err) {
    console.error('❌ Insert failed:', err.message);
    res.status(500).json({ error: 'Insert failed', details: err.message });
  }
};
export const getsupplier = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplier');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
}
export const getsuppliers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplier');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Fetch failed:', err.message);
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
}
export const searchSupplier = async (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm) {
        return res.status(400).json({ error: 'Missing search term' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM supplier WHERE name ILIKE $1`,
            [`%${searchTerm}%`]
        );

        res.status(200).json({
            data: result.rows,
            message: result.rows.length === 0 ? 'No supplier matched your search.' : 'supplier found'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
//=======================================================


//Movements
export const addMovement = async (req, res) => {
  const { batch_id, movement_type, quantity, reference, note } = req.body;

  if (!batch_id || !movement_type || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['IN', 'OUT', 'ADJUSTMENT'].includes(movement_type)) {
    return res.status(400).json({ error: 'Invalid movement type' });
  }

  try {
    const query = `
      INSERT INTO stock_movements (batch_id, movement_type, quantity, reference, note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [batch_id, movement_type, quantity, reference || null, note || null];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Stock movement recorded', movement: result.rows[0] });
  } catch (err) {
    console.error('❌ Failed to add movement:', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
export const getMovement = async (req, res) => {
  const { batch_id } = req.query;

  try {
    const query = batch_id
      ? `
        SELECT 
          sm.*, 
          p.name AS product_name
        FROM stock_movements sm
        JOIN product_batches pb ON sm.batch_id = pb.id
        JOIN products p ON pb.product_id = p.id
        WHERE sm.batch_id = $1
        ORDER BY sm.movement_date DESC
      `
      : `
        SELECT 
          sm.*, 
          p.name AS product_name
        FROM stock_movements sm
        JOIN product_batches pb ON sm.batch_id = pb.id
        JOIN products p ON pb.product_id = p.id
        ORDER BY sm.movement_date DESC
      `;

    const result = batch_id
      ? await pool.query(query, [batch_id])
      : await pool.query(query);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch movements:', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
export const getLatestBatchByProductId = async (req, res) => {
  const productId = parseInt(req.query.product_id, 10);
  if (!productId || isNaN(productId)) {
    return res.status(400).json({ error: 'Invalid or missing product_id' });
  }

  try {
    const query = `
      SELECT id AS batch_id
      FROM product_batches
      WHERE product_id = $1
      ORDER BY expiration_date DESC, id DESC
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No batch found for this product' });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Failed to fetch latest batch:', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};

export const getMovementsByProductId = async (req, res) => {
  const { product_id } = req.query;

  if (!product_id) {
    return res.status(400).json({ error: "Missing product_id" });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        sm.id,
        sm.movement_date,
        p.name AS product_name,
        pb.batch_number,
        sm.movement_type,
        sm.quantity,
        sm.reference,
        sm.note
      FROM stock_movements sm
      JOIN product_batches pb ON sm.batch_id = pb.id
      JOIN products p ON pb.product_id = p.id
      WHERE pb.product_id = $1
      ORDER BY sm.movement_date DESC, sm.id DESC
      `,
      [product_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch product movements:", err.message);
    res.status(500).json({ error: "Failed to fetch product movements", details: err.message });
  }
};

//=======================================================


export const searchProductsByName = async (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm) {
        return res.status(400).json({ error: 'Missing search term' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM products WHERE name ILIKE $1`,
            [`%${searchTerm}%`]
        );

        res.status(200).json({
            data: result.rows,
            message: result.rows.length === 0 ? 'No products matched your search.' : 'Products found'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
export const searchProductBySupplier = async (req, res) => {
    const searchTerm = req.query.q;

    if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({ error: 'Missing or empty search term' });
    }

    try {
        const query = `
            SELECT p.*
            FROM products p
            JOIN supplier s ON p.supplier_id = s.id
            WHERE LOWER(s.name) LIKE LOWER($1)
        `;

        const values = [`%${searchTerm}%`];

        const result = await pool.query(query, values);

        return res.status(200).json({
            data: result.rows,
            message: result.rows.length === 0
                ? 'No products found for the supplier.'
                : 'Products successfully retrieved by supplier.'
        });
    } catch (err) {
        console.error('Error searching products by supplier:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
export const getInventory = async (req, res) => {
  const { batch_id } = req.query;

  try {
    const client = await pool.connect();

    let query = `
  SELECT 
    sm.id,
    sm.movement_date,
    sm.movement_type,
    sm.quantity,
    sm.note,              
    p.name AS product_name,
    pb.id AS batch_id,
    pb.current_quantity,
    pb.buy_price,
    pb.market_price,
    (pb.current_quantity * pb.buy_price) AS total_value,
    CASE
      WHEN pb.expiration_date IS NULL THEN 'Unknown'
      WHEN pb.expiration_date < CURRENT_DATE THEN 'Expired'
      WHEN pb.expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
      ELSE 'Good'
    END AS expiration_status,
    CASE
      WHEN pb.current_quantity = 0 THEN 'Out of Stock'
      WHEN pb.current_quantity < 200 THEN 'Low Stock'
      ELSE 'In Stock'
    END AS stock_status
  FROM stock_movements sm
  JOIN product_batches pb ON sm.batch_id = pb.id
  JOIN products p ON pb.product_id = p.id
`;



    const params = [];
    if (batch_id) {
      query += ` WHERE sm.batch_id = $1`;
      params.push(batch_id);
    }

    query += ` ORDER BY sm.movement_date DESC`;

    const { rows } = await client.query(query, params);

    client.release();

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching inventory movements:", error);
    res.status(500).json({ error: "Failed to fetch inventory data" });
  }
};

export const getProductStockSummary = async (req, res) => {
  try {
    const query = `
SELECT
    p.id AS product_id,
    p.name AS product_name,
    c.name AS category,
    s.name AS supplier,
    SUM(pb.current_quantity) AS total_quantity,

    -- Latest prices
    (SELECT pb2.buy_price
     FROM product_batches pb2
     WHERE pb2.product_id = p.id
     ORDER BY pb2.received_date DESC
     LIMIT 1) AS latest_buy_price,

    (SELECT pb2.market_price
     FROM product_batches pb2
     WHERE pb2.product_id = p.id
     ORDER BY pb2.received_date DESC
     LIMIT 1) AS latest_market_price,

    -- Total value based on market price
    SUM(pb.current_quantity * pb.market_price) AS total_value,

    -- New: oldest expiration among batches with quantity > 0
    (SELECT MIN(pb3.expiration_date)
     FROM product_batches pb3
     WHERE pb3.product_id = p.id AND pb3.current_quantity > 0
    ) AS oldest_available_expiration_date,

    -- Existing: latest expiration across all batches
    MAX(pb.expiration_date) AS latest_expiration_date,

    -- Stock status
    CASE
        WHEN SUM(pb.current_quantity) > 0 THEN 'In Stock'
        ELSE 'Out of Stock'
    END AS stock_status

FROM
    products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN supplier s ON p.supplier_id = s.id
JOIN product_batches pb ON p.id = pb.product_id

GROUP BY
    p.id, p.name, c.name, s.name

ORDER BY
    LOWER(p.name);`;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching stock summary:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};




export const returnGood = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      customer_id,
      product_id,
      quantity,
      reason,
      refund_amount
    } = req.body;

    if (!Number.isInteger(product_id) || !Number.isInteger(customer_id) || quantity <= 0 || refund_amount < 0) {
      return res.status(400).json({ success: false, error: 'Invalid input data' });
    }

    const insertReturnSQL = `
      INSERT INTO returns (
        customer_id, product_id, quantity, reason, refund_amount
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const returnRes = await client.query(insertReturnSQL, [
      customer_id,
      product_id,
      quantity,
      reason,
      refund_amount
    ]);

    const returnId = returnRes.rows[0].id;

    const updateStockSQL = `
      UPDATE product_batches
      SET current_quantity = current_quantity + $1
      WHERE product_id = $2
    `;
    await client.query(updateStockSQL, [quantity, product_id]);

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Return logged successfully',
      return_id: returnId
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Return processing failed:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to process return'
    });
  } finally {
    client.release();
  }
};
export const getAllReturns = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.customer_id,
        c.name AS customer_name,
        r.product_id,
        p.name AS product_name,
        r.quantity,
        r.reason,
        r.refund_amount,
        r.status,
        r.created_at
      FROM returns r
      JOIN customers c ON r.customer_id = c.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch returns:", err.message);
    res.status(500).json({ error: "Failed to fetch returns" });
  }
};
export const deductStockFIFO = async (req, res) => {
  const client = await pool.connect();
  try {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

    await client.query('BEGIN');

    // Get eligible batches by FIFO order
    const { rows: batches } = await client.query(`
      SELECT id, current_quantity, buy_price
      FROM product_batches
      WHERE product_id = $1 AND current_quantity > 0
      ORDER BY received_date ASC, id ASC
    `, [product_id]);

    let remaining = quantity;
    const deductions = [];

    for (const batch of batches) {
      if (remaining <= 0) break;

      const deductQty = Math.min(batch.current_quantity, remaining);

      // Update batch quantity
      await client.query(`
        UPDATE product_batches
        SET current_quantity = current_quantity - $1
        WHERE id = $2
      `, [deductQty, batch.id]);

      deductions.push({
        batch_id: batch.id,
        deducted_quantity: deductQty,
        unit_price: batch.buy_price,
        total_value: deductQty * parseFloat(batch.buy_price),
      });

      remaining -= deductQty;
    }

    if (remaining > 0) {
      throw new Error("Insufficient stock to fulfill deduction");
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "Stock deducted using FIFO",
      product_id,
      total_deducted: quantity,
      breakdown: deductions,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ FIFO deduction error:", err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const getPOSProductList = async (req, res) => {
  try {
    const query = `
      SELECT
        p.id AS id,
        p.name AS name,
        c.name AS category,
        s.name AS supplier,
        SUM(pb.current_quantity) AS stock,
        (SELECT pb2.market_price
         FROM product_batches pb2
         WHERE pb2.product_id = p.id
         ORDER BY pb2.received_date DESC
         LIMIT 1) AS market_price
      FROM
        products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN supplier s ON p.supplier_id = s.id
      JOIN product_batches pb ON p.id = pb.product_id
      GROUP BY
        p.id, p.name, c.name, s.name
      ORDER BY
        LOWER(p.name)
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ POS Product List Fetch Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const getProductsByCategoryid = async (req, res) => {
  try {
    const { category_id } = req.query; // ?category_id=3

    // Optional validation
    if (category_id && isNaN(Number(category_id))) {
      return res.status(400).json({ error: "Invalid category_id" });
    }

    const query = `
SELECT
    p.id AS product_id,
    p.name AS product_name,
    c.name AS category,
    s.name AS supplier,
    SUM(pb.current_quantity) AS total_quantity,

    (SELECT pb2.buy_price
     FROM product_batches pb2
     WHERE pb2.product_id = p.id
     ORDER BY pb2.received_date DESC
     LIMIT 1) AS latest_buy_price,

    (SELECT pb2.market_price
     FROM product_batches pb2
     WHERE pb2.product_id = p.id
     ORDER BY pb2.received_date DESC
     LIMIT 1) AS latest_market_price,

    SUM(pb.current_quantity * pb.market_price) AS total_value,

    (SELECT MIN(pb3.expiration_date)
     FROM product_batches pb3
     WHERE pb3.product_id = p.id AND pb3.current_quantity > 0
    ) AS oldest_available_expiration_date,

    MAX(pb.expiration_date) AS latest_expiration_date,

    CASE
        WHEN SUM(pb.current_quantity) > 0 THEN 'In Stock'
        ELSE 'Out of Stock'
    END AS stock_status

FROM
    products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN supplier s ON p.supplier_id = s.id
JOIN product_batches pb ON p.id = pb.product_id
${category_id ? "WHERE p.category_id = $1" : ""}
GROUP BY
    p.id, p.name, c.name, s.name
ORDER BY
    LOWER(p.name);
`;

    const values = category_id ? [category_id] : [];
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching stock summary:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deductFromBatchesByNameFIFO = async (req, res) => {
  const deductions = req.body; // [{ product_name, quantity_to_deduct }]
  const userId = req.user?.id;

  if (!Array.isArray(deductions) || deductions.length === 0) {
    return res.status(400).json({ error: 'No deduction data provided' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of deductions) {
      const { product_name, quantity_to_deduct, reference, note } = item;
      if (!product_name || !quantity_to_deduct || quantity_to_deduct <= 0) {
        throw new Error(`Invalid input for product_name="${product_name}"`);
      }

      // Get product_id
      const productRes = await client.query(
        `SELECT id FROM products WHERE name = $1 LIMIT 1`,
        [product_name]
      );
      if (productRes.rows.length === 0) {
        throw new Error(`Product not found: ${product_name}`);
      }
      const product_id = productRes.rows[0].id;
      let remaining = quantity_to_deduct;

      // Get batches by FIFO
      const batchRes = await client.query(
        `
        SELECT id, current_quantity, received_date 
        FROM product_batches 
        WHERE product_id = $1 AND current_quantity > 0 
        ORDER BY received_date ASC
        `,
        [product_id]
      );

      for (const batch of batchRes.rows) {
        if (remaining <= 0) break;

        const deductQty = Math.min(batch.current_quantity, remaining);
        const newQty = batch.current_quantity - deductQty;

        // 1. Deduct from batch
        await client.query(
          `UPDATE product_batches SET current_quantity = $1 WHERE id = $2`,
          [newQty, batch.id]
        );

        // 2. Insert into stock_movements
        await client.query(
          `
          INSERT INTO stock_movements (batch_id, movement_type, quantity, reference, note)
          VALUES ($1, 'OUT', $2, $3, $4)
          `,
          [batch.id, deductQty, reference || null, note || `Auto-deducted via FIFO for ${product_name}`]
        );

        // 3. Log user activity
        await logUserActivity({
          userId,
          activityType: "UPDATE",
          description: `Deducted ${deductQty} from batch_id=${batch.id}, product="${product_name}"`,
          entityType: "Batch",
          entityId: batch.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });

        remaining -= deductQty;
      }

      if (remaining > 0) {
        throw new Error(`Not enough stock for product "${product_name}"`);
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Deductions and movements applied successfully' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Deduction failed:', err.message);
    res.status(500).json({ error: 'Deduction failed', details: err.message });
  } finally {
    client.release();
  }
};
