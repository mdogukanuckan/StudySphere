// src/screens/FriendProfileScreen.tsx
//
// "Arkadaş Profili" (8. tur istek, 24 Temmuz): bir arkadaşının özet
// istatistiklerini (StatisticsScreen'deki "Performans Özeti" kartlarıyla
// aynı dört alan) ve başarım listesini (AchievementsScreen ile aynı
// görsel dil — CATEGORY_LABELS/formatProgressLabel oradan import ediliyor)
// gösterir. FriendsScreen.tsx'teki "Arkadaşlarım" sekmesinde bir arkadaşa
// dokununca açılan üst seviye bir route (bkz. AppNavigator.tsx — Profile/
// Friends ile aynı desen). Backend, GERÇEKTEN arkadaş olunmadıkça veri
// döndürmüyor (bkz. FriendsService.getFriendProfile) — bu ekran o kontrolün
// sonucuna (403 dönerse) bir hata mesajıyla karşılık veriyor.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useFriendProfile } from '../hooks/useFriends';
import { CATEGORY_LABELS, formatProgressLabel } from './AchievementsScreen';
import { Achievement } from '../types/achievement';
import { SPACING, ThemeColors, Shadows } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../utils/errorMessage';

const displayName = (user: { username: string; firstName: string | null; lastName: string | null }) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return fullName || user.username;
};

const StatCard = ({ title, value }: { title: string; value: string | number }) => {
    const { colors, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    return (
        <View style={styles.statCard}>
            <Text style={styles.statCardTitle}>{title}</Text>
            <Text style={styles.statCardValue}>{value}</Text>
        </View>
    );
};

export default function FriendProfileScreen() {
    const { colors, shadows } = useTheme();
    const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    // 'initialDisplayName': FriendsScreen'den geçiliyor — profil verisi daha
    // gelmeden başlık boş görünmesin diye (kısa süreli bir yer tutucu).
    const { userId, initialDisplayName } = route.params ?? {};

    const { data: profile, isLoading, isError, error, refetch } = useFriendProfile(userId);

    const grouped = (profile?.achievements ?? []).reduce<Record<string, Achievement[]>>((acc, a) => {
        (acc[a.category] ??= []).push(a);
        return acc;
    }, {});
    const unlockedCount = (profile?.achievements ?? []).filter((a) => a.unlocked).length;
    const totalCount = profile?.achievements.length ?? 0;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {profile ? displayName(profile.user) : (initialDisplayName ?? 'Profil')}
                </Text>
                <View style={styles.backButton} />
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : isError ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>
                        {getErrorMessage(error, 'Profil yüklenirken bir hata oluştu.')}
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.username}>@{profile?.user.username}</Text>

                    <Text style={styles.sectionTitle}>Performans Özeti</Text>
                    {profile?.stats ? (
                        <View style={styles.statsGrid}>
                            <StatCard title="Toplam Süre" value={`${Math.floor(profile.stats.totalStudyTime / 60)} dk`} />
                            <StatCard title="Oturum Sayısı" value={profile.stats.totalSessionsCompleted} />
                            <StatCard title="Mevcut Seri" value={`${profile.stats.currentStreak} Gün 🔥`} />
                            <StatCard title="En Uzun Seri" value={`${profile.stats.longestStreak} Gün 🏆`} />
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>Henüz bir çalışma seansı tamamlamamış.</Text>
                    )}

                    <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
                        Başarımlar {totalCount > 0 ? `(${unlockedCount} / ${totalCount})` : ''}
                    </Text>
                    {Object.entries(grouped).map(([category, items]) => (
                        <View key={category} style={styles.categorySection}>
                            <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category] ?? category}</Text>
                            {items.map((item) => {
                                const percent = item.target > 0 ? Math.min(100, (item.progress / item.target) * 100) : 0;
                                return (
                                    <View key={item.key} style={[styles.card, item.unlocked && styles.cardUnlocked]}>
                                        <View style={styles.cardHeader}>
                                            <Text style={[styles.icon, !item.unlocked && styles.iconLocked]}>{item.icon}</Text>
                                            <View style={styles.cardText}>
                                                <Text style={styles.cardTitle}>{item.title}</Text>
                                                <Text style={styles.cardDescription}>{item.description}</Text>
                                            </View>
                                            {item.unlocked && <Text style={styles.unlockedBadge}>✓</Text>}
                                        </View>
                                        <View style={styles.progressTrack}>
                                            <View style={[styles.progressFill, { width: `${percent}%` }, item.unlocked && styles.progressFillUnlocked]} />
                                        </View>
                                        <Text style={styles.progressLabel}>
                                            {formatProgressLabel(item.category, item.progress, item.target)}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const createStyles = (colors: ThemeColors, shadows: Shadows) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
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
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: colors.text },
    scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
    username: { fontSize: 13, color: colors.textSecondary, marginBottom: SPACING.lg },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: SPACING.md },
    emptyText: { color: colors.textSecondary, fontSize: 14, marginBottom: SPACING.md },
    errorText: { color: colors.error, marginBottom: SPACING.md, textAlign: 'center', fontSize: 16, fontWeight: '500' },
    retryButton: { backgroundColor: colors.primary, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: 8 },
    retryButtonText: { color: colors.surface, fontWeight: '600' },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: colors.surface,
        width: '48%',
        padding: SPACING.lg,
        borderRadius: 12,
        marginBottom: SPACING.md,
        alignItems: 'center',
        ...shadows.light,
    },
    statCardTitle: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },
    statCardValue: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: SPACING.xs },
    categorySection: { marginBottom: SPACING.lg },
    categoryTitle: { fontSize: 15, fontWeight: '600', color: colors.textSecondary, marginBottom: SPACING.sm },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: 0.65,
        ...shadows.light,
    },
    cardUnlocked: { opacity: 1, borderColor: colors.primary + '60' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
    icon: { fontSize: 28, marginRight: SPACING.md },
    iconLocked: { opacity: 0.4 },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    cardDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    unlockedBadge: { color: colors.success, fontWeight: 'bold', fontSize: 18, marginLeft: SPACING.sm },
    progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.textSecondary, borderRadius: 4 },
    progressFillUnlocked: { backgroundColor: colors.primary },
    progressLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: 'right' },
});
