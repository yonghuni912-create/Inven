export default function AdjustmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Adjustments</h1>
        <p className="mt-2 text-gray-600">재고 강제조정 및 감사 로그</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Adjustment</h2>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>Select region...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>Select location...</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>Select SKU...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot (Optional)
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>Select lot...</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Adjustment
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter positive or negative number"
              />
              <p className="text-xs text-gray-500 mt-1">
                Positive to add, negative to subtract
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Required)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="e.g., Physical count discrepancy"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
              placeholder="Additional details..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Submit Adjustment
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Adjustments</h2>
        <p className="text-gray-500 text-center py-8">No recent adjustments</p>
      </div>
    </div>
  )
}
