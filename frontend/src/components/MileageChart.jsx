import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ResponsiveContainer, Legend
} from 'recharts'
import { formatDate, formatMileage } from '../utils/formatters.js'
import { format, parseISO } from 'date-fns'

const ANOMALY_COLOURS = {
  MILEAGE_DROP: '#dc2626',
  MILEAGE_PLATEAU: '#d97706',
  HIGH_ANNUAL_MILEAGE: '#7c3aed',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800">{formatDate(d.date)}</p>
      <p className="text-blue-600">{formatMileage(d.mileage)}</p>
      <p className={d.mot_result === 'PASSED' ? 'text-green-600' : 'text-red-600'}>
        MOT: {d.mot_result}
      </p>
    </div>
  )
}

export default function MileageChart({ records, anomalies, estimatedMileage }) {
  if (!records || records.length < 2) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mileage History</h2>
        <p className="text-gray-500 text-sm">Not enough data to display mileage chart.</p>
      </div>
    )
  }

  const data = records.map(r => ({
    date: r.date,
    mileage: r.mileage,
    mot_result: r.mot_result,
    label: format(parseISO(r.date), 'MMM yy'),
  }))

  // Build anomaly dot positions
  const anomalyDots = []
  for (const a of anomalies || []) {
    if (a.date_to && a.mileage_to != null) {
      anomalyDots.push({
        date: a.date_to,
        mileage: a.mileage_to,
        type: a.anomaly_type,
        colour: ANOMALY_COLOURS[a.anomaly_type] || '#6b7280',
        label: a.anomaly_type.replace(/_/g, ' '),
      })
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Mileage History</h2>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-red-600 inline-block rounded" />
            Mileage Drop
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-amber-500 inline-block rounded" />
            Plateau
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-violet-600 inline-block rounded" />
            High Rate
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="mileage"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3, fill: '#2563eb' }}
            activeDot={{ r: 5 }}
          />
          {anomalyDots.map((dot, i) => {
            const matchingPoint = data.find(d => d.date === dot.date)
            if (!matchingPoint) return null
            return (
              <ReferenceDot
                key={i}
                x={matchingPoint.label}
                y={dot.mileage}
                r={6}
                fill={dot.colour}
                stroke="white"
                strokeWidth={2}
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>

      {anomalies && anomalies.length > 0 && (
        <div className="mt-4 space-y-2">
          {anomalies.map((a, i) => (
            <div
              key={i}
              className={`text-xs p-2 rounded-lg ${
                a.anomaly_type === 'MILEAGE_DROP'
                  ? 'bg-red-50 text-red-700 border border-red-100'
                  : a.anomaly_type === 'MILEAGE_PLATEAU'
                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                  : 'bg-violet-50 text-violet-700 border border-violet-100'
              }`}
            >
              {a.explanation}
            </div>
          ))}
        </div>
      )}

      {estimatedMileage && (
        <p className="text-xs text-gray-500 mt-3 text-right">
          Estimated current mileage: <strong className="text-gray-700">{formatMileage(estimatedMileage)}</strong>
        </p>
      )}
    </div>
  )
}
