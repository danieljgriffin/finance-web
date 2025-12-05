
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types matching schemas.py
export interface Investment {
    id: number;
    platform: string;
    name: string;
    symbol?: string;
    holdings: number;
    amount_spent: number;
    average_buy_price: number;
    current_price: number;
    last_updated?: string;
}

export interface PlatformCash {
    platform: string;
    cash_balance: number;
    last_updated?: string;
}

export interface NetWorthDashboardSummary {
    total_networth: number;
    platform_breakdown: Record<string, number>;
    mom_change: number;
    mom_change_percent: number;
    ytd_change: number;
    ytd_change_percent: number;
    platforms: {
        platform: string;
        value: number;
        month_change_amount: number;
        month_change_percent: number;
    }[];
}

export interface NetWorthSummary {
    total_networth: number;
    platform_breakdown: Record<string, number>;
}

export interface Goal {
    id: number;
    title: string;
    description?: string;
    target_amount: number;
    target_date: string;
    status: string;
}

export interface MonthlyTrackerData {
    // Define based on actual response, assuming list of monthly snapshots
    month: string;
    year: number;
    total_networth: number;
    platform_breakdown: Record<string, number>;
}

class ApiClient {
    private getHeaders() {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        // Placeholder for Auth
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = this.getHeaders();

        const config = {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error (${response.status} ${url}):`, errorText);
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
            }
            return response.json();
        } catch (error) {
            console.error("Network Request Failed:", error);
            throw error;
        }
    }

    // Net Worth
    async getNetWorthSummary() {
        return this.request<NetWorthSummary>('/net-worth/summary');
    }

    async getDashboardSummary() {
        // If this endpoint doesn't exist yet, we might fallback to summary, but the plan said use /net-worth/dashboard-summary
        // checking net_worth.py, we saw @router.get("/dashboard-summary")
        return this.request<any>('/net-worth/dashboard-summary');
    }

    async getNetWorthHistory(year: number | 'all') {
        return this.request<any>(`/net-worth/history/${year}`);
    }

    async getIntradayHistory(hours: number) {
        return this.request<any>(`/net-worth/history/intraday/${hours}`);
    }

    async triggerIntradaySnapshot() {
        return this.request<any>('/net-worth/snapshot/intraday', { method: 'POST' });
    }

    async getMonthlyTracker() {
        return this.request<any>('/net-worth/monthly-tracker');
    }

    // Holdings
    async getHoldings() {
        return this.request<Record<string, Investment[]>>('/holdings/');
    }

    async getPlatformCash(platform: string) {
        return this.request<PlatformCash>(`/holdings/cash/${platform}`);
    }

    // Goals
    async getGoals() {
        return this.request<Goal[]>('/goals/');
    }

    async createGoal(goal: Omit<Goal, 'id'>) {
        return this.request<Goal>('/goals/', {
            method: 'POST',
            body: JSON.stringify(goal),
        });
    }
}

export const api = new ApiClient();
