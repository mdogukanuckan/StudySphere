import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, Text, Switch, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomButton } from '../components/CustomButton';
import { CustomInput } from '../components/CustomInput';
import { useRoomDetails, useUpdateRoom, useCloseRoom } from '../hooks/useStudyRooms';
import { UpdateRoomFormValues } from '../types/studyRoom';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/theme';
import { getErrorMessage } from '../utils/errorMessage';
import { validateRoomBasicFields } from '../utils/validateRoomForm';

import type { StudyRoomStackParamList } from '../navigation/StudyRoomNavigator';

const initialFormState = {
  title: '',
  description: '',
  maxParticipants: '10',
  isClosed: false,
};

type Props = NativeStackScreenProps<StudyRoomStackParamList, 'RoomSettings'>;

export default function RoomSettingsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: room, isLoading } = useRoomDetails(id);
  const { mutate: updateRoom, isPending: isUpdating } = useUpdateRoom(id);
  const { mutate: closeRoom, isPending: isClosing } = useCloseRoom(id);
  const isPending = isUpdating || isClosing;
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (room) {
      setForm({
        title: room.title,
        description: room.description || '',
        maxParticipants: room.maxParticipants.toString(),
        isClosed: false,
      });
    }
  }, [room]);

  const handleChange = (field: keyof typeof initialFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors = validateRoomBasicFields(form);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };


  const execClose = () => {
    closeRoom(undefined, {
      onSuccess: () => navigation.popToTop(),
      onError: (error: any) => {
        Alert.alert('Oda Kapatılamadı', getErrorMessage(error, 'Oda kapatılırken bir hata oluştu.'));
      },
    });
  };

  const execUpdate = (data: UpdateRoomFormValues) => {
    updateRoom(data, {
      onSuccess: () => navigation.goBack(),
      onError: (error: any) => {
        Alert.alert('Kaydedilemedi', getErrorMessage(error, 'Oda güncellenirken bir hata oluştu.'));
      },
    });
  };

  const onSubmit = () => {
    if (!validate()) return;

    if (form.isClosed) {
      Alert.alert('Dikkat!', 'Odayı kapatmak istediğinize emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Kapat', style: 'destructive', onPress: execClose },
      ]);
      return;
    }

    const payload: UpdateRoomFormValues = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      maxParticipants: Number(form.maxParticipants),
      isClosed: false,
    };
    execUpdate(payload);
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.centeredContainerWithPadding}>
        <Text style={styles.errorText}>Oda bilgileri bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Oda Ayarları</Text>

      <CustomInput
        label="Oda Başlığı"
        value={form.title}
        onChangeText={(value) => handleChange('title', value)}
        error={errors.title}
      />

      <CustomInput
        label="Açıklama"
        value={form.description}
        onChangeText={(value) => handleChange('description', value)}
        error={errors.description}
        multiline
      />

      <CustomInput
        label="Maksimum Katılımcı"
        keyboardType="numeric"
        value={form.maxParticipants}
        onChangeText={(value) => handleChange('maxParticipants', value)}
        error={errors.maxParticipants}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Odayı Kapat (Geri Alınamaz)</Text>
        <Switch
          value={form.isClosed}
          onValueChange={(value) => handleChange('isClosed', value)}
          trackColor={{ true: colors.error }}
        />
      </View>

      <CustomButton
        title="Ayarları Kaydet"
        onPress={onSubmit}
        loading={isPending}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  centeredContainerWithPadding: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    backgroundColor: colors.error + '1A',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.error + '55',
  },
  switchLabel: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
