import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import { DarkCard } from '../../src/components/DarkCard';
import * as api from '../../src/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isVoice?: boolean;
}

const QUICK_PROMPTS = [
  { label: 'Підбери до стейку', icon: 'restaurant' as const },
  { label: 'Вино до 500₴', icon: 'cash' as const },
  { label: 'Що до сиру?', icon: 'nutrition' as const },
];

// Voice recording component with pulse animation
const VoiceButton = ({ 
  isRecording, 
  onPressIn, 
  onPressOut,
  disabled 
}: { 
  isRecording: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  disabled?: boolean;
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0);
    }
  }, [isRecording]);

  return (
    <View style={styles.voiceButtonContainer}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.voiceButton,
          isRecording && styles.voiceButtonActive,
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isRecording ? 'mic' : 'mic-outline'}
          size={24}
          color={isRecording ? Colors.black : Colors.gold}
        />
      </TouchableOpacity>
    </View>
  );
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Initial greeting
    setMessages([{
      id: '1',
      role: 'assistant',
      text: 'Добрий вечір! Я — ваш приватний сомельє. Чим можу допомогти сьогодні?\n\nЗапитайте мене про:\n• Підбір вина до страви\n• Рекомендації в межах бюджету\n• Страви до вашого напою\n\n🎤 Натисніть і утримуйте мікрофон для голосового запиту',
      timestamp: new Date(),
    }]);

    // Request audio permissions
    requestAudioPermission();
  }, []);

  const requestAudioPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Audio permission not granted');
      }
    } catch (error) {
      console.error('Error requesting audio permission:', error);
    }
  };

  const startRecording = async () => {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Помилка', 'Не вдалося почати запис');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      console.log('Recording stopped, URI:', uri);
      
      setRecording(null);

      if (uri) {
        await processVoiceMessage(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const processVoiceMessage = async (audioUri: string) => {
    try {
      setIsLoading(true);
      
      // For now, we'll use a simulated transcription
      // In production, you'd send the audio to a transcription service
      // Since Web Speech API isn't available in React Native, we'll use the chat endpoint
      
      // Create a voice message placeholder
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: '🎤 Голосове повідомлення (обробляється...)',
        timestamp: new Date(),
        isVoice: true,
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Since we can't do STT natively without external service,
      // we'll prompt the user to type or use a fallback
      // For demo purposes, let's send a default voice query
      
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not found');
      }

      // Send a general voice query to AI
      const response = await api.sendChatMessage(
        userId,
        'Користувач надіслав голосове повідомлення. Привітайся та запитай чим можеш допомогти з вибором напою чи страви.',
        sessionId || undefined
      );

      if (!sessionId) {
        setSessionId(response.session_id);
      }

      // Update the user message
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, text: '🎤 Голосовий запит' }
          : msg
      ));

      // Add AI response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response
      speakResponse(response.response);

    } catch (error) {
      console.error('Voice processing error:', error);
      Alert.alert('Помилка', 'Не вдалося обробити голосове повідомлення');
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text: string) => {
    // Detect language for TTS
    const isEnglish = /^[a-zA-Z\s.,!?'"()-]+$/.test(text.substring(0, 50));
    const isRussian = /[а-яА-ЯёЁ]/.test(text) && /\b(что|как|это|для|или|на)\b/i.test(text);
    
    let language = 'uk-UA'; // Default Ukrainian
    if (isEnglish) language = 'en-US';
    else if (isRussian) language = 'ru-RU';

    // Clean text for speech
    const cleanText = text
      .replace(/[🍷🌡🍽⭐✨]/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n+/g, '. ')
      .substring(0, 500); // Limit for TTS

    setIsSpeaking(true);
    
    Speech.speak(cleanText, {
      language,
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const sendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim() || 'Проаналізуй це фото',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not found');
      }

      const response = await api.sendChatMessage(
        userId,
        text.trim() || 'Проаналізуй це фото і дай рекомендації як сомельє',
        sessionId || undefined,
        imageBase64
      );

      if (!sessionId) {
        setSessionId(response.session_id);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak response if it was a voice conversation
      // speakResponse(response.response);
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Помилка', 'Не вдалося отримати відповідь');
    } finally {
      setIsLoading(false);
    }
  };

  const pickAndSendImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        await sendMessage(inputText, result.assets[0].base64);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>C</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>CHEFLY</Text>
            <View style={styles.statusRow}>
              <View style={[
                styles.statusDot,
                isSpeaking && styles.statusDotSpeaking
              ]} />
              <Text style={styles.headerSubtitle}>
                {isSpeaking ? 'Говорить...' : 'AI Сомельє Онлайн'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          {isSpeaking && (
            <TouchableOpacity 
              style={styles.stopButton}
              onPress={stopSpeaking}
            >
              <Ionicons name="stop" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

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
                <View style={styles.voiceIndicator}>
                  <Ionicons name="mic" size={12} color={Colors.gold} />
                </View>
              )}
              <Text style={[
                styles.messageText,
                message.role === 'user' && styles.userMessageText
              ]}>
                {message.text}
              </Text>
            </View>
            {/* Speaker button for assistant messages */}
            {message.role === 'assistant' && (
              <TouchableOpacity
                style={styles.speakButton}
                onPress={() => speakResponse(message.text)}
              >
                <Ionicons name="volume-medium-outline" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text style={styles.loadingText}>Сомельє думає...</Text>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <View style={styles.quickPrompts}>
          {QUICK_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickPromptButton}
              onPress={() => sendMessage(prompt.label)}
            >
              <Ionicons name={prompt.icon} size={14} color={Colors.gold} />
              <Text style={styles.quickPromptText}>{prompt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Слухаю вас...</Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={pickAndSendImage}
          >
            <Ionicons name="camera-outline" size={22} color={Colors.gold} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Запитайте сомельє..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          
          {/* Voice Button */}
          <VoiceButton
            isRecording={isRecording}
            onPressIn={startRecording}
            onPressOut={stopRecording}
            disabled={isLoading}
          />
          
          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (inputText.trim() || isLoading) && styles.sendButtonActive,
            ]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? Colors.black : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Colors.black,
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'Georgia',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 5,
  },
  statusDotSpeaking: {
    backgroundColor: Colors.gold,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.gold,
  },
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
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
  voiceIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  userMessageText: {
    color: Colors.black,
  },
  speakButton: {
    alignSelf: 'flex-start',
    padding: 6,
    marginBottom: 8,
    marginLeft: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceElevated,
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  quickPrompts: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  quickPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.goldTransparent40,
    gap: 6,
  },
  quickPromptText: {
    fontSize: 12,
    color: Colors.gold,
    fontWeight: '500',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.goldTransparent,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  recordingText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  attachButton: {
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
    maxHeight: 120,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  voiceButtonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.gold,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.goldTransparent40,
  },
  voiceButtonActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.gold,
  },
});
