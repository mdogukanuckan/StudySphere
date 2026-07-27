import { CreateSubjectRequest, DeleteSubjectResult, Subject, UpdateSubjectRequest } from "../types/subject";
import apiClient from "./client";

export const subjectService = {
    
    getSubjects : async (universeId: string): Promise<Subject[]> =>{
        const response = await apiClient.get<Subject[]>(`/subjects?universeId=${universeId}`);
        return response.data;
    },

    getSubjectById : async (id : string) : Promise<Subject> => {
        const response = await apiClient.get<Subject>(`/subjects/${id}`);
        return response.data;
    },

    createSubject : async(data : CreateSubjectRequest) : Promise<Subject> => {
        const response = await apiClient.post<Subject>('/subjects',data);
        return response.data;
    },

    updateSubject : async(id : string, data : UpdateSubjectRequest) : Promise<Subject> =>{
        const response = await apiClient.patch<Subject>(`/subjects/${id}`,data);
        return response.data;
    },

    deleteSubject : async(id : string) : Promise<DeleteSubjectResult> =>{
        const response = await apiClient.delete<DeleteSubjectResult>(`/subjects/${id}`);
        return response.data;
    }
}