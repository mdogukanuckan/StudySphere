import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { CustomInput } from './CustomInput';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';

export interface EndSessionSummaryData {
  isTopicReviewOnly: boolean;
  solvedQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: EndSessionSummaryData) => void;
  isLoading: boolean;
}

export const EndSessionSummaryModal: React.FC<Props> = ({ visible, onClose, onConfirm, isLoading }) => {
  const { colors, globalStyles } = useTheme();
  const styles = useMemo(() => createStyles(colors, globalStyles), [colors, globalStyles]);
  const [isTopicReviewOnly, setIsTopicReviewOnly] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState('');
  const [wrongAnswers, setWrongAnswers] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setIsTopicReviewOnly(false);
      setTotalQuestions('');
      setCorrectAnswers('');
      setWrongAnswers('');
      setError('');
    }
  }, [visible]);

  const handleConfirm = () => {
    if (isTopicReviewOnly) {
      onConfirm({ isTopicReviewOnly: true });
      return;
    }

    const parseField = (value: string) => (value.trim() === '' ? 0 : Number(value));
    const total = parseField(totalQuestions);
    const correct = parseField(correctAnswers);
    const wrong = parseField(wrongAnswers);

    if ([total, correct, wrong].some((n) => Number.isNaN(n) || n < 0 || !Number.isInteger(n))) {
      setError('Lütfen geçerli, negatif olmayan tam sayılar girin.');
      return;
    }
    if (correct + wrong > total) {
      setError('Doğru ve yanlış sayısının toplamı, toplam soru sayısını geçemez.');
      return;
    }

    setError('');
    onConfirm({
      isTopicReviewOnly: false,
      solvedQuestions: total,
      correctAnswers: correct,
      wrongAnswers: wrong,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Seansı Bitir 🎉</Text>
          <Text style={styles.subtitle}>Bu seansta neler yaptığını kısaca özetler misin?</Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsTopicReviewOnly((prev) => !prev)}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <View style={[styles.checkbox, isTopicReviewOnly && styles.checkboxChecked]}>
              {isTopicReviewOnly && <Check size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Sadece konu tekrarı yaptım, soru çözmedim</Text>
          </TouchableOpacity>

          {!isTopicReviewOnly && (
            <View style={styles.questionsSection}>
              <CustomInput
                label="Toplam Soru Sayısı"
                keyboardType="numeric"
                value={totalQuestions}
                onChangeText={setTotalQuestions}
                placeholder="Örn: 20"
              />
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <CustomInput
                    label="Doğru"
                    keyboardType="numeric"
                    value={correctAnswers}
                    onChangeText={setCorrectAnswers}
                    placeholder="0"
                  />
                </View>
                <View style={styles.halfInput}>
                  <CustomInput
                    label="Yanlış"
                    keyboardType="numeric"
                    value={wrongAnswers}
                    onChangeText={setWrongAnswers}
                    placeholder="0"
                  />
                </View>
              </View>
            </View>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startButton} onPress={handleConfirm} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.startText}>Bitir ✅</Text>}
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
    marginBottom: SPACING.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  questionsSection: {
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
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
