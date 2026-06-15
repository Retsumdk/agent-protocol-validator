/**
 * agent-protocol-validator - Main Engine
 * @author Retsumdk
 */

import { MessageValidator } from "./validator.js";
import { PolicyEnforcer } from "./policy.js";
import { AgentMessage, ValidationResult, SecurityPolicy } from "./types.js";

export class ProtocolValidatorEngine {
  private validator: MessageValidator;
  private enforcer: PolicyEnforcer;

  constructor(policies: SecurityPolicy[] = []) {
    this.validator = new MessageValidator();
    this.enforcer = new PolicyEnforcer(policies);
  }

  /**
   * Process and validate an incoming or outgoing agent message
   */
  public async process(rawMessage: any): Promise<ValidationResult> {
    // 1. Structural Validation
    const validationResult = await this.validator.validate(rawMessage);
    
    if (!validationResult.valid) {
      return validationResult;
    }

    // Since structural validation passed, we can safely cast or use the typed message
    // Note: sanitizedPayload from validator might be used if present
    const message = rawMessage as AgentMessage;

    // 2. Policy Enforcement
    const policyResult = await this.enforcer.enforce(message);
    
    // 3. Merge Results
    return this.mergeResults(validationResult, policyResult);
  }

  /**
   * Add a custom schema to the validator
   */
  public registerSchema(type: string, schema: any) {
    this.validator.registerSchema(type, schema);
  }

  /**
   * Add a security policy to the enforcer
   */
  public addPolicy(policy: SecurityPolicy) {
    this.enforcer.addPolicy(policy);
  }

  /**
   * Helper to merge structural and policy validation results
   */
  private mergeResults(v1: ValidationResult, v2: ValidationResult): ValidationResult {
    return {
      valid: v1.valid && v2.valid,
      messageId: v1.messageId,
      errors: [...(v1.errors || []), ...(v2.errors || [])],
      warnings: [...(v1.warnings || []), ...(v2.warnings || [])],
      sanitizedPayload: v1.sanitizedPayload,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Default Policies
 */
export const DEFAULT_POLICIES: SecurityPolicy[] = [
  {
    id: "p-001",
    name: "Internal Command Protection",
    enabled: true,
    severity: "critical",
    rules: [
      {
        id: "r-001",
        type: "blacklist",
        target: "payload.command",
        values: ["rm", "shutdown", "reboot", "format", "chmod", "chown"],
        message: "Prohibited system command detected in message payload.",
      },
    ],
  },
  {
    id: "p-002",
    name: "Sensitive Data Leak Prevention",
    enabled: true,
    severity: "high",
    rules: [
      {
        id: "r-002",
        type: "regex",
        target: "payload",
        pattern: "(sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33})",
        message: "Possible API key or secret detected in message payload.",
      },
    ],
  },
];
