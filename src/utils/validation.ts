/**
 * @file Schema validation utilities for MCP requests
 * @module utils/validation
 * 
 * @remarks
 * This module provides JSON Schema validation for MCP requests using AJV.
 * It includes custom error messages for better developer experience and
 * specific validation for sampling requests according to the MCP specification.
 * 
 * The validation ensures that requests conform to the expected structure
 * before they are processed by the server.
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling} MCP Sampling Specification
 * @see {@link https://ajv.js.org/} AJV JSON Schema Validator
 */

import type { ErrorObject } from "ajv";
import {Ajv} from "ajv";
import type { JSONSchema7 } from "json-schema";

/**
 * Extended AJV error parameters for better type safety
 * @internal
 */
interface AjvErrorParams {
  /** Missing property name for 'required' errors */
  missingProperty?: string;
  /** Limit value for min/max errors */
  limit?: number;
  /** Additional error parameters */
  [key: string]: unknown;
}

/**
 * Extended error object with typed parameters
 * @internal
 */
interface ExtendedErrorObject extends ErrorObject {
  params: AjvErrorParams;
  instancePath: string;
}

/**
 * AJV instance configured for MCP validation
 * @internal
 */
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  strictSchema: false,
  strictTypes: false,
});

/**
 * Validates data against a JSON schema and throws detailed errors on validation failure
 * 
 * @param data - The data to validate
 * @param schema - The JSON Schema to validate against
 * @throws {Error} Thrown with detailed validation error messages
 * 
 * @remarks
 * This function provides user-friendly error messages for common validation failures.
 * It maps technical schema violations to human-readable error descriptions.
 * 
 * @example
 * ```typescript
 * const schema: JSONSchema7 = {
 *   type: 'object',
 *   required: ['name'],
 *   properties: {
 *     name: { type: 'string' }
 *   }
 * };
 * 
 * try {
 *   validateWithErrors({ age: 25 }, schema);
 * } catch (error) {
 *   console.error(error.message); // "Missing required field: name"
 * }
 * ```
 */
export function validateWithErrors(data: unknown, schema: JSONSchema7): void {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    const errors = validate.errors
      ?.map((e: ErrorObject) => {
        const extendedError = e as ExtendedErrorObject;
        if (e.keyword === "required") {
          const property = extendedError.params.missingProperty;
          // Map property names to expected error messages
          const errorMap: Record<string, string> = {
            params: "Request must have params",
            messages: "Request must have at least one message",
            content: "Message must have a content object",
            text: "Text content must have a string text field",
            data: "Image content must have a base64 data field",
            mimeType: "Image content must have a mimeType field",
            type: "Message content must have a type field",
            title: "Missing required field: title",
            description: "Missing required field: description",
            static: "Missing required field: static instruction",
            dynamic: "Missing required field: dynamic instruction",
            state: "Missing required field: state",
            input_type: "Missing required field: input type",
            output_type: "Missing required field: output type",
          };
          return errorMap[property || ''] || `Missing required field: ${property || 'unknown'}`;
        }
        if (e.keyword === "minimum" && extendedError.params.limit === 1) {
          if (extendedError.instancePath === "/params/maxTokens") {
            return "maxTokens must be a positive number";
          }
          if (extendedError.instancePath === "/params/messages") {
            return "Request must have at least one message";
          }
        }
        if (e.keyword === "maximum" && extendedError.params.limit === 1) {
          if (extendedError.instancePath === "/params/temperature") {
            return "Temperature must be between 0 and 1";
          }
          if (extendedError.instancePath?.includes("Priority")) {
            return "Priority values must be between 0 and 1";
          }
        }
        if (e.keyword === "enum") {
          if (extendedError.instancePath === "/params/includeContext") {
            return 'includeContext must be one of: "none", "thisServer", or "allServers"';
          }
          if (extendedError.instancePath?.includes("/role")) {
            return 'Message role must be either "user" or "assistant"';
          }
          if (extendedError.instancePath?.includes("/type")) {
            return 'Content type must be either "text" or "image"';
          }
        }
        if (e.keyword === "type") {
          if (extendedError.instancePath?.includes("/text")) {
            return "Text content must be a string";
          }
        }
        if (
          e.keyword === "minItems" &&
          extendedError.instancePath === "/params/messages"
        ) {
          return "Request must have at least one message";
        }
        return e.message || "Unknown validation error";
      })
      .join(", ");
    throw new Error(errors);
  }
}

/**
 * JSON Schema for validating MCP sampling requests
 * 
 * @remarks
 * This schema enforces the structure defined in the MCP sampling specification.
 * It validates:
 * - Required method field (must be "sampling/createMessage")
 * - Required params object with messages array
 * - Message structure with role and content
 * - Optional parameters like maxTokens, temperature, and model preferences
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling#request} MCP Sampling Request Schema
 * @internal
 */
const samplingRequestSchema: JSONSchema7 = {
  type: "object",
  required: ["method", "params"],
  properties: {
    method: { type: "string", enum: ["sampling/createMessage"] },
    params: {
      type: "object",
      required: ["messages"],
      properties: {
        messages: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["role", "content"],
            properties: {
              role: { type: "string", enum: ["user", "assistant"] },
              content: {
                oneOf: [
                  {
                    type: "object",
                    required: ["type", "text"],
                    properties: {
                      type: { type: "string", enum: ["text"] },
                      text: { type: "string" },
                    },
                    additionalProperties: false,
                  },
                  {
                    type: "object",
                    required: ["type", "data", "mimeType"],
                    properties: {
                      type: { type: "string", enum: ["image"] },
                      data: { type: "string" },
                      mimeType: { type: "string" },
                    },
                    additionalProperties: false,
                  },
                ],
              },
            },
          },
        },
        maxTokens: { type: "number", minimum: 1 },
        temperature: { type: "number", minimum: 0, maximum: 1 },
        includeContext: {
          type: "string",
          enum: ["none", "thisServer", "allServers"],
        },
        modelPreferences: {
          type: "object",
          properties: {
            costPriority: { type: "number", minimum: 0, maximum: 1 },
            speedPriority: { type: "number", minimum: 0, maximum: 1 },
            intelligencePriority: { type: "number", minimum: 0, maximum: 1 },
          },
        },
        _meta: {
          type: "object",
          properties: {
            callback: { type: "string" },
            responseSchema: { type: "object" },
          },
        },
        arguments: { type: "object" },
      },
      additionalProperties: false,
    },
  },
};

/**
 * Validates an MCP sampling request against the specification schema
 * 
 * @param request - The request object to validate
 * @throws {Error} Thrown with detailed validation errors if request is invalid
 * 
 * @remarks
 * This function specifically validates sampling/createMessage requests
 * according to the MCP specification. It ensures the request has:
 * - Correct method name
 * - Valid message structure
 * - Proper content types (text or image)
 * - Valid optional parameters
 * 
 * @example
 * ```typescript
 * const request = {
 *   method: 'sampling/createMessage',
 *   params: {
 *     messages: [{
 *       role: 'user',
 *       content: { type: 'text', text: 'Hello!' }
 *     }],
 *     maxTokens: 100
 *   }
 * };
 * 
 * validateRequest(request); // No error thrown
 * ```
 * 
 * @see {@link https://modelcontextprotocol.io/specification/2025-06-18/client/sampling} MCP Sampling Specification
 */
export function validateRequest(request: unknown): void {
  validateWithErrors(request, samplingRequestSchema);
}
