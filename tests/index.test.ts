import { expect, test, describe } from "bun:test";
import { createValidator, DEFAULT_POLICIES } from "../src/index.js";
import { z } from "zod";

describe("Agent Protocol Validator", () => {
  const engine = createValidator();

  test("should validate a correct message envelope", async () => {
    const message = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: new Date().toISOString(),
      sender: "agent-1",
      receiver: "agent-2",
      protocol: "json-rpc",
      type: "ping",
      payload: {},
    };

    const result = await engine.process(message);
    expect(result.valid).toBe(true);
  });

  test("should fail on invalid envelope", async () => {
    const message = {
      id: "invalid-uuid",
      sender: "agent-1",
      // missing timestamp, receiver, etc.
    };

    const result = await engine.process(message);
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  test("should validate custom schemas", async () => {
    engine.registerSchema("data", z.object({
      value: z.number(),
    }));

    const message = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: new Date().toISOString(),
      sender: "agent-1",
      receiver: "agent-2",
      protocol: "pubsub",
      type: "data",
      payload: { value: 42 },
    };

    const result = await engine.process(message);
    expect(result.valid).toBe(true);
    expect(result.sanitizedPayload.value).toBe(42);
  });

  test("should fail on custom schema violation", async () => {
    const message = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: new Date().toISOString(),
      sender: "agent-1",
      receiver: "agent-2",
      protocol: "pubsub",
      type: "data",
      payload: { value: "not-a-number" },
    };

    const result = await engine.process(message);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0].path).toBe("payload.value");
  });

  test("should enforce security policies (blacklist)", async () => {
    const message = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: new Date().toISOString(),
      sender: "agent-1",
      receiver: "agent-2",
      protocol: "custom",
      type: "exec",
      payload: { command: "rm -rf /" },
    };

    const result = await engine.process(message);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0].message).toContain("Prohibited system command");
  });

  test("should enforce security policies (regex/secrets)", async () => {
    const message = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      timestamp: new Date().toISOString(),
      sender: "agent-1",
      receiver: "agent-2",
      protocol: "custom",
      type: "config",
      payload: "My secret is sk-1234567890abcdef1234567890abcdef",
    };

    const result = await engine.process(message);
    expect(result.valid).toBe(false);
    expect(result.errors?.[0].message).toContain("Possible API key");
  });
});
