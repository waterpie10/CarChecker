import { X, Info } from 'lucide-react'

const SECTIONS = [
  {
    title: 'How to interpret this report',
    content: `This report pulls together data from multiple government sources to give you a picture of a vehicle's history. It is not a definitive verdict — it is a starting point. Read through every section yourself, look for patterns, and use it alongside a physical inspection and a test drive. A high risk score does not automatically mean avoid; a clean score does not mean the car is perfect. Use your judgement.`,
  },
  {
    title: 'How the risk score is calculated',
    content: `The score starts at 100 and points are deducted for specific red flags: a mileage drop (−30, strong clocking indicator), appearance in a salvage auction (−20), mileage plateau (−15), dangerous defects ever recorded (up to −20), marked for export (−10), recurring advisories (up to −15), a low MOT pass rate (−5), and a recently issued V5C logbook (−5 to −10, which can indicate a recent keeper change). The final number gives you a rough sense of how much history warrants closer scrutiny — not a pass/fail grade.`,
  },
  {
    title: 'How estimated mileage is calculated',
    content: `The app takes the first and last odometer readings from the MOT history, works out the average daily mileage over that period, and extrapolates forward to today. It is an estimate only — the vehicle may have been used very differently since its last MOT. Treat it as a rough sanity check against the number on the dashboard, not as a precise figure.`,
  },
  {
    title: 'Past issues do not define the present',
    content: `A vehicle with a long MOT history full of advisories and a few failures is not necessarily a bad car today. It may have been thoroughly repaired and well maintained since then. Advisories in particular are just observations by the tester — many are minor wear items entirely normal for a vehicle's age. What matters is the overall pattern: were issues dealt with promptly? Are the same problems recurring year after year? Is the mileage consistent?`,
  },
  {
    title: 'What this app cannot tell you',
    content: `This app does not have access to outstanding finance records, confirmed insurance write-off categories (Cat S/N/A/B), police stolen registers, or foreign vehicle history. For a fully comprehensive check before a large purchase, consider supplementing this with a paid HPI or similar report.`,
  },
  {
    title: 'Do not blindly trust this app',
    content: `Regardless of what scores, flags, or MOT items appear here, you are encouraged to read through the results and form your own conclusions. If something looks off, ask questions, seek a second opinion, and never feel pressured into a purchase.`,
  },
]

function SectionList() {
  return (
    <div className="space-y-5">
      {SECTIONS.map((s, i) => (
        <div key={i}>
          <h3 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">{s.title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{s.content}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Sidebar (desktop) ─────────────────────────────────────────────────── */
export function InfoSidebar() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <Info size={15} className="text-blue-600 flex-shrink-0" />
        <h2 className="text-sm font-bold text-gray-800">How to read this report</h2>
      </div>
      <SectionList />
      <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
        Not affiliated with DVLA, HPI, or CarVertical.
      </p>
    </div>
  )
}

/* ── Modal (mobile / small screens) ───────────────────────────────────── */
export default function InfoPanel({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">How to read this report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <SectionList />
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400 text-center">
            Not affiliated with DVLA, HPI, or CarVertical.
          </p>
        </div>
      </div>
    </div>
  )
}
