import React from 'react';
import { DollarSign } from 'lucide-react';

interface SavingsInputProps {
  savings: number;
  setSavings: (savings: number) => void;
}

const SavingsInput: React.FC<SavingsInputProps> = ({ savings, setSavings }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setSavings(Number(value));
  };

  return (
    <div className="flex flex-col">
      <label htmlFor="savings-input" className="mb-2 font-semibold text-gray-700 flex items-center">
        <DollarSign className="mr-2" size={20} />
        您的总储蓄
      </label>
      <input
        id="savings-input"
        type="text"
        value={formatCurrency(savings)}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        placeholder="输入您的储蓄金额"
      />
    </div>
  );
};

export default SavingsInput;