# ระบบบันทึกข้อมูลรถของบุคลากรวิทยาลัยเทคนิคเลย (staffcar)

**ผู้จัดทำ:** chetsada suthongsa  
**รหัสนักศึกษา:** 68319010015  
**ระดับชั้น/กลุ่มเรียน:** ปวส2/2

[![CI - staffcar](https://github.com/9fight/midterm-devops-staffcar-68319010015/actions/workflows/ci.yml/badge.svg)](https://github.com/9fight/midterm-devops-staffcar-68319010015/actions/workflows/ci.yml)
[![CD - staffcar](https://github.com/9fight/midterm-devops-staffcar-68319010015/actions/workflows/cd.yml/badge.svg)](https://github.com/9fight/midterm-devops-staffcar-68319010015/actions/workflows/cd.yml)

ระบบ CRUD สำหรับบันทึกข้อมูลรถของบุคลากรเพื่อออกสติกเกอร์เข้า-ออกวิทยาลัยเทคนิคเลย ใช้ Node.js + Express + PostgreSQL และ frontend แบบ Vue 3 + Vite

## API endpoints

| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| GET | `/health` | ตรวจสถานะ API และ version |
| GET | `/api/items` | ดูข้อมูลรถทั้งหมด |
| GET | `/api/items/:id` | ดูข้อมูลรถตาม id |
| POST | `/api/items` | เพิ่มข้อมูลรถ |
| PUT | `/api/items/:id` | แก้ไขข้อมูลรถ |
| DELETE | `/api/items/:id` | ลบข้อมูลรถ |

## Fields

| Field | รายละเอียด |
| --- | --- |
| `plate_no` | ทะเบียนรถ |
| `type` | รถยนต์ / รถจักรยานยนต์ |
| `brand_model` | ยี่ห้อและรุ่น |
| `color` | สี |
| `owner` | ชื่อเจ้าของ |
| `department` | แผนก |
| `status` | ออกแล้ว / รอออก / หมดอายุ |

## Run with Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
```

เปิดเว็บที่ `http://localhost:8080` และ API ที่ `http://localhost:3000/health`

## Run with Docker Hub images

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d
```

Docker Hub repositories:

- Backend: `https://hub.docker.com/r/xenalz/staffcar-api`
- Frontend: `https://hub.docker.com/r/xenalz/staffcar-web`

## Development

Backend:

```powershell
cd backend
npm install
npm run lint
npm test
$env:PORT=3001
npm start
```

เมื่อต้องการรันแบบ local development ให้เปิด backend ที่ `http://localhost:3001` เพราะพอร์ต `3000` อาจถูกใช้งานโดยแอปอื่นอยู่ ส่วน Docker ยังใช้พอร์ต `3000` ตามปกติ
backend จะใช้ค่า PostgreSQL default เป็น `localhost:5432`, database `staffcar`, user `staffcar_user`, password `staffcar_password` ซึ่งตรงกับค่าใน `docker-compose.yml`

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

เปิดหน้าเว็บสำหรับ development ที่ `http://localhost:5173` โดย Vite จะ proxy `/api` และ `/health` ไปที่ `http://localhost:3001`

## Build and push images

```bash
docker build -t xenalz/staffcar-api:v1.0.0 -t xenalz/staffcar-api:latest ./backend
docker build -t xenalz/staffcar-web:v1.0.0 -t xenalz/staffcar-web:latest ./frontend
docker push xenalz/staffcar-api:v1.0.0
docker push xenalz/staffcar-api:latest
docker push xenalz/staffcar-web:v1.0.0
docker push xenalz/staffcar-web:latest
```

## Git workflow

- `main` — โค้ด production
- `develop` — รวม feature ที่เสร็จแล้ว
- `feature/*` — พัฒนา feature แยก branch (เช่น `feature/frontend-ui`)
- ทุกการ merge เข้า `main` ผ่าน Pull Request และ CI ต้องผ่านก่อน merge

## Project structure

```text
midterm-devops-staffcar-68319010015/
├── backend/
├── frontend/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```
