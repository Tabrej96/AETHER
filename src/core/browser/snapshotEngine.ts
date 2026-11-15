/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Browser Snapshot System (src/core/browser/snapshotEngine.ts)
 *
 * Accessibility tree extraction, DOM snapshot capture, visual screenshot,
 * and snapshot diffing for change detection.
 *
 * Inspiration: vercel-labs/agent-browser (compact [ref=eN] snapshots),
 * microsoft/playwright (accessibility tree + screenshot APIs).
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { BrowserBackend, AccessibilityNode, DomNode } from './browserEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SnapshotMetadata {
  /** Monotonically increasing snapshot version. */
  version: number;
  /** ISO timestamp. */
  timestampIso: string;
  /** Page URL when captured. */
  url: string;
  /** Page title when captured. */
  title: string;
  /** SHA-256 hash of the serialized snapshot for quick comparison. */
  contentHash: string;
  /** Number of interactive elements detected. */
  interactiveElementCount: number;
}

export interface AccessibilitySnapshot {
  metadata: SnapshotMetadata;
  /** Compact [ref=eN] style reference map. */
  refs: Record<string, AccessibilityNode>;
  /** Total node count. */
  nodeCount: number;
  /** Estimated token cost of this snapshot. */
  estimatedTokens: number;
}

export interface DomSnapshot {
  metadata: SnapshotMetadata;
  nodes: DomNode[];
  /** Total node count. */
  nodeCount: number;
}

export interface VisualSnapshot {
  metadata: SnapshotMetadata;
  /** Path to the PNG file on disk, or null if not saved. */
  filePath: string | null;
  /** PNG size in bytes. */
  sizeBytes: number;
  /** Image dimensions. */
  dimensions?: { width: number; height: number };
}

export interface SnapshotDiff {
  /** Whether the snapshots are identical. */
  identical: boolean;
  /** Nodes present in the new snapshot but not the old. */
  added: DomNode[];
  /** Nodes present in the old snapshot but not the new. */
  removed: DomNode[];
  /** Nodes with changed attributes or text. */
  modified: Array<{ oldNode: DomNode; newNode: DomNode; changes: string[] }>;
  /** Percentage of nodes that changed. */
  changePercent: number;
}

export interface SnapshotBundle {
  accessibility: AccessibilitySnapshot;
  dom: DomSnapshot;
  visual: VisualSnapshot | null;
}

// ─── Snapshot Engine ──────────────────────────────────────────────────────────

export class SnapshotEngine {
  private snapshotVersion = 0;
  private readonly backend: BrowserBackend;
  private readonly sessionId: string;
  private readonly pageId: string;
  private readonly outputDir: string;

  constructor(
    backend: BrowserBackend,
    sessionId: string,
    pageId: string,
    options: { outputDir?: string } = {}
  ) {
    this.backend = backend;
    this.sessionId = sessionId;
    this.pageId = pageId;
    this.outputDir = options.outputDir ?? path.join(process.cwd(), '.aether', 'snapshots');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Capture a full snapshot bundle: accessibility tree, DOM, and screenshot.
   */
  async capture(saveScreenshot = false): Promise<SnapshotBundle> {
    this.snapshotVersion++;
    const url = await this.backend.currentUrl(this.pageId);
    const title = await this.backend.pageTitle(this.pageId);

    const [a11yTree, domNodes] = await Promise.all([
      this.backend.getAccessibilityTree(this.pageId),
      this.backend.getDomSnapshot(this.pageId),
    ]);

    const a11ySnapshot = this.buildAccessibilitySnapshot(a11yTree, url, title);
    const domSnapshot = this.buildDomSnapshot(domNodes, url, title);

    let visual: VisualSnapshot | null = null;
    if (saveScreenshot) {
      visual = await this.captureVisual(url, title);
    }

    return { accessibility: a11ySnapshot, dom: domSnapshot, visual };
  }

  /**
   * Capture only the accessibility tree (compact, low-token).
   */
  async captureAccessibility(): Promise<AccessibilitySnapshot> {
    this.snapshotVersion++;
    const url = await this.backend.currentUrl(this.pageId);
    const title = await this.backend.pageTitle(this.pageId);
    const tree = await this.backend.getAccessibilityTree(this.pageId);
    return this.buildAccessibilitySnapshot(tree, url, title);
  }

  /**
   * Capture only the DOM snapshot.
   */
  async captureDom(): Promise<DomSnapshot> {
    this.snapshotVersion++;
    const url = await this.backend.currentUrl(this.pageId);
    const title = await this.backend.pageTitle(this.pageId);
    const nodes = await this.backend.getDomSnapshot(this.pageId);
    return this.buildDomSnapshot(nodes, url, title);
  }

  /**
   * Capture a visual screenshot.
   */
  async captureVisual(url?: string, title?: string): Promise<VisualSnapshot> {
    const actualUrl = url ?? await this.backend.currentUrl(this.pageId);
    const actualTitle = title ?? await this.backend.pageTitle(this.pageId);

    const buf = await this.backend.screenshot(this.pageId);
    const fileName = `snap-${this.snapshotVersion}-${Date.now()}.png`;
    const filePath = path.join(this.outputDir, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, buf);

    // PNG dimensions from the buffer (IHDR chunk)
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);

    return {
      metadata: {
        version: this.snapshotVersion,
        timestampIso: new Date().toISOString(),
        url: actualUrl,
        title: actualTitle,
        contentHash: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16),
        interactiveElementCount: 0,
      },
      filePath,
      sizeBytes: buf.length,
      dimensions: { width, height },
    };
  }

  /**
   * Diff two DOM snapshots to detect changes.
   */
  diff(oldSnapshot: DomSnapshot, newSnapshot: DomSnapshot): SnapshotDiff {
    const oldMap = new Map<string, DomNode>();
    const newMap = new Map<string, DomNode>();

    for (const node of oldSnapshot.nodes) {
      oldMap.set(node.cssSelector, node);
    }
    for (const node of newSnapshot.nodes) {
      newMap.set(node.cssSelector, node);
    }

    const added: DomNode[] = [];
    const removed: DomNode[] = [];
    const modified: Array<{ oldNode: DomNode; newNode: DomNode; changes: string[] }> = [];

    for (const [selector, newNode] of newMap) {
      const oldNode = oldMap.get(selector);
      if (!oldNode) {
        added.push(newNode);
      } else {
        const changes = this.computeNodeChanges(oldNode, newNode);
        if (changes.length > 0) {
          modified.push({ oldNode, newNode, changes });
        }
        oldMap.delete(selector);
      }
    }

    for (const [, oldNode] of oldMap) {
      removed.push(oldNode);
    }

    const totalNodes = Math.max(oldSnapshot.nodeCount, newSnapshot.nodeCount);
    const changePercent = totalNodes === 0 ? 0 : Math.round(((added.length + removed.length + modified.length) / totalNodes) * 100);

    return {
      identical: added.length === 0 && removed.length === 0 && modified.length === 0,
      added,
      removed,
      modified,
      changePercent,
    };
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private buildAccessibilitySnapshot(tree: AccessibilityNode[], url: string, title: string): AccessibilitySnapshot {
    const refs: Record<string, AccessibilityNode> = {};
    let meaningfulCount = 0;

    tree.forEach((node, i) => {
      const ref = `e${i + 1}`;
      refs[ref] = { ...node, cssSelector: node.cssSelector ?? `[ref=${ref}]` };
      if (node.role && !node.hidden) meaningfulCount++;
    });

    // Compact token estimate: 1 token per header + 2 per meaningful attribute
    const estimatedTokens = tree.length + meaningfulCount * 2;
    const contentBuf = Buffer.from(JSON.stringify(refs));
    const hash = crypto.createHash('sha256').update(contentBuf).digest('hex').slice(0, 16);

    return {
      metadata: {
        version: this.snapshotVersion,
        timestampIso: new Date().toISOString(),
        url,
        title,
        contentHash: hash,
        interactiveElementCount: meaningfulCount,
      },
      refs,
      nodeCount: tree.length,
      estimatedTokens,
    };
  }

  private buildDomSnapshot(nodes: DomNode[], url: string, title: string): DomSnapshot {
    const contentBuf = Buffer.from(JSON.stringify(nodes));
    const hash = crypto.createHash('sha256').update(contentBuf).digest('hex').slice(0, 16);
    const meaningfulCount = nodes.filter((n) => n.visible && (n.attributes.id || n.attributes.name)).length;

    return {
      metadata: {
        version: this.snapshotVersion,
        timestampIso: new Date().toISOString(),
        url,
        title,
        contentHash: hash,
        interactiveElementCount: meaningfulCount,
      },
      nodes,
      nodeCount: nodes.length,
    };
  }

  private computeNodeChanges(oldNode: DomNode, newNode: DomNode): string[] {
    const changes: string[] = [];

    if (oldNode.tagName !== newNode.tagName) {
      changes.push(`tagName: ${oldNode.tagName} -> ${newNode.tagName}`);
    }

    const oldAttrs = oldNode.attributes;
    const newAttrs = newNode.attributes;
    for (const key of Object.keys({ ...oldAttrs, ...newAttrs })) {
      if (oldAttrs[key] !== newAttrs[key]) {
        changes.push(`attr.${key}: "${oldAttrs[key]}" -> "${newAttrs[key]}"`);
      }
    }

    if (oldNode.textContent !== newNode.textContent) {
      changes.push(`text: "${oldNode.textContent}" -> "${newNode.textContent}"`);
    }

    if (oldNode.visible !== newNode.visible) {
      changes.push(`visible: ${oldNode.visible} -> ${newNode.visible}`);
    }

    return changes;
  }
}
