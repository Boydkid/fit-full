# API Endpoints สำหรับ Postman

## Base URL
```
http://localhost:4000


---

## 1. Health Check

### GET /
ตรวจสอบสถานะของ API Server

```
GET http://localhost:4000/
```

---

## 2. Authentication

### POST /api/register
สมัครสมาชิก

```
POST http://localhost:4000/api/register
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER"
  }
}
```

---

### POST /api/login
เข้าสู่ระบบ

```
POST http://localhost:4000/api/login
```

**Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "USER"
  }
}
```

---

### POST /api/logout
ออกจากระบบ

```
POST http://localhost:4000/api/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

---

### POST /api/reissue-token
ขอ Token ใหม่

```
POST http://localhost:4000/api/reissue-token
```

**Headers:**
```
Authorization: Bearer <token>
```

---

### POST /api/request-password-reset
ขอ Reset Password

```
POST http://localhost:4000/api/request-password-reset
```

**Body (JSON):**
```json
{
  "email": "user@example.com"
}
```

---

### POST /api/verify-reset-token
ตรวจสอบ Reset Token

```
POST http://localhost:4000/api/verify-reset-token
```

**Body (JSON):**
```json
{
  "resetToken": "abc123"
}
```

---

### POST /api/reset-password
Reset Password

```
POST http://localhost:4000/api/reset-password
```

**Body (JSON):**
```json
{
  "resetToken": "abc123",
  "newPassword": "newpassword123"
}
```

---

### POST /api/change-password
เปลี่ยนรหัสผ่าน (ต้อง Authentication)

```
POST http://localhost:4000/api/change-password
```

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## 3. Users

### GET /api/users
ดึงรายการผู้ใช้ทั้งหมด (Admin only)

```
GET http://localhost:4000/api/users?role=USER
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `role` (optional): กรองตาม role (USER, USER_BRONZE, USER_GOLD, USER_PLATINUM, TRAINER, ADMIN)

---

### GET /api/users/roles
ดึงรายการ Roles ทั้งหมด (Admin only)

```
GET http://localhost:4000/api/users/roles
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### GET /api/users/:id
ดึงข้อมูลผู้ใช้ตาม ID

```
GET http://localhost:4000/api/users/1
```

---

### PUT /api/users/:id
อัปเดตข้อมูลผู้ใช้

```
PUT http://localhost:4000/api/users/1
```

**Body (JSON):**
```json
{
  "username": "newusername",
  "profileImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**หมายเหตุ:** profileImage ต้องเป็น base64 data URL

---

### PATCH /api/users/:userId/role
อัปเดต Role ของผู้ใช้ (Admin only)

```
PATCH http://localhost:4000/api/users/1/role
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body (JSON):**
```json
{
  "role": "USER_GOLD"
}
```

---

### GET /api/users/:id/classes
ดึงคลาสที่ผู้ใช้ลงทะเบียน

```
GET http://localhost:4000/api/users/1/classes
```

---

### DELETE /api/users/:id/classes/:classId
ยกเลิกการลงทะเบียนคลาส

```
DELETE http://localhost:4000/api/users/1/classes/5
```

---

## 4. Trainers

### GET /api/trainers
ดึงรายการเทรนเนอร์ทั้งหมด

```
GET http://localhost:4000/api/trainers
```

---

### GET /api/trainers/:trainerId
ดึงข้อมูลเทรนเนอร์ตาม ID

```
GET http://localhost:4000/api/trainers/1
```

---

## 5. Classes

### GET /api/classes
ดึงรายการคลาสทั้งหมด

```
GET http://localhost:4000/api/classes
```

---

### GET /api/classes/listclassupcoming
ดึงรายการคลาสที่จะเกิดขึ้น (Upcoming)

```
GET http://localhost:4000/api/classes/listclassupcoming
```

---

### GET /api/classes/my-classes
ดึงคลาสของตัวเอง (ต้อง Authentication - Trainer only)

```
GET http://localhost:4000/api/classes/my-classes
```

**Headers:**
```
Authorization: Bearer <trainer_token>
```

---

### GET /api/classes/trainer/:trainerId
ดึงคลาสของเทรนเนอร์

```
GET http://localhost:4000/api/classes/trainer/1
```

---

### GET /api/classes/:classId
ดึงข้อมูลคลาสตาม ID

```
GET http://localhost:4000/api/classes/1
```

---

### GET /api/classes/:classId/enrollments
ดึงรายการผู้ลงทะเบียนในคลาส

```
GET http://localhost:4000/api/classes/1/enrollments
```

---

### POST /api/classes
สร้างคลาสใหม่ (Admin only)

```
POST http://localhost:4000/api/classes
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body (JSON):**
```json
{
  "trainerId": 1,
  "categoryId": 1,
  "title": "Yoga Class",
  "description": "Relaxing yoga session",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "capacity": 20,
  "requiredRole": "USER_GOLD"
}
```

---

### PUT /api/classes/:classId
อัปเดตข้อมูลคลาส (Admin only)

```
PUT http://localhost:4000/api/classes/1
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body (JSON):**
```json
{
  "title": "Updated Yoga Class",
  "description": "Updated description",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "capacity": 25,
  "trainerId": 1,
  "categoryId": 1,
  "requiredRole": "USER_PLATINUM"
}
```

---

### DELETE /api/classes/:classId
ลบคลาส (Admin only)

```
DELETE http://localhost:4000/api/classes/1
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### POST /api/classes/:classId/enroll
ลงทะเบียนคลาส (ต้อง Authentication)

```
POST http://localhost:4000/api/classes/1/enroll
```

**Headers:**
```
Authorization: Bearer <token>
```

---

## 6. Class Categories

### GET /api/class-categories
ดึงรายการหมวดหมู่คลาสทั้งหมด

```
GET http://localhost:4000/api/class-categories
```

---

### POST /api/class-categories
สร้างหมวดหมู่ใหม่ (Admin only)

```
POST http://localhost:4000/api/class-categories
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body (JSON):**
```json
{
  "name": "Yoga",
  "description": "Yoga classes"
}
```

---

### PUT /api/class-categories/:id
อัปเดตหมวดหมู่ (Admin only)

```
PUT http://localhost:4000/api/class-categories/1
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body (JSON):**
```json
{
  "name": "Updated Yoga",
  "description": "Updated description"
}
```

---

### DELETE /api/class-categories/:id
ลบหมวดหมู่ (Admin only)

```
DELETE http://localhost:4000/api/class-categories/1
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**หมายเหตุ:** ไม่สามารถลบได้ถ้ามีคลาสใช้หมวดหมู่นี้อยู่

---

## 7. Reviews

### GET /api/reviews
ดึงรายการรีวิวทั้งหมด

```
GET http://localhost:4000/api/reviews
```

---

### GET /api/reviews/summary
ดึงสรุปรีวิว

```
GET http://localhost:4000/api/reviews/summary
```

---

### GET /api/reviews/trainer/:trainerId
ดึงรีวิวของเทรนเนอร์

```
GET http://localhost:4000/api/reviews/trainer/1
```

---

### POST /api/reviews
สร้างรีวิวใหม่ (ต้อง Authentication)

```
POST http://localhost:4000/api/reviews
```

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**
```json
{
  "trainerId": 1,
  "comment": "Great trainer!",
  "rating": 5
}
```

**หมายเหตุ:** 
- `rating` ต้องอยู่ระหว่าง 1-5 (optional)
- `reviewerId` จะถูกดึงจาก token โดยอัตโนมัติ

---

### DELETE /api/reviews/:reviewId
ลบรีวิว (Admin only)

```
DELETE http://localhost:4000/api/reviews/1
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

## 8. Contact

### GET /api/contact
ดึงรายการข้อความติดต่อทั้งหมด (Admin only)

```
GET http://localhost:4000/api/contact
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### POST /api/contact
ส่งข้อความติดต่อ

```
POST http://localhost:4000/api/contact
```

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "0812345678",
  "subject": "Question about classes",
  "message": "I have a question..."
}
```

---

## 9. Payments

### GET /api/payments
ดึงรายการหลักฐานการชำระเงิน (Admin only)

```
GET http://localhost:4000/api/payments?userId=1
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `userId` (optional): กรองตาม user ID

---

### GET /api/payments/all
ดึงรายการหลักฐานการชำระเงินทั้งหมด (Admin only)

```
GET http://localhost:4000/api/payments/all
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### GET /api/payments/:paymentId/image
ดึงรูปภาพหลักฐานการชำระเงิน (Admin only)

```
GET http://localhost:4000/api/payments/1/image
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### POST /api/payments
อัปโหลดหลักฐานการชำระเงิน (multipart/form-data)

```
POST http://localhost:4000/api/payments
```

**Content-Type:** `multipart/form-data`

**Body (form-data):**
- `paymentImage` (file): รูปภาพหลักฐานการชำระเงิน
- `userId` (optional): ID ของผู้ใช้
- `amount` (optional): จำนวนเงิน
- `note` (optional): หมายเหตุ

**ตัวอย่างใน Postman:**
1. เลือก Body > form-data
2. เพิ่ม key `paymentImage` แบบ File
3. เลือกไฟล์รูปภาพ
4. เพิ่ม key อื่นๆ (userId, amount, note) แบบ Text

---

## 10. Stripe

### POST /api/stripe/checkout
สร้าง Checkout Session

```
POST http://localhost:4000/api/stripe/checkout
```

**Body (JSON):**
```json
{
  "userId": 1,
  "priceId": "price_xxx",
  "successPath": "/success",
  "cancelPath": "/cancel"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_xxx",
  "purchaseId": 1
}
```

---

### GET /api/stripe/verify
ตรวจสอบ Session

```
GET http://localhost:4000/api/stripe/verify?session_id=cs_test_xxx
```

---

### POST /api/stripe/webhook
Webhook สำหรับ Stripe (ไม่แนะนำให้ทดสอบใน Postman)

```
POST http://localhost:4000/api/stripe/webhook
```

**Headers:**
```
stripe-signature: <signature>
```

**หมายเหตุ:** ต้องใช้ raw body และ signature จาก Stripe

---

## 📝 หมายเหตุสำคัญ

### Authentication
- Endpoints ที่ต้องการ Authentication ต้องส่ง Token ใน Headers:
  ```
  Authorization: Bearer <your_token>
  ```
- Token ได้มาจาก `/api/login` หรือ `/api/register`

### Admin Only
- Endpoints ที่ระบุ "Admin only" ต้องใช้ Token ของ Admin เท่านั้น
- Role: `ADMIN`

### Trainer Only
- Endpoints ที่ระบุ "Trainer only" ต้องใช้ Token ของ Trainer
- Role: `TRAINER`

### File Upload
- สำหรับการอัปโหลดไฟล์ (Payment Proof) ใช้ `multipart/form-data`
- ภาพ Profile Image ต้องเป็น base64 data URL

### Role Hierarchy
```
USER < USER_BRONZE < USER_GOLD < USER_PLATINUM < TRAINER < ADMIN
```

### Date Format
- ใช้ ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
- ตัวอย่าง: `2024-01-15T10:00:00Z`

---

## 🧪 ตัวอย่างการใช้งานใน Postman

### 1. สมัครสมาชิก
1. Method: `POST`
2. URL: `http://localhost:4000/api/register`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

### 2. เข้าสู่ระบบ
1. Method: `POST`
2. URL: `http://localhost:4000/api/login`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
5. Copy `token` จาก response

### 3. ดึงรายการคลาส (ต้อง Authentication)
1. Method: `GET`
2. URL: `http://localhost:4000/api/classes/my-classes`
3. Headers:
   - `Authorization: Bearer <token ที่ได้จาก login>`

### 4. สร้างคลาสใหม่ (Admin)
1. Method: `POST`
2. URL: `http://localhost:4000/api/classes`
3. Headers:
   - `Authorization: Bearer <admin_token>`
   - `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "trainerId": 1,
     "title": "Morning Yoga",
     "description": "Start your day with yoga",
     "startTime": "2024-01-20T09:00:00Z",
     "endTime": "2024-01-20T10:00:00Z",
     "capacity": 15
   }
   ```

### 5. อัปโหลดหลักฐานการชำระเงิน
1. Method: `POST`
2. URL: `http://localhost:4000/api/payments`
3. Body > form-data:
   - `paymentImage` (File): เลือกไฟล์รูปภาพ
   - `userId` (Text): `1`
   - `amount` (Text): `500`
   - `note` (Text): `Monthly subscription`

---

## ✅ Checklist สำหรับ Postman Collection

- [ ] Health Check
- [ ] Register & Login
- [ ] Get Token (reissue)
- [ ] Get User Profile
- [ ] Update User Profile
- [ ] Get Trainers
- [ ] Get Classes
- [ ] Create Class (Admin)
- [ ] Enroll in Class
- [ ] Get My Classes
- [ ] Create Review
- [ ] Get Reviews
- [ ] Submit Contact
- [ ] Upload Payment Proof
- [ ] Get Payment Proofs (Admin)

---

**สร้างเมื่อ:** $(date)
**API Version:** 1.0.0