
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { SPACING, ThemeColors, Shadows, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

interface SwipeableCrudListProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderTitle: (item: T) => string;
  renderSubtitle?: (item: T) => string | null | undefined;
  renderFooter?: (item: T) => string;
  renderAccessory?: (item: T) => React.ReactNode;
  onPressItem?: (item: T) => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  refreshing: boolean;
  onRefresh: () => void;
  emptyTitle: string;
  emptySubtitle: string;
}

export function SwipeableCrudList<T>({
  data,
  keyExtractor,
  renderTitle,
  renderSubtitle,
  renderFooter,
  renderAccessory,
  onPressItem,
  onEdit,
  onDelete,
  refreshing,
  onRefresh,
  emptyTitle,
  emptySubtitle,
}: SwipeableCrudListProps<T>) {
  const { colors, shadows, globalStyles } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, shadows, globalStyles), [colors, shadows, globalStyles]);

  return (
    <SwipeListView
      data={data}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyTitle}</Text>
          <Text style={styles.emptySubText}>{emptySubtitle}</Text>
        </View>
      }
      renderItem={(data: { item: T }) => {
        const subtitle = renderSubtitle?.(data.item);
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={onPressItem ? () => onPressItem(data.item) : undefined}
            disabled={!onPressItem}
          >
            <Text style={styles.cardTitle}>{renderTitle(data.item)}</Text>
            {subtitle ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
            {renderFooter && <Text style={styles.cardFooter}>{renderFooter(data.item)}</Text>}
            {renderAccessory && <View style={styles.accessoryRow}>{renderAccessory(data.item)}</View>}
          </TouchableOpacity>
        );
      }}
      renderHiddenItem={(data: { item: T }, rowMap: { [key: string]: any }) => (
        <View style={styles.rowBack}>
          <TouchableOpacity
            style={[styles.backAction, styles.backEdit]}
            onPress={() => {
              rowMap[keyExtractor(data.item)]?.closeRow();
              onEdit(data.item);
            }}
          >
            <Text style={styles.backTextWhite}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backAction, styles.backDelete]}
            onPress={() => {
              rowMap[keyExtractor(data.item)]?.closeRow();
              onDelete(data.item);
            }}
          >
            <Text style={styles.backTextWhite}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}
      leftOpenValue={90}
      rightOpenValue={-90}
      disableLeftSwipe={false}
      disableRightSwipe={false}
      friction={8}
      tension={40}
    />
  );
}

const createStyles = (colors: ThemeColors, shadows: Shadows, globalStyles: GlobalStyles) => StyleSheet.create({
  listContent: { padding: SPACING.lg, paddingBottom: 100 },
  card: { ...globalStyles.card },
  cardTitle: { ...globalStyles.title },
  cardDesc: { ...globalStyles.subtitle, marginTop: SPACING.xs, lineHeight: 20 },
  cardFooter: { fontSize: 11, color: colors.textSecondary, marginTop: SPACING.md, textAlign: 'right' },
  accessoryRow: { marginTop: SPACING.sm, alignItems: 'flex-start' },

  emptyContainer: { ...globalStyles.center, marginTop: 60, paddingHorizontal: SPACING.xl },
  emptyText: { ...globalStyles.title, textAlign: 'center' },
  emptySubText: { ...globalStyles.subtitle, marginTop: SPACING.xs, textAlign: 'center', lineHeight: 20 },

  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: '100%',
  },
  backEdit: {
    backgroundColor: '#F59E0B',
  },
  backDelete: {
    backgroundColor: '#EF4444',
  },
  backTextWhite: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
