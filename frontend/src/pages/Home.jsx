import { useNavigate } from 'react-router-dom'
import { useVehicleCheck } from '../hooks/useVehicleCheck.js'
import SearchBar from '../components/SearchBar.jsx'
import { CheckCircle } from 'lucide-react'

const FEATURES = [
  'Full MOT history with pass/fail breakdown',
  'Mileage anomaly detection (clocking alerts)',
  'Salvage & auction record search',
  'Tax and MOT status',
  'Keeper change indicators via V5C date',
  'Risk score and flag summary',
]

export default function Home() {
  const navigate = useNavigate()
  const { loading, error, check } = useVehicleCheck()

  async function handleSearch(input) {
    const data = await check(input)
    if (data) {
      navigate(`/report/${encodeURIComponent(data.registration || input)}`, { state: { report: data } })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            VehicleCheck UK
          </h1>
          <p className="text-blue-200 text-lg mt-3 max-w-md mx-auto">
            Free UK car history check — MOT records, mileage analysis, salvage search and more.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} loading={loading} />
        <p className="text-blue-300 text-lg mt-3">
          Currently restricted to 10 searches per hour so that I don't get in trouble with the DVLA's tech team.
        </p>

        {error && (
          <div className="mt-4 max-w-md w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Feature list */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg text-left">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-blue-100 text-sm">
              <CheckCircle size={15} className="text-yellow-300 flex-shrink-0 mt-0.5" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Personal note */}
      <div className="bg-blue-950 px-6 py-6 text-center space-y-3">
        <p className="text-blue-300 text-sm max-w-2xl mx-auto leading-relaxed">
          This is a personal project I built to help me shop for my first car since I cannot afford paid
          services like HPI and CarVertical. I hope you find it useful for your car shopping journey!
          This project is not associated with the DVLA, HPI or CarVertical in any way. It has been built
          with the assistance of Generative AI and is entirely designed to report the data from the free
          DVLA Vehicle Data and MOT History APIs in an easily readable and accessible fashion.
        </p>
        <p className="text-blue-500 text-xs">
          Uses DVLA, DVSA, and NHTSA public APIs. Not affiliated with HPI, CarVertical, or DVLA.
        </p>
        <p className="text-blue-400 text-sm">
          Made with love in 🐝⚡️💜 Manchester 🐝⚡️💜
        </p>
      </div>
    </div>
  )
}
