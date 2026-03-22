import { I18nService } from 'nestjs-i18n';

let i18nInstance: I18nService;

export function setI18nInstance(instance: I18nService): void {
  i18nInstance = instance;
}

export function t(key: string, lang = 'en'): string {
  const result = i18nInstance.translate(key, { lang });
  return typeof result === 'string' ? result : key;
}
