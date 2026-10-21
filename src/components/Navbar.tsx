import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/roles";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-5 px-4">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-emerald-400">
          BupoBook
        </Link>
        <Link href="/series" className="text-sm text-zinc-300 hover:text-white">
          Séries
        </Link>
        {user && (
          <Link href="/library" className="text-sm text-zinc-300 hover:text-white">
            Ma bibliothèque
          </Link>
        )}
        {user && canAccessAdmin(user.role) && (
          <Link href="/admin" className="text-sm font-medium text-amber-400 hover:text-amber-300">
            Admin
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-zinc-400 sm:inline">{user.username}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-zinc-300 hover:text-white">
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
