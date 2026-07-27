import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, Switch, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreateRoomDto } from '../types/studyRoom';
import { useCreateRoom } from '../hooks/useStudyRooms';
import { useUniverses } from '../hooks/useUniverses';
import { useSubjects } from '../hooks/useSubject';
import { useTopics } from '../hooks/useTopic';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { SelectField } from '../components/SelectField';
import { PickerModal, PickerItem } from '../components/PickerModal';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/theme';
import { validateRoomBasicFields } from '../utils/validateRoomForm';
import { getErrorMessage } from '../utils/errorMessage';
import type { StudyRoomStackParamList } from '../navigation/StudyRoomNavigator';

type PickerTarget = 'universe' | 'subject' | 'topic' | null;

const initialFormState = {
  title: '',
  description: '',
  maxParticipants: '10',
  isPrivate: false,
};

type Props = NativeStackScreenProps<StudyRoomStackParamList, 'CreateRoom'>;

export default function CreateRoomScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { mutate: createRoom, isPending } = useCreateRoom();
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [universe, setUniverse] = useState<PickerItem | null>(null);
  const [subject, setSubject] = useState<PickerItem | null>(null);
  const [topic, setTopic] = useState<PickerItem | null>(null);
  const [activePicker, setActivePicker] = useState<PickerTarget>(null);

  const { data: universes, isLoading: universesLoading } = useUniverses();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects(universe?.id || '');
  const { data: topics, isLoading: topicsLoading } = useTopics(subject?.id || '');

  const handleChange = (field: keyof typeof initialFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelect = (item: PickerItem) => {
    if (activePicker === 'universe') {
      setUniverse(item);
      setSubject(null);
      setTopic(null);
    } else if (activePicker === 'subject') {
      setSubject(item);
      setTopic(null);
    } else if (activePicker === 'topic') {
      setTopic(item.id ? item : null);
    }
    setActivePicker(null);
  };

  const validate = () => {
    const nextErrors = validateRoomBasicFields(form);
    if (!universe) nextErrors.universeId = 'Evren seçimi zorunludur.';
    if (!subject) nextErrors.subjectId = 'Ders seçimi zorunludur.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = () => {
    if (!validate() || !universe || !subject) return;

    const payload: CreateRoomDto = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      universeId: universe.id,
      subjectId: subject.id,
      topicId: topic?.id || undefined,
      maxParticipants: Number(form.maxParticipants),
      isPrivate: form.isPrivate,
    };

    createRoom(payload, {
      onSuccess: (room) => {
        navigation.replace('RoomDetail', { id: room.id });
      },
      onError: (error: any) => {
        Alert.alert('Oda Oluşturulamadı', getErrorMessage(error, 'Oda oluşturulurken bir hata oluştu.'));
      },
    });
  };

  const pickerConfig: Record<Exclude<PickerTarget, null>, {
    title: string;
    items: PickerItem[];
    loading: boolean;
    emptyText: string;
  }> = {
    universe: {
      title: 'Evren Seç',
      items: universes ?? [],
      loading: universesLoading,
      emptyText: 'Henüz evren yok.',
    },
    subject: {
      title: 'Ders Seç',
      items: subjects ?? [],
      loading: subjectsLoading,
      emptyText: 'Bu evrende henüz ders yok.',
    },
    topic: {
      title: 'Konu Seç',
      items: [{ id: '', name: 'Konu Yok (Opsiyonel)' }, ...(topics ?? [])],
      loading: topicsLoading,
      emptyText: 'Bu derste henüz konu yok.',
    },
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Yeni Çalışma Odası Kur</Text>

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

      <SelectField
        label="Evren"
        placeholder="Evren seçin"
        displayValue={universe?.name}
        error={errors.universeId}
        onPress={() => setActivePicker('universe')}
      />

      <SelectField
        label="Ders"
        placeholder={universe ? 'Ders seçin' : 'Önce evren seçin'}
        displayValue={subject?.name}
        error={errors.subjectId}
        disabled={!universe}
        onPress={() => setActivePicker('subject')}
      />

      <SelectField
        label="Konu (Opsiyonel)"
        placeholder={subject ? 'Konu seçin' : 'Önce ders seçin'}
        displayValue={topic?.name}
        disabled={!subject}
        onPress={() => setActivePicker('topic')}
      />

      <CustomInput
        label="Maksimum Katılımcı"
        keyboardType="numeric"
        value={form.maxParticipants}
        onChangeText={(value) => handleChange('maxParticipants', value)}
        error={errors.maxParticipants}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Gizli Oda (Sadece Davet)</Text>
        <Switch
          value={form.isPrivate}
          onValueChange={(value) => handleChange('isPrivate', value)}
        />
      </View>

      <CustomButton
        title="Odayı Oluştur"
        onPress={onSubmit}
        loading={isPending}
        style={styles.submitButton}
      />

      <PickerModal
        visible={activePicker !== null}
        title={activePicker ? pickerConfig[activePicker].title : ''}
        items={activePicker ? pickerConfig[activePicker].items : []}
        loading={activePicker ? pickerConfig[activePicker].loading : false}
        emptyText={activePicker ? pickerConfig[activePicker].emptyText : undefined}
        onSelect={handleSelect}
        onClose={() => setActivePicker(null)}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});
