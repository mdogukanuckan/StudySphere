import React, { useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { BarChart } from 'react-native-chart-kit';
import { useDailyStats, useModeBreakdown, useMyStatistics } from "../hooks/useStatistic";
import { useSubjectPerformance } from "../hooks/useSubjectPerformance";
import { useAchievements } from "../hooks/useAchievements";
import { SubjectBreakdown } from "../types/statistics";
import { SPACING, ThemeColors, Shadows } from "../theme/theme";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

const screenWidth = Dimensions.get('window').width;

const hexToRgba = (hex: string, opacity: number) => {
    const normalized = hex.replace('#', '');
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const formatMinutes = (durationSeconds: number) => `${Math.floor(durationSeconds / 60)} dk`;

const StatCard = ({ title, value, onPress }: { title: string, value: string | number, onPress?: () => void }) => {
    const { colors, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardValue}>{value}</Text>
        </TouchableOpacity>
    );
};

const SubjectAccordion = ({ subject, expanded, onToggle }: { subject: SubjectBreakdown, expanded: boolean, onToggle: () => void }) => {
    const { colors, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const accuracy = subject.totalQuestions > 0 ? Math.round((subject.totalCorrect / subject.totalQuestions) * 100) : null;

    return (
        <View style={styles.subjectCard}>
            <TouchableOpacity style={styles.subjectHeader} onPress={onToggle} activeOpacity={0.7}>
                <View style={styles.subjectHeaderText}>
                    <Text style={styles.subjectName}>{subject.subjectName}</Text>
                    <Text style={styles.subjectMeta}>
                        {formatMinutes(subject.totalDuration)} · {subject.totalQuestions} soru
                        {accuracy !== null ? ` · %${accuracy} doğruluk` : ''}
                    </Text>
                </View>
                <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expanded && (
                <View style={styles.topicsContainer}>
                    {subject.topics.map((topic) => {
                        const topicAccuracy = topic.totalQuestions > 0 ? Math.round((topic.totalCorrect / topic.totalQuestions) * 100) : null;
                        return (
                            <View key={topic.topicId ?? 'genel'} style={styles.topicRow}>
                                <Text style={styles.topicName}>{topic.topicName}</Text>
                                <Text style={styles.topicMeta}>
                                    {formatMinutes(topic.totalDuration)} · {topic.totalQuestions} soru · {topic.totalCorrect} doğru / {topic.totalWrong} yanlış
                                    {topicAccuracy !== null ? ` (%${topicAccuracy})` : ''}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

export default function StatisticsScreen() {
    const navigation = useNavigation<any>();
    const { colors, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(new Set());

    const { data: overallStats, isLoading: isLoadingOverAll } = useMyStatistics();
    const { data: dailyStats, isLoading: isLoadingDaily } = useDailyStats();
    const { data: modeBreakdown, isLoading: isLoadingMode } = useModeBreakdown();
    const { data: subjectBreakdown, isLoading: isLoadingSubjects } = useSubjectPerformance();
    const { data: achievements } = useAchievements();
    const unlockedAchievementCount = achievements?.filter((a) => a.unlocked).length ?? 0;

    const toggleSubject = (subjectId: string) => {
        setExpandedSubjectIds((prev) => {
            const next = new Set(prev);
            if (next.has(subjectId)) {
                next.delete(subjectId);
            } else {
                next.add(subjectId);
            }
            return next;
        });
    };

    if (isLoadingOverAll || isLoadingDaily || isLoadingMode || isLoadingSubjects) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size='large' color={colors.primary} />
                <Text style={styles.loadingText}>Veriler Analiz Ediliyor...</Text>
            </View>
        );
    }

    const soloDuration = modeBreakdown?.solo.totalDuration || 0;
    const socialDuration = modeBreakdown?.social.totalDuration || 0;
    const totalModeDuration = soloDuration + socialDuration;
    const soloPercent = totalModeDuration > 0 ? (soloDuration / totalModeDuration) * 100 : 50;
    const socialPercent = 100 - soloPercent;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.headerTitle}>Performans Özeti</Text>
            <View style={styles.cardsContainer}>
                <StatCard
                    title="Toplam Süre"
                    value={`${Math.floor((overallStats?.totalStudyTime || 0) / 60)} dk`}
                />
                <StatCard
                    title="Oturum Sayısı"
                    value={overallStats?.totalSessionsCompleted || 0}
                    onPress={() => navigation.navigate('SessionHistory')}
                />
                <StatCard
                    title="Mevcut Seri (Streak)"
                    value={`${overallStats?.currentStreak || 0} Gün 🔥`}
                />
                <StatCard
                    title="En Uzun Seri"
                    value={`${overallStats?.longestStreak || 0} Gün 🏆`}
                />
                <StatCard
                    title="Başarımlar"
                    value={`${unlockedAchievementCount} 🏅`}
                    onPress={() => navigation.navigate('Achievements')}
                />
            </View>

            <Text style={styles.sectionTitle}>Çalışma Modu</Text>
            <View style={styles.modeContainer}>
                {totalModeDuration > 0 && (
                    <View style={styles.modeBarTrack}>
                        <View style={[styles.modeBarFill, { width: `${soloPercent}%`, backgroundColor: colors.primary }]} />
                        <View style={[styles.modeBarFill, { width: `${socialPercent}%`, backgroundColor: colors.success }]} />
                    </View>
                )}
                <View style={styles.modeCardsRow}>
                    <View style={styles.modeCard}>
                        <View style={[styles.modeDot, { backgroundColor: colors.primary }]} />
                        <Text style={styles.modeCardLabel}>Solo</Text>
                        <Text style={styles.modeCardValue}>{Math.floor(soloDuration / 60)} dk</Text>
                        <Text style={styles.modeCardSubValue}>{modeBreakdown?.solo.sessionCount || 0} oturum</Text>
                    </View>
                    <View style={styles.modeCard}>
                        <View style={[styles.modeDot, { backgroundColor: colors.success }]} />
                        <Text style={styles.modeCardLabel}>Sosyal</Text>
                        <Text style={styles.modeCardValue}>{Math.floor(socialDuration / 60)} dk</Text>
                        <Text style={styles.modeCardSubValue}>{modeBreakdown?.social.sessionCount || 0} oturum</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Haftalık Gelişim</Text>
            <View style={styles.chartContainer}>
                <BarChart
                    data={{
                        labels: dailyStats?.map(s => {
                            const d = new Date(s.date);
                            return `${d.getDate()}/${d.getMonth() + 1}`;
                        }) || ['Veri Yok'],
                        datasets: [{ data: dailyStats?.map(s => Math.floor(Number(s.totalDuration) / 60)) || [0] }]
                    }}
                    width={screenWidth - 40}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=" dk"
                    chartConfig={{
                        backgroundColor: colors.surface,
                        backgroundGradientFrom: colors.surface,
                        backgroundGradientTo: colors.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                        labelColor: (opacity = 1) => hexToRgba(colors.textSecondary, opacity),
                        style: { borderRadius: 16 },
                        barPercentage: 0.6,
                    }}
                    style={styles.chart}
                />
            </View>

            <Text style={styles.sectionTitle}>Ders ve Konu Bazlı İstatistikler</Text>
            {subjectBreakdown && subjectBreakdown.length > 0 ? (
                subjectBreakdown.map((subject) => (
                    <SubjectAccordion
                        key={subject.subjectId}
                        subject={subject}
                        expanded={expandedSubjectIds.has(subject.subjectId)}
                        onToggle={() => toggleSubject(subject.subjectId)}
                    />
                ))
            ) : (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>Henüz tamamlanmış bir çalışma seansın yok.</Text>
                </View>
            )}
        </ScrollView>
    );
}

const createStyles = (colors: ThemeColors, shadows: Shadows) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    scrollContent: {
        padding: 20
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
    },
    loadingText: {
        marginTop: 10,
        color: colors.textSecondary,
        fontWeight: '500'
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: SPACING.lg
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginTop: SPACING.md,
        marginBottom: SPACING.md
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm
    },
    card: {
        backgroundColor: colors.surface,
        width: '48%',
        padding: SPACING.lg,
        borderRadius: 12,
        marginBottom: SPACING.md,
        alignItems: 'center',
        ...shadows.light,
    },
    cardTitle: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
        textAlign: 'center'
    },
    cardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: SPACING.xs
    },
    chartContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingVertical: SPACING.sm,
        ...shadows.light,
    },
    chart: {
        borderRadius: 16
    },
    modeContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        ...shadows.light,
    },
    modeBarTrack: {
        flexDirection: 'row',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        backgroundColor: colors.border,
        marginBottom: SPACING.md,
    },
    modeBarFill: {
        height: '100%',
    },
    modeCardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.sm,
    },
    modeCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    modeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginBottom: SPACING.xs,
    },
    modeCardLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    modeCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: SPACING.xs,
    },
    modeCardSubValue: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    subjectCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: SPACING.sm,
        overflow: 'hidden',
        ...shadows.light,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
    },
    subjectHeaderText: {
        flex: 1,
        paddingRight: SPACING.sm,
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    subjectMeta: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    expandIcon: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    topicsContainer: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    topicRow: {
        paddingVertical: SPACING.xs,
    },
    topicName: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    topicMeta: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    emptyStateContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: SPACING.lg,
        alignItems: 'center',
        ...shadows.light,
    },
    emptyStateText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
