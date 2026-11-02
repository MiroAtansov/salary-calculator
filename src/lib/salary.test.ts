import { describe, expect, it } from 'vitest'
import { STANDARD_RATES } from './rates'
import { cappedNetThreshold, grossFromNet, netFromGross, profileCost } from './salary'

// Expected values come from evaluating "Salary Calculator 2026.xlsx" with these inputs.
describe('Net calculator sheet', () => {
  const cases = [
    { net: 0, gross: 0, ss: 0, payroll: 101.13, cost: 254.3334 },
    { net: 500, gross: 644.35, ss: 121.91, payroll: 867.39, cost: 1158.5202 },
    { net: 1000, gross: 1288.69, ss: 243.82, payroll: 1633.64, cost: 2062.6952 },
    { net: 1500, gross: 1933.04, ss: 365.73, payroll: 2399.9, cost: 2966.882 },
    { net: 1784.75, gross: 2299.99, ss: 435.16, payroll: 2836.28, cost: 3481.8104 },
    { net: 1784.76, gross: 2300.01, ss: 435.16, payroll: 2836.3, cost: 3481.834 },
    { net: 2000, gross: 2539.16, ss: 435.16, payroll: 3075.45, cost: 3764.031 },
    { net: 3000, gross: 3650.27, ss: 435.16, payroll: 4186.56, cost: 5075.1408 },
    { net: 5000, gross: 5872.5, ss: 435.16, payroll: 6408.79, cost: 7697.3722 },
  ]

  it.each(cases)('net $net → cost per profile $cost', ({ net, gross, ss, payroll, cost }) => {
    expect(grossFromNet(net)).toBe(gross)
    const result = profileCost(gross, STANDARD_RATES)
    expect(result.employerSocialSecurity).toBe(ss)
    expect(result.payrollCost).toBeCloseTo(payroll, 6)
    expect(result.costPerProfile).toBeCloseTo(cost, 6)
  })

  it('uses the same cap threshold as the spreadsheet', () => {
    expect(cappedNetThreshold()).toBe(1784.75)
  })
})

describe('FLC sheet', () => {
  const cases = [
    { gross: 0, payroll: 101.13, annualPayroll: 1213.56, flc: 254.3334, annualFlc: 3052.0008 },
    { gross: 933, payroll: 1210.65, annualPayroll: 14527.8, flc: 1563.567, annualFlc: 18762.804 },
    { gross: 2299.99, payroll: 2836.28, annualPayroll: 34035.36, flc: 3481.8104, annualFlc: 41781.7248 },
    { gross: 2300, payroll: 2836.29, annualPayroll: 34035.48, flc: 3481.8222, annualFlc: 41781.8664 },
    { gross: 4097, payroll: 4633.29, annualPayroll: 55599.48, flc: 5602.2822, annualFlc: 67227.3864 },
  ]

  it.each(cases)('gross $gross → FLC $flc', ({ gross, payroll, annualPayroll, flc, annualFlc }) => {
    const result = profileCost(gross, STANDARD_RATES)
    expect(result.payrollCost).toBeCloseTo(payroll, 6)
    expect(result.annualPayrollCost).toBeCloseTo(annualPayroll, 6)
    expect(result.costPerProfile).toBeCloseTo(flc, 6)
    expect(result.annualCostPerProfile).toBeCloseTo(annualFlc, 6)
  })
})

describe('netFromGross', () => {
  it.each([0, 500, 1000, 1500, 1784.75, 2000, 3000, 5000])('round-trips net %d', (net) => {
    expect(netFromGross(grossFromNet(net)).net).toBeCloseTo(net, 1)
  })

  it('caps employee contributions at the max insurable income', () => {
    expect(netFromGross(6000).employeeSocialSecurity).toBe(316.94)
  })
})
