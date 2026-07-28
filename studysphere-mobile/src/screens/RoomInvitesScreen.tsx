import React, { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomButton } from '../components/CustomButton';
import { useMyRoomInvites, useAcceptRoomInvite, useDeclineRoomInvite } from '../hooks/useRoomInvites';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/theme';
import { getErrorMessage } from '../utils/errorMessage';
import { RoomInvite } from '../types/studyRoom';
import type { StudyRoomStackParamList } from '../navigation/StudyRoomNavigator';

type Props = NativeStackScreenProps<StudyRoomStackParamList, 'RoomInvites'>;

export default function RoomInvitesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: invites, isLoading, refetch } = useMyRoomInvites();
  const { mutate: acceptInvite, isPending: isAccepting } = useAcceptRoomInvite();
  const { mutate: declineInvite, isPending: isDeclining } = useDeclineRoomInvite();

  const handleAccept = (invite: RoomInvite) => {
    acceptInvite(invite.id, {
      onSuccess: () => navigation.replace('RoomDetail', { id: invite.room.id }),
      onError: (error: any) => {
        const message = getErrorMessage(error, 'Davet kabul edilirken bir hata oluştu.');
        if (error?.response?.status === 403) {
          Alert.alert('Katılamadınız', message, [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Doğrula', onPress: () => navigation.getParent()?.getParent()?.navigate('VerifyEmail') },
          ]);
          return;
        }
        Alert.alert('Katılamadınız', message);
      },
    });
  };

  const handleDecline = (invite: RoomInvite) => {
    declineInvite(invite.id, {
      onError: (error: any) => {
        Alert.alert('Reddedilemedi', getErrorMessage(error, 'Davet reddedilirken bir hata oluştu.'));
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={invites ?? []}
      keyExtractor={(item) => item.id}
      refreshing={isLoading}
      onRefresh={refetch}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Şu an bekleyen bir oda davetin yok.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.roomTitle}>{item.room.title}</Text>
          <Text style={styles.metaText}>
            {item.room.universe?.name}{item.room.subject ? ` / ${item.room.subject.name}` : ''}
          </Text>
          <Text style={styles.metaText}>
            {item.fromUser.username} seni davet etti · {item.room.currentParticipants}/{item.room.maxParticipants} katılımcı
          </Text>
          <View style={styles.buttonRow}>
            <CustomButton
              title="Reddet"
              variant="outline"
              onPress={() => handleDecline(item)}
              loading={isDeclining}
              style={styles.button}
            />
            <CustomButton
              title="Katıl"
              onPress={() => handleAccept(item)}
              loading={isAccepting}
              style={styles.button}
            />
          </View>
        </View>
      )}
    />
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    marginVertical: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
