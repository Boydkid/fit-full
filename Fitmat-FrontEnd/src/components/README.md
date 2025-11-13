# Component Structure

โครงสร้าง component ของ Fitmat Frontend ได้รับการปรับปรุงให้เป็น modular และ reusable components

## โครงสร้างโฟลเดอร์

```
components/
├── common/           # Common UI components
│   ├── Button.tsx    # ปุ่มที่ปรับแต่งได้
│   ├── Input.tsx     # Input field พร้อม validation
│   ├── Card.tsx      # Card container
│   ├── Modal.tsx     # Modal dialog
│   └── index.ts      # Export common components
│
├── Layout/           # Layout components
│   ├── Layout.tsx    # Main layout wrapper
│   ├── Header.tsx    # Navigation header
│   ├── Footer.tsx    # Footer
│   └── index.ts      # Export layout components
│
├── auth/             # Authentication components
│   ├── AuthForm.tsx  # รูปแบบฟอร์ม login/register
│   └── index.ts      # Export auth components
│
├── home/             # Home page components
│   ├── HeroSection.tsx      # Hero section
│   ├── ExpertSection.tsx    # Expert section
│   ├── ReviewsSection.tsx   # Customer reviews
│   ├── PricingSection.tsx   # Pricing plans
│   ├── CTASection.tsx       # Call-to-action
│   └── index.ts      # Export home components
│
├── admin/            # Admin components (existing)
│   └── ...
│
└── index.ts          # Main export file
```

## การใช้งาน

### Common Components

```tsx
import { Button, Input, Card, Modal } from '../components/common';

// Button with variants
<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>

// Input with validation
<Input
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  error={error}
/>

// Card container
<Card hover shadow>
  <h3>Card content</h3>
</Card>

// Modal dialog
<Modal isOpen={isOpen} onClose={onClose} title="Title">
  <p>Modal content</p>
</Modal>
```

### Layout Components

```tsx
import { Layout } from '../components/Layout';

export default function MyPage() {
  return (
    <Layout showHeader={true} showFooter={true}>
      <div>Page content</div>
    </Layout>
  );
}
```

### Home Components

```tsx
import {
  HeroSection,
  ExpertSection,
  ReviewsSection,
  PricingSection,
  CTASection,
} from '../components/home';

export default function Home() {
  return (
    <Layout>
      <HeroSection />
      <ExpertSection />
      <ReviewsSection />
      <PricingSection />
      <CTASection />
    </Layout>
  );
}
```

### Auth Components

```tsx
import { AuthForm } from '../components/auth';

export default function LoginPage() {
  return (
    <AuthForm
      title="Sign in"
      subtitle="Sign in to continue"
      isLogin={true}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      linkText="Create account"
      linkHref="/register"
      linkLabel="Create account"
    />
  );
}
```

## ประโยชน์ของการปรับปรุง

1. **Reusability**: Components สามารถนำไปใช้ซ้ำได้ในหน้าอื่นๆ
2. **Maintainability**: แก้ไขที่เดียว ส่งผลทุกที่ที่ใช้
3. **Consistency**: UI ที่สม่ำเสมอทั่วทั้งแอป
4. **Scalability**: เพิ่ม components ใหม่ได้ง่าย
5. **Type Safety**: TypeScript interfaces สำหรับ props
6. **Performance**: การแยก components ช่วยในการ optimize

## การเพิ่ม Components ใหม่

1. สร้างไฟล์ component ในโฟลเดอร์ที่เหมาะสม
2. เพิ่ม export ใน index.ts ของโฟลเดอร์นั้น
3. เพิ่มใน main index.ts ถ้าจำเป็น
4. ใช้ TypeScript interfaces สำหรับ props
5. เพิ่ม JSDoc comments สำหรับ documentation
