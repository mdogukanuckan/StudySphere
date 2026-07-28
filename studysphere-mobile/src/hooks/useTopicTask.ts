import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { topicTaskService } from "../api/topicTaskService";
import { CreateTopicTaskRequest, UpdateTopicTaskRequest } from "../types/topicTask";

export const useTopicTasks = (topicId: string) => {
    return useQuery({
        queryKey: ['topicTasks', topicId],
        queryFn: () => topicTaskService.getTopicTasks(topicId),
        enabled: !!topicId,
    });
};

export const useMyTopicTaskOverview = () => {
    return useQuery({
        queryKey: ['topicTasks', 'my-overview'],
        queryFn: () => topicTaskService.getMyOverview(),
    });
};

export const useMyTopicTasks = () => {
    return useQuery({
        queryKey: ['topicTasks', 'my'],
        queryFn: () => topicTaskService.getMyTasks(),
    });
};

export const useCreateTopicTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTopicTaskRequest) => topicTaskService.createTopicTask(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['topicTasks', variables.topicId] });

            queryClient.invalidateQueries({ queryKey: ['topicTasks', 'my-overview'] });
            queryClient.invalidateQueries({ queryKey: ['topicTasks', 'my'] });
        },
    });
};

export const useUpdateTopicTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTopicTaskRequest }) =>
            topicTaskService.updateTopicTask(id, data),
        onSuccess: () => {

            queryClient.invalidateQueries({ queryKey: ['topicTasks'] });
        },
    });
};

export const useDeleteTopicTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => topicTaskService.deleteTopicTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['topicTasks'] });
        },
    });
};
