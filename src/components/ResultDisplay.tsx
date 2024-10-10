import React, { useMemo } from 'react';
import { Calendar, Coffee, Home, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { CostOfLivingData } from '../utils/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface ResultDisplayProps {
  days: number;
  city: string;
  costOfLivingData: CostOfLivingData;
  savings: number;
  annualReturnRate: number;
  inflationRate: number;
  percentileRank: number | null;
  customExpenses: {
    housing: number | null;
    food: number | null;
    entertainment: number | null;
    other: number;
  };
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  days, 
  city, 
  costOfLivingData, 
  savings, 
  annualReturnRate, 
  inflationRate,
  percentileRank,
  customExpenses
}) => {
  const generateChartData = useMemo(() => {
    const labels = [];
    const savingsData = [];
    const expensesData = [];
    let currentSavings = savings;
    let totalExpenses = 0;
    const monthlyExpenses = 
      (customExpenses.housing ?? costOfLivingData.housingExpenses) +
      (customExpenses.food ?? costOfLivingData.foodExpenses) +
      (customExpenses.entertainment ?? costOfLivingData.entertainmentExpenses) +
      customExpenses.other;
    const monthlyReturnRate = annualReturnRate / 12;
    const monthlyInflationRate = inflationRate / 12;

    for (let month = 0; month <= Math.ceil(days / 30); month++) {
      labels.push(`第 ${month} 月`);
      savingsData.push(Math.max(currentSavings, 0));
      expensesData.push(totalExpenses);

      currentSavings += currentSavings * monthlyReturnRate;
      const inflatedExpenses = monthlyExpenses * Math.pow(1 + monthlyInflationRate, month);
      currentSavings -= inflatedExpenses;
      totalExpenses += inflatedExpenses;
    }

    return {
      labels,
      datasets: [
        {
          label: '剩余储蓄',
          data: savingsData,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: '累计支出',
          data: expensesData,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }
      ]
    };
  }, [days, savings, costOfLivingData, annualReturnRate, inflationRate, customExpenses]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '储蓄消耗与累计支出趋势',
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
          callback: function(value: any, index: number, ticks: any[]) {
            return index % 3 === 0 ? ticks[index].label : '';
          }
        }
      }
    }
  };

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-indigo-800 mb-4">计算结果</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center">
          <Calendar className="text-indigo-600 mr-2" />
          <span className="font-semibold">您可以躺平：</span>
          <span className="ml-2 text-2xl font-bold text-indigo-600">{days} 天</span>
        </div>
        <div className="flex items-center">
          <Users className="text-indigo-600 mr-2" />
          <span className="font-semibold">超过了：</span>
          <span className="ml-2 text-2xl font-bold text-indigo-600">{percentileRank !== null ? `${percentileRank}%` : '计算中...'}</span>
          <span className="ml-2">的用户</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col">
          <span className="text-gray-600">城市</span>
          <span className="text-lg font-semibold">{city}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-600">总储蓄</span>
          <span className="text-lg font-semibold">¥{savings.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-600">年化收益率</span>
          <span className="text-lg font-semibold">{(annualReturnRate * 100).toFixed(2)}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-gray-600">通胀率</span>
          <span className="text-lg font-semibold">{(inflationRate * 100).toFixed(2)}%</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center">
          <Home className="text-indigo-600 mr-2" />
          <span className="font-semibold">住房支出：</span>
          <span className="ml-2">¥{(customExpenses.housing ?? costOfLivingData.housingExpenses).toLocaleString()}/月</span>
        </div>
        <div className="flex items-center">
          <ShoppingCart className="text-indigo-600 mr-2" />
          <span className="font-semibold">食品支出：</span>
          <span className="ml-2">¥{(customExpenses.food ?? costOfLivingData.foodExpenses).toLocaleString()}/月</span>
        </div>
        <div className="flex items-center">
          <Coffee className="text-indigo-600 mr-2" />
          <span className="font-semibold">娱乐支出：</span>
          <span className="ml-2">¥{(customExpenses.entertainment ?? costOfLivingData.entertainmentExpenses).toLocaleString()}/月</span>
        </div>
        <div className="flex items-center">
          <TrendingUp className="text-indigo-600 mr-2" />
          <span className="font-semibold">其他支出：</span>
          <span className="ml-2">¥{customExpenses.other.toLocaleString()}/月</span>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-indigo-800 mb-2">储蓄消耗与累计支出趋势图：</h3>
        <div className="h-[300px] md:h-[400px]">
          <Line options={chartOptions} data={generateChartData} />
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;