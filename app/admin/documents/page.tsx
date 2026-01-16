import { db } from '@/db'
import { documents, regions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getDocuments() {
  const docs = await db
    .select({
      document_id: documents.document_id,
      region_name: regions.name,
      document_type: documents.document_type,
      document_date: documents.document_date,
      file_name: documents.file_name,
      status: documents.status,
      generated_at_utc: documents.generated_at_utc,
    })
    .from(documents)
    .leftJoin(regions, eq(documents.region_id, regions.region_id))
    .orderBy(desc(documents.generated_at_utc))
    .limit(100)

  return docs
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function DocumentsPage() {
  const docs = await getDocuments()

  const stats = {
    total: docs.length,
    pickingLists: docs.filter(d => d.document_type === 'PICKING_LIST').length,
    poDrafts: docs.filter(d => d.document_type === 'PO_DRAFT').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="mt-2 text-gray-600">생성된 문서 및 PDF 관리</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Documents</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Picking Lists</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pickingLists}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">PO Drafts</p>
          <p className="text-2xl font-bold text-green-600">{stats.poDrafts}</p>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {docs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">생성된 문서가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              문서는 스케줄된 시간에 자동으로 생성됩니다.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {docs.map((doc) => (
                <tr key={doc.document_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      doc.document_type === 'PICKING_LIST' ? 'bg-blue-100 text-blue-800' :
                      doc.document_type === 'PO_DRAFT' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.document_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{doc.region_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{doc.document_date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-mono">{doc.file_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(doc.generated_at_utc)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary-600 hover:text-primary-900">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
