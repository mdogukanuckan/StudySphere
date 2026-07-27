import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useGetRooms } from '../hooks/useStudyRooms';
import { StudyRoomCard } from '../components/StudyRoomCard';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { StudyRoom } from '../types/studyRoom';
import type { StudyRoomStackParamList } from '../navigation/StudyRoomNavigator';
interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
}
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  isLoading = false,
  style,
  disabled,
  ...rest
}) => {
  const isDisabled = disabled || isLoading;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isDisabled && styles.disabled,
        style // Dışarıdan gelen ekstra stilleri eziyoruz
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
const TABS = [
  { key: 'ACTIVE' as const, label: 'Aktif Odalar', emptyText: 'Şu an aktif bir çalışma odası yok.' },
  { key: 'CLOSED' as const, label: 'Kapalı Odalar', emptyText: 'Kapalı çalışma odası bulunmuyor.' },
];

export const RoomListScreen = () => {
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: rooms, isLoading, isError, refetch } = useGetRooms();
  const navigation = useNavigation<NativeStackNavigationProp<StudyRoomStackParamList>>();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const activeRooms = useMemo(
    () => (rooms ?? []).filter((room) => room.status === 'ACTIVE'),
    [rooms]
  );
  const closedRooms = useMemo(
    () => (rooms ?? []).filter((room) => room.status === 'CLOSED'),
    [rooms]
  );
  const roomsByTab = [activeRooms, closedRooms];

  const goToTab = (index: number) => {
    setActiveTabIndex(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveTabIndex(index);
  };

  if (isLoading) {
    return (
      <View style={[globalStyles.screenContainer, globalStyles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[globalStyles.screenContainer, globalStyles.center, { padding: SPACING.lg }]}>
        <Text style={styles.errorText}>Odalar yüklenirken bir hata oluştu.</Text>
        <PrimaryButton title="Tekrar Dene" onPress={() => refetch()} />
      </View>
    );
  }

  const renderRoomList = (data: StudyRoom[], emptyText: string) => (
    <View style={{ width }}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <StudyRoomCard
            room={item}
            onPress={(id) => navigation.navigate('RoomDetail', { id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        }
        refreshing={isLoading}
        onRefresh={refetch}
      />
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.screenContainer} edges={['top']}>
      {/* Üst Bilgi (Header) Alanı */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Çalışma Odaları</Text>
        <PrimaryButton
          title="+ Oda Kur"
          onPress={() => navigation.navigate('CreateRoom')}
        />
      </View>

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
            {renderRoomList(roomsByTab[index], tab.emptyText)}
          </React.Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    button: {
    backgroundColor: colors.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: colors.surface, // Buton içi yazı rengi (Saf beyaz)
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
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
  listContent: {
    padding: SPACING.lg,
  },
  errorText: {
    color: colors.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
