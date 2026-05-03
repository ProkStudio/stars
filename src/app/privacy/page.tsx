export default function PrivacyPage() {
  return (
    <article className="max-w-prose animate-fade-in">
      <h1 className="text-3xl font-semibold tracking-tight">
        Политика конфиденциальности
      </h1>
      <p className="text-muted-foreground">
        Заглушка для MVP. Не является юридическим документом.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm text-muted-foreground">
        <li>Мы не храним данные банковских карт на своих серверах до подключения эквайринга.</li>
        <li>Telegram username и сведения о заказе используются для исполнения заказа.</li>
        <li>Технические логи могут содержать идентификаторы заказов без секретов Fragment.</li>
        <li>По вопросам данных свяжитесь через раздел «Контакты».</li>
      </ul>
    </article>
  );
}
