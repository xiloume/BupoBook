import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300">
          Inscris-toi
        </Link>
      </p>
    </div>
  );
}
