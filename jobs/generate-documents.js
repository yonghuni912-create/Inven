/**
 * Generate documents job
 * - Picking lists
 * - Packing lists
 * - PO drafts
 */

const { db } = require('../db')
const { 
  orders,
  orderLines,
  stores,
  skus,
  replenishmentRecommendations,
  documents
} = require('../db/schema')
const { eq, and } = require('drizzle-orm')
const { jsPDF } = require('jspdf')
const { todayInTimezone } = require('../lib/datetime')
const fs = require('fs')
const path = require('path')

async function run(region) {
  console.log(`  Generating documents for region ${region.name}`)
  const docDate = todayInTimezone(region.timezone)

  try {
    // Ensure documents directory exists
    const docsDir = path.join(__dirname, 'documents')
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true })
    }

    // Generate picking list
    const pickingList = await generatePickingList(region, docDate)
    
    // Generate PO draft
    const poDraft = await generatePODraft(region, docDate)

    return {
      message: 'Documents generated',
      picking_list: pickingList,
      po_draft: poDraft,
    }
  } catch (error) {
    console.error('Error generating documents:', error)
    throw error
  }
}

async function generatePickingList(region, docDate) {
  // Get today's orders
  const todaysOrders = await db
    .select({
      order_id: orders.order_id,
      order_number: orders.order_number,
      store_name: stores.store_name,
      order_type: orders.order_type,
    })
    .from(orders)
    .leftJoin(stores, eq(orders.store_id, stores.store_id))
    .where(
      and(
        eq(orders.region_id, region.region_id),
        gte(orders.order_date_at_utc, docDate)
      )
    )

  // Aggregate items across all orders
  const itemsMap = new Map()

  for (const order of todaysOrders) {
    const lines = await db
      .select({
        sku_code: skus.sku_code,
        name: skus.name,
        qty: orderLines.qty,
      })
      .from(orderLines)
      .leftJoin(skus, eq(orderLines.sku_id, skus.sku_id))
      .where(eq(orderLines.order_id, order.order_id))

    for (const line of lines) {
      const key = line.sku_code
      if (itemsMap.has(key)) {
        itemsMap.get(key).qty += line.qty
      } else {
        itemsMap.set(key, { ...line })
      }
    }
  }

  // Generate PDF
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text(`Picking List - ${region.name}`, 20, 20)
  doc.setFontSize(12)
  doc.text(`Date: ${docDate}`, 20, 30)
  doc.text(`Total Orders: ${todaysOrders.length}`, 20, 40)

  let yPos = 60
  doc.setFontSize(10)
  doc.text('SKU Code', 20, yPos)
  doc.text('Product Name', 80, yPos)
  doc.text('Qty', 160, yPos)
  yPos += 10

  for (const [_, item] of itemsMap) {
    if (yPos > 280) {
      doc.addPage()
      yPos = 20
    }
    doc.text(item.sku_code, 20, yPos)
    doc.text(item.name.substring(0, 40), 80, yPos)
    doc.text(item.qty.toString(), 160, yPos)
    yPos += 10
  }

  const fileName = `picking-list-${region.name}-${docDate}.pdf`
  const filePath = path.join(__dirname, 'documents', fileName)
  doc.save(filePath)

  // Save document record
  await db.insert(documents).values({
    region_id: region.region_id,
    document_type: 'PICKING_LIST',
    document_date: docDate,
    file_name: fileName,
    file_url: filePath,
    status: 'GENERATED',
    generated_at_utc: new Date().toISOString(),
  })

  return fileName
}

async function generatePODraft(region, docDate) {
  // Get replenishment recommendations
  const recommendations = await db
    .select({
      sku_code: skus.sku_code,
      name: skus.name,
      recommended_qty: replenishmentRecommendations.recommended_qty,
      adjusted_qty: replenishmentRecommendations.adjusted_qty,
      priority: replenishmentRecommendations.priority,
    })
    .from(replenishmentRecommendations)
    .innerJoin(skus, eq(replenishmentRecommendations.sku_id, skus.sku_id))
    .where(
      and(
        eq(replenishmentRecommendations.region_id, region.region_id),
        eq(replenishmentRecommendations.recommendation_date, docDate)
      )
    )

  if (recommendations.length === 0) {
    console.log('  No recommendations to generate PO')
    return null
  }

  // Generate PDF
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.text(`Purchase Order Draft - ${region.name}`, 20, 20)
  doc.setFontSize(12)
  doc.text(`Date: ${docDate}`, 20, 30)

  let yPos = 50
  doc.setFontSize(10)
  doc.text('SKU Code', 20, yPos)
  doc.text('Product Name', 70, yPos)
  doc.text('Qty', 140, yPos)
  doc.text('Priority', 170, yPos)
  yPos += 10

  for (const item of recommendations) {
    if (yPos > 280) {
      doc.addPage()
      yPos = 20
    }
    doc.text(item.sku_code, 20, yPos)
    doc.text(item.name.substring(0, 30), 70, yPos)
    doc.text(item.adjusted_qty.toString(), 140, yPos)
    doc.text(item.priority, 170, yPos)
    yPos += 10
  }

  const fileName = `po-draft-${region.name}-${docDate}.pdf`
  const filePath = path.join(__dirname, 'documents', fileName)
  doc.save(filePath)

  // Save document record
  await db.insert(documents).values({
    region_id: region.region_id,
    document_type: 'PO_DRAFT',
    document_date: docDate,
    file_name: fileName,
    file_url: filePath,
    status: 'GENERATED',
    generated_at_utc: new Date().toISOString(),
  })

  return fileName
}

module.exports = { run }
