export type ContractType =
  | 'insurance'
  | 'utility'
  | 'subscription'
  | 'rental'
  | 'saas'
  | 'service'
  | 'other'

export type PaymentFrequency =
  | 'monthly'
  | 'annual'
  | 'quarterly'
  | 'one-time'
  | 'other'

// Document types for multi-document contracts
export type DocumentType =
  | 'main_agreement'
  | 'sow'
  | 'terms_conditions'
  | 'amendment'
  | 'addendum'
  | 'exhibit'
  | 'schedule'
  | 'other'

// Contract file record (from contract_files table)
export interface ContractFile {
  id: string
  contract_id: string
  file_path: string
  file_name: string
  file_size_bytes: number | null
  mime_type: string
  document_type: DocumentType
  label: string | null
  display_order: number
  created_at: string
}

// File for upload (before saving)
export interface UploadFile {
  file: File
  document_type: DocumentType
  label: string
}

// Party in a contract
export interface ContractParty {
  name: string
  role: string
}

// Risk severity levels
export type RiskSeverity = 'high' | 'medium' | 'low'

// Risk identified in contract
export interface ContractRisk {
  title: string
  description: string
  severity: RiskSeverity
}

export interface Contract {
  id: string
  user_id: string
  provider_name: string
  contract_nickname: string | null
  contract_type: ContractType | null
  monthly_cost: number | null
  annual_cost: number | null
  currency: string
  payment_frequency: PaymentFrequency | null
  start_date: string | null
  end_date: string | null
  auto_renewal: boolean
  cancellation_notice_days: number | null
  key_terms: string[]
  parties: ContractParty[]
  risks: ContractRisk[]
  file_path: string | null
  file_name: string | null
  extraction_confidence: number | null
  user_verified: boolean
  created_at: string
  updated_at: string
  // Multi-document support
  files?: ContractFile[]
  file_count?: number
}

export interface MergeSummary {
  files_added: number
  parties_added: number
  terms_added: number
  risks_added: number
  fields_updated: string[]
  escalated: boolean
  escalation_model: string | null
}

export interface AddFilesResponse extends Contract {
  merge_summary: MergeSummary
}

export interface ContractSummary {
  total_contracts: number
  total_monthly_spend: number
  total_annual_spend: number
  contracts_by_type: Record<string, number>
  expiring_soon: number
  auto_renewal_count: number
}

// Document analyzed by Claude
export interface DocumentAnalyzed {
  filename: string
  document_type: string
  summary: string
}

// Complexity level for smart routing
export type ComplexityLevel = 'low' | 'medium' | 'high'

export interface ExtractionResult {
  provider_name: string | null
  contract_nickname: string | null
  contract_type: string | null
  monthly_cost: number | null
  annual_cost: number | null
  currency: string
  payment_frequency: string | null
  start_date: string | null
  end_date: string | null
  auto_renewal: boolean | null
  cancellation_notice_days: number | null
  key_terms: string[]
  parties: ContractParty[]
  risks: ContractRisk[]
  confidence: number
  // Complexity assessment for smart routing
  complexity?: ComplexityLevel
  complexity_reasons?: string[]
  // Multi-document support
  file_names?: string[]
  documents_analyzed?: DocumentAnalyzed[]
  // Smart routing info
  escalated?: boolean
  escalation_model?: string
  // RAG support
  full_text?: string
}

export type RecommendationType =
  | 'cost_reduction'
  | 'consolidation'
  | 'risk_alert'
  | 'renewal_reminder'

export type Priority = 'high' | 'medium' | 'low'

export type RecommendationStatus = 'pending' | 'viewed' | 'accepted' | 'dismissed'

export interface Recommendation {
  id: string
  user_id: string
  contract_id: string | null
  type: RecommendationType
  title: string
  description: string
  estimated_savings: number | null
  priority: Priority
  status: RecommendationStatus
  reasoning: string | null
  confidence: number | null
  created_at: string
  acted_on_at: string | null
}

// Document type options for UI
export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'main_agreement', label: 'Main Agreement' },
  { value: 'sow', label: 'Statement of Work (SOW)' },
  { value: 'terms_conditions', label: 'Terms & Conditions' },
  { value: 'amendment', label: 'Amendment' },
  { value: 'addendum', label: 'Addendum' },
  { value: 'exhibit', label: 'Exhibit' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'other', label: 'Other' },
]

// Currency options for UI
export const CURRENCY_OPTIONS: { value: string; label: string; symbol: string }[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
]

// Helper to get currency symbol
export const getCurrencySymbol = (currency: string): string => {
  const found = CURRENCY_OPTIONS.find((c) => c.value === currency)
  return found?.symbol || '$'
}

// AI Skills
export type SkillType =
  | 'language_detection'
  | 'financial_modeling'
  | 'contract_comparison'
  | 'negotiation_coach'
  | 'portfolio_insights'
  | 'anomaly_detection'
  | 'compliance_check'
  | 'contract_summarization'

export interface ContractAnalysis {
  id: string
  contract_id: string | null
  user_id: string
  skill_type: SkillType
  result: Record<string, unknown>
  model_used: string | null
  created_at: string
}
