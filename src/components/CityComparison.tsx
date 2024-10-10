import React, { useState, useCallback, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchCostOfLivingData, CostOfLivingData } from '../utils/api';
import citiesByProvince from '../data/citiesByProvince';
import { DollarSign, TrendingUp, Percent, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import LoadingAnimation from './LoadingAnimation';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CityComparisonProps {
  initialSavings: number;
  initialAnnualReturnRate: number;
  initialInflationRate: number;
  initialCustomExpenses: {
    housing: number | null;
    food: number | null;
    entertainment: number | null;
    other: number;
  };
}

const CityComparison: React.FC<CityComparisonProps> = ({
  initialSavings,
  initialAnnualReturnRate,
  initialInflationRate,
  initialCustomExpenses,
}) => {
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [results, setResults] = useState<{ city: string; days: number; costOfLivingData: CostOfLivingData }[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savings, setSavings] = useState(initialSavings);
  const [annualReturnRate, setAnnualReturnRate] = useState(initialAnnualReturnRate);
  const [inflationRate, setInflationRate] = useState(initialInflationRate);
  const [customExpenses, setCustomExpenses] = useState<Record<string, typeof initialCustomExpenses>>({});
  const [expandedProvinces, setExpandedProvinces] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleProvince = (province: string) => {
    setExpandedProvinces(prev =>
      prev.includes(province) ? prev.filter(p => p !== province) : [...prev, province]
    );
  };

  const handleCitySelection = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const handleProvinceSelection = (province: string) => {
    const provinceCities = citiesByProvince[province];
    const allSelected = provinceCities.every(city => selectedCities.includes(city));
    
    if (allSelected) {
      setSelectedCities(prev => prev.filter(city => !provinceCities.includes(city)));
    } else {
      setSelectedCities(prev => [...new Set([...prev, ...provinceCities])]);
    }
  };

  const removeSelectedCity = (city: string) => {
    setSelectedCities(prev => prev.filter(c => c !== city));
  };

  const filteredCitiesByProvince = useMemo(() => {
    return Object.entries(citiesByProvince).reduce((acc, [province, cities]) => {
      const filteredCities = cities.filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredCities.length > 0) {
        acc[province] = filteredCities;
      }
      return acc;
    }, {} as Record<string, string[]>);
  }, [searchTerm]);

  const calculateResults = useCallback(() => {
    setIsCalculating(true);
    setProgress(0);

    const worker = new Worker(new URL('../workers/cityCalculationWorker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event) => {
      if (event.data.type === 'progress') {
        setProgress(event.data.progress);
      } else if (event.data.type === 'result') {
        setResults(event.data.results);
        setIsCalculating(false);
      }
    };

    worker.postMessage({
      cities: selectedCities,
      savings,
      annualReturnRate,
      inflationRate,
      customExpenses,
    });
  }, [selectedCities, savings, annualReturnRate, inflationRate, customExpenses]);

  const handleExpenseChange = (city: string, expenseType: string, value: number) => {
    setCustomExpenses(prev => ({
      ...prev,
      [city]: {
        ...prev[city],
        [expenseType]: value
      }
    }));
  };

  const chartData = {
    labels: results.map(result => result.city),
    datasets: [
      {
        label: '可躺平天数',
        data: results.map(result => result.days),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '城市躺平天数比较',
      },
    },
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">城市比较</h2>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">选择要比较的城市：</h3>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="搜索城市..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border rounded-md"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <div className="max-h-60 overflow-y-auto mb-4">
            {Object.entries(filteredCitiesByProvince).map(([province, cities]) => (
              <div key={province} className="mb-2">
                <div
                  className="flex items-center cursor-pointer bg-gray-100 p-2 rounded"
                  onClick={() => toggleProvince(province)}
                >
                  {expandedProvinces.includes(province) ? (
                    <ChevronUp className="mr-2" size={20} />
                  ) : (
                    <ChevronDown className="mr-2" size={20} />
                  )}
                  <label className="font-semibold text-gray-700 flex items-center">
                    <input
                      type="checkbox"
                      checked={cities.every(city => selectedCities.includes(city))}
                      onChange={() => handleProvinceSelection(province)}
                      className="mr-2"
                    />
                    {province}
                  </label>
                </div>
                {expandedProvinces.includes(province) && (
                  <div className="ml-6 mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {cities.map(city => (
                      <label key={city} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCities.includes(city)}
                          onChange={() => handleCitySelection(city)}
                          className="mr-1"
                        />
                        <span className="text-sm">{city}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mb-4">
            <h4 className="font-semibold mb-2">已选择的城市：</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCities.map(city => (
                <span key={city} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                  {city}
                  <button onClick={() => removeSelectedCity(city)} className="ml-1 focus:outline-none">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">设置参数：</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">总储蓄</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={savings}
                  onChange={(e) => setSavings(Number(e.target.value))}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">年化收益率 (%)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={annualReturnRate * 100}
                  onChange={(e) => setAnnualReturnRate(Number(e.target.value) / 100)}
                  step="0.1"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">通胀率 (%)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={inflationRate * 100}
                  onChange={(e) => setInflationRate(Number(e.target.value) / 100)}
                  step="0.1"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={calculateResults}
            disabled={selectedCities.length === 0 || isCalculating}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
          >
            比较选中城市
          </button>
        </div>
      </div>

      {isCalculating ? (
        <LoadingAnimation progress={progress} />
      ) : (
        results.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xl font-bold mb-2">比较结果：</h3>
            <div className="mb-4">
              <Bar data={chartData} options={chartOptions} />
            </div>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              <p className="font-bold">提示：</p>
              <p>您可以点击下方表格中的费用数值来自定义每个城市的具体支出。修改后，点击"重新计算"按钮更新结果。</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">城市</th>
                    <th className="border p-2">可躺平天数</th>
                    <th className="border p-2">住房支出</th>
                    <th className="border p-2">食品支出</th>
                    <th className="border p-2">娱乐支出</th>
                    <th className="border p-2">其他支出</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.city}>
                      <td className="border p-2">{result.city}</td>
                      <td className="border p-2">{result.days}</td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={customExpenses[result.city]?.housing ?? result.costOfLivingData.housingExpenses}
                          onChange={(e) => handleExpenseChange(result.city, 'housing', Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={customExpenses[result.city]?.food ?? result.costOfLivingData.foodExpenses}
                          onChange={(e) => handleExpenseChange(result.city, 'food', Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={customExpenses[result.city]?.entertainment ?? result.costOfLivingData.entertainmentExpenses}
                          onChange={(e) => handleExpenseChange(result.city, 'entertainment', Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={customExpenses[result.city]?.other ?? 0}
                          onChange={(e) => handleExpenseChange(result.city, 'other', Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={calculateResults}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              >
                重新计算
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default CityComparison;