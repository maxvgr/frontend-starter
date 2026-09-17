import { Swiper } from 'swiper';
import { EffectFade } from 'swiper/modules';

export default class Tab {
  constructor(options = {}) {
    this.options = {
      selector: '.b-tabs',
      ...options,
    };

    this.instances = new Map();
    this.init();
  }

  init() {
    this.update();
  }

  update() {
    for (const [el, instance] of this.instances) {
      if (!document.contains(el)) {
        this.destroyInstance(el, instance);
      }
    }

    const tabs = document.querySelectorAll(this.options.selector);

    for (const tab of tabs) {
      if (this.instances.has(tab)) continue;

      const instance = this.createInstance(tab);

      if (instance) {
        this.instances.set(tab, instance);
      }
    }
  }

  createInstance(tab) {
    const swiperEl = tab.querySelector('.swiper');

    if (!swiperEl) return;

    const controls = tab.querySelectorAll('.b-tabs__action button');

    let initialSlide = 0;
    let hasActiveControl = false;

    for (const [index, control] of controls.entries()) {
      if (!control.classList.contains('is-active')) continue;

      initialSlide = index;
      hasActiveControl = true;

      break;
    }

    if (!hasActiveControl && controls[0]) {
      controls[0].classList.add('is-active');
    }

    const slider = new Swiper(swiperEl, {
      modules: [EffectFade],
      slidesPerView: 1,
      spaceBetween: 20,
      speed: 300,
      allowTouchMove: false,
      autoHeight: true,
      initialSlide,

      effect: 'fade',
      fadeEffect: {
        crossFade: true,
      },
    });

    const abortController = new AbortController();
    const { signal } = abortController;

    for (const [index, control] of controls.entries()) {
      control.addEventListener(
        'click',
        () => {
          const currentActive = tab.querySelector(
            '.b-tabs__action .is-active',
          );

          if (currentActive) {
            currentActive.classList.remove('is-active');
          }

          control.classList.add('is-active');
          slider.slideTo(index);
        },
        { signal },
      );
    }

    // Обновление высоты Swiper при открытии/закрытии аккордеона внутри табов
    const accordions = tab.querySelectorAll(
      '.b-accordion__body, .c-accordion__body',
    );

    for (const accordionBody of accordions) {
      accordionBody.addEventListener(
        'dropdownToggleStart',
        () => {
          const duration = 600;
          const startTime = performance.now();

          const updateHeight = (currentTime) => {
            const elapsed = currentTime - startTime;

            if (elapsed < duration) {
              slider.update();
              requestAnimationFrame(updateHeight);
            } else {
              slider.update();
            }
          };

          requestAnimationFrame(updateHeight);
        },
        { signal },
      );
    }

    return {
      el: tab,
      swiperEl,
      slider,
      abortController,
    };
  }

  destroyInstance(el, instance) {
    instance.abortController?.abort();

    if (instance.slider && !instance.slider.destroyed) {
      instance.slider.destroy(true, true);
    }

    this.instances.delete(el);
  }

  destroy() {
    for (const [el, instance] of this.instances) {
      this.destroyInstance(el, instance);
    }
  }
}