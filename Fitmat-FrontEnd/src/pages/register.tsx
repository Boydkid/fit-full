import { useState } from "react";
import { useRouter } from "next/router";
import AuthForm from "../../components/auth/AuthForm";
import { register } from "../utils/auth";

type RegisterResponse = {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
  message?: string;
};

type ErrorResponse = {
  message?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      router.push("/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach server. Please try again.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm
      title="Create account"
      subtitle="Create your account"
      isLogin={false}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      loading={loading}
      error={err}
      onSubmit={handleSubmit}
      linkText="Already have an account?"
      linkHref="/login"
      linkLabel="Sign in"
    />
  );
}
