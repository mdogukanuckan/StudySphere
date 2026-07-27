
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SPACING, ThemeColors } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { TopicTask } from '../types/topicTask';

interface Props {
    task: TopicTask;
    onToggle: () => void;
    onDelete: () => void;
    onSaveNote: (notes: string) => void;
    isSavingNote?: boolean;
    topLabel?: React.ReactNode;
}

export const TopicTaskRow: React.FC<Props> = ({ task, onToggle, onDelete, onSaveNote, isSavingNote, topLabel }) => {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const [isNoteOpen, setNoteOpen] = useState(false);
    const [noteText, setNoteText] = useState(task.notes ?? '');
    const [isNoteDirty, setNoteDirty] = useState(false);


    useEffect(() => {
        if (!isNoteDirty) setNoteText(task.notes ?? '');
    }, [task.notes, isNoteDirty]);

    const handleToggleNote = () => setNoteOpen((prev) => !prev);

    const handleSave = () => {
        onSaveNote(noteText.trim());
        setNoteDirty(false);
    };

    return (
        <View style={styles.container}>
            {topLabel}
            <View style={styles.row}>
                <TouchableOpacity style={styles.checkboxArea} onPress={onToggle} activeOpacity={0.7}>
                    <View style={[styles.checkbox, task.isCompleted && styles.checkboxChecked]}>
                        {task.isCompleted && <Text style={styles.checkboxTick}>✓</Text>}
                    </View>
                    <Text style={[styles.title, task.isCompleted && styles.titleDone]} numberOfLines={3}>
                        {task.title}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleToggleNote} style={styles.noteToggleButton}>
                    <Text style={styles.noteToggleText}>{task.notes ? '📝' : '🖊️'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
            </View>

            {isNoteOpen && (
                <View style={styles.noteSection}>
                    <TextInput
                        style={styles.noteInput}
                        multiline
                        placeholder="Bu göreve özel bir not ekle..."
                        placeholderTextColor={colors.textSecondary}
                        value={noteText}
                        onChangeText={(text) => {
                            setNoteText(text);
                            setNoteDirty(true);
                        }}
                    />
                    <TouchableOpacity
                        style={[styles.saveButton, !isNoteDirty && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={!isNoteDirty || isSavingNote}
                    >
                        {isSavingNote ? (
                            <ActivityIndicator size="small" color={colors.surface} />
                        ) : (
                            <Text style={styles.saveButtonText}>Notu Kaydet</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.xs,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    checkboxArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.primary,
        marginRight: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: { backgroundColor: colors.primary },
    checkboxTick: { color: colors.surface, fontSize: 14, fontWeight: 'bold' },
    title: { fontSize: 15, color: colors.text, flexShrink: 1 },
    titleDone: { textDecorationLine: 'line-through', color: colors.textSecondary },
    noteToggleButton: { padding: SPACING.xs, marginLeft: SPACING.xs },
    noteToggleText: { fontSize: 16 },
    deleteButton: { padding: SPACING.xs, marginLeft: SPACING.xs },
    deleteText: { color: colors.error, fontSize: 16, fontWeight: 'bold' },

    noteSection: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.border },
    noteInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.background,
        color: colors.text,
        padding: SPACING.sm,
        minHeight: 70,
        textAlignVertical: 'top',
        fontSize: 14,
        marginBottom: SPACING.sm,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: colors.surface, fontWeight: '600', fontSize: 13 },
});
