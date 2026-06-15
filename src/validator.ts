/**
 * agent-protocol-validator - Validator Engine
 * @author Retsumdk
 */

import { z } from "zod";
import { AgentMessage, AgentMessageSchema, ValidationResult, ValidationError } from "./types.js";

export class MessageValidator {
  private customSchemas: Map<string, z.ZodSchema> = new Map();

  constructor() {
    this.registerDefaultSchemas();
  }

  /**
   * Register default schemas for common message types
   */
  private registerDefaultSchemas() {
    this.registerSchema("ping", z.object({}));
    this.registerSchema("pong", z.object({}));
    this.registerSchema("error", z.object({
      code: z.number(),
      message: z.string(),
      data: z.any().optional(),
    }));
  }

  /**
   * Register a custom schema for a message type
   */
  public registerSchema(type: string, schema: z.ZodSchema) {
    this.customSchemas.set(type, schema);
  }

  /**
   * Validate an agent message envelope and payload
   */
  public async validate(message: any): Promise<ValidationResult> {
    const timestamp = new Date().toISOString();
    
    // 1. Validate Envelope
    const envelopeResult = AgentMessageSchema.safeParse(message);
    
    if (!envelopeResult.success) {
      return {
        valid: false,
        messageId: message.id || "unknown",
        errors: this.formatZodErrors(envelopeResult.error),
        timestamp,
      };
    }

    const validatedMessage = envelopeResult.data;
    const messageId = validatedMessage.id;

    // 2. Validate Payload based on message type
    const payloadSchema = this.customSchemas.get(validatedMessage.type);
    
    if (payloadSchema) {
      const payloadResult = payloadSchema.safeParse(validatedMessage.payload);
      
      if (!payloadResult.success) {
        return {
          valid: false,
          messageId,
          errors: this.formatZodErrors(payloadResult.error, "payload"),
          timestamp,
        };
      }
      
      // Return validated and sanitized payload
      return {
        valid: true,
        messageId,
        sanitizedPayload: payloadResult.data,
        timestamp,
      };
    }

    // If no specific schema found, consider it valid (envelope-only validation)
    return {
      valid: true,
      messageId,
      warnings: [`No specific schema registered for message type: ${validatedMessage.type}`],
      timestamp,
    };
  }

  /**
   * Format Zod errors into our standard ValidationError format
   */
  private formatZodErrors(error: z.ZodError, prefix: string = ""): ValidationError[] {
    return error.issues.map((err) => ({
      path: prefix ? `${prefix}.${err.path.join(".")}` : err.path.join("."),
      message: err.message,
      code: err.code,
    }));
  }
}
