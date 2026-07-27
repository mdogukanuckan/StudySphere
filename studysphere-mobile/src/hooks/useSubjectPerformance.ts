// src/hooks/useSubjectPerformance.ts
import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '../api/statisticService';



export const useSubjectPerformance = (userId: string) => {
  return useQuery({
    queryKey: ['subjectPerformance', userId],
    queryFn: () => statisticsService.getSubjectPerformance(userId),
    enabled: !!userId, 
  });
};