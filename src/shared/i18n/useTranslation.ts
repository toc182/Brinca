import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Thin wrapper around react-i18next's useTranslation.
 * Provides the `t` function for accessing translation keys.
 */
export function useTranslation() {
  const { t, i18n } = useI18nTranslation();
  return { t, i18n, locale: i18n.language };
}
