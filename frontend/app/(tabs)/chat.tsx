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
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import * as api from '../../src/services/api';

// ============================================
// 🎭 AI ORCHESTRATOR - Voice-to-Voice System
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isVoice?: boolean;
}

// Sommelier system prompt - elite concierge style
const SOMMELIER_PROMPT = `Ти — елітний сомельє-консьєрж з 20-річним стажем у найкращих ресторанах світу. 
Твоя відповідь має бути лаконічною (2-4 речення), теплою та професійною. 
Відповідай тією ж мовою, якою до тебе звернулися.
Якщо питають про їжу — рекомендуй напій. Якщо про напій — рекомендуй страву.
Говори від першої особи, з елегантністю та пристрастю до своєї справи.`;

// TTS Configuration for natural voice
const TTS_CONFIG = {
  rate: 1.0,      // Natural speaking rate
  pitch: 1.1,    // Slightly higher for friendly tone
};

// ============================================
// 🎤 Web Speech Recognition Hook
// ============================================
const useWebSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
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

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
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
      
      const langMap: Record<string, string> = {
        'UK': 'uk-UA',
        'EN': 'en-US', 
        'RU': 'ru-RU',
      };
      recognitionRef.current.lang = langMap[language] || language;
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    isFinal,
    isSupported,
    startListening,
    stopListening,
    reset: () => {
      setTranscript('');
      setInterimTranscript('');
      setIsFinal(false);
    },
  };
};

// ============================================
// 🎵 Animated Voice Button Component
// ============================================
const VoiceButton = ({ 
  isRecording, 
  isProcessing,
  isSpeaking,
  onPress,
  disabled 
}: { 
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulse2Anim = useRef(new Animated.Value(1)).current;
  const pulse3Anim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Triple pulse wave animation
      const createPulse = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(anim, {
                toValue: 1.8,
                duration: 1200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };

      Animated.parallel([
        createPulse(pulseAnim, 0),
        createPulse(pulse2Anim, 400),
        createPulse(pulse3Anim, 800),
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.8, duration: 600, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.05, duration: 300, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 300, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else if (isProcessing) {
      // Processing rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else if (isSpeaking) {
      // Speaking pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      // Reset all
      pulseAnim.setValue(1);
      pulse2Anim.setValue(1);
      pulse3Anim.setValue(1);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [isRecording, isProcessing, isSpeaking]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getIcon = () => {
    if (isProcessing) return 'sparkles';
    if (isSpeaking) return 'volume-high';
    if (isRecording) return 'mic';
    return 'mic-outline';
  };

  const getColor = () => {
    if (isRecording) return Colors.black;
    if (isSpeaking) return Colors.gold;
    return Colors.gold;
  };

  return (
    <View style={styles.voiceButtonWrapper}>
      {/* Pulse rings for recording */}
      {isRecording && (
        <>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: opacityAnim,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              styles.pulseRing2,
              {
                transform: [{ scale: pulse2Anim }],
                opacity: Animated.multiply(opacityAnim, 0.7),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              styles.pulseRing3,
              {
                transform: [{ scale: pulse3Anim }],
                opacity: Animated.multiply(opacityAnim, 0.4),
              },
            ]}
          />
        </>
      )}
      
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
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
            <Ionicons name={getIcon()} size={26} color={getColor()} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ============================================
// 🎭 Main Chat Screen - AI Orchestrator
// ============================================
export default function ChatScreen() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userLanguage, setUserLanguage] = useState('UK');
  const [orchestratorStatus, setOrchestratorStatus] = useState<string>('ready');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Web Speech Recognition
  const {
    isListening,
    transcript,
    interimTranscript,
    isFinal,
    isSupported: webSpeechSupported,
    startListening,
    stopListening,
    reset: resetSpeech,
  } = useWebSpeechRecognition();

  // ============================================
  // 🚀 Initialization
  // ============================================
  useEffect(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      text: 'Вітаю! Я — ваш персональний сомельє.\n\n🎤 Натисніть мікрофон і скажіть запит — я одразу відповім голосом!\n\nНаприклад: "Яке вино до стейку?"',
      timestamp: new Date(),
    }]);

    loadUserPreferences();
    requestPermissions();
  }, []);

  // ============================================
  // 🎵 ORCHESTRATOR: Process voice when final
  // ============================================
  useEffect(() => {
    if (isFinal && transcript && !isProcessingAI) {
      // Voice input received - start orchestration
      runAIOrchestrator(transcript);
      resetSpeech();
    }
  }, [isFinal, transcript]);

  // Show interim transcript in input field
  useEffect(() => {
    if (isListening && interimTranscript) {
      setInputText(interimTranscript);
    }
    if (transcript) {
      setInputText(transcript);
    }
  }, [interimTranscript, transcript, isListening]);

  const loadUserPreferences = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const user = await api.getUser(userId);
        setUserLanguage(user.preferred_language || 'UK');
      }
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Audio.requestPermissionsAsync();
      } catch (error) {
        console.error('Error requesting audio permission:', error);
      }
    }
  };

  // ============================================
  // 🎭 AI ORCHESTRATOR - Main Flow
  // ============================================
  const runAIOrchestrator = async (v_input: string) => {
    if (!v_input.trim()) return;

    console.log('🎭 AI Orchestrator started with:', v_input);
    
    // Stop listening
    setIsRecording(false);
    stopListening();
    
    // Clear input
    setInputText('');
    
    // Step 1: Add user message to chat
    setOrchestratorStatus('thinking');
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: v_input,
      timestamp: new Date(),
      isVoice: true,
    };
    setMessages(prev => [...prev, userMessage]);

    // Step 2: Send to Gemini AI
    setIsProcessingAI(true);
    
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User not found');

      // Call AI with sommelier prompt
      const response = await api.sendChatMessage(
        userId,
        `${SOMMELIER_PROMPT}\n\nЗапит користувача: ${v_input}`,
        sessionId || undefined
      );

      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
      }

      const v_output = response.response;
      console.log('🧠 AI Response:', v_output.substring(0, 100));

      // Step 3: Add AI response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: v_output,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      setIsProcessingAI(false);
      
      // Step 4: Speak the response (TTS)
      setOrchestratorStatus('speaking');
      await speakWithNaturalVoice(v_output);
      
      setOrchestratorStatus('ready');

    } catch (error) {
      console.error('❌ Orchestrator error:', error);
      Alert.alert('Помилка', 'Не вдалося отримати відповідь');
      setIsProcessingAI(false);
      setOrchestratorStatus('ready');
    }
  };

  // ============================================
  // 🔊 TTS - Natural Voice Output
  // ============================================
  const speakWithNaturalVoice = async (v_output: string): Promise<void> => {
    return new Promise((resolve) => {
      // Stop any current speech
      Speech.stop();

      // Detect language
      const detectLanguage = (text: string): string => {
        const hasUkrainian = /[іїєґ]/i.test(text);
        const hasRussian = /[ыэъ]/i.test(text) || /\b(что|как|это|для|или|на|вы|мы)\b/i.test(text);
        const isEnglish = /^[a-zA-Z\s.,!?'"()\-:;]+$/.test(text.substring(0, 100));
        
        if (isEnglish) return 'en-US';
        if (hasRussian && !hasUkrainian) return 'ru-RU';
        return 'uk-UA';
      };

      const language = detectLanguage(v_output);

      // Clean text for natural speech
      const cleanText = v_output
        .replace(/[🍷🌡🍽⭐✨💫🎤🔊🥂🍾]/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove bold
        .replace(/\*([^*]+)\*/g, '$1')       // Remove italic
        .replace(/#{1,3}\s/g, '')            // Remove headers
        .replace(/•\s/g, '')                 // Remove bullets
        .replace(/\n{2,}/g, '. ')            // Double newlines to pause
        .replace(/\n/g, ', ')                // Single newline to comma
        .replace(/\s{2,}/g, ' ')             // Multiple spaces
        .trim()
        .substring(0, 600);                  // Limit length

      console.log('🔊 Speaking:', cleanText.substring(0, 50) + '...');
      
      setIsSpeaking(true);

      Speech.speak(cleanText, {
        language,
        pitch: TTS_CONFIG.pitch,      // 1.1 - friendly tone
        rate: TTS_CONFIG.rate,        // 1.0 - natural speed
        onDone: () => {
          console.log('✅ Speech completed');
          setIsSpeaking(false);
          resolve();
        },
        onError: (error) => {
          console.error('TTS Error:', error);
          setIsSpeaking(false);
          resolve();
        },
        onStopped: () => {
          setIsSpeaking(false);
          resolve();
        },
      });
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
    setOrchestratorStatus('ready');
  };

  // ============================================
  // 🎤 Voice Button Handler
  // ============================================
  const handleVoicePress = () => {
    if (isSpeaking) {
      // If speaking, stop
      stopSpeaking();
      return;
    }
    
    if (isRecording || isListening) {
      // Stop recording
      setIsRecording(false);
      stopListening();
      setOrchestratorStatus('ready');
    } else {
      // Start recording
      if (Platform.OS === 'web' && webSpeechSupported) {
        setIsRecording(true);
        setOrchestratorStatus('listening');
        setInputText('');
        startListening(userLanguage);
      } else {
        Alert.alert(
          'Голосовий ввід',
          'Використайте браузер Chrome для голосового вводу або введіть текст'
        );
      }
    }
  };

  // ============================================
  // 📝 Text Message Handler
  // ============================================
  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User not found');

      const response = await api.sendChatMessage(
        userId,
        text.trim(),
        sessionId || undefined
      );

      if (!sessionId) setSessionId(response.session_id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Помилка', 'Не вдалося отримати відповідь');
    } finally {
      setIsLoading(false);
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
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          text: '📷 Фото для аналізу',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const userId = await AsyncStorage.getItem('userId');
        if (!userId) throw new Error('User not found');

        const response = await api.sendChatMessage(
          userId,
          'Проаналізуй це фото пляшки або полиці і дай рекомендації як сомельє',
          sessionId || undefined,
          result.assets[0].base64
        );

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: response.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);

        // Auto-speak photo analysis
        await speakWithNaturalVoice(response.response);
      }
    } catch (error) {
      console.error('Image error:', error);
      setIsLoading(false);
    }
  };

  // Status display
  const getStatusText = () => {
    switch (orchestratorStatus) {
      case 'listening': return '🎤 Слухаю вас...';
      case 'thinking': return '🧠 Думаю...';
      case 'speaking': return '🔊 Говорю...';
      default: return '● Онлайн';
    }
  };

  const isVoiceActive = isRecording || isListening;
  const showSendButton = inputText.trim() && !isVoiceActive && !isProcessingAI;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[
            styles.avatarContainer,
            isSpeaking && styles.avatarSpeaking,
            isProcessingAI && styles.avatarThinking,
          ]}>
            <Text style={styles.avatarText}>C</Text>
          </Animated.View>
          <View>
            <Text style={styles.headerTitle}>CHEFLY</Text>
            <Text style={[
              styles.headerSubtitle,
              orchestratorStatus !== 'ready' && styles.headerSubtitleActive,
            ]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        {isSpeaking && (
          <TouchableOpacity style={styles.stopButton} onPress={stopSpeaking}>
            <Ionicons name="stop" size={18} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Recording Banner */}
      {isVoiceActive && (
        <View style={styles.recordingBanner}>
          <View style={styles.soundWave}>
            {[1,2,3,4,5].map((i) => (
              <Animated.View 
                key={i} 
                style={[
                  styles.soundBar,
                  { height: 8 + Math.random() * 16 }
                ]} 
              />
            ))}
          </View>
          <Text style={styles.recordingText}>
            Говоріть зараз... Натисніть мікрофон щоб завершити
          </Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
      >
        {messages.map((message) => (
          <View key={message.id}>
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {message.isVoice && (
                <Ionicons 
                  name="mic" 
                  size={14} 
                  color={Colors.goldDark} 
                  style={styles.voiceIcon}
                />
              )}
              <Text style={[
                styles.messageText,
                message.role === 'user' && styles.userMessageText
              ]}>
                {message.text}
              </Text>
            </View>
            {message.role === 'assistant' && (
              <TouchableOpacity
                style={styles.speakBtn}
                onPress={() => speakWithNaturalVoice(message.text)}
              >
                <Ionicons name="volume-medium-outline" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {(isLoading || isProcessingAI) && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.loadingText}>
              {isProcessingAI ? 'Сомельє готує відповідь...' : 'Обробка...'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompts */}
      {messages.length <= 1 && !isVoiceActive && (
        <View style={styles.quickPrompts}>
          {['Вино до стейку', 'Що до сиру?', 'Коктейль на вечір'].map((label, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickPromptBtn}
              onPress={() => runAIOrchestrator(label)}
            >
              <Text style={styles.quickPromptText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={pickAndSendImage}
            disabled={isVoiceActive || isProcessingAI}
          >
            <Ionicons name="camera" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              isVoiceActive && styles.textInputListening,
            ]}
            placeholder={isVoiceActive ? "Слухаю..." : "Напишіть або натисніть 🎤"}
            placeholderTextColor={isVoiceActive ? Colors.gold : Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isVoiceActive && !isProcessingAI}
            onSubmitEditing={() => sendTextMessage(inputText)}
          />
          
          {/* Voice Button - Main Control */}
          <VoiceButton
            isRecording={isVoiceActive}
            isProcessing={isProcessingAI}
            isSpeaking={isSpeaking}
            onPress={handleVoicePress}
            disabled={isLoading}
          />
          
          {/* Send Button */}
          {showSendButton && (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => sendTextMessage(inputText)}
            >
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
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSpeaking: {
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 15,
  },
  avatarThinking: {
    backgroundColor: Colors.goldLight,
  },
  avatarText: {
    color: Colors.black,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Georgia',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerSubtitleActive: {
    color: Colors.gold,
    fontWeight: '600',
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.goldTransparent,
    borderBottomWidth: 1,
    borderBottomColor: Colors.goldTransparent40,
    gap: 12,
  },
  soundWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  soundBar: {
    width: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  recordingText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.gold,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    borderBottomLeftRadius: 4,
  },
  voiceIcon: {
    marginRight: 6,
    marginTop: 3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
    flex: 1,
  },
  userMessageText: {
    color: Colors.black,
  },
  speakBtn: {
    alignSelf: 'flex-start',
    padding: 6,
    marginBottom: 10,
    marginLeft: 10,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    padding: 14,
    borderRadius: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.gold,
    fontStyle: 'italic',
  },
  quickPrompts: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  quickPromptBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.goldTransparent40,
  },
  quickPromptText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  textInputListening: {
    borderWidth: 1,
    borderColor: Colors.gold,
    backgroundColor: Colors.goldTransparent,
  },
  voiceButtonWrapper: {
    width: 58,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.gold,
  },
  pulseRing2: {
    backgroundColor: Colors.goldLight,
  },
  pulseRing3: {
    backgroundColor: Colors.goldDark,
  },
  voiceButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  voiceButtonRecording: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  voiceButtonProcessing: {
    borderColor: Colors.gold,
    borderWidth: 2,
  },
  voiceButtonSpeaking: {
    backgroundColor: Colors.goldTransparent,
    borderColor: Colors.gold,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
