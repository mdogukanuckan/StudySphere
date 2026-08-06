import { useMutation } from '@tanstack/react-query';
import { studySummaryService, StudySummaryPeriod } from '../api/studySummaryService';

export const useSendStudySummaryReport = () => {
    return useMutation({
        mutationFn: (period: StudySummaryPeriod) => studySummaryService.sendReport(period),
    });
};
