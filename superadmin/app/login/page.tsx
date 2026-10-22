import AuthForm from "../components/AuthForm";
import { backendEnabled } from "../lib/backend/client";

export const dynamic = "force-dynamic";

export default function Login() {
  return <AuthForm notice={backendEnabled() ? undefined : "API_URL is not set. Add it to .env.local (including /api/v1) and restart the app before signing in."} />;
}
