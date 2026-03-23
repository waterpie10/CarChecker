import { useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ onSearch, loading, initialValue = '' }) {
  const [input, setInput] = useState(initialValue)

  function handleSubmit(e) {
    e.preventDefault()
    const val = input.trim()
    if (val) onSearch(val)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="flex gap-2">
        <div className="relative flex-1">
          {/* UK plate styling */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <div className="h-full w-10 bg-blue-700 rounded-l-lg flex flex-col items-center justify-center gap-0.5 px-1">
              <span className="text-white text-[6px] font-bold tracking-widest">GB</span>
              <div className="w-5 h-3">
                <svg viewBox="0 0 20 12" className="w-full h-full">
                  <rect width="20" height="12" fill="#003399"/>
                  <rect x="8" width="4" height="12" fill="white"/>
                  <rect y="4" width="20" height="4" fill="white"/>
                  <rect x="8" width="4" height="12" fill="#CC0000"/>
                  <rect y="4" width="20" height="4" fill="#CC0000"/>
                </svg>
              </div>
            </div>
          </div>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="AB12 CDE or VIN"
            className="w-full pl-12 pr-4 py-4 text-xl font-bold tracking-widest uppercase bg-yellow-300 border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 placeholder:font-normal placeholder:tracking-normal placeholder:text-base"
            maxLength={17}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="characters"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-lg"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={20} />
          )}
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>
      <p className="text-center text-sm text-gray-500 mt-2">
        Enter a UK registration plate or 17-character VIN
      </p>
    </form>
  )
}
