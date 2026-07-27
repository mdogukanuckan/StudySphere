
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMyTopicTaskOverview } from '../hooks/useTopicTask';
import { SPACING, ThemeColors, Shadows } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

export const TopicTaskOverviewStrip: React.FC = () => {
    const { colors, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

    const navigation = useNavigation<any>();
    const { data: items, isLoading } = useMyTopicTaskOverview();

    const handlePress = (topicId: string, topicName: string) => {
        navigation.navigate('Ekle', { screen: 'TopicDetail', params: { topicId, topicName } });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} size="small" />
            </View>
        );
    }

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <View style={styles.wrapper}>
            <Text style={styles.title}>📋 Görev & Not Eklediklerin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {items.map((item) => (
                    <TouchableOpacity
                        key={item.topicId}
                        style={styles.card}
                        onPress={() => handlePress(item.topicId, item.topicName)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.subjectName} numberOfLines={1}>{item.subjectName}</Text>
                        <Text style={styles.topicName} numberOfLines={1}>{item.topicName}</Text>
                        {item.taskCount > 0 && (
                            <Text style={styles.taskCount}>
                                {item.completedCount}/{item.taskCount} görev
                            </Text>
                        )}
                        {!!item.notes && (
                            <Text style={styles.notePreview} numberOfLines={1}>📝 {item.notes}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const createStyles = (colors: ThemeColors, shadows: Shadows) => StyleSheet.create({
    wrapper: { marginTop: SPACING.md, marginBottom: SPACING.sm },
    loadingContainer: { paddingVertical: SPACING.md, alignItems: 'center' },
    title: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginLeft: SPACING.lg, marginBottom: SPACING.sm },
    scrollContent: { paddingHorizontal: SPACING.lg },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: SPACING.md,
        width: 160,
        marginRight: SPACING.sm,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.light,
    },
    subjectName: { fontSize: 11, fontWeight: '600', color: colors.primary, textTransform: 'uppercase' },
    topicName: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginTop: 2, marginBottom: SPACING.xs },
    taskCount: { fontSize: 12, color: colors.textSecondary },
    notePreview: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
