import type { Metric } from 'web-vitals'

function logWebVital(metric: Metric): void {
  console.info('[WebVitals]', metric.name, {
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  })
}

export async function reportWebVitals(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return
  }

  const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals')

  onCLS(logWebVital)
  onFCP(logWebVital)
  onINP(logWebVital)
  onLCP(logWebVital)
  onTTFB(logWebVital)
}
