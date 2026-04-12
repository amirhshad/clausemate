import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  FileText,
  AlertTriangle,
  Calendar,
  DollarSign,
  Building,
  RefreshCw,
  Clock,
  Upload,
  X,
  Plus,
  CheckCircle,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { getContract, getContracts, addContractFiles, deleteContractFile } from '../lib/api'
import ContractQA from '../components/ContractQA'
import SkillsPanel from '../components/SkillsPanel'
import type { Contract, ContractParty, ContractRisk, UploadFile, DocumentType, MergeSummary, AddFilesResponse } from '../types'
import { DOCUMENT_TYPE_OPTIONS } from '../types'

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [contract, setContract] = useState<Contract | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedContractId, setSelectedContractId] = useState<string>(id || '')
  const [showAddFiles, setShowAddFiles] = useState(false)
  const [newFiles, setNewFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [mergeSummary, setMergeSummary] = useState<MergeSummary | null>(null)

  useEffect(() => {
    loadContracts()
  }, [])

  useEffect(() => {
    if (selectedContractId) {
      loadContract(selectedContractId)
    }
  }, [selectedContractId])

  const loadContracts = async () => {
    try {
      const data = await getContracts()
      setContracts(data)
      if (!id && data.length > 0) {
        setSelectedContractId(data[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts')
    }
  }

  const loadContract = async (contractId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getContract(contractId)
      setContract(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  const maxFiles = 5
  const existingFileCount = contract?.files?.length || 0
  const remainingSlots = maxFiles - existingFileCount

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
    addNewFiles(droppedFiles)
  }, [newFiles, remainingSlots])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter(f => f.type === 'application/pdf')
      addNewFiles(selected)
      e.target.value = ''
    }
  }

  const addNewFiles = (incoming: File[]) => {
    const available = remainingSlots - newFiles.length
    const toAdd = incoming.slice(0, Math.max(0, available))
    const newUploads: UploadFile[] = toAdd.map((file) => {
      const name = file.name.toLowerCase()
      let docType: DocumentType = 'other'
      if (name.includes('sow') || name.includes('statement of work')) docType = 'sow'
      else if (name.includes('terms') || name.includes('conditions')) docType = 'terms_conditions'
      else if (name.includes('amendment')) docType = 'amendment'
      else if (name.includes('addendum')) docType = 'addendum'
      else if (name.includes('exhibit')) docType = 'exhibit'
      else if (name.includes('schedule')) docType = 'schedule'
      return { file, document_type: docType, label: file.name.replace('.pdf', '') }
    })
    setNewFiles(prev => [...prev, ...newUploads])
  }

  const removeFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateFileType = (index: number, docType: DocumentType) => {
    setNewFiles(prev => prev.map((f, i) => i === index ? { ...f, document_type: docType } : f))
  }

  const [expandedParties, setExpandedParties] = useState(false)
  const [expandedTerms, setExpandedTerms] = useState(false)
  const [expandedRisks, setExpandedRisks] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  const handleDeleteFile = async (fileId: string) => {
    if (!contract) return
    if (!window.confirm('Remove this document from the contract?')) return
    setDeletingFileId(fileId)
    try {
      await deleteContractFile(contract.id, fileId)
      setContract({
        ...contract,
        files: contract.files?.filter(f => f.id !== fileId)
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete file')
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleAddFiles = async () => {
    if (!contract || newFiles.length === 0) return
    setUploading(true)
    setUploadError(null)
    setMergeSummary(null)
    try {
      const result: AddFilesResponse = await addContractFiles(contract.id, newFiles)
      setMergeSummary(result.merge_summary)
      setContract(result)
      setNewFiles([])
      setTimeout(() => {
        setShowAddFiles(false)
        setMergeSummary(null)
      }, 3000)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to add files')
    } finally {
      setUploading(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Not specified'
    return new Date(date).toLocaleDateString()
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not specified'
    return `$${amount.toLocaleString()}`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const parties: ContractParty[] = contract?.parties || []
  const risks: ContractRisk[] = contract?.risks || []
  const keyTerms: string[] = contract?.key_terms || []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/contracts"
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contract Details</h1>
            <p className="text-gray-600">View parties, key terms, and risks</p>
          </div>
        </div>
      </div>

      {/* Contract Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Contract
        </label>
        <select
          value={selectedContractId}
          onChange={(e) => {
            setSelectedContractId(e.target.value)
            navigate(`/contracts/${e.target.value}/analysis`, { replace: true })
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Choose a contract...</option>
          {contracts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.contract_nickname || c.provider_name}
            </option>
          ))}
        </select>
      </div>

      {loading && selectedContractId && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {contract && !loading && (
        <>
          {/* Contract Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building className="w-6 h-6 text-primary-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {contract.contract_nickname || contract.provider_name}
                </h2>
                {contract.contract_nickname && (
                  <p className="text-sm text-gray-500">{contract.provider_name}</p>
                )}
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                {contract.contract_type || 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Monthly Cost</p>
                  <p className="font-medium">{formatCurrency(contract.monthly_cost)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(contract.start_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(contract.end_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Auto-Renewal</p>
                  <p className="font-medium">{contract.auto_renewal ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {contract.cancellation_notice_days && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{contract.cancellation_notice_days} days cancellation notice required</span>
              </div>
            )}
          </div>

          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parties */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Parties</h3>
                <span className="ml-auto text-sm text-gray-500">{parties.length}</span>
              </div>

              {parties.length === 0 ? (
                <p className="text-gray-500 text-sm">No parties extracted. Re-upload the contract to extract party information.</p>
              ) : (
                <>
                  <div className="relative">
                    <div className={`space-y-3 overflow-hidden ${expandedParties ? '' : 'max-h-48'}`}>
                      {parties.map((party, index) => (
                        <div key={index} className="border-l-2 border-primary-200 pl-3 py-1">
                          <p className="font-medium text-gray-900">{party.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{party.role}</p>
                        </div>
                      ))}
                    </div>
                    {!expandedParties && parties.length > 3 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                  </div>
                  {parties.length > 3 && (
                    <button
                      onClick={() => setExpandedParties(!expandedParties)}
                      className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {expandedParties ? (
                        <><ChevronUp className="w-4 h-4" /> Show less</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Show all {parties.length} parties</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Key Terms */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Key Terms</h3>
                <span className="ml-auto text-sm text-gray-500">{keyTerms.length}</span>
              </div>

              {keyTerms.length === 0 ? (
                <p className="text-gray-500 text-sm">No key terms extracted.</p>
              ) : (
                <>
                  <div className="relative">
                    <ul className={`space-y-2 overflow-hidden ${expandedTerms ? '' : 'max-h-48'}`}>
                      {keyTerms.map((term, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700">{term}</span>
                        </li>
                      ))}
                    </ul>
                    {!expandedTerms && keyTerms.length > 5 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                  </div>
                  {keyTerms.length > 5 && (
                    <button
                      onClick={() => setExpandedTerms(!expandedTerms)}
                      className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {expandedTerms ? (
                        <><ChevronUp className="w-4 h-4" /> Show less</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Show all {keyTerms.length} terms</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Risks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">Risks</h3>
                <span className="ml-auto text-sm text-gray-500">{risks.length}</span>
              </div>

              {risks.length === 0 ? (
                <p className="text-gray-500 text-sm">No risks identified. Re-upload the contract to analyze risks.</p>
              ) : (
                <>
                  <div className="relative">
                    <div className={`space-y-3 overflow-hidden ${expandedRisks ? '' : 'max-h-48'}`}>
                      {risks.map((risk, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md border ${getSeverityColor(risk.severity)}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{risk.title}</p>
                            <span className="text-xs uppercase font-semibold">{risk.severity}</span>
                          </div>
                          <p className="text-xs">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                    {!expandedRisks && risks.length > 1 && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}
                  </div>
                  {risks.length > 1 && (
                    <button
                      onClick={() => setExpandedRisks(!expandedRisks)}
                      className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {expandedRisks ? (
                        <><ChevronUp className="w-4 h-4" /> Show less</>
                      ) : (
                        <><ChevronDown className="w-4 h-4" /> Show all {risks.length} risks</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Documents</h3>
              <span className="ml-auto text-sm text-gray-500">
                {contract.files?.length || 0} files
              </span>
              {remainingSlots > 0 && (
                <button
                  onClick={() => setShowAddFiles(true)}
                  className="ml-2 flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Documents
                </button>
              )}
            </div>

            {contract.files && contract.files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {contract.files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md group">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.file_name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {file.document_type?.replace('_', ' ')}
                        {file.label && file.label !== file.file_name && ` - ${file.label}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deletingFileId === file.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Remove document"
                    >
                      {deletingFileId === file.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
            )}
          </div>

          {/* Add Documents Modal */}
          {showAddFiles && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Add Documents to {contract.contract_nickname || contract.provider_name}</h3>
                  <button onClick={() => { setShowAddFiles(false); setNewFiles([]); setUploadError(null); setMergeSummary(null) }} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {mergeSummary && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                        <CheckCircle className="w-5 h-5" />
                        Documents added successfully
                      </div>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>{mergeSummary.files_added} file(s) uploaded</li>
                        {mergeSummary.parties_added > 0 && <li>{mergeSummary.parties_added} new party/parties found</li>}
                        {mergeSummary.terms_added > 0 && <li>{mergeSummary.terms_added} new key term(s) found</li>}
                        {mergeSummary.risks_added > 0 && <li>{mergeSummary.risks_added} new risk(s) identified</li>}
                        {mergeSummary.fields_updated.length > 0 && <li>Updated: {mergeSummary.fields_updated.join(', ')}</li>}
                        {mergeSummary.escalated && <li>Enhanced analysis with {mergeSummary.escalation_model}</li>}
                      </ul>
                    </div>
                  )}

                  {!mergeSummary && (
                    <>
                      <div
                        onDrop={handleFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                        onClick={() => document.getElementById('add-files-input')?.click()}
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">Drop PDFs here or click to browse</p>
                        <p className="text-xs text-gray-500 mt-1">Up to {remainingSlots - newFiles.length} more file(s) allowed</p>
                        <input
                          id="add-files-input"
                          type="file"
                          accept=".pdf"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </div>

                      {newFiles.length > 0 && (
                        <div className="space-y-2">
                          {newFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-900 truncate flex-1">{f.file.name}</span>
                              <select
                                value={f.document_type}
                                onChange={(e) => updateFileType(i, e.target.value as DocumentType)}
                                className="text-xs border border-gray-200 rounded px-2 py-1"
                              >
                                {DOCUMENT_TYPE_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded">
                                <X className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
                          {uploadError}
                        </div>
                      )}

                      <button
                        onClick={handleAddFiles}
                        disabled={newFiles.length === 0 || uploading}
                        className="w-full py-2 px-4 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Analyzing & merging...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Upload & Analyze ({newFiles.length} file{newFiles.length !== 1 ? 's' : ''})
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Skills */}
          <SkillsPanel contractId={contract.id} />

          {/* Q&A Section */}
          <ContractQA contractId={contract.id} />
        </>
      )}

      {!selectedContractId && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Contract</h3>
          <p className="text-gray-600">
            Choose a contract from the dropdown above to view its analysis.
          </p>
        </div>
      )}
    </div>
  )
}
