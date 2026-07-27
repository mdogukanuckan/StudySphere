
import { Alert } from 'react-native';
import { useKickParticipant } from './useStudyRooms';
import { getErrorMessage } from '../utils/errorMessage';
import { Participant } from '../types/studyRoom';

export function useKickParticipantFlow(roomId: string) {
  const { mutate: kickParticipant, isPending: isKicking, variables: kickTargetId } = useKickParticipant(roomId);

  const confirmKick = (participant: Participant) => {
    Alert.alert(
      'Katılımcıyı Odadan Çıkar',
      `${participant.username} adlı kullanıcıyı odadan çıkarmak istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: () => {
            kickParticipant(participant.id, {
              onError: (error: any) => {
                Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Katılımcı odadan çıkarılırken bir hata oluştu.'));
              },
            });
          },
        },
      ]
    );
  };

  const isKickingParticipant = (participantId: string) => isKicking && kickTargetId === participantId;

  return { confirmKick, isKickingParticipant };
}
