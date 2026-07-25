import { faker } from '@faker-js/faker'

// Seed faker for reproducible randomization across test runs, matching the
// browser-tier setup (src/__tests__/setup.ts).
faker.seed(12_345)
