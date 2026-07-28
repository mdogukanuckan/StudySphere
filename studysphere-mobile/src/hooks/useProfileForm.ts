
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useUpdateProfile } from './useUser';
import { useSendVerificationCode } from './useEmailVerification';
import { CurrentUser } from '../types/user';
import { getErrorMessage } from '../utils/errorMessage';

export function useProfileForm(currentUser: CurrentUser | undefined) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();
  const { mutate: sendVerificationCode } = useSendVerificationCode();

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

    const trimmedEmail = email.trim();
    const isChangingEmail = !!currentUser?.email && trimmedEmail !== currentUser.email;

    updateProfile(
      {
        email: trimmedEmail,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      },
      {
        onSuccess: () => {
          if (isChangingEmail) {
            sendVerificationCode(undefined, {
              onSuccess: () => {
                Alert.alert(
                  'Başarılı',
                  'Bilgileriniz güncellendi. Yeni e-posta adresinize bir doğrulama kodu gönderildi, lütfen doğrulayın.'
                );
              },
              onError: () => {
                Alert.alert(
                  'Başarılı',
                  'Bilgileriniz güncellendi. Doğrulama kodu gönderilirken bir sorun oluştu, profil ekranından tekrar isteyebilirsiniz.'
                );
              },
            });
            return;
          }
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
