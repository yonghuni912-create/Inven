'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewSKUPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    sku_code: '',
    name: '',
    pack_size: 1,
    moq: 1,
    lead_time_days: 0,
    safety_stock_days: 0,
    expiry_managed: false,
    abc_grade: '',
    active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/skus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        router.push('/admin/skus')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.message || '저장 실패')
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">새 SKU 추가</h1>
          <p className="mt-2 text-gray-600">품목 마스터 및 재고 정책 설정</p>
        </div>
        <Link href="/admin/skus" className="text-gray-600 hover:text-gray-900">
          ← 목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU 코드 *</label>
            <input
              type="text"
              required
              value={formData.sku_code}
              onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="SKU-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">품목명 *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="제품 이름"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">팩 사이즈</label>
            <input
              type="number"
              min="1"
              value={formData.pack_size}
              onChange={(e) => setFormData({ ...formData, pack_size: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소 주문 수량 (MOQ)</label>
            <input
              type="number"
              min="1"
              value={formData.moq}
              onChange={(e) => setFormData({ ...formData, moq: parseInt(e.target.value) || 1 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">리드 타임 (일)</label>
            <input
              type="number"
              min="0"
              value={formData.lead_time_days}
              onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">안전 재고 (일)</label>
            <input
              type="number"
              min="0"
              value={formData.safety_stock_days}
              onChange={(e) => setFormData({ ...formData, safety_stock_days: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ABC 등급</label>
            <select
              value={formData.abc_grade}
              onChange={(e) => setFormData({ ...formData, abc_grade: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">미지정</option>
              <option value="A">A (상위 20%)</option>
              <option value="B">B (중위 30%)</option>
              <option value="C">C (하위 50%)</option>
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="expiry_managed"
                checked={formData.expiry_managed}
                onChange={(e) => setFormData({ ...formData, expiry_managed: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="expiry_managed" className="text-sm font-medium text-gray-700">유통기한 관리</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">활성화</label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/skus" className="px-4 py-2 text-gray-700 hover:text-gray-900">취소</Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
