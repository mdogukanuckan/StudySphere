import { useQuery } from '@tanstack/react-query';
import { statisticsService, SubjectPerformanceRange } from '../api/statisticService';

export const useSubjectPerformance = (range?: SubjectPerformanceRange) => {
  return useQuery({
    queryKey: ['subjectPerformance', range ?? 'all'],
    queryFn: () => statisticsService.getSubjectPerformance(range),
  });
};
