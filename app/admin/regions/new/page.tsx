'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewRegionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'America/Vancouver',
    run_days: 'Mon,Tue,Wed,Thu,Fri',
    analytics_time: '06:00',
    docs_time: '07:00',
    shop_domain: '',
    admin_token: '',
    webhook_secret: '',
    store_match_method: 'CUSTOMER',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        router.push('/admin/regions')
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
          <h1 className="text-3xl font-bold text-gray-900">새 지역 추가</h1>
          <p className="mt-2 text-gray-600">Shopify 연결 및 지역 설정</p>
        </div>
        <Link
          href="/admin/regions"
          className="text-gray-600 hover:text-gray-900"
        >
          ← 목록으로
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              지역 이름 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Vancouver"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              타임존 *
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="America/Vancouver">America/Vancouver (PST)</option>
              <option value="America/Toronto">America/Toronto (EST)</option>
              <option value="Asia/Seoul">Asia/Seoul (KST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shopify 도메인 *
            </label>
            <input
              type="text"
              required
              value={formData.shop_domain}
              onChange={(e) => setFormData({ ...formData, shop_domain: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="your-store.myshopify.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              매장 매칭 방식
            </label>
            <select
              value={formData.store_match_method}
              onChange={(e) => setFormData({ ...formData, store_match_method: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="CUSTOMER">고객 ID 매칭</option>
              <option value="ADDRESS">주소 매칭</option>
              <option value="TAG">태그 매칭</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              운영 요일
            </label>
            <input
              type="text"
              value={formData.run_days}
              onChange={(e) => setFormData({ ...formData, run_days: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Mon,Tue,Wed,Thu,Fri"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              분석 실행 시간
            </label>
            <input
              type="time"
              value={formData.analytics_time}
              onChange={(e) => setFormData({ ...formData, analytics_time: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shopify Admin API 토큰 *
            </label>
            <input
              type="password"
              required
              value={formData.admin_token}
              onChange={(e) => setFormData({ ...formData, admin_token: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="shpat_..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook Secret *
            </label>
            <input
              type="password"
              required
              value={formData.webhook_secret}
              onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            href="/admin/regions"
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            취소
          </Link>
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
