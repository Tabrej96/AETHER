/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Agriculture Domain Pack
 *
 * Complete farm management and agritech platform — from seed to harvest to market.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';

// ── Shared Type Definitions ────────────────────────────────────────────────────

// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForAgriculture(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'precision-farming-saas',
      description: 'Software platform providing data-driven insights for crop management, soil health monitoring, and yield optimization. Farmers subscribe for access to IoT sensor data, satellite imagery analysis, and AI-powered recommendations.',
      pricingExamples: ['$15/acre/month basic monitoring', '$35/acre/month advanced analytics', '$500/year single-farm license', '$2,000/year enterprise multi-farm'],
    },
    {
      modelType: 'farm-to-table-marketplace',
      description: 'Online marketplace connecting small and medium farms directly with restaurants, grocery stores, and consumers. Handles order management, logistics coordination, and quality verification.',
      pricingExamples: ['5% commission on each sale', '$29/month farm listing fee', '$99/month premium farm profile', 'Buyer subscription $49/month for priority sourcing'],
    },
    {
      modelType: 'b2b-agricultural-supply',
      description: 'Supply platform for farm inputs — seeds, fertilizers, pesticides, equipment, and feed. Bulk pricing, delivery scheduling, and agronomist-recommended product bundles.',
      pricingExamples: ['20-30% markup on input products', '$5,000/year agronomist advisory', 'Bulk order discounts 10-25%', 'Equipment leasing from $200/month'],
    },
  ];
}

function revenueStreamsForAgriculture(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'SaaS Subscription',
      description: 'Recurring revenue from farm management software subscriptions tiered by acreage and feature depth.',
      pricingModel: 'per-acre-per-month',
      examples: ['$15/acre/month basic', '$35/acre/month premium', '$5,000/year enterprise'],
    },
    {
      name: 'Marketplace Commission',
      description: 'Commission taken on produce sales through the farm-to-table marketplace platform.',
      pricingModel: 'percentage-of-transaction',
      examples: ['5% on produce sales', '3% on bulk B2B orders', '$29/month listing fee'],
    },
    {
      name: 'Data Insights & Advisory',
      description: 'Premium data analytics, weather forecasting, pest outbreak alerts, and agronomist consultation services.',
      pricingModel: 'subscription plus usage',
      examples: ['Weather alerts $49/month', 'Soil analysis report $150/scan', 'Agronomist consultation $200/hour'],
    },
    {
      name: 'Equipment Leasing',
      description: 'Farm equipment leasing through platform partners — tractors, harvesters, irrigation systems.',
      pricingModel: 'monthly lease',
      examples: ['Tractor lease $500/month', 'Drone mapping $150/month', 'Irrigation controller $80/month'],
    },
    {
      name: 'Input Supply Markup',
      description: 'Margin on agricultural inputs sold through the platform — seeds, fertilizers, pesticides.',
      pricingModel: 'per-unit markup',
      examples: ['Seeds 25% markup', 'Fertilizer 20% markup', 'Pesticides 15% markup'],
    },
  ];
}

function userRoleMatrixForAgriculture(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'farmer',
      roleName: 'Farmer',
      description: 'Primary user managing their farm operations — fields, crops, equipment, and harvest planning.',
      permissions: ['manage-fields', 'create-crop-plans', 'view-sensor-data', 'place-orders', 'view-market-prices', 'log-activities'],
      features: ['dashboard', 'field-management', 'crop-planning', 'sensor-monitoring', 'order-tracking', 'weather-alerts'],
      constraints: ['cannot access other farms data', 'cannot modify platform pricing', 'sensor data retained for 3 years'],
    },
    {
      roleId: 'farm-manager',
      roleName: 'Farm Manager',
      description: 'Oversees multiple farms or large operations. Manages workers, budgets, reporting, and strategic planning.',
      permissions: ['manage-workers', 'approve-purchases', 'view-financial-reports', 'manage-crop-plans', 'assign-tasks'],
      features: ['dashboard', 'worker-management', 'financial-reports', 'crop-planning', 'task-assignment', 'budget-tracking'],
      constraints: ['cannot modify farm ownership', 'reporting limited to managed farms'],
    },
    {
      roleId: 'agronomist',
      roleName: 'Agronomist',
      description: 'Agricultural scientist providing crop recommendations, soil analysis interpretation, and pest management advice.',
      permissions: ['view-farm-data', 'create-recommendations', 'access-sensor-data', 'generate-soil-reports'],
      features: ['soil-analysis', 'crop-recommendations', 'pest-identification', 'yield-prediction'],
      constraints: ['cannot modify farm financial data', 'recommendations logged for audit', 'licensed professional required'],
    },
    {
      roleId: 'buyer',
      roleName: 'Buyer',
      description: 'Restaurant, grocery store, or distributor purchasing produce through the marketplace.',
      permissions: ['browse-listings', 'place-orders', 'track-deliveries', 'rate-suppliers', 'manage-preferences'],
      features: ['marketplace', 'order-tracking', 'supplier-ratings', 'bulk-ordering', 'delivery-scheduling'],
      constraints: ['cannot list produce for sale', 'payment terms per agreement'],
    },
    {
      roleId: 'supplier',
      roleName: 'Supplier',
      description: 'Agricultural input supplier selling seeds, fertilizers, equipment, and other farm supplies.',
      permissions: ['manage-listings', 'process-orders', 'update-inventory', 'set-pricing'],
      features: ['product-management', 'order-processing', 'inventory-tracking', 'analytics'],
      constraints: ['must maintain quality certifications', 'pricing subject to platform approval'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing farms, users, suppliers, billing, and platform configuration.',
      permissions: ['*'],
      features: ['dashboard', 'farm-management', 'user-management', 'billing', 'reports', 'compliance'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA'],
    },
  ];
}

function operationalWorkflowsForAgriculture(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'plant-to-harvest',
      name: 'Plant to Harvest',
      description: 'Full crop lifecycle from field preparation through planting, growing, and harvesting with monitoring at each stage.',
      steps: ['field-preparation', 'seed-selection', 'planting', 'irrigation-schedule', 'fertilizer-application', 'pest-monitoring', 'growth-tracking', 'harvest-timing', 'harvest-execution', 'post-harvest-handling'],
      entities: ['field', 'crop-plan', 'sensor-reading', 'harvest-record', 'inventory'],
      triggers: ['season-start', 'growth-milestone', 'harvest-ready', 'weather-alert'],
    },
    {
      workflowId: 'order-to-delivery',
      name: 'Order to Delivery (Produce)',
      description: 'Buyer discovers produce listing, places order, farmer confirms availability, harvest scheduled, and delivery coordinated.',
      steps: ['browse-listings', 'place-order', 'farmer-confirmation', 'harvest-scheduling', 'quality-check', 'packaging', 'logistics-coordination', 'delivery', 'confirmation', 'payment-settlement'],
      entities: ['listing', 'order', 'harvest-record', 'shipment', 'payment'],
      triggers: ['order-placed', 'order-confirmed', 'harvest-complete', 'delivered'],
    },
    {
      workflowId: 'supply-to-store',
      name: 'Supply to Store (Inputs)',
      description: 'Farmer identifies need for inputs, browses supplier catalog, places order, receives delivery, and updates inventory.',
      steps: ['identify-need', 'browse-catalog', 'place-order', 'payment-processing', 'supplier-fulfillment', 'delivery-tracking', 'receiving', 'inventory-update'],
      entities: ['order', 'shipment', 'inventory', 'payment'],
      triggers: ['reorder-point-reached', 'order-placed', 'delivered'],
    },
  ];
}

function stateMachinesForAgriculture(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Crop',
      states: ['planned', 'planted', 'growing', 'flowering', 'fruiting', 'ready-for-harvest', 'harvested', 'processed', 'sold'],
      transitions: { planned: ['planted'], planted: ['growing'], growing: ['flowering'], flowering: ['fruiting'], fruiting: ['ready-for-harvest'], 'ready-for-harvest': ['harvested'], harvested: ['processed'], processed: ['sold'] },
      initialState: 'planned',
      terminalStates: ['sold'],
    },
    {
      entityName: 'ProduceOrder',
      states: ['draft', 'submitted', 'farmer-confirmed', 'harvest-scheduled', 'harvested', 'quality-checked', 'packed', 'shipped', 'delivered', 'completed', 'cancelled', 'disputed'],
      transitions: { draft: ['submitted'], submitted: ['farmer-confirmed', 'cancelled'], 'farmer-confirmed': ['harvest-scheduled', 'cancelled'], 'harvest-scheduled': ['harvested'], harvested: ['quality-checked'], 'quality-checked': ['packed'], packed: ['shipped'], shipped: ['delivered'], delivered: ['completed', 'disputed'] },
      initialState: 'draft',
      terminalStates: ['completed', 'cancelled', 'disputed'],
    },
    {
      entityName: 'Field',
      states: ['idle', 'prepared', 'planted', 'growing', 'fallow', 'under-restoration'],
      transitions: { idle: ['prepared'], prepared: ['planted'], planted: ['growing'], growing: ['idle', 'fallow'], fallow: ['prepared'], 'under-restoration': ['prepared'] },
      initialState: 'idle',
      terminalStates: [],
    },
  ];
}

function edgeCasesForAgriculture(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Severe Weather Event',
      description: 'Hurricane, flood, drought, or unseasonal frost damages crops mid-growing season, destroying expected yield.',
      handling: 'Automated weather alerts from NOAA/IMD trigger farm dashboard warnings. Crop insurance claim workflow initiated. Sensor data (soil moisture, temperature) automatically logged as evidence. Buyers notified of potential delivery delays.',
      recovery: 'Insurance claim filed with sensor data and satellite imagery evidence. Crop replanting scheduled for next viable window. Buyers offered substitute sourcing or refund. Yield forecast model updated with actual loss data.',
    },
    {
      scenario: 'Pest or Disease Outbreak',
      description: 'Unexpected pest infestation (locusts, aphids) or crop disease (blight, mildew) spreads rapidly across fields.',
      handling: 'Agronomist alerted via IoT sensor data anomaly detection. Photo identification tool used by farmer for preliminary diagnosis. Affected fields quarantined in the system. Neighboring farms notified of potential spread risk.',
      recovery: 'Treatment plan generated by agronomist (organic or chemical). Treatment application logged with timing and dosage. Post-treatment monitoring schedule activated. Marketplace listings for affected crops flagged for quality disclosure.',
    },
    {
      scenario: 'Equipment Failure During Critical Window',
      description: 'Tractor, irrigation system, or harvesting equipment breaks down during time-sensitive operations (planting, irrigation, harvest).',
      handling: 'Equipment maintenance history checked for warranty/lease status. Nearby equipment-sharing network notified for availability. Critical operation timeline recalculated. Field workers reassigned to manual alternatives where feasible.',
      recovery: 'Equipment repaired or replacement sourced. Operation timeline adjusted with downstream impact analysis (e.g., delayed harvest affects buyer commitments). Financial impact logged for insurance or warranty claims.',
    },
    {
      scenario: 'Market Price Crash',
      description: 'Global oversupply or demand collapse causes market prices for a crop to plummet below production cost.',
      handling: 'Platform market price feed triggers alerts when prices drop below breakeven. Farmer advised to hold inventory or explore alternative markets. Contract hedging options presented. Storage capacity checked for short-term holding.',
      recovery: 'Strategic decision support: sell at current price vs. hold for recovery. Platform facilitates direct-to-consumer sales at better margins. Crop diversification recommendations for next season.',
    },
  ];
}

function integrationsForAgriculture(): DomainPack['integrations'] {
  return [
    {
      name: 'Weather API',
      type: 'data',
      description: 'Integration with NOAA, OpenWeatherMap, or local meteorological services for hyperlocal weather forecasting and historical data.',
      required: true,
      configuration: 'REST API with location-based queries. 7-day forecast + historical data. Automated alerts for frost, rain, drought conditions. Integrated with field GPS coordinates.',
    },
    {
      name: 'IoT Sensor Network',
      type: 'hardware',
      description: 'Soil moisture, temperature, humidity, and NPK sensors deployed across fields feeding real-time data to the platform.',
      required: false,
      configuration: 'MQTT or LoRaWAN protocol for sensor communication. Data stored in time-series database. Configurable alert thresholds. Sensor health monitoring dashboard.',
    },
    {
      name: 'Satellite Imagery',
      type: 'data',
      description: 'Satellite-based NDVI (Normalized Difference Vegetation Index) imagery for crop health monitoring and yield estimation.',
      required: false,
      configuration: 'API integration with Sentinel-2, Planet Labs, or similar. Weekly imagery with 10m resolution. NDVI calculation and visualization overlaid on field maps. Change detection between periods.',
    },
    {
      name: 'Produce Marketplace',
      type: 'marketplace',
      description: 'Built-in marketplace connecting farmers with buyers for produce sales with quality verification and logistics.',
      required: false,
      configuration: 'Listing management with photo and specification upload. Order matching engine. Quality grade system. Integrated payment and delivery tracking.',
    },
    {
      name: 'Equipment & Input Suppliers',
      type: 'ecommerce',
      description: 'Catalog of agricultural inputs (seeds, fertilizers, equipment) from verified suppliers with bulk ordering.',
      required: false,
      configuration: 'Supplier onboarding with certification verification. Product catalog with seasonal recommendations. Bulk pricing tiers. Delivery scheduling integration.',
    },
    {
      name: 'Payment & Financing',
      type: 'financial',
      description: 'Payment processing for marketplace transactions and integration with agricultural financing providers.',
      required: true,
      configuration: 'Stripe/PayPal for marketplace payments. Integration with agricultural lenders for seasonal financing. Escrow for large transactions. Invoice generation for B2B orders.',
    },
  ];
}

function technicalArchitectureForAgriculture(): TechnicalArchitectureDef {
  return {
    patterns: ['Microservices for farm management, marketplace, and analytics', 'Event-driven sensor data pipeline with message queue', 'CQRS for read-optimized dashboards vs write-optimized data ingestion', 'Geospatial data indexing with PostGIS', 'Time-series database for sensor readings'],
    infrastructure: ['PostgreSQL + PostGIS for geospatial field and crop data', 'InfluxDB or TimescaleDB for IoT sensor time-series data', 'S3-compatible storage for satellite imagery and drone photos', 'Redis for real-time alert caching and sensor data buffering', 'Kafka or SQS for sensor event streaming', 'CDN for satellite imagery tile delivery'],
    dataFlow: 'IoT sensors transmit readings via MQTT → sensor ingestion service writes to time-series DB → anomaly detection engine processes streams → alerts published to notification service → farmer dashboard queries PostgreSQL (field data) + time-series DB (sensor trends) via GraphQL → satellite imagery processor stores tiles in S3 with PostGIS geospatial indexing → marketplace orders flow through order service → payment webhook → fulfillment coordination.',
    scalability: 'Sensor data handled via partitioned time-series databases with downsampling for long-term storage. Geospatial queries optimized with PostGIS R-tree indexes. Satellite imagery delivered via tile CDN with caching layers. Marketplace scales horizontally with stateless API servers. Batch processing for yield predictions and analytics during off-peak hours.',
  };
}

function regulatoryComplianceForAgriculture(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'USDA Organic Certification',
      jurisdiction: 'United States',
      requirements: ['Organic practice documentation and audit trail', 'Input substance whitelist compliance', 'Annual farm inspection records', 'Traceability from farm to buyer', 'Labeling compliance for organic claims'],
      impact: 'Farm practices, input usage, and handling procedures must be fully documented in the platform. Organic certification status tracked per field and per lot. Audit-ready reports generated on demand.',
    },
    {
      regulation: 'FDA Food Safety Modernization Act (FSMA)',
      jurisdiction: 'United States',
      requirements: ['Produce safety rule compliance records', 'Water source testing documentation', 'Animal intrusion monitoring', 'Harvest and post-harvest handling logs', 'Traceability records for produce categories'],
      impact: 'Platform must support food safety plan documentation, water testing schedules, and traceability records per produce lot. Integration with food safety audit workflows.',
    },
    {
      regulation: 'EPA Pesticide Regulations',
      jurisdiction: 'United States',
      requirements: ['Pesticide application logging with product, dosage, and timing', 'Restricted use pesticide certification tracking', 'Buffer zone compliance', 'Record retention for 2+ years', 'Worker safety notification'],
      impact: 'Pesticide application module must capture EPA-registered product names, application rates, dates, and applicator certifications. Automated compliance checks against restricted use lists.',
    },
    {
      regulation: 'Local Agricultural Regulations',
      jurisdiction: 'Per-country / per-state',
      requirements: ['Water rights and usage permits', 'Land use zoning compliance', 'Crop insurance requirements', 'Environmental impact assessments', 'Worker safety and labor regulations'],
      impact: 'Configurable regulatory rules per jurisdiction. Farm registration and permit tracking module. Automated compliance reminders for renewal dates.',
    },
  ];
}

function businessRulesForAgriculture(): BusinessRulesSpec {
  return {
    pricing: [
      'SaaS subscription priced per acre per month with volume discounts above 500 acres (15% off) and 2000 acres (30% off). Annual billing receives 2 months free equivalent.',
      'Marketplace commission is 5% on standard produce sales, 3% on bulk B2B orders over $10,000. Seller pays commission, buyer pays no platform fee.',
      'Equipment leasing includes maintenance package at $50/month add-on. Late return penalty is 15% of daily rate per day overdue.',
      'Input supply markup: seeds 25%, fertilizers 20%, pesticides 15%, equipment parts 30%. Bulk orders (>100 units) receive additional 10% discount.',
      'Agronomist consultation: included with premium subscription (up to 2 hours/month), then $200/hour. On-site visit add-on $500/day plus travel.',
    ],
    cropPlanning: [
      'Crop rotation rule: same crop family cannot be planted in the same field within 3 consecutive seasons unless soil remediation is documented.',
      'Planting date windows: crops planted outside recommended USDA zone windows flagged with risk warning but not blocked.',
      'Pesticide application must follow label-specified re-entry intervals (REI) and pre-harvest intervals (PHI). System warns if harvest scheduled within PHI.',
      'Irrigation scheduling based on soil moisture sensor thresholds: field irrigated when moisture drops below crop-specific minimum.',
      'Yield estimates based on historical data, current sensor readings, and weather forecast. Confidence interval displayed alongside estimate.',
    ],
    orderFulfillment: [
      'Produce orders must be placed at least 72 hours before requested delivery date for standard fulfillment. Rush orders (24h) incur 20% surcharge.',
      'Quality grade must be assigned at harvest and verified at packing. Grade determines marketplace price tier and buyer matching.',
      'Temperature-sensitive produce requires cold chain documentation. Temperature log uploaded with each shipment. Deviations trigger quality flag.',
      'Buyer can reject delivery within 4 hours if quality does not match listing specification. Refund processed within 48 hours of verified rejection.',
      'Minimum order value for delivery: $200. Below this, buyer pays flat $25 delivery fee.',
    ],
    inventoryManagement: [
      'Harvested produce has 7-day shelf life in platform inventory. Automated alerts at day 3 and day 6 for remaining stock.',
      'Input inventory reorder triggered when stock falls below 2-week supply based on current usage rate. Suggested order quantity calculated.',
      'Batch tracking: every harvest batch assigned unique lot number with field, date, and quality grade. Full traceability from field to buyer.',
    ],
    compliance: [
      'All pesticide applications logged within 24 hours of application. Missed logging triggers compliance alert.',
      'Annual organic certification review scheduled 30 days before expiry. Certification status displayed on marketplace listings.',
      'Worker safety training records maintained. Agricultural worker permits tracked per jurisdiction.',
    ],
  };
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const AGRICULTURE_PACK: DomainPack = {
  domain: 'agriculture',
  name: 'Agriculture & Farm Management',
  description: 'Complete farm management and agritech platform — from seed to harvest to market. Covers precision farming with IoT sensors and satellite imagery, crop lifecycle management, farm-to-table marketplace, agricultural supply chain, and regulatory compliance for USDA, FDA, and EPA standards.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Crop Management', 'Field Operations', 'Marketplace', 'Equipment & Inputs', 'Analytics & Insights', 'Weather & Climate'],
    features: [
      'sensor-data',
      'satellite-imagery',
      'crop-calendar',
      'market-prices',
      'supply-catalog',
      'equipment-rental',
      'traceability',
      'organic-certification',
      'yield-prediction',
      'weather-forecasting',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['direct-delivery', 'pickup-at-farm', 'logistics-partner', 'bulk-shipping'],
    features: [
      'harvest-scheduling',
      'cold-chain-tracking',
      'delivery-coordination',
      'quality-grading',
      'batch-tracking',
      'temperature-logging',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'farm-dashboard',
      'field-management',
      'crop-planning',
      'sensor-monitoring',
      'order-tracking',
      'weather-alerts',
      'market-price-alerts',
      'yield-reports',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'inventory',
      'equipment-management',
      'worker-management',
      'financial-tracking',
      'compliance-documentation',
      'pesticide-logging',
      'irrigation-control',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'farm-storytelling',
      'origin-tracking',
      'sustainability-metrics',
      'organic-badges',
      'farm-to-table-journey',
      'seasonal-calendar',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'marketplace-browse',
      'product-listing',
      'about-farming',
      'contact',
      'pricing',
    ],
    customer: [
      'farm-dashboard',
      'field-management',
      'crop-planner',
      'sensor-monitor',
      'marketplace',
      'order-history',
      'weather-widget',
    ],
    admin: [
      'dashboard',
      'farm-management',
      'user-management',
      'supplier-management',
      'billing',
      'compliance-reports',
      'platform-analytics',
    ],
    staff: [
      'field-worker-app',
      'equipment-checkout',
      'task-board',
      'harvest-logging',
      'pesticide-application-log',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForAgriculture(),

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Dashboard-first layout with field map as hero element',
      'Grid-based field management with zoomable map view',
      'Tabbed workflow navigation (plan, monitor, harvest, sell)',
      'Mobile-responsive field worker screens for outdoor tablet use',
      'Data-dense analytics panels with drill-down capability',
      'Seasonal calendar view for crop planning',
    ],
    color: [
      'Earth tones: soil brown (#5D4037), leaf green (#4CAF50), sky blue (#2196F3), sun gold (#FFC107)',
      'Crop health gradient: red (critical) → yellow (warning) → green (healthy) for NDVI visualization',
      'Harvest season accent colors: autumn orange, harvest gold, field green',
      'Low-saturation palette to reduce glare for outdoor tablet use',
      'High-contrast alert colors for weather and pest warnings',
    ],
    typography: [
      'Clean sans-serif (Inter or Open Sans) for data readability',
      'Monospace for sensor readings and measurements',
      'Bold headers for field and crop names',
      'Large touch targets (minimum 48px) for outdoor tablet use',
      'Color-coded status text for quick field scanning',
    ],
    interaction: [
      'Tap-to-zoom field map with pinch gestures on mobile',
      'Swipe between field tabs for quick navigation',
      'Long-press context menus for field actions',
      'Pull-to-refresh sensor data dashboard',
      'Auto-refresh every 5 minutes for critical sensor data',
      'Offline mode for field data entry with sync on reconnect',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance for all dashboards',
      'Screen reader support for field descriptions and sensor alerts',
      'High contrast mode for outdoor visibility',
      'Voice input support for hands-free field logging',
      'Keyboard navigation for all admin functions',
      'Multi-language support for diverse farming communities',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Farmer (own farm data), Farm Manager (multi-farm oversight), Agronomist (read farm data, write recommendations), Buyer (marketplace access), Supplier (product management), Admin (full platform). JWT with 8h expiry. Refresh tokens with 30d. MFA required for admin and financial operations.',
    data: 'Farm data includes field boundaries (geospatial), crop plans, sensor readings (time-series), harvest records, financial transactions, and personal farmer information. IoT data streams encrypted in transit (TLS 1.3) and at rest (AES-256). Data retention: 7 years for compliance records, 3 years for sensor data.',
    compliance: ['USDA organic certification data integrity', 'FDA FSMA traceability records', 'EPA pesticide application logging', 'GDPR for EU farm data', 'Local water rights and land use regulations', 'Worker safety and labor compliance'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Crop rotation rule validation: same family blocked within 3 seasons',
      'Planting date window risk calculation based on USDA zone',
      'Pesticide PHI (pre-harvest interval) enforcement',
      'Irrigation trigger based on soil moisture threshold',
      'Yield prediction algorithm with historical data',
      'Commission calculation for marketplace sales (5% standard, 3% bulk)',
      'SaaS tier pricing per acre with volume discounts',
      'Equipment late return penalty calculation',
    ],
    integration: [
      'IoT sensor data ingestion → time-series DB → dashboard display',
      'Weather API → field alert system → farmer notification',
      'Marketplace order → farmer notification → harvest scheduling → delivery',
      'Pesticide application → compliance check → record storage → audit report',
      'Satellite imagery → NDVI calculation → field health map → recommendation engine',
      'Payment processing → order fulfillment → delivery tracking → completion',
    ],
    e2e: [
      'Farmer onboarding → field setup → crop planning → sensor monitoring → harvest → marketplace sale',
      'Buyer discovers produce → places order → farmer confirms → harvest → quality check → delivery → rating',
      'Equipment lease request → approval → delivery → usage tracking → return → inspection → billing',
      'Admin creates farm account → assigns farmer → configures sensors → generates compliance report',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForAgriculture(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForAgriculture(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForAgriculture(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForAgriculture(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForAgriculture(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForAgriculture(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForAgriculture(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForAgriculture(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForAgriculture(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────

export const AGRICULTURE_DOMAIN: DomainModel = {
  id: AGRICULTURE_PACK.domain,
  domain: AGRICULTURE_PACK.domain,
  name: AGRICULTURE_PACK.name,
  label: AGRICULTURE_PACK.name,
  category: 'agritech',
  description: AGRICULTURE_PACK.description,
  userRoles: [
    { id: 'farmer', name: 'Farmer', typicalFeatures: ['farm-dashboard', 'field-management', 'crop-planning', 'sensor-monitoring'], permissions: ['manage-fields', 'create-crop-plans', 'view-sensor-data', 'place-orders'] },
    { id: 'farm-manager', name: 'Farm Manager', typicalFeatures: ['dashboard', 'worker-management', 'financial-reports', 'crop-planning'], permissions: ['manage-workers', 'approve-purchases', 'view-financial-reports', 'manage-crop-plans'] },
    { id: 'agronomist', name: 'Agronomist', typicalFeatures: ['soil-analysis', 'crop-recommendations', 'pest-identification', 'yield-prediction'], permissions: ['view-farm-data', 'create-recommendations', 'access-sensor-data'] },
    { id: 'buyer', name: 'Buyer', typicalFeatures: ['marketplace', 'order-tracking', 'supplier-ratings', 'bulk-ordering'], permissions: ['browse-listings', 'place-orders', 'track-deliveries', 'rate-suppliers'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'farm-management', 'user-management', 'billing'], permissions: ['*'] },
  ],
  role: 'farmer',
  standardFeatures: [],
  businessModels: [
    { modelType: 'precision-farming-saas', revenueStreams: ['saas-subscription', 'data-insights', 'equipment-leasing'], costStructure: ['cloud-infrastructure', 'sensor-hardware', 'satellite-imagery', 'engineering'], pricingStrategy: ['per-acre-per-month', 'volume-discounts', 'annual-billing'] },
    { modelType: 'farm-to-table-marketplace', revenueStreams: ['marketplace-commission', 'listing-fees', 'buyer-subscriptions'], costStructure: ['payment-processing', 'logistics', 'platform-engineering', 'quality-verification'], pricingStrategy: ['percentage-commission', 'listing-tiered', 'subscription'] },
    { modelType: 'b2b-agricultural-supply', revenueStreams: ['input-markup', 'bulk-discounts', 'leasing-fees'], costStructure: ['inventory', 'supplier-relations', 'logistics', 'quality-control'], pricingStrategy: ['unit-markup', 'volume-tiers', 'bundle-pricing'] },
  ],
  technicalPatterns: [
    { category: 'data', name: 'IoT Sensor Time-Series Pipeline', description: 'Real-time sensor data ingested via MQTT into time-series database for monitoring and alerting', rationale: 'High-volume sensor data requires specialized time-series storage and efficient querying for trends' },
    { category: 'geospatial', name: 'PostGIS Field Mapping', description: 'Geospatial indexing of farm fields with boundary polygons for mapping and area calculations', rationale: 'Field boundaries, soil zones, and equipment tracking require spatial queries' },
    { category: 'analytics', name: 'Satellite NDVI Analysis', description: 'Processing satellite imagery to compute vegetation health indices for crop monitoring', rationale: 'Automated crop health assessment from space provides early warning of issues' },
    { category: 'integration', name: 'Weather Data Aggregation', description: 'Multi-source weather data integration for hyperlocal forecasting and historical analysis', rationale: 'Weather is the primary external factor affecting farm operations and planning' },
  ],
  operationalLifecycle: [
    { id: 'plan', name: 'Plan', description: 'Field preparation, crop selection, and planting schedule creation' },
    { id: 'grow', name: 'Grow', description: 'Active growing season with irrigation, fertilization, and pest monitoring' },
    { id: 'monitor', name: 'Monitor', description: 'Continuous sensor data collection, satellite imagery analysis, and agronomist recommendations' },
    { id: 'harvest', name: 'Harvest', description: 'Harvest timing optimization, execution, quality grading, and post-harvest handling' },
    { id: 'sell', name: 'Sell', description: 'Market listing, order fulfillment, delivery coordination, and payment settlement' },
  ],
  designPrinciples: [
    { name: 'Data-Rich Dashboards', description: 'Field maps, sensor readings, and crop health indicators presented in scannable, actionable formats' },
    { name: 'Outdoor Usability', description: 'High contrast, large touch targets, and offline mode for field tablet use in bright sunlight' },
    { name: 'Seasonal Context', description: 'UI adapts to growing season with relevant actions and alerts prioritized by seasonal needs' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Multi-role farm access', description: 'Granular access per farm with role isolation', severity: 'high' },
    { category: 'data', name: 'Geospatial data protection', description: 'Field boundaries and farm data encrypted at rest and in transit', severity: 'high' },
    { category: 'compliance', name: 'USDA organic audit trail', description: 'Immutable records for organic certification audits', severity: 'medium' },
    { category: 'iot', name: 'Sensor device authentication', description: 'IoT devices authenticated and monitored for tampering', severity: 'medium' },
    { category: 'compliance', name: 'EPA pesticide logging', description: 'Certified application records with regulatory retention', severity: 'medium' },
  ],
  regulations: [
    { name: 'USDA Organic', requirements: ['Organic practice documentation', 'Input substance compliance', 'Annual inspection records', 'Traceability'] },
    { name: 'FDA FSMA', requirements: ['Produce safety records', 'Water testing', 'Harvest handling logs', 'Traceability records'] },
    { name: 'EPA Pesticide', requirements: ['Application logging', 'Certification tracking', 'Buffer zone compliance', '2-year retention'] },
    { name: 'Local Agricultural', requirements: ['Water rights', 'Land use zoning', 'Environmental assessments', 'Labor compliance'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Crop rotation validation', description: 'Same-family crop blocking within 3 seasons', priority: 'high' },
    { category: 'unit', name: 'Pesticide PHI enforcement', description: 'Harvest blocking within pre-harvest interval', priority: 'high' },
    { category: 'integration', name: 'Sensor to dashboard pipeline', description: 'IoT data ingestion to real-time display', priority: 'high' },
    { category: 'e2e', name: 'Plant to harvest to sale', description: 'Full crop lifecycle through marketplace', priority: 'medium' },
  ],
  workflows: [
    { id: 'plant-to-harvest', name: 'Plant to Harvest', steps: ['field-prep', 'seed-selection', 'planting', 'irrigation', 'growing', 'harvest', 'post-harvest'], entities: ['field', 'crop-plan', 'sensor-reading', 'harvest-record'] },
    { id: 'order-to-delivery', name: 'Order to Delivery', steps: ['browse-listings', 'place-order', 'farmer-confirm', 'harvest-schedule', 'quality-check', 'packaging', 'delivery'], entities: ['listing', 'order', 'harvest-record', 'shipment'] },
    { id: 'supply-to-store', name: 'Supply to Store', steps: ['identify-need', 'browse-catalog', 'place-order', 'fulfillment', 'delivery', 'inventory-update'], entities: ['order', 'shipment', 'inventory'] },
  ],
  entities: [
    { name: 'Field', description: 'Farm field with geospatial boundaries, soil data, and crop history', invariants: ['field must have defined boundaries', 'crop rotation rules enforced per field'] },
    { name: 'CropPlan', description: 'Seasonal crop plan with planting dates, expected yields, and input schedules', invariants: ['planting dates within zone windows', 'rotation rules validated'] },
    { name: 'HarvestRecord', description: 'Harvest record with batch number, quality grade, and yield quantity', invariants: ['unique batch number per harvest', 'quality grade assigned before listing'] },
  ],
  invariants: ['crop rotation enforced per field', 'PHI observed before harvest scheduling', 'sensor data timestamp monotonically increasing', 'all pesticide applications logged within 24h', 'organic certification status current for organic-labeled produce'],
  constraints: ['minimum order value $200 for delivery', 'rush order surcharge 20% for <72h fulfillment', 'equipment late return 15%/day penalty', 'marketplace commission 5% standard, 3% bulk', 'SaaS subscription minimum 10 acres'],
  financialFlows: [
    { name: 'saas-subscription', direction: 'in', trigger: 'monthly-subscription-payment' },
    { name: 'marketplace-commission', direction: 'in', trigger: 'produce-sale-completed' },
    { name: 'equipment-lease', direction: 'in', trigger: 'lease-payment' },
    { name: 'supplier-payout', direction: 'out', trigger: 'marketplace-order-settled' },
    { name: 'input-purchase', direction: 'out', trigger: 'supply-order-placed' },
  ],
  successMetrics: ['yield-per-acre', 'crop-quality-grade-distribution', 'order-fulfillment-rate', 'sensor-data-uptime', 'marketplace-gmv', 'subscription-retention-rate', 'compliance-audit-pass-rate'],
  analytics: { tracked: ['yield-trends', 'sensor-readings', 'weather-impact', 'market-prices', 'equipment-utilization', 'crop-health'], dashboards: ['farm-dashboard', 'field-map', 'crop-health', 'marketplace', 'compliance'] },
  securityRequirements: ['jwt-auth', 'mfa-admin', 'tls-sensor-data', 'aes256-encryption', 'geospatial-data-protection', 'device-authentication'],
  regulatory: [
    { regulation: 'USDA Organic', applies: true, notes: 'Certification tracking and audit trail per field' },
    { regulation: 'FDA FSMA', applies: true, notes: 'Produce safety and traceability records' },
    { regulation: 'EPA Pesticide', applies: true, notes: 'Application logging with retention' },
    { regulation: 'Local Agricultural', applies: true, notes: 'Jurisdiction-specific compliance' },
  ],
};
