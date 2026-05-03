export default function ContactsPage() {
  return (
    <article className="max-w-prose animate-fade-in">
      <h1 className="text-3xl font-semibold tracking-tight">Контакты</h1>
      <p className="mt-4 text-muted-foreground">
        Нейтральная заглушка. Замените на реальные каналы поддержки.
      </p>
      <div className="mt-6 space-y-2 text-sm">
        <p>
          Email поддержки:{" "}
          <a className="text-primary underline" href="mailto:support@example.com">
            support@example.com
          </a>
        </p>
        <p>Telegram: @your_support_bot</p>
      </div>
    </article>
  );
}
