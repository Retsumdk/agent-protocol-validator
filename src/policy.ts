/**
 * agent-protocol-validator - Policy Enforcer
 * @author Retsumdk
 */

import { AgentMessage, SecurityPolicy, PolicyRule, ValidationResult } from "./types.js";

export class PolicyEnforcer {
  private policies: SecurityPolicy[] = [];

  constructor(initialPolicies: SecurityPolicy[] = []) {
    this.policies = initialPolicies;
  }

  /**
   * Add a new security policy
   */
  public addPolicy(policy: SecurityPolicy) {
    this.policies.push(policy);
  }

  /**
   * Enforce all active policies on a message
   */
  public async enforce(message: AgentMessage): Promise<ValidationResult> {
    const timestamp = new Date().toISOString();
    const result: ValidationResult = {
      valid: true,
      messageId: message.id,
      errors: [],
      warnings: [],
      timestamp,
    };

    for (const policy of this.policies) {
      if (!policy.enabled) continue;

      for (const rule of policy.rules) {
        const isViolation = this.checkRule(message, rule);

        if (isViolation) {
          if (policy.severity === "high" || policy.severity === "critical") {
            result.valid = false;
            result.errors?.push({
              path: rule.target,
              message: `Policy Violation (${policy.name}): ${rule.message}`,
              code: "POLICY_VIOLATION",
            });
          } else {
            result.warnings?.push(`Policy Warning (${policy.name}): ${rule.message}`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Check a specific rule against a message
   */
  private checkRule(message: AgentMessage, rule: PolicyRule): boolean {
    const targetValue = this.getValueByPath(message, rule.target);

    if (targetValue === undefined) return false;

    switch (rule.type) {
      case "blacklist":
        if (Array.isArray(targetValue)) {
          return targetValue.some(v => rule.values?.some(bv => String(v).includes(bv)));
        }
        return rule.values?.some(bv => String(targetValue).includes(bv)) || false;

      case "whitelist":
        if (Array.isArray(targetValue)) {
          return !targetValue.every(v => rule.values?.includes(String(v)));
        }
        return !rule.values?.includes(String(targetValue));

      case "regex":
        if (!rule.pattern) return false;
        const re = new RegExp(rule.pattern, "i");
        return re.test(String(targetValue));

      case "custom":
        // Custom rules could be implemented here or via callbacks
        return false;

      default:
        return false;
    }
  }

  /**
   * Basic JSON path evaluator
   */
  private getValueByPath(obj: any, path: string): any {
    if (path === "payload") return obj.payload;
    
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }
}
