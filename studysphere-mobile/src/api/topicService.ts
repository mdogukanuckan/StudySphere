import { UpdateTopicRequest } from "../types/topic";
import { CreateTopicRequest, Topic } from "../types/topic";
import apiClient from "./client";

export const topicService = {
    getTopics: async (subjectId: string): Promise<Topic[]> => {
    const response = await apiClient.get<Topic[]>(`/topics?subjectId=${subjectId}`);
    return response.data;
},

    getTopicById : async (id : string) : Promise<Topic> => {
        const response = await apiClient.get<Topic>(`/topics/${id}`);
        return response.data;
    },

    createTopic : async (data : CreateTopicRequest) : Promise<Topic> =>{
        const response = await apiClient.post<Topic>('/topics', data);
        return response.data;
    },

    updateTopic : async(id : string, data : UpdateTopicRequest) : Promise<Topic> =>{
        const response = await apiClient.patch<Topic>(`/topics/${id}`,data);
        return response.data;
    },

    deleteTopic :async (id:string) :Promise<void> =>{
        await apiClient.delete(`/topics/${id}`);
    }
}