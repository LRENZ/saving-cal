import React from 'react';
import { MapPin } from 'lucide-react';
import citiesByProvince from '../data/citiesByProvince';

interface CitySelectorProps {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({ selectedCity, setSelectedCity }) => {
  return (
    <div className="flex flex-col">
      <label htmlFor="city-select" className="mb-2 font-semibold text-gray-700 flex items-center">
        <MapPin className="mr-2" size={20} />
        选择城市
      </label>
      <select
        id="city-select"
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.target.value)}
        className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">选择一个城市</option>
        {Object.entries(citiesByProvince).map(([province, cities]) => (
          <optgroup key={province} label={province}>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
};

export default CitySelector;