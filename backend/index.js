require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { initDb, query } = require('./db');

const app = express();
const port = process.env.PORT || 3000;
const version = process.env.VERSION || '1.0.0';

const allowedTypes = ['รถยนต์', 'รถจักรยานยนต์'];
const allowedStatuses = ['ออกแล้ว', 'รอออก', 'หมดอายุ'];

app.use(cors());
app.use(express.json());

function normalizeCarPayload(body) {
  return {
    plate_no: String(body.plate_no || '').trim(),
    type: String(body.type || '').trim(),
    brand_model: String(body.brand_model || '').trim(),
    color: String(body.color || '').trim(),
    owner: String(body.owner || '').trim(),
    department: String(body.department || '').trim(),
    status: String(body.status || '').trim(),
  };
}

function validateCar(car) {
  const missing = Object.entries(car)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }

  if (!allowedTypes.includes(car.type)) {
    return 'type must be รถยนต์ or รถจักรยานยนต์';
  }

  if (!allowedStatuses.includes(car.status)) {
    return 'status must be ออกแล้ว, รอออก, or หมดอายุ';
  }

  return null;
}

function mapDbError(error) {
  if (error.code === '23505') {
    return { status: 409, message: 'plate_no already exists' };
  }

  return { status: 500, message: 'database error' };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version });
});

app.get('/api/items', async (req, res) => {
  const result = await query('SELECT * FROM cars ORDER BY id DESC');
  res.json(result.rows);
});

app.get('/api/items/:id', async (req, res) => {
  const result = await query('SELECT * FROM cars WHERE id = $1', [req.params.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'car not found' });
  }

  return res.json(result.rows[0]);
});

app.post('/api/items', async (req, res) => {
  const car = normalizeCarPayload(req.body);
  const validationError = validateCar(car);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await query(
      `INSERT INTO cars (plate_no, type, brand_model, color, owner, department, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [car.plate_no, car.type, car.brand_model, car.color, car.owner, car.department, car.status],
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    const mapped = mapDbError(error);
    return res.status(mapped.status).json({ message: mapped.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  const car = normalizeCarPayload(req.body);
  const validationError = validateCar(car);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const result = await query(
      `UPDATE cars
       SET plate_no = $1,
           type = $2,
           brand_model = $3,
           color = $4,
           owner = $5,
           department = $6,
           status = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [car.plate_no, car.type, car.brand_model, car.color, car.owner, car.department, car.status, req.params.id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'car not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    const mapped = mapDbError(error);
    return res.status(mapped.status).json({ message: mapped.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  const result = await query('DELETE FROM cars WHERE id = $1 RETURNING *', [req.params.id]);

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'car not found' });
  }

  return res.json({ message: 'car deleted', item: result.rows[0] });
});

if (process.env.NODE_ENV !== 'test') {
  initDb()
    .then(() => {
      app.listen(port, () => {
        console.log(`staffcar api listening on port ${port}`);
      });
    })
    .catch((error) => {
      console.error('failed to start api', error);
      process.exit(1);
    });
}

module.exports = app;
