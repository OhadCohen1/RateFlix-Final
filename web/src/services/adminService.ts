import api from './api';
import type { AdminStatsPayload } from '../types/api';
import type { AdminStats } from '../types';

export const fetchAdminStats = async (): Promise<AdminStats> => {
  const payload = await api.get<AdminStatsPayload>('/admin/stats');
  return {
    totals: payload.totals,
    avgScore: payload.avgScore,
    topMovies: payload.topMovies,
    engine: payload.engine,
    recentLogs: payload.recentLogs.map((log) => ({
      id: log._id,
      userEmail: log.userEmail,
      source: log.source,
      itemsCount: log.itemsCount,
      executionTimeMs: log.executionTimeMs,
      calculatedAt: log.calculatedAt,
    })),
  };
};
