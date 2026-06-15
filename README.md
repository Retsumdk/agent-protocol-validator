# Agent Protocol Validator

Enforces strict schema validation and security policy compliance for inter-agent communication messages.

## Features

- **Structural Validation**: Ensure messages follow a strict envelope schema (ID, timestamp, sender, receiver, protocol, etc.).
- **Payload Validation**: Register custom Zod schemas for specific message types to ensure deep payload integrity.
- **Security Policies**: Implement powerful security policies to block prohibited commands, prevent sensitive data leaks (API keys, secrets), and enforce communication rules.
- **Protocol Agnostic**: Designed to handle various agent communication protocols including JSON-RPC, FIPA-ACL, and custom patterns.
- **Clean API**: Easy to integrate into existing agent frameworks as a middleware or standalone validation service.
- **CLI Tool**: Validate message files directly from the command line.

## Installation

```bash
bun install
```

## Quick Start (Library)

```typescript
import { createValidator, DEFAULT_POLICIES } from "agent-protocol-validator";
import { z } from "zod";

// Create engine with default security policies
const engine = createValidator();

// Register a custom schema for a "trade" message
engine.registerSchema("trade", z.object({
  asset: z.string(),
  amount: z.number().positive(),
  price: z.number().positive(),
}));

// Validate a message
const message = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: new Date().toISOString(),
  sender: "agent-a",
  receiver: "agent-b",
  protocol: "json-rpc",
  type: "trade",
  payload: {
    asset: "BTC",
    amount: 0.5,
    price: 60000
  }
};

const result = await engine.process(message);
if (result.valid) {
  console.log("Message is safe and valid!");
} else {
  console.error("Validation failed:", result.errors);
}
```

## CLI Usage

### Validate a message file

```bash
bun start validate message.json
```

### Enable verbose logging

```bash
bun start validate message.json --verbose
```

### Use custom security policies

```bash
bun start validate message.json --policy my-policies.json
```

### Generate a policy template

```bash
bun start init-policy default-policy.json
```

## Security Policies

Security policies consist of rules that target specific parts of a message. Supported rule types include:

- `blacklist`: Block specific values.
- `whitelist`: Allow only specific values.
- `regex`: Match patterns (e.g., secrets, prohibited strings).
- `custom`: Implement custom logic.

Example Policy:

```json
{
  "id": "p-001",
  "name": "Internal Command Protection",
  "enabled": true,
  "severity": "critical",
  "rules": [
    {
      "id": "r-001",
      "type": "blacklist",
      "target": "payload.command",
      "values": ["rm", "shutdown", "reboot"],
      "message": "Prohibited system command detected."
    }
  ]
}
```

## License

MIT
