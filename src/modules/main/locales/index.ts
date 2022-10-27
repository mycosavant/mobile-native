import {
  useTranslation as useAppTranslation,
  UseTranslationOptions,
} from 'react-i18next';
import i18n from 'utils/locales';

import en from './es';
import es from './en';

const NAME_SPACE = 'mainModule';

export const useTranslation = (options?: UseTranslationOptions) =>
  useAppTranslation(NAME_SPACE, options);

export default i18n
  .addResourceBundle('en', NAME_SPACE, en)
  .addResourceBundle('es', NAME_SPACE, es);
