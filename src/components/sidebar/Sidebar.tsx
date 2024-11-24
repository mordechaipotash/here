'use client'

import { useQuery } from '@tanstack/react-query'
import { LoadingState } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error'
import { createSupabaseClient } from '@/lib/supabase'
import { getTrackCounts } from '@/services/emailViewService'

interface SidebarProps {
  onTrackSelect: (track: string | null) => void
  selectedTrack: string | null
}

export function Sidebar({ onTrackSelect, selectedTrack }: SidebarProps) {
  const { data: trackCounts = [], isLoading, error } = useQuery({
    queryKey: ['trackCounts'],
    queryFn: getTrackCounts
  })

  if (isLoading) return <LoadingState message="Loading tracks..." />
  if (error) return <ErrorMessage title="Error" message={(error as Error).message} />

  // Sort tracks to ensure wotc_machine and forms_admin are at the top
  const sortedTracks = [...trackCounts].sort((a, b) => {
    const priorityTracks = ['wotc_machine', 'forms_admin']
    const aIndex = priorityTracks.indexOf(a.track)
    const bIndex = priorityTracks.indexOf(b.track)
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    return a.track.localeCompare(b.track)
  })

  const totalCount = trackCounts.reduce((sum, { count }) => sum + count, 0)

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h2 className="text-lg font-semibold mb-4">Tracks</h2>
      <div className="space-y-2">
        <button
          onClick={() => onTrackSelect(null)}
          className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedTrack === null
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>All</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {totalCount}
            </span>
          </div>
        </button>
        
        {sortedTracks.map(({ track, count }) => (
          <button
            key={track}
            onClick={() => onTrackSelect(track)}
            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTrack === track
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{track}</span>
              <span 
                className={`${
                  selectedTrack === track
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                } px-2 py-0.5 rounded-full text-xs`}
              >
                {count}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
