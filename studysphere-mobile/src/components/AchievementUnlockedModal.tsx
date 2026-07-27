
import React, { useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { UnlockedAchievementSummary } from '../types/studySession';

interface Props {
  visible: boolean;
  achievements: UnlockedAchievementSummary[];
  onClose: () => void;
}

export const AchievementUnlockedModal: React.FC<Props> = ({ visible, achievements, onClose }) => {
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors, globalStyles), [colors, globalStyles]);

  if (achievements.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>
            🎉 Yeni Başarım{achievements.length > 1 ? 'lar' : ''}!
          </Text>
          <ScrollView style={styles.list}>
            {achievements.map((a) => (
              <View key={a.key} style={styles.item}>
                <Text style={styles.icon}>{a.icon}</Text>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{a.title}</Text>
                  <Text style={styles.itemDescription}>{a.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Harika!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, globalStyles: GlobalStyles) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: SPACING.xl,
    width: '100%',
    maxHeight: '70%',
  },
  title: {
    ...globalStyles.title,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  list: {
    marginBottom: SPACING.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
