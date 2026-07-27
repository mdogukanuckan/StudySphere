import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

import { useOngoingSession } from '../hooks/useStudySession';
import { useCurrentUser } from '../hooks/useUser';

import { useStartSessionFlow } from '../hooks/useStartSessionFlow';

import { ActiveSessionWidget } from '../components/ActiveSessionWidget';
import { SessionSelectionModal } from '../components/SessionSelectionModal';
import { StudySessionSetupModal } from '../components/StudySessionSetupModal';

import { Topic } from '../types/topic';
import { StudyStackParamList } from '../navigation/StudyStackNavigator';

type StudyTabNavigationProp = NativeStackNavigationProp<StudyStackParamList, 'StudyMain'>;

export default function StudyTabScreen() {
    const { colors, globalStyles } = useTheme();
    const styles = useMemo(() => createStyles(colors, globalStyles), [colors, globalStyles]);
    const navigation = useNavigation<StudyTabNavigationProp>();
    const { data: ongoingSession, isLoading: sessionLoading } = useOngoingSession();
    const { data: currentUser } = useCurrentUser();
      const firstNameOrUsername = currentUser?.firstName || currentUser?.username || '';

    const [isSelectionVisible, setSelectionVisible] = useState(false);
    const sessionFlow = useStartSessionFlow({
        errorTitle: 'Hata',
        errorFallbackMessage: 'Seans başlatılamadı, lütfen tekrar dene.',
    });

    const handleOpenSelection = () => {
        if (ongoingSession) {
            Alert.alert("Zaten aktif bir seansın var!", "Yeni bir seans başlatmadan önce mevcut seansını bitirmelisin.");
            return;
        }
        setSelectionVisible(true);
    };

    const handleTopicSelect = (topic: Topic) => {
        sessionFlow.openFor({ id: topic.id, name: topic.name });
    };

    if (sessionLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
             <TouchableOpacity style={styles.myTasksButton} onPress={() => navigation.navigate('MyTasks')}>
                <Text style={styles.myTasksButtonText}>📋 Görevlerim</Text>
            </TouchableOpacity>

            {ongoingSession ? (
                <View style={styles.activeSessionContainer}>
                    <Text style={styles.greetingText}>
                        {firstNameOrUsername ? `Kolay gelsin ${firstNameOrUsername}!` : 'Kolay gelsin!'}
                    </Text>
                    <Text style={styles.subtitleText}>Odaklanmaya devam et...</Text>

                    <ActiveSessionWidget
                        session={ongoingSession}
                        topicName="Mevcut Konu"
                    />
                </View>
            ) : (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>Şu an aktif bir çalışman yok.</Text>
                    <Text style={styles.emptySubText}>Aşağıdaki Ekle (+) butonundan hızlıca yeni bir seans başlatabilirsin.</Text>
                </View>
            )}

            {!ongoingSession && (
                <TouchableOpacity style={styles.fab} onPress={handleOpenSelection}>
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}

            <SessionSelectionModal
                visible={isSelectionVisible}
                onClose={() => setSelectionVisible(false)}
                onTopicSelect={handleTopicSelect}
            />

            <StudySessionSetupModal
                visible={sessionFlow.isVisible}
                topicName={sessionFlow.topicName}
                onClose={sessionFlow.close}
                onStart={sessionFlow.start}
                isLoading={sessionFlow.isStarting}
            />
        </View>
    );
}

const createStyles = (colors: ThemeColors, globalStyles: GlobalStyles) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    activeSessionContainer: { flex: 1, paddingTop: 20, paddingHorizontal: 10 },
    greetingText: { ...globalStyles.title, fontSize: 28, marginLeft: 20 },
    subtitleText: { ...globalStyles.subtitle, marginLeft: 20, marginBottom: 20 },
    emptyText: { ...globalStyles.title, fontSize: 18, textAlign: 'center', color: colors.text, marginBottom: 8 },
     emptySubText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

    myTasksButton: {
        alignSelf: 'flex-end',
        marginTop: 56,
        marginRight: SPACING.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
    },
    myTasksButtonText: { color: colors.text, fontWeight: '600', fontSize: 14 },

    fab: {
        position: 'absolute',
        right: SPACING.xl,
        bottom: SPACING.xl,
        backgroundColor: colors.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        ...globalStyles.center,
        zIndex: 10,
    },
    fabText: {
        color: colors.surface,
        fontSize: 32,
        fontWeight: '300',
        marginTop: -4,
    },
});
