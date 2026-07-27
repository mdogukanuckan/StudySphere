import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING, ThemeColors, Shadows } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useStudyHistory } from '../hooks/useStudySession';
import type { StatisticsStackParamList } from '../navigation/StatisticsStackNavigator';
import type { StudySession } from '../types/studySession';

const TABS = [
  { key: 'FREE' as const, label: '⏱️ Serbest', emptyText: 'Henüz tamamlanmış bir serbest çalışma seansın yok.' },
  { key: 'POMODORO' as const, label: '🍅 Pomodoro', emptyText: 'Henüz tamamlanmış bir Pomodoro seansın yok.' },
];

export default function SessionHistoryScreen() {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<StatisticsStackParamList>>();

  const freeHistory = useStudyHistory('FREE');
  const pomodoroHistory = useStudyHistory('POMODORO');
  const historyByTab = [freeHistory, pomodoroHistory];

  const goToTab = (index: number) => {
    setActiveTabIndex(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveTabIndex(index);
  };

  const renderSessionItem = ({ item }: { item: StudySession }) => {
    const date = new Date(item.createdAt).toLocaleDateString('tr-TR');
    const durationMin = Math.floor(item.durationSeconds / 60);

    return (
      <TouchableOpacity
        style={styles.historyCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('SessionDetail', { id: item.id })}
      >
        <View>
          <Text style={styles.dateText}>{date}</Text>
          {(item.correctCount !== undefined || item.wrongCount !== undefined) && (
            <Text style={styles.topicText}>
              ✅ {item.correctCount ?? 0} · ❌ {item.wrongCount ?? 0}
            </Text>
          )}
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{durationMin} dk</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHistoryList = (query: ReturnType<typeof useStudyHistory>, emptyText: string) => {
    if (query.isLoading) {
      return (
        <View style={[styles.center, { width }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={{ width }}>
        <FlatList
          data={query.data?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Seans Geçmişi</Text>

      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTabIndex === index && styles.tabItemActive]}
            onPress={() => goToTab(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTabIndex === index && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {TABS.map((tab, index) => (
          <React.Fragment key={tab.key}>
            {renderHistoryList(historyByTab[index], tab.emptyText)}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, shadows: Shadows) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: SPACING.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    backgroundColor: colors.border,
    borderRadius: 10,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primary,
  },
  listContent: { padding: SPACING.lg, paddingTop: SPACING.sm },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    ...shadows.light,
  },
  dateText: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  topicText: { fontSize: 14, fontWeight: '600', color: colors.text },
  durationBadge: {
    backgroundColor: colors.primary + '20', // Opak mavi arka plan
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  durationText: { color: colors.primary, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20, color: colors.textSecondary },
});
