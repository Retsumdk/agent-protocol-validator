#!/usr/bin/env bun
/**
 * agent-protocol-validator - CLI
 * @author Retsumdk
 */

import { Command } from "commander";
import { readFileSync, existsSync } from "node:fs";
import { ProtocolValidatorEngine, DEFAULT_POLICIES } from "./engine.js";
import { Logger, LogLevel } from "./logger.js";

const program = new Command();

program
  .name("agent-protocol-validator")
  .description("Enforces strict schema validation and security policy compliance for inter-agent communication messages")
  .version("1.0.0");

program
  .command("validate")
  .description("Validate a message file against configured schemas and policies")
  .argument("<file>", "Path to the message JSON file")
  .option("-p, --policy <path>", "Path to custom security policy JSON")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (file, options) => {
    if (options.verbose) {
      Logger.setLevel(LogLevel.DEBUG);
    }

    if (!existsSync(file)) {
      Logger.error(`File not found: ${file}`);
      process.exit(1);
    }

    try {
      const rawContent = readFileSync(file, "utf-8");
      const message = JSON.parse(rawContent);

      let customPolicies = [];
      if (options.policy && existsSync(options.policy)) {
        customPolicies = JSON.parse(readFileSync(options.policy, "utf-8"));
      }

      const engine = new ProtocolValidatorEngine([...DEFAULT_POLICIES, ...customPolicies]);
      
      Logger.info(`Validating message: ${message.id || "unknown"}`);
      const result = await engine.process(message);

      if (result.valid) {
        Logger.info("Validation PASSED ✅");
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(w => Logger.warn(w));
        }
      } else {
        Logger.error("Validation FAILED ❌");
        result.errors?.forEach(err => {
          Logger.error(`[${err.code}] ${err.path}: ${err.message}`);
        });
        process.exit(1);
      }

      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      Logger.error(`Failed to validate message: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command("init-policy")
  .description("Generate a default security policy template")
  .argument("<output>", "Output file path")
  .action((output) => {
    const template = JSON.stringify(DEFAULT_POLICIES, null, 2);
    try {
      // Using node:fs directly for simplicity in CLI
      const fs = require("node:fs");
      fs.writeFileSync(output, template);
      Logger.info(`Policy template created at: ${output}`);
    } catch (error: any) {
      Logger.error(`Failed to create policy template: ${error.message}`);
    }
  });

program.parse(process.argv);
