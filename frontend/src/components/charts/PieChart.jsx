import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Reusable Pie Chart component
 */
export default function PieChart({ data, nameKey, valueKey, title, height = 300 }) {
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
                <RechartsPieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={valueKey}
                        nameKey={nameKey}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
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
                </RechartsPieChart>
            </ResponsiveContainer>
        </div>
    );
}
