#!/usr/bin/env node

/**
 * SimpleLDAP MCP Server
 * 
 * Claude Desktop integration for SimpleLDAP Employee Management System
 * Provides tools for searching employees, viewing organization structure,
 * and accessing company information through MCP (Model Context Protocol).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { SimpleLDAPClient } from './api-client.js';
import { loadConfig } from './config/index.js';
import { ToolRegistry } from './tools/registry.js';
import { handleToolError } from './utils/error-handler.js';

// Load and validate configuration
const SERVER_CONFIG = loadConfig();

// Initialize SimpleLDAP API client
const simpleldapClient = new SimpleLDAPClient(SERVER_CONFIG.simpleldap);

// Initialize tool registry
const toolRegistry = ToolRegistry.getInstance();

// Get tool definitions for MCP
const TOOLS: Tool[] = toolRegistry.getToolDefinitions();

// Create MCP server
const server = new Server(
  {
    name: SERVER_CONFIG.server.name,
    version: SERVER_CONFIG.server.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await toolRegistry.execute(name, simpleldapClient, args);
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: handleToolError(error, `Tool ${name}`),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  console.error('🚀 SimpleLDAP MCP Server starting...');
  
  // Test API connectivity on startup
  try {
    const isHealthy = await simpleldapClient.healthCheck();
    if (isHealthy) {
      console.error(`✅ SimpleLDAP API connection successful (${SERVER_CONFIG.simpleldap.baseUrl})`);
    } else {
      console.error(`⚠️ SimpleLDAP API connection failed (${SERVER_CONFIG.simpleldap.baseUrl})`);
      console.error('   Server will start but tools may not work properly.');
    }
  } catch (error) {
    console.error(`⚠️ SimpleLDAP API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('   Server will start but tools may not work properly.');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('📡 SimpleLDAP MCP Server connected and ready!');
  console.error(`🔧 Configuration:`);
  console.error(`   - API URL: ${SERVER_CONFIG.simpleldap.baseUrl}`);
  console.error(`   - API Key: ${SERVER_CONFIG.simpleldap.apiKey.substring(0, 8)}...`);
  console.error(`   - Available tools: ${TOOLS.length}`);
  console.error('\n💡 Available tools:');
  TOOLS.forEach(tool => {
    console.error(`   - ${tool.name}: ${tool.description}`);
  });
}

// Handle process termination
process.on('SIGINT', async () => {
  console.error('\n🛑 SimpleLDAP MCP Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🛑 SimpleLDAP MCP Server shutting down...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Failed to start SimpleLDAP MCP Server:', error);
    process.exit(1);
  });
}