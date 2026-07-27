
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAchievements } from '../hooks/useAchievements';
import { SPACING, ThemeColors, Shadows } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { Achievement } from '../types/achievement';

export const CATEGORY_LABELS: Record<string, string> = {
    TOTAL_QUESTIONS: 'Toplam Soru Çözümü',
    TOTAL_CORRECT: 'Toplam Doğru Soru',
    ERRORLESS_SESSIONS: 'Hatasız Seanslar',
    STUDY_TIME: 'Toplam Çalışma Süresi',
    
    STREAK: 'En Uzun Çalışma Serisi',
    
    SOCIAL_STUDY_TIME: 'Sosyal Çalışma Süresi',
    FRIEND_COUNT: 'Arkadaş Sayısı',
    ROOM_CREATION_COUNT: 'Kurulan Çalışma Odaları',
    SUBJECT_DIVERSITY: 'Ders Çeşitliliği',
};


export const formatProgressLabel = (category: string, progress: number, target: number): string => {
    if (category === 'STUDY_TIME' || category === 'SOCIAL_STUDY_TIME') {
        const progressHours = (progress / 3600).toFixed(1);
        const targetHours = Math.round(target / 3600);
        return `${progressHours} / ${targetHours} saat`;
    }
    if (category === 'STREAK') {
        return `${progress} / ${target} gün`;
    }
    if (category === 'FRIEND_COUNT') {
        return `${progress} / ${target} arkadaş`;
    }
    if (category === 'ROOM_CREATION_COUNT') {
        return `${progress} / ${target} oda`;
    }
    if (category === 'SUBJECT_DIVERSITY') {
        return `${progress} / ${target} ders`;
    }
    return `${progress} / ${target}`;
};

export default function AchievementsScreen() {
    const { colors, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const { data: achievements, isLoading } = useAchievements();

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const grouped = (achievements ?? []).reduce<Record<string, Achievement[]>>((acc, a) => {
        (acc[a.category] ??= []).push(a);
        return acc;
    }, {});

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.headerTitle}>Başarımlar 🏆</Text>

            {Object.entries(grouped).map(([category, items]) => (
                <View key={category} style={styles.section}>
                    <Text style={styles.sectionTitle}>{CATEGORY_LABELS[category] ?? category}</Text>
                    {items.map((item) => {
                        const percent = item.target > 0 ? Math.min(100, (item.progress / item.target) * 100) : 0;
                        return (
                            <View key={item.key} style={[styles.card, item.unlocked && styles.cardUnlocked]}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.icon, !item.unlocked && styles.iconLocked]}>{item.icon}</Text>
                                    <View style={styles.cardText}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={styles.cardDescription}>{item.description}</Text>
                                    </View>
                                    {item.unlocked && <Text style={styles.unlockedBadge}>✓</Text>}
                                </View>
                                <View style={styles.progressTrack}>
                                    <View style={[styles.progressFill, { width: `${percent}%` }, item.unlocked && styles.progressFillUnlocked]} />
                                </View>
                                <Text style={styles.progressLabel}>
                                    {formatProgressLabel(item.category, item.progress, item.target)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            ))}
        </ScrollView>
    );
}

const createStyles = (colors: ThemeColors, shadows: Shadows) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: SPACING.lg },
    section: { marginBottom: SPACING.lg },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: SPACING.sm },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: 0.65,
        ...shadows.light,
    },
    cardUnlocked: { opacity: 1, borderColor: colors.primary + '60' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
    icon: { fontSize: 28, marginRight: SPACING.md },
    iconLocked: { opacity: 0.4 },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    cardDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    unlockedBadge: { color: colors.success, fontWeight: 'bold', fontSize: 18, marginLeft: SPACING.sm },
    progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.textSecondary, borderRadius: 4 },
    progressFillUnlocked: { backgroundColor: colors.primary },
    progressLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'right' },
});
