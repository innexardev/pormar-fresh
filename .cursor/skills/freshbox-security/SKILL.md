---
name: freshbox-security
description: Reviews Fresh Box auth, admin JWT, payment idempotency, and PII handling. Use before merging auth or payment changes.
---

# Fresh Box Security

## Blockers

- Admin routes without JwtAuthGuard
- Payment processed twice (missing idempotencyKey)
- Stock deducted before payment confirmed
- Sensitive data in client-side logs

## Scope

- Single admin user model (expand RBAC later if needed)
- Pix webhook must validate signature when integrating gateway real

## Output

Threat notes + pass/fail checklist per changed file.
