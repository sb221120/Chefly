import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import { GoldButton, GoldOutlineButton } from '../../src/components/GoldButton';
import { DarkCard } from '../../src/components/DarkCard';
import IMAGES from '../../src/constants/images';
import * as api from '../../src/services/api';
import { useLanguage } from '../../src/contexts/LanguageContext';

const { width } = Dimensions.get('window');

const SCAN_TIPS = [
  { UK: 'Тримайте камеру стабільно для кращих результатів', EN: 'Hold camera steady for best results', RU: 'Держите камеру стабильно для лучших результатов' },
  { UK: 'Забезпечте хороше освітлення', EN: 'Ensure good lighting conditions', RU: 'Обеспечьте хорошее освещение' },
  { UK: 'Уникайте відблисків на склі', EN: 'Avoid reflections on glass', RU: 'Избегайте отблесков на стекле' },
  { UK: 'Тримайте етикетку в центрі кадру', EN: 'Keep the label centered in frame', RU: 'Держите этикетку в центре кадра' },
];

export default function ScannerScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [budget, setBudget] = useState(500);
  const [currency, setCurrency] = useState('UAH');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    loadUserPreferences();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setShowCamera(true);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const user = await api.getUser(userId);
        setBudget(user.budget_limit || 500);
        setCurrency(user.preferred_currency || 'UAH');
      }
    } catch (error) {
      console.log('Error loading preferences:', error);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.8 });
        if (photo.base64) {
          setImage(photo.base64);
          setShowCamera(false);
        }
      } catch (error) {
        console.error('Camera error:', error);
        Alert.alert(t('scanner_error'), t('scanner_error_message'));
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(t('scanner_error'), t('scanner_permission_error'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        setImage(result.assets[0].base64);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert(t('scanner_error'), t('scanner_error_message'));
    }
  };

  const analyzeShelf = async () => {
    if (!image) return;

    try {
      setIsAnalyzing(true);
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        Alert.alert(t('scanner_error'), t('scanner_user_not_found'));
        return;
      }

      const result = await api.scanShelf(
        userId,
        image,
        budget,
        currency,
        language
      );

      // Navigate to results
      router.push({
        pathname: '/scan-result',
        params: {
          recommendations: result.recommendations,
          budget: budget.toString(),
          currency: currency,
        },
      });
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(t('scanner_error'), t('scanner_error_message'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scanner_title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Budget display */}
        <View style={styles.budgetSection}>
          <View>
            <Text style={styles.budgetLabel}>{t('scanner_budget_label')}</Text>
            <Text style={styles.budgetSubtext}>{t('scanner_budget_hint')}</Text>
          </View>
          <Text style={styles.budgetValue}>
            {budget} {currency}
          </Text>
        </View>

        {/* Camera/Image preview area */}
        <View style={styles.previewContainer}>
          {showCamera && hasPermission && !image ? (
            <View style={styles.cameraContainer}>
              <Camera
                ref={cameraRef}
                style={styles.camera}
                type={CameraType.back}
              />
              {/* Gallery icon button in corner */}
              <TouchableOpacity
                style={styles.galleryIconButton}
                onPress={pickFromGallery}
              >
                <Ionicons name="images" size={24} color={Colors.gold} />
              </TouchableOpacity>
            </View>
          ) : image ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${image}` }}
              style={styles.previewImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              {/* Background wine shelf image */}
              <Image
                source={{ uri: IMAGES.wineShelf }}
                style={styles.placeholderImage}
                contentFit="cover"
              />
              <View style={styles.placeholderOverlay} />
              
              {/* Scanning target overlay */}
              <View style={styles.scanTarget}>
                <View style={styles.scanCrosshair}>
                  <View style={[styles.scanLine, styles.scanLineH]} />
                  <View style={[styles.scanLine, styles.scanLineV]} />
                </View>
              </View>
              
              <Text style={styles.placeholderText}>
                {t('scanner_placeholder')}
              </Text>
            </View>
          )}

          {/* Corner brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Action buttons */}
        {!image && showCamera && hasPermission ? (
          <View style={styles.captureSection}>
            <GoldButton
              label={t('scanner_camera')}
              icon="camera"
              onPress={takePicture}
            />
          </View>
        ) : !image ? (
          <View style={styles.actionButtons}>
            <GoldButton
              label={t('scanner_camera')}
              icon="camera"
              onPress={() => setShowCamera(true)}
            />
          </View>
        ) : (
          <View style={styles.analyzeButtons}>
            <GoldButton
              label={isAnalyzing ? t('scanner_analyzing') : t('scanner_analyze')}
              icon="sparkles"
              onPress={analyzeShelf}
              loading={isAnalyzing}
            />
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setImage(null);
                setShowCamera(true);
              }}
            >
              <Text style={styles.resetText}>{t('scanner_reset')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips */}
        <DarkCard style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.gold} />
            <Text style={styles.tipsTitle}>{t('scanner_tips_title')}</Text>
          </View>
          {SCAN_TIPS.map((tip, index) => (
            <View key={index} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip[language as 'UK' | 'EN' | 'RU']}</Text>
            </View>
          ))}
        </DarkCard>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  budgetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 14,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  budgetSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: 'Georgia',
  },
  previewContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  galleryIconButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  scanTarget: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanCrosshair: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    backgroundColor: Colors.gold,
  },
  scanLineH: {
    width: 40,
    height: 1.5,
  },
  scanLineV: {
    width: 1.5,
    height: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    zIndex: 1,
    fontWeight: '500',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.gold,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
  },
  captureSection: {
    marginBottom: 20,
  },
  actionButtons: {
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
  analyzeButtons: {
    marginBottom: 20,
  },
  resetButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resetText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  tipsCard: {
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    marginLeft: 8,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
    marginRight: 10,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
