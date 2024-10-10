import localCostOfLivingData from '../data/localCostOfLiving.json';

export interface CostOfLivingData {
  totalMonthlyExpenses: number;
  housingExpenses: number;
  foodExpenses: number;
  entertainmentExpenses: number;
}

export const fetchCostOfLivingData = async (city: string): Promise<CostOfLivingData> => {
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 使用本地数据
    const localData = (localCostOfLivingData as Record<string, CostOfLivingData>)[city];
    if (localData) {
      console.log('使用本地数据:', city);
      return localData;
    }
    
    // 如果没有本地数据，生成随机数据
    console.log('生成随机数据:', city);
    const totalMonthlyExpenses = Math.floor(Math.random() * 5000) + 5000;
    const housingExpenses = Math.floor(totalMonthlyExpenses * 0.4);
    const foodExpenses = Math.floor(totalMonthlyExpenses * 0.3);
    const entertainmentExpenses = totalMonthlyExpenses - housingExpenses - foodExpenses;

    return {
      totalMonthlyExpenses,
      housingExpenses,
      foodExpenses,
      entertainmentExpenses,
    };
  } catch (error) {
    console.error('获取生活成本数据时出错:', error);
    // 返回默认值而不是抛出错误
    return {
      totalMonthlyExpenses: 8000,
      housingExpenses: 3000,
      foodExpenses: 1500,
      entertainmentExpenses: 1000,
    };
  }
};