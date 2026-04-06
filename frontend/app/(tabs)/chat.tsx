import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import * as api from '../../src/services/api';
import { useLanguage } from '../../src/contexts/LanguageContext';

// ============================================
// 🎭 VOICE-TO-VOICE AI SOMMELIER
// Using Google Cloud TTS Wavenet for human-like voice
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isVoice?: boolean;
  quick_replies?: string[];
}

// ============================================
// 🎤 Web Speech Recognition
// ============================================
const useWebSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                                 (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              final += result[0].transcript;
              setIsFinal(true);
            } else {
              interim += result[0].transcript;
            }
          }
          
          if (final) {
            setTranscript(final);
            setInterimTranscript('');
          } else {
            setInterimTranscript(interim);
          }
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
          setIsListening(false);
          setIsFinal(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startListening = useCallback((language: string = 'uk-UA') => {
    if (recognitionRef.current && isSupported) {
      setTranscript('');
      setInterimTranscript('');
      setIsFinal(false);
      
      const langMap: Record<string, string> = { 'UK': 'uk-UA', 'EN': 'en-US', 'RU': 'ru-RU' };
      recognitionRef.current.lang = langMap[language] || language;
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition start failed');
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening, transcript, interimTranscript, isFinal, isSupported,
    startListening, stopListening,
    reset: () => { setTranscript(''); setInterimTranscript(''); setIsFinal(false); },
  };
};

// ============================================
// 🔊 Google Cloud TTS Audio Player
// ============================================
const useGoogleTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const playAudio = async (audioBase64: string): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        // Cleanup previous sound
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Create and play sound from base64
        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/mp3;base64,${audioBase64}` },
          { shouldPlay: true, volume: 1.0 }
        );

        soundRef.current = sound;
        setIsPlaying(true);

        // Listen for playback completion
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            resolve();
          }
        });

      } catch (error) {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        resolve();
      }
    });
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  return { isPlaying, playAudio, stopAudio };
};

// ============================================
// 🎵 Animated Voice Button
// ============================================
const VoiceButton = ({ 
  isRecording, isProcessing, isSpeaking, onPress, disabled 
}: { 
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.parallel([
        Animated.loop(Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.6, duration: 400, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
        ])),
      ]).start();
    } else if (isProcessing) {
      Animated.loop(Animated.timing(rotateAnim, { 
        toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true 
      })).start();
    } else if (isSpeaking) {
      Animated.loop(Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ])).start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [isRecording, isProcessing, isSpeaking]);

  const rotation = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.voiceButtonWrapper}>
      {isRecording && (
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: opacityAnim }]} />
      )}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.voiceButton,
            isRecording && styles.voiceButtonRecording,
            isProcessing && styles.voiceButtonProcessing,
            isSpeaking && styles.voiceButtonSpeaking,
          ]}
          onPress={onPress}
          disabled={disabled || isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons name="sparkles" size={26} color={Colors.gold} />
            </Animated.View>
          ) : (
            <Ionicons
              name={isSpeaking ? 'volume-high' : isRecording ? 'mic' : 'mic-outline'}
              size={26}
              color={isRecording ? Colors.black : Colors.gold}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ============================================
// 🎭 Main Chat Screen
// ============================================
export default function ChatScreen() {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [status, setStatus] = useState<string>('ready');
  
  const scrollViewRef = useRef<ScrollView>(null);

  const { isListening, transcript, interimTranscript, isFinal, isSupported, startListening, stopListening, reset } = useWebSpeechRecognition();
  const { isPlaying, playAudio, stopAudio } = useGoogleTTS();

  useEffect(() => {
    const welcomeMsg = t('chat_welcome');
    setMessages([{
      id: '1',
      role: 'assistant',
      text: welcomeMsg,
      timestamp: new Date(),
    }]);
  }, [language]);

  // Auto-process when speech recognition is final - SEAMLESS VOICE-TO-VOICE
  useEffect(() => {
    if (isFinal && transcript && !isProcessingAI) {
      runVoiceToVoice(transcript);
      reset();
    }
  }, [isFinal, transcript]);

  // Show interim transcript
  useEffect(() => {
    if (isListening && interimTranscript) setInputText(interimTranscript);
    if (transcript) setInputText(transcript);
  }, [interimTranscript, transcript, isListening]);

  // ============================================
  // 🎭 VOICE-TO-VOICE ORCHESTRATOR - SEAMLESS AUTOMATIC FLOW
  // ============================================
  const runVoiceToVoice = async (user_query: string) => {
    if (!user_query.trim()) return;

    console.log('🎤 Voice Input:', user_query);
    
    // Stop listening
    setIsRecording(false);
    stopListening();
    setInputText('');
    
    // 1. Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: user_query,
      timestamp: new Date(),
      isVoice: true,
    };
    setMessages(prev => [...prev, userMessage]);
    
    // 2. Process with Gemini
    setIsProcessingAI(true);
    setStatus('thinking');
    
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User not found');

      // Send to Gemini AI (backend now handles language and budget)
      const aiResponse = await api.sendChatMessage(
        userId,
        user_query,
        sessionId || undefined
      );

      if (!sessionId && aiResponse.session_id) setSessionId(aiResponse.session_id);

      const ai_answer = aiResponse.response;
      const quick_replies = aiResponse.quick_replies || [];
      console.log('🧠 AI Answer:', ai_answer.substring(0, 100));

      // 3. Add AI response to chat with quick replies
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: ai_answer,
        timestamp: new Date(),
        quick_replies: quick_replies,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessingAI(false);

      // 4. Map TTS language from global language setting
      const ttsLangMap: Record<string, string> = { 'UK': 'uk-UA', 'EN': 'en-US', 'RU': 'ru-RU' };
      const ttsLanguage = ttsLangMap[language] || 'uk-UA';

      // Neural voice names per language for expo-speech fallback
      const neuralVoiceMap: Record<string, string> = {
        'uk-UA': 'uk-ua-x-hie-network',
        'en-US': 'en-us-x-sfg-network',
        'ru-RU': 'ru-ru-x-ruc-network',
      };

      // 5. AUTOMATIC TTS - Call Google Cloud TTS with Wavenet voice (fallback to expo-speech with neural voice)
      setStatus('speaking');
      console.log('🔊 Requesting Google TTS...');
      
      try {
        const ttsResponse = await api.synthesizeSpeech(ai_answer, ttsLanguage);
        
        if (ttsResponse.audio_base64 && ttsResponse.success) {
          console.log('🔊 Playing Wavenet audio automatically...');
          await playAudio(ttsResponse.audio_base64);
        } else {
          // Fallback to expo-speech with neural voice
          console.log('🔊 Fallback to expo-speech with neural voice');
          const Speech = require('expo-speech');
          const langMap: Record<string, string> = { 'uk-UA': 'uk', 'en-US': 'en', 'ru-RU': 'ru' };
          const cleanText = ai_answer.replace(/\*\*/g, '').replace(/[🍷🌡🍽⭐✨💫🎤🔊🥂🍾🍇🍎📷#•]/g, '').substring(0, 400);
          await new Promise<void>((resolve) => {
            Speech.speak(cleanText, {
              language: langMap[ttsLanguage] || 'uk',
              voice: neuralVoiceMap[ttsLanguage] || undefined,
              pitch: 1.1,
              rate: 1.05,
              onDone: resolve,
              onError: () => resolve(),
            });
          });
        }
      } catch (ttsError) {
        console.log('TTS error, using neural fallback:', ttsError);
        const Speech = require('expo-speech');
        const langMap: Record<string, string> = { 'uk-UA': 'uk', 'en-US': 'en', 'ru-RU': 'ru' };
        const cleanText = ai_answer.replace(/\*\*/g, '').replace(/[🍷🌡🍽⭐✨💫🎤🔊🥂🍾🍇🍎📷#•]/g, '').substring(0, 400);
        try {
          await new Promise<void>((resolve) => {
            Speech.speak(cleanText, {
              language: langMap[ttsLanguage] || 'uk',
              voice: neuralVoiceMap[ttsLanguage] || undefined,
              pitch: 1.1,
              rate: 1.05,
              onDone: resolve,
              onError: () => resolve(),
            });
          });
        } catch (e) { /* silent fail */ }
      }

      setStatus('ready');

    } catch (error) {
      console.error('❌ Voice-to-Voice error:', error);
      Alert.alert(t('chat_error'), t('chat_error_message'));
      setIsProcessingAI(false);
      setStatus('ready');
    }
  };

  // ============================================
  // 🎤 Voice Button Handler
  // ============================================
  const handleVoicePress = () => {
    if (isPlaying) {
      stopAudio();
      setStatus('ready');
      return;
    }
    
    if (isRecording || isListening) {
      setIsRecording(false);
      stopListening();
      setStatus('ready');
    } else {
      if (Platform.OS === 'web' && isSupported) {
        setIsRecording(true);
        setStatus('listening');
        setInputText('');
        startListening(language);
      } else {
        Alert.alert(t('chat_voice_browser'), t('chat_voice_browser'));
      }
    }
  };

  // ============================================
  // 📝 Text Message Handler
  // ============================================
  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    }]);
    setInputText('');
    setIsProcessingAI(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User not found');

      const response = await api.sendChatMessage(userId, text.trim(), sessionId || undefined);
      if (!sessionId) setSessionId(response.session_id);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.response,
        timestamp: new Date(),
        quick_replies: response.quick_replies || [],
      }]);
    } catch (error) {
      Alert.alert(t('chat_error'), t('chat_error_message'));
    } finally {
      setIsProcessingAI(false);
    }
  };

  // ============================================
  // 📷 Image Handler
  // ============================================
  const pickAndSendImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: 'user', text: '📷 Фото', timestamp: new Date(),
        }]);
        setIsProcessingAI(true);

        const userId = await AsyncStorage.getItem('userId');
        if (!userId) throw new Error('User not found');

        const response = await api.sendChatMessage(
          userId, 'Проаналізуй фото і дай коротку рекомендацію',
          sessionId || undefined, result.assets[0].base64
        );

        const aiText = response.response;
        const quick_replies = response.quick_replies || [];
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          text: aiText, 
          timestamp: new Date(),
          quick_replies: quick_replies,
        }]);
        setIsProcessingAI(false);

        // Auto-speak with fallback using global language
        const ttsLang: Record<string, string> = { 'UK': 'uk-UA', 'EN': 'en-US', 'RU': 'ru-RU' };
        const imgTtsLang = ttsLang[language] || 'uk-UA';
        const imgNeuralVoice: Record<string, string> = {
          'uk-UA': 'uk-ua-x-hie-network',
          'en-US': 'en-us-x-sfg-network',
          'ru-RU': 'ru-ru-x-ruc-network',
        };
        try {
          const ttsResponse = await api.synthesizeSpeech(aiText, imgTtsLang);
          if (ttsResponse.audio_base64 && ttsResponse.success) {
            await playAudio(ttsResponse.audio_base64);
          } else {
            const Speech = require('expo-speech');
            const cleanText = aiText.replace(/\*\*/g, '').replace(/[🍷🌡🍽⭐✨💫📷#•]/g, '').substring(0, 400);
            Speech.speak(cleanText, { language: imgTtsLang.split('-')[0], voice: imgNeuralVoice[imgTtsLang] || undefined, pitch: 1.1, rate: 1.05 });
          }
        } catch (e) { /* silent TTS fail */ }
      }
    } catch (error) {
      setIsProcessingAI(false);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening': return t('chat_listening');
      case 'thinking': return t('chat_thinking');
      case 'speaking': return t('chat_speaking');
      default: return t('chat_ready');
    }
  };

  const isVoiceActive = isRecording || isListening;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.avatar, isPlaying && styles.avatarSpeaking]}>
            <Text style={styles.avatarText}>C</Text>
          </Animated.View>
          <View>
            <Text style={styles.headerTitle}>{t('chat_title')}</Text>
            <Text style={[styles.headerSubtitle, status !== 'ready' && styles.activeStatus]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        {isPlaying && (
          <TouchableOpacity style={styles.stopBtn} onPress={stopAudio}>
            <Ionicons name="stop" size={18} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Recording Banner */}
      {isVoiceActive && (
        <View style={styles.recordingBanner}>
          <View style={styles.soundWave}>
            {[1,2,3,4,5].map(i => <View key={i} style={[styles.soundBar, { height: 6 + Math.random() * 16 }]} />)}
          </View>
          <Text style={styles.recordingText}>{t('chat_speaking_now')}</Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {messages.map(msg => (
          <View key={msg.id}>
            <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.isVoice && <Ionicons name="mic" size={14} color={Colors.goldDark} style={styles.voiceIcon} />}
              <Text style={[styles.bubbleText, msg.role === 'user' && styles.userText]}>{msg.text}</Text>
            </View>
            
            {/* Quick Action Buttons (Contextual Suggestions) */}
            {msg.role === 'assistant' && msg.quick_replies && msg.quick_replies.length > 0 && (
              <View style={styles.quickRepliesContainer}>
                {msg.quick_replies.map((reply, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickReplyBtn}
                    onPress={() => sendTextMessage(reply)}
                    disabled={isProcessingAI || isVoiceActive}
                  >
                    <Ionicons name="sparkles-outline" size={14} color={Colors.gold} />
                    <Text style={styles.quickReplyText}>{reply}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
        {isProcessingAI && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.loadingText}>{t('chat_sommelier_thinking')}</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompts */}
      {messages.length <= 1 && !isVoiceActive && (
        <View style={styles.quickPrompts}>
          {[t('quick_wine_to_steak'), t('quick_wine_to_cheese'), t('quick_cocktail')].map((label, i) => (
            <TouchableOpacity key={i} style={styles.promptBtn} onPress={() => runVoiceToVoice(label)}>
              <Text style={styles.promptText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.cameraBtn} onPress={pickAndSendImage} disabled={isVoiceActive || isProcessingAI}>
            <Ionicons name="camera" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.textInput, isVoiceActive && styles.textInputActive]}
            placeholder={isVoiceActive ? t('chat_listening_placeholder') : t('chat_placeholder')}
            placeholderTextColor={isVoiceActive ? Colors.gold : Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isVoiceActive && !isProcessingAI}
          />
          
          <VoiceButton
            isRecording={isVoiceActive}
            isProcessing={isProcessingAI}
            isSpeaking={isPlaying}
            onPress={handleVoicePress}
            disabled={false}
          />
          
          {inputText.trim() && !isVoiceActive && !isProcessingAI && (
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendTextMessage(inputText)}>
              <Ionicons name="send" size={20} color={Colors.black} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================
// 🎨 Styles
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarSpeaking: {
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 20, elevation: 20,
  },
  avatarText: { color: Colors.black, fontSize: 20, fontWeight: '900', fontFamily: 'Georgia' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 1 },
  headerSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  activeStatus: { color: Colors.gold, fontWeight: '600' },
  stopBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.error,
  },
  recordingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, backgroundColor: Colors.goldTransparent, gap: 12,
  },
  soundWave: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  soundBar: { width: 3, backgroundColor: Colors.gold, borderRadius: 2 },
  recordingText: { fontSize: 13, color: Colors.gold, fontWeight: '500' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  bubble: { maxWidth: '85%', padding: 14, borderRadius: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Colors.gold, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: Colors.surfaceElevated, borderBottomLeftRadius: 4 },
  voiceIcon: { marginRight: 6, marginTop: 3 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: Colors.textPrimary, flex: 1 },
  userText: { color: Colors.black },
  loadingBubble: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceElevated, padding: 14, borderRadius: 20, gap: 10,
  },
  loadingText: { fontSize: 14, color: Colors.gold, fontStyle: 'italic' },
  quickRepliesContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginTop: 8, 
    marginLeft: 8,
    marginBottom: 8,
  },
  quickReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold,
    gap: 6,
  },
  quickReplyText: {
    fontSize: 12,
    color: Colors.gold,
    fontWeight: '500',
  },
  quickPrompts: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  promptBtn: {
    backgroundColor: Colors.surfaceElevated, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.goldTransparent40,
  },
  promptText: { fontSize: 13, color: Colors.gold, fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8,
  },
  cameraBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  textInput: {
    flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: Colors.surfaceElevated,
    borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary,
  },
  textInputActive: { borderWidth: 1, borderColor: Colors.gold, backgroundColor: Colors.goldTransparent },
  voiceButtonWrapper: { width: 58, height: 58, justifyContent: 'center', alignItems: 'center' },
  pulseRing: { position: 'absolute', width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.gold },
  voiceButton: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.gold,
  },
  voiceButtonRecording: {
    backgroundColor: Colors.gold, borderColor: Colors.gold,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15,
  },
  voiceButtonProcessing: { borderColor: Colors.gold, borderWidth: 2 },
  voiceButtonSpeaking: { backgroundColor: Colors.goldTransparent, borderColor: Colors.gold },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center' },
});
