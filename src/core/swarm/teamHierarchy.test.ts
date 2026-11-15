/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Team Hierarchy Tests
 *
 * Run via: npx tsx --test src/core/swarm/teamHierarchy.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTeamHierarchy,
  composeTeam,
  type TeamNode,
  type DelegationResult,
} from './teamHierarchy';

// ---------- Helpers ----------

function makeNode(overrides: Partial<TeamNode> = {}): TeamNode {
  return {
    agentId: `agent-${Math.random().toString(36).slice(2, 6)}`,
    name: `Agent ${Math.random().toString(36).slice(2, 4)}`,
    role: 'worker',
    childIds: [],
    capabilities: [],
    maxDirectReports: 5,
    canDelegate: false,
    escalationPath: [],
    status: 'active',
    ...overrides,
  };
}

// ============================================================
// 1. Node Management
// ============================================================

test('TeamHierarchy: addNode adds a node', () => {
  const hierarchy = createTeamHierarchy();
  const node = makeNode({ agentId: 'manager-1', role: 'manager', canDelegate: true });

  hierarchy.addNode(node);
  const retrieved = hierarchy.getNode('manager-1');

  assert.ok(retrieved !== undefined);
  assert.strictEqual(retrieved!.agentId, 'manager-1');
  assert.strictEqual(retrieved!.role, 'manager');
});

test('TeamHierarchy: addNode throws on duplicate id', () => {
  const hierarchy = createTeamHierarchy();
  hierarchy.addNode(makeNode({ agentId: 'a1' }));

  assert.throws(
    () => hierarchy.addNode(makeNode({ agentId: 'a1' })),
    /already exists/
  );
});

test('TeamHierarchy: addNode throws on nonexistent parent', () => {
  const hierarchy = createTeamHierarchy();
  assert.throws(
    () => hierarchy.addNode(makeNode({ agentId: 'a1', parentId: 'nonexistent' })),
    /Parent agent.*does not exist/
  );
});

test('TeamHierarchy: removeNode removes and disconnects', () => {
  const hierarchy = createTeamHierarchy();
  const parent = makeNode({ agentId: 'p1', role: 'manager', canDelegate: true });
  const child = makeNode({ agentId: 'c1', parentId: 'p1' });

  hierarchy.addNode(parent);
  hierarchy.addNode(child);

  const result = hierarchy.removeNode('c1');
  assert.strictEqual(result, true);
  assert.strictEqual(hierarchy.getNode('c1'), undefined);
  assert.strictEqual(hierarchy.getNode('p1')!.childIds.length, 0);
});

test('TeamHierarchy: removeNode returns false for nonexistent', () => {
  const hierarchy = createTeamHierarchy();
  assert.strictEqual(hierarchy.removeNode('nonexistent'), false);
});

// ============================================================
// 2. Parent-Child Relationships
// ============================================================

test('TeamHierarchy: parent node gets child in childIds', () => {
  const hierarchy = createTeamHierarchy();
  const parent = makeNode({ agentId: 'p1', role: 'manager', canDelegate: true });
  const child = makeNode({ agentId: 'c1', parentId: 'p1' });

  hierarchy.addNode(parent);
  hierarchy.addNode(child);

  assert.ok(hierarchy.getNode('p1')!.childIds.includes('c1'));
});

test('TeamHierarchy: getDirectReports returns active children', () => {
  const hierarchy = createTeamHierarchy();
  const parent = makeNode({ agentId: 'p1', role: 'manager', canDelegate: true });
  const child1 = makeNode({ agentId: 'c1', parentId: 'p1', status: 'active' });
  const child2 = makeNode({ agentId: 'c2', parentId: 'p1', status: 'offline' });

  hierarchy.addNode(parent);
  hierarchy.addNode(child1);
  hierarchy.addNode(child2);

  const reports = hierarchy.getDirectReports('p1');
  assert.strictEqual(reports.length, 1);
  assert.strictEqual(reports[0]!.agentId, 'c1');
});

test('TeamHierarchy: getManager returns parent', () => {
  const hierarchy = createTeamHierarchy();
  const parent = makeNode({ agentId: 'p1' });
  const child = makeNode({ agentId: 'c1', parentId: 'p1' });

  hierarchy.addNode(parent);
  hierarchy.addNode(child);

  const manager = hierarchy.getManager('c1');
  assert.ok(manager !== undefined);
  assert.strictEqual(manager!.agentId, 'p1');
});

test('TeamHierarchy: getSubtree returns all descendants', () => {
  const hierarchy = createTeamHierarchy();
  const root = makeNode({ agentId: 'root', role: 'manager', canDelegate: true });
  const child = makeNode({ agentId: 'child', parentId: 'root', role: 'manager', canDelegate: true });
  const grandchild = makeNode({ agentId: 'grandchild', parentId: 'child' });

  hierarchy.addNode(root);
  hierarchy.addNode(child);
  hierarchy.addNode(grandchild);

  const subtree = hierarchy.getSubtree('root');
  assert.strictEqual(subtree.length, 3);
});

// ============================================================
// 3. Delegation
// ============================================================

test('TeamHierarchy: delegate finds best matching agent', () => {
  const hierarchy = createTeamHierarchy();
  const manager = makeNode({ agentId: 'm1', role: 'manager', canDelegate: true, capabilities: ['coordination'] });
  const worker = makeNode({ agentId: 'w1', role: 'worker', capabilities: ['coding', 'testing'] });
  const specialist = makeNode({ agentId: 's1', role: 'specialist', capabilities: ['security', 'auditing'] });

  hierarchy.addNode(manager);
  hierarchy.addNode(worker);
  hierarchy.addNode(specialist);

  const result = hierarchy.delegate({
    requestId: 'req-1',
    fromAgentId: 'm1',
    taskDescription: 'Security review',
    requiredCapabilities: ['security'],
    priority: 1,
    maxDepth: 2,
    currentDepth: 0,
  });

  assert.strictEqual(result.delegated, true);
  assert.strictEqual(result.delegatedTo, 's1');
  assert.ok(result.chain.includes('m1'));
  assert.ok(result.chain.includes('s1'));
});

test('TeamHierarchy: delegate returns false for nonexistent source', () => {
  const hierarchy = createTeamHierarchy();
  const result = hierarchy.delegate({
    requestId: 'req-1',
    fromAgentId: 'nonexistent',
    taskDescription: 'Task',
    requiredCapabilities: [],
    priority: 1,
    maxDepth: 2,
    currentDepth: 0,
  });

  assert.strictEqual(result.delegated, false);
  assert.ok(result.reason?.includes('not found'));
});

test('TeamHierarchy: delegate respects maxDepth', () => {
  const hierarchy = createTeamHierarchy();
  const manager = makeNode({ agentId: 'm1', role: 'manager', canDelegate: true, capabilities: ['coordination'] });
  hierarchy.addNode(manager);

  const result = hierarchy.delegate({
    requestId: 'req-1',
    fromAgentId: 'm1',
    taskDescription: 'Task',
    requiredCapabilities: [],
    priority: 1,
    maxDepth: 0,
    currentDepth: 0,
  });

  assert.strictEqual(result.delegated, false);
  assert.ok(result.reason?.includes('depth exceeded'));
});

test('TeamHierarchy: delegate respects cannotDelegate', () => {
  const hierarchy = createTeamHierarchy();
  const worker = makeNode({ agentId: 'w1', role: 'worker', canDelegate: false, capabilities: ['coding'] });
  hierarchy.addNode(worker);

  const result = hierarchy.delegate({
    requestId: 'req-1',
    fromAgentId: 'w1',
    taskDescription: 'Task',
    requiredCapabilities: [],
    priority: 1,
    maxDepth: 2,
    currentDepth: 0,
  });

  assert.strictEqual(result.delegated, false);
});

test('TeamHierarchy: delegate excludes self', () => {
  const hierarchy = createTeamHierarchy();
  const manager = makeNode({ agentId: 'm1', role: 'manager', canDelegate: true, capabilities: ['coding'] });
  hierarchy.addNode(manager);

  // The manager has 'coding' capability, so it should match itself but not delegate to self
  const result = hierarchy.delegate({
    requestId: 'req-1',
    fromAgentId: 'm1',
    taskDescription: 'Task',
    requiredCapabilities: ['coding'],
    priority: 1,
    maxDepth: 2,
    currentDepth: 0,
  });

  // Manager can't delegate to itself
  assert.strictEqual(result.delegatedTo, undefined);
});

test('TeamHierarchy: findBestAgent finds best capability match', () => {
  const hierarchy = createTeamHierarchy();
  const a1 = makeNode({ agentId: 'a1', capabilities: ['coding'] });
  const a2 = makeNode({ agentId: 'a2', capabilities: ['coding', 'testing', 'security'] });
  const a3 = makeNode({ agentId: 'a3', capabilities: ['design'] });

  hierarchy.addNode(a1);
  hierarchy.addNode(a2);
  hierarchy.addNode(a3);

  const best = hierarchy.findBestAgent(['coding', 'security']);
  assert.ok(best !== undefined);
  assert.strictEqual(best.agentId, 'a2');
});

// ============================================================
// 4. Escalation
// ============================================================

test('TeamHierarchy: getEscalationPath returns chain to root', () => {
  const hierarchy = createTeamHierarchy();
  const root = makeNode({ agentId: 'root' });
  const manager = makeNode({ agentId: 'manager', parentId: 'root' });
  const worker = makeNode({ agentId: 'worker', parentId: 'manager' });

  hierarchy.addNode(root);
  hierarchy.addNode(manager);
  hierarchy.addNode(worker);

  const path = hierarchy.getEscalationPath('worker');
  assert.deepStrictEqual(path, ['worker', 'manager', 'root']);
});

test('TeamHierarchy: getEscalationPath for root returns just root', () => {
  const hierarchy = createTeamHierarchy();
  hierarchy.addNode(makeNode({ agentId: 'root' }));

  const path = hierarchy.getEscalationPath('root');
  assert.deepStrictEqual(path, ['root']);
});

test('TeamHierarchy: escalate returns parent', () => {
  const hierarchy = createTeamHierarchy();
  const root = makeNode({ agentId: 'root' });
  const manager = makeNode({ agentId: 'manager', parentId: 'root' });

  hierarchy.addNode(root);
  hierarchy.addNode(manager);

  const escalated = hierarchy.escalate('manager', 'Cannot handle');
  assert.strictEqual(escalated, 'root');
});

test('TeamHierarchy: escalate returns undefined for root', () => {
  const hierarchy = createTeamHierarchy();
  hierarchy.addNode(makeNode({ agentId: 'root' }));

  const escalated = hierarchy.escalate('root', 'Cannot handle');
  assert.strictEqual(escalated, undefined);
});

// ============================================================
// 5. Role-based Queries
// ============================================================

test('TeamHierarchy: getActiveManagers returns managers', () => {
  const hierarchy = createTeamHierarchy();
  hierarchy.addNode(makeNode({ agentId: 'm1', role: 'manager', status: 'active' }));
  hierarchy.addNode(makeNode({ agentId: 'm2', role: 'manager', status: 'active' }));
  hierarchy.addNode(makeNode({ agentId: 'w1', role: 'worker', status: 'active' }));

  const managers = hierarchy.getActiveManagers();
  assert.strictEqual(managers.length, 2);
  assert.ok(managers.every((m) => m.role === 'manager'));
});

test('TeamHierarchy: getLeafWorkers returns workers with no children', () => {
  const hierarchy = createTeamHierarchy();
  // w1 is a true leaf: worker with no children
  hierarchy.addNode(makeNode({ agentId: 'w1', role: 'worker', childIds: [] }));
  // w2 is NOT a leaf because it has w3 as a child
  hierarchy.addNode(makeNode({ agentId: 'w2', role: 'worker', childIds: ['w3'] }));
  // w3 is a leaf because it has no children
  hierarchy.addNode(makeNode({ agentId: 'w3', role: 'worker' }));

  const leaves = hierarchy.getLeafWorkers();
  assert.strictEqual(leaves.length, 2);
  assert.ok(leaves.some((l) => l.agentId === 'w1'));
  assert.ok(leaves.some((l) => l.agentId === 'w3'));
});

test('TeamHierarchy: canAddDirectReport checks capacity', () => {
  const hierarchy = createTeamHierarchy();
  const manager = makeNode({ agentId: 'm1', role: 'manager', maxDirectReports: 2, childIds: ['c1', 'c2'] });
  hierarchy.addNode(manager);

  assert.strictEqual(hierarchy.canAddDirectReport('m1'), false);

  const emptyManager = makeNode({ agentId: 'm2', role: 'manager', maxDirectReports: 2 });
  hierarchy.addNode(emptyManager);
  assert.strictEqual(hierarchy.canAddDirectReport('m2'), true);
});

// ============================================================
// 6. Validation
// ============================================================

test('TeamHierarchy: validate detects no issues for valid hierarchy', () => {
  const hierarchy = createTeamHierarchy();
  const root = makeNode({ agentId: 'root', role: 'manager', maxDirectReports: 5 });
  const child = makeNode({ agentId: 'child', parentId: 'root', role: 'worker' });

  hierarchy.addNode(root);
  hierarchy.addNode(child);

  const result = hierarchy.validate();
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

test('TeamHierarchy: addNode throws on nonexistent parent prevents invalid state', () => {
  const hierarchy = createTeamHierarchy();
  assert.throws(
    () => hierarchy.addNode(makeNode({ agentId: 'a1', parentId: 'nonexistent' })),
    /Parent agent.*does not exist/
  );

  // Node was not added due to the validation error
  assert.strictEqual(hierarchy.getNode('a1'), undefined);
});

test('TeamHierarchy: validate detects manager capacity overflow', () => {
  const hierarchy = createTeamHierarchy();
  // Add a manager that exceeds capacity by having too many direct reports
  const manager = makeNode({ agentId: 'm1', role: 'manager', maxDirectReports: 2, childIds: ['c1', 'c2', 'c3'] });
  hierarchy.addNode(manager);

  const result = hierarchy.validate();
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('exceeds max')));
});

// ============================================================
// 7. Team Composition
// ============================================================

test('composeTeam: creates team with proper parent-child relationships', () => {
  const members = [
    { agentId: 'm1', role: 'manager' as const, capabilities: ['coordination'] },
    { agentId: 'w1', role: 'worker' as const, capabilities: ['coding'] },
    { agentId: 'w2', role: 'worker' as const, capabilities: ['testing'] },
  ];

  const team = composeTeam(members, { maxSpan: 2 });

  const manager = team.find((n) => n.agentId === 'm1');
  assert.ok(manager !== undefined);
  assert.ok(manager!.childIds.includes('w1'));
  assert.ok(manager!.childIds.includes('w2'));
});

test('composeTeam: assigns workers to managers round-robin', () => {
  const members = [
    { agentId: 'm1', role: 'manager' as const, capabilities: [] },
    { agentId: 'm2', role: 'manager' as const, capabilities: [] },
    { agentId: 'w1', role: 'worker' as const, capabilities: [] },
    { agentId: 'w2', role: 'worker' as const, capabilities: [] },
    { agentId: 'w3', role: 'worker' as const, capabilities: [] },
  ];

  const team = composeTeam(members);

  const m1 = team.find((n) => n.agentId === 'm1')!;
  const m2 = team.find((n) => n.agentId === 'm2')!;

  // w1 -> m1, w2 -> m2, w3 -> m1
  assert.ok(m1.childIds.includes('w1'));
  assert.ok(m2.childIds.includes('w2'));
  assert.ok(m1.childIds.includes('w3'));
});

// ============================================================
// 8. Clear
// ============================================================

test('TeamHierarchy: clear removes all nodes', () => {
  const hierarchy = createTeamHierarchy();
  hierarchy.addNode(makeNode({ agentId: 'a1' }));
  hierarchy.addNode(makeNode({ agentId: 'a2' }));

  hierarchy.clear();
  assert.strictEqual(hierarchy.getAllNodes().length, 0);
});

// ============================================================
// 9. Edge Cases
// ============================================================

test('TeamHierarchy: getNode returns undefined for empty hierarchy', () => {
  const hierarchy = createTeamHierarchy();
  assert.strictEqual(hierarchy.getNode('nonexistent'), undefined);
});

test('TeamHierarchy: empty operations are safe', () => {
  const hierarchy = createTeamHierarchy();
  assert.strictEqual(hierarchy.getAllNodes().length, 0);
  assert.strictEqual(hierarchy.getActiveManagers().length, 0);
  assert.strictEqual(hierarchy.getLeafWorkers().length, 0);
  assert.strictEqual(hierarchy.removeNode('x'), false);
  assert.deepStrictEqual(hierarchy.validate(), { valid: true, errors: [] });
});
