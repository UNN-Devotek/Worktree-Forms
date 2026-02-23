import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Default locale — can be extended to read from user preferences or URL
  const locale = 'en';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
