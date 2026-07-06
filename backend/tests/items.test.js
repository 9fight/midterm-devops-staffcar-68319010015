const request = require('supertest');
const db = require('../db');
const app = require('../index');

jest.mock('../db', () => ({
  query: jest.fn(),
  initDb: jest.fn(),
}));

const sampleCar = {
  id: 1,
  plate_no: 'กข 1234 เลย',
  type: 'รถยนต์',
  brand_model: 'Toyota Yaris',
  color: 'ขาว',
  owner: 'สมชาย ใจดี',
  department: 'เทคโนโลยีสารสนเทศ',
  status: 'ออกแล้ว',
};

beforeEach(() => {
  db.query.mockReset();
});

test('GET /health returns status and version', async () => {
  const res = await request(app).get('/health');

  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok', version: '1.0.0' });
});

test('GET /api/items returns all cars', async () => {
  db.query.mockResolvedValueOnce({ rows: [sampleCar], rowCount: 1 });

  const res = await request(app).get('/api/items');

  expect(res.status).toBe(200);
  expect(res.body).toHaveLength(1);
  expect(res.body[0].plate_no).toBe('กข 1234 เลย');
});

test('GET /api/items/:id returns 404 when car does not exist', async () => {
  db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

  const res = await request(app).get('/api/items/999');

  expect(res.status).toBe(404);
  expect(res.body.message).toBe('car not found');
});

test('POST /api/items validates required fields', async () => {
  const res = await request(app).post('/api/items').send({ plate_no: '1กก 1111' });

  expect(res.status).toBe(400);
  expect(res.body.message).toContain('Missing required fields');
});

test('POST /api/items creates a car', async () => {
  db.query.mockResolvedValueOnce({ rows: [sampleCar], rowCount: 1 });

  const res = await request(app).post('/api/items').send(sampleCar);

  expect(res.status).toBe(201);
  expect(res.body.owner).toBe('สมชาย ใจดี');
});

test('POST /api/items rejects invalid status', async () => {
  const res = await request(app).post('/api/items').send({
    ...sampleCar,
    status: 'ยังไม่ระบุ',
  });

  expect(res.status).toBe(400);
  expect(res.body.message).toContain('status must be');
});

test('POST /api/items returns 409 when plate number already exists', async () => {
  db.query.mockRejectedValueOnce({ code: '23505' });

  const res = await request(app).post('/api/items').send(sampleCar);

  expect(res.status).toBe(409);
  expect(res.body.message).toBe('plate_no already exists');
});

test('PUT /api/items/:id updates a car', async () => {
  const updatedCar = {
    ...sampleCar,
    color: 'น้ำเงิน',
    status: 'รอออก',
  };
  db.query.mockResolvedValueOnce({ rows: [updatedCar], rowCount: 1 });

  const res = await request(app).put('/api/items/1').send(updatedCar);

  expect(res.status).toBe(200);
  expect(res.body.color).toBe('น้ำเงิน');
  expect(res.body.status).toBe('รอออก');
});

test('PUT /api/items/:id returns 404 when car does not exist', async () => {
  db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

  const res = await request(app).put('/api/items/999').send(sampleCar);

  expect(res.status).toBe(404);
  expect(res.body.message).toBe('car not found');
});

test('DELETE /api/items/:id deletes a car', async () => {
  db.query.mockResolvedValueOnce({ rows: [sampleCar], rowCount: 1 });

  const res = await request(app).delete('/api/items/1');

  expect(res.status).toBe(200);
  expect(res.body.message).toBe('car deleted');
  expect(res.body.item.plate_no).toBe('กข 1234 เลย');
});

test('DELETE /api/items/:id returns 404 when car does not exist', async () => {
  db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

  const res = await request(app).delete('/api/items/999');

  expect(res.status).toBe(404);
  expect(res.body.message).toBe('car not found');
});
