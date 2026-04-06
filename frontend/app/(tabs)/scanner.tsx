import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../src/theme/colors';
import { GoldButton } from '../../src/components/GoldButton';
import { DarkCard } from '../../src/components/DarkCard';
import * as api from '../../src/services/api';
import { Language, t } from '../../src/i18n/translations';

export default function ScannerScreen() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('UK');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [budget, setBudget] = useState(500);
  const [currency, setCurrency] = useState('UAH');
  const cameraRef = React.useRef<CameraView>(null);

  useEffect(() => {
    loadLanguageAndPreferences();
  }, []);

  const loadLanguageAndPreferences = async () => {
    try {
      const lang = await AsyncStorage.getItem('userLanguage');
      if (lang) setCurrentLanguage(lang as Language);

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
        if (photo?.base64) {
          setCapturedImage(photo.base64);
        }
      } catch (error) {
        console.error('Camera error:', error);
        Alert.alert(t('scanner_error', currentLanguage), t('scanner_error_message', currentLanguage));
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('scanner_error', currentLanguage), t('scanner_permission_error', currentLanguage));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        setCapturedImage(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
    }
  };

  const analyzeShelf = async () => {
    if (!capturedImage) return;

    try {
      setIsAnalyzing(true);
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        Alert.alert(t('scanner_error', currentLanguage), t('scanner_user_not_found', currentLanguage));
        return;
      }

      const result = await api.scanShelf(userId, capturedImage, budget, currency, currentLanguage);

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
      Alert.alert(t('scanner_error', currentLanguage), t('scanner_error_message', currentLanguage));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Permission not granted yet
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  // Permission denied - show grant button
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color={Colors.gold} />
          <Text style={styles.permissionTitle}>{t('scanner_grant_permission', currentLanguage)}</Text>
          <Text style={styles.permissionText}>{t('scanner_permission_error', currentLanguage)}</Text>
          <GoldButton
            label={t('scanner_grant_permission', currentLanguage)}
            icon="camera"
            onPress={requestPermission}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Camera granted - show camera or captured image
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scanner_title', currentLanguage)}</Text>
        <View style={{ width: 24 }} />
      </View>

      {!capturedImage ? (
        /* CAMERA VIEW - Main Background */
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />
          
          {/* Gallery Button - Top Right Absolute Position */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickFromGallery}
          >
            <Ionicons name="images" size={24} color={Colors.gold} />
          </TouchableOpacity>

          {/* Corner Brackets */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Capture Button - Bottom Center */}
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>

          {/* Budget Display - Top */}
          <View style={styles.budgetOverlay}>
            <Text style={styles.budgetLabel}>{t('scanner_budget_label', currentLanguage)}</Text>
            <Text style={styles.budgetValue}>{budget} {currency}</Text>
          </View>
        </View>
      ) : (
        /* CAPTURED IMAGE VIEW */
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.budgetSection}>
            <View>
              <Text style={styles.budgetLabel}>{t('scanner_budget_label', currentLanguage)}</Text>
              <Text style={styles.budgetSubtext}>{t('scanner_budget_hint', currentLanguage)}</Text>
            </View>
            <Text style={styles.budgetValue}>{budget} {currency}</Text>
          </View>

          <View style={styles.previewContainer}>
            <img
              src={`data:image/jpeg;base64,${capturedImage}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt="Captured"
            />
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <View style={styles.analyzeButtons}>
            <GoldButton
              label={isAnalyzing ? t('scanner_analyzing', currentLanguage) : t('scanner_analyze', currentLanguage)}
              icon="sparkles"
              onPress={analyzeShelf}
              loading={isAnalyzing}
            />
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setCapturedImage(null)}
            >
              <Text style={styles.resetText}>{t('scanner_reset', currentLanguage)}</Text>
            </TouchableOpacity>
          </View>

          <DarkCard style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.gold} />
              <Text style={styles.tipsTitle}>{t('scanner_tips_title', currentLanguage)}</Text>
            </View>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{t(`scanner_tip_${i}` as any, currentLanguage)}</Text>
              </View>
            ))}
          </DarkCard>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  galleryButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    zIndex: 100,
  },
  budgetOverlay: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
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
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.gold,
    zIndex: 50,
  },
  topLeft: {
    top: 150,
    left: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 150,
    right: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 120,
    left: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 120,
    right: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.gold,
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.gold,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
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
    flex: 1,
  },
});
