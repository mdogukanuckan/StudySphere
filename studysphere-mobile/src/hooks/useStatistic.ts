import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '../api/statisticService';

export const useMyStatistics = () => {
  return useQuery({
    queryKey: ['my-statistics'],
    queryFn: statisticsService.getMyStatistics,
  });
};

export const useDailyStats = () => {
  return useQuery({
    queryKey: ['daily-stats'],
    queryFn: statisticsService.getDailyStats,
  });
};

export const useModeBreakdown = () => {
  return useQuery({
    queryKey: ['mode-breakdown'],
    queryFn: statisticsService.getModeBreakdown,
  });
};