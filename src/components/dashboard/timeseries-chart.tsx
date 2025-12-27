'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeseriesChartProps {
  title: string;
  description?: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color: string;
}

export default function TimeseriesChart({ title, description, data, dataKey, xAxisKey, color }: TimeseriesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey={xAxisKey}
                tickFormatter={(value) => format(new Date(value), 'MMM d', { locale: es })}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
