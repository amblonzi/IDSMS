import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Reusable Line Chart component
 */
export default function LineChart({ data, xKey, yKey, title, color = "#3b82f6", height = 300 }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
            </div>
        );
    }

    return (
        <div className="w-full">
            {title && <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>}
            <ResponsiveContainer width="100%" height={height}>
                <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey={xKey}
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line
                        type="monotone"
                        dataKey={yKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ fill: color, r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </RechartsLineChart>
            </ResponsiveContainer>
        </div>
    );
}
