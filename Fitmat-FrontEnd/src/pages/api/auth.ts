import type { NextApiRequest, NextApiResponse } from "next";

const RAW_BASE_URL =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "${process.env.NEXT_PUBLIC_API_URL}/api";

const API_BASE_URL = RAW_BASE_URL.endsWith("/")
  ? RAW_BASE_URL.slice(0, -1)
  : RAW_BASE_URL;

const normalizePath = (path: string) =>
  path.startsWith("/") ? path : `/${path}`;

type LoginPayload = {
  email?: string;
  password?: string;
};

type RegisterPayload = LoginPayload;

type AuthAction = "login" | "register" | "logout";

type AuthRequestBody = {
  action?: AuthAction;
  payload?: LoginPayload | RegisterPayload;
};

async function forwardPost<TPayload extends object>(
  path: string,
  payload: TPayload
) {
  const response = await fetch(
    `${API_BASE_URL}${normalizePath(path)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message ?? "Request failed";
    throw new Error(message);
  }

  return { status: response.status, data } as const;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { action, payload } = (req.body ?? {}) as AuthRequestBody;

  if (!action) {
    return res
      .status(400)
      .json({ message: "Missing auth action." });
  }

  try {
    if (action === "login") {
      const { email, password } = (payload ?? {}) as LoginPayload;
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required." });
      }

      const result = await forwardPost("/login", { email, password });
      return res.status(result.status).json(result.data);
    }

    if (action === "register") {
      const { email, password } = (payload ?? {}) as RegisterPayload;
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required." });
      }

      const result = await forwardPost("/register", { email, password });
      return res.status(result.status).json(result.data);
    }

    if (action === "logout") {
      // Stateless JWT logout simply responds success so client can clear credentials.
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ message: "Unsupported auth action." });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unexpected server error." });
  }
}
