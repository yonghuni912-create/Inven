import Link from 'next/link'

export default function ReportsPage() {
  const reportCategories = [
    {
      title: '긴급발주 리포트',
      description: 'Emergency Order KPI',
      href: '/admin/reports/emergency',
      icon: '⚠️',
      color: 'orange',
    },
    {
      title: '불용재고 리포트',
      description: 'Deadstock Risk Analysis',
      href: '/admin/reports/deadstock',
      icon: '🗑️',
      color: 'red',
    },
    {
      title: '마진 분석',
      description: 'Margin Analysis',
      href: '/admin/reports/margin',
      icon: '💰',
      color: 'green',
    },
    {
      title: 'ABC 분석',
      description: 'ABC Classification',
      href: '/admin/reports/abc',
      icon: '📊',
      color: 'purple',
    },
    {
      title: '재고 현황',
      description: 'Inventory Status',
      href: '/admin/reports/inventory',
      icon: '📦',
      color: 'blue',
    },
    {
      title: '발주 추천',
      description: 'Replenishment Recommendations',
      href: '/admin/reports/replenishment',
      icon: '📈',
      color: 'indigo',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">분석 리포트 및 KPI 대시보드</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="block bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 border-2 border-transparent hover:border-primary-500"
          >
            <div className="flex items-start">
              <div className={`text-4xl mr-4 bg-${report.color}-100 p-3 rounded-lg`}>
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {report.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {report.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Schedule</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <p className="font-medium text-gray-900">Daily Analytics</p>
              <p className="text-sm text-gray-500">Updated daily at scheduled time per region</p>
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              Automated
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <p className="font-medium text-gray-900">Deadstock Analysis</p>
              <p className="text-sm text-gray-500">D-150 expiry risk calculation</p>
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
              Automated
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Custom Reports</p>
              <p className="text-sm text-gray-500">Export CSV with custom filters</p>
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
              On-Demand
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
