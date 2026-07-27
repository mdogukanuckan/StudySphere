import {   useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { subjectService } from "../api/subjectService"
import { CreateSubjectRequest, UpdateSubjectRequest } from "../types/subject";

export const useSubjects = (universeId: string) => {
    return useQuery({
        queryKey : ['subjects', universeId],
        queryFn : () => subjectService.getSubjects(universeId),
        enabled : !!universeId,
    });
};

export const useSubject = (id : string) =>{
    return useQuery({
        queryKey : ['subjects',id],
        queryFn : () => subjectService.getSubjectById(id),
        enabled : !!id
    });
} ;

export const useCreateSubject  = () =>{
  const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data : CreateSubjectRequest) => subjectService.createSubject(data),
        onSuccess : () => {
            queryClient.invalidateQueries({queryKey : ['subjects']}),
            queryClient.invalidateQueries({queryKey : ['universes']})
        },
    });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubjectRequest }) =>
      subjectService.updateSubject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects', variables.id] });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectService.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['universes'] });
    },
  });
};