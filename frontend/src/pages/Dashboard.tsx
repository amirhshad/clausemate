import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useContracts } from '../hooks/useContracts'
import { getRecommendations, generateRecommendations } from '../lib/api'
import type { Recommendation } from '../types'
import RecommendationCard from '../components/RecommendationCard'
import PortfolioSkillsPanel from '../components/PortfolioSkillsPanel'
import SpendingCharts from '../components/SpendingCharts'
import EmptyState from '../components/EmptyState'

export default function Dashboard() {
  const { contracts, summary, loading, error } = useContracts()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [generatingRecs, setGeneratingRecs] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      setLoadingRecs(true)
      const recs = await getRecommendations()
      setRecommendations(recs)
    } catch {
      // Recommendations might not exist yet
    } finally {
      setLoadingRecs(false)
    }
  }

  const handleGenerateRecommendations = async () => {
    try {
      setGeneratingRecs(true)
      const recs = await generateRecommendations()
      setRecommendations(recs)
    } catch (err) {
      console.error('Failed to generate recommendations:', err)
    } finally {
      setGeneratingRecs(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Contracts',
      value: summary?.total_contracts ?? 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      label: 'Monthly Spend',
      value: `$${(summary?.total_monthly_spend ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      label: 'Expiring Soon',
      value: summary?.expiring_soon ?? 0,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Auto-Renewal',
      value: summary?.auto_renewal_count ?? 0,
      icon: RefreshCw,
      color: 'bg-purple-500',
    },
  ]

  const pendingRecs = recommendations.filter((r) => r.status === 'pending' || r.status === 'viewed')
  const highPriorityRecs = pendingRecs.filter((r) => r.priority === 'high')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your contracts and recommendations</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Upload Contract
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center space-x-3">
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Spending Charts */}
      {contracts.length > 0 && <SpendingCharts contracts={contracts} />}

      {/* Empty State */}
      {contracts.length === 0 && <EmptyState type="dashboard" />}

      {/* Portfolio AI Skills */}
      {contracts.length > 0 && <PortfolioSkillsPanel />}

      {/* Recommendations Section */}
      {contracts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
              {highPriorityRecs.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                  {highPriorityRecs.length} high priority
                </span>
              )}
            </div>
            <button
              onClick={handleGenerateRecommendations}
              disabled={generatingRecs}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {generatingRecs ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </button>
          </div>

          {loadingRecs ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : pendingRecs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No recommendations yet. Click "Generate" to analyze your contracts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRecs.slice(0, 5).map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  contracts={contracts}
                  onUpdate={loadRecommendations}
                />
              ))}
              {pendingRecs.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{pendingRecs.length - 5} more recommendations
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Contracts */}
      {contracts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Contracts</h2>
            <Link to="/contracts" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {contracts.slice(0, 5).map((contract) => (
              <div key={contract.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {contract.contract_nickname || contract.provider_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {contract.contract_nickname ? contract.provider_name : contract.contract_type || 'Unknown type'}
                    {contract.monthly_cost && ` • $${contract.monthly_cost}/mo`}
                  </p>
                </div>
                {contract.end_date && (
                  <span className="text-sm text-gray-500">
                    Expires: {new Date(contract.end_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
