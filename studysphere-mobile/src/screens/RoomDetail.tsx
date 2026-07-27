import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomButton } from '../components/CustomButton';
import { ActiveSessionWidget } from '../components/ActiveSessionWidget';
import { StudySessionSetupModal } from '../components/StudySessionSetupModal';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/theme';
import { useRoomDetails, useJoinRoom, useLeaveRoom, useRoomParticipants, useUpdateMyStatus } from '../hooks/useStudyRooms';
import { useOngoingSession } from '../hooks/useStudySession';
import { useStartSessionFlow } from '../hooks/useStartSessionFlow';
import { getErrorMessage } from '../utils/errorMessage';
import { useJoinRoomChannel, useRoomRealtimeEvents } from '../hooks/useRoomRealtime';
import { useNotificationSettings } from '../context/NotificationSettingsContext';
import type { StudyRoomStackParamList } from '../navigation/StudyRoomNavigator';

type Props = NativeStackScreenProps<StudyRoomStackParamList, 'RoomDetail'>;

export default function RoomDetailScreen({ route, navigation }: Props) {
  const { id: roomId } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { userId } = useAuthContext();
  const { data: room, isLoading } = useRoomDetails(roomId);
  const { data: participants } = useRoomParticipants(roomId);
  const { mutate: joinRoom, isPending: isJoining } = useJoinRoom(roomId);
  const { mutate: leaveRoom, isPending: isLeaving } = useLeaveRoom(roomId);
  const { mutate: updateMyStatus, isPending: isUpdatingStatus } = useUpdateMyStatus(roomId);
  const { data: ongoingSession, isLoading: isSessionLoading } = useOngoingSession();
  const sessionFlow = useStartSessionFlow({ roomId });

  
  useJoinRoomChannel(roomId);

  const { notificationsEnabled } = useNotificationSettings();

  
  const [activityNote, setActivityNote] = useState<string | null>(null);
  useRoomRealtimeEvents(roomId, {
    onSessionPauseChange: ({ userId: changedUserId, isPaused }) => {
      if (!notificationsEnabled) return;
      const participant = participants?.find((p) => p.id === changedUserId);
      const name = participant?.username ?? 'Bir katılımcı';
      setActivityNote(`${name} ${isPaused ? 'molaya girdi ⏸️' : 'çalışmaya devam etti ▶️'}`);
      setTimeout(() => setActivityNote(null), 4000);
    },
    onRoomClosed: () => {
      if (notificationsEnabled) {
        Alert.alert('Oda Kapatıldı', 'Oda sahibi bu odayı kapattı.', [
          { text: 'Tamam', onPress: () => navigation.navigate('RoomList') },
        ]);
      } else {
        navigation.navigate('RoomList');
      }
    },
  });

  if (isLoading || !room) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOwner = room.ownerId === userId;
  const selfParticipant = (participants ?? []).find((p) => p.id === userId);
  const isParticipant = !!selfParticipant;

  const handleJoin = () => {
    joinRoom(undefined, {
      onError: (error: any) => {
        Alert.alert('Katılamadınız', getErrorMessage(error, 'Odaya katılırken bir hata oluştu.'));
      },
    });
  };

  const handleLeave = () => {
    leaveRoom(undefined, {
      onError: (error: any) => {
        Alert.alert('Ayrılamadınız', getErrorMessage(error, 'Odadan ayrılırken bir hata oluştu.'));
      },
    });
  };

  const handleToggleStatus = () => {
    const nextStatus = selfParticipant?.currentStatus === 'BREAK' ? 'WORKING' : 'BREAK';
    updateMyStatus(nextStatus, {
      onError: (error: any) => {
        Alert.alert('Durum Güncellenemedi', getErrorMessage(error, 'Durumunuz güncellenirken bir hata oluştu.'));
      },
    });
  };

  
  const roomTopic = room.topic;
  const isSessionForThisRoom = !!ongoingSession && !!roomTopic && ongoingSession.topicId === roomTopic.id;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{room.title}</Text>
        {isOwner && (
          <CustomButton
            title="Ayarlar"
            variant="outline"
            onPress={() => navigation.navigate('RoomSettings', { id: roomId })}
            style={styles.settingsButton}
          />
        )}
      </View>

      <Text style={styles.description}>{room.description || 'Açıklama yok.'}</Text>

      {!!activityNote && (
        <View style={styles.activityBanner}>
          <Text style={styles.activityBannerText}>{activityNote}</Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Oda Bilgileri</Text>
        <Text style={styles.infoText}>Katılımcı: {participants?.length ?? room.currentParticipants} / {room.maxParticipants}</Text>
        <Text style={styles.infoText}>Gizlilik: {room.isPrivate ? 'Gizli 🔒' : 'Herkese Açık 🌍'}</Text>
      </View>

      {isParticipant && (
        <View style={styles.statusBox}>
          <Text style={styles.statusBoxLabel}>
            {selfParticipant?.currentStatus === 'BREAK' ? '☕ Şu an mola veriyorsunuz' : '🧠 Şu an odaklanmış çalışıyorsunuz'}
          </Text>
          <CustomButton
            title={selfParticipant?.currentStatus === 'BREAK' ? 'Çalışmaya Devam Et' : 'Mola Ver'}
            onPress={handleToggleStatus}
            loading={isUpdatingStatus}
            style={selfParticipant?.currentStatus === 'BREAK' ? styles.resumeButton : styles.breakButton}
          />
        </View>
      )}

      <CustomButton
        title="Katılımcıları Gör"
        variant="secondary"
        onPress={() => navigation.navigate('Participants', { id: roomId })}
        style={styles.sectionButton}
      />

      {isSessionLoading ? null : !roomTopic ? (
        <View style={styles.sessionNotice}>
          <Text style={styles.sessionNoticeText}>
            Bu oda için bir konu tanımlanmamış, bu yüzden kronometre bu odada kullanılamıyor.
          </Text>
        </View>
      ) : isSessionForThisRoom && ongoingSession ? (
        <ActiveSessionWidget session={ongoingSession} topicName={roomTopic.name} />
      ) : ongoingSession ? (
        <View style={styles.sessionNotice}>
          <Text style={styles.sessionNoticeText}>
            Başka bir konuda aktif bir çalışma seansınız var. Bu odada kronometre başlatmak için önce onu bitirin.
          </Text>
        </View>
      ) : !isParticipant ? (
        <View style={styles.sessionNotice}>
          <Text style={styles.sessionNoticeText}>
            Bu odanın kronometresini kullanabilmek için önce odaya katılmalısınız.
          </Text>
        </View>
      ) : (
        <CustomButton
          title="Kronometreyi Başlat"
          onPress={() => roomTopic && sessionFlow.openFor({ id: roomTopic.id, name: roomTopic.name })}
          style={styles.sectionButton}
        />
      )}

      <StudySessionSetupModal
        visible={sessionFlow.isVisible}
        topicName={sessionFlow.topicName || room.title}
        onClose={sessionFlow.close}
        onStart={sessionFlow.start}
        isLoading={sessionFlow.isStarting}
      />

      {isOwner ? (
        <Text style={styles.ownerHint}>Oda sahibisiniz, odadan ayrılamazsınız. Odayı kapatmak için Ayarlar'ı kullanın.</Text>
      ) : isParticipant ? (
        <CustomButton
          title="Odadan Ayrıl"
          onPress={handleLeave}
          loading={isLeaving}
          style={styles.leaveButton}
        />
      ) : (
        <CustomButton
          title="Odaya Katıl"
          onPress={handleJoin}
          loading={isJoining}
        />
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  settingsButton: {
    minWidth: 100,
  },
  description: {
    color: colors.textSecondary,
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  activityBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  activityBannerText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  infoTitle: {
    color: '#1D4ED8',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  infoText: {
    color: '#374151',
    fontSize: 15,
    marginBottom: 4,
  },
  sectionButton: {
    marginBottom: 20,
  },
  statusBox: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusBoxLabel: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  breakButton: {
    backgroundColor: '#D97706',
  },
  resumeButton: {
    backgroundColor: colors.success,
  },
  sessionNotice: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  sessionNoticeText: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  leaveButton: {
    backgroundColor: colors.error,
  },
  ownerHint: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
});
