import assert from 'node:assert/strict';
import test from 'node:test';
import { allocationMonthlyTotal, financeTotals } from './financePlan.ts';

const example = () => ({
    take_home_monthly_pence: 420000,
    bills: [
        { name: 'Monthly bills', amount_pence: 45000, frequency: 'monthly' },
        { name: 'Annual bill', amount_pence: 8796, frequency: 'annual' },
    ],
    allocations: [
        { platform: 'Trading212 GIA', amount_pence: 188300, funds: [
            { name: 'Invesco', amount_pence: 80000 },
            { name: 'Vanguard', amount_pence: 63300 },
            { name: 'Gold', amount_pence: 45000 },
        ] },
        { platform: 'Other platform', amount_pence: 191600, funds: [] },
    ],
});

test('fund reduction updates existing platform budgets, annual totals and free spending', () => {
    const plan = example();
    assert.equal(financeTotals(plan).annualFree, -67596);
    plan.allocations[0].funds[0].amount_pence = 70000;
    assert.equal(allocationMonthlyTotal(plan.allocations[0]), 178300);
    const totals = financeTotals(plan);
    assert.equal(totals.annualInvestments, 369900 * 12);
    assert.equal(totals.annualFree, 52404);
    assert.equal(totals.annualFree / 12, 4367);
});

test('increases, additions, removals and zero amounts all follow individual investments', () => {
    const plan = example();
    const row = plan.allocations[0];
    row.funds[0].amount_pence = 90000;
    assert.equal(allocationMonthlyTotal(row), 198300);
    row.funds.push({ name: 'New fund', amount_pence: 10000 });
    assert.equal(allocationMonthlyTotal(row), 208300);
    row.funds.splice(0, 1);
    assert.equal(allocationMonthlyTotal(row), 118300);
    row.funds.forEach(fund => { fund.amount_pence = 0; });
    assert.equal(allocationMonthlyTotal(row), 0);
});

test('platforms without listed investments retain their entered amount', () => {
    assert.equal(allocationMonthlyTotal(example().allocations[1]), 191600);
    assert.equal(financeTotals({ take_home_monthly_pence: 0, bills: [], allocations: [] }).annualFree, 0);
});

test('bill amount, frequency, addition and removal recalculate free spending', () => {
    const plan = example();
    const original = financeTotals(plan).annualFree;
    plan.bills[0].amount_pence -= 10000;
    assert.equal(financeTotals(plan).annualFree, original + 120000);
    plan.bills[1].amount_pence += 10000;
    assert.equal(financeTotals(plan).annualFree, original + 110000);
    plan.bills.push({ name: 'New bill', amount_pence: 10000, frequency: 'annual' });
    assert.equal(financeTotals(plan).annualFree, original + 100000);
    plan.bills[2].frequency = 'monthly';
    assert.equal(financeTotals(plan).annualFree, original - 10000);
    plan.bills.pop();
    assert.equal(financeTotals(plan).annualFree, original + 110000);
    plan.take_home_monthly_pence += 10000;
    assert.equal(financeTotals(plan).annualFree, original + 230000);
});
