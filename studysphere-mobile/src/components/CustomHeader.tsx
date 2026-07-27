import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import { useCurrentUser } from '../hooks/useUser';

interface CustomHeaderProps {
    navigation?: any;
}

export const CustomHeader = ({ navigation }: CustomHeaderProps) => {
    const [isModalVisible, setModalVisible] = useState(false);
    const { colors } = useTheme();
    const {logout} = useAuthContext();
    const { data: currentUser } = useCurrentUser();

    const handleProfilePress = () => {
        setModalVisible(true);
    };

    const handleEditProfile = () => {
        setModalVisible(false);
        const parentNavigation = navigation?.getParent?.() ?? navigation;
        parentNavigation?.navigate('Profile');
    };

    const handleOpenFriends = () => {
        setModalVisible(false);
        const parentNavigation = navigation?.getParent?.() ?? navigation;
        parentNavigation?.navigate('Friends');
    };

    const fullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ');
    const displayName = fullName || currentUser?.username || '';

    return (
        <SafeAreaView edges={['top']} style={[styles.safeAreaContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.headerContainer, { borderBottomColor: colors.surface }]}>

                <View style={styles.leftSection}>
                    <Ionicons name="earth" size={26} color={colors.primary} />
                    <Text style={[styles.appName, { color: colors.text }]}>StudySphere</Text>
                </View>
                <TouchableOpacity
                    style={styles.rightSection}
                    onPress={handleProfilePress}
                    activeOpacity={0.7}
                >
                    <View style={styles.userInfo}>
                        <Text style={[styles.fullName, { color: colors.text }]} numberOfLines={1}>
                            {displayName}
                        </Text>
                        <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                            {currentUser?.username ?? ''}
                        </Text>
                    </View>

                    <Ionicons name="person-circle" size={40} color={colors.primary} />
                </TouchableOpacity>
            </View>
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType='fade'
                onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Kullanıcı Bilgileri</Text>
                        <Text style={{ color: colors.text }}>{displayName}</Text>
                        <Text style={{ color: colors.text, marginBottom: 20 }}>{currentUser?.username ?? ''}</Text>
                        <TouchableOpacity style={[styles.editProfileButton, { backgroundColor: colors.primary }]} onPress={handleEditProfile}>
                            <Ionicons name="create-outline" size={20} color="white" />
                            <Text style={styles.logoutText}>Profili Düzenle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.friendsButton, { backgroundColor: colors.primary }]} onPress={handleOpenFriends}>
                            <Ionicons name="people-outline" size={20} color="white" />
                            <Text style={styles.logoutText}>Arkadaşlar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={logout}>
                            <Ionicons name="log-out-outline" size={20} color="white" />
                            <Text style={styles.logoutText}>Çıkış Yap</Text>
                        </TouchableOpacity>
                    </View>


                </TouchableOpacity>

            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeAreaContainer: {
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'android' ? 16 : 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appName: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginLeft: 8,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'flex-end', // Yazıları sağa yasla ki ikona yakın dursun
        marginRight: 8,
    },
    fullName: {
        fontSize: 14,
        fontWeight: '600',
    },
    username: {
        fontSize: 12,
        opacity: 0.6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: 20,
    },
    modalContent: {
        width: 200,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    editProfileButton: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 8,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 8,
    },
    friendsButton: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 8,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 8,
        width: '100%',
        justifyContent: 'center',
        // gap unsupported
    },
    logoutText: { color: 'white', fontWeight: 'bold', marginLeft: 8 }
});
