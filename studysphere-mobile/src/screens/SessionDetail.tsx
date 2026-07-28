import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SPACING, ThemeColors, GlobalStyles, Shadows } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useSessionDetail } from '../hooks/useStudySession';
import type { StatisticsStackParamList } from '../navigation/StatisticsStackNavigator';
import type { SessionStatus, SessionType } from '../types/studySession';
import { getErrorMessage } from '../utils/errorMessage';

type Props = NativeStackScreenProps<StatisticsStackParamList, 'SessionDetail'>;

const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  POMODORO: '🍅 Pomodoro',
  FREE: '⏱️ Serbest',
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  ACTIVE: 'Aktif',
  PAUSED: 'Duraklatıldı',
  FINISHED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

const getStatusColor = (colors: ThemeColors): Record<SessionStatus, string> => ({
  ACTIVE: colors.primary,
  PAUSED: colors.textSecondary,
  FINISHED: colors.success,
  CANCELLED: colors.error,
});

const formatDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours} sa ${minutes} dk`;
  if (minutes > 0) return `${minutes} dk ${remainingSeconds} sn`;
  return `${remainingSeconds} sn`;
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function SessionDetailScreen({ route }: Props) {
  const { colors, shadows, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
  const statusColor = useMemo(() => getStatusColor(colors), [colors]);
  const { id } = route.params;
  const { data: session, isLoading, isError, error, refetch } = useSessionDetail(id);

  if (isLoading) {
    return (
      <View style={[globalStyles.screenContainer, globalStyles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !session) {
    return (
      <View style={[globalStyles.screenContainer, globalStyles.center, { padding: SPACING.lg }]}>
        <Text style={styles.errorText}>
          {getErrorMessage(error, 'Seans detayı yüklenirken bir hata oluştu.')}
        </Text>
        <Text style={styles.retryText} onPress={() => refetch()}>
          Tekrar dene
        </Text>
      </View>
    );
  }

  const accuracyTotal = (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  const accuracyPercent = accuracyTotal > 0 ? Math.round(((session.correctCount ?? 0) / accuracyTotal) * 100) : null;

  return (
    <ScrollView style={globalStyles.screenContainer} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.breadcrumb}>
          {[session.universe?.name, session.subject?.name].filter(Boolean).join(' › ') || 'Genel'}
        </Text>
        <Text style={styles.topicTitle}>
          {session.topic?.name ?? 'Konu silinmiş'}
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{SESSION_TYPE_LABEL[session.sessionType]}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor[session.sessionStatus]}20` }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor[session.sessionStatus] }]}>
              {STATUS_LABEL[session.sessionStatus]}
            </Text>
          </View>
        </View>
      </View>

      {}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Süre</Text>
        <Text style={styles.durationValue}>{formatDuration(session.durationSeconds)}</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Başlangıç</Text>
            <Text style={styles.timeValue}>{formatDateTime(session.startTime)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Bitiş</Text>
            <Text style={styles.timeValue}>{formatDateTime(session.endTime)}</Text>
          </View>
        </View>
      </View>

      {}
      {!!session.goal && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hedef</Text>
          <Text style={styles.goalText}>{session.goal}</Text>
        </View>
      )}

      {accuracyTotal > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Soru İstatistikleri</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{session.questionCount ?? accuracyTotal}</Text>
              <Text style={styles.statLabel}>Toplam Soru</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>{session.correctCount ?? 0}</Text>
              <Text style={styles.statLabel}>Doğru</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.error }]}>{session.wrongCount ?? 0}</Text>
              <Text style={styles.statLabel}>Yanlış</Text>
            </View>
            {accuracyPercent !== null && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>%{accuracyPercent}</Text>
                <Text style={styles.statLabel}>Başarı</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors, shadows: Shadows) => StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...shadows.light,
  },
  breadcrumb: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  topicTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: SPACING.sm,
  },
  durationValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: SPACING.md,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  goalText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '22%',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
