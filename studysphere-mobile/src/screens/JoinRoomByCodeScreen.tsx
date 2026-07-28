import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useJoinRoomByCode } from '../hooks/useStudyRooms';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../theme/theme';
import { getErrorMessage } from '../utils/errorMessage';
import type { StudyRoomStackParamList } from '../navigation/StudyRoomNavigator';

type Props = NativeStackScreenProps<StudyRoomStackParamList, 'JoinRoomByCode'>;

export default function JoinRoomByCodeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { mutate: joinByCode, isPending } = useJoinRoomByCode();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const onSubmit = () => {
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Davet kodu 6 haneli bir sayı olmalıdır.');
      return;
    }
    setError(undefined);

    joinByCode(trimmed, {
      onSuccess: ({ roomId }) => {
        navigation.replace('RoomDetail', { id: roomId });
      },
      onError: (err: any) => {
        const message = getErrorMessage(err, 'Odaya katılırken bir hata oluştu.');
        if (err?.response?.status === 403) {
          Alert.alert('Katılamadınız', message, [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Doğrula', onPress: () => navigation.getParent()?.getParent()?.navigate('VerifyEmail') },
          ]);
          return;
        }
        Alert.alert('Katılamadınız', message);
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Davet Koduyla Katıl</Text>
      <Text style={styles.subtitle}>
        Bir arkadaşından aldığın 6 haneli davet kodunu gir, gizli odasına katıl.
      </Text>

      <CustomInput
        label="Davet Kodu"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
        error={error}
        placeholder="Örn. 483920"
      />

      <CustomButton
        title="Katıl"
        onPress={onSubmit}
        loading={isPending}
        style={styles.submitButton}
      />
    </View>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: 16,
  },
});
