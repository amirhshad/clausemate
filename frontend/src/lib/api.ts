import { supabase } from './supabase'
import type { Contract, ContractSummary, ContractFile, ExtractionResult, Recommendation, UploadFile, AddFilesResponse } from '../types'

const API_URL = import.meta.env.VITE_API_URL || ''

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
  }
}

// Contracts API
export async function getContracts(): Promise<Contract[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/contracts`, { headers })
  if (!res.ok) throw new Error('Failed to fetch contracts')
  return res.json()
}

export async function getContract(id: string): Promise<Contract> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/contracts/${id}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch contract')
  return res.json()
}

export async function getContractFiles(contractId: string): Promise<ContractFile[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/contracts/${contractId}/files`, { headers })
  if (!res.ok) throw new Error('Failed to fetch contract files')
  return res.json()
}

export async function getContractSummary(): Promise<ContractSummary> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/contracts/summary`, { headers })
  if (!res.ok) throw new Error('Failed to fetch summary')
  return res.json()
}

export async function updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/contracts/${id}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update contract')
  return res.json()
}

export async function deleteContract(id: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/contracts/${id}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error('Failed to delete contract')
}

export async function deleteContractFile(contractId: string, fileId: string): Promise<void> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/contracts/${contractId}/files/${fileId}`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error('Failed to delete file')
}

// Upload API - Multi-file support
export async function extractContracts(files: UploadFile[]): Promise<ExtractionResult> {
  const headers = await getAuthHeader()
  const formData = new FormData()

  // Add all files
  files.forEach((uploadFile, index) => {
    formData.append(`file_${index}`, uploadFile.file)
  })

  // Add metadata as JSON
  formData.append('files_metadata', JSON.stringify(
    files.map(f => ({
      filename: f.file.name,
      document_type: f.document_type,
      label: f.label
    }))
  ))

  const res = await fetch(`${API_URL}/api/upload/extract`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to extract contract')
  return res.json()
}

// Backward compatible single file extract
export async function extractContract(file: File): Promise<ExtractionResult> {
  return extractContracts([{ file, document_type: 'main_agreement', label: file.name }])
}

export async function confirmContracts(
  files: UploadFile[],
  data: Partial<ExtractionResult>
): Promise<Contract> {
  const headers = await getAuthHeader()
  const formData = new FormData()

  // Add all files
  files.forEach((uploadFile, index) => {
    formData.append(`file_${index}`, uploadFile.file)
  })

  // Add metadata as JSON
  formData.append('files_metadata', JSON.stringify(
    files.map(f => ({
      filename: f.file.name,
      document_type: f.document_type,
      label: f.label || f.file.name
    }))
  ))

  // Add full_text as form field (too large for URL params)
  if (data.full_text) {
    formData.append('full_text', data.full_text)
  }

  // Add extraction data as query params
  const params = new URLSearchParams()
  if (data.provider_name) params.append('provider_name', data.provider_name)
  if (data.contract_nickname) params.append('contract_nickname', data.contract_nickname)
  if (data.contract_type) params.append('contract_type', data.contract_type)
  if (data.monthly_cost) params.append('monthly_cost', String(data.monthly_cost))
  if (data.annual_cost) params.append('annual_cost', String(data.annual_cost))
  if (data.currency) params.append('currency', data.currency)
  if (data.start_date) params.append('start_date', data.start_date)
  if (data.end_date) params.append('end_date', data.end_date)
  if (data.auto_renewal !== undefined) params.append('auto_renewal', String(data.auto_renewal))
  if (data.cancellation_notice_days) params.append('cancellation_notice_days', String(data.cancellation_notice_days))
  if (data.key_terms && data.key_terms.length > 0) params.append('key_terms', JSON.stringify(data.key_terms))
  if (data.parties && data.parties.length > 0) params.append('parties', JSON.stringify(data.parties))
  if (data.risks && data.risks.length > 0) params.append('risks', JSON.stringify(data.risks))

  const res = await fetch(`${API_URL}/api/upload/confirm?${params}`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) throw new Error('Failed to save contract')
  return res.json()
}

// Backward compatible single file confirm
export async function confirmContract(
  file: File,
  data: Partial<ExtractionResult>
): Promise<Contract> {
  return confirmContracts([{ file, document_type: 'main_agreement', label: file.name }], data)
}

export async function addContractFiles(
  contractId: string,
  files: UploadFile[]
): Promise<AddFilesResponse> {
  const headers = await getAuthHeader()
  const formData = new FormData()

  files.forEach((uploadFile, index) => {
    formData.append(`file_${index}`, uploadFile.file)
  })

  formData.append('files_metadata', JSON.stringify(
    files.map(f => ({
      filename: f.file.name,
      document_type: f.document_type,
      label: f.label || f.file.name
    }))
  ))

  const res = await fetch(`${API_URL}/api/contracts/${contractId}/add-files`, {
    method: 'POST',
    headers,
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to add files' }))
    throw new Error(err.detail || 'Failed to add files')
  }
  return res.json()
}

// Recommendations API
export async function getRecommendations(): Promise<Recommendation[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/recommendations`, { headers })
  if (!res.ok) throw new Error('Failed to fetch recommendations')
  return res.json()
}

export async function generateRecommendations(): Promise<Recommendation[]> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/recommendations/generate`, {
    method: 'POST',
    headers,
  })
  if (!res.ok) throw new Error('Failed to generate recommendations')
  return res.json()
}

export async function updateRecommendation(
  id: string,
  status: 'accepted' | 'dismissed'
): Promise<Recommendation> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/recommendations/${id}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update recommendation')
  return res.json()
}

// Contract Q&A API
export interface ContractCitation {
  text: string
  page?: number | null
}

export interface ContractQueryResponse {
  answer: string
  citations: (ContractCitation | string)[]
}

export async function queryContract(
  contractId: string,
  question: string
): Promise<ContractQueryResponse> {
  const headers = await getAuthHeader()
  const res = await fetch(`${API_URL}/api/contracts/${contractId}/query`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!res.ok) throw new Error('Failed to query contract')
  return res.json()
}
