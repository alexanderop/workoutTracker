# Security Testing Session

**App URL**: {{APP_URL}}
**Focus**: Security Testing (Client-Side)
**Date**: {{DATE}}

## Your Mission

This is a local-first PWA using IndexedDB. Your goal is to find client-side security vulnerabilities that could:
- Allow XSS attacks
- Corrupt or leak user data
- Enable injection through the UI
- Bypass input validation

## Turn Budget: 60 turns

| Phase | Turns | Goal |
|-------|-------|------|
| Reconnaissance | 1-5 | Map all input fields and data entry points |
| XSS Testing | 6-25 | Test every input for script injection |
| Input Validation | 26-40 | Boundary testing, type confusion |
| Storage Probing | 41-50 | localStorage/IndexedDB inspection |
| Mobile + Report | 51-60 | Mobile security + write report |

## XSS Test Payloads

Try these in EVERY text input field:

### Basic XSS
```
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
```

### Event Handler Injection
```
" onclick="alert('XSS')" data-x="
' onmouseover='alert(1)' x='
javascript:alert('XSS')
```

### HTML Injection
```
<h1>Injected Header</h1>
<a href="https://evil.com">Click me</a>
<iframe src="https://evil.com"></iframe>
```

### Special Characters
```
<>&"'`/\
${7*7}
{{constructor.constructor('alert(1)')()}}
```

## Input Validation Tests

For numeric fields (weights, reps, sets):
- Negative numbers: `-1`, `-999`
- Zero: `0`
- Decimals: `1.5`, `0.001`
- Very large: `999999999`, `Infinity`
- Non-numeric: `abc`, `12abc`, `NaN`
- Scientific notation: `1e10`, `1e-10`

For text fields:
- Empty string (just spaces)
- Very long: 1000+ characters
- Unicode: `测试`, `🔥💪`, `⚡️`
- Null bytes: `test%00test`
- SQL-like: `'; DROP TABLE exercises; --`

## Storage Security Checks

After entering data:
1. Open browser DevTools → Application tab
2. Check localStorage - any sensitive data exposed?
3. Check IndexedDB - data properly structured?
4. Look for:
   - Unencrypted sensitive data
   - Data that persists after "delete"
   - Cross-origin data leaks

## Data Flow Testing

1. **Create** an exercise with malicious payload in name
2. **View** it in list - does payload execute?
3. **Edit** it - is payload preserved or sanitized?
4. **Use** it in workout - payload in different context?
5. **Delete** it - is it truly gone from storage?

## Console Monitoring

Keep DevTools console open. Watch for:
- JavaScript errors from malformed input
- CSP (Content Security Policy) violations
- Unhandled promise rejections
- Any `eval()` or `innerHTML` warnings

## Bug Severity for Security

| Severity | Criteria |
|----------|----------|
| **CRITICAL** | XSS executes, data exfiltration possible |
| **HIGH** | Input validation bypass, data corruption |
| **MEDIUM** | Information disclosure, improper error handling |
| **LOW** | Missing security headers, minor validation gaps |

## Screenshot Naming

- `sec-critical-xss-in-exercise-name.png`
- `sec-high-negative-reps-accepted.png`
- `sec-medium-verbose-error-message.png`

---

## FINAL STEP: Write qa-report.md

```markdown
# Security Testing Report

**Date**: {{DATE}}
**Focus**: Client-Side Security
**Tester**: Quinn (Claude QA)
**App**: Workout Tracker PWA

## Executive Summary

[One sentence: Is this app secure for users?]

## Attack Surface Map

| Entry Point | Type | Tested |
|-------------|------|--------|
| Exercise name | Text input | ✅/❌ |
| Exercise notes | Textarea | ✅/❌ |
| Weight input | Number | ✅/❌ |
| Reps input | Number | ✅/❌ |
| ... | ... | ... |

## XSS Testing Results

| Payload | Location | Result | Notes |
|---------|----------|--------|-------|
| `<script>alert(1)</script>` | Exercise name | SAFE/VULN | |
| `<img onerror=...>` | Exercise name | SAFE/VULN | |
| ... | ... | ... | |

## Input Validation Results

| Test | Field | Result | Notes |
|------|-------|--------|-------|
| Negative number | Weight | PASS/FAIL | |
| Very long string | Exercise name | PASS/FAIL | |
| Special characters | Notes | PASS/FAIL | |
| ... | ... | ... | |

## Storage Security

| Check | Status | Notes |
|-------|--------|-------|
| No sensitive data in localStorage | ✅/❌ | |
| Data properly deleted | ✅/❌ | |
| No PII leakage | ✅/❌ | |

## Console Errors

[List any security-relevant errors, or "None"]

## Vulnerabilities Found

| # | Severity | Type | Description | Screenshot |
|---|----------|------|-------------|------------|
| 1 | CRIT/HIGH/MED/LOW | XSS/Injection/etc | | |

(Or "No vulnerabilities found")

## Recommendations

[List any security improvements, even if no vulns found]

## Verdict

**[SECURE / NEEDS FIXES / CRITICAL VULNERABILITIES]**

[One sentence summary]
```
