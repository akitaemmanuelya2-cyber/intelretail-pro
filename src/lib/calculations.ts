export interface DiagnosticInputs {
  weeklySales: number[];
  mixServices: number;
  marginAvg: number;
  fixedCosts: number;
  variableCosts: number;
  totalCustomers: number;
}

export interface DiagnosticResult {
  totalSales: number;
  netProfit: number;
  breakEvenPoint: number;
  avgTicket: number;
}

export function calculateExpressDiagnostic(inputs: DiagnosticInputs): DiagnosticResult {
  const totalSales = inputs.weeklySales.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  
  // Ponderación de servicios: a mayor proporción de servicios, mayor es el margen efectivo
  const serviceRatio = Math.min(Math.max((inputs.mixServices || 0) / 100, 0), 1);
  const baseMarginRatio = Math.min(Math.max((inputs.marginAvg || 0) / 100, 0), 1);
  
  const effectiveMargin = baseMarginRatio > 0 
    ? baseMarginRatio * (1 + serviceRatio * 0.25)
    : serviceRatio * 0.70;

  const netProfit = totalSales * effectiveMargin - inputs.fixedCosts - inputs.variableCosts;
  const breakEvenPoint = effectiveMargin > 0 ? (inputs.fixedCosts + inputs.variableCosts) / effectiveMargin : 0;
  const avgTicket = inputs.totalCustomers > 0 ? totalSales / inputs.totalCustomers : 0;

  return { totalSales, netProfit, breakEvenPoint, avgTicket };
}

export interface SimulatorInputs {
  priceAdjustment: number;
  adBudget: number;
  leadCost: number;
  conversionRate: number;
  currentSales: number;
  currentQty: number;
  avgCostPercentage: number;
}

export interface SimulatorResult {
  priceFactor: number;
  qtyFactor: number;
  leadsGenerated: number;
  newCustomers: number;
  simulatedSales: number;
  simulatedCost: number;
  simulatedProfit: number;
}

export function calculateSimulation(inputs: SimulatorInputs): SimulatorResult {
  const priceFactor = 1 + inputs.priceAdjustment / 100;
  const qtyFactor = 1 - (inputs.priceAdjustment / 100) * 0.5;

  const leadsGenerated = inputs.leadCost > 0 ? Math.floor(inputs.adBudget / inputs.leadCost) : 0;
  const newCustomers = Math.floor(leadsGenerated * (inputs.conversionRate / 100));

  const avgHistoricalTicket = inputs.currentQty > 0 ? inputs.currentSales / inputs.currentQty : 0;

  const simulatedSales =
    inputs.currentSales * priceFactor * qtyFactor +
    newCustomers * avgHistoricalTicket * priceFactor;

  const simulatedCost =
    inputs.currentSales * inputs.avgCostPercentage * qtyFactor +
    newCustomers * avgHistoricalTicket * inputs.avgCostPercentage;

  const simulatedProfit = simulatedSales - simulatedCost - inputs.adBudget;

  return {
    priceFactor,
    qtyFactor,
    leadsGenerated,
    newCustomers,
    simulatedSales,
    simulatedCost,
    simulatedProfit,
  };
}

export interface PlannerInputs {
  targetProfit: number;
  months: number;
  fixedMonthlyCosts: number;
  maxDailyCapacity: number;
  seasonality: number;
  rateAdjustment: number;
  avgCostPercentage: number;
  historicalSales: number;
  historicalRecordsCount: number;
}

export interface PlannerResult {
  totalRequiredSales: number;
  dailyRequiredSales: number;
  dailyRequiredCustomers: number;
  capacityExceeded: boolean;
}

export function calculatePlanner(inputs: PlannerInputs): PlannerResult {
  const commercialMargin = (100 - inputs.avgCostPercentage) / 100;
  const totalFixedCosts = inputs.fixedMonthlyCosts * inputs.months;
  const adjustedTargetProfit = inputs.targetProfit * (1 - inputs.seasonality / 100);

  const totalRequiredSales =
    commercialMargin > 0 ? (adjustedTargetProfit + totalFixedCosts) / commercialMargin : 0;

  const dailyRequiredSales = totalRequiredSales / (30 * inputs.months);

  const baseAvgTicket =
    inputs.historicalRecordsCount > 0
      ? inputs.historicalSales / inputs.historicalRecordsCount
      : totalRequiredSales / (300 * inputs.months);

  const simulatedAvgTicket = baseAvgTicket * (1 + inputs.rateAdjustment / 100);

  const dailyRequiredCustomers =
    simulatedAvgTicket > 0 ? Math.ceil(dailyRequiredSales / simulatedAvgTicket) : 0;

  const capacityExceeded = dailyRequiredCustomers > inputs.maxDailyCapacity;

  return {
    totalRequiredSales,
    dailyRequiredSales,
    dailyRequiredCustomers,
    capacityExceeded,
  };
}