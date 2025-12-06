# Research: AI-Powered Workout Generation

**Date:** 2025-12-06
**Status:** Complete

## Problem Statement

Add AI-powered workout generation to allow users to create personalized workout templates and sessions on-the-fly using natural language prompts. This feature would reduce friction for new users and provide intelligent workout recommendations based on goals, available equipment, and training preferences.

## Key Findings

### AI Provider Comparison

| Provider | Cost (per 1M tokens) | Structured Output | Best For |
|----------|---------------------|-------------------|----------|
| **Claude Sonnet 4** | $3/$15 (in/out) | 100% JSON schema compliance | Recommended - best cost/quality |
| OpenAI GPT-4o | $10/$30 (in/out) | 100% with structured outputs | Larger ecosystem |
| OpenAI GPT-4o-mini | $0.15/$0.60 | Good for simple tasks | Budget option |
| Ollama (local) | Free | Varies by model | Privacy/offline |

**Estimated Costs (Claude Sonnet):**
- 1000 workouts/month: ~$16.50
- With prompt caching: ~$8.25
- With response caching: <$5

### Technical Architecture

**Recommended Stack:**
```
Vue 3 PWA Frontend (existing)
    ↓
Serverless API (Vercel/Cloudflare Workers)
    ↓
Redis Caching Layer (optional)
    ↓
Claude API with Structured Outputs
```

**Critical Security Requirement:** Never expose API keys in frontend code. Use a server-side proxy for all LLM API calls.

### Vue 3 Integration Options

1. **Vercel AI SDK** - Best for streaming responses
   - `useChat` composable for Vue/Nuxt
   - Built-in streaming support
   - Requires Node 18+

2. **Custom Implementation** - More control
   ```typescript
   const response = await fetch('/api/generate-workout', {
     method: 'POST',
     body: JSON.stringify({ prompt, config })
   })
   const reader = response.body.getReader()
   // Stream chunks to UI
   ```

3. **Direct Fetch with Structured Outputs**
   - Use Zod schemas for type-safe responses
   - 100% guaranteed JSON schema adherence with Claude/GPT-4o

### Structured Output Schema

The AI must generate content matching existing block types:

```typescript
// AI Output Schema (matches src/types/blocks.ts)
type AIGeneratedWorkout = {
  name: string
  description: string
  blocks: Array<AIStrengthBlock | AITimedBlock>
}

type AIStrengthBlock = {
  kind: 'strength'
  exerciseName: string
  equipment: Equipment
  muscle: Muscle
  targetReps: number
  targetSets: number
}

type AITimedBlock = {
  kind: 'amrap' | 'emom' | 'tabata' | 'fortime'
  config: TimedConfig
  exercises: Array<{ name: string; reps: number | 'max' }>
}
```

### Cost Optimization Strategies

1. **Prompt Caching** - Cache static system prompts for 50-75% savings
2. **Response Caching** - Hash user parameters, cache common requests (1-24hr TTL)
3. **Semantic Caching** - Match similar queries (e.g., "leg day" ≈ "lower body workout")
4. **Model Selection** - Use GPT-4o-mini for simple tasks, Claude for complex programming
5. **Batching** - 50% discount when processing multiple requests asynchronously

### Offline-First Considerations

- Cache AI-generated workouts in IndexedDB immediately after generation
- Provide pre-generated template library for offline use
- Show clear UI feedback when AI generation unavailable offline
- Use Background Sync to queue generation requests when offline

## Codebase Patterns

### Existing Data Models

The codebase already has well-defined block types that AI must generate:

**Block Structure** (`src/types/blocks.ts`):
- `StrengthBlock`: id, exerciseDefinitionId, name, equipment, targetReps, sets
- `AmrapBlock`: id, config (duration, rounds), exercises, result
- `EmomBlock`: id, config (minuteDuration, rounds), exercises, result
- `TabataBlock`: id, config (workSeconds, restSeconds, rounds), exercise
- `ForTimeBlock`: id, config (timeCapMinutes), exercises, result

**Exercise Attributes** (`src/types/exercises.ts`):
- Equipment: barbell, dumbbell, machine, cable, bodyweight, kettlebell, band, etc.
- Muscle: chest, back, legs, shoulders, arms, core
- Type: compound, isolation, stability, cardio
- Metrics: weight-reps, reps-only, duration, distance-duration

### Integration Points

| Location | Action | Purpose |
|----------|--------|---------|
| `/ai-generate` (NEW) | New route/view | Standalone AI generation page |
| `WorkoutAddBlockDialog.vue` | Add "AI Generate" option | Quick AI block generation |
| `CreateTemplateView.vue` | Add "Generate with AI" button | Template generation |
| `TemplateDetailView.vue` | Add "Regenerate" button | Refinement of templates |
| `src/services/ai.ts` (NEW) | Service layer | API calls, validation, parsing |

### Existing Patterns to Follow

**State Management:**
```typescript
// Follow useTemplateDetail pattern with state machine
type AIGenerationState =
  | { status: 'idle' }
  | { status: 'loading'; prompt: string }
  | { status: 'success'; workout: GeneratedWorkout }
  | { status: 'error'; message: string }
```

**Repository Pattern:**
```typescript
// Use existing templatesRepository for saving
const template = await templatesRepository.create({
  name: generatedWorkout.name,
  exercises: mapToDbFormat(generatedWorkout.blocks)
})
```

**Validation:**
```typescript
// Validate AI output against allowed values
const validEquipment = ['barbell', 'dumbbell', ...] as const
const isValid = validEquipment.includes(block.equipment)
```

## Recommended Approach

### Phase 1: MVP (Server-Side Proxy + Basic Generation)

1. **Create Serverless Function** (Vercel/Cloudflare Worker)
   - Accept user prompt and preferences
   - Call Claude API with structured output schema
   - Return validated workout structure

2. **New Feature Module** (`src/features/ai-generation/`)
   ```
   ai-generation/
   ├── components/
   │   ├── AIPromptInput.vue
   │   └── AIGeneratedPreview.vue
   ├── composables/
   │   └── useAIGeneration.ts
   ├── services/
   │   └── api.ts
   └── index.ts
   ```

3. **New Route/View**
   - `/generate` - AI workout generation page
   - Simple form: prompt input, equipment filter, workout type
   - Preview generated workout before saving

4. **Integration with Templates**
   - Save generated workouts as templates
   - Allow editing before starting workout

### Phase 2: Production Enhancements

1. **Streaming Responses** - Show workout building in real-time
2. **Redis Caching** - Cache popular workout patterns
3. **Rate Limiting** - Token bucket (10 generations/hour per user)
4. **Prompt Templates** - Pre-built prompts for common goals

### Phase 3: Advanced Features

1. **Workout History Analysis** - Generate based on past performance
2. **Progressive Overload** - AI-adjusted weights/reps
3. **Periodization** - Multi-week program generation
4. **A/B Testing** - Experiment with different prompts

### Example Prompt Template

```
Generate a workout with these specifications:
- Goal: {hypertrophy | strength | endurance | crossfit}
- Duration: {minutes} minutes
- Equipment: {equipment list}
- Focus: {muscle groups}
- Experience level: {beginner | intermediate | advanced}

Output a JSON workout matching this schema:
{schema}

Include warmup recommendations and scaling options for each exercise.
```

### Security Checklist

- [ ] API keys stored in environment variables (server-side only)
- [ ] Server-side proxy for all LLM calls
- [ ] Input sanitization before sending to LLM
- [ ] Output validation against allowed exercise values
- [ ] Rate limiting to prevent abuse
- [ ] User authentication for generation quota

### UI/UX Considerations

1. **Loading State** - Streaming animation while generating
2. **Preview Mode** - Show generated workout before saving
3. **Edit Capability** - Allow modifications after generation
4. **Regenerate Option** - Try again with same or modified prompt
5. **Offline Fallback** - Suggest pre-made templates when offline

## Sources

### Official Documentation
- [Anthropic Claude API Docs](https://docs.anthropic.com/claude/reference)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Vercel AI SDK for Vue/Nuxt](https://ai-sdk.dev/docs/getting-started/nuxt)

### Technical Guides
- [Stream OpenAI Chat Completions in JavaScript](https://www.builder.io/blog/stream-ai-javascript)
- [ChatGPT Integration with Node and Vue](https://www.bacancytechnology.com/blog/chatgpt-integration-with-node-and-vue)
- [OpenAI Structured Outputs and Zod](https://www.timsanteford.com/posts/openai-structured-outputs-and-zod-and-zod-to-json-schema/)

### Security Best Practices
- [How to protect API keys in PWA](https://stackoverflow.com/questions/65747549/how-to-protect-api-keys-in-pwa-progressive-web-application)
- [Best Practices for PWA Security](https://blog.pixelfreestudio.com/best-practices-for-pwa-security/)

### Cost & Performance
- [OpenAI Cost Optimization Strategies](https://www.cloudzero.com/blog/openai-cost-optimization/)
- [LLM Caching Strategies](https://www.helicone.ai/blog/effective-llm-caching)
- [OpenAI Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

### Fitness AI Examples
- [FitnessAI](https://www.fitnessai.com/) - ML-powered workout recommendations
- [Fitbod](https://fitbod.me/) - Progressive overload intelligence
- [WOD GPT](https://wodgpt.com/) - CrossFit workout generator (test prompts)

### Academic Research
- [Deep Learning for Personalized Workout Recommendations](https://www.sciencedaily.com/releases/2019/04/190422151023.htm)
- [Nike's Personalized Workout System](https://medium.com/nikeengineering/serving-athletes-with-personalized-workout-recommendations-285491eabc3d)
