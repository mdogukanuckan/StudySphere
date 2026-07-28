import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SPACING, ThemeColors, GlobalStyles } from '../theme/theme';
import { useTheme } from '../context/ThemeContext';
import { useSubjects } from '../hooks/useSubject';
import { useTopics } from '../hooks/useTopic';
import { Topic } from '../types/topic'; 
import { useUniverses } from '../hooks/useUniverses';

interface Props {
    visible: boolean;
    onClose: () => void;
    onTopicSelect: (topic: Topic) => void; 
}

export const SessionSelectionModal: React.FC<Props> = ({ visible, onClose, onTopicSelect }) => {
    const { colors, globalStyles } = useTheme();
    const styles = useMemo(() => createStyles(colors, globalStyles), [colors, globalStyles]);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    useEffect(() => {
        if (visible) {
            setStep(1);
            setSelectedUniverseId(null);
            setSelectedSubjectId(null);
        }
    }, [visible]);

    const { data: universes, isLoading: universesLoading } = useUniverses();
    const { data: subjects, isLoading: subjectsLoading } = useSubjects(selectedUniverseId || '');
    const { data: topics, isLoading: topicsLoading } = useTopics(selectedSubjectId || '');

    const handleUniverseSelect = (id: string) => {
        setSelectedUniverseId(id);
        setStep(2);
    };

    const handleSubjectSelect = (id: string) => {
        setSelectedSubjectId(id);
        setStep(3);
    };

    const handleTopicSelect = (topic: Topic) => {
        onTopicSelect(topic);
        onClose();
    };

    const handleBack = () => {
        if (step === 3) setStep(2);
        else if (step === 2) setStep(1);
    };

    const renderHeader = () => {
        let title = "Evren Seç";
        if (step === 2) title = "Ders Seç";
        if (step === 3) title = "Konu Seç";

        return (
            <View style={styles.header}>
                {step > 1 ? (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Text style={styles.backText}>← Geri</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.backButtonPlaceholder} />
                )}
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeText}>Kapat</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderList = () => {
        if (step === 1) {
            if (universesLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
            return (
                <FlatList
                    data={universes}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.listItem} onPress={() => handleUniverseSelect(item.id)}>
                            <Text style={styles.listText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>Henüz evren yok.</Text>}
                />
            );
        }

        if (step === 2) {
            if (subjectsLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
            return (
                <FlatList
                    data={subjects}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.listItem} onPress={() => handleSubjectSelect(item.id)}>
                            <Text style={styles.listText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>Bu evrende henüz ders yok.</Text>}
                />
            );
        }

        if (step === 3) {
            if (topicsLoading) return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
            return (
                <FlatList
                    data={topics}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.listItem} onPress={() => handleTopicSelect(item)}>
                            <Text style={styles.listText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>Bu derste henüz konu yok.</Text>}
                />
            );
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    {renderHeader()}
                    <View style={styles.listContainer}>
                        {renderList()}
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '60%',
        padding: SPACING.lg,
       
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        ...globalStyles.title,
        fontSize: 20,
    },
    backButton: {
        padding: SPACING.xs,
    },
    backButtonPlaceholder: {
        width: 50,
    },
    backText: {
        color: colors.primary,
        fontWeight: '600',
    },
    closeButton: {
        padding: SPACING.xs,
    },
    closeText: {
        color: colors.error,
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
    },
    listItem: {
        backgroundColor: colors.background,
        padding: SPACING.md,
        borderRadius: 12,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    listText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    loader: {
        marginTop: SPACING.xl,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: SPACING.xl,
        fontStyle: 'italic',
    }
});