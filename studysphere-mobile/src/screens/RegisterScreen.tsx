import { useState } from "react"
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View,Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomInput } from "../components/CustomInput";
import { CustomButton } from "../components/CustomButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/AuthNavigator";

export const RegisterScreen = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const [validationError, setValidationError] = useState('');
    const { register, loading, error: backendError } = useAuth();

    const { colors } = useTheme();

    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
    const handleRegister = async () => {
        if (!username || !email || !password) {
            setValidationError('Lütfen zorunlu alanları doldurunuz.');
            return;
        }
        if (password !== confirmPassword) {
            setValidationError('Şifreler eşleşmiyor');
            return;
        }
        setValidationError('');

        const success = await register({
            username,
            email,
            password,
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
        });

        if (success) {
            navigation.navigate('Login');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={styles.formContainer}>
                        <View style={styles.row}>
                            <View style={styles.flexHalf}>
                                <CustomInput
                                    label="Ad"
                                    leftIcon="user"
                                    placeholder="Adınız"
                                    onChangeText={(text) => {
                                        setFirstName(text);
                                        setValidationError('');
                                    }}
                                />
                            </View>
                            <View style={styles.flexHalf}>
                                <CustomInput
                                    label="Soyad (Opsiyonel)"
                                    leftIcon="users"
                                    placeholder="Soyadınız"
                                    onChangeText={(text) => {
                                        setLastName(text);
                                        setValidationError('');
                                    }}
                                />
                            </View>
                        </View>
                      <CustomInput 
              label="Kullanıcı Adı *"
              leftIcon="at-sign"
              placeholder="Kullanıcı adınızı belirleyin"
              autoCapitalize="none"
              onChangeText={(text) => {
                setUsername(text);
                setValidationError(''); 
              }}
            />

            <CustomInput 
              label="E-posta Adresi *"
              leftIcon="mail"
              placeholder="ornek@studysphere.com"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => {
                setEmail(text);
                setValidationError('');
              }}
            />

            <CustomInput 
              label="Şifre *"
              leftIcon="lock"
              placeholder="Güçlü bir şifre belirleyin"
              isPassword={true}
              onChangeText={(text) => {
                setPassword(text);
                setValidationError('');
              }}
            />

            <CustomInput 
              label="Şifre Tekrar *"
              leftIcon="check-circle"
              placeholder="Şifrenizi doğrulayın"
              isPassword={true}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setValidationError('');
              }}
            />
            
            {validationError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{validationError}</Text>
            ) : null}

            {backendError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{backendError}</Text>
            ) : null}

            <CustomButton 
              title="Kayıt Ol" 
              loading={loading} 
              onPress={handleRegister} 
            />

            <CustomButton 
              title="Zaten hesabın var mı? Giriş Yap" 
              variant="outline"
              onPress={() => navigation.navigate('Login')} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    headerContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
    },
    formContainer: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12, 
    },
    flexHalf: {
        flex: 1, 
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '500',
    }
});