import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { CustomButton } from '../components/CustomButton';
import { useTheme } from '../context/ThemeContext';
import { CustomInput } from '../components/CustomInput';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, loading, error } = useAuth();

  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const handleLogin = async () => {
    await login({ email, password });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: colors.text }]}>StudySphere</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>Çalışma Dünyana Giriş Yap</Text>
        </View>

        <View style={styles.formContainer}>
          <CustomInput
            label='E-posta Adresi'
            leftIcon='mail'
            placeholder='ornek@studysphere.com'
            keyboardType='email-address'
            autoCapitalize='none'
            onChangeText={setEmail}
            />
          <CustomInput
            label='Şifre'
            leftIcon='lock'
            placeholder='Şifrenizi giriniz'
            isPassword = {true}
            onChangeText={setPassword}
            />
            {error && <Text style = {[styles.errorText, { color: colors.error }]}>{error}</Text>}

            <CustomButton
              title='Giriş Yap'
              loading = {loading}
              onPress={handleLogin}
              />
              <CustomButton
              title='Şifremi Unuttum'
              variant='outline'
              onPress={() => navigation.navigate('ForgotPassword')
              }
              />
              <CustomButton
              title='Hesabın yok mu? Kayıt Ol'
              variant='outline'
              onPress={() => navigation.navigate('Register')
              }
              />
        </View>
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
    gap: 16,
  },
  tempInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  }
});
