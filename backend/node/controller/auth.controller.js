import { generateToken } from "../lib/utils.js";
import bcrypt from "bcryptjs";
import pool from "../lib/db.js"; // adjust path to your PostgreSQL pool setup

export const signup = async (req, res) => {
  const { username, email, password, fullname, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

    if (existing.rowCount > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (userName, email, password, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [username, email, hashedPassword, fullname, role]
    );

    const newUserId = result.rows[0].id;

    generateToken(newUserId, res); // sets cookie

    res.status(201).json({
      _id: newUserId,
      username,
      email,
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid Username or Password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Username or Password" });
    }

    generateToken(user.id, res);

    res.status(200).json({
      _id: user.id,
      username: user.username,
      email: user.email,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("CheckAuth error:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logUserActivity = async ({
  userId,
  activityType,
  description,
  entityType,
  entityId = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await pool.query(
      `INSERT INTO user_activity_log
        (user_id, activity_type, description, entity_type, entity_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, activityType, description, entityType, entityId, ipAddress, userAgent]
    );
  } catch (err) {
    console.error("Failed to log user activity:", err.message);
    // Optional: don't break flow on logging failure
  }
};

export const getUserActivityLogs = async (req, res) => {
  const { userId, activityType, entityType, limit = 100, offset = 0 } = req.query;
  try {
    let baseQuery = `SELECT * FROM user_activity_log WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    if (userId) {
      baseQuery += ` AND user_id = $${paramIndex++}`;
      values.push(userId);
    }
    if (activityType) {
      baseQuery += ` AND activity_type = $${paramIndex++}`;
      values.push(activityType);
    }
    if (entityType) {
      baseQuery += ` AND entity_type = $${paramIndex++}`;
      values.push(entityType);
    }

    baseQuery += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);

    const result = await pool.query(baseQuery, values);

    res.status(200).json({
      success: true,
      count: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    console.error("❌ Failed to fetch activity logs:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch activity logs",
      details: err.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT 
          id,
          full_name AS name,
          email,
          role,
          department, -- NEW FIELD
          last_login,
          status
        FROM users
        ORDER BY created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Failed to fetch users:', err.message);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    await pool.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    res.status(200).json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error('Failed to update user status:', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Failed to delete user:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};