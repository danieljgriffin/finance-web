import type { FinancePlan, PlanAllocation, PlannedBill } from './apiClient';

export const allocationMonthlyTotal = (allocation: PlanAllocation) => allocation.funds.length > 0
    ? allocation.funds.reduce((sum, fund) => sum + fund.amount_pence, 0)
    : allocation.amount_pence;

export const billAnnual = (bill: PlannedBill) => bill.amount_pence * (bill.frequency === 'monthly' ? 12 : 1);

export function financeTotals(plan: FinancePlan) {
    const annualPay = plan.take_home_monthly_pence * 12;
    const annualInvestments = plan.allocations.reduce((sum, row) => sum + allocationMonthlyTotal(row), 0) * 12;
    const annualBills = plan.bills.reduce((sum, bill) => sum + billAnnual(bill), 0);
    return { annualPay, annualInvestments, annualBills, annualFree: annualPay - annualBills - annualInvestments };
}
