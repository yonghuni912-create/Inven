'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function InventoryTransferPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<Array<{ location_id: number; name: string; location_type: string }>>([])
  const [skus, setSKUs] = useState<Array<{ sku_id: number; sku_code: string; name: string }>>([])
  const [formData, setFormData] = useState({
    from_location_id: '',
    to_location_id: '',
    sku_id: '',
    qty: '',
    reason: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/locations').then(res => res.json()),
      fetch('/api/admin/skus').then(res => res.json()),
    ]).then(([locData, skuData]) => {
      setLocations(locData || [])
      setSKUs(skuData || [])
    }).catch(() => {
      setLocations([])
      setSKUs([])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.from_location_id === formData.to_location_id) {
      alert('출발지와 도착지가 같습니다.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          from_location_id: parseInt(formData.from_location_id),
          to_location_id: parseInt(formData.to_location_id),
          sku_id: parseInt(formData.sku_id),
          qty: parseInt(formData.qty),
        }),
      })
      if (res.ok) {
        router.push('/admin/inventory')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.message || '이동 실패')
      }
    } catch (error) {
      alert('재고 이동 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">재고 이동</h1>
          <p className="mt-2 text-gray-600">창고/위치 간 재고 이동</p>
        </div>
        <Link href="/admin/inventory" className="text-gray-600 hover:text-gray-900">
          ← 목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">출발 위치 *</label>
            <select
              required
              value={formData.from_location_id}
              onChange={(e) => setFormData({ ...formData, from_location_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">위치 선택...</option>
              {locations.map(l => (
                <option key={l.location_id} value={l.location_id}>
                  {l.name} ({l.location_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">도착 위치 *</label>
            <select
              required
              value={formData.to_location_id}
              onChange={(e) => setFormData({ ...formData, to_location_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">위치 선택...</option>
              {locations.map(l => (
                <option key={l.location_id} value={l.location_id}>
                  {l.name} ({l.location_type})
                </option>
              ))}
            </select>
          </div>

          <div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">수량 *</label>
            <input
              type="number"
              min="1"
              required
              value={formData.qty}
              onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="0"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              placeholder="이동 사유를 입력하세요..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/inventory" className="px-4 py-2 text-gray-700 hover:text-gray-900">취소</Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '이동 중...' : '재고 이동'}
          </button>
        </div>
      </form>
    </div>
  )
}
