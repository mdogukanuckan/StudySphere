import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SwipeableCrudList } from '../components/SwipeableCrudList';
import { EntityFormModal } from '../components/EntityFormModal';
import { SPACING, ThemeColors, GlobalStyles, Shadows } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

import { UniverseStackParamList } from '../types/navigation';
import { useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from '../hooks/useTopic';
import { Topic } from '../types/topic';
import { StudySessionSetupModal } from '../components/StudySessionSetupModal';
import { useStartSessionFlow } from '../hooks/useStartSessionFlow';
import { getErrorMessage } from '../utils/errorMessage';

type TopicsScreenRouteProp = RouteProp<UniverseStackParamList, 'Topics'>;
type TopicsScreenNavigationProp = NativeStackNavigationProp<UniverseStackParamList, 'Topics'>;

export default function TopicScreen() {
    const { colors, shadows, globalStyles } = useTheme();
    const styles = React.useMemo(() => createStyles(colors, shadows, globalStyles), [colors, shadows, globalStyles]);

    const route = useRoute<TopicsScreenRouteProp>();
    const navigation = useNavigation<TopicsScreenNavigationProp>();

    const { subjectId, subjectName } = route.params;

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [topicName, setTopicName] = useState('');
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

    const sessionFlow = useStartSessionFlow();

    const { data: topics, isLoading, isRefetching, refetch } = useTopics(subjectId);
    const createTopicMutation = useCreateTopic();
    const updateTopicMutation = useUpdateTopic();
    const deleteTopicMutation = useDeleteTopic();

    const handleDelete = (topic: Topic) => {
        Alert.alert(
            'Konuyu Sil',
            'Bu konuyu silmek istediğinize emin misiniz? (Bu işlem geri alınamaz)',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        deleteTopicMutation.mutate(topic.id, {
                            onError: (error: any) => {
                                Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Konu silinirken bir hata oluştu.'));
                            },
                        });
                    },
                },
            ]
        );
    };

    const openEditModal = (topic: Topic) => {
        setEditingTopic(topic);
        setTopicName(topic.name);
        setIsModalVisible(true);
    };

    const openCreateModal = () => {
        setEditingTopic(null);
        setTopicName('');
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setEditingTopic(null);
        setTopicName('');
    };

    const handleSave = () => {
        if (!topicName.trim()) {
            Alert.alert('Hata', 'Konu adı boş olamaz!');
            return;
        }

        if (editingTopic) {
            updateTopicMutation.mutate(
                { id: editingTopic.id, data: { name: topicName.trim() } },
                {
                    onSuccess: closeModal,
                    onError: (error: any) => {
                        Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Konu güncellenirken bir hata oluştu.'));
                    },
                }
            );
        } else {
            createTopicMutation.mutate(
                { subjectId, name: topicName.trim() },
                {
                    onSuccess: closeModal,
                    onError: (error: any) => {
                        Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Konu eklenirken bir hata oluştu.'));
                    },
                }
            );
        }
    };

    const handleTopicPress = (topic: Topic) => {
        sessionFlow.openFor({ id: topic.id, name: topic.name });
    };

    if (isLoading) {
        return (
            <View style={globalStyles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={globalStyles.screenContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Konular</Text>
                    <Text style={styles.headerSubtitle}>{subjectName} dersinin konuları</Text>
                </View>
            </View>

            <SwipeableCrudList
                data={topics || []}
                keyExtractor={(item: Topic) => item.id}
                renderTitle={(item) => item.name}
                onPressItem={handleTopicPress}
                renderAccessory={(item) => (
                    <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => navigation.navigate('TopicDetail', { topicId: item.id, topicName: item.name })}
                    >
                        <Text style={styles.detailButtonText}>📋 Görevler & Notlar</Text>
                    </TouchableOpacity>
                )}
                onEdit={openEditModal}
                onDelete={handleDelete}
                refreshing={isRefetching}
                onRefresh={refetch}
                emptyTitle="Henüz bir konu eklenmemiş."
                emptySubtitle="Sağ alttaki butona tıklayarak ilk konunuzu oluşturabilirsiniz."
            />

            <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <EntityFormModal
                visible={isModalVisible}
                title={editingTopic ? 'Konuyu Güncelle' : 'Yeni Konu Ekle'}
                onCancel={closeModal}
                onSubmit={handleSave}
                isSubmitting={createTopicMutation.isPending || updateTopicMutation.isPending}
                submitLabel={editingTopic ? 'Güncelle' : 'Kaydet'}
                cancelLabel="İptal"
                fields={[
                    {
                        key: 'name',
                        placeholder: 'Örn: Türev, Mutlak Değer...',
                        value: topicName,
                        onChangeText: setTopicName,
                    },
                ]}
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

const createStyles = (colors: ThemeColors, shadows: Shadows, globalStyles: GlobalStyles) => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, backgroundColor: colors.surface, marginBottom: SPACING.md },
    backButton: { marginRight: SPACING.md, padding: SPACING.xs },
    backButtonText: { fontSize: 24, color: colors.text, fontWeight: 'bold' },
    headerTitleContainer: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
    headerSubtitle: { ...globalStyles.subtitle, marginTop: 2 },
    fab: { position: 'absolute', right: SPACING.xl, bottom: SPACING.xl, backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28, ...globalStyles.center, ...shadows.medium },
    fabText: { color: colors.surface, fontSize: 28, fontWeight: '300', marginTop: -2 },
    detailButton: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
    },
    detailButtonText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
});
