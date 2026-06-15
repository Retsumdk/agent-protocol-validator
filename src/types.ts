/**
 * agent-protocol-validator - Core Types
 * @author Retsumdk
 */

import { z } from "zod";

/**
 * Standard Agent Message Envelope
 */
export const AgentMessageSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  sender: z.string(),
  receiver: z.string(),
  protocol: z.enum(["json-rpc", "fipa-acl", "pubsub", "custom"]),
  version: z.string().default("1.0"),
  type: z.string(),
  payload: z.any(),
  metadata: z.record(z.string(), z.any()).optional(),
  signature: z.string().optional(),
});

export type AgentMessage = z.infer<typeof AgentMessageSchema>;

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  messageId: string;
  errors?: ValidationError[];
  warnings?: string[];
  sanitizedPayload?: any;
  timestamp: string;
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

/**
 * Security Policy Definition
 */
export interface SecurityPolicy {
  id: string;
  name: string;
  enabled: boolean;
  severity: "low" | "medium" | "high" | "critical";
  rules: PolicyRule[];
}

export type PolicyRuleType = "blacklist" | "whitelist" | "regex" | "custom";

export interface PolicyRule {
  id: string;
  type: PolicyRuleType;
  target: string; // JSON path or "payload"
  pattern?: string;
  values?: string[];
  message: string;
}

/**
 * Protocol Definition
 */
export interface Protocol {
  name: string;
  schemas: Record<string, any>;
  handler: (message: AgentMessage) => Promise<boolean>;
}
