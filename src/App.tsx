import React, { useState, useEffect } from 'react';
import { DollarSign, MapPin, TrendingUp, Home, Utensils, Coffee, MoreHorizontal } from 'lucide-react';
import CitySelector from './components/CitySelector';
import SavingsInput from './components/SavingsInput';
import ResultDisplay from './components/ResultDisplay';
import CityComparison from './components/CityComparison';
import { fetchCostOfLivingData, CostOfLivingData } from './utils/api';
import { saveResult, getPercentileRank, checkSupabaseConnection } from './services/supabase';

const App: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [savings, setSavings] = useState<number>(1000000);
  const [days, setDays] = useState<number>(0);
  const [costOfLivingData, setCostOfLivingData] = useState<CostOfLivingData | null>(null);
  const [annualReturnRate, setAnnualReturnRate] = useState<number>(0.03);
  const [inflationRate, setInflationRate] = useState<number>(0.02);
  const [percentileRank, setPercentileRank] = useState<number | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison'>('calculator');
  const [customExpenses, setCustomExpenses] = useState({
    housing: null as number | null,
    food: null as number | null,
    entertainment: null as number | null,
    other: 0,
  });

  useEffect(() => {
    checkSupabaseConnection().then(setSupabaseConnected);
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchCostOfLivingData(selectedCity)
        .then(data => {
          setCostOfLivingData(data);
          setCustomExpenses(prev => ({
            ...prev,
            housing: data.housingExpenses,
            food: data.foodExpenses,
            entertainment: data.entertainmentExpenses,
          }));
        })
        .catch(error => console.error('Error fetching cost of living data:', error));
    }
  }, [selectedCity]);

  const calculateDays = () => {
    if (costOfLivingData) {
      const monthlyExpenses = 
        (customExpenses.housing ?? costOfLivingData.housingExpenses) +
        (customExpenses.food ?? costOfLivingData.foodExpenses) +
        (customExpenses.entertainment ?? costOfLivingData.entertainmentExpenses) +
        customExpenses.other;
      const monthlyReturnRate = annualReturnRate / 12;
      const monthlyInflationRate = inflationRate / 12;
      let remainingSavings = savings;
      let months = 0;

      while (remainingSavings > 0) {
        remainingSavings += remainingSavings * monthlyReturnRate;
        remainingSavings -= monthlyExpenses * Math.pow(1 + monthlyInflationRate, months);
        months++;
      }

      const calculatedDays = Math.floor(months * 30);
      setDays(calculatedDays);
      
      if (supabaseConnected) {
        saveResult({ city: selectedCity, days: calculatedDays })
          .catch(error => console.error('Failed to save result:', error));
        getPercentileRank(calculatedDays)
          .then(setPercentileRank)
          .catch(error => console.error('Failed to get percentile rank:', error));
      } else {
        console.warn('Supabase is not connected. Results will not be saved or compared.');
        setPercentileRank(null);
      }
    }
  };

  const handleCustomExpenseChange = (type: keyof typeof customExpenses, value: number) => {
    setCustomExpenses(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-indigo-800 mb-8">躺平计算器</h1>
        
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeTab === 'calculator'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              单城市计算器
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeTab === 'comparison'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              城市比较
            </button>
          </div>
        </div>

        {!supabaseConnected && (
          <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p className="font-bold">注意：</p>
            <p>无法连接到数据库。您的结果将不会被保存或与其他用户比较。但您仍然可以使用计算器。</p>
          </div>
        )}

        {activeTab === 'calculator' ? (
          <div className="bg-white shadow-xl rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <CitySelector selectedCity={selectedCity} setSelectedCity={setSelectedCity} />
              <SavingsInput savings={savings} setSavings={setSavings} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <ExpenseInput
                icon={<Home size={24} />}
                label="住房"
                value={customExpenses.housing ?? (costOfLivingData?.housingExpenses || 0)}
                onChange={(value) => handleCustomExpenseChange('housing', value)}
              />
              <ExpenseInput
                icon={<Utensils size={24} />}
                label="饮食"
                value={customExpenses.food ?? (costOfLivingData?.foodExpenses || 0)}
                onChange={(value) => handleCustomExpenseChange('food', value)}
              />
              <ExpenseInput
                icon={<Coffee size={24} />}
                label="娱乐"
                value={customExpenses.entertainment ?? (costOfLivingData?.entertainmentExpenses || 0)}
                onChange={(value) => handleCustomExpenseChange('entertainment', value)}
              />
              <ExpenseInput
                icon={<MoreHorizontal size={24} />}
                label="其他"
                value={customExpenses.other}
                onChange={(value) => handleCustomExpenseChange('other', value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <ExpenseInput
                icon={<TrendingUp size={24} />}
                label="年化收益率 (%)"
                value={annualReturnRate * 100}
                onChange={(value) => setAnnualReturnRate(value / 100)}
                step={0.1}
                min={0}
                max={100}
              />
              <ExpenseInput
                icon={<TrendingUp size={24} />}
                label="通胀率 (%)"
                value={inflationRate * 100}
                onChange={(value) => setInflationRate(value / 100)}
                step={0.1}
                min={0}
                max={100}
              />
            </div>
            
            <button
              onClick={calculateDays}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
            >
              计算
            </button>

            {days > 0 && costOfLivingData && (
              <ResultDisplay
                days={days}
                city={selectedCity}
                costOfLivingData={costOfLivingData}
                savings={savings}
                annualReturnRate={annualReturnRate}
                inflationRate={inflationRate}
                percentileRank={percentileRank}
                customExpenses={customExpenses}
              />
            )}
          </div>
        ) : (
          <CityComparison
            initialSavings={savings}
            initialAnnualReturnRate={annualReturnRate}
            initialInflationRate={inflationRate}
            initialCustomExpenses={customExpenses}
          />
        )}
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>隐私声明：我们不会收集任何数据作为商用。如有任何问题，请联系 lrenz1116@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

interface ExpenseInputProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

const ExpenseInput: React.FC<ExpenseInputProps> = ({ icon, label, value, onChange, step, min, max }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.-]/g, '');
    onChange(value === '' ? 0 : Number(value));
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-sm font-medium text-gray-700 flex items-center">
        {icon}
        <span className="ml-2">{label}</span>
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">
            {label.includes('%') ? '' : '¥'}
          </span>
        </div>
        <input
          type="text"
          value={label.includes('%') ? value : formatCurrency(value)}
          onChange={handleChange}
          step={step}
          min={min}
          max={max}
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 py-2 sm:text-sm border-gray-300 rounded-md"
          placeholder={label.includes('%') ? '输入百分比' : '输入金额'}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">
            {label.includes('%') ? '%' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;