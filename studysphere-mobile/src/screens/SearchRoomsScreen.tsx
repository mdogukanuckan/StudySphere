import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSearchRooms, useSearchSuggestions } from '../hooks/useStudyRooms';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { StudyRoomCard } from '../components/StudyRoomCard';
import { CustomInput } from '../components/CustomInput';
import { SPACING, ThemeColors } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { RoomSearchSuggestion, RoomSearchSuggestionType, StudyRoom } from '../types/studyRoom';
import type { StudyRoomStackParamList } from '../navigation/StudyRoomNavigator';

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

const typeLabelTr = (type: RoomSearchSuggestionType): string => {
  switch (type) {
    case 'universe':
      return 'Evren';
    case 'subject':
      return 'Ders';
    case 'topic':
      return 'Konu';
    case 'title':
    default:
      return 'Başlık';
  }
};

const getMatchLabel = (room: StudyRoom, query: string): string | null => {
  const q = query.trim().toLocaleLowerCase('tr');
  if (!q) return null;
  if (room.subject.name.toLocaleLowerCase('tr').includes(q)) return `Ders: ${room.subject.name}`;
  if (room.topic?.name && room.topic.name.toLocaleLowerCase('tr').includes(q)) return `Konu: ${room.topic.name}`;
  if (room.universe.name.toLocaleLowerCase('tr').includes(q)) return `Evren: ${room.universe.name}`;
  if (room.title.toLocaleLowerCase('tr').includes(q)) return 'Başlık eşleşmesi';
  return null;
};

export const SearchRoomsScreen = () => {
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<StudyRoomStackParamList>>();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const trimmedQuery = debouncedQuery.trim();
  const hasEnoughLength = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const { data: suggestions } = useSearchSuggestions(debouncedQuery);
  const { data: rooms, isLoading, isError, refetch } = useSearchRooms(debouncedQuery);

  const handleSuggestionPress = (suggestion: RoomSearchSuggestion) => {
    setQuery(suggestion.label);
  };

  const renderContent = () => {
    if (!hasEnoughLength) {
      return (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            Aramak için en az {MIN_QUERY_LENGTH} karakter yazın. Oda başlığı, evren, ders veya konu adına göre arama yapabilirsin.
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.hintContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.hintContainer}>
          <Text style={styles.errorText}>Arama yapılırken bir hata oluştu.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!rooms || rooms.length === 0) {
      return (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>"{trimmedQuery}" ile eşleşen herkese açık bir oda bulunamadı.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const matchLabel = getMatchLabel(item, trimmedQuery);
          return (
            <View style={styles.resultItem}>
              {matchLabel && (
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>{matchLabel}</Text>
                </View>
              )}
              <StudyRoomCard
                room={item}
                onPress={(id) => navigation.navigate('RoomDetail', { id })}
              />
            </View>
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView style={globalStyles.screenContainer} edges={['bottom']}>
      <View style={styles.searchBox}>
        <CustomInput
          leftIcon="search"
          placeholder="Oda başlığı, evren, ders veya konu ara..."
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {hasEnoughLength && suggestions && suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsRow}
          contentContainerStyle={styles.suggestionsContent}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion.type}-${suggestion.label}-${index}`}
              style={styles.suggestionChip}
              onPress={() => handleSuggestionPress(suggestion)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionChipText}>
                {typeLabelTr(suggestion.type)}: {suggestion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {renderContent()}
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  searchBox: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  suggestionsRow: {
    maxHeight: 44,
    marginBottom: SPACING.sm,
  },
  suggestionsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  suggestionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: SPACING.sm,
    justifyContent: 'center',
  },
  suggestionChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.lg,
  },
  resultItem: {
    marginBottom: SPACING.sm,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  matchBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  hintText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    color: colors.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
