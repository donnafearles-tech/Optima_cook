'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';
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
  
  if (!tasks || tasks.length === 0 || !tasks.every(t => typeof t.es === 'number' && typeof t.ef === 'number')) {
    return (
        <div className="text-center text-muted-foreground p-8">
            No hay datos de cronograma para mostrar. Por favor, calcula la Ruta Óptima primero.
        </div>
    )
  }
  
  const data = tasks.map(task => ({
    name: task.name,
    range: [task.es, task.ef],
    isCritical: task.isCritical,
  })).sort((a,b) => (a.range[0] ?? 0) - (b.range[0] ?? 0));

  const yAxisWidth = Math.max(...data.map(d => d.name.length)) * 7 + 30;

  const primaryColor = 'hsl(var(--primary))';
  const accentColor = 'hsl(var(--accent))';

  return (
    <div style={{ width: '100%', height: Math.max(200, 50 * data.length) }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          barCategoryGap="35%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" unit="s" domain={['dataMin', 'dataMax']} />
          <YAxis dataKey="name" type="category" width={yAxisWidth} interval={0} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted) / 0.5)'}} />
          <Bar dataKey="range" radius={[4, 4, 4, 4]}>
            <LabelList 
                dataKey="name" 
                position="insideLeft"
                offset={10}
                fill="#fff"
                className="text-xs font-bold"
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isCritical ? primaryColor : accentColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
