import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { SessionType } from '../types/studySession';
interface Props{
    visible : boolean;
    topicName : string;
    onClose : () => void;
    onStart : (type : SessionType, plannedDurationSeconds ?: number) => void;
    isLoading : boolean;
}

const POMODORO_DURATION_PRESETS = [15, 25, 30, 45, 60, 90];
const MIN_POMODORO_MINUTES = 5;
const MAX_POMODORO_MINUTES = 240;
const DURATION_STEP_MINUTES = 5;

export const StudySessionSetupModal: React.FC<Props> = ({ visible, topicName, onClose, onStart, isLoading }) => {
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors, globalStyles), [colors, globalStyles]);
  const [selectedType, setSelectedType] = useState<SessionType>('FREE');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);

  const adjustPomodoroMinutes = (deltaMinutes: number) => {
    setPomodoroMinutes((prev) =>
      Math.min(MAX_POMODORO_MINUTES, Math.max(MIN_POMODORO_MINUTES, prev + deltaMinutes)),
    );
  };

  const handleStart = () => {
    onStart(selectedType, selectedType === 'POMODORO' ? pomodoroMinutes * 60 : undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Seans Başlat</Text>
          <Text style={styles.subtitle}>
            <Text style={{ fontWeight: 'bold', color: colors.primary }}>{topicName}</Text> konusuna çalışıyorsun.
          </Text>

          <View style={styles.optionsContainer}>
            {}
            <TouchableOpacity 
              style={[styles.optionCard, selectedType === 'FREE' && styles.optionCardActive]}
              onPress={() => setSelectedType('FREE')}
            >
              <Text style={[styles.optionTitle, selectedType === 'FREE' && styles.optionTitleActive]}>Serbest Çalışma</Text>
              <Text style={styles.optionDesc}>Süreyi ileri doğru sayar. İstediğin zaman bitirirsin.</Text>
            </TouchableOpacity>

            {}
            <TouchableOpacity
              style={[styles.optionCard, selectedType === 'POMODORO' && styles.optionCardActive]}
              onPress={() => setSelectedType('POMODORO')}
            >
              <Text style={[styles.optionTitle, selectedType === 'POMODORO' && styles.optionTitleActive]}>Pomodoro</Text>
              <Text style={styles.optionDesc}>Seçtiğin süre kadar geri sayar. Odaklanma için idealdir.</Text>
            </TouchableOpacity>
          </View>

          {selectedType === 'POMODORO' && (
            <View style={styles.durationSection}>
              <Text style={styles.durationLabel}>Süre</Text>
              <View style={styles.presetRow}>
                {POMODORO_DURATION_PRESETS.map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[styles.presetChip, pomodoroMinutes === minutes && styles.presetChipActive]}
                    onPress={() => setPomodoroMinutes(minutes)}
                  >
                    <Text style={[styles.presetChipText, pomodoroMinutes === minutes && styles.presetChipTextActive]}>
                      {minutes} dk
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => adjustPomodoroMinutes(-DURATION_STEP_MINUTES)}
                  disabled={pomodoroMinutes <= MIN_POMODORO_MINUTES}
                >
                  <Text style={styles.stepperButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{pomodoroMinutes} dakika</Text>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => adjustPomodoroMinutes(DURATION_STEP_MINUTES)}
                  disabled={pomodoroMinutes >= MAX_POMODORO_MINUTES}
                >
                  <Text style={styles.stepperButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              disabled={isLoading}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.startText}>Başla 🚀</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, globalStyles: GlobalStyles) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end', 
  },
  content: {
    backgroundColor: colors.surface,
    padding: SPACING.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    ...globalStyles.title,
    fontSize: 22,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...globalStyles.subtitle,
    marginBottom: SPACING.xl,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  optionCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10', 
  },
  optionTitle: {
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  optionTitleActive: {
    color: colors.primary,
  },
  optionDesc: {
    fontSize: 11,
    
    color: colors.textSecondary,
  },
  durationSection: {
    marginBottom: SPACING.xl,
  },
  durationLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  presetChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  presetChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  presetChipTextActive: {
    color: colors.primary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: SPACING.lg,
    minWidth: 90,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: SPACING.md,
    marginRight: SPACING.md,
  },
  cancelText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  startText: {
    color: colors.surface,
    fontWeight: 'bold',
  },
});