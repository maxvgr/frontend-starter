import IMask from 'imask';

// Глобальные маски для телефона
const PHONE_MASKS = {
  7: '+{7} (000) 000-00-00', // Россия
  1: '+{1} (000) 000-0000', // США
  49: '+{49} 0000 0000', // Германия
};

const phoneMasks = new WeakMap();

/**
 * Инициализирует маску для конкретного поля телефона
 */
export function initPhoneMask(phoneInput, countryCode = '7') {
  if (!phoneInput || phoneMasks.has(phoneInput)) {
    return phoneMasks.get(phoneInput);
  }

  const maskController = IMask(phoneInput, {
    mask: PHONE_MASKS[countryCode] || PHONE_MASKS[7],

    dispatch: (appended, dynamicMasked) => {
      const number = (dynamicMasked.value + appended).replaceAll(/\D/g, '');

      if (number.startsWith('8') && number.length === 1) {
        dynamicMasked.value = '+7';
      }

      return dynamicMasked;
    },
  });

  phoneMasks.set(phoneInput, maskController);

  return maskController;
}

/**
 * Обновляет маску телефона при смене страны
 */
export function updatePhoneMask(phoneInput, countryCode) {
  const maskController = phoneMasks.get(phoneInput);

  if (!maskController) {
    console.warn('Маска для поля телефона не найдена');

    return;
  }

  const maskPattern = PHONE_MASKS[countryCode];

  if (!maskPattern) {
    console.warn(`Для кода страны не определена маска телефона: ${countryCode}`);

    return;
  }

  maskController.value = '';
  maskController.updateOptions({ mask: maskPattern });
}

/**
 * @typedef {Object} FormInstance
 * @property {HTMLFormElement} form
 * @property {Object} options
 * @property {HTMLButtonElement} [submit]
 * @property {NodeList} fields
 * @property {HTMLInputElement} [phone]
 * @property {HTMLInputElement} [email]
 * @property {HTMLInputElement} [name]
 * @property {HTMLElement[]} privacy
 * @property {HTMLSelectElement} [country]
 * @property {Object} [nameMask]
 * @property {boolean} validation
 * @property {HTMLElement[]} validationFields
 * @property {boolean} validationAttempted
 * @property {Function} onSubmit
 * @property {Function} onClick
 * @property {Function} onPrivacyChange
 * @property {Function} onCountryChange
 * @property {Function} onFieldInput
 */

/**
 * @typedef {Object} FormOptions
 * @property {string} [selector='.form-custom'] - Селектор форм
 * @property {(form: HTMLFormElement, event: Event) => void} [onSubmit] - Колбэк при сабмите
 * @property {(form: HTMLFormElement) => void} [onReset] - Колбэк при сбросе
 * @property {(form: HTMLFormElement, isValid: boolean) => void} [onValidate] - Колбэк при изменении валидации
 */
export default class Form {
  constructor(options = {}) {
    /** @type {FormOptions} */
    this.options = {
      selector: '.form-custom',
      onSubmit: () => {},
      onReset: () => {},
      onValidate: () => {},
      ...options,
    };

    this.instances = new Map();
    this.init();
  }

  init() {
    this.update();
  }

  update() {
    for (const [form, instance] of this.instances) {
      if (!document.contains(form)) {
        this.destroyInstance(instance);
      }
    }

    const forms = document.querySelectorAll(this.options.selector);

    for (const form of forms) {
      if (this.instances.has(form)) continue;

      const instance = this.createInstance(form);

      if (instance) {
        this.instances.set(form, instance);
      }
    }
  }

  /**
   * Создаёт экземпляр формы
   * @param {HTMLFormElement} form
   * @returns {FormInstance | undefined}
   */
  createInstance(form) {
    if (!form) return;

    const instance = {
      form,
      options: { ...this.options },
      submit: form.querySelector('button[type=submit]'),
      fields: form.querySelectorAll('input, select, textarea'),
      phone: form.querySelector('input[type=tel]'),
      email: form.querySelector('input[type=email]'),
      name: form.querySelector('input[name=user_name]'),
      privacy: [...form.querySelectorAll('[data-privacy]')],
      country: form.querySelector('select[data-target="country"]'),
      nameMask: undefined,
      validation: Object.hasOwn(form.dataset, 'validation'),
      validationFields: [...form.querySelectorAll('[data-validate]')],
      validationAttempted: false,
    };

    instance.onSubmit = (event) => {
      if (instance.validation) {
        instance.validationAttempted = true;

        if (!this.validateInstance(instance)) {
          event.preventDefault();

          return;
        }
      }

      instance.options.onSubmit(instance.form, event);
    };

    instance.onClick = (event) => {
      const button = event.target.closest('.button');

      if (!button) return;

      const action = button.dataset.action;

      if (action === 'reset') {
        event.preventDefault();
        this.resetInstance(instance);
      }
    };

    instance.onPrivacyChange = (event) => {
      if (Object.hasOwn(event.target.dataset, 'privacy')) {
        this.updateSubmitState(instance);
      }
    };

    instance.onCountryChange = () => {
      if (instance.phone) {
        updatePhoneMask(instance.phone, instance.country.value);
      }
    };

    instance.onFieldInput = (event) => {
      if (!instance.validation || !instance.validationAttempted) return;

      const field = event.target.closest('[data-validate]');

      if (!field) return;

      this.validateField(field);
    };

    this.initInstance(instance);

    return instance;
  }

  /**
   * @param {FormInstance} instance
   */
  initInstance(instance) {
    this.initNameMask(instance);
    this.initPhone(instance);
    this.initPrivacyListener(instance);
    this.initValidation(instance);

    if (instance.country) {
      this.initCountrySelect(instance);
    }

    instance.form.addEventListener('submit', instance.onSubmit);
    instance.form.addEventListener('click', instance.onClick);
  }

  initNameMask(instance) {
    if (!instance.name) return;

    instance.nameMask = IMask(instance.name, {
      mask: /^[\sA-Za-zЁА-яё-]+$/,
    });
  }

  initPhone(instance) {
    if (!instance.phone) return;

    const countryCode =
      instance.phone.dataset.countryCode || instance.country?.value || '7';

    initPhoneMask(instance.phone, countryCode);
  }

  initPrivacyListener(instance) {
    if (instance.privacy.length === 0 || !instance.submit) return;

    this.updateSubmitState(instance);
    instance.form.addEventListener('change', instance.onPrivacyChange);
  }

  initValidation(instance) {
    if (!instance.validation) return;

    instance.form.noValidate = true;
    instance.form.addEventListener('input', instance.onFieldInput);
    instance.form.addEventListener('change', instance.onFieldInput);
  }

  validateInstance(instance) {
    let isValid = true;
    let firstInvalidField;

    for (const field of instance.validationFields) {
      if (!this.validateField(field)) {
        isValid = false;

        if (!firstInvalidField) {
          firstInvalidField = field;
        }
      }
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
    }

    instance.options.onValidate(instance.form, isValid);

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    const isCheckable = field.type === 'checkbox' || field.type === 'radio';
    const isEmpty = isCheckable ? !field.checked : value.length === 0;

    let errorMessage = '';

    if (field.required && isEmpty) {
      errorMessage = field.dataset.errorRequired || 'Необходимо заполнить поле';
    } else if (value && field.minLength > 0 && value.length < field.minLength) {
      errorMessage =
        field.dataset.errorMinlength || `Минимум ${field.minLength} символов`;
    } else if (field.type === 'email' && value && !field.validity.valid) {
      errorMessage = field.dataset.errorFormat || 'Неверный формат';
    } else if (
      process.env.NODE_ENV === 'development' &&
      field.dataset.captchaValue &&
      value !== field.dataset.captchaValue
    ) {
      errorMessage = field.dataset.errorCaptcha || 'Неверно указаны символы';
    }

    this.setFieldError(field, errorMessage);

    return errorMessage.length === 0;
  }

  setFieldError(field, message) {
    const wrapper = field.closest('[data-field]');

    if (!wrapper) return;

    let error = wrapper.querySelector('[data-field-error]');

    if (!message) {
      wrapper.classList.remove('is-error');
      field.removeAttribute('aria-invalid');

      if (error) {
        error.remove();
      }

      return;
    }

    wrapper.classList.add('is-error');
    field.setAttribute('aria-invalid', 'true');

    if (!error) {
      error = document.createElement('span');
      error.classList.add('form__error');
      error.dataset.fieldError = '';
      error.setAttribute('role', 'alert');
      wrapper.append(error);
    }

    error.textContent = message;
  }

  clearValidation(instance) {
    instance.validationAttempted = false;

    for (const field of instance.validationFields) {
      this.setFieldError(field, '');
    }
  }

  /**
   * @param {FormInstance} instance
   */
  updateSubmitState(instance) {
    if (!instance.submit) return;

    const allChecked = instance.privacy.every((item) => item.checked);

    instance.submit.disabled = !allChecked;
    instance.options.onValidate(instance.form, allChecked);
  }

  /**
   * @param {FormInstance} instance
   */
  initCountrySelect(instance) {
    instance.country.addEventListener('change', instance.onCountryChange);
  }

  /**
   * @param {FormInstance} instance
   */
  resetInstance(instance) {
    instance.form.reset();

    if (instance.phone && phoneMasks.has(instance.phone)) {
      const mask = phoneMasks.get(instance.phone);

      mask.value = '';
      mask.updateValue();
    }

    this.clearValidation(instance);
    this.updateSubmitState(instance);
    instance.options.onReset(instance.form);
  }

  /**
   * @param {FormInstance} instance
   */
  destroyInstance(instance) {
    if (!instance.form) return;

    instance.form.removeEventListener('submit', instance.onSubmit);
    instance.form.removeEventListener('click', instance.onClick);
    instance.form.removeEventListener('change', instance.onPrivacyChange);
    instance.form.removeEventListener('input', instance.onFieldInput);
    instance.form.removeEventListener('change', instance.onFieldInput);

    if (instance.country) {
      instance.country.removeEventListener('change', instance.onCountryChange);
    }

    if (instance.phone && phoneMasks.has(instance.phone)) {
      const mask = phoneMasks.get(instance.phone);

      mask.destroy();
      phoneMasks.delete(instance.phone);
    }

    if (instance.nameMask) {
      instance.nameMask.destroy();
    }

    this.instances.delete(instance.form);
    instance.form = undefined;
  }

  /**
   * Возвращает экземпляр формы по DOM-элементу
   * @param {HTMLFormElement | string} form - Элемент формы или селектор
   * @returns {FormInstance | undefined}
   */
  get(form) {
    const element =
      typeof form === 'string' ? document.querySelector(form) : form;

    return this.instances.get(element);
  }

  /**
   * Перебирает все формы
   * @param {(instance: FormInstance) => void} callback
   */
  forEach(callback) {
    for (const instance of this.instances.values()) {
      callback(instance);
    }
  }

  destroy() {
    for (const instance of this.instances.values()) {
      this.destroyInstance(instance);
    }
  }
}
