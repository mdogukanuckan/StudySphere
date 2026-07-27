import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreateUniverseRequest, Universe, UpdateUniverseRequest } from "../types/universe"
import { universeService } from "../api/universeService"

export const useUniverses = () => {
    return useQuery<Universe[], Error>({
        queryKey: ['universes'],
        queryFn: universeService.getAllUniverses,
    });
};

export const useUniverse = (id: string) => {
    return useQuery<Universe, Error>({
        queryKey: ['universes', id],
        queryFn: () => universeService.getUniverseById(id),
        enabled: !!id
    });
};

export const useCreateUniverse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateUniverseRequest) => universeService.createUniverse(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['universes'] });
        },
    });
};

export const useUpdateUniverse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUniverseRequest }) =>
            universeService.updateUniverse(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['universes'] });
        },
    });
};

export const useDeleteUniverse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => universeService.deleteUniverse(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['universes'] });
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });
};