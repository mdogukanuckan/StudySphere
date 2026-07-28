import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useCurrentUser } from '../hooks/useUser';
import { useSendVerificationCode, useVerifyEmail } from '../hooks/useEmailVerification';
import { getErrorMessage } from '../utils/errorMessage';

export default function VerifyEmailScreen({ navigation }: any) {
    const { colors } = useTheme();
    const { data: currentUser } = useCurrentUser();
    const [code, setCode] = useState('');

    const { mutate: sendCode, isPending: isSending } = useSendVerificationCode();
    const { mutate: verify, isPending: isVerifying } = useVerifyEmail();

    const handleSendCode = () => {
        sendCode(undefined, {
            onSuccess: () => {
                Alert.alert('Kod Gönderildi', 'Doğrulama kodu e-posta adresinize gönderildi.');
            },
            onError: (error: any) => {
                Alert.alert('Gönderilemedi', getErrorMessage(error, 'Kod gönderilirken bir hata oluştu.'));
            },
        });
    };

    const handleVerify = () => {
        if (code.trim().length !== 6) {
            Alert.alert('Hatalı Kod', 'Lütfen 6 haneli kodu tam olarak giriniz.');
            return;
        }
        verify(code.trim(), {
            onSuccess: () => {
                Alert.alert('Doğrulandı', 'E-posta adresiniz başarıyla doğrulandı.', [
                    { text: 'Tamam', onPress: () => navigation.goBack() },
                ]);
            },
            onError: (error: any) => {
                Alert.alert('Doğrulanamadı', getErrorMessage(error, 'Kod doğrulanırken bir hata oluştu.'));
            },
        });
    };

    if (currentUser?.isEmailVerified) {
        return (
            <View style={[styles.centered, { backgroundColor: colors.background }]}>
                <Text style={[styles.title, { color: colors.text }]}>E-posta adresiniz doğrulanmış ✅</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Text style={[styles.title, { color: colors.text }]}>E-posta Doğrulama</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {currentUser?.email
                    ? `${currentUser.email} adresine gönderilen 6 haneli kodu giriniz.`
                    : 'E-posta adresinize gönderilen 6 haneli kodu giriniz.'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Arkadaşlarınızla çalışma odası oluşturmak ve mevcut bir odaya katılmak için hesabınızı doğrulamanız gerekir.
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

            <CustomButton
                title="Doğrula"
                loading={isVerifying}
                onPress={handleVerify}
                style={styles.button}
            />

            <CustomButton
                title="Kodu Yeniden Gönder"
                variant="outline"
                loading={isSending}
                onPress={handleSendCode}
                style={styles.button}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        gap: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        marginBottom: 8,
    },
    button: {
        marginTop: 8,
    },
});
