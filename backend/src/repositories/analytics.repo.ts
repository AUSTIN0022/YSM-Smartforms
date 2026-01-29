import { EventAnalytics, Prisma } from "@prisma/client";

export interface IAnalyticsRepository {

    // Persist Redis counters into DB via (cron/worker) 
    upsertEventSnapshot(data: {
        eventId: string;
        totalVisits: number;
        totalStarted: number;
        totalSubmitted: number;
        conversionRate: number;
    }): Promise<EventAnalytics>;
    // Admin Dashboard
    getEventAnalytics(eventId: string): Promise<EventAnalytics | null>;
    // Global Admin KPIs
    getGlobalStats(userId: string): Promise<{
        totalEvents: number;
        totalSubmissions: number;
        totalRevenue: number;
    }>;
}