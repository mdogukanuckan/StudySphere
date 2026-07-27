
import React from 'react';
import { View, Text, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { CustomInput } from './CustomInput';
import { CustomButton } from './CustomButton';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { Feather } from '@expo/vector-icons';

export interface EntityFormField {
  key: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  leftIcon?: keyof typeof Feather.glyphMap;
  multiline?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
}

interface EntityFormModalProps {
  visible: boolean;
  title: string;
  fields: EntityFormField[];
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export const EntityFormModal: React.FC<EntityFormModalProps> = ({
  visible,
  title,
  fields,
  onCancel,
  onSubmit,
  isSubmitting,
  submitLabel = 'Kaydet',
  cancelLabel = 'Vazgeç',
}) => {
  const { colors, globalStyles } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, globalStyles), [colors, globalStyles]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>

          {fields.map((field, index) => (
            <CustomInput
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={field.value}
              onChangeText={field.onChangeText}
              leftIcon={field.leftIcon}
              multiline={field.multiline}
              numberOfLines={field.numberOfLines}
              autoFocus={field.autoFocus ?? index === 0}
              style={field.multiline ? { height: 100, alignItems: 'flex-start', paddingTop: SPACING.sm } : undefined}
            />
          ))}

          <View style={styles.modalButtons}>
            <View style={{ flex: 1, marginRight: SPACING.xs }}>
              <CustomButton title={cancelLabel} variant="secondary" onPress={onCancel} disabled={isSubmitting} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.xs }}>
              <CustomButton title={submitLabel} variant="primary" onPress={onSubmit} loading={isSubmitting} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, globalStyles: GlobalStyles) => StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, padding: SPACING.xl, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { ...globalStyles.title, fontSize: 20, marginBottom: SPACING.lg },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
});
