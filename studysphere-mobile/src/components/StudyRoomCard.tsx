import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, BookOpen } from 'lucide-react-native';
import { StudyRoom } from '../types/studyRoom';
import { SPACING, ThemeColors } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

interface StudyRoomCardProps {
  room: StudyRoom;
  onPress: (id: string) => void;
}

export const StudyRoomCard: React.FC<StudyRoomCardProps> = ({ room, onPress }) => {
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={globalStyles.card} // theme.ts'den gelen o meşhur gölgeli kart yapısı
      onPress={() => onPress(room.id)}
      activeOpacity={0.7}
    >
      {/* Üst Kısım: Başlık ve Rozet */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {room.title}
        </Text>
        <View style={[
          styles.badge, 
          room.status === 'ACTIVE' ? styles.badgeActive : styles.badgeClosed
        ]}>
          <Text style={[
            styles.badgeText, 
            room.status !== 'ACTIVE' && { color: colors.error }
          ]}>
            {room.status === 'ACTIVE' ? 'Canlı' : 'Kapalı'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <BookOpen size={16} color={colors.textSecondary} style={styles.icon} />
        <Text style={styles.bodyText}>
          {room.universe.name} / {room.subject.name} {room.topic && `/ ${room.topic.name}`}
        </Text>
      </View>

      {/* Alt Kısım: Katılımcılar ve Sahip */}
      <View style={styles.footer}>
        <View style={styles.participants}>
          <Users size={16} color={colors.text} style={styles.icon} />
          <Text style={styles.participantText}>
            {room.currentParticipants} <Text style={styles.maxParticipants}>/ {room.maxParticipants}</Text>
          </Text>
        </View>
        <Text style={styles.ownerText} numberOfLines={1}>
          Kurucu: {room.owner?.username ?? 'Bilinmiyor'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Senin theme.ts dosyanla tam uyumlu StyleSheet yapısı
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: `${colors.primary}1A`, // Primary rengin %10 opak hali
  },
  badgeClosed: {
    backgroundColor: `${colors.error}1A`, // Hata renginin %10 opak hali
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    marginRight: 6,
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  maxParticipants: {
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  ownerText: {
    color: colors.textSecondary,
    fontSize: 12,
    flexShrink: 1,
    marginLeft: SPACING.sm,
    textAlign: 'right',
  },
});