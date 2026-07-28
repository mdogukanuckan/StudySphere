import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { StudySession, UnlockedAchievementSummary } from '../types/studySession';
import { useEndSession, useCancelSession, usePauseSession, useResumeSession } from '../hooks/useStudySession';
import { EndSessionSummaryModal, EndSessionSummaryData } from './EndSessionSummaryModal';
import { AchievementUnlockedModal } from './AchievementUnlockedModal';
import { SPACING, ThemeColors, Shadows, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../utils/errorMessage';
import { parseServerDate } from '../utils/parseServerDate';

interface Props {
  session: StudySession;
  topicName?: string;
}

export const ActiveSessionWidget: React.FC<Props> = ({ session, topicName = "Aktif Çalışma" }) => {
    const { colors, shadows, globalStyles } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows, globalStyles), [colors, shadows, globalStyles]);
    const { mutate: endSession, isPending: isEnding } = useEndSession();
    const { mutate: cancelSession, isPending: isCanceling } = useCancelSession();
    const { mutate: pauseSession, isPending: isPausing } = usePauseSession();
    const { mutate: resumeSession, isPending: isResuming } = useResumeSession();

    const isPaused = session.sessionStatus === 'PAUSED';

    const [displaySeconds, setDisplaySeconds] = useState(0);
    const [isSummaryVisible, setSummaryVisible] = useState(false);
    const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievementSummary[]>([]);
    const [isAchievementModalVisible, setAchievementModalVisible] = useState(false);

    const pausedSecondsRef = useRef(0);
    const pauseStartRef = useRef<number | null>(null);

    useEffect(() => {
        if (isPaused) {
            if (pauseStartRef.current === null) {
                pauseStartRef.current = Date.now();
            }
        } else if (pauseStartRef.current !== null) {
            pausedSecondsRef.current += Math.floor((Date.now() - pauseStartRef.current) / 1000);
            pauseStartRef.current = null;
        }
    }, [isPaused]);

    const getElapsedSeconds = () => {
        const startTimestamp = parseServerDate(session.startTime || session.createdAt).getTime();
        const now = Date.now();
        const currentPauseSeconds = pauseStartRef.current !== null
            ? Math.floor((now - pauseStartRef.current) / 1000)
            : 0;
        return Math.max(0, Math.floor((now - startTimestamp) / 1000) - pausedSecondsRef.current - currentPauseSeconds);
    };

    useEffect(() => {
        
        const pomodoroDurationSeconds = session.plannedDurationSeconds ?? 25 * 60;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const tick = () => {
            const elapsedSeconds = getElapsedSeconds();

            if (session.sessionType === 'FREE') {
                setDisplaySeconds(elapsedSeconds);
            } else if (session.sessionType === 'POMODORO') {
                const remaining = pomodoroDurationSeconds - elapsedSeconds;
                if (remaining <= 0) {
                    if (intervalId) clearInterval(intervalId);
                    setDisplaySeconds(0);
                    setSummaryVisible(true);
                } else {
                    setDisplaySeconds(remaining);
                }
            }
        };

        tick(); 
        if (!isPaused) {
            intervalId = setInterval(tick, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [session.startTime, session.createdAt, session.sessionType, session.plannedDurationSeconds, isPaused]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleConfirmEndSession = (summary: EndSessionSummaryData) => {
        endSession({
            sessionId: session.id,
            durationSeconds: getElapsedSeconds(),
            ...(summary.isTopicReviewOnly
                ? {}
                : {
                      solvedQuestions: summary.solvedQuestions,
                      correctAnswers: summary.correctAnswers,
                      wrongAnswers: summary.wrongAnswers,
                  }),
        }, {
            onSuccess: (data) => {
                setSummaryVisible(false);
                if (data?.newAchievements && data.newAchievements.length > 0) {
                    setUnlockedAchievements(data.newAchievements);
                    setAchievementModalVisible(true);
                } else {
                    Alert.alert('Tebrikler! 🎉', 'Seans başarıyla tamamlandı.');
                }
            },
            onError: (error: any) => {
                Alert.alert('Hata', getErrorMessage(error, 'Seans bitirilemedi.'));
            }
        });
    };

    const handleCancelSession = () => {
        Alert.alert('Emin misin?', 'İptal edersen bu süre kaydedilmeyecek.', [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'İptal Et',
                style: 'destructive',
                onPress: () => cancelSession(session.id)
            }
        ]);
    };

    const handleTogglePause = () => {
        if (isPaused) {
            resumeSession(session.id, {
                onError: (error: any) => {
                    Alert.alert('Hata', getErrorMessage(error, 'Seans devam ettirilemedi.'));
                }
            });
        } else {
            pauseSession(session.id, {
                onError: (error: any) => {
                    Alert.alert('Hata', getErrorMessage(error, 'Seans durdurulamadı.'));
                }
            });
        }
    };

    const isBusy = isEnding || isCanceling || isPausing || isResuming;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.topicName}>{topicName}</Text>
                <Text style={styles.badge}>
                    {session.sessionType === 'POMODORO' ? '🍅 Pomodoro' : '⏱️ Serbest'}
                </Text>
            </View>

            <View style={styles.timerWrapper}>
                <Text style={[styles.timerText, isPaused && styles.timerTextPaused]}>{formatTime(displaySeconds)}</Text>
                {isPaused && <Text style={styles.pausedLabel}>⏸️ Duraklatıldı</Text>}
            </View>

            <TouchableOpacity
                style={[styles.pauseToggleBtn, isPaused && styles.resumeToggleBtn]}
                onPress={handleTogglePause}
                disabled={isBusy}
            >
                {isPausing || isResuming ? (
                    <ActivityIndicator color={isPaused ? '#fff' : colors.primary} />
                ) : (
                    <Text style={[styles.pauseToggleText, isPaused && styles.resumeToggleText]}>
                        {isPaused ? '▶️ Devam Et' : '⏸️ Durdur'}
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSession} disabled={isBusy}>
                    {isCanceling ? <ActivityIndicator color={colors.error} /> : <Text style={styles.cancelText}>Vazgeç</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.endBtn} onPress={() => setSummaryVisible(true)} disabled={isBusy}>
                    {isEnding ? <ActivityIndicator color="#fff" /> : <Text style={styles.endText}>Bitir</Text>}
                </TouchableOpacity>
            </View>

            <EndSessionSummaryModal
                visible={isSummaryVisible}
                onClose={() => setSummaryVisible(false)}
                onConfirm={handleConfirmEndSession}
                isLoading={isEnding}
            />

            <AchievementUnlockedModal
                visible={isAchievementModalVisible}
                achievements={unlockedAchievements}
                onClose={() => setAchievementModalVisible(false)}
            />
        </View>
    );
};

const createStyles = (colors: ThemeColors, shadows: Shadows, globalStyles: GlobalStyles) => StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        padding: SPACING.xl,
        borderRadius: 24,
        margin: SPACING.lg,
        ...shadows.medium,
        borderWidth: 1,
        borderColor: colors.border + '50',
    },
    header: { alignItems: 'center', marginBottom: SPACING.lg },
    topicName: { ...globalStyles.title, fontSize: 22, marginBottom: 8 },
    badge: { backgroundColor: colors.primary + '20', color: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, fontWeight: 'bold' },
    timerWrapper: { alignItems: 'center', marginVertical: SPACING.xl },
    timerText: { fontSize: 72, fontWeight: '300', color: colors.text, fontVariant: ['tabular-nums'] },
    timerTextPaused: { color: colors.textSecondary },
    pausedLabel: { color: colors.textSecondary, fontWeight: 'bold', marginTop: SPACING.xs },
    pauseToggleBtn: {
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: 12,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    resumeToggleBtn: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    pauseToggleText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
    resumeToggleText: { color: '#fff' },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
    cancelBtn: { flex: 1, padding: SPACING.md, borderWidth: 2, borderColor: colors.error, borderRadius: 12, alignItems: 'center', marginRight: SPACING.sm },
    cancelText: { color: colors.error, fontWeight: 'bold', fontSize: 16 },
    endBtn: { flex: 2, padding: SPACING.md, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', marginLeft: SPACING.sm },
    endText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
