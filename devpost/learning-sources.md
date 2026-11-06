# Learning content and verification

Reviewed 2026-11-06. All proposed examples use fictional credits and practice tax rates. No personal financial information is collected.

## Budgeting

Consumer.gov explains a budget as a plan for income and spending, including saving for goals and emergencies. Money Garden will represent allocation explicitly and preserve the total; it will not prescribe a universal budget percentage.

https://consumer.gov/your-money/making-budget

## Emergency reserves

The CFPB describes an emergency fund as money reserved for unexpected costs and notes that the amount depends on individual circumstances. The game's reserve target is a disclosed challenge constraint, not a recommendation for everyone.

https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/

## Progressive tax layers

The IRS explains that higher bracket rates apply to income in the higher bracket, rather than retroactively to all income. The game teaches that concept using explicitly fictional rates and thresholds. It does not calculate actual liability or model benefits, withholding, payroll taxes, deductions, or credits.

https://www.irs.gov/filing/federal-income-tax-rates-and-brackets

Practice formula for nonnegative taxable income x:

`tax(x) = 0.10 * min(max(x - 1000, 0), 1000) + 0.20 * max(x - 2000, 0)`

Expected checkpoints: x=0 → tax 0; x=1000 → 0; x=1500 → 50; x=2000 → 100; x=2500 → 200; x=3000 → 300. Retained income equals x minus tax. These are content specifications, not executed software-test results.

## Boolean logic

| A | B | A AND B | A OR B |
| --- | --- | --- | --- |
| false | false | false | false |
| false | true | false | true |
| true | false | false | true |
| true | true | true | true |

AND is appropriate only because the example policy explicitly requires both essentials and the reserve condition. Explain OR accurately as allowing either or both conditions. Neither operator is morally good or bad.

## Honest learning feedback

Assess demonstrated choices and explain their consequences. A game completion badge is not proof of real-world financial competence. Shortfalls invite revision; they do not label the learner irresponsible.
