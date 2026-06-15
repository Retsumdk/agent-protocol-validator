/**
 * agent-protocol-validator - Library Entry Point
 * @author Retsumdk
 */

export * from "./types.js";
export * from "./validator.js";
export * from "./policy.js";
export * from "./engine.js";
export * from "./logger.js";

import { ProtocolValidatorEngine, DEFAULT_POLICIES } from "./engine.js";

/**
 * Convenience function to create a pre-configured engine
 */
export function createValidator(customPolicies = []) {
  const policies = [...DEFAULT_POLICIES, ...customPolicies];
  return new ProtocolValidatorEngine(policies);
}
