import { useState } from 'react'
import { MessageSquare, Send, Loader2, Quote } from 'lucide-react'
import { queryContract, type ContractQueryResponse } from '../lib/api'

interface ContractQAProps {
  contractId: string
}

export default function ContractQA({ contractId }: ContractQAProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<ContractQueryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !contractId) return

    setLoading(true)
    setError(null)

    try {
      const result = await queryContract(contractId, question)
      setAnswer(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer')
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    "What is the cancellation policy?",
    "What are the auto-renewal terms?",
    "What happens when the contract expires?",
    "What are the penalties for early termination?",
    "What is the payment schedule?"
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary-600" />
        <h3 className="font-semibold text-gray-900">Ask About This Contract</h3>
      </div>

      {/* Question Input */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this contract..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Ask
          </button>
        </div>
      </form>

      {/* Suggested Questions */}
      {!answer && !loading && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuestion(q)}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {/* Answer */}
      {answer && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Answer</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{answer.answer}</p>
          </div>

          {/* Citations */}
          {answer.citations && answer.citations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Quote className="w-4 h-4" />
                Citations from contract:
              </h4>
              <ul className="space-y-2">
                {answer.citations.map((citation, i) => {
                  const text = typeof citation === 'string' ? citation : citation.text
                  const page = typeof citation === 'string' ? null : citation.page
                  return (
                    <li key={i} className="text-sm text-gray-600 bg-yellow-50 border border-yellow-100 rounded px-3 py-2 flex justify-between items-start gap-2">
                      <span>"{text}"</span>
                      {page && (
                        <span className="text-xs font-medium text-gray-500 bg-yellow-100 px-2 py-0.5 rounded whitespace-nowrap">
                          Page {page}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Ask another question */}
          <button
            onClick={() => {
              setAnswer(null)
              setQuestion('')
            }}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Ask another question →
          </button>
        </div>
      )}
    </div>
  )
}
