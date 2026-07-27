
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CustomButton } from '../components/CustomButton';
import { SwipeableCrudList } from '../components/SwipeableCrudList';
import { EntityFormModal } from '../components/EntityFormModal';
import { UniverseStackParamList } from '../types/navigation';

import { useUniverses, useCreateUniverse, useUpdateUniverse, useDeleteUniverse } from '../hooks/useUniverses';
import { Universe } from '../types/universe';
import { SPACING, ThemeColors, GlobalStyles, Shadows } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../utils/errorMessage';

export default function UniverseScreen() {
  const { colors, shadows, globalStyles } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, shadows, globalStyles), [colors, shadows, globalStyles]);

  const [isModalVisible, setModalVisible] = useState(false);
  const [universeName, setUniverseName] = useState('');
  const [universeDesc, setUniverseDesc] = useState('');
  const [editingUniverse, setEditingUniverse] = useState<Universe | null>(null);

  type UniversesScreenProp = NativeStackNavigationProp<UniverseStackParamList, 'Universes'>;
  const navigation = useNavigation<UniversesScreenProp>();

  const { data: universes, isLoading, isError, refetch, isRefetching } = useUniverses();
  const { mutate: createUniverse, isPending: isCreating } = useCreateUniverse();
  const { mutate: updateUniverse, isPending: isUpdating } = useUpdateUniverse();
  const { mutate: deleteUniverse } = useDeleteUniverse();

  const handleUniversePress = (universe: Universe) => {
    navigation.navigate('Subjects', { universeId: universe.id, universeName: universe.name });
  };

  const handleDelete = (universe: Universe) => {
    Alert.alert(
      'Evreni Sil',
      'Bu evreni silmek istediğinize emin misiniz? Bu işlem ilgili ders ve konuları da etkileyebilir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteUniverse(universe.id, {
              onSuccess: (result) => {
                if (result.archived) {
                  Alert.alert(
                    'Evren Arşivlendi',
                    'Bu evrene ait geçmiş kayıtlar olduğu için kalıcı olarak silinemedi; bunun yerine arşivlendi ve artık evren listende görünmeyecek.',
                  );
                }
              },
              onError: (error: any) => {
                Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Evren silinirken bir hata oluştu.'));
              },
            });
          },
        },
      ]
    );
  };

  const openEditModal = (universe: Universe) => {
    setEditingUniverse(universe);
    setUniverseName(universe.name);
    setUniverseDesc(universe.description || '');
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingUniverse(null);
    setUniverseName('');
    setUniverseDesc('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingUniverse(null);
    setUniverseName('');
    setUniverseDesc('');
  };

  const handleSave = () => {
    if (!universeName.trim()) {
      Alert.alert('Hata', 'Çalışma evreni ismi boş olamaz.');
      return;
    }

    if (editingUniverse) {
      updateUniverse(
        { id: editingUniverse.id, data: { name: universeName.trim(), description: universeDesc.trim() } },
        {
          onSuccess: closeModal,
          onError: (error: any) => {
            Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Evren güncellenirken bir hata oluştu.'));
          },
        }
      );
      return;
    }

    createUniverse(
      { name: universeName.trim(), description: universeDesc.trim() },
      {
        onSuccess: closeModal,
        onError: (error: any) => {
          Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Bir hata oluştu.'));
        },
      }
    );
  };

  if (isLoading && !universes) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.stateText}>Evrenler taranıyor...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.stateText, { color: colors.error }]}>Veriler alınırken bir bağlantı sorunu yaşandı.</Text>
        <CustomButton title="Tekrar Dene" onPress={() => refetch()} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Çalışma Evrenleri</Text>
        <Text style={styles.headerSubtitle}>Tüm derslerini ve konularını yönet</Text>
      </View>

      <SwipeableCrudList
        data={universes || []}
        keyExtractor={(item: Universe) => item.id}
        renderTitle={(item) => item.name}
        renderSubtitle={(item) => item.description}
        renderFooter={(item) => `Eklenme: ${new Date(item.createdAt).toLocaleDateString('tr-TR')}`}
        onPressItem={handleUniversePress}
        onEdit={openEditModal}
        onDelete={handleDelete}
        refreshing={isRefetching}
        onRefresh={refetch}
        emptyTitle="Henüz bir evren oluşturmadın."
        emptySubtitle="Sağ alttaki butona basarak ilk adımını at!"
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <EntityFormModal
        visible={isModalVisible}
        title={editingUniverse ? 'Evren Güncelle' : 'Yeni Evren Oluştur'}
        onCancel={closeModal}
        onSubmit={handleSave}
        isSubmitting={isCreating || isUpdating}
        fields={[
          {
            key: 'name',
            label: 'Evren Adı *',
            placeholder: 'Örn: Bilgisayar Mühendisliği',
            value: universeName,
            onChangeText: setUniverseName,
            leftIcon: 'folder',
          },
          {
            key: 'description',
            label: 'Açıklama (Opsiyonel)',
            placeholder: 'Evrenin hakkında kısa bir not...',
            value: universeDesc,
            onChangeText: setUniverseDesc,
            multiline: true,
            numberOfLines: 4,
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
    padding: SPACING.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  headerSubtitle: { ...globalStyles.subtitle, marginTop: SPACING.xs },

  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...globalStyles.center,
    ...shadows.medium,
  },
  fabText: { color: colors.surface, fontSize: 28, fontWeight: '300', marginTop: -2 },
});
