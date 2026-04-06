import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'UK' | 'EN' | 'RU';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  UK: {
    // Tabs
    tab_home: 'Головна',
    tab_scanner: 'Сканер',
    tab_chat: 'Чат',
    tab_history: 'Історія',
    tab_profile: 'Профіль',
    
    // Scanner
    scanner_title: 'СКАНЕР ПОЛИЦЬ',
    scanner_grant_permission: 'Надати дозвіл камери',
    scanner_permission_needed: 'Для сканування потрібен доступ до камери',
    scanner_budget: 'БЮДЖЕТ',
    scanner_capture: 'Зробити фото',
    scanner_analyze: 'Аналізувати',
    scanner_analyzing: 'Аналізую...',
    scanner_reset: 'Скинути',
    
    // Chat
    chat_title: 'CHEFLY AI',
    chat_ready: '● Готовий',
    chat_listening: '🎤 Слухаю...',
    chat_thinking: '🧠 Думаю...',
    chat_speaking: '🔊 Говорю...',
    chat_placeholder: 'Напишіть повідомлення...',
    chat_welcome: 'Вітаю! Я ваш AI сомельє. Запитайте мене про вино! 🍷',
    
    // Profile
    profile_title: 'Профіль',
    profile_budget: 'Бюджет',
    profile_language: 'Мова',
    profile_save: 'Зберегти',
    profile_logout: 'Вийти',
  },
  EN: {
    // Tabs
    tab_home: 'Home',
    tab_scanner: 'Scanner',
    tab_chat: 'Chat',
    tab_history: 'History',
    tab_profile: 'Profile',
    
    // Scanner
    scanner_title: 'SHELF SCANNER',
    scanner_grant_permission: 'Grant Camera Permission',
    scanner_permission_needed: 'Camera access is required for scanning',
    scanner_budget: 'BUDGET',
    scanner_capture: 'Capture',
    scanner_analyze: 'Analyze',
    scanner_analyzing: 'Analyzing...',
    scanner_reset: 'Reset',
    
    // Chat
    chat_title: 'CHEFLY AI',
    chat_ready: '● Ready',
    chat_listening: '🎤 Listening...',
    chat_thinking: '🧠 Thinking...',
    chat_speaking: '🔊 Speaking...',
    chat_placeholder: 'Type a message...',
    chat_welcome: 'Welcome! I am your AI sommelier. Ask me about wine! 🍷',
    
    // Profile
    profile_title: 'Profile',
    profile_budget: 'Budget',
    profile_language: 'Language',
    profile_save: 'Save',
    profile_logout: 'Logout',
  },
  RU: {
    // Tabs
    tab_home: 'Главная',
    tab_scanner: 'Сканер',
    tab_chat: 'Чат',
    tab_history: 'История',
    tab_profile: 'Профиль',
    
    // Scanner
    scanner_title: 'СКАНЕР ПОЛОК',
    scanner_grant_permission: 'Предоставить разрешение камеры',
    scanner_permission_needed: 'Для сканирования требуется доступ к камере',
    scanner_budget: 'БЮДЖЕТ',
    scanner_capture: 'Сделать фото',
    scanner_analyze: 'Анализировать',
    scanner_analyzing: 'Анализирую...',
    scanner_reset: 'Сбросить',
    
    // Chat
    chat_title: 'CHEFLY AI',
    chat_ready: '● Готов',
    chat_listening: '🎤 Слушаю...',
    chat_thinking: '🧠 Думаю...',
    chat_speaking: '🔊 Говорю...',
    chat_placeholder: 'Напишите сообщение...',
    chat_welcome: 'Приветствую! Я ваш AI сомелье. Спросите меня о вине! 🍷',
    
    // Profile
    profile_title: 'Профиль',
    profile_budget: 'Бюджет',
    profile_language: 'Язык',
    profile_save: 'Сохранить',
    profile_logout: 'Выйти',
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('UK');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('userLanguage');
      if (saved && (saved === 'UK' || saved === 'EN' || saved === 'RU')) {
        setLanguageState(saved as Language);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('userLanguage', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const t = (key: string, lang: Language): string => {
  return (translations[lang] as any)[key] || key;
};
