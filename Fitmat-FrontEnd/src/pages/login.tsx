import { useState } from "react";
import { useRouter } from "next/router";
import AuthForm from "../components/auth/AuthForm";
import { login, setAuth } from "../utils/auth";

type LoginResponse = {
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      const data = await login(email, password);
      
      setAuth(data.token, data.user.role);
      router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach server. Please try again.";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

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
      error={err}
      onSubmit={handleSubmit}
      linkText="Create account"
      linkHref="/register"
      linkLabel="Create account"
    />
  );
}
