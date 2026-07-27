
export interface TopicTask {
    id: string;
    title: string;
    topicId: string;
    isCompleted: boolean;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTopicTaskRequest {
    title: string;
    topicId: string;
    notes ?: string;
}

export interface UpdateTopicTaskRequest {
    title ?: string;
    isCompleted ?: boolean;
    notes ?: string;
}


export interface TopicTaskOverviewItem {
    topicId: string;
    topicName: string;
    subjectId: string;
    subjectName: string;
    notes: string | null;
    taskCount: number;
    completedCount: number;
    lastActivityAt: string;
}

export interface TopicTaskWithContext extends TopicTask {
    topicName: string;
    subjectId: string;
    subjectName: string;
}
