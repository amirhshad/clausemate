import { useState, useEffect } from 'react'
import {
  Globe, ListChecks, TrendingUp, HeartHandshake, Shield,
  RotateCcw, FileText, Sparkles, Loader2, Tags
} from 'lucide-react'
import { runContractSkill, getContractAnalyses } from '../lib/api'
import type { ContractAnalysis } from '../types'
import AnalysisResultCard from './AnalysisResultCard'

const CONTRACT_SKILLS = [
  { type: 'clause_classification', label: 'Classify Clauses', icon: Tags, desc: 'Categorize clauses by type' },
  { type: 'language_detection', label: 'Translate', icon: Globe, desc: 'Detect language & translate' },
  { type: 'obligation_extraction', label: 'Obligations', icon: ListChecks, desc: 'Extract mutual obligations' },
  { type: 'financial_modeling', label: 'Cost Forecast', icon: TrendingUp, desc: 'Lifetime cost projection' },
  { type: 'negotiation_coach', label: 'Negotiate', icon: HeartHandshake, desc: 'Negotiation talking points' },
  { type: 'clause_risk_scoring', label: 'Risk Scores', icon: Shield, desc: 'Score clauses for risk' },
  { type: 'renewal_decision', label: 'Renewal', icon: RotateCcw, desc: 'Renew, renegotiate, or cancel' },
  { type: 'contract_summarization', label: 'Summarize', icon: FileText, desc: 'Plain-English summary' },
] as const

export default function SkillsPanel({ contractId }: { contractId: string }) {
  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [contractId])

  const loadAnalyses = async () => {
    try {
      const data = await getContractAnalyses(contractId)
      setAnalyses(data)
    } catch {
      // Silently fail on load - analyses may not exist yet
    }
  }

  const runSkill = async (skillType: string) => {
    setLoading(skillType)
    setError(null)
    try {
      const result = await runContractSkill(contractId, skillType)
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
        <h3 className="font-semibold text-gray-900">AI Skills</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {CONTRACT_SKILLS.map(skill => (
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
