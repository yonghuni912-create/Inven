/**
 * Main scheduler that checks which jobs should run
 * Called every 10 minutes by GitHub Actions
 */

const { db } = require('../db')
const { regions, jobRuns } = require('../db/schema')
const { eq, and } = require('drizzle-orm')
const { todayInTimezone, shouldRunToday, isPastScheduledTime } = require('../lib/datetime')

// Import job modules
const syncShopifyOrders = require('./sync-shopify-orders')
const dailyAnalytics = require('./daily-analytics')
const generateDocuments = require('./generate-documents')

async function main() {
  console.log('Scheduler started at:', new Date().toISOString())

  try {
    // Get all active regions
    const activeRegions = await db
      .select()
      .from(regions)
      .where(eq(regions.active, true))

    console.log(`Found ${activeRegions.length} active regions`)

    for (const region of activeRegions) {
      console.log(`\nProcessing region: ${region.name}`)
      
      const today = todayInTimezone(region.timezone)
      const shouldRun = shouldRunToday(region.run_days, region.timezone)

      if (!shouldRun) {
        console.log(`  Skipping - not scheduled to run today`)
        continue
      }

      // Check and run analytics job
      if (isPastScheduledTime(region.analytics_time, region.timezone)) {
        await checkAndRunJob(
          'DAILY_ANALYTICS',
          region,
          today,
          async () => await dailyAnalytics.run(region)
        )
      } else {
        console.log(`  Analytics not yet scheduled (${region.analytics_time})`)
      }

      // Check and run documents job
      if (isPastScheduledTime(region.docs_time, region.timezone)) {
        await checkAndRunJob(
          'GENERATE_DOCUMENTS',
          region,
          today,
          async () => await generateDocuments.run(region)
        )
      } else {
        console.log(`  Documents not yet scheduled (${region.docs_time})`)
      }

      // Always run Shopify sync (incremental)
      await checkAndRunJob(
        'SYNC_SHOPIFY_ORDERS',
        region,
        today,
        async () => await syncShopifyOrders.run(region),
        true // Allow multiple runs per day
      )
    }

    console.log('\nScheduler completed successfully')
  } catch (error) {
    console.error('Scheduler error:', error)
    process.exit(1)
  }
}

/**
 * Check if job should run and execute it
 */
async function checkAndRunJob(jobName, region, runDate, jobFunc, allowMultiple = false) {
  try {
    // Check if job already ran today
    if (!allowMultiple) {
      const existingRun = await db
        .select()
        .from(jobRuns)
        .where(
          and(
            eq(jobRuns.job_name, jobName),
            eq(jobRuns.region_id, region.region_id),
            eq(jobRuns.run_date, runDate),
            eq(jobRuns.status, 'SUCCESS')
          )
        )
        .limit(1)

      if (existingRun[0]) {
        console.log(`  ${jobName} already ran successfully today`)
        return
      }
    }

    console.log(`  Running ${jobName}...`)
    const startTime = Date.now()

    // Create job run record
    const jobRun = await db
      .insert(jobRuns)
      .values({
        job_name: jobName,
        region_id: region.region_id,
        run_date: runDate,
        ran_at_utc: new Date().toISOString(),
        status: 'RUNNING',
      })
      .returning({ job_run_id: jobRuns.job_run_id })

    try {
      // Execute job
      const result = await jobFunc()
      const duration = Date.now() - startTime

      // Update job run as success
      await db
        .update(jobRuns)
        .set({
          status: 'SUCCESS',
          message: result?.message || 'Completed',
          duration_ms: duration,
        })
        .where(eq(jobRuns.job_run_id, jobRun[0].job_run_id))

      console.log(`  ${jobName} completed in ${duration}ms`)
    } catch (error) {
      const duration = Date.now() - startTime

      // Update job run as failed
      await db
        .update(jobRuns)
        .set({
          status: 'FAILED',
          message: error.message,
          duration_ms: duration,
        })
        .where(eq(jobRuns.job_run_id, jobRun[0].job_run_id))

      console.error(`  ${jobName} failed:`, error.message)
      throw error
    }
  } catch (error) {
    console.error(`Error in checkAndRunJob for ${jobName}:`, error)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { main }
