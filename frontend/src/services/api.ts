import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User APIs
export const createUser = async (deviceId: string, prefs?: any) => {
  const response = await api.post('/users', {
    device_id: deviceId,
    ...prefs,
  });
  return response.data;
};

export const getUser = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUser = async (userId: string, prefs: any) => {
  const response = await api.put(`/users/${userId}`, prefs);
  return response.data;
};

// Chat APIs
export const sendChatMessage = async (
  userId: string,
  message: string,
  sessionId?: string,
  imageBase64?: string
) => {
  const response = await api.post('/chat', {
    user_id: userId,
    session_id: sessionId,
    message,
    image_base64: imageBase64,
  });
  return response.data;
};

export const getChatSessions = async (userId: string) => {
  const response = await api.get(`/chat/sessions/${userId}`);
  return response.data;
};

export const getSessionMessages = async (userId: string, sessionId: string) => {
  const response = await api.get(`/chat/sessions/${userId}/${sessionId}`);
  return response.data;
};

export const deleteSession = async (userId: string, sessionId: string) => {
  const response = await api.delete(`/chat/sessions/${userId}/${sessionId}`);
  return response.data;
};

// Scan APIs
export const scanShelf = async (
  userId: string,
  imageBase64: string,
  budget: number,
  currency: string,
  language: string
) => {
  const response = await api.post('/scan/shelf', {
    user_id: userId,
    image_base64: imageBase64,
    budget,
    currency,
    language,
  });
  return response.data;
};

export const getScanHistory = async (userId: string) => {
  const response = await api.get(`/scan/history/${userId}`);
  return response.data;
};

// Voice Chat API
export const sendVoiceChat = async (
  userId: string,
  audioBase64: string,
  sessionId?: string
) => {
  const response = await api.post('/chat/voice', {
    user_id: userId,
    audio_base64: audioBase64,
    session_id: sessionId,
    audio_format: 'wav',
  }, { timeout: 90000 });
  return response.data;
};

// Google Cloud TTS - Wavenet voices for natural human-like speech
export const synthesizeSpeech = async (
  text: string,
  language: string = 'uk-UA'
) => {
  const response = await api.post('/tts/synthesize', {
    text,
    language,
  }, { timeout: 30000 });
  return response.data;
};

export const scanBottle = async (
  userId: string,
  imageBase64: string,
  language: string
) => {
  const response = await api.post('/scan/bottle', null, {
    params: { user_id: userId, image_base64: imageBase64, language },
  });
  return response.data;
};

export default api;
