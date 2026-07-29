import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '../api/statisticService';

export const useSubjectPerformance = () => {
  return useQuery({
    queryKey: ['subjectPerformance'],
    queryFn: statisticsService.getSubjectPerformance,
  });
};
