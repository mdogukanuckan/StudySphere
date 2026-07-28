
import React, { useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    useWindowDimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import {
    useFriends,
    usePendingRequests,
    useSearchUsers,
    useSendFriendRequest,
    useAcceptFriendRequest,
    useRejectFriendRequest,
    useRemoveFriend,
} from '../hooks/useFriends';
import { Friend, FriendPresence, FriendRequest, UserSearchResult } from '../types/friend';
import { UnlockedAchievementSummary } from '../types/studySession';
import { SPACING, ThemeColors } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../utils/errorMessage';
import { AchievementUnlockedModal } from '../components/AchievementUnlockedModal';

const TABS = [
    { key: 'FRIENDS' as const, label: 'Arkadaşlarım' },
    { key: 'REQUESTS' as const, label: 'İstekler' },
    { key: 'SEARCH' as const, label: 'Ara' },
];

const PRESENCE_INFO: Record<FriendPresence, { icon: string; label: string }> = {
    STUDYING: { icon: '📖', label: 'Ders çalışıyor' },
    ON_BREAK: { icon: '☕', label: 'Mola verdi' },
    ONLINE: { icon: '🟢', label: 'Çevrimiçi' },
    OFFLINE: { icon: '⚫', label: 'Çevrimdışı' },
};

const displayName = (user: { username: string; firstName: string | null; lastName: string | null }) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return fullName || user.username;
};

export default function FriendsScreen() {
    const { colors, globalStyles } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    const scrollRef = useRef<ScrollView>(null);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [searchText, setSearchText] = useState('');

    const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievementSummary[]>([]);
    const [isAchievementModalVisible, setAchievementModalVisible] = useState(false);

    const { data: friends, isLoading: isFriendsLoading, isError: isFriendsError, refetch: refetchFriends } = useFriends();
    const { data: requests, isLoading: isRequestsLoading, refetch: refetchRequests } = usePendingRequests();
    const { data: searchResults, isLoading: isSearchLoading } = useSearchUsers(searchText);

    const sendRequestMutation = useSendFriendRequest();
    const acceptRequestMutation = useAcceptFriendRequest();
    const rejectRequestMutation = useRejectFriendRequest();
    const removeFriendMutation = useRemoveFriend();

    const pendingCount = (requests?.incoming.length ?? 0);

    const goToTab = (index: number) => {
        setActiveTabIndex(index);
        scrollRef.current?.scrollTo({ x: index * width, animated: true });
    };

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setActiveTabIndex(index);
    };

    const handleRemoveFriend = (friend: Friend) => {
        Alert.alert('Arkadaşlıktan Çıkar', `${displayName(friend)} arkadaş listenden çıkarılsın mı?`, [
            { text: 'Vazgeç', style: 'cancel' },
            {
                text: 'Çıkar',
                style: 'destructive',
                onPress: () => {
                    removeFriendMutation.mutate(friend.id, {
                        onError: (error: any) => {
                            Alert.alert('İşlem Başarısız', getErrorMessage(error, 'Arkadaşlıktan çıkarılırken bir hata oluştu.'));
                        },
                    });
                },
            },
        ]);
    };

    // Doğrulanmamış hesaplar arkadaşlık isteği gönderemez/kabul edemez
    // (EmailVerifiedGuard) — diğer guard'lı uçlarla (oda kurma/katılma)
    // aynı 403 + "Doğrula" yönlendirme deseni.
    const handleVerificationRequiredError = (error: any, title: string, fallback: string) => {
        const message = getErrorMessage(error, fallback);
        if (error?.response?.status === 403) {
            Alert.alert(title, message, [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Doğrula', onPress: () => navigation.navigate('VerifyEmail') },
            ]);
            return;
        }
        Alert.alert(title, message);
    };

    const handleSendRequest = (user: UserSearchResult) => {
        sendRequestMutation.mutate(user.id, {
            onError: (error: any) => {
                handleVerificationRequiredError(error, 'İşlem Başarısız', 'İstek gönderilirken bir hata oluştu.');
            },
        });
    };

    const handleAccept = (request: FriendRequest) => {
        acceptRequestMutation.mutate(request.id, {
            onSuccess: (data) => {
                if (data?.newAchievements && data.newAchievements.length > 0) {
                    setUnlockedAchievements(data.newAchievements);
                    setAchievementModalVisible(true);
                }
            },
            onError: (error: any) => {
                handleVerificationRequiredError(error, 'İşlem Başarısız', 'İstek kabul edilirken bir hata oluştu.');
            },
        });
    };

    const handleReject = (request: FriendRequest) => {
        rejectRequestMutation.mutate(request.id, {
            onError: (error: any) => {
                Alert.alert('İşlem Başarısız', getErrorMessage(error, 'İstek kaldırılırken bir hata oluştu.'));
            },
        });
    };

    const renderFriendsTab = () => {
        if (isFriendsLoading) {
            return (
                <View style={[styles.pageContainer, { width }, styles.center]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            );
        }
        if (isFriendsError) {
            return (
                <View style={[styles.pageContainer, { width }, styles.center]}>
                    <Text style={styles.errorText}>Arkadaş listesi yüklenirken bir hata oluştu.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetchFriends()}>
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <View style={{ width }}>
                <FlatList
                    data={friends ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                        const presence = PRESENCE_INFO[item.presence];
                        return (
                            <TouchableOpacity
                                style={styles.card}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('FriendProfile', { userId: item.id, initialDisplayName: displayName(item) })}
                            >
                                <View style={styles.cardMain}>
                                    <Text style={styles.cardName}>{displayName(item)}</Text>
                                    <Text style={styles.cardUsername}>@{item.username}</Text>
                                    <Text style={styles.presenceText}>{presence.icon} {presence.label}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveFriend(item)} style={styles.removeButton}>
                                    <Text style={styles.removeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Henüz hiç arkadaşın yok. "Ara" sekmesinden bulup istek gönderebilirsin.</Text>
                        </View>
                    }
                    refreshing={isFriendsLoading}
                    onRefresh={refetchFriends}
                />
            </View>
        );
    };

    const renderRequestsTab = () => (
        <View style={{ width }}>
            <ScrollView
                contentContainerStyle={styles.listContent}
            >
                {isRequestsLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.lg }} />
                ) : (
                    <>
                        <Text style={styles.sectionTitle}>Gelen İstekler</Text>
                        {(requests?.incoming ?? []).length === 0 ? (
                            <Text style={styles.emptyTextInline}>Bekleyen bir istek yok.</Text>
                        ) : (
                            requests!.incoming.map((request) => (
                                <View key={request.id} style={styles.requestCard}>
                                    <View style={styles.cardMain}>
                                        <Text style={styles.cardName}>{displayName(request.user)}</Text>
                                        <Text style={styles.cardUsername}>@{request.user.username}</Text>
                                    </View>
                                    <View style={styles.requestActions}>
                                        <TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(request)}>
                                            <Text style={styles.acceptButtonText}>Kabul Et</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(request)}>
                                            <Text style={styles.rejectButtonText}>Reddet</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}

                        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Gönderdiklerim</Text>
                        {(requests?.outgoing ?? []).length === 0 ? (
                            <Text style={styles.emptyTextInline}>Bekleyen bir isteğin yok.</Text>
                        ) : (
                            requests!.outgoing.map((request) => (
                                <View key={request.id} style={styles.requestCard}>
                                    <View style={styles.cardMain}>
                                        <Text style={styles.cardName}>{displayName(request.user)}</Text>
                                        <Text style={styles.cardUsername}>@{request.user.username}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(request)}>
                                        <Text style={styles.rejectButtonText}>Geri Çek</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );

    const renderSearchTab = () => (
        <View style={{ width }}>
            <View style={styles.searchBoxWrapper}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Kullanıcı adına göre ara..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCapitalize="none"
                />
            </View>
            {searchText.trim().length < 2 ? (
                <Text style={styles.emptyTextInline}>Aramak için en az 2 karakter yaz.</Text>
            ) : isSearchLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.lg }} />
            ) : (
                <FlatList
                    data={searchResults ?? []}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardMain}>
                                <Text style={styles.cardName}>{displayName(item)}</Text>
                                <Text style={styles.cardUsername}>@{item.username}</Text>
                            </View>
                            {item.relationship === 'NONE' && (
                                <TouchableOpacity style={styles.acceptButton} onPress={() => handleSendRequest(item)}>
                                    <Text style={styles.acceptButtonText}>Ekle</Text>
                                </TouchableOpacity>
                            )}
                            {item.relationship === 'REQUEST_SENT' && (
                                <Text style={styles.relationshipLabel}>İstek Gönderildi</Text>
                            )}
                            {item.relationship === 'REQUEST_RECEIVED' && (
                                <Text style={styles.relationshipLabel}>Sana İstek Attı</Text>
                            )}
                            {item.relationship === 'FRIENDS' && (
                                <Text style={styles.relationshipLabel}>Arkadaşsınız</Text>
                            )}
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );

    return (
        <SafeAreaView style={globalStyles.screenContainer} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Arkadaşlarım</Text>
                <View style={styles.backButton} />
            </View>

            <View style={styles.tabBar}>
                {TABS.map((tab, index) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabItem, activeTabIndex === index && styles.tabItemActive]}
                        onPress={() => goToTab(index)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabLabel, activeTabIndex === index && styles.tabLabelActive]}>
                            {tab.label}{tab.key === 'REQUESTS' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
            >
                {renderFriendsTab()}
                {renderRequestsTab()}
                {renderSearchTab()}
            </ScrollView>

            <AchievementUnlockedModal
                visible={isAchievementModalVisible}
                achievements={unlockedAchievements}
                onClose={() => setAchievementModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    pageContainer: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: { padding: SPACING.xs, minWidth: 32 },
    backButtonText: { fontSize: 24, color: colors.text, fontWeight: 'bold' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.md,
        marginBottom: SPACING.xs,
        backgroundColor: colors.border,
        borderRadius: 10,
        padding: 4,
    },
    tabItem: {
        flex: 1,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    tabItemActive: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    tabLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    tabLabelActive: { color: colors.primary },
    listContent: { padding: SPACING.lg },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: SPACING.sm },
    emptyTextInline: { color: colors.textSecondary, fontSize: 14, marginBottom: SPACING.md },
    errorText: { color: colors.error, marginBottom: SPACING.md, textAlign: 'center', fontSize: 16, fontWeight: '500' },
    retryButton: { backgroundColor: colors.primary, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: 8 },
    retryButtonText: { color: colors.surface, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', marginTop: SPACING.xxl },
    emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    cardMain: { flex: 1, marginRight: SPACING.sm },
    cardName: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    cardUsername: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    presenceText: { fontSize: 13, color: colors.textSecondary, marginTop: SPACING.xs },
    removeButton: { padding: SPACING.xs },
    removeButtonText: { color: colors.error, fontSize: 16, fontWeight: 'bold' },
    requestCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    requestActions: { flexDirection: 'row' },
    acceptButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, marginLeft: SPACING.xs },
    acceptButtonText: { color: colors.surface, fontWeight: '600', fontSize: 13 },
    rejectButton: { backgroundColor: colors.background, borderRadius: 8, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, marginLeft: SPACING.xs, borderWidth: 1, borderColor: colors.border },
    rejectButtonText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
    relationshipLabel: { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
    searchBoxWrapper: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
    searchInput: {
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.text,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
    },
});
