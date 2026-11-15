/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Learning Management System Domain Pack
 *
 * Complete LMS platform covering course catalog with lessons and assessments, multiple
 * delivery modes (self-paced, instructor-led, hybrid, corporate), progress tracking,
 * certification, gamification, social learning, discussion forums, content management,
 * grading, enrollment management, and adaptive learning paths.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type {  } from './domainPackTypes.js';
// ── Shared Spec Interfaces ───────────────────────────────────────────────────



export interface CustomerFeaturesSpec {
  features: string[];
}

export interface OperationsFeaturesSpec {
  features: string[];
}

export interface ExperienceFeaturesSpec {
  features: string[];
}







// ── DomainPack Constant ──────────────────────────────────────────────────────

export const EDUCATION_PACK: DomainPack = {
  domain: 'education',
  name: 'Learning Management System',
  description:
    'Complete learning management system covering course catalog with lessons and assessments, multiple delivery modes (self-paced, instructor-led, hybrid, corporate), progress tracking, certification, gamification, social learning, discussion forums, content management, grading, enrollment management, and adaptive learning paths.',

  // ── Catalog ────────────────────────────────────────────────────────────────
  catalog: {
    categories: [
      'Courses',
      'Lessons',
      'Assessments',
      'Certificates',
      'Resources',
      'Live Sessions',
    ],
    features: [
      'course-catalog',
      'course-templates',
      'lesson-builder',
      'video-upload',
      'quiz-builder',
      'assignment-submission',
      'peer-review',
      'discussion-forums',
      'grading-rubrics',
      'certificate-generation',
      'prerequisites',
      'learning-paths',
      'skill-tracking',
      'badges',
      'leaderboards',
      'search-filter',
      'resource-library',
      'live-sessions',
      'virtual-classroom',
    ],
  },

  // ── Fulfillment ────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['self-paced', 'instructor-led', 'hybrid', 'corporate'],
    features: [
      'progress-tracking',
      'certification',
      'gamification',
      'prerequisites',
    ],
  },

  // ── Customer Features ──────────────────────────────────────────────────────
  customer: {
    features: [
      'course-catalog',
      'progress-dashboard',
      'certificates',
      'discussions',
      'bookmarks',
    ],
  },

  // ── Operations Features ────────────────────────────────────────────────────
  operations: {
    features: [
      'course-authoring',
      'grading',
      'attendance',
      'enrollment',
      'content-management',
    ],
  },

  // ── Experience Features ────────────────────────────────────────────────────
  experience: {
    features: [
      'adaptive-learning',
      'social-learning',
      'achievements',
      'learning-paths',
    ],
  },

  // ── Components ─────────────────────────────────────────────────────────────
  components: {
    public: ['catalog', 'about', 'pricing'],
    customer: ['dashboard', 'courses', 'profile', 'certificates'],
    admin: ['dashboard', 'user-mgmt', 'reports', 'settings'],
    staff: ['authoring', 'grading', 'support'],
  },

  // ── Business Rules ─────────────────────────────────────────────────────────
  businessRules: {
    enrollment: [
      'Enrollment is open for self-paced courses with no capacity limits. Instructor-led courses have defined cohort sizes with waitlist when full. Prerequisite courses must be completed before enrollment in advanced courses. Corporate enrollments managed by organization admin with bulk assignment. Enrollment can be cancelled within 14 days of purchase with full refund. Expired enrollments (12 months without activity) archived with re-enrollment option. Audit-only access available for free courses without certificate eligibility.',
    ],

    certification: [
      'Certificates issued upon course completion with minimum passing grade of 70%. Certificate includes: learner name, course name, completion date, unique certificate ID, issuing organization. Certificates verifiable via public URL with QR code. Expiration defined per certificate type: skill certificates expire after 2 years, compliance certificates expire per regulatory requirement. Certificate revocation possible for academic dishonesty. Digital certificates downloadable as PDF. Badges issued for individual module completion. Continuing Education Units (CEUs) calculated per course hours.',
    ],

    grading: [
      'Assessment types: quizzes (auto-graded), assignments (instructor-graded), peer reviews, discussion participation. Grading scale: A (90-100%), B (80-89%), C (70-79%), D (60-69%), F (<60%). Minimum passing grade: 70% for certificate eligibility. Late submissions penalized 10% per day up to 5 days. Extensions granted by instructor with documented reason. Rubrics defined per assignment with weighted criteria. Peer review minimum: 3 reviews per submission for reliability. Grading anonymity enabled to reduce bias. Grade change requests require instructor approval with reason documented.',
    ],

    content: [
      'Course content organized into modules → lessons → activities. Content versioning tracks revisions with rollback capability. Published content is immutable until new version created. Draft content visible only to instructors and admins. Media files (video, audio, PDF) stored with CDN delivery. Maximum video length per lesson: 45 minutes. Supported formats: MP4 (H.264), MP3, PDF, SCORM, xAPI. Accessibility: all videos require captions, all images require alt text. Content embargo allows scheduling future publication dates. Content reuse across courses via content library with version tracking.',
    ],

    engagement: [
      'Gamification elements: XP points for completed activities, badges for milestones, leaderboards for cohort comparison. Streak tracking: consecutive daily learning days with bonus XP. Social features: discussion forums, study groups, peer messaging, collaborative assignments. Notification preferences: daily reminders, deadline alerts, achievement notifications, new content announcements. Engagement score calculated from: login frequency, time spent, completion rate, participation in discussions. At-risk students (engagement score <30%) flagged for instructor intervention. Minimum engagement required for certificate: 80% completion rate.',
    ],

    corporate: [
      'Corporate features: organization dashboard, bulk enrollment, custom branding, SSO integration, dedicated support. Billing: per-seat licensing with volume discounts (10% off 50+, 20% off 200+). Admin controls: user provisioning, role assignment, department grouping, reporting. Custom learning paths curated per role/department. Compliance training with mandatory deadlines and escalation. Manager dashboard: team progress, completion rates, skill gaps. API access for HRIS integration (Workday, BambooHR). SCORM/xAPI compliance for LMS interoperability. Data export for corporate training records.',
    ],
  },

  // ── Design Principles ───────────────────────────────────────────────────────
  design: {
    layout: [
      'content-first',
      'video-optimized',
      'mobile-reading',
    ],
    color: [
      'calm-blues',
      'progress-green',
    ],
    typography: [
      'readable-body',
      'heading-hierarchy',
    ],
    interaction: [
      'video-player',
      'inline-quiz',
    ],
    accessibility: [
      'captions',
      'screen-reader',
      'keyboard-nav',
    ],
  },

  // ── Security Requirements ──────────────────────────────────────────────────
  security: {
    auth:
      'SSO with institutional and personal accounts. Institutional SSO via SAML 2.0 / OIDC for university and corporate learners. Personal accounts via email/password (bcrypt, cost 12) and OAuth (Google, Microsoft). Role-based access: Learner (enrolled courses, own data), Instructor (course management, grading), Admin (full platform access), Corporate Admin (organization-scoped access). MFA optional for personal accounts, mandatory for admin and instructor. Session timeout: 30 minutes for learners, 2 hours for instructors. Concurrent session limit: 3 devices per account.',

    data:
      'FERPA compliant, encrypted grades. Learner data: name, email, enrollment records, grades, progress, certificates, discussion posts. Grade data encrypted at rest with separate access controls. Assessment responses stored with audit trail. Discussion content moderated for safety. Video content with DRM for paid courses. Time-spent data tracked for engagement analytics. Institutional affiliation data for SSO-provisioned users. Course content metadata and structure. All data encrypted at rest (AES-256) with TLS 1.3 in transit.',

    compliance: [
      'FERPA',
      'COPPA',
      'GDPR',
      'Section 508',
    ],
  },

  // ── Testing Requirements ───────────────────────────────────────────────────
  testing: {
    unit: [
      'Course progress percentage calculation across multiple lesson types',
      'Certificate eligibility check: completion rate and passing grade threshold',
      'Prerequisite validation: course access blocked until prerequisites met',
      'Gamification XP calculation: correct point assignment per activity type',
      'Discussion post word count and profanity filter validation',
      'Enrollment conflict detection: already enrolled, course full, prerequisite missing',
      'Grade weighting: rubric scores correctly weighted to final grade',
      'Badge award logic: correct triggers for streak, completion, and milestone badges',
      'Content visibility: draft vs published vs archived status enforcement',
    ],
    integration: [
      'Learner enrollment → course access → lesson completion → quiz submission → grade recording → progress update → certificate generation',
      'Instructor creates course → adds lessons → publishes → learner enrolls → completes → grade assigned → certificate issued',
      'Peer review assignment → submissions received → reviews completed → grades averaged → final grade posted',
      'Discussion post → moderation queue → approval → display → replies → notification to participants',
      'Corporate admin bulk enrollment → employee notification → access provisioning → completion tracking → report generation',
      'SSO login → user provisioning → enrollment in assigned courses → progress tracked → completion reported to HRIS',
      'Assessment submission → auto-grading → feedback delivery → retake eligibility check → gradebook update',
    ],
    e2e: [
      'Learner browses catalog → enrolls in course → completes first lesson → takes quiz → receives feedback → earns badge → continues to next module → completes course → receives certificate → shares on LinkedIn',
      'Instructor creates course from template → adds video lessons and quizzes → sets prerequisites → publishes → monitors learner progress → grades assignments → issues certificates → reviews analytics',
      'Corporate training: HR admin creates learning path → assigns to new hires → employees complete mandatory modules → compliance tracked → manager sees team progress → certificates issued on completion',
    ],
  },
};

// ── DomainModel Adapter ──────────────────────────────────────────────────────


function rolesForEducation(): DomainModel['userRoles'] {
  return [
    { id: 'learner', name: 'Learner', typicalFeatures: ['course-catalog', 'progress-dashboard', 'certificates', 'discussions'], permissions: ['enroll', 'view-own', 'submit-work', 'participate'] },
    { id: 'instructor', name: 'Instructor', typicalFeatures: ['authoring', 'grading', 'support'], permissions: ['create-courses', 'grade', 'moderate-discussions', 'view-analytics'] },
    { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'reports', 'settings'], permissions: ['*', 'manage-users', 'configure-platform', 'view-all-data'] },
    { id: 'corporate-admin', name: 'Corporate Admin', typicalFeatures: ['bulk-enrollment', 'team-analytics', 'compliance-tracking'], permissions: ['enroll-team', 'view-team-progress', 'create-learning-paths', 'export-reports'] },
  ];
}

function featuresForEducation(): DomainModel['standardFeatures'] {
  const all: DomainModel['standardFeatures'] = [];
  const pushGroup = (label: string, priority: string, features: string[]) => {
    for (const f of features) {
      all.push({ category: label, name: f, description: '', priority });
    }
  };
  pushGroup('catalog', 'essential', EDUCATION_PACK.catalog.features);
  pushGroup('fulfillment', 'expected', EDUCATION_PACK.fulfillment.features);
  pushGroup('customer', 'expected', EDUCATION_PACK.customer.features);
  pushGroup('operations', 'essential', EDUCATION_PACK.operations.features);
  pushGroup('experience', 'differentiating', EDUCATION_PACK.experience.features);
  for (const [group, items] of Object.entries(EDUCATION_PACK.components)) {
    if (Array.isArray(items)) pushGroup(`components:${group}`, 'essential', items);
  }
  for (const [rule] of Object.entries(EDUCATION_PACK.businessRules)) {
    all.push({ category: 'business', name: rule, description: '', priority: 'essential' });
  }
  return all;
}

function businessModelsForEducation(): DomainModel['businessModels'] {
  return [
    { modelType: 'freemium-subscription', revenueStreams: ['subscription-plans', 'certificate-fees', 'corporate-licensing', 'enterprise-sso'], costStructure: ['video-hosting', 'content-creation', 'platform-infrastructure', 'support'], pricingStrategy: ['per-learner-monthly', 'annual-plans', 'corporate-volume-pricing'] },
  ];
}

function technicalPatternsForEducation(): DomainModel['technicalPatterns'] {
  return [
    { category: 'video', name: 'Video Streaming', description: 'Adaptive bitrate streaming with HLS/DASH for reliable playback', rationale: 'Video is the primary content delivery format for most courses' },
    { category: 'data', name: 'SCORM/xAPI', description: 'Learning record store for xAPI statements and SCORM package import', rationale: 'Interoperability with existing course content and corporate LMS' },
    { category: 'architecture', name: 'Microservices', description: 'Separate services for enrollment, grading, content delivery, notifications', rationale: 'High availability required for synchronous class sessions' },
    { category: 'integration', name: 'SSO / IdP Integration', description: 'SAML 2.0 and OIDC for institutional authentication', rationale: 'Universities and enterprises require federated identity' },
  ];
}

function operationalLifecycleForEducation(): DomainModel['operationalLifecycle'] {
  return [
    { id: 'enroll', name: 'Enroll', description: 'Learner discovers, enrolls in, and begins course' },
    { id: 'learn', name: 'Learn', description: 'Learner progresses through lessons, activities, and assessments' },
    { id: 'assess', name: 'Assess', description: 'Instructor grades, provides feedback, issues certificates' },
    { id: 'certify', name: 'Certify', description: 'Certificate issued, skills recorded, credentials shared' },
    { id: 'advance', name: 'Advance', description: 'Learner progresses to next course or learning path' },
  ];
}

function designPrinciplesForEducation(): DomainModel['designPrinciples'] {
  const principles: DomainModel['designPrinciples'] = [];
  const layout: Record<string, string> = {
    'content-first': 'Learning content takes center stage with minimal UI chrome and distraction-free reading',
    'video-optimized': 'Responsive video player with custom controls, playback speed, and transcript sync',
    'mobile-reading': 'Optimized typography and layout for comfortable reading on tablets and phones',
  };
  const color: Record<string, string> = {
    'calm-blues': 'Calming blue palette that aids concentration and reduces cognitive load',
    'progress-green': 'Green for completion indicators, progress bars, and positive feedback',
  };
  const typography: Record<string, string> = {
    'readable-body': 'Optimized body text at 16-18px with 1.6 line height for extended reading sessions',
    'heading-hierarchy': 'Clear heading hierarchy (H1-H3) with consistent sizing and spacing',
  };
  const interaction: Record<string, string> = {
    'video-player': 'Custom video player with playlists, speed control, captions, and note-taking',
    'inline-quiz': 'Inline quiz and assessment with immediate feedback and explanation display',
  };
  const accessibility: Record<string, string> = {
    'captions': 'Closed captions for all video content with accurate transcription',
    'screen-reader': 'Full screen reader support for all content and interactive elements',
    'keyboard-nav': 'Complete keyboard navigation for video player, quizzes, and navigation',
  };
  for (const [k, v] of Object.entries(layout)) principles.push({ name: `Layout: ${k}`, description: v });
  for (const [k, v] of Object.entries(color)) principles.push({ name: `Color: ${k}`, description: v });
  for (const [k, v] of Object.entries(typography)) principles.push({ name: `Typography: ${k}`, description: v });
  for (const [k, v] of Object.entries(interaction)) principles.push({ name: `Interaction: ${k}`, description: v });
  for (const [k, v] of Object.entries(accessibility)) principles.push({ name: `Accessibility: ${k}`, description: v });
  return principles;
}

function securityConsiderationsForEducation(): DomainModel['securityConsiderations'] {
  return [
    { category: 'auth', name: 'SSO with institutional and personal accounts', description: EDUCATION_PACK.security.auth, severity: 'high' },
    { category: 'data', name: 'FERPA compliant, encrypted grades', description: EDUCATION_PACK.security.data, severity: 'high' },
    { category: 'compliance', name: 'FERPA', description: 'Student education records protection and access rights', severity: 'high' },
    { category: 'compliance', name: 'COPPA', description: 'Children under 13 data protection and parental consent', severity: 'high' },
    { category: 'compliance', name: 'GDPR', description: 'EU learner data protection and processing consent', severity: 'high' },
    { category: 'compliance', name: 'Section 508', description: 'Accessibility standards for electronic information technology', severity: 'medium' },
  ];
}

function regulationsForEducation(): DomainModel['regulations'] {
  return [
    { name: 'FERPA', requirements: ['Student record access control', 'Directory information opt-out', 'Amendment rights', 'Consent for disclosure'] },
    { name: 'COPPA', requirements: ['Parental consent for under-13 users', 'Data collection limits', 'Safe harbor provisions'] },
    { name: 'GDPR', requirements: ['Consent management for EU learners', 'Right to erasure', 'Data portability', 'DPA with institutions'] },
    { name: 'Section 508', requirements: ['WCAG 2.1 AA compliance', 'Accessible video players', 'Screen reader support', 'Keyboard navigation'] },
  ];
}

function testingRequirementsForEducation(): DomainModel['testingRequirements'] {
  const all: DomainModel['testingRequirements'] = [];
  for (const t of EDUCATION_PACK.testing.unit) all.push({ category: 'unit', name: t, description: '', priority: 'high' });
  for (const t of EDUCATION_PACK.testing.integration) all.push({ category: 'integration', name: t, description: '', priority: 'high' });
  for (const t of EDUCATION_PACK.testing.e2e) all.push({ category: 'e2e', name: t, description: '', priority: 'medium' });
  return all;
}

export const EDUCATION_DOMAIN: DomainModel = {
  id: EDUCATION_PACK.domain,
  domain: EDUCATION_PACK.domain,
  name: EDUCATION_PACK.name,
  label: EDUCATION_PACK.name,
  category: 'education',
  description: EDUCATION_PACK.description,
  userRoles: rolesForEducation(),
  role: 'learner',
  standardFeatures: featuresForEducation(),
  businessModels: businessModelsForEducation(),
  technicalPatterns: technicalPatternsForEducation(),
  operationalLifecycle: operationalLifecycleForEducation(),
  designPrinciples: designPrinciplesForEducation(),
  securityConsiderations: securityConsiderationsForEducation(),
  regulations: regulationsForEducation(),
  testingRequirements: testingRequirementsForEducation(),
  workflows: [
    { id: 'learning', name: 'Learning Flow', steps: ['enroll', 'access', 'consume', 'assess', 'complete', 'certify'], entities: ['course', 'lesson', 'learner'] },
    { id: 'grading', name: 'Grading Flow', steps: ['submission', 'receive', 'evaluate', 'grade', 'feedback', 'publish'], entities: ['assignment', 'submission', 'grade'] },
    { id: 'authoring', name: 'Course Authoring', steps: ['create', 'add-content', 'add-assessments', 'preview', 'publish', 'enroll-learners'], entities: ['course', 'lesson', 'assessment'] },
  ],
  entities: [
    { name: 'Course', description: 'Structured learning experience with lessons, assessments, and completion criteria', invariants: ['must have at least one lesson', 'passing grade must be defined', 'prerequisites validated at enrollment'] },
    { name: 'Enrollment', description: 'Learner enrollment in a specific course with progress and completion status', invariants: ['prerequisites must be met', 'enrollment must be active to access content'] },
    { name: 'Certificate', description: 'Verifiable credential issued upon course completion', invariants: ['requires passing grade and completion rate', 'must include unique verification ID'] },
  ],
  invariants: ['prerequisites must be completed before advanced courses', 'grades require audit trail', 'certificates require minimum passing grade'],
  constraints: ['enrollment requires prerequisites met', 'grades cannot be changed without documented reason', 'content drafts invisible to learners'],
  financialFlows: [
    { name: 'subscription-revenue', direction: 'in', trigger: 'subscription-payment' },
    { name: 'content-costs', direction: 'out', trigger: 'content-licensing' },
    { name: 'corporate-licensing', direction: 'in', trigger: 'annual-contract' },
  ],
  successMetrics: ['course-completion-rate', 'learner-satisfaction', 'certification-rate', 'engagement-score', 'time-to-completion'],
  analytics: { tracked: ['progress', 'assessment-scores', 'engagement', 'dropout-points', 'search-queries'], dashboards: ['learner', 'instructor', 'admin', 'corporate'] },
  securityRequirements: ['sso-integration', 'grade-encryption', 'access-control', 'audit-logging'],
  regulatory: [
    { regulation: 'FERPA', applies: true, notes: 'Student record privacy mandatory for US institutions' },
    { regulation: 'COPPA', applies: true, notes: 'Children under 13 require parental consent' },
    { regulation: 'GDPR', applies: true, notes: 'EU learner data protection' },
    { regulation: 'Section 508', applies: true, notes: 'Accessibility compliance for US government contracts' },
  ],
};
