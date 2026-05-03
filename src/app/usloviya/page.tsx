export default function TermsPage() {
  return (
    <article className="max-w-prose animate-fade-in">
      <h1 className="text-3xl font-semibold tracking-tight">Условия использования</h1>
      <p className="text-muted-foreground">
        Этот текст — нейтральная заглушка и не является юридической консультацией.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-muted-foreground">
        <li>Сервис предоставляет интерфейс для оформления заказов на цифровые товары Telegram.</li>
        <li>Оплата и выдача регламентируются отдельными правилами платёжных систем и Fragment.</li>
        <li>Пользователь обязан указывать корректный Telegram username получателя.</li>
        <li>Администратор может связаться по контактам из раздела «Контакты».</li>
      </ul>
    </article>
  );
}
