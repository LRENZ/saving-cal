import { fetchCostOfLivingData, CostOfLivingData } from '../utils/api';

interface WorkerInput {
  cities: string[];
  savings: number;
  annualReturnRate: number;
  inflationRate: number;
  customExpenses: Record<string, {
    housing: number | null;
    food: number | null;
    entertainment: number | null;
    other: number;
  }>;
}

interface CityResult {
  city: string;
  days: number;
  costOfLivingData: CostOfLivingData;
}

self.onmessage = async (event: MessageEvent<WorkerInput>) => {
  const { cities, savings, annualReturnRate, inflationRate, customExpenses } = event.data;
  const results: CityResult[] = [];

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    try {
      const costOfLivingData = await fetchCostOfLivingData(city);
      const cityCustomExpenses = customExpenses[city] || {};
      const days = calculateDays(costOfLivingData, savings, annualReturnRate, inflationRate, cityCustomExpenses);
      results.push({ city, days, costOfLivingData });
    } catch (error) {
      console.error(`Error fetching data for ${city}:`, error);
      // 如果获取数据失败，使用默认值
      const defaultCostOfLivingData: CostOfLivingData = {
        totalMonthlyExpenses: 5000,
        housingExpenses: 2500,
        foodExpenses: 1500,
        entertainmentExpenses: 1000
      };
      const cityCustomExpenses = customExpenses[city] || {};
      const days = calculateDays(defaultCostOfLivingData, savings, annualReturnRate, inflationRate, cityCustomExpenses);
      results.push({ city, days, costOfLivingData: defaultCostOfLivingData });
    }

    // 发送进度更新
    self.postMessage({ type: 'progress', progress: (i + 1) / cities.length * 100 });
  }

  results.sort((a, b) => b.days - a.days);
  self.postMessage({ type: 'result', results });
};

function calculateDays(
  costOfLivingData: CostOfLivingData,
  savings: number,
  annualReturnRate: number,
  inflationRate: number,
  customExpenses: {
    housing: number | null;
    food: number | null;
    entertainment: number | null;
    other: number;
  }
): number {
  const monthlyExpenses = 
    (customExpenses.housing ?? costOfLivingData.housingExpenses) +
    (customExpenses.food ?? costOfLivingData.foodExpenses) +
    (customExpenses.entertainment ?? costOfLivingData.entertainmentExpenses) +
    (customExpenses.other ?? 0);
  const monthlyReturnRate = annualReturnRate / 12;
  const monthlyInflationRate = inflationRate / 12;
  let remainingSavings = savings;
  let months = 0;

  while (remainingSavings > 0) {
    remainingSavings += remainingSavings * monthlyReturnRate;
    remainingSavings -= monthlyExpenses * Math.pow(1 + monthlyInflationRate, months);
    months++;
  }

  return Math.floor(months * 30);
}