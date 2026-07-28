
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CustomButton } from '../components/CustomButton';
import { TopicTaskRow } from '../components/TopicTaskRow';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

import { UniverseStackParamList } from '../types/navigation';
import { useTopic, useUpdateTopic } from '../hooks/useTopic';
import { useTopicTasks, useCreateTopicTask, useUpdateTopicTask, useDeleteTopicTask } from '../hooks/useTopicTask';
import { getErrorMessage } from '../utils/errorMessage';

type TopicDetailRouteProp = RouteProp<UniverseStackParamList, 'TopicDetail'>;
type TopicDetailNavigationProp = NativeStackNavigationProp<UniverseStackParamList, 'TopicDetail'>;

export default function TopicDetailScreen() {
    const { colors, globalStyles } = useTheme();
    const styles = React.useMemo(() => createStyles(colors, globalStyles), [colors, globalStyles]);

    const route = useRoute<TopicDetailRouteProp>();
    const navigation = useNavigation<TopicDetailNavigationProp>();
    const { topicId, topicName } = route.params;

    const { data: topic, isLoading: isTopicLoading } = useTopic(topicId);
    const updateTopicMutation = useUpdateTopic();
    const [notesText, setNotesText] = useState('');
    const [isNotesDirty, setIsNotesDirty] = useState(false);

    useEffect(() => {
        if (topic && !isNotesDirty) {
            setNotesText(topic.notes ?? '');
        }
    }, [topic, isNotesDirty]);

    const handleSaveNotes = () => {
        updateTopicMutation.mutate(
            { id: topicId, data: { notes: notesText } },
            {
                onSuccess: () => setIsNotesDirty(false),
                onError: (error: any) => {
                    Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Not kaydedilirken bir hata oluştu.'));
                },
            }
        );
    };

    const { data: tasks, isLoading: isTasksLoading } = useTopicTasks(topicId);
    const createTaskMutation = useCreateTopicTask();
    const updateTaskMutation = useUpdateTopicTask();
    const deleteTaskMutation = useDeleteTopicTask();
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleAddTask = () => {
        const title = newTaskTitle.trim();
        if (!title) return;
        createTaskMutation.mutate(
            { title, topicId },
            {
                onSuccess: () => setNewTaskTitle(''),
                onError: (error: any) => {
                    Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Görev eklenirken bir hata oluştu.'));
                },
            }
        );
    };

    const handleToggleTask = (id: string, isCompleted: boolean) => {
        updateTaskMutation.mutate(
            { id, data: { isCompleted: !isCompleted } },
            {
                onError: (error: any) => {
                    Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Görev güncellenirken bir hata oluştu.'));
                },
            }
        );
    };

    const handleDeleteTask = (id: string) => {
        Alert.alert('Görevi Sil', 'Bu görevi silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil',
                style: 'destructive',
                onPress: () => {
                    deleteTaskMutation.mutate(id, {
                        onError: (error: any) => {
                            Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Görev silinirken bir hata oluştu.'));
                        },
                    });
                },
            },
        ]);
    };

    const completedCount = (tasks ?? []).filter((t) => t.isCompleted).length;

    return (
        <KeyboardAvoidingView
            style={globalStyles.screenContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{topicName}</Text>
                    <Text style={styles.headerSubtitle}>Konu detayı: görevler ve notlar</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {}
                <Text style={styles.sectionTitle}>
                    Görevler {tasks && tasks.length > 0 ? `(${completedCount}/${tasks.length})` : ''}
                </Text>

                {isTasksLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: SPACING.md }} />
                ) : (tasks ?? []).length === 0 ? (
                    <Text style={styles.emptyText}>Bu konu için henüz bir görev eklenmemiş.</Text>
                ) : (
                    (tasks ?? []).map((task) => (
                        <TopicTaskRow
                            key={task.id}
                            task={task}
                            onToggle={() => handleToggleTask(task.id, task.isCompleted)}
                            onDelete={() => handleDeleteTask(task.id)}
                            onSaveNote={(notes) => {
                                updateTaskMutation.mutate(
                                    { id: task.id, data: { notes } },
                                    {
                                        onError: (error: any) => {
                                            Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Not kaydedilirken bir hata oluştu.'));
                                        },
                                    }
                                );
                            }}
                            isSavingNote={updateTaskMutation.isPending}
                        />
                    ))
                )}

                <View style={styles.addTaskRow}>
                    <TextInput
                        style={styles.addTaskInput}
                        placeholder="Yeni görev ekle..."
                        placeholderTextColor={colors.textSecondary}
                        value={newTaskTitle}
                        onChangeText={setNewTaskTitle}
                        onSubmitEditing={handleAddTask}
                        returnKeyType="done"
                    />
                    <TouchableOpacity
                        style={styles.addTaskButton}
                        onPress={handleAddTask}
                        disabled={createTaskMutation.isPending}
                    >
                        <Text style={styles.addTaskButtonText}>Ekle</Text>
                    </TouchableOpacity>
                </View>

                {}
                <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Notlar</Text>
                {isTopicLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: SPACING.md }} />
                ) : (
                    <>
                        <TextInput
                            style={styles.notesInput}
                            multiline
                            numberOfLines={8}
                            placeholder="Bu konuyla ilgili notlarını buraya yazabilirsin..."
                            placeholderTextColor={colors.textSecondary}
                            value={notesText}
                            onChangeText={(text) => {
                                setNotesText(text);
                                setIsNotesDirty(true);
                            }}
                        />
                        <CustomButton
                            title="Notu Kaydet"
                            onPress={handleSaveNotes}
                            loading={updateTopicMutation.isPending}
                            disabled={!isNotesDirty}
                            style={{ marginTop: SPACING.sm }}
                        />
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: ThemeColors, globalStyles: GlobalStyles) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.lg,
        backgroundColor: colors.surface,
        marginBottom: SPACING.md,
    },
    backButton: { marginRight: SPACING.md, padding: SPACING.xs },
    backButtonText: { fontSize: 24, color: colors.text, fontWeight: 'bold' },
    headerTitleContainer: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
    headerSubtitle: { ...globalStyles.subtitle, marginTop: 2 },

    content: { padding: SPACING.lg, paddingBottom: SPACING.xxl * 2 },
    sectionTitle: { ...globalStyles.title, marginBottom: SPACING.sm },
    emptyText: { ...globalStyles.subtitle, marginBottom: SPACING.md },

    addTaskRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.md },
    addTaskInput: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.text,
        paddingHorizontal: SPACING.md,
        marginRight: SPACING.sm,
    },
    addTaskButton: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: SPACING.lg,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addTaskButtonText: { color: colors.surface, fontWeight: '600' },

    notesInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        backgroundColor: colors.surface,
        color: colors.text,
        padding: SPACING.md,
        minHeight: 140,
        textAlignVertical: 'top',
        fontSize: 15,
    },
});
