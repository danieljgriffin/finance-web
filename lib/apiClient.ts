
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

export interface HistoricalDataPoint {
    date: string;
    value: number;
    platform_breakdown?: Record<string, number>;
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
        return this.request<HistoricalDataPoint[]>(`/net-worth/history/${year}`);
    }

    async getGraphData(period: string) {
        return this.request<HistoricalDataPoint[]>(`/net-worth/graph-data?period=${period}`);
    }

    async getNetWorthHistoryMonths(months: number) {
        return this.request<HistoricalDataPoint[]>(`/net-worth/history/range/months?months=${months}`);
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

    async addInvestment(investment: any) {
        return this.request<Investment>('/holdings/', {
            method: 'POST',
            body: JSON.stringify(investment),
        });
    }

    async updateInvestment(id: number, updates: Partial<Investment>) {
        return this.request<Investment>(`/holdings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteInvestment(id: number) {
        return this.request<{ status: string }>(`/holdings/${id}`, {
            method: 'DELETE',
        });
    }

    async getPlatformCash(platform: string) {
        return this.request<PlatformCash>(`/holdings/cash/${platform}`);
    }

    async updatePlatformCash(platform: string, amount: number) {
        return this.request<PlatformCash>(`/holdings/cash/${platform}`, {
            method: 'POST',
            body: JSON.stringify({ cash_balance: amount }),
        });
    }

    async renamePlatform(oldName: string, newName: string) {
        return this.request<any>(`/holdings/platform/rename?old_name=${encodeURIComponent(oldName)}&new_name=${encodeURIComponent(newName)}`, {
            method: 'POST',
        });
    }

    async updatePlatformColor(platform: string, color: string) {
        return this.request<any>(`/holdings/platform/color?platform=${encodeURIComponent(platform)}&color=${encodeURIComponent(color)}`, {
            method: 'POST',
        });
    }

    async importTrading212(apiKeyId: string, apiSecretKey: string) {
        return this.request<any>('/holdings/import/trading212', {
            method: 'POST',
            body: JSON.stringify({
                api_key_id: apiKeyId,
                api_secret_key: apiSecretKey
            }),
        });
    }

    async getPlatformColors() {
        return this.request<Record<string, string>>('/holdings/platform/colors');
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

    async updateGoal(id: number, updates: Partial<Goal>) {
        return this.request<Goal>(`/goals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteGoal(id: number) {
        return this.request<void>(`/goals/${id}`, {
            method: 'DELETE',
        });
    }

    // Cashflow (Income vs Investment)
    async getIncomeData() {
        return this.request<IncomeData[]>('/cashflow/income');
    }

    async updateIncomeData(year: string, income: number, investment: number) {
        return this.request<IncomeData>(`/cashflow/income?year=${encodeURIComponent(year)}&income=${income}&investment=${investment}`, {
            method: 'POST',
        });
    }
}

export interface IncomeData {
    year: string;
    income: number;
    investment: number;
    created_at?: string;
}

export const api = new ApiClient();
