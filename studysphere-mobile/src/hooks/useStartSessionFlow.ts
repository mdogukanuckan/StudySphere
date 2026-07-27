
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useStartSession } from './useStudySession';
import { SessionType } from '../types/studySession';
import { getErrorMessage } from '../utils/errorMessage';

interface SessionTarget {
  id: string;
  name: string;
}

interface UseStartSessionFlowOptions {
  roomId?: string;
  errorTitle?: string;
  errorFallbackMessage?: string;
  onStarted?: () => void;
}

export function useStartSessionFlow({
  roomId,
  errorTitle = 'Kronometre Başlatılamadı',
  errorFallbackMessage = 'Çalışma seansı başlatılırken bir hata oluştu.',
  onStarted,
}: UseStartSessionFlowOptions = {}) {
  const [target, setTarget] = useState<SessionTarget | null>(null);
  const { mutate: startSession, isPending: isStarting } = useStartSession();

  const openFor = useCallback((topic: SessionTarget) => setTarget(topic), []);
  const close = useCallback(() => setTarget(null), []);

  const start = useCallback(
    (type: SessionType, plannedDurationSeconds?: number) => {
      if (!target) return;

      startSession(
        {
          topicId: target.id,
          sessionType: type,
          ...(roomId ? { roomId } : {}),
          ...(plannedDurationSeconds ? { plannedDurationSeconds } : {}),
        },
        {
          onSuccess: () => {
            setTarget(null);
            onStarted?.();
          },
          onError: (error: any) => {
            Alert.alert(errorTitle, getErrorMessage(error, errorFallbackMessage));
          },
        }
      );
    },
    [target, roomId, startSession, onStarted, errorTitle, errorFallbackMessage]
  );

  return {
    isVisible: !!target,
    topicName: target?.name ?? '',
    isStarting,
    openFor,
    close,
    start,
  };
}
