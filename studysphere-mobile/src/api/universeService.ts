import { CreateUniverseRequest, DeleteUniverseResult, Universe, UpdateUniverseRequest } from "../types/universe";
import apiClient from "./client";

export const universeService = {
    
    getAllUniverses : async (): Promise<Universe[]> =>{
        const response = await apiClient.get<Universe[]>('/universes');
        return response.data;
    },

    getUniverseById : async (id : string) : Promise<Universe> => {
        const response = await apiClient.get<Universe>(`/universes/${id}`);
        return response.data;
    },

    createUniverse : async(data : CreateUniverseRequest) : Promise<Universe> =>{
        const response = await apiClient.post<Universe>('/universes',data);
        return response.data;
    },

    updateUniverse : async(id:string, data:UpdateUniverseRequest) :Promise<Universe> =>{
        const response = await apiClient.patch<Universe>(`/universes/${id}`,data);
        return response.data;
    },

    // Backend artık geçmiş/arşivlenmiş kayıtlar yüzünden kalıcı silemediği
    // evreni arşivliyor; { archived: true/false } ile bunu ayırt edebiliyoruz.
    deleteUniverse : async(id:string):Promise<DeleteUniverseResult> => {
        const response = await apiClient.delete<DeleteUniverseResult>(`/universes/${id}`);
        return response.data;
    }
}