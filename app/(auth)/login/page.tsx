import { login } from "@/actions/auth";
import LoginForm from "./login-form";

export const metadata = { title: "Connexion · medmed" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">medmed</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Apprentissage de la médecine générale.
          </p>
        </header>
        <LoginForm action={login} />
      </div>
    </main>
  );
}
