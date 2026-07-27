
import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './useAuth';

export function usePasswordChangeForm() {
  const { changePassword, loading: isChangingPassword } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Lütfen tüm şifre alanlarını doldurun.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor.');
      return;
    }

    const success = await changePassword({ oldPassword, newPassword });
    if (success) {
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert('Başarılı', 'Şifreniz güncellendi.');
    }
  };

  return {
    oldPassword,
    newPassword,
    confirmNewPassword,
    setOldPassword,
    setNewPassword,
    setConfirmNewPassword,
    passwordError,
    isChangingPassword,
    handleChangePassword,
  };
}
