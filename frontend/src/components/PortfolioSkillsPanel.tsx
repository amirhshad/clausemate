import { useState, useEffect } from 'react'
import {
  PieChart, AlertOctagon, ClipboardCheck, Sparkles, Loader2
} from 'lucide-react'
import { runPortfolioSkill, getPortfolioAnalyses } from '../lib/api'
import type { ContractAnalysis } from '../types'
import AnalysisResultCard from './AnalysisResultCard'

const PORTFOLIO_SKILLS = [
  { type: 'portfolio_insights', label: 'Portfolio Insights', icon: PieChart, desc: 'Spending trends & overlaps' },
  { type: 'anomaly_detection', label: 'Anomaly Detection', icon: AlertOctagon, desc: 'Flag pricing outliers' },
  { type: 'compliance_check', label: 'Compliance Check', icon: ClipboardCheck, desc: 'Check against rules' },
] as const

export default function PortfolioSkillsPanel() {
  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    try {
      const data = await getPortfolioAnalyses()
      setAnalyses(data)
    } catch {
      // Silently fail
    }
  }

  const runSkill = async (skillType: string) => {
    setLoading(skillType)
    setError(null)
    try {
      const result = await runPortfolioSkill(skillType)
      setAnalyses(prev => [result, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900">Portfolio AI Skills</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-6">
        {PORTFOLIO_SKILLS.map(skill => (
          <button
            key={skill.type}
            onClick={() => runSkill(skill.type)}
            disabled={loading !== null}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === skill.type ? (
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
            ) : (
              <skill.icon className="w-5 h-5 text-gray-500" />
            )}
            <span className="text-xs font-medium text-gray-700">{skill.label}</span>
          </button>
        ))}
      </div>

      {analyses.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-3">Previous Analyses ({analyses.length})</h4>
          <div className="space-y-2">
            {analyses.map(a => (
              <AnalysisResultCard key={a.id} analysis={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
