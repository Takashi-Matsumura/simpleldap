/**
 * Configuration management with validation
 */

import { z } from 'zod';
import { MCPServerConfig } from '../types.js';

const configSchema = z.object({
  simpleldap: z.object({
    baseUrl: z.string().url(),
    apiKey: z.string().min(1),
    timeout: z.number().positive().max(60000)
  }),
  server: z.object({
    name: z.string(),
    version: z.string()
  })
});

export function loadConfig(): MCPServerConfig {
  const config = {
    simpleldap: {
      baseUrl: process.env.SIMPLELDAP_API_URL || 'http://localhost:3000',
      apiKey: process.env.SIMPLELDAP_API_KEY || 'test-api-key-1',
      timeout: parseInt(process.env.SIMPLELDAP_TIMEOUT || '10000')
    },
    server: {
      name: 'simpleldap-mcp-server',
      version: '1.0.0'
    }
  };
  
  try {
    return configSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('⚠️ Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export function validateApiUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}