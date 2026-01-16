'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewStorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<Array<{ region_id: number; name: string }>>([])
  const [formData, setFormData] = useState({
    region_id: '',
    store_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Canada',
    shopify_customer_id: '',
    store_code: '',
    match_address_key: '',
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
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, region_id: parseInt(formData.region_id) }),
      })
      if (res.ok) {
        router.push('/admin/stores')
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
          <h1 className="text-3xl font-bold text-gray-900">새 가맹점 추가</h1>
          <p className="mt-2 text-gray-600">가맹점 정보 및 매칭 설정</p>
        </div>
        <Link href="/admin/stores" className="text-gray-600 hover:text-gray-900">
          ← 목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">가맹점 이름 *</label>
            <input
              type="text"
              required
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Store Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">매장 코드</label>
            <input
              type="text"
              value={formData.store_code}
              onChange={(e) => setFormData({ ...formData, store_code: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="VAN001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shopify 고객 ID</label>
            <input
              type="text"
              value={formData.shopify_customer_id}
              onChange={(e) => setFormData({ ...formData, shopify_customer_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="1234567890"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">주소 1</label>
            <input
              type="text"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">주소 2</label>
            <input
              type="text"
              value={formData.address_line2}
              onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">도시</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Vancouver"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주/도</label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="BC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">우편번호</label>
            <input
              type="text"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="V6B 1A1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">국가</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/stores" className="px-4 py-2 text-gray-700 hover:text-gray-900">취소</Link>
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
