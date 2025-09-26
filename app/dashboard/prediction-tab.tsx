"use client";

import { useState, useEffect, FC } from 'react';
import { Loader2, AlertTriangle, LineChart as ChartIcon } from 'lucide-react';

// --- Typescript Interfaces ---
interface DataPoint {
  name: string;
  Expenses?: number;
  'Predicted Expenses'?: number;
  'Prediction Range'?: [number, number];
}
interface ForecastData {
  historicalData: DataPoint[];
  forecastData: DataPoint[];
  maxValue: number;
}

// --- SVG Chart Component ---
const SvgChart: FC<{ data: DataPoint[], maxValue: number }> = ({ data, maxValue }) => {
    const width = 800;
    const height = 400;
    const padding = 60;

    const xScale = (index: number) => padding + (index * (width - 2 * padding)) / (data.length - 1);
    const yScale = (value: number) => height - padding - ((value / maxValue) * (height - 2 * padding));

    const linePath = (key: 'Expenses' | 'Predicted Expenses') => {
        let path = '';
        data.forEach((point, index) => {
            const value = point[key];
            if (value !== undefined) {
                const x = xScale(index);
                const y = yScale(value);
                if (path === '') path += `M ${x} ${y}`;
                else path += ` L ${x} ${y}`;
            }
        });
        return path;
    };
    
    // Path for the shaded prediction range area
    const areaPath = () => {
        let upperPath = '';
        let lowerPath = '';
        data.forEach((point, index) => {
            if (point['Prediction Range']) {
                const x = xScale(index);
                const yUpper = yScale(point['Prediction Range'][1]);
                const yLower = yScale(point['Prediction Range'][0]);
                if (upperPath === '') {
                    // Start the path from the last historical point for a smooth transition
                    const prevPoint = data[index - 1];
                    if (prevPoint && prevPoint.Expenses) {
                        const prevX = xScale(index - 1);
                        const prevY = yScale(prevPoint.Expenses);
                        upperPath += `M ${prevX} ${prevY} L ${x} ${yUpper}`;
                        lowerPath = `M ${x} ${yLower}`;
                    }
                } else {
                    upperPath += ` L ${x} ${yUpper}`;
                    lowerPath += ` L ${x} ${yLower}`;
                }
            }
        });
        // Combine the paths to create a closed shape
        const reversedLower = lowerPath.split(' ').slice(1).reverse().join(' ');
        return `${upperPath} L ${reversedLower} Z`;
    };

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="font-sans min-w-[700px]">
                {/* Y-Axis Grid Lines & Labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                    <g key={tick} className="text-gray-300">
                        <line stroke="currentColor" strokeDasharray="2,5" x1={padding} x2={width - padding} y1={yScale(tick * maxValue)} y2={yScale(tick * maxValue)} />
                        <text x={padding - 10} y={yScale(tick * maxValue)} dy="0.3em" textAnchor="end" className="text-xs fill-current text-gray-500">${(tick * maxValue).toLocaleString()}</text>
                    </g>
                ))}
                
                {/* X-Axis Labels */}
                {data.map((point, index) => ( <text key={index} x={xScale(index)} y={height - padding + 20} textAnchor="middle" className="text-xs fill-current text-gray-600">{point.name}</text> ))}

                {/* Shaded Prediction Range Area */}
                <path d={areaPath()} fill="#22c55e" fillOpacity="0.1" />

                {/* Data Lines */}
                <path d={linePath('Expenses')} fill="none" stroke="#4f46e5" strokeWidth="3" />
                <path d={linePath('Predicted Expenses')} fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="6,6" />

                {/* Data Points */}
                {data.map((point, index) => point.Expenses !== undefined && <circle key={`exp-${index}`} cx={xScale(index)} cy={yScale(point.Expenses)} r="5" fill="#4f46e5" /> )}
                {data.map((point, index) => point['Predicted Expenses'] !== undefined && <circle key={`pred-${index}`} cx={xScale(index)} cy={yScale(point['Predicted Expenses'])} r="5" fill="#22c55e" /> )}
            </svg>
            <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><div className="w-4 h-1 bg-[#4f46e5] rounded-full"/><span>Historical Expenses</span></div>
                <div className="flex items-center gap-2"><div style={{width: '1rem', borderTop: '3px dashed #22c55e'}}/><span>Forecast</span></div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 bg-opacity-10"/><span>Prediction Range</span></div>
            </div>
        </div>
    );
};


// --- Main Prediction Tab Component ---
const PredictionTab: FC = () => {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        setLoading(true); setError(null);
        const response = await fetch('/api/expense-forecast');
        if (!response.ok) throw new Error('Failed to fetch forecast data.');
        setData(await response.json());
      } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
      finally { setLoading(false); }
    }
    fetchForecast();
  }, []);

  if (loading) return ( <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500"/></div> );
  if (error) return ( <div className="bg-red-100 p-4 rounded-lg text-red-700">{error}</div> );

  const chartData = data ? [...data.historicalData, ...data.forecastData] : [];

  return (
    <div className="animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-center mb-6">
            <ChartIcon className="w-8 h-8 text-indigo-500 mr-3" />
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Monthly Expense Forecast</h2>
                <p className="text-gray-500">Based on a Linear Regression model of historical spending.</p>
            </div>
        </div>
        
        {chartData.length > 1 && data && <SvgChart data={chartData} maxValue={data.maxValue} />}
      </div>
    </div>
  );
};

export default PredictionTab;

