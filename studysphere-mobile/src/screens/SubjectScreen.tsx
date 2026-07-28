
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CustomButton } from '../components/CustomButton';
import { SwipeableCrudList } from '../components/SwipeableCrudList';
import { EntityFormModal } from '../components/EntityFormModal';
import { SPACING, ThemeColors, GlobalStyles, Shadows } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

import { UniverseStackParamList } from '../types/navigation';
import { useSubjects, useCreateSubject, useDeleteSubject, useUpdateSubject } from '../hooks/useSubject';
import { Subject } from '../types/subject';
import { getErrorMessage } from '../utils/errorMessage';

type SubjectsScreenRouteProp = RouteProp<UniverseStackParamList, 'Subjects'>;
type SubjectsScreenNavigationProp = NativeStackNavigationProp<UniverseStackParamList, 'Subjects'>;

export default function SubjectScreen() {
    const { colors, shadows, globalStyles } = useTheme();
    const styles = React.useMemo(() => createStyles(colors, shadows, globalStyles), [colors, shadows, globalStyles]);

    const route = useRoute<SubjectsScreenRouteProp>();
    const navigation = useNavigation<SubjectsScreenNavigationProp>();

    const { universeId, universeName } = route.params;

    const { data: allSubjects, isLoading, isError, refetch, isRefetching } = useSubjects(universeId);
    const { mutate: createSubject, isPending: isCreating } = useCreateSubject();
    const { mutate: updateSubject, isPending: isUpdating } = useUpdateSubject();
    const { mutate: deleteSubject } = useDeleteSubject();

    const subjects = allSubjects?.filter((sub) => sub.universeId === universeId) || [];

    
    const [isModalVisible, setModalVisible] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    
    const [targetDateText, setTargetDateText] = useState('');
    const [targetLabelText, setTargetLabelText] = useState('');
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    const openCreateModal = () => {
        setEditingSubject(null);
        setSubjectName('');
        setTargetDateText('');
        setTargetLabelText('');
        setModalVisible(true);
    };

    const openEditModal = (subject: Subject) => {
        setEditingSubject(subject);
        setSubjectName(subject.name);
        setTargetDateText(subject.targetDate ?? '');
        setTargetLabelText(subject.targetLabel ?? '');
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingSubject(null);
        setSubjectName('');
        setTargetDateText('');
        setTargetLabelText('');
    };

    const handleDelete = (subject: Subject) => {
        Alert.alert(
            'Dersi Sil',
            'Bu dersi silmek istediğine emin misin? Bu işlem geri alınamaz.',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        deleteSubject(subject.id, {
      
                            onSuccess: (result) => {
                                if (result.archived) {
                                    Alert.alert(
                                        'Ders Arşivlendi',
                                        'Bu derse ait geçmiş çalışma seansları/odaları olduğu için kalıcı olarak silinemedi; bunun yerine arşivlendi ve artık ders listende görünmeyecek.',
                                    );
                                }
                            },
                            onError: (error: any) => {
                                Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Ders silinirken bir hata oluştu.'));
                            },
                        });
                    },
                },
            ]
        );
    };

    const handleSave = () => {
        if (!subjectName.trim()) {
            Alert.alert('Hata', 'Ders ismi boş olamaz.');
            return;
        }

      
        const trimmedDate = targetDateText.trim();
        let targetDatePayload: string | null = null;
        if (trimmedDate) {
            const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(trimmedDate);
            const parsed = isValidFormat ? new Date(`${trimmedDate}T00:00:00`) : null;
            if (!isValidFormat || !parsed || Number.isNaN(parsed.getTime())) {
                Alert.alert('Hata', 'Hedef tarihi YYYY-AA-GG formatında (örn: 2026-08-15) geçerli bir tarih olmalı.');
                return;
            }
            targetDatePayload = trimmedDate;
        }
        const targetLabelPayload = targetLabelText.trim() || null;

        if (editingSubject) {
            updateSubject(
                {
                    id: editingSubject.id,
                    data: { name: subjectName.trim(), targetDate: targetDatePayload, targetLabel: targetLabelPayload },
                },
                {
                    onSuccess: closeModal,
                    onError: (error: any) => {
                        Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Ders güncellenirken bir hata oluştu.'));
                    },
                }
            );
            return;
        }

        createSubject(
            { name: subjectName.trim(), universeId, targetDate: targetDatePayload, targetLabel: targetLabelPayload },
            {
                onSuccess: closeModal,
                onError: (error: any) => {
                    Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Ders eklenirken bir hata oluştu.'));
                },
            }
        );
    };

    const getCountdownText = (subject: Subject): string | null => {
        if (!subject.targetDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(`${subject.targetDate}T00:00:00`);
        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const label = subject.targetLabel?.trim() || 'Hedef';
        if (diffDays > 0) return `🎯 ${label}: ${diffDays} gün kaldı`;
        if (diffDays === 0) return `🎯 ${label}: bugün!`;
        return `🎯 ${label}: ${Math.abs(diffDays)} gün önce geçti`;
    };

    const handleSubjectPress = (subject: Subject) => {
        navigation.navigate('Topics', { subjectId: subject.id, subjectName: subject.name });
    };

    if (isLoading && !allSubjects) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.stateText}>Dersler taranıyor...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.centerContainer}>
                <Text style={[styles.stateText, { color: colors.error, textAlign: 'center' }]}>
                    Veriler alınırken bir bağlantı sorunu yaşandı.
                </Text>
                <CustomButton title="Tekrar Dene" onPress={() => refetch()} style={{ marginTop: SPACING.md }} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('Universes');
                            }
                        }}
                        style={styles.backButton}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{universeName}</Text>
                        <Text style={styles.headerSubtitle}>Evrenine ait dersler listeleniyor</Text>
                    </View>
                </View>
            </View>

            <SwipeableCrudList
                data={subjects}
                keyExtractor={(item: Subject) => item.id}
                renderTitle={(item) => item.name}
                renderSubtitle={(item) => getCountdownText(item)}
                renderFooter={(item) => `Eklenme: ${new Date(item.createdAt).toLocaleDateString('tr-TR')}`}
                onPressItem={handleSubjectPress}
                onEdit={openEditModal}
                onDelete={handleDelete}
                refreshing={isRefetching}
                onRefresh={refetch}
                emptyTitle="Henüz bir ders eklememişsin."
                emptySubtitle="Sağ alttaki butona basarak ilk adımı at!"
            />

            <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openCreateModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <EntityFormModal
                visible={isModalVisible}
                title={editingSubject ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}
                onCancel={closeModal}
                onSubmit={handleSave}
                isSubmitting={isCreating || isUpdating}
                submitLabel={editingSubject ? 'Güncelle' : 'Kaydet'}
                fields={[
                    {
                        key: 'name',
                        label: 'Ders Adı *',
                        placeholder: 'Örn: Veri Yapıları ve Algoritmalar',
                        value: subjectName,
                        onChangeText: setSubjectName,
                        leftIcon: 'book',
                    },
                    {
                        key: 'targetLabel',
                        label: 'Hedef Etiketi (opsiyonel)',
                        placeholder: 'Örn: Vize, Final, Bütünleme',
                        value: targetLabelText,
                        onChangeText: setTargetLabelText,
                        leftIcon: 'flag',
                    },
                    {
                        key: 'targetDate',
                        label: 'Hedef Tarihi (opsiyonel)',
                        placeholder: 'YYYY-AA-GG (örn: 2026-08-15)',
                        value: targetDateText,
                        onChangeText: setTargetDateText,
                        leftIcon: 'calendar',
                    },
                ]}
            />
        </View>
    );
}

const createStyles = (colors: ThemeColors, shadows: Shadows, globalStyles: GlobalStyles) => StyleSheet.create({
    container: { ...globalStyles.screenContainer },
    centerContainer: { ...globalStyles.screenContainer, ...globalStyles.center },
    stateText: { ...globalStyles.subtitle, marginTop: SPACING.md },

    header: {
        paddingTop: Platform.OS === 'ios' ? SPACING.xl * 2 : SPACING.xl,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: SPACING.md, padding: SPACING.xs },
    backButtonText: { fontSize: 24, color: colors.text, fontWeight: 'bold' },
    headerTitleContainer: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
    headerSubtitle: { ...globalStyles.subtitle, marginTop: 2 },

    fab: {
        position: 'absolute', right: SPACING.xl, bottom: SPACING.xl,
        backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28,
        ...globalStyles.center, ...shadows.medium,
    },
    fabText: { color: colors.surface, fontSize: 28, fontWeight: '300', marginTop: -2 },
});
