import { Suspense } from "react";
import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export const metadata = { title: "Inscription" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold">Inscription</h1>
      <Suspense>
        <RegisterForm />
      </Suspense>
      <a
        href="/api/auth/hub"
        className="mt-6 block w-full rounded-md border border-amber-500/40 bg-amber-500/10 py-2.5 text-center text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
      >
        Continuer avec BupoHub
      </a>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
          Connecte-toi
        </Link>
      </p>
    </div>
  );
}
