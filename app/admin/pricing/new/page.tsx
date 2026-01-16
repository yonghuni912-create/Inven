'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPricePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [skus, setSKUs] = useState<Array<{ sku_id: number; sku_code: string; name: string }>>([])
  const [formData, setFormData] = useState({
    sku_id: '',
    price_type: 'OUR_COST',
    currency: 'CAD',
    unit_price: '',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
  })

  useEffect(() => {
    fetch('/api/admin/skus')
      .then(res => res.json())
      .then(data => setSKUs(data))
      .catch(() => setSKUs([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sku_id: parseInt(formData.sku_id),
          unit_price: parseFloat(formData.unit_price),
          effective_to: formData.effective_to || null,
        }),
      })
      if (res.ok) {
        router.push('/admin/pricing')
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

  const priceTypes = [
    { value: 'STC_COST', label: 'STC 구매가', desc: 'STC → Our' },
    { value: 'OUR_COST', label: 'Our 원가', desc: '우리 원가' },
    { value: 'OUR_SUPPLY', label: 'Our 공급가', desc: 'Our → Store' },
    { value: 'STORE_PRICE', label: 'Store 판매가', desc: '매장 판매가' },
    { value: 'KR_COST', label: 'Korea 원가', desc: '본사 원가' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">새 가격 추가</h1>
          <p className="mt-2 text-gray-600">다단계 가격 설정</p>
        </div>
        <Link href="/admin/pricing" className="text-gray-600 hover:text-gray-900">
          ← 목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <select
              required
              value={formData.sku_id}
              onChange={(e) => setFormData({ ...formData, sku_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">SKU 선택...</option>
              {skus.map(s => (
                <option key={s.sku_id} value={s.sku_id}>{s.sku_code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가격 유형 *</label>
            <select
              required
              value={formData.price_type}
              onChange={(e) => setFormData({ ...formData, price_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {priceTypes.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label} ({pt.desc})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">통화</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="CAD">CAD (캐나다 달러)</option>
              <option value="KRW">KRW (원화)</option>
              <option value="USD">USD (미국 달러)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">단가 *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">적용 시작일 *</label>
            <input
              type="date"
              required
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">적용 종료일</label>
            <input
              type="date"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">비워두면 무기한</p>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/pricing" className="px-4 py-2 text-gray-700 hover:text-gray-900">취소</Link>
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
