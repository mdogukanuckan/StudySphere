import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useForgotPassword, useResetPassword } from '../hooks/usePasswordReset';
import { getErrorMessage } from '../utils/errorMessage';
import { AuthStackParamList } from '../navigation/AuthNavigator';

// Tek ekranda iki adim: once e-posta girilip kod istenir, kod gonderildikten
// sonra ayni ekranda kod + yeni sifre alanlari belirir. Guvenlik icin backend
// e-posta kayitli olsun olmasin hep ayni genel mesaji dondurur (bkz.
// AuthService.forgotPassword) — yani bu ekran hesabin var olup olmadigini
// asla dogrudan soylemez.
export const ForgotPasswordScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationError, setValidationError] = useState('');

    const { mutate: sendCode, isPending: isSendingCode } = useForgotPassword();
    const { mutate: resetPassword, isPending: isResetting } = useResetPassword();

    const handleSendCode = () => {
        if (!email.trim()) {
            setValidationError('Lütfen e-posta adresinizi giriniz.');
            return;
        }
        setValidationError('');
        sendCode(email.trim(), {
            onSuccess: (data) => {
                Alert.alert('Kod Gönderildi', data.message);
                setStep('reset');
            },
            onError: (error: any) => {
                Alert.alert('Gönderilemedi', getErrorMessage(error, 'Kod gönderilirken bir hata oluştu.'));
            },
        });
    };

    const handleReset = () => {
        if (code.trim().length !== 6) {
            setValidationError('Lütfen 6 haneli kodu tam olarak giriniz.');
            return;
        }
        if (newPassword.length < 6) {
            setValidationError('Yeni şifre en az 6 karakter olmalı.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setValidationError('Şifreler eşleşmiyor.');
            return;
        }
        setValidationError('');

        resetPassword(
            { email: email.trim(), code: code.trim(), newPassword },
            {
                onSuccess: (data) => {
                    Alert.alert('Başarılı', data.message, [
                        { text: 'Tamam', onPress: () => navigation.navigate('Login') },
                    ]);
                },
                onError: (error: any) => {
                    Alert.alert('Sıfırlanamadı', getErrorMessage(error, 'Şifre sıfırlanırken bir hata oluştu.'));
                },
            }
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <Text style={[styles.title, { color: colors.text }]}>Şifremi Unuttum</Text>

                {step === 'email' ? (
                    <>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Hesabınıza kayıtlı e-posta adresini girin, size bir şifre sıfırlama kodu gönderelim.
                        </Text>

                        <CustomInput
                            label="E-posta Adresi"
                            leftIcon="mail"
                            placeholder="ornek@studysphere.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        {validationError ? <Text style={[styles.errorText, { color: colors.error }]}>{validationError}</Text> : null}

                        <CustomButton
                            title="Kod Gönder"
                            loading={isSendingCode}
                            onPress={handleSendCode}
                        />
                    </>
                ) : (
                    <>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            {email} adresine gönderilen 6 haneli kodu ve yeni şifrenizi giriniz.
                        </Text>

                        <CustomInput
                            label="Doğrulama Kodu"
                            leftIcon="check-circle"
                            placeholder="123456"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={code}
                            onChangeText={setCode}
                        />

                        <CustomInput
                            label="Yeni Şifre"
                            leftIcon="lock"
                            placeholder="Yeni şifreniz"
                            isPassword
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <CustomInput
                            label="Yeni Şifre (Tekrar)"
                            leftIcon="check-circle"
                            placeholder="Yeni şifrenizi doğrulayın"
                            isPassword
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        {validationError ? <Text style={[styles.errorText, { color: colors.error }]}>{validationError}</Text> : null}

                        <CustomButton
                            title="Şifreyi Sıfırla"
                            loading={isResetting}
                            onPress={handleReset}
                        />

                        <CustomButton
                            title="Kodu Yeniden Gönder"
                            variant="outline"
                            loading={isSendingCode}
                            onPress={handleSendCode}
                        />
                    </>
                )}

                <CustomButton
                    title="Girişe Dön"
                    variant="outline"
                    onPress={() => navigation.navigate('Login')}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 4,
        fontWeight: '500',
    },
});
