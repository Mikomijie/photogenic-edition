import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// AI-powered language detection and translation hook
export function useTranslation() {
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const languageRef = useRef<string | null>(null);

  const detectAndTranslate = useCallback(async (
    botMessage: string,
    userMessage: string
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: {
          botMessage,
          userMessage,
          detectedLanguage: null, // First detection
        },
      });

      if (error) {
        console.error('Translation error:', error);
        return botMessage;
      }

      if (data?.language) {
        setDetectedLanguage(data.language);
        languageRef.current = data.language;
      }

      return data?.translatedMessage || botMessage;
    } catch (err) {
      console.error('Translation failed:', err);
      return botMessage;
    }
  }, []);

  const translate = useCallback(async (botMessage: string): Promise<string> => {
    const lang = languageRef.current;
    if (!lang || lang === 'en') return botMessage;

    try {
      const { data, error } = await supabase.functions.invoke('translate-message', {
        body: {
          botMessage,
          detectedLanguage: lang,
        },
      });

      if (error) {
        console.error('Translation error:', error);
        return botMessage;
      }

      return data?.translatedMessage || botMessage;
    } catch (err) {
      console.error('Translation failed:', err);
      return botMessage;
    }
  }, []);

  const resetLanguage = useCallback(() => {
    setDetectedLanguage(null);
    languageRef.current = null;
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setDetectedLanguage(lang);
    languageRef.current = lang;
  }, []);

  return {
    detectedLanguage,
    detectAndTranslate,
    translate,
    resetLanguage,
    setLanguage,
  };
}
