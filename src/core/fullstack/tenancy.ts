/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — FULL-STACK ENGINEERING INTELLIGENCE · MULTI-TENANCY
 * (src/core/fullstack/tenancy.ts) · Created by Tabrej
 *
 * Directive §6: "Treat tenant isolation as a security boundary, not a UI
 * feature." For SaaS / multi-org systems: identify tenant boundaries, enforce
 * tenant-scoped data access, validate org membership, prevent cross-tenant
 * reads/writes, test isolation, audit administrative access.
 *
 * This is a deterministic isolation model: a query/operation is expressed as
 * a TenancyAccess, and enforceTenancy returns the concrete guards that MUST
 * be applied — the WHERE-clause tenant scoping, the membership check, the
 * resource-ownership check — and flags the classes of leak (missing tenant
 * predicate, un-scoped admin, cross-tenant reference) that cross-tenant data
 * would flow through.
 */

import { scanSecurityAndTrustBoundaries } from '../securityEngine';

export type TenancyModel = 'SHARED' | 'SHARED_SCOPED' | 'DEDICATED_DATABASE' | 'DEDICATED_SCHEMA';

export interface TenantContext {
  tenantId: string;
  userId?: string;
  /** is this caller an admin of the tenant? */
  isAdmin?: boolean;
  /** organizations the user is a member of (membership must be validated) */
  memberOrgs?: string[];
}

export interface TenancyAccess {
  operation: 'READ' | 'WRITE' | 'ADMIN';
  /** the table/resource being touched */
  resource: string;
  /** is the query/operation scoped to the tenant already? (the codegen answer) */
  tenantScoped: boolean;
  /** does it include an ownership / membership predicate? */
  ownerScoped: boolean;
  /** does it read a resource by a globally-unique id that belongs to a tenant? */
  crossesTenantReference?: boolean;
  /** is the caller acting on an org they may not belong to? */
  targetOrg?: string;
}

export interface TenancyGuard {
  kind: 'TENANT_PREDICATE' | 'MEMBERSHIP_CHECK' | 'OWNERSHIP_CHECK' | 'ADMIN_AUDIT' | 'REF_RESOLUTION';
  required: boolean;
  /** the concrete predicate that must be present */
  expression: string;
}

export interface TenancyReport {
  ok: boolean;
  leaks: string[]; // classes of cross-tenant data flow this access would create
  guards: TenancyGuard[];
}

/**
 * Deterministic isolation check. The core rule the directive names: a WRITE or
 * cross-tenant reference on a SHARED model MUST carry a tenant predicate, or
 * it is a leak.
 */
export function enforceTenancy(ctx: TenantContext, access: TenancyAccess, model: TenancyModel): TenancyReport {
  const leaks: string[] = [];
  const guards: TenancyGuard[] = [];

  // every non-dedicated model depends on row-level scoping
  const needsPredicate = model !== 'DEDICATED_DATABASE' && model !== 'DEDICATED_SCHEMA';
  const guard = (g: Omit<TenancyGuard, 'required'>, req: boolean) =>
    guards.push({ ...g, required: req });

  if (needsPredicate) {
    guard({ kind: 'TENANT_PREDICATE', expression: `WHERE tenant_id = '${ctx.tenantId}'` }, !access.tenantScoped);
    if (!access.tenantScoped) leaks.push(`${access.operation} on '${access.resource}' has no tenant_id predicate — cross-tenant ${access.operation === 'WRITE' ? 'write' : 'read'} is possible`);
  }

  // WRITE operations additionally need ownership / membership scoping
  if (access.operation === 'WRITE') {
    guard({ kind: 'OWNERSHIP_CHECK', expression: `AND owner_id = '${ctx.userId ?? '<caller>'}' (or admin-of-tenant)` }, !access.ownerScoped);
    if (!access.ownerScoped) leaks.push(`${access.resource} write is not ownership-scoped — a non-owner member could mutate another member's record`);
  }

  // admin operations: audit + membership of the acting org
  if (access.operation === 'ADMIN') {
    guard({ kind: 'ADMIN_AUDIT', expression: `caller is admin-of-tenant AND org membership valid` }, true);
    if (!ctx.isAdmin) leaks.push(`ADMIN on '${access.resource}' requested by a non-admin caller`);
    if (access.targetOrg && ctx.memberOrgs && !ctx.memberOrgs.includes(access.targetOrg)) {
      leaks.push(`action targets org '${access.targetOrg}' which the caller is not a member of`);
    }
    guard({ kind: 'MEMBERSHIP_CHECK', expression: `caller.memberOrgs ⊇ {${access.targetOrg ?? ctx.tenantId}}` }, true);
  }

  // a resource referenced by a global id (UUID) that spans tenants must be
  // resolved against the caller's tenant before use (break the IDOR)
  if (access.crossesTenantReference) {
    guard({ kind: 'REF_RESOLUTION', expression: `id -> row -> assert row.tenant_id == '${ctx.tenantId}' before return` }, true);
    leaks.push(`cross-tenant reference on '${access.resource}' resolved without a tenant assertion (insecure direct object reference)`);
  }

  const ok = leaks.length === 0 && guards.every((g) => !g.required);
  return { ok, leaks, guards };
}

/**
 * A threat-model snippet for a tenant system, produced by the Security Engine
 * so P11 composes it rather than re-implementing injection/secret scanning.
 */
export function tenantThreatSnippet(ctx: TenantContext, access: TenancyAccess, model: TenancyModel): { leaks: string[]; threats: number } {
  const rep = enforceTenancy(ctx, access, model);
  const scan = scanSecurityAndTrustBoundaries({
    untrustedContent: `tenant=${ctx.tenantId} op=${access.operation} resource=${access.resource} model=${model} leaks=[${rep.leaks.join('; ') || 'none'}]`,
    agentRole: 'IMPLEMENTATION_ENGINEER',
  });
  return { leaks: rep.leaks, threats: scan.threats.length };
}
