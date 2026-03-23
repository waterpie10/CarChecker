import { useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useVehicleCheck } from '../hooks/useVehicleCheck.js'
import SearchBar from '../components/SearchBar.jsx'
import ReportHeader from '../components/ReportHeader.jsx'
import StatusCards from '../components/StatusCards.jsx'
import MileageChart from '../components/MileageChart.jsx'
import MotHistory from '../components/MotHistory.jsx'
import DefectsSummary from '../components/DefectsSummary.jsx'
import SalvageSection from '../components/SalvageSection.jsx'
import RiskFlags from '../components/RiskFlags.jsx'
import DataSources from '../components/DataSources.jsx'
import { ArrowLeft } from 'lucide-react'

export default function Report() {
  const { registration } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { report, loading, error, check } = useVehicleCheck()

  // Use pre-fetched report from navigation state, or re-fetch
  const displayReport = location.state?.report || report

  useEffect(() => {
    if (!location.state?.report && registration) {
      check(decodeURIComponent(registration))
    }
  }, [registration])

  function handleNewSearch(input) {
    navigate(`/report/${encodeURIComponent(input.toUpperCase())}`, { replace: true, state: {} })
    check(input)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-blue-900 px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center gap-4 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="text-blue-200 hover:text-white flex items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            New check
          </button>
          <div className="flex-1 max-w-md">
            <SearchBar
              key={registration}
              initialValue={decodeURIComponent(registration || '')}
              onSearch={handleNewSearch}
              loading={loading}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Checking vehicle records...</p>
            <p className="text-sm text-gray-400">This may take a few seconds while we query multiple databases.</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
            <p className="text-red-700 font-semibold">Could not retrieve vehicle data</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Report */}
        {!loading && displayReport && (
          <>
            <ReportHeader report={displayReport} />
            <StatusCards report={displayReport} />
            <RiskFlags flags={displayReport.risk_flags} score={displayReport.risk_score} />
            <MileageChart
              records={displayReport.mileage_records}
              anomalies={displayReport.mileage_anomalies}
              estimatedMileage={displayReport.estimated_current_mileage}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <MotHistory report={displayReport} />
              <DefectsSummary report={displayReport} />
            </div>
            <SalvageSection report={displayReport} />
            <DataSources report={displayReport} />
          </>
        )}
      </div>
    </div>
  )
}
