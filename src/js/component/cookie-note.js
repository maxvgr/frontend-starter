import Cookies from 'js-cookie';

export default class CookieNote {
  constructor(options = {}) {
    this.options = {
      selector: '[data-cookie-note]',
      acceptSelector: '[data-cookie-accept]',
      cookieName: 'cookie_consent',
      cookieValue: 'accepted',
      expires: 365,
      visibleClass: 'is-show',
      ...options,
    };

    this.element = document.querySelector(this.options.selector);

    if (!this.element) return;

    this.acceptButton = this.element.querySelector(this.options.acceptSelector);
    this.onAccept = () => this.accept();

    this.init();
  }

  init() {
    if (this.hasConsent()) {
      this.hide();
      return;
    }

    if (this.acceptButton) {
      this.acceptButton.addEventListener('click', this.onAccept);
    }

    this.show();
  }

  hasConsent() {
    return Cookies.get(this.options.cookieName) === this.options.cookieValue;
  }

  accept() {
    Cookies.set(this.options.cookieName, this.options.cookieValue, {
      expires: this.options.expires,
      path: '/',
      sameSite: 'Lax',
      secure: window.location.protocol === 'https:',
    });

    this.hide();

    window.dispatchEvent(new CustomEvent('cookieConsentAccepted', {
      detail: {
        cookieName: this.options.cookieName,
        cookieValue: this.options.cookieValue,
      },
    }));
  }

  show() {
    if (!this.element) return;

    this.element.hidden = false;
    this.element.classList.add(this.options.visibleClass);
  }

  hide() {
    if (!this.element) return;

    this.element.classList.remove(this.options.visibleClass);
    this.element.hidden = true;
  }

  reset() {
    Cookies.remove(this.options.cookieName, {
      path: '/',
    });

    this.show();
  }

  destroy() {
    if (this.acceptButton) {
      this.acceptButton.removeEventListener('click', this.onAccept);
    }
  }
}
