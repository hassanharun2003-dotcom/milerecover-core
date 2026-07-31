# `packages/config`

Shared **non-secret** configuration schemas and validation.

## Allowed (future)

- Zod/JSON schema for public config keys
- Feature flag key names (not remote values with secrets)
- Environment enum (`development`, `staging`, `production`)

## Prohibited

- Credentials, API keys, DSNs
- Committed `.env` files
- Store shared secrets

## References

- [.env.example](../../.env.example)
