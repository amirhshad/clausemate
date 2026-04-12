import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { ContractAnalysis } from '../types'

export default function AnalysisResultCard({ analysis }: { analysis: ContractAnalysis }) {
  const [expanded, setExpanded] = useState(false)
  const r = analysis.result as Record<string, any>

  const renderResult = () => {
    switch (analysis.skill_type) {
      case 'clause_classification':
        return (
          <div className="space-y-2">
            {(r.clauses || []).map((c: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 whitespace-nowrap">{c.category}</span>
                <span className="text-gray-700">{c.text}</span>
                {c.article_ref && <span className="text-xs text-gray-400 whitespace-nowrap">{c.article_ref}</span>}
              </div>
            ))}
          </div>
        )

      case 'language_detection':
        return (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Detected: {r.detected_language} ({r.language_code})</p>
            <div className="space-y-3">
              {(r.sections || []).map((s: any, i: number) => (
                <div key={i} className="grid grid-cols-2 gap-3 text-sm border-b border-gray-100 pb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Original {s.section_ref && `(${s.section_ref})`}</p>
                    <p className="text-gray-600">{s.original_text}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">English</p>
                    <p className="text-gray-900">{s.english_translation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'obligation_extraction':
        return (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Your Obligations ({(r.your_obligations || []).length})</h4>
              <div className="space-y-2">
                {(r.your_obligations || []).map((o: any, i: number) => (
                  <div key={i} className="text-sm border-l-2 border-amber-400 pl-3 py-1">
                    <p className="text-gray-700">{o.description}</p>
                    {o.deadline && <p className="text-xs text-gray-400 mt-0.5">Deadline: {o.deadline}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Provider Obligations ({(r.provider_obligations || []).length})</h4>
              <div className="space-y-2">
                {(r.provider_obligations || []).map((o: any, i: number) => (
                  <div key={i} className="text-sm border-l-2 border-primary-400 pl-3 py-1">
                    <p className="text-gray-700">{o.description}</p>
                    {o.deadline && <p className="text-xs text-gray-400 mt-0.5">Deadline: {o.deadline}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'financial_modeling':
        return (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Base Annual</p>
                <p className="text-lg font-bold">{r.currency} {r.base_annual_cost?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Lifetime Cost</p>
                <p className="text-lg font-bold text-primary-600">{r.currency} {r.total_lifetime_cost?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Escalation</p>
                <p className="text-sm font-medium">{r.escalation_type?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{r.escalation_details}</p>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b"><th className="pb-2">Year</th><th className="pb-2">Cost</th><th className="pb-2">Increase</th></tr></thead>
              <tbody>
                {(r.yearly_projections || []).map((y: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-1.5">{y.year}</td>
                    <td className="py-1.5 font-medium">{r.currency} {y.estimated_cost?.toLocaleString()}</td>
                    <td className="py-1.5 text-gray-500">{y.increase_pct > 0 ? `+${y.increase_pct}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'contract_comparison':
        return (
          <div>
            <div className="space-y-3 mb-4">
              {(r.comparison_dimensions || []).map((d: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 mb-1">{d.dimension}</p>
                  <div className="flex gap-4 text-sm">
                    {Object.entries(d.values || {}).map(([id, val]) => (
                      <span key={id} className={`${d.winner === id ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>
                        {String(val)}
                      </span>
                    ))}
                  </div>
                  {d.notes && <p className="text-xs text-gray-400 mt-1">{d.notes}</p>}
                </div>
              ))}
            </div>
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-sm font-medium text-primary-800">{r.recommendation}</p>
            </div>
          </div>
        )

      case 'negotiation_coach':
        return (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                r.overall_leverage === 'strong' ? 'bg-green-100 text-green-700' :
                r.overall_leverage === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {r.overall_leverage} leverage
              </span>
              <span className="text-sm text-gray-500">{r.leverage_reasoning}</span>
            </div>
            <div className="space-y-3">
              {(r.talking_points || []).map((tp: any, i: number) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">{tp.topic}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      tp.priority === 'high' ? 'bg-red-100 text-red-700' :
                      tp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{tp.priority}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">Current: {tp.current_term}</p>
                  <p className="text-sm text-primary-700 font-medium mb-1">Ask for: {tp.suggested_position}</p>
                  <p className="text-xs text-gray-500">{tp.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'clause_risk_scoring':
        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-500">Overall Risk:</span>
              <span className={`text-lg font-bold ${
                (r.overall_risk_score || 0) >= 7 ? 'text-red-600' :
                (r.overall_risk_score || 0) >= 4 ? 'text-yellow-600' : 'text-green-600'
              }`}>{r.overall_risk_score}/10</span>
            </div>
            <div className="space-y-2">
              {(r.scored_clauses || []).map((c: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    c.risk_score >= 7 ? 'bg-red-500' : c.risk_score >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>{c.risk_score}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{c.clause_text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.risk_factors?.join(', ')}</p>
                    {c.mitigation_suggestion && (
                      <p className="text-xs text-primary-600 mt-0.5">Mitigation: {c.mitigation_suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'renewal_decision':
        return (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                r.recommendation === 'renew' ? 'bg-green-100 text-green-700' :
                r.recommendation === 'renegotiate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>{r.recommendation?.toUpperCase()}</span>
              <span className="text-sm text-gray-500">Confidence: {Math.round((r.confidence || 0) * 100)}%</span>
              {r.days_until_deadline != null && (
                <span className="text-sm text-gray-400">{r.days_until_deadline} days until deadline</span>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-3">{r.reasoning}</p>
            {(r.action_items || []).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">ACTION ITEMS</p>
                <ul className="space-y-1">
                  {r.action_items.map((a: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      case 'portfolio_insights':
        return (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Total Contracts</p>
                <p className="text-lg font-bold">{r.total_contracts}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Annual Spend</p>
                <p className="text-lg font-bold">${r.total_annual_spend?.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3">{r.spending_trends}</p>
            {(r.overlapping_coverages || []).length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">OVERLAPPING COVERAGES</p>
                {r.overlapping_coverages.map((o: any, i: number) => (
                  <div key={i} className="text-sm text-amber-700 bg-amber-50 rounded p-2 mb-1">{o.description}</div>
                ))}
              </div>
            )}
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary-500 mb-1">KEY INSIGHT</p>
              <p className="text-sm text-primary-800">{r.key_insight}</p>
            </div>
          </div>
        )

      case 'anomaly_detection':
        return (
          <div className="space-y-2">
            {(r.anomalies || []).length === 0 ? (
              <p className="text-sm text-green-600">No anomalies detected across your portfolio.</p>
            ) : (
              (r.anomalies || []).map((a: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  a.severity === 'high' ? 'bg-red-50 border-red-200' :
                  a.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{a.provider}</p>
                    <span className="text-xs uppercase font-semibold">{a.severity}</span>
                  </div>
                  <p className="text-sm text-gray-700">{a.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Benchmark: {a.benchmark}</p>
                </div>
              ))
            )}
          </div>
        )

      case 'compliance_check':
        return (
          <div>
            <div className={`px-3 py-2 rounded-lg mb-3 text-sm font-medium ${
              r.overall_compliance === 'compliant' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {r.overall_compliance === 'compliant' ? 'All rules passed' : 'Issues found'}
            </div>
            <div className="space-y-2">
              {(r.rules_checked || []).map((rule: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                    rule.status === 'pass' ? 'bg-green-500' : rule.status === 'fail' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>{rule.status === 'pass' ? '\u2713' : rule.status === 'fail' ? '\u2717' : '!'}</span>
                  <div>
                    <p className="font-medium text-gray-900">{rule.rule}</p>
                    <p className="text-xs text-gray-500">{rule.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'contract_summarization':
        return (
          <div>
            <p className="text-sm text-gray-700 mb-3">{r.summary}</p>
            {(r.key_points || []).length > 0 && (
              <ul className="space-y-1 mb-3">
                {r.key_points.map((p: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">TL;DR</p>
              <p className="text-sm font-medium text-gray-900">{r.plain_english_tldr}</p>
            </div>
          </div>
        )

      default:
        return <pre className="text-xs text-gray-500 overflow-auto">{JSON.stringify(r, null, 2)}</pre>
    }
  }

  const SKILL_LABELS: Record<string, string> = {
    clause_classification: 'Clause Classification',
    language_detection: 'Language & Translation',
    obligation_extraction: 'Obligations',
    financial_modeling: 'Cost Forecast',
    contract_comparison: 'Contract Comparison',
    negotiation_coach: 'Negotiation Coach',
    clause_risk_scoring: 'Clause Risk Scores',
    renewal_decision: 'Renewal Decision',
    portfolio_insights: 'Portfolio Insights',
    anomaly_detection: 'Anomaly Detection',
    compliance_check: 'Compliance Check',
    contract_summarization: 'Summary',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">
            {SKILL_LABELS[analysis.skill_type] || analysis.skill_type}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(analysis.created_at).toLocaleDateString()} {new Date(analysis.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {analysis.model_used && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{analysis.model_used}</span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {renderResult()}
        </div>
      )}
    </div>
  )
}
