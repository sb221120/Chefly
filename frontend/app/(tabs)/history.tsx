import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import Colors from '../../src/theme/colors';
import { DarkCard } from '../../src/components/DarkCard';
import IMAGES from '../../src/constants/images';
import * as api from '../../src/services/api';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

// Wine thumbnails for visual variety in history entries
const WINE_THUMBS = [
  IMAGES.wineGlass,
  IMAGES.redWineGlass,
  IMAGES.winePairing,
  IMAGES.wineSelection,
  IMAGES.premiumBottles,
];

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const data = await api.getChatSessions(userId);
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return format(date, 'dd.MM.yyyy');
    } catch {
      return '';
    }
  };

  const getSessionSubtitle = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('вин') || lower.includes('wine')) return 'Wine consultation';
    if (lower.includes('віск') || lower.includes('whisky') || lower.includes('whiskey')) return 'Whisky selection';
    if (lower.includes('стейк') || lower.includes('steak')) return 'Food pairing';
    if (lower.includes('шампан') || lower.includes('champagne')) return 'Champagne guide';
    if (lower.includes('коктейл') || lower.includes('cocktail')) return 'Cocktail advice';
    return 'AI Sommelier consultation';
  };

  const filteredSessions = searchQuery
    ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consultations</Text>
        <Text style={styles.headerSubtitle}>Your premium AI sommelier sessions</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search consultations..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Section headers */}
      {!isLoading && sessions.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Image
              source={{ uri: IMAGES.wineGlass }}
              style={styles.emptyImage}
              contentFit="cover"
            />
            <View style={styles.emptyImageOverlay} />
            <Ionicons name="chatbubbles-outline" size={40} color={Colors.gold} style={styles.emptyIcon} />
          </View>
          <Text style={styles.emptyTitle}>No consultations yet</Text>
          <Text style={styles.emptySubtitle}>
            Your AI sommelier consultations will appear here
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => router.push('/chat')}
          >
            <Text style={styles.startButtonText}>Start a conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.sessionsList}
          showsVerticalScrollIndicator={false}
        >
          {filteredSessions.map((session, index) => (
            <DarkCard
              key={session.id}
              padding={0}
              onPress={() => router.push(`/chat?session=${session.id}`)}
              style={styles.sessionCard}
            >
              <View style={styles.sessionContent}>
                {/* Wine thumbnail */}
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: WINE_THUMBS[index % WINE_THUMBS.length] }}
                    style={styles.thumbnail}
                    contentFit="cover"
                  />
                  <View style={styles.thumbnailOverlay} />
                </View>
                
                {/* Session info */}
                <View style={styles.sessionText}>
                  <View style={styles.sessionTopRow}>
                    <Text style={styles.sessionDate}>{formatDate(session.updated_at)}</Text>
                  </View>
                  <Text style={styles.sessionTitle} numberOfLines={1}>
                    {session.title}
                  </Text>
                  <Text style={styles.sessionSubtitle}>
                    {getSessionSubtitle(session.title)}
                  </Text>
                  <View style={styles.sessionMeta}>
                    <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{session.message_count} messages</Text>
                  </View>
                </View>

                {/* Revisit button */}
                <TouchableOpacity style={styles.revisitBtn}>
                  <Text style={styles.revisitText}>Revisit</Text>
                </TouchableOpacity>
              </View>
            </DarkCard>
          ))}

          {/* End of session */}
          <View style={styles.endOfList}>
            <Ionicons name="wine-outline" size={20} color={Colors.textMuted} />
            <Text style={styles.endOfListText}>End of sessions</Text>
          </View>
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
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Georgia',
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold,
    letterSpacing: 1.5,
  },
  clearAllText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.goldTransparent40,
  },
  emptyImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  emptyImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  emptyIcon: {
    zIndex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Georgia',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  startButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.goldTransparent,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  sessionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sessionCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 75,
    height: 90,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sessionText: {
    flex: 1,
    padding: 12,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sessionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  revisitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.goldTransparent40,
    marginRight: 12,
  },
  revisitText: {
    fontSize: 11,
    color: Colors.gold,
    fontWeight: '600',
  },
  endOfList: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    marginBottom: 20,
  },
  endOfListText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
