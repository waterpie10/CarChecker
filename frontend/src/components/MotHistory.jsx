import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, formatMileage, formatPassRate } from '../utils/formatters.js'

const DEFECT_COLOURS = {
  ADVISORY: 'text-amber-700 bg-amber-50',
  MINOR: 'text-orange-700 bg-orange-50',
  MAJOR: 'text-red-700 bg-red-50',
  DANGEROUS: 'text-red-900 bg-red-100 font-semibold',
}

function MotTestRow({ test }) {
  const [open, setOpen] = useState(false)
  const passed = test.test_result === 'PASSED'

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {passed
            ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            : <XCircle size={18} className="text-red-500 flex-shrink-0" />}
          <div>
            <span className={`font-semibold text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
              {test.test_result}
            </span>
            <span className="text-gray-500 text-sm ml-2">{formatDate(test.completed_date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {test.odometer_value != null && (
            <span>{formatMileage(test.odometer_value)}</span>
          )}
          {test.defects?.length > 0 && (
            <span className="badge-gray">{test.defects.length} item{test.defects.length !== 1 ? 's' : ''}</span>
          )}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50 space-y-1.5">
          {test.mot_test_number && (
            <p className="text-xs text-gray-400 pt-2 font-mono">Test #{test.mot_test_number}</p>
          )}
          {test.expiry_date && (
            <p className="text-xs text-gray-500">Certificate valid until: {formatDate(test.expiry_date)}</p>
          )}
          {test.defects?.length === 0 && (
            <p className="text-xs text-gray-400 pt-2">No defects recorded.</p>
          )}
          {test.defects?.map((d, i) => (
            <div key={i} className={`text-xs px-2 py-1.5 rounded ${DEFECT_COLOURS[d.type] || 'text-gray-600 bg-gray-50'}`}>
              <span className="font-semibold mr-1">[{d.type}]</span>
              {d.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MotHistory({ report }) {
  const tests = [...(report.mot_tests || [])].reverse() // newest first

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">MOT History</h2>
        <div className="flex gap-3 text-sm text-gray-500">
          <span>{report.total_mot_tests} test{report.total_mot_tests !== 1 ? 's' : ''}</span>
          <span className={`font-semibold ${report.pass_rate >= 60 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPassRate(report.pass_rate)} pass rate
          </span>
        </div>
      </div>

      {tests.length === 0 ? (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">
          No MOT history found — vehicle may be new or exempt from testing.
        </p>
      ) : (
        <div className="space-y-2">
          {tests.map((test, i) => (
            <MotTestRow key={i} test={test} />
          ))}
        </div>
      )}
    </div>
  )
}
