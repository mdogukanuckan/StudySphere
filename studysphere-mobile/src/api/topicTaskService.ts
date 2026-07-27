import { CreateTopicTaskRequest, TopicTask, TopicTaskOverviewItem, TopicTaskWithContext, UpdateTopicTaskRequest } from "../types/topicTask";
import apiClient from "./client";

export const topicTaskService = {
    getTopicTasks: async (topicId: string): Promise<TopicTask[]> => {
        const response = await apiClient.get<TopicTask[]>(`/topic-tasks?topicId=${topicId}`);
        return response.data;
    },

    getMyOverview: async (): Promise<TopicTaskOverviewItem[]> => {
        const response = await apiClient.get<TopicTaskOverviewItem[]>('/topic-tasks/my-overview');
        return response.data;
    },

    getMyTasks: async (): Promise<TopicTaskWithContext[]> => {
        const response = await apiClient.get<TopicTaskWithContext[]>('/topic-tasks/my');
        return response.data;
    },

    createTopicTask: async (data: CreateTopicTaskRequest): Promise<TopicTask> => {
        const response = await apiClient.post<TopicTask>('/topic-tasks', data);
        return response.data;
    },

    updateTopicTask: async (id: string, data: UpdateTopicTaskRequest): Promise<TopicTask> => {
        const response = await apiClient.patch<TopicTask>(`/topic-tasks/${id}`, data);
        return response.data;
    },

    deleteTopicTask: async (id: string): Promise<void> => {
        await apiClient.delete(`/topic-tasks/${id}`);
    },
};
