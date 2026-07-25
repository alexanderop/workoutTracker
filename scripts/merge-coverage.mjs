import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import coverage from 'istanbul-lib-coverage'

const thresholds = JSON.parse(
  await readFile(new URL('../coverage-thresholds.json', import.meta.url), 'utf8'),
)

const coverageDirectory = path.resolve(process.argv[2] ?? '.coverage')
// Browser shards only. The Node `unit` tier is deliberately NOT merged in here:
// its v8 run reports the whole `src/**` include at ~2% (it never loads the Vue
// components) AND instruments the same files to different statement/line totals
// than the browser pipeline, so merging inflates the denominator instead of
// unioning coverage. Measured: 4 shards alone = 87.63% lines / 86.14%
// statements (passes); with the unit map = 81.37% / 70.36% (fails).
const expectedShardFiles = Array.from(
  { length: 4 },
  (_, index) => `coverage-shard-${index + 1}.json`,
)
const shardFiles = (await readdir(coverageDirectory))
  .filter((file) => /^coverage-shard-\d+\.json$/.test(file))
  .toSorted()

if (shardFiles.join('\n') !== expectedShardFiles.join('\n')) {
  throw new Error(
    `Expected ${expectedShardFiles.join(', ')} in ${coverageDirectory}; ` +
      `found ${shardFiles.join(', ') || 'none'}`,
  )
}

const coverageMap = coverage.createCoverageMap({})

for (const file of shardFiles) {
  const contents = await readFile(path.resolve(coverageDirectory, file), 'utf8')
  coverageMap.merge(JSON.parse(contents))
}

const summary = coverageMap.getCoverageSummary().toJSON()
let failed = false

console.info(`Merged ${shardFiles.length} coverage shards\n`)
console.info('Coverage summary')

for (const [metric, threshold] of Object.entries(thresholds)) {
  const percentage = summary[metric].pct
  const status = percentage >= threshold ? 'PASS' : 'FAIL'

  console.info(
    `${metric.padEnd(10)} ${String(percentage).padStart(6)}% ` +
      `(minimum ${threshold}%) ${status}`,
  )

  if (percentage < threshold) {
    failed = true
  }
}

if (failed) {
  process.exitCode = 1
}
