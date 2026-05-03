import Link from "next/link";
import { readUserSession } from "@/lib/user-auth";

export async function SiteHeader() {
  const session = await readUserSession();

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Stars Shop
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Link href="/katalog" className="hover:text-foreground">
            Каталог
          </Link>
          <Link href="/kontakty" className="hover:text-foreground">
            Контакты
          </Link>
          {session?.role === "USER" ? (
            <>
              <Link href="/kabinet" className="hover:text-foreground">
                Личный кабинет
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-foreground">
                Вход
              </Link>
              <Link href="/register" className="hover:text-foreground">
                Регистрация
              </Link>
            </>
          )}
          <Link
            href="/admin"
            className="rounded-md border px-2 py-1 text-xs hover:text-foreground"
          >
            Админ
          </Link>
        </nav>
      </div>
    </header>
  );
}
