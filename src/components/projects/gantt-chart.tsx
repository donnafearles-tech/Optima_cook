'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import type { Task } from '@/lib/types';
import { useTheme } from 'next-themes';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const duration = data.range[1] - data.range[0];
    return (
      <Card>
        <CardContent className="p-3">
          <p className="font-bold">{label}</p>
          <p className="text-sm">Inicio: {data.range[0]}s</p>
          <p className="text-sm">Fin: {data.range[1]}s</p>
          <p className="text-sm">Duración: {duration}s</p>
          {data.isCritical && <p className="text-sm text-primary font-bold">Tarea Crítica</p>}
        </CardContent>
      </Card>
    );
  }
  return null;
};

export default function GanttChart({ tasks }: { tasks: Task[] }) {
  const { resolvedTheme } = useTheme();
  
  const data = tasks.map(task => ({
    name: task.name,
    range: [task.es, task.ef],
    isCritical: task.isCritical,
  })).sort((a,b) => a.range[0] - b.range[0]);

  const yAxisWidth = Math.max(...data.map(d => d.name.length)) * 6 + 20;

  return (
    <div style={{ width: '100%', height: 60 * data.length }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" unit="s" domain={['dataMin', 'dataMax + 100']} />
          <YAxis dataKey="name" type="category" width={yAxisWidth} interval={0} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="range" fill={resolvedTheme === 'dark' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}>
            {data.map((entry, index) => (
               <Bar
                key={`bar-${index}`}
                dataKey="range"
                fill={entry.isCritical ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
                shape={<rect />} // This is needed to apply fill per bar
              />
            ))}
             <LabelList 
                dataKey="name" 
                position="insideLeft" 
                content={(props:any) => {
                    const { x, y, width, height, value } = props;
                    return (
                        <text 
                            x={x + 10} 
                            y={y + height / 2} 
                            fill={resolvedTheme === 'dark' ? '#fff' : '#000'} 
                            textAnchor="start" 
                            dominantBaseline="middle"
                            className="text-xs font-semibold"
                        >
                            {value}
                        </text>
                    );
                }} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
