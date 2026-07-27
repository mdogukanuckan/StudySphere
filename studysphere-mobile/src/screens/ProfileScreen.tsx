import React from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Switch,
    Alert,
} from 'react-native';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { useTheme, ThemePreference } from '../context/ThemeContext';
import { useNotificationSettings } from '../context/NotificationSettingsContext';
import { useNavigation } from '@react-navigation/native';
import { useCurrentUser } from '../hooks/useUser';
import { useProfileForm } from '../hooks/useProfileForm';
import { usePasswordChangeForm } from '../hooks/usePasswordChangeForm';
import { useMySessions, useRevokeSession } from '../hooks/useSessions';
import { getErrorMessage } from '../utils/errorMessage';

const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
    { key: 'light', label: '☀️ Aydınlık' },
    { key: 'dark', label: '🌙 Karanlık' },
    { key: 'system', label: '⚙️ Cihaza Uy' },
];

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const { colors, preference, setPreference } = useTheme();
    const { notificationsEnabled, setNotificationsEnabled } = useNotificationSettings();

    const { data: currentUser, isLoading } = useCurrentUser();
    const {
        email, firstName, lastName,
        setEmail, setFirstName, setLastName,
        isSaving, handleSave: handleSaveProfile,
    } = useProfileForm(currentUser);
    const {
        oldPassword, newPassword, confirmNewPassword,
        setOldPassword, setNewPassword, setConfirmNewPassword,
        passwordError, isChangingPassword, handleChangePassword,
    } = usePasswordChangeForm();

    const { data: sessions, isLoading: isLoadingSessions } = useMySessions();
    const { mutate: revokeSession, isPending: isRevoking, variables: revokingId } = useRevokeSession();

    const handleRevokeSession = (id: string) => {
        Alert.alert(
            'Oturumu Sonlandır',
            'Bu oturumu sonlandırmak istediğinize emin misiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sonlandır',
                    style: 'destructive',
                    onPress: () => {
                        revokeSession(id, {
                            onError: (error: any) => {
                                Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Oturum sonlandırılırken bir hata oluştu.'));
                            },
                        });
                    },
                },
            ]
        );
    };

    const formatSessionDate = (iso: string) => {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {!currentUser?.isEmailVerified && (
                    <View style={[styles.verifyBanner, { borderColor: colors.error, backgroundColor: colors.error + '15' }]}>
                        <View style={styles.notificationTextWrap}>
                            <Text style={[styles.notificationLabel, { color: colors.text }]}>E-posta adresiniz doğrulanmadı</Text>
                            <Text style={[styles.helperText, { color: colors.textSecondary, marginLeft: 0, marginTop: 2 }]}>
                                Çalışma odası oluşturmak ve mevcut bir odaya katılmak için e-posta adresinizi doğrulamanız gerekir.
                            </Text>
                        </View>
                        <CustomButton
                            title="Doğrula"
                            onPress={() => navigation.navigate('VerifyEmail')}
                            style={styles.verifyButton}
                        />
                    </View>
                )}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Görünüm</Text>
                <View style={styles.themeRow}>
                    {THEME_OPTIONS.map((option) => {
                        const isActive = preference === option.key;
                        return (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.themeOption,
                                    { borderColor: colors.border },
                                    isActive && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
                                ]}
                                onPress={() => setPreference(option.key)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.themeOptionText,
                                    { color: isActive ? colors.primary : colors.text },
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                    "Cihaza Uy" seçiliyken tema, telefonunun sistem ayarını takip eder.
                </Text>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Bildirimler</Text>
                <View style={[styles.notificationRow, { borderColor: colors.border }]}>
                    <View style={styles.notificationTextWrap}>
                        <Text style={[styles.notificationLabel, { color: colors.text }]}>
                            Oda bildirimlerini al
                        </Text>
                        <Text style={[styles.helperText, { color: colors.textSecondary, marginLeft: 0, marginTop: 2 }]}>
                            Biri kronometresini durdurup devam ettirdiğinde ya da oda kapandığında anlık bildirim gösterilir. Kapatırsan katılımcı listesi yine de güncel kalır, sadece bu bildirimleri görmezsin.
                        </Text>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ true: colors.primary }}
                    />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Profil Bilgileri</Text>

                <View style={styles.row}>
                    <View style={styles.flexHalf}>
                        <CustomInput
                            label="Ad"
                            leftIcon="user"
                            placeholder="Adınız"
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>
                    <View style={styles.flexHalf}>
                        <CustomInput
                            label="Soyad"
                            leftIcon="users"
                            placeholder="Soyadınız"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>
                </View>

                <CustomInput
                    label="Kullanıcı Adı"
                    leftIcon="at-sign"
                    value={currentUser?.username ?? ''}
                    editable={false}
                    style={styles.disabledInput}
                />
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>Kullanıcı adı sonradan değiştirilemez.</Text>

                <CustomInput
                    label="E-posta Adresi"
                    leftIcon="mail"
                    placeholder="ornek@studysphere.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <CustomButton
                    title="Bilgilerimi Kaydet"
                    loading={isSaving}
                    onPress={handleSaveProfile}
                    style={styles.saveButton}
                />

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Şifre Değiştir</Text>

                <CustomInput
                    label="Mevcut Şifre"
                    leftIcon="lock"
                    placeholder="Mevcut şifreniz"
                    isPassword
                    value={oldPassword}
                    onChangeText={setOldPassword}
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
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                />

                {passwordError ? <Text style={[styles.errorText, { color: colors.error }]}>{passwordError}</Text> : null}

                <CustomButton
                    title="Şifreyi Güncelle"
                    variant="outline"
                    loading={isChangingPassword}
                    onPress={handleChangePassword}
                    style={styles.saveButton}
                />

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Aktif Oturumlar</Text>
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                    Giriş yaptığın oturumlar burada listelenir; şüpheli bir oturumu buradan sonlandırabilirsin.
                </Text>

                {isLoadingSessions ? (
                    <ActivityIndicator color={colors.primary} style={styles.sessionsLoading} />
                ) : sessions && sessions.length > 0 ? (
                    sessions.map((session) => (
                        <View key={session.id} style={[styles.sessionRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                            <View style={styles.sessionInfo}>
                                <Text style={[styles.sessionText, { color: colors.text }]}>
                                    Giriş: {formatSessionDate(session.createdAt)}
                                </Text>
                                <Text style={[styles.sessionSubText, { color: colors.textSecondary }]}>
                                    Bitiş: {formatSessionDate(session.expiresAt)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleRevokeSession(session.id)}
                                disabled={isRevoking && revokingId === session.id}
                                style={[styles.revokeButton, { borderColor: colors.error }]}
                            >
                                {isRevoking && revokingId === session.id ? (
                                    <ActivityIndicator size="small" color={colors.error} />
                                ) : (
                                    <Text style={[styles.revokeButtonText, { color: colors.error }]}>Sonlandır</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <Text style={[styles.helperText, { color: colors.textSecondary }]}>Aktif oturum bulunamadı.</Text>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 24,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    verifyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        gap: 12,
        marginBottom: 8,
    },
    verifyButton: {
        marginVertical: 0,
        paddingHorizontal: 16,
        height: 40,
    },
    themeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    themeOption: {
        flex: 1,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    themeOptionText: {
        fontSize: 13,
        fontWeight: '600',
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        gap: 12,
    },
    notificationTextWrap: {
        flex: 1,
    },
    notificationLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    flexHalf: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    saveButton: {
        marginTop: 8,
    },
    disabledInput: {
        opacity: 0.6,
    },
    helperText: {
        fontSize: 12,
        marginTop: -6,
        marginBottom: 4,
        marginLeft: 4,
    },
    errorText: {
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '500',
    },
    sessionsLoading: {
        marginTop: 8,
    },
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    sessionInfo: {
        flex: 1,
        marginRight: 12,
    },
    sessionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sessionSubText: {
        fontSize: 12,
        marginTop: 2,
    },
    revokeButton: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        minWidth: 84,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revokeButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
