/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AI Assistant Platform Domain Pack
 *
 * Conversational AI platform with multi-modal input, plugin extensibility,
 * context memory, tool use, and vision/voice capabilities. Covers conversation
 * management, model routing, content safety, usage tracking, and evaluation pipelines.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type {  } from './domainPackTypes.js';
// ── Pack Interface ───────────────────────────────────────────────────────────


// ── DomainModel Interface ────────────────────────────────────────────────────


// ── DomainPack Constant ───────────────────────────────────────────────────────

export const AI_ASSISTANT_PACK: DomainPack = {
  domain: 'ai_assistant',
  name: 'AI Assistant Platform',
  description:
    'Conversational AI platform with multi-modal input (text, image, audio, video), plugin extensibility, context memory, tool use, and vision/voice capabilities. Covers conversation management, model routing, content safety, usage tracking, fine-tuning pipelines, and evaluation frameworks.',

  catalog: {
    categories: ['Conversations', 'Plugins', 'Memory', 'Tools', 'Vision', 'Voice'],
    features: [
      'chat-interface', 'conversation-history', 'custom-instructions', 'system-prompts',
      'plugins', 'tool-use', 'function-calling', 'multi-modal-input', 'image-analysis',
      'voice-input', 'voice-output', 'document-upload', 'code-interpreter', 'web-search',
      'memory-management', 'context-window', 'streaming-responses', 'markdown-rendering',
      'code-highlighting', 'export-conversation', 'shared-links', 'team-spaces',
      'usage-analytics', 'fine-tuning', 'evaluation-suite',
    ],
  },

  fulfillment: {
    modes: ['api', 'web', 'mobile', 'embedded'],
    features: [
      'context-memory', 'tool-use', 'multi-modal', 'streaming',
      'rate-limiting', 'usage-tracking', 'model-routing', 'fallback-strategies',
      'caching', 'batch-processing', 'webhooks', 'sdk-support',
    ],
  },

  customer: {
    features: [
      'chat-interface', 'conversation-history', 'custom-instructions', 'plugins',
      'memory-settings', 'voice-settings', 'image-upload', 'document-analysis',
      'code-generation', 'web-search', 'export', 'shared-links', 'team-spaces',
      'usage-dashboard', 'api-keys',
    ],
  },

  operations: {
    features: [
      'model-routing', 'content-safety', 'usage-tracking', 'fine-tuning', 'evaluation',
      'prompt-engineering', 'ab-testing', 'cost-management', 'rate-limit-management',
      'safety-filters', 'moderation-queue', 'performance-monitoring', 'log-analysis',
      'feedback-collection', 'model-deployment', 'rollback-capability',
    ],
  },

  experience: {
    features: [
      'multi-turn-context', 'personalization', 'voice-interaction', 'proactive-assistance',
      'streaming-responses', 'code-execution', 'visual-reasoning', 'document-intelligence',
      'conversation-branching', 'smart-suggestions', 'contextual-help', 'adaptive-responses',
    ],
  },

  components: {
    public: ['landing', 'docs', 'pricing', 'api-reference', 'blog'],
    customer: ['chat', 'settings', 'history', 'plugins', 'api-keys', 'usage'],
    admin: ['dashboard', 'model-mgmt', 'reports', 'safety', 'users', 'billing'],
    staff: ['support', 'operations', 'evaluation', 'safety-review', 'model-deployment'],
  },

  businessRules: {
    contextWindow: [
      'Context window limits enforced per model tier. Free tier: 8K tokens. Pro tier: 32K tokens. Enterprise tier: 128K tokens with extended context option.',
      'Token counting includes system prompt, conversation history, and current input.',
      'When approaching limit, oldest messages are summarised before truncation (configurable at 80% capacity).',
      'Users warned at 90% capacity with option to start new conversation.',
      'Context overflow: message rejected with clear error and suggestion to start new conversation.',
      'Image inputs: token count varies by resolution and detail level (per-image cost documented).',
    ],
    toolSafety: [
      'All tool calls require explicit user confirmation before execution (opt-in per tool).',
      'Dangerous tools (file write, delete, send message) require enhanced confirmation with action preview.',
      'Tool scoping: each tool defines permitted parameters with JSON schema validation.',
      'Tool call rate limits: 10 calls per minute per user, 100 per minute per organisation.',
      'Tool error handling: graceful degradation with user notification, retry with backoff (max 3 retries).',
      'Tool sandboxing: code interpreter runs in isolated container with network restrictions.',
      'Sensitive parameter masking: API keys and credentials never exposed in tool call logs.',
      'Tool audit trail: all tool calls logged with timestamp, user, parameters, and result.',
    ],
    contentPolicy: [
      'Multi-tier content policy enforcement. Category 1 (strict): no harmful content generation (violence, illegal activity, hate speech, PII exposure).',
      'Category 2 (moderated): content requiring disclosure (medical, legal, financial advice with disclaimer).',
      'Category 3 (flagged): content requiring review (controversial topics, political content).',
      'Automated filtering: classifier-based detection with threshold-based action (block, warn, flag).',
      'Human review queue for borderline cases (review within 24 hours).',
      'Appeal process: users may appeal content policy decisions with explanation.',
      'Regional variations: policy adapted per local laws (EU AI Act, China AI regulations).',
      'Transparency: users informed when content is filtered with reason.',
    ],
    memoryRetention: [
      'Conversation memory managed per user preference. Default retention: 90 days with option to extend to 1 year or indefinite.',
      'User controls: per-conversation retention (keep/delete/auto-expire), bulk export, selective memory deletion.',
      'Memory categories: short-term (current session), long-term (cross-session preferences), semantic (vector embeddings).',
      'Memory deletion: GDPR-compliant with 30-day purge after deletion request.',
      'Memory encryption: conversation data encrypted at rest with per-user keys.',
      'Enterprise retention: configurable per organisation policy (compliance requirements).',
      'Memory export: JSON format with full conversation history for user download.',
    ],
    rateLimits: [
      'Tiered rate limiting per subscription plan. Free: 10 messages/hour, 5 plugin calls/hour, 3 image generations/hour.',
      'Pro: 100 messages/hour, 50 plugin calls/hour, 20 image generations/hour.',
      'Enterprise: unlimited with burst allowance (1000 msg/hour peak).',
      'Rate limit headers included in all API responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset).',
      'Concurrent sessions: 1 on free, 3 on Pro, 10 on Enterprise.',
      'API rate limits: 100 req/min on free, 1000 req/min on Pro, 10000 req/min on Enterprise.',
      'Abuse detection: unusual patterns trigger automatic throttling with review.',
    ],
    dataRetention: [
      'Conversations: user-configurable (90 days default, 1 year/indefinite options).',
      'API logs: 30 days for diagnostics, 90 days for compliance (configurable per org).',
      'Model training data: conversations never used for model training unless explicit opt-in.',
      'Plugin interactions: tool call logs retained 90 days for debugging and safety review.',
      'Usage analytics: aggregated and anonymised after 30 days.',
      'Audit logs: 1 year retention for security and compliance events.',
      'Backup retention: 30-day rolling backup with 90-day archive for disaster recovery.',
      'Data deletion: soft delete with 30-day purge window; permanent deletion within 48 hours of confirmed request.',
    ],
  },

  design: {
    layout: [
      'Chat-first interface with conversation as primary focus',
      'Sidebar history for browsing past conversations',
      'Split-view for code generation (editor + preview + explanation)',
      'Responsive layout adapting to mobile, tablet, and desktop',
      'Plugin panel as collapsible right sidebar',
      'Settings modal for model, temperature, and system prompt configuration',
    ],
    color: [
      'Neutral light palette: white (#FFFFFF) and light gray (#F9FAFB) backgrounds',
      'Accent blue (#2563EB) for primary actions and active states',
      'Subtle borders (#E5E7EB) for visual separation without heaviness',
      'Code blocks: dark background (#1E1E2E) with syntax highlighting',
      'User message bubbles: accent blue background with white text',
      'Assistant messages: light gray background with dark text',
    ],
    typography: [
      'Readable chat: 16px sans-serif (Inter) for conversation text with 1.6 line height',
      'Monospace code: 14px Fira Code for code blocks with syntax highlighting',
      'System prompt: slightly muted 14px for configuration text',
      'Clear visual hierarchy between user and assistant messages',
      'Tabular figures for token counts, timestamps, and usage metrics',
    ],
    interaction: [
      'Streaming response: text appears progressively as model generates',
      'Voice input: push-to-talk or always-on with wake word (configurable)',
      'Voice output: text-to-speech for assistant responses with speed control',
      'Regenerate response: button to retry last assistant message',
      'Copy code block: one-click copy with confirmation feedback',
      'Plugin execution: visual progress indicator for tool use steps',
      'Conversation branching: fork conversation at any point',
      'Keyboard shortcuts: Cmd+N (new chat), Cmd+/ (focus input), Cmd+Shift+C (copy last response)',
    ],
    accessibility: [
      'Full keyboard navigation: all interactive elements reachable via Tab and Enter',
      'Screen reader support: ARIA live regions for streaming responses',
      'Semantic HTML for conversation structure (role, aria-label)',
      'High contrast mode option for all UI elements',
      'Text scaling support up to 200% without layout breakage',
      'Skip navigation links for screen reader users',
      'Focus indicators clearly visible on all interactive elements',
      'Voice output with adjustable speed and voice selection',
      'Transcript mode: full conversation viewable as text document',
    ],
  },

  security: {
    auth:
      'API key + OAuth with granular scopes. API key authentication for programmatic access. OAuth 2.0 with PKCE for web and mobile applications. Scopes: chat:read, chat:write, plugins:execute, memory:read, memory:write, admin:read, admin:write. API key rotation support with automatic expiry. MFA required for admin and organisation-level API keys. Rate limiting per API key with configurable limits per plan. Session management with short-lived access tokens (15 min) and refresh tokens (7 day).',

    data:
      'E2E encrypted conversations, PII redaction. All conversations encrypted at rest (AES-256) and in transit (TLS 1.3). PII redaction pipeline: names, emails, phone numbers, addresses automatically detected and redacted in logs and training data (opt-in only). Conversation data segmented per user/organisation with strict access controls. Plugin tool call data logged with parameter sanitisation. Memory vectors encrypted with per-user encryption keys. Audit logs retained 1 year with immutable storage.',

    compliance: [
      'GDPR: Right to access/export all conversations and personal data. Right to erasure with 30-day purge. Consent management for EU users. DPA with model provider, cloud infrastructure, and analytics sub-processors.',
      'SOC 2 Type II: Annual audit with penetration testing. Access control reviews quarterly. Incident response plan with 72-hour breach notification. Encryption at rest and in transit for all data. Audit logging for all admin actions.',
      'EU AI Act: Transparency requirements for AI-generated content (clearly labelled). Risk classification for use cases. High-risk use case documentation and human oversight requirements.',
    ],
  },

  testing: {
    unit: [
      'Token counting accuracy: system prompt + history + input within context window',
      'Tool parameter validation: JSON schema validation rejects invalid parameters',
      'Rate limiter: correct token bucket refill and exhaustion behaviour',
      'Content filter classifier: correct classification of policy-violating content',
      'Memory summarisation: context window compression preserves key information',
      'API key scope validation: requests with insufficient scopes rejected (403)',
      'PII redaction: names, emails, phone numbers correctly masked in logs',
      'Plugin sandbox: code interpreter cannot access host filesystem or network',
    ],
    integration: [
      'Chat message -> model routing -> response generation -> streaming delivery -> UI update',
      'Plugin tool call -> parameter validation -> sandboxed execution -> result formatting -> response integration',
      'Conversation context -> memory retrieval -> context injection -> model response -> memory update',
      'Image upload -> vision model -> analysis -> response generation with image reference',
      'Voice input -> speech-to-text -> model processing -> text-to-speech -> audio playback',
      'Rate limit exceeded -> 429 response -> retry-after header -> backoff -> successful retry',
      'Content policy violation -> classifier flag -> human review queue -> moderation action -> user notification',
      'API key rotation -> old key invalidation -> new key activation -> uninterrupted service',
    ],
    e2e: [
      'New user signup -> API key creation -> first API call -> conversation -> plugin use -> export conversation -> delete account',
      'Web user: chat with multi-modal input -> tool use for code execution -> review result -> fork conversation -> share link -> recipient views and continues',
      'Enterprise admin: configure organisation -> set rate limits -> deploy custom model -> monitor safety dashboard -> review flagged content -> adjust policy',
    ],
  },
};

// ── DomainModel Constant ───────────────────────────────────────────────────────

export const AI_ASSISTANT_DOMAIN: DomainModel = {
  id: 'ai_assistant',
  domain: 'ai_assistant',
  name: 'AI Assistant Platform',
  label: 'AI Assistant',
  category: 'technology',
  description: AI_ASSISTANT_PACK.description,

  userRoles: [
    {
      id: 'end-user', name: 'End User',
      typicalFeatures: ['chat-interface', 'conversation-history', 'custom-instructions', 'plugins', 'memory-settings'],
      permissions: ['chat.read', 'chat.write', 'plugins.use', 'memory.manage', 'conversations.create'],
    },
    {
      id: 'developer', name: 'Plugin Developer',
      typicalFeatures: ['plugins', 'api-keys', 'documentation', 'sandbox', 'testing'],
      permissions: ['plugins.create', 'plugins.publish', 'plugins.update', 'sandbox.access', 'logs.view'],
    },
    {
      id: 'admin', name: 'Platform Admin',
      typicalFeatures: ['model-mgmt', 'reports', 'safety', 'users', 'billing'],
      permissions: ['models.manage', 'content.moderate', 'users.manage', 'reports.view', 'settings.edit', 'safety.configure'],
    },
    {
      id: 'evaluator', name: 'Model Evaluator',
      typicalFeatures: ['evaluation', 'benchmarks', 'model-comparison', 'quality-metrics'],
      permissions: ['models.evaluate', 'benchmarks.run', 'results.view', 'models.compare'],
    },
  ],
  role: 'end-user',

  standardFeatures: [
    { category: 'essential', name: 'Chat Interface', description: 'Conversational UI with streaming responses and markdown rendering', priority: 'essential' },
    { category: 'essential', name: 'Conversation History', description: 'Persistent conversation storage with search and organisation', priority: 'essential' },
    { category: 'essential', name: 'Multi-Modal Input', description: 'Text, image, audio, and document input processing', priority: 'essential' },
    { category: 'essential', name: 'Context Memory', description: 'Cross-session memory with user-controlled retention', priority: 'essential' },
    { category: 'essential', name: 'Content Safety', description: 'Multi-tier content policy enforcement with filtering', priority: 'essential' },
    { category: 'expected', name: 'Plugin System', description: 'Extensible tool/plugin architecture with sandboxed execution', priority: 'expected' },
    { category: 'expected', name: 'Tool Use', description: 'Function calling with parameter validation and user confirmation', priority: 'expected' },
    { category: 'expected', name: 'Model Routing', description: 'Intelligent model selection based on task type and cost', priority: 'expected' },
    { category: 'expected', name: 'Usage Tracking', description: 'Token-level usage tracking with cost attribution', priority: 'expected' },
    { category: 'expected', name: 'Streaming Responses', description: 'Progressive token delivery for responsive user experience', priority: 'expected' },
    { category: 'differentiating', name: 'Voice Interaction', description: 'Push-to-talk and always-on voice with wake word', priority: 'differentiating' },
    { category: 'differentiating', name: 'Proactive Assistance', description: 'AI-initiated suggestions and contextual help', priority: 'differentiating' },
    { category: 'differentiating', name: 'Fine-Tuning Pipeline', description: 'Custom model fine-tuning with evaluation and A/B testing', priority: 'differentiating' },
    { category: 'differentiating', name: 'Evaluation Suite', description: 'Comprehensive benchmarking and quality evaluation framework', priority: 'differentiating' },
    { category: 'differentiating', name: 'Code Interpreter', description: 'Sandboxed code execution with multi-language support', priority: 'differentiating' },
  ],

  businessModels: [
    {
      modelType: 'API Usage',
      revenueStreams: ['token-billing', 'api-requests', 'premium-model-access'],
      costStructure: ['model-api-costs', 'infrastructure', 'safety-moderation', 'support'],
      pricingStrategy: ['usage-based', 'tiered', 'premium-model-upsell'],
    },
    {
      modelType: 'Subscription',
      revenueStreams: ['monthly-subscriptions', 'annual-subscriptions', 'team-plans'],
      costStructure: ['platform-development', 'model-inference', 'storage', 'support'],
      pricingStrategy: ['freemium', 'tiered-subscription', 'team-enterprise'],
    },
    {
      modelType: 'Enterprise',
      revenueStreams: ['dedicated-deployment', 'custom-models', 'sla', 'support-contracts'],
      costStructure: ['infrastructure', 'model-training', 'dedicated-support', 'security-compliance'],
      pricingStrategy: ['enterprise-contract', 'usage-based-overage', 'custom-model-licensing'],
    },
  ],

  technicalPatterns: [
    { category: 'ai', name: 'Model Router', description: 'Intelligent routing between models based on task complexity and cost', rationale: 'Optimise cost and latency by selecting appropriate model per request' },
    { category: 'ai', name: 'RAG Pipeline', description: 'Retrieval-augmented generation with vector database and context injection', rationale: 'Extend knowledge beyond training data with authoritative sources' },
    { category: 'security', name: 'Content Safety Pipeline', description: 'Multi-layer content filtering with classifier and human review', rationale: 'Prevent harmful content generation while maintaining utility' },
    { category: 'streaming', name: 'SSE Streaming', description: 'Server-sent events for progressive response delivery', rationale: 'Sub-second time-to-first-token for responsive UX' },
    { category: 'data', name: 'Vector Memory Store', description: 'Embedding-based semantic memory with user-scoped access', rationale: 'Efficient cross-session context retrieval and personalization' },
    { category: 'integration', name: 'Plugin SDK', description: 'TypeScript/Python SDK for plugin development with sandboxing', rationale: 'Low-friction plugin development with security guarantees' },
  ],

  operationalLifecycle: [
    { id: 'training', name: 'Model Training', description: 'Data preparation, fine-tuning, and evaluation pipeline' },
    { id: 'deployment', name: 'Model Deployment', description: 'Canary release, A/B testing, and production rollout' },
    { id: 'monitoring', name: 'Active Monitoring', description: 'Performance tracking, safety monitoring, and cost management' },
    { id: 'iteration', name: 'Continuous Improvement', description: 'Feedback collection, model retraining, and feature deployment' },
  ],

  designPrinciples: [
    { name: 'Conversation-First', description: 'Chat is the primary interface — everything else supports the conversation' },
    { name: 'Transparent AI', description: 'Users understand when they are interacting with AI and what it can/cannot do' },
    { name: 'Privacy by Design', description: 'User data is protected by default with clear controls for sharing' },
    { name: 'Progressive Disclosure', description: 'Advanced features available but not forced — power users find them' },
    { name: 'Accessible AI', description: 'Voice, keyboard, and screen reader support make AI accessible to all users' },
  ],

  securityConsiderations: [
    { category: 'auth', name: 'Granular API Scopes', description: 'Fine-grained OAuth scopes for API access control', severity: 'high' },
    { category: 'data', name: 'PII Redaction Pipeline', description: 'Automatic PII detection and redaction in logs', severity: 'critical' },
    { category: 'data', name: 'E2E Conversation Encryption', description: 'End-to-end encryption for conversation data', severity: 'high' },
    { category: 'compliance', name: 'EU AI Act Transparency', description: 'AI-generated content clearly labelled for users', severity: 'high' },
    { category: 'auth', name: 'Plugin Sandbox Isolation', description: 'Sandboxed execution environment for plugins and tools', severity: 'critical' },
    { category: 'compliance', name: 'Data Retention Compliance', description: 'Configurable retention policies per jurisdiction', severity: 'medium' },
  ],

  regulations: [
    {
      name: 'GDPR',
      requirements: [
        'Right to access and export all conversations and personal data',
        'Right to erasure with 30-day purge',
        'Consent management for EU users',
        'DPA with model provider and sub-processors',
      ],
    },
    {
      name: 'EU AI Act',
      requirements: [
        'AI-generated content clearly labelled to users',
        'Risk classification for use cases',
        'High-risk use case documentation and human oversight',
        'Conformity assessments for general-purpose AI models',
      ],
    },
    {
      name: 'SOC 2 Type II',
      requirements: [
        'Annual audit with penetration testing',
        'Access control reviews and least-privilege enforcement',
        'Incident response plan with 72-hour breach notification',
        'Encryption at rest and in transit for all data',
      ],
    },
  ],

  testingRequirements: [
    { category: 'unit', name: 'Token Counting', description: 'Accurate token count within context window limits', priority: 'high' },
    { category: 'unit', name: 'Tool Parameter Validation', description: 'JSON schema validation rejects invalid tool parameters', priority: 'high' },
    { category: 'unit', name: 'Rate Limiter', description: 'Correct token bucket behaviour per tier', priority: 'medium' },
    { category: 'unit', name: 'Content Safety Filter', description: 'Correct policy classification for edge cases', priority: 'high' },
    { category: 'integration', name: 'Chat to Model to Streaming Response', description: 'Full request/response cycle with streaming', priority: 'high' },
    { category: 'integration', name: 'Plugin Tool Call Flow', description: 'Validation -> sandbox execution -> result integration', priority: 'high' },
    { category: 'integration', name: 'Context Memory Pipeline', description: 'Retrieval -> injection -> response -> memory update', priority: 'medium' },
    { category: 'e2e', name: 'Multi-Modal Conversation', description: 'Text + image input -> vision analysis -> follow-up -> code generation -> execution -> result', priority: 'high' },
    { category: 'e2e', name: 'Fine-Tuning Pipeline', description: 'Data preparation -> training -> evaluation -> deployment -> A/B test -> rollout', priority: 'medium' },
  ],

  workflows: [
    { id: 'conversation', name: 'Conversation Flow', steps: ['user-input', 'context-retrieval', 'model-routing', 'response-generation', 'safety-check', 'memory-update', 'delivery'], entities: ['conversation', 'message', 'context', 'model'] },
    { id: 'plugin-execution', name: 'Plugin Execution Flow', steps: ['tool-request', 'user-confirmation', 'parameter-validation', 'sandbox-execution', 'result-formatting', 'response-integration'], entities: ['plugin', 'tool-call', 'sandbox', 'result'] },
    { id: 'fine-tuning', name: 'Fine-Tuning Pipeline', steps: ['data-collection', 'data-preparation', 'training', 'evaluation', 'deployment', 'a-b-test', 'rollout'], entities: ['training-data', 'model', 'evaluation-metrics', 'canary'] },
    { id: 'safety-review', name: 'Safety Review Flow', steps: ['content-flag', 'classifier-review', 'human-review', 'action-decision', 'user-notification', 'appeal-process'], entities: ['flagged-content', 'reviewer', 'moderation-action', 'appeal'] },
  ],

  entities: [
    { name: 'Conversation', description: 'Chat session between user and AI with message history', invariants: ['belongs to one user', 'messages ordered chronologically', 'context window respected'] },
    { name: 'Message', description: 'Individual message in a conversation', invariants: ['has sender (user/assistant/system)', 'content within length limits', 'linked to conversation'] },
    { name: 'Plugin', description: 'Extensible tool or integration for the AI assistant', invariants: ['requires admin approval before publication', 'parameters validated against JSON schema', 'executed in sandbox'] },
    { name: 'Memory', description: 'User preference and fact storage for personalisation', invariants: ['user-scoped and encrypted', 'retention configurable per user', 'deletable on user request'] },
    { name: 'APIKey', description: 'Programmatic access credential with scoped permissions', invariants: ['linked to user or organisation', 'scoped permissions enforced', 'rotatable without service interruption'] },
  ],

  invariants: [
    'All tool calls require user confirmation before execution',
    'Conversation data encrypted at rest with per-user keys',
    'PII never exposed in logs or training data without explicit consent',
    'Context window limits enforced before model invocation',
    'Content policy applied before response delivery',
    'Rate limits enforced per API key and per user',
    'Plugin sandbox cannot access host system resources',
    'Model responses are labelled as AI-generated',
  ],

  constraints: [
    'Context window limits vary by model tier and subscription plan',
    'Rate limits enforced per user and per API key',
    'Plugin approval required before public availability',
    'Tool use requires explicit user confirmation',
    'PII redaction applied to all logs and training data',
    'Conversation retention configurable but minimum 30 days for compliance',
    'API keys have maximum 90-day expiry unless enterprise agreement',
  ],

  financialFlows: [
    { name: 'api-revenue', direction: 'in', trigger: 'API token consumption billing' },
    { name: 'subscription-revenue', direction: 'in', trigger: 'monthly or annual subscription payment' },
    { name: 'model-cost', direction: 'out', trigger: 'underlying LLM API token consumption' },
    { name: 'infrastructure-cost', direction: 'out', trigger: 'compute, storage, and bandwidth usage' },
    { name: 'safety-cost', direction: 'out', trigger: 'content moderation and safety infrastructure' },
  ],

  successMetrics: [
    'Daily Active Users (DAU)',
    'Messages per User per Day',
    'Average Response Latency (P95 < 2s)',
    'Streaming Time-to-First-Token (P95 < 500ms)',
    'Plugin Adoption Rate',
    'User Retention Rate (7-day, 30-day)',
    'Content Safety False Positive Rate',
    'API Uptime (99.9% target)',
    'Customer Support Resolution Time',
    'User Satisfaction Score (CSAT)',
    'Cost per Message',
    'Model Accuracy Score (evaluation benchmarks)',
  ],

  analytics: {
    tracked: [
      'message-volume', 'response-latency', 'token-usage', 'plugin-usage',
      'conversation-length', 'user-retention', 'model-routing-decisions',
      'safety-interventions', 'feedback-scores', 'feature-adoption',
      'cost-per-conversation', 'error-rates',
    ],
    dashboards: [
      'Usage and Cost Dashboard',
      'Model Performance Dashboard',
      'Safety and Moderation Dashboard',
      'Plugin Analytics Dashboard',
      'User Engagement Dashboard',
      'Infrastructure Health Dashboard',
    ],
  },

  securityRequirements: [
    'OAuth 2.0 PKCE for all client-side authentication flows',
    'API key prefix-based identification with instant revocation',
    'E2E encryption for all conversation data at rest and in transit',
    'PII detection and redaction in all logs and training data',
    'Plugin sandboxing with network isolation and filesystem restrictions',
    'Content safety pipeline with multi-tier classification',
    'Audit logging for all admin actions with immutable storage',
    'Rate limiting with burst allowance and abuse detection',
  ],

  regulatory: [
    { regulation: 'GDPR', applies: true, notes: 'Data export/erasure, consent management, DPA with sub-processors' },
    { regulation: 'SOC 2 Type II', applies: true, notes: 'Annual audit, access controls, incident response, encryption' },
    { regulation: 'EU AI Act', applies: true, notes: 'AI content labelling, risk classification, human oversight requirements' },
  ],
};
