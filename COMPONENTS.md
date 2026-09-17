# Компоненты Frontend Starter

Краткая документация по основным JavaScript-компонентам starter.

Большинство базовых компонентов инициализируются в:

```text
src/js/global/init.js
```

Экземпляры доступны через глобальный объект:

```js
window.App
```

## Modal

Файл:

```text
src/js/component/modal.js
```

Базовая разметка:

```html
<div class="modal" data-modal="callback">
  <div class="modal__overlay">
    <div class="modal__container">
      <button type="button" data-modal-close>
        Закрыть
      </button>

      Контент
    </div>
  </div>
</div>
```

Открытие:

```html
<button type="button" data-modal-open="callback">
  Открыть
</button>
```

Закрытие:

```html
<button type="button" data-modal-close>
  Закрыть
</button>
```

Программное управление:

```js
window.App.modal.open('callback');
window.App.modal.close();
window.App.modal.close('callback');
window.App.modal.closeAll();
```

Основные опции:

```js
new Modal({
  activeClass: 'is-show',
  scrollLockClass: 'is-scroll-locked',
  scrollLock: true,

  closeOnEsc: true,
  closeOnOverlay: true,
  catchFocus: true,

  awaitCloseAnimation: false,

  modalSelector: 'data-modal',
  openSelector: 'data-modal-open',
  closeSelector: 'data-modal-close',

  onBeforeOpen: () => {},
  onShow: () => {},
  onBeforeClose: () => {},
  onClose: () => {},
  onCloseAll: () => {},
});
```

События:

```text
modalBeforeOpen
modalOpened
modalClosed
```

Пример:

```js
window.addEventListener('modalOpened', (event) => {
  console.log(event.detail.modalId);
});
```

Компонент:

- блокирует скролл страницы;
- компенсирует ширину scrollbar;
- поддерживает Escape;
- поддерживает закрытие по overlay;
- удерживает клавиатурный фокус внутри модального окна;
- возвращает фокус на предыдущий элемент после закрытия.

---

## Submenu

Файл:

```text
src/js/component/submenu.js
```

Компонент работает с элементами:

```html
<li class="nav__submenu">
  <div class="nav__item-header">
    <a class="nav__link" href="/">
      Раздел
    </a>
  </div>

  <ul>
    <li>
      <a href="/">Пункт</a>
    </li>
  </ul>
</li>
```

Базовая инициализация:

```js
new Submenu({
  single: false,
  duration: 300,
});
```

Опция:

```js
single: true
```

оставляет открытым только одно соседнее подменю.

Методы:

```js
window.App.submenu.open('.nav__submenu');
window.App.submenu.close('.nav__submenu');
window.App.submenu.toggle('.nav__submenu');
window.App.submenu.closeAll();
window.App.submenu.update();
```

Callbacks:

```js
new Submenu({
  onOpen: (menu) => {},
  onClose: (menu) => {},
  onToggle: (menu, isOpen) => {},
});
```

`update()` используется после динамического добавления новых элементов меню.

---

## Accordion

Файл:

```text
src/js/component/accordion.js
```

Базовая структура:

```html
<div class="c-accordion">
  <button class="c-accordion__header" type="button">
    Заголовок
  </button>

  <div class="c-accordion__body">
    Контент
  </div>
</div>
```

Базовая инициализация:

```js
new Accordion({
  single: false,
  duration: 600,
});
```

Можно изменить селекторы:

```js
new Accordion({
  accordionSelector: '.my-accordion',
  headerSelector: '.my-accordion__header',
  bodySelector: '.my-accordion__body',
});
```

Методы:

```js
window.App.accordion.open('.c-accordion');
window.App.accordion.close('.c-accordion');
window.App.accordion.toggle('.c-accordion');
window.App.accordion.closeAll();
window.App.accordion.update();
```

Callbacks:

```js
new Accordion({
  onBeforeOpen: (accordion, body) => {},
  onOpen: (accordion, body) => {},
  onBeforeClose: (accordion, body) => {},
  onClose: (accordion, body) => {},
});
```

При:

```js
single: true
```

открытие одного аккордеона закрывает остальные.

---

## Form

Файл:

```text
src/js/component/form.js
```

Компонент подключён по умолчанию:

```js
window.App.form = new Form();
```

Для включения кастомной валидации:

```html
<form data-validation>
```

Поля для проверки:

```html
<input data-validate required />
```

После успешной отправки используется событие:

```text
formSuccess
```

Если у формы указан:

```html
data-success-modal="success"
```

глобальная логика может закрыть текущую модалку и открыть модалку успешной отправки.

Подробнее о backend-интеграции:

```text
BACKEND.md
```

---

## NumberInput

Файл:

```text
src/js/component/input.js
```

Инициализируется глобально:

```js
window.App.numberInput = new NumberInput();
```

Используется для интерфейсов изменения числового значения.

---

## Lazy Load

Используется:

```text
vanilla-lazyload
```

Доступны два экземпляра:

```js
window.App.lazyImage
window.App.lazyBackground
```

Изображения:

```html
<picture class="lazy">
  <img
    class="lazy__item"
    data-src="image.jpg"
    alt=""
  />
</picture>
```

Фоновые элементы:

```html
<div
  class="lazy-simple"
  data-bg="image.jpg"
></div>
```

---

## Gallery

Файл:

```text
src/js/component/gallery.js
```

Компонент находится в starter, но по умолчанию отключён.

Для включения в `src/js/global/init.js`:

```js
import Gallery from '../component/gallery';

window.App.gallery = new Gallery();
```

Для мобильного свайпа основной галереи используется модификатор:

```html
b-gallery--mobile-swipe
```

Без модификатора стандартное поведение галереи не меняется.

---

## Tabs

Файл:

```text
src/js/component/tabs.js
```

Компонент находится в starter, но по умолчанию отключён.

Для включения:

```js
import Tab from '../component/tabs';

window.App.tab = new Tab();
```

Начальная вкладка определяется по:

```text
is-active
```

Если активная вкладка не задана, используется первая.

---

## CookieNote

Файл:

```text
src/js/component/cookie-note.js
```

Cookie notice подготовлен, но по умолчанию отключён.

Для включения:

```js
import CookieNote from '../component/cookie-note';

window.App.cookieNote = new CookieNote();
```

Компонент использует:

```text
js-cookie
```

и предназначен для простого уведомления о cookie.

Это не полноценная CMP-система с категориями согласия.

---

## Глобальный App

В стандартной конфигурации доступны:

```js
window.App.lazyImage
window.App.lazyBackground
window.App.modal
window.App.submenu
window.App.accordion
window.App.form
window.App.numberInput
```

Опционально:

```js
window.App.gallery
window.App.tab
window.App.cookieNote
window.App.scrollTop
```

Не следует добавлять в `window.App` проектную бизнес-логику без необходимости.

---

## Общий принцип

Компоненты starter должны:

- быть универсальными;
- не зависеть от контента конкретного проекта;
- не содержать проектных цветов и бизнес-правил;
- поддерживать повторную инициализацию там, где появляется динамический DOM;
- по возможности оставаться отключёнными, если не нужны конкретному проекту.

Основные правила разработки находятся в:

```text
AGENTS.md
```

Backend-интеграция:

```text
BACKEND.md
```