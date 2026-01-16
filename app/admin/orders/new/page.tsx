'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<Array<{ region_id: number; name: string }>>([])
  const [stores, setStores] = useState<Array<{ store_id: number; store_name: string; region_id: number }>>([])
  const [skus, setSKUs] = useState<Array<{ sku_id: number; sku_code: string; name: string }>>([])
  const [formData, setFormData] = useState({
    region_id: '',
    store_id: '',
    order_type: 'REGULAR',
    order_lines: [{ sku_id: '', qty: 1 }],
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/regions').then(res => res.json()),
      fetch('/api/admin/stores').then(res => res.json()),
      fetch('/api/admin/skus').then(res => res.json()),
    ]).then(([regionData, storeData, skuData]) => {
      setRegions(regionData || [])
      setStores(storeData || [])
      setSKUs(skuData || [])
    }).catch(() => {})
  }, [])

  const filteredStores = formData.region_id 
    ? stores.filter(s => s.region_id === parseInt(formData.region_id))
    : stores

  const addLine = () => {
    setFormData({
      ...formData,
      order_lines: [...formData.order_lines, { sku_id: '', qty: 1 }]
    })
  }

  const removeLine = (index: number) => {
    setFormData({
      ...formData,
      order_lines: formData.order_lines.filter((_, i) => i !== index)
    })
  }

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...formData.order_lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setFormData({ ...formData, order_lines: newLines })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          region_id: parseInt(formData.region_id),
          store_id: formData.store_id ? parseInt(formData.store_id) : null,
          order_lines: formData.order_lines.map(l => ({
            sku_id: parseInt(l.sku_id),
            qty: parseInt(l.qty.toString())
          })).filter(l => l.sku_id && l.qty > 0)
        }),
      })
      if (res.ok) {
        router.push('/admin/orders')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.message || '저장 실패')
      }
    } catch (error) {
      alert('주문 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">새 주문 생성</h1>
          <p className="mt-2 text-gray-600">수동 주문 입력</p>
        </div>
        <Link href="/admin/orders" className="text-gray-600 hover:text-gray-900">
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
              onChange={(e) => setFormData({ ...formData, region_id: e.target.value, store_id: '' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">지역 선택...</option>
              {regions.map(r => (
                <option key={r.region_id} value={r.region_id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">가맹점</label>
            <select
              value={formData.store_id}
              onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">가맹점 선택... (미매칭)</option>
              {filteredStores.map(s => (
                <option key={s.store_id} value={s.store_id}>{s.store_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주문 유형 *</label>
            <select
              required
              value={formData.order_type}
              onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="REGULAR">REGULAR (정기)</option>
              <option value="EMERGENCY">EMERGENCY (긴급)</option>
              <option value="EXTRA">EXTRA (추가)</option>
            </select>
          </div>
        </div>

        {/* Order Lines */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">주문 항목</h3>
            <button
              type="button"
              onClick={addLine}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              + 항목 추가
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.order_lines.map((line, index) => (
              <div key={index} className="flex gap-4 items-center">
                <div className="flex-1">
                  <select
                    required
                    value={line.sku_id}
                    onChange={(e) => updateLine(index, 'sku_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">SKU 선택...</option>
                    {skus.map(s => (
                      <option key={s.sku_id} value={s.sku_id}>{s.sku_code} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="1"
                    required
                    value={line.qty}
                    onChange={(e) => updateLine(index, 'qty', parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="수량"
                  />
                </div>
                {formData.order_lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/orders" className="px-4 py-2 text-gray-700 hover:text-gray-900">취소</Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '생성 중...' : '주문 생성'}
          </button>
        </div>
      </form>
    </div>
  )
}
