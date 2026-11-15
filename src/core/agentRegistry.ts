/**
 * AETHER Agent Registry
 *
 * Indexes and coordinates ALL agents: 71 ECC + 20 AETHER native.
 * Provides agent discovery, routing, and lifecycle management.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface AgentDefinition {
  id: string;
  name: string;
  source: 'aether-native' | 'ecc' | 'external';
  description: string;
  capabilities: string[];
  model: string;
  color?: string;
  dependencies: string[];
  outputs: string[];
  acceptanceCriteria: string[];
  filePath: string;
}

export class AgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();
  private rootDir: string;

  constructor(rootDir: string = '.') {
    this.rootDir = rootDir;
    this.loadAllAgents();
  }

  /**
   * Load all agents from filesystem
   */
  private loadAllAgents(): void {
    // Load AETHER native agents
    const aetherAgentsDir = path.join(this.rootDir, '.claude', 'agents');
    this.loadAgentsFromDir(aetherAgentsDir, 'aether-native');

    // Load ECC agents
    const eccAgentsDir = path.join(this.rootDir, '.ecc-scout', 'agents');
    if (fs.existsSync(eccAgentsDir)) {
      this.loadAgentsFromDir(eccAgentsDir, 'ecc');
    }
  }

  /**
   * Load agents from a directory
   */
  private loadAgentsFromDir(dir: string, source: 'aether-native' | 'ecc' | 'external'): void {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'README.md');

    for (const file of files) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const agent = this.parseAgentFile(file, content, source, filePath);
      if (agent) {
        this.agents.set(agent.id, agent);
      }
    }
  }

  /**
   * Parse agent definition from markdown file
   */
  private parseAgentFile(fileName: string, content: string, source: string, filePath: string): AgentDefinition | null {
    const id = fileName.replace('.md', '');
    const nameMatch = content.match(/name:\s*(.+)/i);
    const descMatch = content.match(/description:\s*(.+)/i);
    const modelMatch = content.match(/model:\s*(\w+)/i);
    const colorMatch = content.match(/color:\s*(\w+)/i);
    const toolsMatch = content.match(/tools:\s*(.+)/i);

    const name = nameMatch ? nameMatch[1].trim() : id;
    const description = descMatch ? descMatch[1].trim() : '';
    const model = modelMatch ? modelMatch[1].trim() : 'sonnet';
    const color = colorMatch ? colorMatch[1].trim() : undefined;
    const tools = toolsMatch ? toolsMatch[1].trim().split(',').map(t => t.trim()) : [];

    // Extract capabilities from description and content
    const capabilities = this.extractCapabilities(content);

    // Determine dependencies
    const dependencies = this.inferDependencies(id, capabilities);

    // Determine outputs
    const outputs = this.inferOutputs(id);

    // Extract acceptance criteria
    const acceptanceCriteria = this.extractAcceptanceCriteria(content);

    return {
      id,
      name,
      source: source as 'aether-native' | 'ecc' | 'external',
      description,
      capabilities,
      model,
      color,
      dependencies,
      outputs,
      acceptanceCriteria,
      filePath,
    };
  }

  /**
   * Extract capabilities from agent content
   */
  private extractCapabilities(content: string): string[] {
    const capabilities: string[] = [];

    // Look for capability lists
    const capabilityPatterns = [
      /# Capabilities\s+([\s\S]+?)(?:\n#|\n---)/i,
      /capabilities:\s+([\s\S]+?)(?:\n\w+:|$)/i,
      /- ([A-Z][a-zA-Z\s]+)\n/g,
    ];

    for (const pattern of capabilityPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const items = match[1].split('\n').map(line => line.replace(/^-\s*/, '').trim()).filter(Boolean);
        capabilities.push(...items);
      }
    }

    return [...new Set(capabilities)].slice(0, 10);
  }

  /**
   * Infer agent dependencies
   */
  private inferDependencies(agentId: string, capabilities: string[]): string[] {
    const deps: string[] = [];

    // Database-related agents need database-architect
    if (capabilities.some(c => c.toLowerCase().includes('database') || c.toLowerCase().includes('sql'))) {
      deps.push('database-architect');
    }

    // Backend agents need security
    if (capabilities.some(c => c.toLowerCase().includes('api') || c.toLowerCase().includes('backend'))) {
      deps.push('security-engineer');
    }

    // Frontend agents need backend
    if (capabilities.some(c => c.toLowerCase().includes('frontend') || c.toLowerCase().includes('ui') || c.toLowerCase().includes('react'))) {
      deps.push('backend-engineer');
    }

    // QA needs everything
    if (capabilities.some(c => c.toLowerCase().includes('test') || c.toLowerCase().includes('qa') || c.toLowerCase().includes('quality'))) {
      deps.push('backend-engineer', 'frontend-engineer', 'database-architect');
    }

    // DevOps needs tests
    if (capabilities.some(c => c.toLowerCase().includes('deploy') || c.toLowerCase().includes('devops') || c.toLowerCase().includes('docker'))) {
      deps.push('testing-engineer', 'qa-engineer');
    }

    return deps;
  }

  /**
   * Infer agent outputs
   */
  private inferOutputs(agentId: string): string[] {
    const outputMap: Record<string, string[]> = {
      'database-architect': ['src/database/schemas/schema.sql', 'src/database/migrations/', 'src/database/seeds/'],
      'backend-engineer': ['src/backend/src/server.ts', 'src/backend/src/routes/', 'src/backend/src/services/'],
      'frontend-engineer': ['src/frontend/src/App.tsx', 'src/frontend/src/pages/', 'src/frontend/src/components/'],
      'security-engineer': ['src/backend/src/middleware/auth.ts', 'src/backend/src/routes/auth.ts'],
      'testing-engineer': ['src/tests/unit/', 'src/tests/integration/', 'src/tests/e2e/'],
      'devops-engineer': ['docker-compose.yml', 'Dockerfile', '.github/workflows/'],
      'documentation-engineer': ['README.md', 'API.md', 'DEPLOYMENT.md'],
      'product-researcher': ['research/industry-intelligence.json', 'research/competitors.json'],
      'system-architect': ['docs/architecture.md', 'docs/api-spec.yaml', 'src/database/schemas/schema.sql'],
      'qa-engineer': ['src/tests/', 'test-report.json'],
      'deployment-engineer': ['Dockerfile', 'docker-compose.yml', 'k8s/', '.github/workflows/'],
    };

    return outputMap[agentId] || ['generated/'];
  }

  /**
   * Extract acceptance criteria from content
   */
  private extractAcceptanceCriteria(content: string): string[] {
    const criteria: string[] = [];

    // Look for rules section
    const rulesMatch = content.match(/# Rules?\s+([\s\S]+?)(?:\n#|\n---)/i);
    if (rulesMatch) {
      const rules = rulesMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
      criteria.push(...rules.map(r => r.replace(/^-\s*/, '').trim()));
    }

    // Look for output section
    const outputMatch = content.match(/# Output\s+([\s\S]+?)(?:\n#|\n---)/i);
    if (outputMatch) {
      const outputs = outputMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
      criteria.push(...outputs.map(o => o.replace(/^-\s*/, '').trim()));
    }

    return criteria;
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  /**
   * Get agents by source
   */
  getAgentsBySource(source: 'aether-native' | 'ecc' | 'external'): AgentDefinition[] {
    return this.getAllAgents().filter(a => a.source === source);
  }

  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: string): AgentDefinition[] {
    const lower = capability.toLowerCase();
    return this.getAllAgents().filter(a => a.capabilities.some(c => c.toLowerCase().includes(lower)));
  }

  /**
   * Get total agent count
   */
  getTotalCount(): number {
    return this.agents.size;
  }

  /**
   * Get statistics
   */
  getStats(): { total: number; aetherNative: number; ecc: number; external: number } {
    const all = this.getAllAgents();
    return {
      total: all.length,
      aetherNative: all.filter(a => a.source === 'aether-native').length,
      ecc: all.filter(a => a.source === 'ecc').length,
      external: all.filter(a => a.source === 'external').length,
    };
  }

  /**
   * Generate agent deployment plan for a project
   */
  generateDeploymentPlan(pillarIds: string[]): Array<{ agentId: string; pillar: string; phase: number }> {
    const plan: Array<{ agentId: string; pillar: string; phase: number }> = [];

    const pillarAgentMap: Record<string, string[]> = {
      'P1': ['database-architect'],
      'P2': ['security-engineer'],
      'P3': ['backend-engineer'],
      'P4': ['frontend-engineer'],
      'P5': ['business-logic-architect', 'backend-engineer'],
      'P6': ['api-integration', 'backend-engineer'],
      'P7': ['api-integration', 'backend-engineer'],
      'P8': ['frontend-engineer', 'ui-ux-designer'],
      'P9': ['security-engineer', 'ecc/agent-security-hardening'],
      'P10': ['testing-engineer', 'qa-engineer', 'ecc/e2e-runner'],
      'P11': ['devops-engineer', 'deployment-engineer'],
      'P12': ['documentation-engineer', 'ecc/docs-lookup'],
    };

    const phaseMap: Record<string, number> = {
      'P1': 1, 'P2': 1, 'P3': 2, 'P4': 2, 'P5': 3, 'P6': 4, 'P7': 4,
      'P8': 5, 'P9': 3, 'P10': 6, 'P11': 7, 'P12': 8,
    };

    for (const pillar of pillarIds) {
      const agents = pillarAgentMap[pillar] || ['general-engineer'];
      const phase = phaseMap[pillar] || 5;
      for (const agentId of agents) {
        plan.push({ agentId, pillar, phase });
      }
    }

    return plan.sort((a, b) => a.phase - b.phase);
  }
}

export default AgentRegistry;
