import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSubjectPerformance } from "../hooks/useSubjectPerformance";
import { SubjectBreakdown } from "../types/statistics";
import { SPACING, ThemeColors, Shadows } from "../theme/theme";
import { useTheme } from "../context/ThemeContext";

const formatMinutes = (durationSeconds: number) => `${Math.floor(durationSeconds / 60)} dk`;

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

export default function SubjectStatsScreen() {
    const { colors, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(new Set());
    const { data: subjectBreakdown, isLoading } = useSubjectPerformance();

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

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size='large' color={colors.primary} />
                <Text style={styles.loadingText}>Veriler Analiz Ediliyor...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {subjectBreakdown && subjectBreakdown.length > 0 ? (
                subjectBreakdown.map((universe) => (
                    <View key={universe.universeId} style={styles.universeGroup}>
                        <Text style={styles.universeTitle}>{universe.universeName}</Text>
                        {universe.subjects.map((subject) => (
                            <SubjectAccordion
                                key={subject.subjectId}
                                subject={subject}
                                expanded={expandedSubjectIds.has(subject.subjectId)}
                                onToggle={() => toggleSubject(subject.subjectId)}
                            />
                        ))}
                    </View>
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
    universeGroup: {
        marginBottom: SPACING.lg,
    },
    universeTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.sm,
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
