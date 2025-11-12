# FITMAT - Fitness Training Management System

A comprehensive fitness training management platform with backend and frontend built with modern technologies.

## 🚀 Features

* **User Management**: User registration, authentication, and role-based access control
* **Trainer Management**: Trainer profiles, ratings, and reviews
* **Class Management**: Create, update, and manage fitness classes
* **Booking System**: Class enrollment and booking management
* **Payment Integration**: Stripe payment integration for memberships
* **Admin Dashboard**: Comprehensive admin panel for managing all aspects of the platform
* **Membership Tiers**: Bronze, Gold, and Platinum membership levels with role-based class access

## 🛠️ Tech Stack

### Backend

* **Node.js** with **Express.js**
* **TypeScript** for type safety
* **Prisma ORM** with MySQL database
* **JWT** for authentication
* **Stripe** for payment processing
* **Nodemailer** for email notifications

### Frontend

* **Next.js** - React framework with Pages Router
* **TypeScript** for type safety
* **Tailwind CSS** for styling
* **SweetAlert2** for user notifications

## 📁 Project Structure

```
FITMAT/
├── Fitmat-BackEnd/        # Backend API server
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Authentication middleware
│   │   └── utils/         # Utility functions
│   └── prisma/            # Database schema and migrations
│
└── Fitmat-FrontEnd/       # Frontend Next.js application
    ├── components/        # React components
    ├── src/
    │   ├── pages/         # Next.js pages
    │   └── styles/        # Global styles
    └── public/            # Static assets
```

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher)
* MySQL database (v8 or higher)
* npm (v9 or higher)

### Backend Setup

1. Navigate to backend directory:

```bash
cd Fitmat-BackEnd
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables: Create a `.env` file in `Fitmat-BackEnd/`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/fitmat"
JWT_SECRET="your-secret-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
PORT=4000
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="app-password"
CONTACT_NOTIFY_EMAIL="admin@example.com"
```

4. Run Prisma migrations:

```bash
npx prisma generate
npx prisma db push
```

5. Start the server:

```bash
npm run dev
```

The backend API will be available at `http://localhost:4000`

### Frontend Setup

1. Navigate to frontend directory:

```bash
cd Fitmat-FrontEnd
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables: Create a `.env.local` file in `Fitmat-FrontEnd/`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

4. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📝 API Endpoints

### Authentication

* `POST /api/register` - Register new user
* `POST /api/login` - Login user
* `POST /api/request-password-reset` - Request password reset OTP
* `POST /api/reset-password` - Reset password with token

### Classes

* `GET /api/classes` - List all classes
* `POST /api/classes` - Create new class (Admin only)
* `POST /api/classes/:classId/enroll` - Enroll in class
* `GET /api/classes/:classId/enrollments` - Get class enrollments

### Trainers

* `GET /api/trainers` - List all trainers
* `GET /api/trainers/:trainerId` - Get trainer details
* `GET /api/classes/trainer/:trainerId` - Get trainer's classes

### Reviews

* `GET /api/reviews` - List all reviews
* `POST /api/reviews` - Create review
* `GET /api/reviews/trainer/:trainerId` - Get reviews for trainer
* `GET /api/reviews/summary` - Get review summary

### Users

* `GET /api/users` - List all users (Admin only)
* `PATCH /api/users/:userId/role` - Update user role (Admin only)
* `GET /api/users/roles` - List all roles

### Payments

* `POST /api/payments` - Upload payment slip
* `GET /api/payments` - Get payment records (Admin only)
* `GET /api/payments/:paymentId/image` - Get payment image (Admin only)

### Contact

* `POST /api/contact` - Send contact message
* `GET /api/contact` - Get contact messages (Admin only)

## 🎨 Features Overview

### For Users

* Browse and enroll in fitness classes
* View trainer profiles and reviews
* Manage account settings
* Track bookings and class history
* Upload payment slips for membership verification

### For Trainers

* View assigned classes
* Manage class schedules
* Track student enrollments

### For Admins

* Complete user management
* Class and category management
* Trainer management and promotion
* Review moderation
* Contact request management
* Payment verification and approval

## 🔐 Security

* JWT-based authentication
* Role-based access control (USER, USER_BRONZE, USER_GOLD, USER_PLATINUM, TRAINER, ADMIN)
* Password hashing with bcrypt
* Secure API endpoints with middleware protection

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. Please contact the repository owner for contribution guidelines.

## 📞 Support

For issues or questions, please contact the development team.

## 📚 Additional Documentation

* [Backend README](./Fitmat-BackEnd/README.md) - Detailed backend API documentation
* [Frontend Components README](./Fitmat-FrontEnd/components/README.md) - Component structure and usage
* [Frontend Improvements](./Fitmat-FrontEnd/IMPROVEMENTS.md) - Frontend improvement notes




