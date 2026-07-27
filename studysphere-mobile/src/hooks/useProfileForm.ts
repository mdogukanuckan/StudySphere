
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useUpdateProfile } from './useUser';
import { CurrentUser } from '../types/user';
import { getErrorMessage } from '../utils/errorMessage';

export function useProfileForm(currentUser: CurrentUser | undefined) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email ?? '');
      setFirstName(currentUser.firstName ?? '');
      setLastName(currentUser.lastName ?? '');
    }
  }, [currentUser]);

  const handleSave = () => {
    if (!email.trim()) {
      Alert.alert('Eksik Bilgi', 'E-posta boş bırakılamaz.');
      return;
    }

    updateProfile(
      {
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Başarılı', 'Bilgileriniz güncellendi.');
        },
        onError: (error: any) => {
          Alert.alert('Güncellenemedi', getErrorMessage(error, 'Bilgileriniz güncellenirken bir hata oluştu.'));
        },
      }
    );
  };

  return {
    email,
    firstName,
    lastName,
    setEmail,
    setFirstName,
    setLastName,
    isSaving,
    handleSave,
  };
}
