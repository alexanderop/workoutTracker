# Claude Prompts for Product Planning

This file contains useful prompts to use with Claude for common PO/BA tasks.

---

## Writing User Stories

### Generate User Stories from a Feature Idea
```
Read the product vision in product-planning/PRODUCT_VISION.md and the personas in product-planning/personas/PERSONAS.md.

I want to add [FEATURE DESCRIPTION]. Please generate 3-5 user stories for this feature. For each story:
1. Use the format: As a [persona], I want [goal], so that [benefit]
2. Include 3-5 acceptance criteria in Given/When/Then format
3. Suggest story points (1, 2, 3, 5, 8)
4. Note which persona(s) benefit most
```

### Refine Acceptance Criteria
```
Here's a user story: [PASTE STORY]

Please help me refine the acceptance criteria:
1. Are there edge cases I'm missing?
2. Are the criteria testable and specific?
3. What error states should we handle?
4. Are there accessibility considerations?
```

---

## Backlog Management

### Prioritize Backlog Items
```
Read the backlog in product-planning/backlog/BACKLOG.md and our product vision.

Help me prioritize these items using RICE scoring:
- Reach: How many users will this impact?
- Impact: How much will it impact them? (3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal)
- Confidence: How confident are we in estimates? (100%, 80%, 50%)
- Effort: Person-weeks of effort

Please score each item and suggest a new priority order with reasoning.
```

### Split an Epic into Stories
```
I have this epic: [PASTE EPIC]

Please break it down into user stories that:
1. Are independently deliverable
2. Provide incremental value
3. Can be completed in one sprint (< 8 points each)
4. Follow the INVEST criteria
```

---

## PRD & Specifications

### Generate a PRD
```
Read the product vision and relevant personas.

I need to write a PRD for [FEATURE]. Please help me create one using the template in product-planning/templates/PRD_TEMPLATE.md. Focus on:
1. Clear problem statement
2. Measurable success metrics
3. Detailed requirements
4. Edge cases and error handling
```

### Review a PRD
```
Please review this PRD: [PASTE PRD or FILE PATH]

Check for:
1. Clarity and completeness
2. Missing requirements or edge cases
3. Testability of success metrics
4. Technical feasibility concerns
5. Alignment with product vision
```

---

## Sprint Planning

### Plan a Sprint
```
Read our backlog and the product vision.

Help me plan a sprint with [X] points of capacity. Consider:
1. Dependencies between stories
2. A cohesive sprint goal
3. Balance of feature work vs. tech debt
4. Risk factors

Suggest which items to commit to and which could be stretch goals.
```

### Write Sprint Goal
```
These stories are planned for the sprint: [LIST STORIES]

Help me write a clear, outcome-focused sprint goal that:
1. Is achievable and measurable
2. Connects to user value
3. Can be demonstrated at sprint review
```

---

## Discovery & Research

### Competitive Analysis
```
Help me analyze competitors for [FEATURE/AREA].

For each competitor, identify:
1. How they solve the problem
2. Strengths and weaknesses
3. What we can learn from them
4. How we could differentiate
```

### User Interview Questions
```
I want to learn about [TOPIC/FEATURE AREA] from users.

Generate 10-15 interview questions that:
1. Start broad and get specific
2. Avoid leading questions
3. Explore pain points and current behaviors
4. Uncover unmet needs
```

---

## Estimation & Planning

### Estimate Stories
```
Please help me estimate these stories using planning poker points (1, 2, 3, 5, 8, 13):

[PASTE STORIES]

For each, consider:
1. Complexity
2. Uncertainty/unknowns
3. Dependencies
4. Testing effort

Provide reasoning for each estimate.
```

### Risk Assessment
```
For this feature/initiative: [DESCRIPTION]

Identify risks across these categories:
1. Technical risks
2. User adoption risks
3. Timeline risks
4. Dependency risks

For each risk, suggest likelihood, impact, and mitigation strategies.
```

---

## Communication

### Write Release Notes
```
These items shipped this sprint: [LIST ITEMS]

Write user-friendly release notes that:
1. Focus on user benefits, not technical details
2. Are scannable with clear headers
3. Include any breaking changes or required actions
```

### Stakeholder Update
```
Help me write a brief stakeholder update email covering:
1. What we shipped this sprint
2. Key metrics/outcomes
3. What's coming next sprint
4. Any blockers or decisions needed

Keep it under 200 words.
```

---

## Tips for Best Results

1. **Always reference context files** - Point Claude to the vision, personas, and existing backlog
2. **Be specific** - The more context you provide, the better the output
3. **Iterate** - Ask Claude to refine and improve its suggestions
4. **Challenge assumptions** - Ask "what am I missing?" or "what could go wrong?"
5. **Use the templates** - They ensure consistency and completeness
