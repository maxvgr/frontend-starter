/* Прописываются все инициализации и первичные параметры для скриптов */

// import ScrollTop from '../utils/scroll-top';
// import Gallery from '../component/gallery';
// import Tab from '../component/tabs';
// import CookieNote from '../component/cookie-note';

import LazyLoad from 'vanilla-lazyload';
import Modal from '../component/modal';
import Submenu from '../component/submenu';
import Accordion from '../component/accordion';
import Form from '../component/form';
import NumberInput from '../component/input';

import { PlayVideoInViewport } from '../utils/video-optimization';

window.App = window.App || {};

/* --------- */

document.addEventListener('DOMContentLoaded', () => {
  window.App.lazyImage = new LazyLoad({
    elements_selector: '.lazy__item:not([data-custom-lazy])',

    callback_loaded: (trigger) => {
      const container = trigger.closest('.lazy');

      if (container) {
        container.classList.remove('lazy--preloader');
      }
    },
  });

  window.App.lazyBackground = new LazyLoad({
    elements_selector: '.lazy-simple',
  });

  window.App.modal = new Modal({
    activeClass: 'is-show',
    scrollLockClass: 'is-scroll-locked',
    scrollLock: true,

    closeOnEsc: true,
    closeOnOverlay: true,
    catchFocus: true,

    awaitCloseAnimation: true,

    modalSelector: 'data-modal',
    openSelector: 'data-modal-open',
    closeSelector: 'data-modal-close',

    onShow: () => {},
    onClose: () => {},
    onCloseAll: () => {},
  });

  window.App.submenu = new Submenu({
    single: false,
    duration: 300,
  });

  window.App.accordion = new Accordion({
    single: false,
    duration: 600,
  });

  window.App.form = new Form();

  window.addEventListener('formSuccess', (event) => {
    const form = event.detail?.form;
    const successModal =
      event.detail?.successModal || form?.dataset.successModal;

    if (!successModal || !window.App.modal) return;

    window.App.modal.close();
    window.App.modal.open(successModal);
  });

  window.App.numberInput = new NumberInput();

  // window.App.gallery = new Gallery();
  // window.App.tab = new Tab();
  // window.App.scrollTop = new ScrollTop();
  // window.App.cookieNote = new CookieNote();

  PlayVideoInViewport();
});

/* --------- */
