import { createContext, useContext, useState, type ReactNode } from "react";
import { translations, type Locale, type Translations } from "@/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  t: Translations;
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  t: translations.en,
  toggleLocale: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  const toggleLocale = () => setLocale((l) => (l === "en" ? "fr" : "en"));

  return (
    <LanguageContext.Provider
      value={{ locale, t: translations[locale], toggleLocale }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
