import { useQuery } from '@tanstack/react-query';
import { achievementService } from '../api/achievementService';

export const useAchievements = () => {
    return useQuery({
        queryKey: ['achievements'],
        queryFn: achievementService.getMine,
    });
};
