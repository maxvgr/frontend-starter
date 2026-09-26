/**
 * Управление модальными окнами: открытие, закрытие, блокировка скролла, ловушка фокуса
 */
export class Modal {
  /**
   * @typedef {Object} ModalOptions
   * @property {string} [activeClass='is-show'] - CSS-класс, включающий видимость модалки
   * @property {string} [scrollLockClass='is-scroll-locked'] - CSS-класс, блокирующий скролл страницы
   * @property {boolean} [scrollLock=true] - Блокировать ли скролл при открытии
   * @property {string} [modalSelector='data-modal'] - Data-атрибут для идентификации модального окна
   * @property {boolean} [closeOnEsc=true] - Закрывать модалку по Escape
   * @property {boolean} [closeOnOverlay=true] - Закрывать по клику на оверлей
   * @property {boolean} [catchFocus=true] - Удерживать фокус внутри открытой модалки
   * @property {boolean} [awaitCloseAnimation=false] - Ждать ли окончания CSS-перехода перед разблокировкой скролла
   * @property {(modal: HTMLElement) => void} [onBeforeOpen=() => {}] - Коллбэк перед открытием
   * @property {(modal: HTMLElement) => void} [onShow=() => {}] - Коллбэк при открытии
   * @property {(modal: HTMLElement) => void} [onBeforeClose=() => {}] - Коллбэк перед закрытием
   * @property {(modal: HTMLElement) => void} [onClose=() => {}] - Коллбэк при закрытии
   * @property {() => void} [onCloseAll=() => {}] - Коллбэк при закрытии всех модалок
   * @property {string} [openSelector='data-modal-open'] - Data-атрибут триггера открытия
   * @property {string} [closeSelector='data-modal-close'] - Data-атрибут триггера закрытия
   */
  /**
   * @param {ModalOptions} [options] - Параметры инициализации
   */
  constructor(options = {}) {
    this.options = {
      activeClass: 'is-show',
      scrollLockClass: 'is-scroll-locked',
      scrollLock: true,
      modalSelector: 'data-modal',
      closeOnEsc: true,
      closeOnOverlay: true,
      catchFocus: true,
      awaitCloseAnimation: false,
      onBeforeOpen: () => { },
      onShow: () => { },
      onBeforeClose: () => { },
      onClose: () => { },
      onCloseAll: () => { },
      openSelector: 'data-modal-open',
      closeSelector: 'data-modal-close',
      ...options,
    };

    this.openedModals = [];
    this.unlockTimeout = undefined;
    this.init();
  }

  /**
   * Навешивает глобальные обработчики открытия, закрытия и Escape
   */
  init() {
    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('keydown', this.onDocumentKeydown);
  }

  onDocumentClick = (event) => {
    const openTrigger = event.target.closest(`[${this.options.openSelector}]`);
    if (openTrigger) {
      event.preventDefault();
      const modalId = openTrigger.getAttribute(this.options.openSelector);

      window.dispatchEvent(new CustomEvent('modalBeforeOpen', {
        detail: { modalId, trigger: openTrigger }
      }));

      this.open(modalId, openTrigger);
      return;
    }

    const closeTrigger = event.target.closest(`[${this.options.closeSelector}]`);
    if (closeTrigger) {
      event.preventDefault();
      const modalId = closeTrigger.getAttribute(this.options.closeSelector);
      this.close(modalId || undefined);
      return;
    }

    if (this.options.closeOnOverlay && event.target.classList.contains('modal__overlay')) {
      this.close();
    }
  };

  onDocumentKeydown = (event) => {
    if (this.openedModals.length === 0) return;

    if (event.key === 'Escape' && this.options.closeOnEsc) {
      this.close();
      return;
    }

    if (event.key === 'Tab' && this.options.catchFocus) {
      this.handleFocusTrap(event);
    }
  };

  handleFocusTrap(e) {
    const currentModal = this.openedModals.at(-1);
    if (!currentModal) return;

    const focusables = this.getFocusableElements(currentModal);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables.at(-1);

    if (e.shiftKey && (document.activeElement === first || !currentModal.contains(document.activeElement))) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && (document.activeElement === last || !currentModal.contains(document.activeElement))) {
      first.focus();
      e.preventDefault();
    }
  }

  getFocusableElements(container) {
    return [...container.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
    )].filter((el) => el.tabIndex !== -1 && el.offsetWidth > 0 && el.offsetHeight > 0);
  }

  /**
   * Открывает модальное окно по ID
   * @param {string} modalId - Идентификатор модалки
   * @param {HTMLElement} [triggerElement] - Элемент, вызвавший открытие
   */
  open(modalId, triggerElement) {
    const modal = document.querySelector(`[${this.options.modalSelector}="${modalId}"]`);
    if (!modal) {
      console.warn(`[Modal]: Модальное окно с ID "${modalId}" не найдено.`);
      return;
    }

    this.options.onBeforeOpen(modal);

    // Отменяем отложенную разблокировку скролла, если открываем новую модалку
    if (this.unlockTimeout) {
      clearTimeout(this.unlockTimeout);
      this.unlockTimeout = undefined;
    }

    modal.classList.add(this.options.activeClass);
    modal.setAttribute('aria-hidden', 'false');
    this.openedModals.push(modal);

    if (this.options.catchFocus) {
      modal.previousActiveElement = document.activeElement;
      requestAnimationFrame(() => {
        const focusables = this.getFocusableElements(modal);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          modal.setAttribute('tabindex', '-1');
          modal.focus();
        }
      });
    }

    window.dispatchEvent(new CustomEvent('modalOpened', {
      detail: { modalId, modal, trigger: triggerElement }
    }));

    this.options.onShow(modal);

    if (this.openedModals.length === 1) {
      this.lockScroll();
    }
  }

  /**
   * Корректный расчёт длительности transition с учётом 's' и 'ms'
   */
  getTransitionDuration(element) {
    if (!element) return 0;
    const target = element.querySelector('.modal__overlay') || element;
    const durationStyle = window.getComputedStyle(target).transitionDuration;

    if (!durationStyle) return 0;

    // Берем максимальную длительность, если передано несколько свойств через запятую
    const durations = durationStyle.split(',').map((dur) => {
      const trimmed = dur.trim();
      if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed) || 0;
      if (trimmed.endsWith('s')) return (Number.parseFloat(trimmed) || 0) * 1000;
      return 0;
    });

    return Math.max(...durations, 0);
  }

  /**
   * Закрывает одну модалку или последнюю открытую
   * @param {string} [modalId] - ID модалки для закрытия
   */
  close(modalId) {
    if (this.openedModals.length === 0) return;

    let modal;

    if (modalId) {
      modal = document.querySelector(`[${this.options.modalSelector}="${modalId}"]`);
      if (!modal) return;

      const modalIndex = this.openedModals.indexOf(modal);
      if (modalIndex === -1) return;

      this.openedModals.splice(modalIndex, 1);
    } else {
      modal = this.openedModals.pop();
    }

    this.options.onBeforeClose(modal);
    modal.classList.remove(this.options.activeClass);
    modal.setAttribute('aria-hidden', 'true');

    if (this.options.catchFocus && modal.previousActiveElement?.focus) {
      modal.previousActiveElement.focus();
    }

    this.options.onClose(modal);

    window.dispatchEvent(new CustomEvent('modalClosed', {
      detail: { modal }
    }));

    if (this.openedModals.length === 0) {
      this.handleFinalClose(modal);
    }
  }

  /**
   * Закрывает все открытые модальные окна
   */
  closeAll() {
    if (this.openedModals.length === 0) return;

    const lastModal = this.openedModals.at(-1);

    while (this.openedModals.length > 0) {
      const modal = this.openedModals.pop();
      modal.classList.remove(this.options.activeClass);
      modal.setAttribute('aria-hidden', 'true');

      window.dispatchEvent(new CustomEvent('modalClosed', {
        detail: { modal }
      }));
    }

    this.handleFinalClose(lastModal);
  }

  handleFinalClose(lastModal) {
    const finalize = () => {
      this.unlockScroll();
      if (typeof this.options.onCloseAll === 'function') {
        this.options.onCloseAll();
      }
    };

    if (this.options.awaitCloseAnimation && lastModal) {
      const durationMs = this.getTransitionDuration(lastModal);
      if (durationMs > 0) {
        this.unlockTimeout = setTimeout(finalize, durationMs);
      } else {
        finalize();
      }
    } else {
      finalize();
    }
  }

  /**
   * Блокирует скролл страницы и компенсирует ширину скроллбара
   */
  lockScroll() {
    if (!this.options.scrollLock) return;

    // Компенсация ширины скроллбара во избежание сдвига страницы (Layout Shift)
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.classList.add(this.options.scrollLockClass);
  }

  /**
   * Разблокирует скролл страницы
   */
  unlockScroll() {
    if (!this.options.scrollLock) return;

    document.body.classList.remove(this.options.scrollLockClass);
    document.body.style.paddingRight = '';
  }

  /**
   * Уничтожает экземпляр и удаляет глобальные обработчики
   */
  destroy() {
    this.closeAll();

    if (this.unlockTimeout) {
      clearTimeout(this.unlockTimeout);
      this.unlockTimeout = undefined;
    }

    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onDocumentKeydown);
  }
}

export default Modal;
