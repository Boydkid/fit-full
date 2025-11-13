# Fitmat BackEnd

## ภาพรวม
Fitmat BackEnd คือ REST API ที่สร้างด้วย Express + TypeScript ใช้ Prisma/MySQL สำหรับจัดเก็บข้อมูล พร้อมฟีเจอร์การยืนยันตัวตน การจัดการเทรนเนอร์/คลาส ระบบติดต่อเรา ระบบระดับสมาชิก (Bronze/Gold/Platinum) และการอัปโหลดสลิปชำระเงินเพื่อตรวจสอบโดยแอดมิน นอกจากนี้ยังใช้ Nodemailer สำหรับแจ้งเตือนอีเมลจากแบบฟอร์มติดต่อเรา

## สิ่งที่ต้องเตรียม
- Node.js 18 ขึ้นไป
- npm 9 ขึ้นไป
- ฐานข้อมูล MySQL 8 ขึ้นไป (เข้าถึงผ่าน DATABASE_URL)

## ขั้นตอนเริ่มต้น
`
# ติดตั้ง dependency
npm install

# (ถ้าปรับ schema) สร้าง Prisma Client และ push schema
npx prisma generate
npx prisma db push

# รันเซิร์ฟเวอร์ (โหมดพัฒนา)
npm run dev
`
ค่าเริ่มต้นของเซิร์ฟเวอร์คือ ${process.env.NEXT_PUBLIC_API_URL}

### ตัวแปรสภาพแวดล้อม
สร้างไฟล์ .env ที่โฟลเดอร์ Fitmat-BackEnd
`
DATABASE_URL="mysql://user:pass@localhost:3306/fitmat"
PORT=4000
JWT_SECRET=mysupersecret
EMAIL_USER=fitmaxperformance@gmail.com
EMAIL_PASSWORD=app-password
CONTACT_NOTIFY_EMAIL=admin@example.com
`
EMAIL_USER / EMAIL_PASSWORD จำเป็นถ้าต้องการให้ระบบส่งอีเมลตอบกลับจากหน้า Contact (แนะนำ Gmail App Password)

> **สำคัญ**: ระหว่างการพัฒนาใช้คำสั่ง 
px prisma db push --force-reset หลายครั้ง หากใช้อีกครั้งฐานข้อมูลจะถูกลบและสร้างใหม่ทั้งหมด

## สคริปต์ที่มีให้
- 
pm run dev – รันเซิร์ฟเวอร์ด้วย 	s-node
- 
px prisma generate – สร้าง Prisma Client ใหม่
- 
px prisma db push – ส่งโครงสร้าง Prisma ไปยังฐานข้อมูลปัจจุบัน

## คู่มือ API
ถ้าไม่ได้ระบุ จะใช้ Payload แบบ JSON ทั้งหมด Endpoints ที่มีเครื่องหมาย **(admin)** ต้องส่ง AdminId ที่เป็นผู้ใช้ role ADMIN มาด้วย

### การยืนยันตัวตน
| Method | Endpoint | อธิบาย |
| --- | --- | --- |
| POST | /api/register | สมัครสมาชิกใหม่ (role เริ่มต้นคือ USER) |
| POST | /api/login | ล็อกอิน รับ JWT + ข้อมูลผู้ใช้ |
| POST | /api/request-password-reset | ขอ opt ในการ resetpassword ( ส่ง mail พร้อมทำการ gen token resetpassword )|
| POST | /api/reset-password | ทำการ resetpassword ( token resetpassword และ รหัสใหม่ไปเทียบ) |


**ตัวอย่างสมัครสมาชิก**
`http
POST /api/register
{
  "email": "alice@example.com",
  "password": "pass1234"
}
`

**ตัวอย่างล็อกอิน**
`http
POST /api/login
{
  "email": "alice@example.com",
  "password": "pass1234"
}
`

**ตัวอย่างการเปลี่ยนรหัสผ่าน**
`http
POST /api/request-password-reset
{
  "email": "alice@example.com",
}
`
`http
POST /api/reset-password
{
  "resetToken": "abcdef123456", 
  "newPassword": "pass1234"
}
`

### ผู้ใช้และบทบาท (เฉพาะแอดมิน)
| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| GET | /api/users?adminId=1 | ดูรายชื่อผู้ใช้ทั้งหมด หรือใส่ 
ole=USER_GOLD เพื่อกรอง |
| GET | /api/users/roles | ดูรายการ role ทั้งหมดในระบบ |
| PATCH | /api/users/:userId/role | ปรับ role ผู้ใช้ ต้องส่ง { adminId, role } |

**ตัวอย่างปรับ role**
`http
PATCH /api/users/12/role
{
  "adminId": 1,
  "role": "USER_PLATINUM"
}
`

### เทรนเนอร์
| Method | Endpoint | คำอธิบาย |
| --- | --- | --- |
| GET | /api/trainers | รายชื่อเทรนเนอร์พร้อมสรุปรีวิว |
| GET | /api/classes/trainer/:trainerId | คลาสที่เทรนเนอร์รับผิดชอบพร้อมที่นั่งคงเหลือ |

### หมวดหมู่คลาส (admin)
| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| GET | /api/class-categories | รายชื่อหมวดคลาส |
| POST | /api/class-categories | สร้างหมวดใหม่ ต้องส่ง { adminId, name, description? } |

### คลาส
| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| GET | /api/classes | รายการคลาสทั้งหมด (เทรนเนอร์, หมวด, requiredRole, จำนวนที่นั่ง) |
| POST | /api/classes | **(admin)** สร้างคลาสใหม่ ต้องมี AdminId, 	rainerId, 	itle, startTime, endTime และเลือกใส่ categoryId, 
equiredRole (USER, USER_BRONZE, USER_GOLD, USER_PLATINUM), capacity |
| POST | /api/classes/:classId/enroll | ลงทะเบียนเข้าคลาส ส่ง { userId } และจะตรวจสอบ role ของผู้ใช้ |
| GET | /api/classes/:classId/enrollments | ดูผู้ที่ลงทะเบียนในคลาส พร้อมข้อมูลคลาส |

### รีวิวเทรนเนอร์
| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| POST | /api/reviews | ส่งรีวิว { reviewerId, trainerId, comment, rating? } |
| GET | /api/reviews | รายการรีวิวทั้งหมด |
| GET | /api/reviews/summary | สรุปรวมจำนวนรีวิวและค่าเฉลี่ย |
| GET | /api/reviews/trainer/:trainerId | ดูรีวิวเฉพาะเทรนเนอร์ |

### ติดต่อเรา (Contact Us)
| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| POST | /api/contact | { name, email, phoneNumber, subject, message } จะส่งเมลถึงแอดมินและตอบกลับผู้ใช้ |
| GET | /api/contact | **(admin)** ดูข้อความที่ผู้ใช้ส่งมา |

### การชำระเงิน (สลิป)
ระบบเก็บไฟล์รูปแบบ Base64 เพื่อให้แอดมินตรวจสอบภายหลัง

| Method | Endpoint | รายละเอียด |
| --- | --- | --- |
| POST | /api/payments | ส่ง multipart form โดยใช้ field paymentImage (ไฟล์รูป), และใส่ userId, mount, 
ote ได้ (ไม่บังคับ) |
| GET | /api/payments?adminId=1&userId= | **(admin)** ดูรายการตามผู้ใช้ (เฉพาะ metadata) |
| GET | /api/payments/all?adminId=1 | **(admin)** ดูทุกสลิป (รวม Base64) |
| GET | /api/payments/:paymentId/image?adminId=1 | **(admin)** ดาวน์โหลดรูปจริง |

**ตัวอย่างอัปโหลด (cURL)**
`
curl -X POST ${process.env.NEXT_PUBLIC_API_URL}/api/payments \
  -F "paymentImage=@/path/slip.jpg" \
  -F "userId=12" \
  -F "amount=1499" \
  -F "note=October membership"
`

### หมายเหตุเรื่อง membership
ถ้าคลาสกำหนด 
equiredRole ผู้ใช้ที่ role ไม่ตรง (และไม่ใช่ ADMIN หรือ TRAINER) จะลงทะเบียนไม่ได้ เช่น คลาส 
equiredRole=USER_GOLD ผู้ใช้ที่เป็น USER_BRONZE จะถูกปฏิเสธ

### สรุปงานที่ต้องใช้สิทธิ์แอดมิน
| งาน | ต้องเป็นแอดมิน |
| --- | --- |
| ดู/ปรับผู้ใช้และบทบาท | ✓ |
| สร้างหมวด/คลาส | ✓ |
| ดูข้อความ Contact | ✓ |
| ดูสลิปชำระเงิน | ✓ |

### Prisma & ฐานข้อมูล
- แก้ไข schema ที่ prisma/schema.prisma
- หลังแก้ schema ให้รัน:
  `
  npx prisma generate
  npx prisma db push
  `
- ถ้าต้องการ reset ฐานข้อมูลในโหมด dev: 
px prisma db push --force-reset

### เคล็ดลับการทดสอบ
- ใช้ Postman หรือ Hoppscotch สำหรับ API test และ multipart upload
- ใช้ 
px prisma studio เพื่อเพิ่ม/แก้ไขข้อมูลในฐานได้ง่าย

### แนวทางพัฒนาต่อ
- ใช้ JWT middleware เพื่ออ่าน AdminId / userId จาก token โดยตรง ไม่ต้องส่งมาใน body/query
- ย้ายการเก็บไฟล์จาก Base64 ไปยัง object storage (เช่น S3) เพื่อลดขนาดฐานข้อมูล
- เพิ่มระบบ logging/monitoring เช่น pino หรือ winston
- เขียน automated tests (Jest/Supertest)
- ทำ Docker Compose สำหรับ backend + MySQL เพื่อใช้ร่วมกันในทีมสะดวกขึ้น

---
โชคดีกับการพัฒนาครับ!
