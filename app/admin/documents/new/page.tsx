'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewDocumentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<Array<{ region_id: number; name: string }>>([])
  const [formData, setFormData] = useState({
    region_id: '',
    doc_type: 'PICKING_LIST',
    doc_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetch('/api/admin/regions')
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(() => setRegions([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region_id: parseInt(formData.region_id),
          doc_type: formData.doc_type,
          doc_date: formData.doc_date,
        }),
      })
      if (res.ok) {
        router.push('/admin/documents')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.message || '문서 생성 실패')
      }
    } catch (error) {
      alert('문서 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">새 문서 생성</h1>
          <p className="mt-2 text-gray-600">피킹리스트 / PO Draft 수동 생성</p>
        </div>
        <Link href="/admin/documents" className="text-gray-600 hover:text-gray-900">
          ← 목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지역 *</label>
            <select
              required
              value={formData.region_id}
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">지역 선택...</option>
              {regions.map(r => (
                <option key={r.region_id} value={r.region_id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문서 유형 *</label>
            <select
              required
              value={formData.doc_type}
              onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="PICKING_LIST">피킹리스트 (Picking List)</option>
              <option value="PO_DRAFT">발주서 초안 (PO Draft)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문서 날짜 *</label>
            <input
              type="date"
              required
              value={formData.doc_date}
              onChange={(e) => setFormData({ ...formData, doc_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900">문서 유형 안내</h3>
          <ul className="mt-2 text-sm text-blue-800 space-y-1">
            <li><span className="font-semibold">피킹리스트:</span> 당일 주문 기준 출고 작업 목록</li>
            <li><span className="font-semibold">발주서 초안:</span> ROP 기반 발주 추천 목록</li>
          </ul>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/documents" className="px-4 py-2 text-gray-700 hover:text-gray-900">취소</Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '생성 중...' : '문서 생성'}
          </button>
        </div>
      </form>
    </div>
  )
}
