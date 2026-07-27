import React, { useMemo } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { Participant } from '../types/studyRoom';
import { useRoomDetails, useRoomParticipants } from '../hooks/useStudyRooms';
import { useAuthContext } from '../context/AuthContext';
import { SPACING, ThemeColors } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useKickParticipantFlow } from '../hooks/useKickParticipantFlow';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { StudyRoomStackParamList } from '../navigation/StudyRoomNavigator';
import { parseServerDate } from '../utils/parseServerDate';
import { useRoomRealtimeEvents } from '../hooks/useRoomRealtime';

const formatJoinedDuration = (joinedAt: string): string => {
  if (!joinedAt) return '';
  const joinedTime = parseServerDate(joinedAt).getTime();
  if (Number.isNaN(joinedTime)) return '';

  const diffMs = Date.now() - joinedTime;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Az önce katıldı';
  if (diffMinutes < 60) return `${diffMinutes} dakikadır burada`;

  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  if (diffHours < 24) {
    return remainingMinutes > 0
      ? `${diffHours} saat ${remainingMinutes} dakikadır burada`
      : `${diffHours} saattir burada`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gündür burada`;
};

type Props = NativeStackScreenProps<StudyRoomStackParamList, 'Participants'>;

export default function ParticipantsScreen({ route }: Props) {
  const { id: roomId } = route.params;
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { userId } = useAuthContext();
  const { data: room } = useRoomDetails(roomId);
  const { data: participants, isLoading } = useRoomParticipants(roomId);
  const { confirmKick, isKickingParticipant } = useKickParticipantFlow(roomId);
  useRoomRealtimeEvents(roomId);

  const isOwner = !!room && room.ownerId === userId;

  const renderItem = ({ item }: { item: Participant }) => {
    const isSelf = item.id === userId;
    const canKick = isOwner && !isSelf;
    const isKickingThisUser = isKickingParticipant(item.id);

    return (
      <View style={[globalStyles.card, styles.card]}>
        <Image
          source={{ uri: item.avatarUrl || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={styles.username} numberOfLines={1}>{item.username}</Text>
            {isSelf && <Text style={styles.selfBadge}>Sen</Text>}
            {item.isOwner && <Text style={styles.ownerBadge}>👑 Kurucu</Text>}
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, item.isOnline ? styles.online : styles.offline]} />
            <Text style={[styles.statusText, item.currentStatus === 'WORKING' ? styles.working : styles.break]}>
              {item.currentStatus === 'WORKING' ? '🧠 Odaklanmış Çalışıyor' : '☕ Mola Veriyor'}
            </Text>
          </View>
          {!!item.joinedAt && (
            <Text style={styles.joinedText}>⏱️ {formatJoinedDuration(item.joinedAt)}</Text>
          )}

          {item.isSessionPaused && (
            <Text style={styles.pausedText}>⏸️ Kronometre duraklatıldı</Text>
          )}
        </View>

        {canKick && (
          <TouchableKick onPress={() => confirmKick(item)} loading={isKickingThisUser} />
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={participants ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Oda şu an boş.</Text>}
      />
    </View>
  );
}


function TouchableKick({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={styles.kickButton}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.error} />
      ) : (
        <LogOut size={18} color={colors.error} />
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: SPACING.lg,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  selfBadge: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: `${colors.primary}1A`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 8,
    overflow: 'hidden',
  },
  ownerBadge: {
    fontSize: 12,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
  },
  joinedText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pausedText: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 4,
    fontWeight: '600',
  },
  working: {
    color: '#166534',
  },
  break: {
    color: '#B45309',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  online: {
    backgroundColor: colors.success,
  },
  offline: {
    backgroundColor: '#9CA3AF',
  },
  kickButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.error}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40,
  },
});
