import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { topicService } from "../api/topicService"
import { CreateTopicRequest, UpdateTopicRequest } from "../types/topic";

export const useTopics = (subjectId: string) => {
    return useQuery({
        queryKey: ['topics', subjectId], 
        queryFn: () => topicService.getTopics(subjectId),
        enabled: !!subjectId,
    });
};

export const useTopic = (id : string) =>{
    return useQuery({

        queryKey: ['topics', id],
        queryFn : () =>topicService.getTopicById(id),
        enabled : !!id
    });
};

export const useCreateTopic = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn : (data : CreateTopicRequest) => topicService.createTopic(data),
        onSuccess : () => {
            queryClient.invalidateQueries({queryKey:['topics']}),
            queryClient.invalidateQueries({queryKey : ['subjects']});
        }
    });
};
export const useUpdateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTopicRequest }) =>
      topicService.updateTopic(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topics', variables.id] });

      queryClient.invalidateQueries({ queryKey: ['topicTasks', 'my-overview'] });
    },
  });
};

export const useDeleteTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => topicService.deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};