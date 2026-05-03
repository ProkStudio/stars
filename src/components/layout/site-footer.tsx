import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Stars Shop. Цены в ₽, хранение — в копейках.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/usloviya" className="hover:text-foreground">
            Условия
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Конфиденциальность
          </Link>
          <Link href="/kontakty" className="hover:text-foreground">
            Контакты
          </Link>
        </div>
      </div>
    </footer>
  );
}
