'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewRoutePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<Array<{ region_id: number; name: string }>>([])
  const [formData, setFormData] = useState({
    region_id: '',
    name: '',
    active_days: 'Mon,Wed,Fri',
    cutoff_time: '14:00',
    active: true,
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
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, region_id: parseInt(formData.region_id) }),
      })
      if (res.ok) {
        router.push('/admin/routes')
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
          <h1 className="text-3xl font-bold text-gray-900">새 배송 코스 추가</h1>
          <p className="mt-2 text-gray-600">배송 그룹 및 스케줄 설정</p>
        </div>
        <Link href="/admin/routes" className="text-gray-600 hover:text-gray-900">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">코스 이름 *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="A 코스"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">활성 요일</label>
            <input
              type="text"
              value={formData.active_days}
              onChange={(e) => setFormData({ ...formData, active_days: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Mon,Wed,Fri"
            />
            <p className="text-xs text-gray-500 mt-1">예: Mon,Tue,Wed,Thu,Fri</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">마감 시간</label>
            <input
              type="time"
              value={formData.cutoff_time}
              onChange={(e) => setFormData({ ...formData, cutoff_time: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
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

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link href="/admin/routes" className="px-4 py-2 text-gray-700 hover:text-gray-900">취소</Link>
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
