
import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    useWindowDimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { TopicTaskRow } from '../components/TopicTaskRow';
import {
    useMyTopicTasks,
    useMyTopicTaskOverview,
    useUpdateTopicTask,
    useDeleteTopicTask,
} from '../hooks/useTopicTask';
import { TopicTaskOverviewItem, TopicTaskWithContext } from '../types/topicTask';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../utils/errorMessage';

const TABS = [
    { key: 'TASKS' as const, label: 'Görevler', emptyText: 'Henüz hiçbir konuya görev eklemedin.' },
    { key: 'NOTES' as const, label: 'Notlar', emptyText: 'Henüz hiçbir konuya not eklemedin.' },
];

export default function MyTasksScreen() {
    const { colors, globalStyles } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const { data: tasks, isLoading: isTasksLoading, isError: isTasksError, refetch: refetchTasks } = useMyTopicTasks();
    const { data: overview, isLoading: isOverviewLoading, isError: isOverviewError, refetch: refetchOverview } = useMyTopicTaskOverview();
    const updateTaskMutation = useUpdateTopicTask();
    const deleteTaskMutation = useDeleteTopicTask();

    const notedTopics = useMemo(
        () => (overview ?? []).filter((item) => !!item.notes),
        [overview]
    );

    const goToTab = (index: number) => {
        setActiveTabIndex(index);
        scrollRef.current?.scrollTo({ x: index * width, animated: true });
    };

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveTabIndex(index);
    };

    const handleOpenTopic = (topicId: string, topicName: string) => {

        navigation.navigate('Ekle', { screen: 'TopicDetail', params: { topicId, topicName } });
    };

    const handleToggleTask = (task: TopicTaskWithContext) => {
        updateTaskMutation.mutate(
            { id: task.id, data: { isCompleted: !task.isCompleted } },
            {
                onError: (error: any) => {
                    Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Görev güncellenirken bir hata oluştu.'));
                },
            }
        );
    };

    const handleDeleteTask = (taskId: string) => {
        Alert.alert('Görevi Sil', 'Bu görevi silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: () => {
                    deleteTaskMutation.mutate(taskId, {
                        onError: (error: any) => {
                            Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Görev silinirken bir hata oluştu.'));
                        },
                    });
                },
            },
        ]);
    };

    const handleSaveNote = (task: TopicTaskWithContext, notes: string) => {
        updateTaskMutation.mutate(
            { id: task.id, data: { notes } },
            {
                onError: (error: any) => {
                    Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Not kaydedilirken bir hata oluştu.'));
                },
            }
        );
    };

    const renderTasksTab = () => {
        if (isTasksLoading) {
            return (
                <View style={[styles.pageContainer, { width }, styles.center]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            );
        }
        if (isTasksError) {
            return (
                <View style={[styles.pageContainer, { width }, styles.center]}>
                    <Text style={styles.errorText}>Görevler yüklenirken bir hata oluştu.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetchTasks()}>
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <View style={{ width }}>
                <FlatList
                    data={tasks ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TopicTaskRow
                            task={item}
                            onToggle={() => handleToggleTask(item)}
                            onDelete={() => handleDeleteTask(item.id)}
                            onSaveNote={(notes) => handleSaveNote(item, notes)}
                            isSavingNote={updateTaskMutation.isPending}
                            topLabel={
                                <TouchableOpacity onPress={() => handleOpenTopic(item.topicId, item.topicName)}>
                                    <Text style={styles.topLabel} numberOfLines={1}>
                                        {item.subjectName} › {item.topicName}
                                    </Text>
                                </TouchableOpacity>
                            }
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{TABS[0].emptyText}</Text>
                        </View>
                    }
                    refreshing={isTasksLoading}
                    onRefresh={refetchTasks}
                />
            </View>
        );
    };

    const renderNotesTab = () => {
        if (isOverviewLoading) {
            return (
                <View style={[styles.pageContainer, { width }, styles.center]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            );
        }
        if (isOverviewError) {
            return (
                <View style={[styles.pageContainer, { width }, styles.center]}>
                    <Text style={styles.errorText}>Notlar yüklenirken bir hata oluştu.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetchOverview()}>
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <View style={{ width }}>
                <FlatList
                    data={notedTopics}
                    keyExtractor={(item) => item.topicId}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }: { item: TopicTaskOverviewItem }) => (
                        <TouchableOpacity
                            style={styles.noteCard}
                            onPress={() => handleOpenTopic(item.topicId, item.topicName)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.noteCardSubject} numberOfLines={1}>{item.subjectName}</Text>
                            <Text style={styles.noteCardTopic} numberOfLines={1}>{item.topicName}</Text>
                            <Text style={styles.noteCardText} numberOfLines={3}>{item.notes}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{TABS[1].emptyText}</Text>
                        </View>
                    }
                    refreshing={isOverviewLoading}
                    onRefresh={refetchOverview}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={globalStyles.screenContainer} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Görevlerim</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.tabBar}>
                {TABS.map((tab, index) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabItem, activeTabIndex === index && styles.tabItemActive]}
                        onPress={() => goToTab(index)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabLabel, activeTabIndex === index && styles.tabLabelActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
            >
                {renderTasksTab()}
                {renderNotesTab()}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    pageContainer: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: { padding: SPACING.xs, minWidth: 32 },
    backButtonText: { fontSize: 24, color: colors.text, fontWeight: 'bold' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        marginBottom: SPACING.xs,
        backgroundColor: colors.border,
        borderRadius: 10,
        padding: 4,
    },
    tabItem: {
        flex: 1,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    tabItemActive: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    tabLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    tabLabelActive: { color: colors.primary },
    listContent: { padding: SPACING.lg },
    topLabel: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: SPACING.xs },
    errorText: { color: colors.error, marginBottom: SPACING.md, textAlign: 'center', fontSize: 16, fontWeight: '500' },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
    },
    retryButtonText: { color: colors.surface, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: SPACING.xxl },
    emptyText: { color: colors.textSecondary, fontSize: 16, textAlign: 'center' },
    noteCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    noteCardSubject: { fontSize: 11, fontWeight: '600', color: colors.primary, textTransform: 'uppercase' },
    noteCardTopic: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 2, marginBottom: SPACING.xs },
    noteCardText: { fontSize: 14, color: colors.textSecondary },
});
