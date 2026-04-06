import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'UK' | 'EN' | 'RU';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  UK: {
    // Chat Screen
    chat_title: 'CHEFLY',
    chat_ready: '● Готовий',
    chat_listening: '🎤 Слухаю...',
    chat_thinking: '🧠 Думаю...',
    chat_speaking: '🔊 Говорю...',
    chat_placeholder: 'Напишіть або 🎤',
    chat_listening_placeholder: 'Слухаю...',
    chat_sommelier_thinking: 'Сомельє думає...',
    chat_speaking_now: 'Говоріть зараз...',
    chat_welcome: 'Вітаю! Я ваш персональний сомельє.\n\n🎤 Натисніть мікрофон → скажіть запит → я ОДРАЗУ відповім живим голосом!',
    chat_voice_browser: 'Використайте браузер Chrome',
    chat_error: 'Помилка',
    chat_error_message: 'Не вдалося обробити запит',
    
    // Scanner Screen
    scanner_title: 'SHELF SCANNER',
    scanner_budget_label: 'ПОТОЧНИЙ БЮДЖЕТ',
    scanner_budget_hint: 'Знайти пляшки в межах вашого бюджету',
    scanner_placeholder: 'Наведіть камеру на полицю з вином',
    scanner_analyzing: 'Аналізую...',
    scanner_analyze: 'Аналізувати полицю',
    scanner_reset: 'Скинути',
    scanner_gallery: 'Галерея',
    scanner_camera: 'Камера',
    scanner_tips_title: 'ПРОТОКОЛ СКАНУВАННЯ',
    scanner_tip_1: 'Тримайте камеру стабільно для кращих результатів',
    scanner_tip_2: 'Забезпечте хороше освітлення',
    scanner_tip_3: 'Уникайте відблисків на склі',
    scanner_tip_4: 'Тримайте етикетку в центрі кадру',
    scanner_permission_error: 'Потрібен дозвіл',
    scanner_error: 'Помилка',
    scanner_error_message: 'Не вдалося проаналізувати. Спробуйте ще раз.',
    scanner_user_not_found: 'Користувача не знайдено',
    
    // Profile Screen
    profile_title: 'Profile',
    profile_premium_member: 'PREMIUM MEMBER',
    profile_unlimited_scans: 'Unlimited AI Scans',
    profile_valid_until: 'Valid until Oct 2026',
    profile_preferences: 'НАЛАШТУВАННЯ',
    profile_budget_label: 'Стандартний бюджет',
    profile_budget_hint: 'Цей бюджет буде використовуватися за замовчуванням для всіх сканувань полиць.',
    profile_currency: 'Валюта',
    profile_language: 'Мова',
    profile_account_security: 'АККАУНТ І БЕЗПЕКА',
    profile_scan_history: 'Історія сканувань',
    profile_scan_history_subtitle: 'Переглянути попередні рекомендації',
    profile_notifications: 'Сповіщення',
    profile_notifications_subtitle: 'Щоденні поради та сповіщення',
    profile_privacy: 'Конфіденційність і безпека',
    profile_privacy_subtitle: 'Керуйте своїми даними',
    profile_support: 'Підтримка',
    profile_support_subtitle: "Зв'яжіться з вашим консьєржем",
    profile_save_settings: 'Зберегти налаштування',
    profile_sign_out: 'Вийти',
    profile_settings_saved: 'Збережено',
    profile_settings_saved_message: 'Налаштування збережено',
    profile_error: 'Помилка',
    profile_error_message: 'Не вдалося зберегти',
    profile_logout_title: 'Вихід',
    profile_logout_message: 'Ви впевнені, що хочете вийти?',
    profile_cancel: 'Скасувати',
    profile_logout: 'Вийти',
    
    // Quick Actions
    quick_wine_to_steak: 'Вино до стейку',
    quick_wine_to_cheese: 'Що до сиру?',
    quick_cocktail: 'Коктейль',
  },
  EN: {
    // Chat Screen
    chat_title: 'CHEFLY',
    chat_ready: '● Ready',
    chat_listening: '🎤 Listening...',
    chat_thinking: '🧠 Thinking...',
    chat_speaking: '🔊 Speaking...',
    chat_placeholder: 'Type or 🎤',
    chat_listening_placeholder: 'Listening...',
    chat_sommelier_thinking: 'Sommelier is thinking...',
    chat_speaking_now: 'Speak now...',
    chat_welcome: 'Welcome! I am your personal sommelier.\n\n🎤 Press microphone → speak your request → I will respond immediately with live voice!',
    chat_voice_browser: 'Use Chrome browser',
    chat_error: 'Error',
    chat_error_message: 'Failed to process request',
    
    // Scanner Screen
    scanner_title: 'SHELF SCANNER',
    scanner_budget_label: 'CURRENT BUDGET',
    scanner_budget_hint: 'Find bottles within your range',
    scanner_placeholder: 'Point camera at wine shelf',
    scanner_analyzing: 'Analyzing...',
    scanner_analyze: 'Analyze Shelf',
    scanner_reset: 'Reset',
    scanner_gallery: 'Gallery',
    scanner_camera: 'Camera',
    scanner_tips_title: 'SCANNING PROTOCOL',
    scanner_tip_1: 'Hold camera steady for best results',
    scanner_tip_2: 'Ensure good lighting conditions',
    scanner_tip_3: 'Avoid reflections on glass',
    scanner_tip_4: 'Keep the label centered in frame',
    scanner_permission_error: 'Permission is required',
    scanner_error: 'Error',
    scanner_error_message: 'Failed to analyze. Please try again.',
    scanner_user_not_found: 'User not found',
    
    // Profile Screen
    profile_title: 'Profile',
    profile_premium_member: 'PREMIUM MEMBER',
    profile_unlimited_scans: 'Unlimited AI Scans',
    profile_valid_until: 'Valid until Oct 2026',
    profile_preferences: 'PREFERENCES',
    profile_budget_label: 'Default Budget',
    profile_budget_hint: 'This budget will be used as a default filter for all shelf scans.',
    profile_currency: 'Currency',
    profile_language: 'Language',
    profile_account_security: 'ACCOUNT & SECURITY',
    profile_scan_history: 'Scan History',
    profile_scan_history_subtitle: 'View your previous recommendations',
    profile_notifications: 'Notifications',
    profile_notifications_subtitle: 'Daily pairing tips & alerts',
    profile_privacy: 'Privacy & Security',
    profile_privacy_subtitle: 'Manage your data and personal',
    profile_support: 'Support',
    profile_support_subtitle: 'Contact your personal concierge',
    profile_save_settings: 'Save Settings',
    profile_sign_out: 'Sign Out',
    profile_settings_saved: 'Saved',
    profile_settings_saved_message: 'Settings saved',
    profile_error: 'Error',
    profile_error_message: 'Failed to save',
    profile_logout_title: 'Sign Out',
    profile_logout_message: 'Are you sure you want to sign out?',
    profile_cancel: 'Cancel',
    profile_logout: 'Sign Out',
    
    // Quick Actions
    quick_wine_to_steak: 'Wine for steak',
    quick_wine_to_cheese: 'What for cheese?',
    quick_cocktail: 'Cocktail',
  },
  RU: {
    // Chat Screen
    chat_title: 'CHEFLY',
    chat_ready: '● Готов',
    chat_listening: '🎤 Слушаю...',
    chat_thinking: '🧠 Думаю...',
    chat_speaking: '🔊 Говорю...',
    chat_placeholder: 'Напишите или 🎤',
    chat_listening_placeholder: 'Слушаю...',
    chat_sommelier_thinking: 'Сомелье думает...',
    chat_speaking_now: 'Говорите сейчас...',
    chat_welcome: 'Приветствую! Я ваш персональный сомелье.\n\n🎤 Нажмите микрофон → скажите запрос → я СРАЗУ отвечу живым голосом!',
    chat_voice_browser: 'Используйте браузер Chrome',
    chat_error: 'Ошибка',
    chat_error_message: 'Не удалось обработать запрос',
    
    // Scanner Screen
    scanner_title: 'SHELF SCANNER',
    scanner_budget_label: 'ТЕКУЩИЙ БЮДЖЕТ',
    scanner_budget_hint: 'Найти бутылки в пределах вашего бюджета',
    scanner_placeholder: 'Наведите камеру на полку с вином',
    scanner_analyzing: 'Анализирую...',
    scanner_analyze: 'Анализировать полку',
    scanner_reset: 'Сбросить',
    scanner_gallery: 'Галерея',
    scanner_camera: 'Камера',
    scanner_tips_title: 'ПРОТОКОЛ СКАНИРОВАНИЯ',
    scanner_tip_1: 'Держите камеру стабильно для лучших результатов',
    scanner_tip_2: 'Обеспечьте хорошее освещение',
    scanner_tip_3: 'Избегайте отблесков на стекле',
    scanner_tip_4: 'Держите этикетку в центре кадра',
    scanner_permission_error: 'Требуется разрешение',
    scanner_error: 'Ошибка',
    scanner_error_message: 'Не удалось проанализировать. Попробуйте еще раз.',
    scanner_user_not_found: 'Пользователь не найден',
    
    // Profile Screen
    profile_title: 'Profile',
    profile_premium_member: 'PREMIUM MEMBER',
    profile_unlimited_scans: 'Unlimited AI Scans',
    profile_valid_until: 'Valid until Oct 2026',
    profile_preferences: 'НАСТРОЙКИ',
    profile_budget_label: 'Стандартный бюджет',
    profile_budget_hint: 'Этот бюджет будет использоваться по умолчанию для всех сканирований полок.',
    profile_currency: 'Валюта',
    profile_language: 'Язык',
    profile_account_security: 'АККАУНТ И БЕЗОПАСНОСТЬ',
    profile_scan_history: 'История сканирований',
    profile_scan_history_subtitle: 'Просмотреть предыдущие рекомендации',
    profile_notifications: 'Уведомления',
    profile_notifications_subtitle: 'Ежедневные советы и уведомления',
    profile_privacy: 'Конфиденциальность и безопасность',
    profile_privacy_subtitle: 'Управляйте своими данными',
    profile_support: 'Поддержка',
    profile_support_subtitle: 'Свяжитесь с вашим консьержем',
    profile_save_settings: 'Сохранить настройки',
    profile_sign_out: 'Выйти',
    profile_settings_saved: 'Сохранено',
    profile_settings_saved_message: 'Настройки сохранены',
    profile_error: 'Ошибка',
    profile_error_message: 'Не удалось сохранить',
    profile_logout_title: 'Выход',
    profile_logout_message: 'Вы уверены, что хотите выйти?',
    profile_cancel: 'Отменить',
    profile_logout: 'Выйти',
    
    // Quick Actions
    quick_wine_to_steak: 'Вино к стейку',
    quick_wine_to_cheese: 'Что к сыру?',
    quick_cocktail: 'Коктейль',
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

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['UK']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
