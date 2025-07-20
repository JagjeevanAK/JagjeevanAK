import request from 'graphql-request';

import { GetGithubContributions } from '@/lib/graphql';
import type { GithubContributionData } from '@/types';

// Define the expected GraphQL response shape
interface ContributionsResponse {
    user: {
        contributionsCollection: {
            contributionCalendar: {
                totalContributions: number;
                weeks: Array<{ contributionDays: Array<{ contributionCount: number; date: string }> }>;
            };
        };
        repositories: { nodes: Array<{ pushedAt: string }> };
    };
}

const getGithubContributions = async (username: string): Promise<GithubContributionData> => {
    if (!process.env.GITHUB_ACCESS_TOKEN) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('No GitHub token provided, using mock data');
        }

        return {
            lastPushedAt: new Date().toISOString(),
            totalContributions: 365,
            contributions: Array.from({ length: 30 }, (_, i) => ({
                count: Math.floor(Math.random() * 10),
                date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().replace(/-/g, '/')
            }))
        };
    }

    try {
        // Add cache-busting timestamp
        const timestamp = Date.now();

        // Request with typed response
        const response = await request<ContributionsResponse>({
            url: 'https://api.github.com/graphql',
            document: GetGithubContributions,
            variables: {
                userName: username,
                _cacheBust: timestamp // Add timestamp parameter for cache busting
            },
            requestHeaders: {
                Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        // Extract calendar data
        const calendar = response.user.contributionsCollection.contributionCalendar;

        return {
            lastPushedAt: response.user.repositories.nodes[0].pushedAt,
            totalContributions: calendar.totalContributions,
            contributions: calendar.weeks.flatMap(week =>
                week.contributionDays.map(day => ({
                    count: day.contributionCount,
                    date: day.date.replace(/-/g, '/')
                }))
            )
        };
    } catch (error) {
        // Only log errors in development
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching GitHub contributions:', error);
        }

        // Return mock data instead of throwing to prevent component failures
        return {
            lastPushedAt: new Date().toISOString(),
            totalContributions: 365,
            contributions: Array.from({ length: 30 }, (_, i) => ({
                count: Math.floor(Math.random() * 10),
                date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().replace(/-/g, '/')
            }))
        };
    }
};

export default getGithubContributions;