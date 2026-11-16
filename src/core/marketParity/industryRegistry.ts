/**
 * AETHER Market-Parity Engine — Industry Competitor Feature Registry
 *
 * For EACH industry, includes features from ALL major global competitors.
 * Minimum 50 features per industry. No feature can be missed.
 */

import type { CompetitorFeature, Industry } from './types';

export interface IndustryDefinition {
  industry: Industry;
  industryName: string;
  description: string;
  competitors: string[];
  features: CompetitorFeature[];
}

export const INDUSTRY_REGISTRY: IndustryDefinition[] = [
  // ─── 1. E-COMMERCE ─────────────────────────────────────────────────────────
  {
    industry: 'ecommerce',
    industryName: 'Global E-Commerce & Multi-Vendor Marketplace',
    description: 'B2C/B2B/C2C marketplaces, DTC storefronts, multi-vendor platforms',
    competitors: [
      'Amazon', 'Flipkart', 'eBay', 'Shopify', 'Walmart',
      'Alibaba', 'AliExpress', 'Etsy', 'Mercado Libre', 'Rakuten',
      'Shopee', 'Taobao', 'Wayfair', 'Helium 10',
    ],
    features: [
      // Big Features
      { name: 'Multi-Vendor Buy-Box & Offer Aggregation Engine', competitor: 'Amazon', tier: 'big', implementation: 'Algorithmic Buy-Box winner selection based on landed price, fulfillment type, seller defect rate; "Other Sellers on Platform" drawer with new/used offers.' },
      { name: 'FBM vs FBA Split Fulfillment & Multi-Channel Sync', competitor: 'Amazon', tier: 'big', implementation: 'Merchant-Fulfilled and Platform-Fulfilled inventory pools with automated storage fee calculation, inbound shipment labels, cross-marketplace catalog sync.' },
      { name: 'B2B Request for Quotation (RFQ) & Trade Assurance', competitor: 'Alibaba', tier: 'big', implementation: 'Custom sourcing specs, tiered volume quotes, real-time translated chat, factory video tours, milestone escrow, pre-shipment QC inspection.' },
      { name: 'C2C Proxy Bidding Auction & Make-an-Offer Engine', competitor: 'eBay', tier: 'big', implementation: 'English auction with automatic proxy bid increments up to secret maximum, reserve price enforcement, anti-sniping soft-close, "Buy It Now" hybrid listings, counter-offer state machines with 48-hour expiry.' },
      { name: 'Multi-Currency Global Checkout & Localization', competitor: 'Shopify', tier: 'big', implementation: 'Auto-detects customer currency, displays localized prices, supports 135+ currencies with real-time FX rates, locale-specific checkout flows.' },
      { name: 'Marketplace Commission & Seller Payout Engine', competitor: 'Amazon', tier: 'big', implementation: 'Per-category commission rates, referral fees, FBA fulfillment fees, automated bi-weekly payout settlements with tax withholding and 1099 reporting.' },
      { name: 'Dynamic Pricing & Competitor Price Monitoring', competitor: 'Helium 10', tier: 'big', implementation: 'Automated repricing rules (match lowest, beat by X cents, MAP compliance), competitor price tracking dashboard with Buy Box ownership alerts.' },
      // Popular Features
      { name: 'Pincode Serviceability & Exchange/Trade-In Valuation', competitor: 'Flipkart', tier: 'popular', implementation: 'Instant postal-code lookup with delivery date estimation, old-device IMEI/condition diagnostic trade-in valuation subtracted from checkout total.' },
      { name: 'A+ Enhanced Brand Storytelling & Shoppable Video', competitor: 'Amazon', tier: 'popular', implementation: 'Rich modular brand content blocks, interactive comparison matrices, hotspot shoppable lifestyle photography, creator livestream shopping carousels.' },
      { name: 'Sponsored Products PPC & Festival Flash-Sale Engine', competitor: 'Flipkart', tier: 'popular', implementation: 'Second-price keyword auction engine, ACOS/ROAS reporting, flash-sale waiting rooms, early-access VIP windows, lightning deal claim progress bars.' },
      { name: 'Open-Box Delivery & OTP-Verified Handover', competitor: 'Flipkart', tier: 'popular', implementation: 'Open-Box inspection option at checkout, OTP-verified doorstep inspection with instant refusal or acceptance flow.' },
      { name: 'EMI & BNPL Checkout Integration', competitor: 'Amazon', tier: 'popular', implementation: 'No-cost EMI display at product card and checkout, BNPL installment split visualization, bank card BIN-based eligibility detection.' },
      { name: 'Gift Registry & Wishlist Sharing', competitor: 'Amazon', tier: 'popular', implementation: 'Event-based gift registries (wedding, baby, birthday) with purchased/desired quantity tracking, shared link with privacy controls, gift giver anonymity.' },
      { name: 'Bulk Order & Business Pricing Tiers', competitor: 'Alibaba', tier: 'popular', implementation: 'Volume-based tiered pricing display, MOQ enforcement, business account verification, quote request workflow for custom bulk orders.' },
      { name: 'Seller Central Analytics & Advertising Dashboard', competitor: 'Amazon', tier: 'popular', implementation: 'Sales velocity, organic vs paid traffic breakdown, advertising campaign management, inventory health metrics, return rate analysis, net profit calculator.' },
      { name: 'Cross-Sell & Up-Sell Recommendation Engine', competitor: 'Amazon', tier: 'popular', implementation: '"Frequently Bought Together" graph-mined co-purchase widget, "Customers who viewed this also viewed", "Upgrade to Premium" carousel.' },
      { name: 'Order Tracking & Proactive Delivery Notifications', competitor: 'Amazon', tier: 'popular', implementation: 'Multi-carrier tracking integration, push/SMS notifications at each fulfillment milestone, delivery window estimation, "Meet the Courier" pre-delivery SMS.' },
      { name: 'COD (Cash on Delivery) & Card-on-Delivery', competitor: 'Flipkart', tier: 'popular', implementation: 'COD eligibility by pincode with surcharge display, card machine handover at doorstep with instant POS confirmation, OTP-based handover verification.' },
      { name: 'Try-Before-You-Buy & Virtual Try-On', competitor: 'Amazon', tier: 'popular', implementation: 'Select items, try at home, return what does not fit within trial period; AR virtual try-on for eyewear, shoes, and cosmetics using device camera.' },
      // Micro Features
      { name: 'Save-for-Later, Cart Price-Change Diff & 1-Click Buy', competitor: 'Amazon', tier: 'micro', implementation: 'Persistent saved-for-later list preserving variant choices; price/stock change banners; pre-authorized 1-Click Checkout bypassing intermediate screens.' },
      { name: 'Recently Viewed & Browse History Persistence', competitor: 'Amazon', tier: 'micro', implementation: 'Per-user and per-session browse history with "Continue Browsing" carousel, cross-device sync when authenticated.' },
      { name: 'Verified Purchase Review Badge & Media Lightbox', competitor: 'Amazon', tier: 'micro', implementation: 'Cryptographic order ledger check before awarding verified_purchase badge; horizontal review photo/video strip filterable by variant.' },
      { name: 'Q&A Search Across Product Specs, Reviews & Community', competitor: 'Amazon', tier: 'micro', implementation: 'Unified search querying product specifications, customer reviews, and community Q&A simultaneously with highlighted answer snippets.' },
      { name: 'Subscription & Auto-Replenishment Scheduler', competitor: 'Amazon', tier: 'micro', implementation: 'Subscribe & Save with configurable delivery intervals (1/2/3/6 months), instant skip/swap/pause controls, subscriber-only discount tiers.' },
      { name: 'Return Portal with QR Label Generation', competitor: 'Amazon', tier: 'micro', implementation: 'Self-service return initiation with reason codes, prepaid return label generation (print/QR), drop-off point locator, refund status tracking.' },
      { name: 'Split-Checkout for Multiple Sellers', competitor: 'Amazon', tier: 'micro', implementation: 'Single cart with items from different sellers split into separate checkout transactions with individual shipping costs and delivery timelines.' },
      { name: 'Product Comparison Side-by-Side Table', competitor: 'Amazon', tier: 'micro', implementation: 'Up to 4 products in sticky comparison drawer with highlighted differential attributes, spec sheets, and "Add All to Cart" action.' },
      { name: 'Wishlist Price Drop & Back-in-Stock Alerts', competitor: 'Amazon', tier: 'micro', implementation: 'Push/email notifications when wishlisted items drop in price or come back in stock, with one-tap "Add to Cart" from the alert.' },
      { name: 'Store Locator with Inventory Check', competitor: 'Walmart', tier: 'micro', implementation: 'Map-based store finder with real-time per-store stock availability, "Reserve for Pickup" in 2 hours, and store-specific promotions.' },
      { name: 'Seller Chat & Buyer-Seller Messaging', competitor: 'eBay', tier: 'micro', implementation: 'Encrypted messaging between buyer and seller with order context, template responses, automated dispute escalation flags.' },
      { name: 'Size Guide & Fit Recommendation Engine', competitor: 'Amazon', tier: 'micro', implementation: 'Interactive size charts per brand/category, AI fit recommendation based on height/weight/previous purchases, customer fit histogram ("78% say true to size").' },
      { name: 'Order Notes & Gift Message', competitor: 'Amazon', tier: 'micro', implementation: 'Optional gift wrap selection, personalized gift message card, special delivery instructions for courier.' },
      { name: 'Multi-Currency Display & Domicile Detection', competitor: 'Alibaba', tier: 'micro', implementation: 'Auto-detects customer domicile from IP/accept-language, displays prices in local currency, supports international payment methods.' },
      { name: 'Account Dashboards with Reorder & Recommendations', competitor: 'Amazon', tier: 'micro', implementation: 'Buy Again page with intelligent reorder suggestions, subscription management, address book, payment methods, and order history with status filters.' },
    ],
  },

  // ─── 2. FOOD-BEVERAGE ──────────────────────────────────────────────────────
  {
    industry: 'food-beverage',
    industryName: 'Food & Beverage, Cloud Kitchens & Delivery',
    description: 'Restaurant ordering, food delivery platforms, cloud kitchens, catering',
    competitors: [
      'Zomato', 'Swiggy', 'Uber Eats', 'DoorDash', 'Grubhub',
      'Deliveroo', 'Just Eat Takeaway', 'Rappi', 'Glovo',
    ],
    features: [
      // Big
      { name: 'Hyperlocal Delivery Dispatch & Live Courier Tracking', competitor: 'Zomato', tier: 'big', implementation: 'Real-time WebSocket map with smooth coordinate interpolation, 5-stage animated status bar, QR-code courier claim, masked calling/chat between customer and courier.' },
      { name: 'Restaurant Onboarding & Menu Management System', competitor: 'Swiggy', tier: 'big', implementation: 'Multi-location restaurant onboarding with FSSAI/license verification, menu builder with categories, add-ons, and availability scheduling, daily report card with ratings.' },
      { name: 'Dynamic Delivery SLA & Surge Pricing Engine', competitor: 'DoorDash', tier: 'big', implementation: 'Real-time SLA estimation based on restaurant prep time, traffic, weather, and courier density; surge fee display and Dasher incentive boost during peak hours.' },
      { name: 'Contactless Delivery & Safety Protocols', competitor: 'Uber Eats', tier: 'big', implementation: 'Leave-at-door/counter pickup with photo proof, contactless handoff instructions, food safety temperature logging for cold-chain items.' },
      { name: 'Bulk Corporate Catering & Group Order Management', competitor: 'DoorDash', tier: 'big', implementation: 'Corporate catering menus with per-person customization, group order links with deadline, consolidated billing, and delivery to specific floors/zones.' },
      { name: 'Cloud Kitchen Brand Management & Multi-Brand Dashboard', competitor: 'Swiggy', tier: 'big', implementation: 'Single kitchen managing multiple virtual brands, per-brand menu and pricing, shared kitchen resources, consolidated financial reporting.' },
      // Popular
      { name: 'Dietary Preference & Allergen Filtering', competitor: 'Zomato', tier: 'popular', implementation: 'Filter by vegan, vegetarian, Jain, halal, gluten-free, nut-free; per-item allergen badges with severity indicators and cross-contamination warnings.' },
      { name: 'Curated Collections & Food Trends Discovery', competitor: 'Zomato', tier: 'popular', implementation: '"Best of" curated collections, trending dishes near you, "Popular this week" carousels, chef specials, and new restaurant launch features.' },
      { name: 'Table Booking & Dine-In Experience', competitor: 'Zomato', tier: 'popular', implementation: 'Pre-order food for dine-in, table reservation with guest count and time slot, waitlist management, in-table QR ordering integration.' },
      { name: 'Food Festival & Campaign Promotions', competitor: 'Swiggy', tier: 'popular', implementation: 'Festival-specific landing pages (Diwali feasts, Ramadan iftar), brand-sponsored campaigns, exclusive menu items, limited-time offers with countdown timers.' },
      { name: 'Wallet & Super Program Loyalty', competitor: 'Zomato', tier: 'popular', implementation: 'Prepaid wallet with auto-top-up, Zomato Pro subscription with free delivery, reward points on every order, birthday bonuses, and partner brand discounts.' },
      { name: 'Rating & Review with Food Photos', competitor: 'Zomato', tier: 'popular', implementation: 'Star ratings with taste/decor/service sub-ratings, customer food photos with upvote system, restaurant response to reviews, review searchability.' },
      { name: 'Push & SMS Order Status Notifications', competitor: 'Swiggy', tier: 'popular', implementation: 'Multi-channel notifications at every stage (confirmed, preparing, picked up, nearby, delivered), with ETA countdown and courier details.' },
      { name: 'Address Autocomplete & Saved Delivery Addresses', competitor: 'DoorDash', tier: 'popular', implementation: 'Google Places autocomplete, landmark-based address descriptions, saved frequent addresses with nicknames, delivery instructions.' },
      { name: 'Scheduled Delivery & Meal Planning', competitor: 'DoorDash', tier: 'popular', implementation: 'Schedule orders for future delivery windows (same-day or next-day), subscription-based meal plan delivery, repeat order shortcuts.' },
      // Micro
      { name: 'Order Modifications After Placement', competitor: 'Uber Eats', tier: 'micro', implementation: 'Add/remove items or special instructions after checkout (before restaurant confirms), with automatic price adjustment.' },
      { name: 'Grab & Go / Quick Commerce (10-min Delivery)', competitor: 'Swiggy', tier: 'micro', implementation: 'Dark store inventory for instant delivery, real-time stock indicators, optimized picker routing within dark store.' },
      { name: 'Bill Splitting Among Friends', competitor: 'Zomato', tier: 'micro', implementation: 'Split bill equally or by item, request payment from friends via app, track payment status, consolidate into single payment to restaurant.' },
      { name: 'Favourite Restaurants & Collections', competitor: 'Zomato', tier: 'micro', implementation: 'Save favorite restaurants, create custom collections ("Date Night Spots", "Late Night Eats"), share collections with friends.' },
      { name: 'Re-Order from Order History', competitor: 'Zomato', tier: 'micro', implementation: 'One-tap reorder from previous orders, with smart suggestions for variations ("Same as last time" or "Try something new").' },
      { name: 'Restaurant Photo Gallery & Menu Search', competitor: 'Zomato', tier: 'micro', implementation: 'High-quality food and ambiance photos, search within menu by dish name or ingredient, popular dishes highlighted.' },
      { name: 'Delivery Fee Transparency & Cost Breakdown', competitor: 'DoorDash', tier: 'micro', implementation: 'Itemized delivery fee showing distance, demand, Dasher tip contribution, surge indicator, and subscription discount savings.' },
      { name: 'In-App Support Chat with Smart FAQ', competitor: 'Swiggy', tier: 'micro', implementation: 'Context-aware support bot for order issues, one-tap escalation to human agent, order-linked chat history for support agents.' },
      { name: 'Promo Codes & Referral Discounts', competitor: 'Zomato', tier: 'micro', implementation: 'Auto-applied best promo code, referral rewards for both referrer and referee, first-order discounts, festival-specific promo campaigns.' },
    ],
  },

  // ─── 3. COFFEE SHOP ────────────────────────────────────────────────────────
  {
    industry: 'coffee-shop',
    industryName: 'Specialty Coffee Shops, Cafes & Bean Subscriptions',
    description: 'Coffee shop ordering, bean subscriptions, cafe POS, loyalty programs',
    competitors: [
      'Starbucks', 'Blue Bottle Coffee', 'Intelligentsia', 'Stumptown',
      'Philz Coffee', 'La Colombe', 'Verve Coffee', 'Counter Culture',
    ],
    features: [
      // Big
      { name: 'Deep Drink/Food Modifier & Nested Customization Engine', competitor: 'Starbucks', tier: 'big', implementation: 'Multi-group modifier trees with min/max cardinality, fractional quantities (Light/Regular/Extra), espresso shot swaps (Single/Double/Triple/Quad, Decaf, Half-Caf, Blonde), milk matrix (Whole, Oat, Almond, Soy, Coconut), syrup pump steppers (0-12 with per-pump upcharge), temperature options, real-time calorie/caffeine/macro/allergen recalculation.' },
      { name: 'Real-Time Kitchen Display System (KDS) & Prep-Station Routing', competitor: 'Toast', tier: 'big', implementation: 'Paperless ticket routing across Espresso Bar, Cold Bar/Pour-Over, Pastry Oven, Expo Screen; color-coded modifier badges, automated course firing by prep-time duration, offline LAN fallback, SMS/Push trigger on "Bump/Ready".' },
      { name: 'Roast-to-Order Coffee Bean Subscription & Brew-Method Quiz', competitor: 'Blue Bottle', tier: 'big', implementation: 'Interactive taste and brewing quiz (Pour-Over V60/Chemex, Espresso, French Press, AeroPress, Cold Brew) recommending single-origin/blend subscriptions with selectable grind, bag count, delivery cadence (1/2/3/4 weeks), multi-unit savings, roast-date batch tracking, 1-click skip/swap/pause.' },
      { name: 'Interactive Floor Plan, Table Reservation & Unified Guest CRM', competitor: 'OpenTable', tier: 'big', implementation: 'Drag-and-drop dining room floor map with table turn-time estimation, credit card deposit for peak slots, waitlist SMS paging, QR-code tableside ordering (table_id bound), split-check by seat/item/fraction, unified guest profiles linking reservation history and POS spend.' },
      { name: 'Geofenced Store Selector, Live Prep Queue & Curbside', competitor: 'Starbucks', tier: 'big', implementation: 'Map-based store locator with live hours, drive-thru vs walk-in availability, dynamic prep-time ETA from KDS backlog, "I\'m Here" curbside check-in with parking spot.' },
      // Popular
      { name: 'Stored-Value Wallet, Stars/Points Loyalty & Gift a Drink', competitor: 'Blue Bottle', tier: 'popular', implementation: 'In-app stored-value with auto-reload, barcode/QR scanner for in-cafe earning (1pt/$), tiered reward redemption (75pts gift drink, 150pts free beverage), instant digital gift vouchers.' },
      { name: 'Starbucks Rewards Tier System (Member/Silver/Gold/Green)', competitor: 'Starbucks', tier: 'popular', implementation: 'Star earning on every purchase, tier progression with benefits (free refills, birthday reward, exclusive access), mobile order-ahead with pay, order-ahead scheduling.' },
      { name: 'Mobile Order-Ahead & Pay', competitor: 'Starbucks', tier: 'popular', implementation: 'Pre-order for pickup or delivery, saved favorites for 1-tap reorder, estimated ready time, in-store navigation to pickup counter.' },
      { name: 'Live Courier Map Tracking for Delivery Orders', competitor: 'Zomato', tier: 'popular', implementation: 'Real-time WebSocket map with courier position, smooth interpolation, 5-stage status bar, masked courier calling from within app.' },
      { name: 'Coffee Origin & Roast Profile Cards', competitor: 'Blue Bottle', tier: 'popular', implementation: 'Interactive product cards showing elevation, varietal, processing method (Washed/Natural/Anaerobic), tasting notes radar chart, roast level indicator, pairing suggestions.' },
      { name: 'Brew Timer & Pour-Over Recipe Integration', competitor: 'Blue Bottle', tier: 'popular', implementation: 'Step-by-step brew timer (bloom time, pour intervals in grams/ml, water temperature) integrated per single-origin product page.' },
      { name: 'Cafe Locator with Live Hours & Amenities', competitor: 'Starbucks', tier: 'popular', implementation: 'Map-based store finder with live hours, amenity filters (WiFi, drive-thru, patio, pet-friendly, parking), store-specific menu availability.' },
      { name: 'Birthday Reward & Anniversary Free Drink', competitor: 'Starbucks', tier: 'popular', implementation: 'Birthday free beverage with week-long redemption window, account anniversary bonus stars, personalized birthday message in app.' },
      { name: 'Double-Star Days & Promotional Multipliers', competitor: 'Starbucks', tier: 'popular', implementation: 'Scheduled double/triple star events, targeted promotions per user segment, limited-time bonus star challenges.' },
      // Micro
      { name: 'Instant "86 Item" Depletion Sync Across Channels', competitor: 'Toast', tier: 'micro', implementation: 'When barista marks item as 86\'d on POS/KDS, it grays out across web, mobile, tableside QR, delivery aggregator menus within 500ms.' },
      { name: 'Daypart Menu Switching (Breakfast/Lunch/Evening)', competitor: 'Toast', tier: 'micro', implementation: 'Automatic menu transitions based on time of day, with prep-time adjustments and daypart-specific availability rules.' },
      { name: 'Smart Tipping Presets & Pre-Tax Calculation', competitor: 'Toast', tier: 'micro', implementation: 'Dynamic percentage/flat tip buttons calculated on pre-tax subtotal, custom tip entry, default tip percentage settings by service type.' },
      { name: 'Group Cart Locking for Office Orders', competitor: 'DoorDash', tier: 'micro', implementation: 'Shareable group-order links where members add labeled items to a shared basket before the host locks and pays; deadline-based auto-close.' },
      { name: 'Cutlery Opt-Out & Eco-Friendly Options', competitor: 'DoorDash', tier: 'micro', implementation: 'Persistent eco-friendly cutlery/napkin/condiment opt-out toggle at checkout, carbon footprint estimate display per order.' },
      { name: 'Saved Favorite Orders for 1-Tap Reorder', competitor: 'Starbucks', tier: 'micro', implementation: 'Save exact customized drink as favorite, one-tap reorder with saved modifiers, quick-add from recent orders.' },
      { name: 'QR Code Tableside Ordering', competitor: 'Toast', tier: 'micro', implementation: 'QR code at each table opens menu with table_id binding, guests add items to shared tab, split payment at end.' },
      { name: 'In-Store Wi-Fi Captive Portal with Menu Preview', competitor: 'La Colombe', tier: 'micro', implementation: 'Free Wi-Fi landing page with today\'s menu, specials, and loyalty sign-up CTA before granting network access.' },
      { name: 'Coffee Subscription Roast Calendar', competitor: 'Blue Bottle', tier: 'micro', implementation: 'Visual calendar showing upcoming subscription shipment dates, roast profiles for each month, skip/swap deadlines with visual reminders.' },
      { name: 'Allergen & Calorie Calculator on Every Drink', competitor: 'Starbucks', tier: 'micro', implementation: 'Real-time nutritional info panel updating as modifiers change, allergen icon badges per ingredient, caffeine content display.' },
    ],
  },

  // ─── 4. RESTAURANT ────────────────────────────────────────────────────────
  {
    industry: 'restaurant',
    industryName: 'Restaurant POS, Table Management & Dine-In',
    description: 'Full-service restaurant POS, table management, kitchen display, dine-in ordering',
    competitors: [
      'Toast', 'Square for Restaurants', 'OpenTable', 'Resy',
      'ChowNow', 'SevenRooms', 'Tock', 'Yelp Reservations',
    ],
    features: [
      { name: 'Full-Featured Restaurant POS with Split Checks', competitor: 'Toast', tier: 'big', implementation: 'Terminal and mobile POS, item modifiers and combos, split check by seat/item/fraction/percentage, course management, comp/void with reason codes.' },
      { name: 'Kitchen Display System (KDS) with Course Firing', competitor: 'Toast', tier: 'big', implementation: 'Real-time ticket routing by station (hot, cold, bar, expo), color-coded priority, automated course firing by timer, bump bar with audio alerts, prep-time analytics.' },
      { name: 'Floor Plan & Table Management with Turn-Time', competitor: 'OpenTable', tier: 'big', implementation: 'Visual floor plan with table status colors, estimated turn-time per section, host stand with waitlist, section-based server assignment, table combine/split.' },
      { name: 'Online Ordering with Unified Menu', competitor: 'ChowNow', tier: 'big', implementation: 'White-label branded ordering site/app, unified menu across dine-in/takeout/delivery, order routing to POS, kitchen ticket printing.' },
      { name: 'Reservation Management with Deposit & No-Show', competitor: 'Tock', tier: 'big', implementation: 'Time-slot reservations with deposit requirement for peak times, no-show fee enforcement, waitlist auto-fill from cancellations, table preference tracking.' },
      { name: 'Staff Management & Tip Pooling', competitor: 'Square', tier: 'big', implementation: 'Role-based POS access, clock in/out with GPS verification, tip allocation (pooled vs individual), sales reporting by server/shift.' },
      { name: 'Inventory & COGS Tracking', competitor: 'Toast', tier: 'popular', implementation: 'Recipe-based ingredient depletions, real-time inventory levels, waste logging, automatic purchase order generation, COGS reporting by item and category.' },
      { name: 'Customer Relationship Management (CRM)', competitor: 'SevenRooms', tier: 'popular', implementation: 'Guest profiles with dining history, preferences and allergies, birthday/anniversary tracking, automated marketing campaigns, review request automation.' },
      { name: 'Online & Offline Payment Processing', competitor: 'Square', tier: 'popular', implementation: 'Integrated payment processing with EMV chip, contactless, Apple Pay, Google Pay; tip at payment; end-of-day batch settlement; refund management.' },
      { name: 'Reporting & Business Intelligence', competitor: 'Toast', tier: 'popular', implementation: 'Sales reports by hour/day/week/month, top-selling items, labor cost analysis, table turn-time metrics, customer retention analytics, export to CSV/PDF.' },
      { name: 'Third-Party Delivery Aggregator Integration', competitor: 'Toast', tier: 'popular', implementation: 'Unified view of orders from DoorDash, Uber Eats, Grubhub, Postmates; auto-printing to KDS; single dashboard for all delivery channels.' },
      { name: 'QR Code & Tableside Ordering', competitor: 'Toast', tier: 'popular', implementation: 'QR code at each table opens digital menu, guests browse and order directly to kitchen, server receives notification for drink refills or assistance requests.' },
      { name: 'Loyalty & Gift Card Program', competitor: 'Square', tier: 'popular', implementation: 'Points-based loyalty ("spend $100 get $10 off"), digital gift card purchase and redemption, birthday rewards, email/SMS marketing campaigns.' },
      { name: 'Multi-Location Management', competitor: 'Toast', tier: 'popular', implementation: 'Central management across multiple restaurant locations, consolidated reporting, centralized menu updates, staff scheduling across locations, inter-location inventory transfers.' },
      // Micro
      { name: 'Course Management & Fire Timing', competitor: 'OpenTable', tier: 'micro', implementation: 'Hold/fire/recall course controls, automatic course firing based on prep time estimates, server notification when course is ready.' },
      { name: 'Void & Comp Management with Reason Codes', competitor: 'Toast', tier: 'micro', implementation: 'Predefined void reasons (customer request, kitchen error, 86 item), manager override for comps, audit trail for all voids/comps.' },
      { name: 'Happy Hour & Time-Based Pricing', competitor: 'Toast', tier: 'micro', implementation: 'Automatic special pricing during configured hours, day-of-week specials, automatic menu item promotion/unpromotion at scheduled times.' },
      { name: 'Split Tendering Across Payment Methods', competitor: 'Square', tier: 'micro', implementation: 'Split payment between cash, card, gift card, loyalty points; handle partial declines gracefully with re-present flow.' },
      { name: 'End-of-Day Reconciliation', competitor: 'Toast', tier: 'micro', implementation: 'Cash drawer count with variance reporting, tip-out calculations, deposit preparation, daily sales summary, auto-close shift procedure.' },
      { name: 'Modifier Groups with Selections & Pricing', competitor: 'Toast', tier: 'micro', implementation: 'Required/optional modifier groups, multi-select with max limits, per-modifier price adjustments, modifier recipe depletions.' },
      { name: 'Waitlist & Host Stand', competitor: 'OpenTable', tier: 'micro', implementation: 'Guest name, party size, phone number, estimated wait time, SMS notification when table is ready, quote vs actual wait time tracking.' },
      { name: 'Pre-authorization for Large Parties', competitor: 'OpenTable', tier: 'micro', implementation: 'Credit card hold for parties above threshold, pre-auth capture on no-show, automatic release if guest checks in on time.' },
    ],
  },

  // ─── 5. HEALTHCARE ────────────────────────────────────────────────────────
  {
    industry: 'healthcare',
    industryName: 'Healthcare, Telemedicine & Clinical Scheduling',
    description: 'Patient appointment booking, telemedicine, EMR/EHR portals, diagnostics',
    competitors: [
      'Zocdoc', 'Practo', 'Teladoc', 'Healthgrades',
      'Epic MyChart', 'Cerner', 'Amwell', 'Doctor on Demand',
    ],
    features: [
      // Big
      { name: 'Clinical-Aware Real-Time Appointment Scheduling', competitor: 'Zocdoc', tier: 'big', implementation: 'Slots governed by visit type durations (New Patient: 45min, Follow-Up: 15min, Annual Physical: 30min), equipment/room constraints, provider availability windows, buffer times.' },
      { name: 'OCR Insurance Card Scanning & Eligibility Verification', competitor: 'Zocdoc', tier: 'big', implementation: 'Mobile camera capture of insurance card, OCR text extraction, real-time eligibility API call (Availity/Change Healthcare), copay estimate display before booking confirmation.' },
      { name: 'HIPAA-Compliant WebRTC Telemedicine Waiting Room', competitor: 'Practo', tier: 'big', implementation: 'Browser/mobile video consultation with virtual waiting room queue, pre-visit intake questionnaire & vitals triage, end-to-end encryption, session recording with consent.' },
      { name: 'SOAP Clinical Charting & ICD-10/CPT Code Autocomplete', competitor: 'Teladoc', tier: 'big', implementation: 'Structured SOAP note editor (Subjective, Objective, Assessment, Plan), ICD-10 diagnosis autocomplete, CPT procedure code selection, e-prescribe integration, visit summary generation.' },
      { name: 'E-Prescribing & Drug-Interaction Checker', competitor: 'Practo', tier: 'big', implementation: 'Structured digital prescription with dosage verification against patient weight/renal function/allergies, drug-drug interaction matrix, formulary check, e-prescribe to pharmacy network.' },
      // Popular
      { name: 'Longitudinal Health Record & Lab Trend Visualizer', competitor: 'Epic MyChart', tier: 'popular', implementation: 'Historical lab biomarkers with reference-range bands, DICOM imaging viewer, immunization registry, medication list, family/caregiver proxy access with consent.' },
      { name: 'Verified Provider Profiles & Patient Reviews', competitor: 'Zocdoc', tier: 'popular', implementation: 'Board certification verification, education and credential display, verified patient reviews (only patients with completed encounters), response rate metrics.' },
      { name: 'Online Lab Sample Collection & Diagnostic Booking', competitor: 'Practo', tier: 'popular', implementation: 'Home sample collection scheduling, lab test package browsing with turnaround times, report delivery via secure portal, abnormal flag alerts.' },
      { name: 'Symptom Checker & Condition Matching', competitor: 'Teladoc', tier: 'popular', implementation: 'AI-guided symptom questionnaire, condition probability matching, recommended specialty/treatment pathway, nearest provider matching.' },
      { name: 'Patient Portal with Secure Messaging', competitor: 'Epic MyChart', tier: 'popular', implementation: 'Secure HIPAA-compliant messaging with care team, appointment requests, prescription refill requests, medical record download, billing statements.' },
      // Micro
      { name: 'Automated Waitlist Fast-Fill via Cancellations', competitor: 'Zocdoc', tier: 'micro', implementation: 'When patient cancels/reschedules via self-service, freed slot offered to waitlisted patients with auto-notification and 1-click acceptance.' },
      { name: 'Verified Patient Review Badges', competitor: 'Zocdoc', tier: 'micro', implementation: 'Reviews can only be submitted by patients with completed encounter status; verified badge with visit date displayed on review.' },
      { name: 'Virtual Waiting Room with Queue Position', competitor: 'Teladoc', tier: 'micro', implementation: 'Real-time queue position display, estimated wait time, join from mobile notification when provider is ready, pre-visit document upload.' },
    ],
  },

  // ─── 6. AI PLATFORM ───────────────────────────────────────────────────────
  {
    industry: 'ai-platform',
    industryName: 'AI Platform, Foundation Models & Developer Cloud',
    description: 'LLM API platforms, AI coding agents, generative media studios, RAG platforms',
    competitors: [
      'OpenAI', 'Anthropic', 'Hugging Face', 'Perplexity',
      'Cursor', 'Cognition (Devin)', 'Midjourney', 'Runway',
      'ElevenLabs', 'Vercel AI Gateway', 'Cloudflare AI Gateway',
    ],
    features: [
      // Big
      { name: 'Multi-Model Streaming Workbench & Conversation Branching', competitor: 'Anthropic', tier: 'big', implementation: 'Low-latency SSE token streaming, syntax-highlighted code blocks, LaTeX rendering, non-destructive conversation tree branching, side-by-side artifact preview (HTML/React/SVG/Mermaid/Python) with version diffs.' },
      { name: 'Claim-Level Cited Answer Engine & Hybrid RAG', competitor: 'Perplexity', tier: 'big', implementation: 'Multi-hop query planner decomposing questions into parallel sub-queries, hybrid BM25 + dense embedding retrieval + cross-encoder reranking, structured answers with inline claim-level citations across follow-up turns.' },
      { name: 'Autonomous Multi-File Codebase Agent & Sandboxed Execution', competitor: 'Cursor', tier: 'big', implementation: 'Repo-aware AST indexing, multi-file semantic diff patching, iterative test-driven debugging in isolated container, browser preview inspection, 1-click Apply/Reject hunk controls.' },
      { name: 'Token-Metered Billing Ledger & AI Gateway Failover', competitor: 'Vercel', tier: 'big', implementation: 'Sub-cent nano_dollar accounting per 1M input/cached-input/output/reasoning tokens, prepaid credit wallet with auto-top-up, Zero Data Retention routing, semantic caching, automatic multi-provider failover.' },
      { name: 'Fine-Tuning (SFT/DPO), Evals Pipeline & Dataset Hub', competitor: 'OpenAI', tier: 'big', implementation: 'JSONL training data validator, SFT job scheduler with live loss curves, automated LLM-as-a-Judge eval suites, public/private Model & Dataset Cards with Parquet viewer (HuggingFace style).' },
      { name: 'Generative Multimodal Studio (Image, Video, Voice & 3D)', competitor: 'Midjourney', tier: 'big', implementation: 'Character/style reference locking across generations, inpainting/outpainting canvas, keyframe image-to-video timeline, voice cloning with emotional prosody controls, video-to-3D Gaussian Splatting.' },
      // Popular
      { name: 'Deterministic Structured Outputs & Tool-Use Orchestration', competitor: 'Anthropic', tier: 'popular', implementation: 'JSON Schema constrained decoding, parallel function calling, MCP server connectors, human-in-the-loop approval gates before external write actions.' },
      { name: 'Enterprise Brand Voice & Multi-Asset Campaign Studio', competitor: 'Jasper', tier: 'popular', implementation: 'Upload brand style samples to train tone profiles, campaign-level briefing, coordinated multi-channel asset generation in single workflow, brand compliance checker.' },
      { name: 'Prompt Library & Team Collaboration', competitor: 'OpenAI', tier: 'popular', implementation: 'Shared prompt library with versioning, team workspaces, prompt templates with variable injection, A/B testing of prompts, usage analytics per prompt.' },
      { name: 'API Key Management & Usage Analytics', competitor: 'OpenAI', tier: 'popular', implementation: 'Project-scoped secret keys with model allowlists, monthly spend caps, real-time RPM/TPM sliding-window headers, per-key usage dashboards and cost projections.' },
      { name: 'Embeddings & Vector Store Integration', competitor: 'OpenAI', tier: 'popular', implementation: 'Text-embedding API with dimension options (ada-002, 3-small), pgvector/HNSW index management, batch embedding jobs, similarity search playground.' },
      { name: 'Function Calling & Plugin Marketplace', competitor: 'OpenAI', tier: 'popular', implementation: 'Declarative function schemas with descriptions, automatic parameter extraction from conversations, plugin marketplace with one-click installation, sandboxed execution environment.' },
      // Micro
      { name: 'OpenAI SDK Compatibility Layer', competitor: 'Anthropic', tier: 'micro', implementation: 'Drop-in OpenAI SDK compatibility with base_url override, supporting streaming, function calling, vision, and all standard OpenAI API patterns.' },
      { name: 'Agent Trace Waterfall & Playground Diff', competitor: 'Agent Frameworks', tier: 'micro', implementation: 'Span-level waterfall inspector showing latency, token counts, tool arguments, cost per agent step; side-by-side Playground comparing system prompts or temperature settings.' },
      { name: 'Token Counter & Cost Estimator', competitor: 'OpenAI', tier: 'micro', implementation: 'Real-time token counting in playground, cost estimation before API call, token budget warnings, character vs token count toggle.' },
      { name: 'Model Comparison Side-by-Side', competitor: 'OpenAI', tier: 'micro', implementation: 'Side-by-side playground comparing two models on same prompt, blind evaluation mode, leaderboard of model performance on test set.' },
      { name: 'System Prompt Template Gallery', competitor: 'OpenAI', tier: 'micro', implementation: 'Curated system prompt templates for common use cases (coding, writing, analysis, translation), one-click copy and customization.' },
      { name: 'Rate Limit Header Display', competitor: 'OpenAI', tier: 'micro', implementation: 'Real-time display of RPM/TPM usage headers, retry-after countdown, rate limit tier visualization, upgrade prompts when approaching limits.' },
      { name: 'Prompt Caching Dashboard', competitor: 'Anthropic', tier: 'micro', implementation: 'Cache hit/miss ratio visualization, prompt token savings display, cache TTL management, cost comparison with/without caching.' },
      { name: 'Safety & Moderation API Integration', competitor: 'OpenAI', tier: 'micro', implementation: 'Built-in content moderation layer, policy violation detection with category labels, configurable content filters, safety threshold tuning.' },
    ],
  },

  // ─── 7. BOOKING ────────────────────────────────────────────────────────────
  {
    industry: 'booking',
    industryName: 'Travel, Hospitality & Booking Platforms',
    description: 'Hotel bookings, restaurant reservations, ride-hailing, vacation rentals',
    competitors: [
      'Booking.com', 'Airbnb', 'Expedia', 'Vrbo', 'OpenTable',
      'Uber Reserve', 'Hostaway', 'Smoobu',
    ],
    features: [
      // Big
      { name: 'Date-Range Availability Matrix & Dynamic Nightly Pricing', competitor: 'Airbnb', tier: 'big', implementation: 'Calendar engine storing per-night integer-cent rates, min/max length-of-stay, closed-to-arrival/departure restrictions, cleaning/extra-guest fees, bidirectional iCal/API channel sync.' },
      { name: 'Tiered Time-Decay Cancellation & Refund Engine', competitor: 'Airbnb', tier: 'big', implementation: 'Exact rules for Flexible/Moderate/Limited/Firm/Strict tiers computing full/partial refunds plus pro-rated tax refunds based on hours before check-in, optional Paid Flexible upgrade.' },
      { name: 'On-Demand & Scheduled Ride Dispatch with Wait-Time SLA', competitor: 'Uber Reserve', tier: 'big', implementation: 'Geospatial H3 hexagonal matching, upfront fare estimation, scheduled advance reservations with 15-min grace window, multi-stop route optimization, wait-time SLA guarantees.' },
      { name: 'Split-Stay Builder for Long Trips', competitor: 'Airbnb', tier: 'big', implementation: 'If single property unavailable for long trip, engine auto-pairs two sequential stays into unified Split Stay itinerary with transportation suggestions.' },
      { name: 'Property Management & Channel Manager Sync', competitor: 'Hostaway', tier: 'big', implementation: 'Central property dashboard, multi-channel calendar sync (Airbnb/Booking/VRBO), automated messaging sequences, review management, owner reporting.' },
      // Popular
      { name: 'Synchronized Map-Viewport Search with Price Pins', competitor: 'Booking.com', tier: 'popular', implementation: 'Moving/zooming map dynamically updates property cards with total-stay or nightly price pins, filter controls overlay, list/map split view toggle.' },
      { name: 'Instant Book vs Request-to-Book', competitor: 'Airbnb', tier: 'popular', implementation: 'Host-configured instant booking eligibility, instant vs request flow toggle, instant book requirements (verified ID, positive reviews, message to host).' },
      { name: 'Guest & Host Review System', competitor: 'Airbnb', tier: 'popular', implementation: 'Double-blind reviews (reviews revealed after both parties submit), star ratings across categories, public profiles with review history, host response capability.' },
      { name: 'Secure Messaging Between Guest & Host', competitor: 'Airbnb', tier: 'popular', implementation: 'Pre-booking inquiry messaging, booking-linked conversations, template responses, automated message sequences, attachment support, phone number masking.' },
      { name: 'Payment Escrow & Host Payout Scheduling', competitor: 'Airbnb', tier: 'popular', implementation: 'Payment held in escrow until check-in, automatic host payout 24 hours after check-in, host service fee deduction, tax reporting (1099) generation.' },
      { name: 'PMS Integrated Folio & Smart-Lock Access Codes', competitor: 'Hostaway', tier: 'popular', implementation: 'On-property POS charges post to room folio via Stripe integration, time-bounded smart-lock PIN codes active between check-in and check-out timestamps.' },
      { name: 'Experience & Activity Booking', competitor: 'Airbnb', tier: 'popular', implementation: 'Local experience marketplace with time-slot booking, host profiles, capacity limits, instant/request booking, reviews and ratings.' },
      // Micro
      { name: 'Wishlist & Saved Property Collections', competitor: 'Airbnb', tier: 'micro', implementation: 'Create named wishlists, save properties for future trips, share wishlists with travel companions, collaboration editing, price-drop notifications.' },
      { name: 'Price Alerts & Date Flexibility Search', competitor: 'Airbnb', tier: 'micro', implementation: '"Track price" alerts on saved searches, flexible date search (weekend, week, month), price graph showing seasonal trends, "You saw this for $X" reminders.' },
      { name: 'Check-in Guide & Self Check-in', competitor: 'Airbnb', tier: 'micro', implementation: 'Digital check-in guide with lock codes, self check-in with smart lock, photo ID verification for in-person check-in, key pickup instructions.' },
      { name: 'House Rules & Guest Requirements', competitor: 'Airbnb', tier: 'micro', implementation: 'Configurable house rules (no smoking, no pets, no parties), guest requirements (ID verification, linked accounts), suitability questionnaires.' },
      { name: 'Trip Itinerary & Add-on Services', competitor: 'Airbnb', tier: 'micro', implementation: 'Unified trip view with property, experiences, and restaurant reservations; local partner recommendations (cleaning, experiences, transport).' },
      { name: 'Cancellation Insurance Upsell', competitor: 'Booking.com', tier: 'micro', implementation: 'Optional trip protection insurance at checkout, coverage details display, one-click add to booking, third-party claims integration.' },
    ],
  },

  // ─── 8. FINTECH ────────────────────────────────────────────────────────────
  {
    industry: 'fintech',
    industryName: 'FinTech, Payments & Billing Infrastructure',
    description: 'Payment processing, billing platforms, neobanking, wallet systems',
    competitors: [
      'Stripe', 'Square', 'Razorpay', 'PayPal', 'Adyen',
      'Cashfree', 'Plaid', 'Wise', 'Revolut',
    ],
    features: [
      // Big
      { name: 'Multi-Party Split Payments, Escrow & Instant Payouts', competitor: 'Stripe', tier: 'big', implementation: 'Stripe Connect-style fund routing splitting charge into platform commission, tax withholding, merchant balance; standard 7-14 day settlement alongside 30-min Instant Payouts.' },
      { name: '125+ Global Payment Methods & Digital Wallets', competitor: 'Stripe', tier: 'big', implementation: 'Unified checkout element surfacing Apple Pay, Google Pay, Link 1-click, UPI, SEPA Direct Debit, ACH via Financial Connections, BNPL installments based on currency and device.' },
      { name: 'Chargeback & Dispute Evidence Automation Workbench', competitor: 'OpenTable', tier: 'big', implementation: 'Real-time webhook on dispute.created, frozen funds, merchant notification, auto-assembled evidence (delivery receipt, IP, AVS/CVV match, policy acceptance timestamp).' },
      { name: 'Double-Entry Multi-Currency Ledger & FX Conversion', competitor: 'Stripe', tier: 'big', implementation: 'Immutable ledger tracking PENDING/AVAILABLE/RESERVED balances across 50+ currencies, locked mid-market FX quotes (30s validity), automated daily bank reconciliation.' },
      // Popular
      { name: 'Subscription & Recurring Billing Engine', competitor: 'Stripe', tier: 'popular', implementation: 'Flexible billing cadences, proration on mid-cycle changes, smart dunning with retry schedules, automatic card-updater hooks, grace periods and restoration.' },
      { name: 'Invoice Generation & PDF Delivery', competitor: 'Stripe', tier: 'popular', implementation: 'Auto-generated invoices with line items, tax breakdown, branded templates, PDF attachment, email delivery, online payment link, payment status tracking.' },
      { name: 'Webhook Delivery Inspector & Manual Replay', competitor: 'Stripe', tier: 'popular', implementation: 'Every outbound webhook attempt logged with status code/body/backoff schedule, 1-click manual replay, virtual Test Clock for fast-forwarding billing cycles.' },
      { name: 'Customer & Merchant Dashboards', competitor: 'Stripe', tier: 'popular', implementation: 'Transaction history with search/filter, balance and payout timeline, dispute management, refund issuance, API key management, webhook configuration.' },
      // Micro
      { name: 'Test Mode & Sandbox Environment', competitor: 'Stripe', tier: 'micro', implementation: 'Full test mode with test cards for every scenario (success, decline, 3D Secure, insufficient funds), webhook endpoint testing, test clock for time manipulation.' },
      { name: 'Connected Account Onboarding', competitor: 'Stripe', tier: 'micro', implementation: 'Express onboarding flow for platforms, identity verification, bank account linking, tax information collection (W-9/W-8), payout schedule configuration.' },
    ],
  },

  // ─── 9. EDUCATION ──────────────────────────────────────────────────────────
  {
    industry: 'education',
    industryName: 'Online Learning, LMS & Certification Platforms',
    description: 'Online courses, learning management, certification, interactive labs',
    competitors: [
      'Coursera', 'Udemy', 'edX', 'Khan Academy', 'Skillshare',
      'Pluralsight', 'LinkedIn Learning', 'Microsoft Learn',
    ],
    features: [
      // Big
      { name: 'Interactive Hands-On Labs with Cloud Sandboxes', competitor: 'Microsoft Learn', tier: 'big', implementation: 'Browser-based cloud sandbox environments for coding exercises, timed lab sessions, automatic environment provisioning/teardown, progress persistence within session.' },
      { name: 'Skill Paths & Certification Tracks', competitor: 'Coursera', tier: 'big', implementation: 'Structured learning paths from beginner to expert, professional certificates with proctored exams, university-accredited degrees, career-linked skill assessments.' },
      { name: 'Spaced Repetition & Mastery-Based Quizzing', competitor: 'Khan Academy', tier: 'big', implementation: 'Algorithm-driven spaced repetition flashcards, mastery-based progression (must achieve 80%+ to advance), detailed mistake analysis, personalized review schedules.' },
      { name: 'Peer Review & Assignment Grading System', competitor: 'Coursera', tier: 'big', implementation: 'Structured peer review rubrics, anonymous peer grading, self-assessment with model answers, instructor override capability, plagiarism detection integration.' },
      // Popular
      { name: 'Video Player with Transcripts & Timestamps', competitor: 'Udemy', tier: 'popular', implementation: 'Adaptive bitrate streaming, interactive transcript with click-to-seek, playback speed control, offline download for mobile, subtitle support in multiple languages.' },
      { name: 'Discussion Forums & Q&A per Lesson', competitor: 'Coursera', tier: 'popular', implementation: 'Per-lecture discussion threads, instructor/TAs pinned answers, upvote-based sorting, markdown support, code block formatting, @mentions for notifications.' },
      { name: 'Progress Tracking & Achievement Badges', competitor: 'Khan Academy', tier: 'popular', implementation: 'Visual progress bars per course/unit, streak counting for daily practice, achievement badges and points, completion certificates with shareable links.' },
      { name: 'Live Classes & Webinar Integration', competitor: 'Udemy', tier: 'popular', implementation: 'Scheduled live sessions with Zoom/WebRTC integration, attendance tracking, interactive whiteboard, breakout rooms, session recording with auto-upload.' },
      { name: 'Corporate Training & Team Management', competitor: 'LinkedIn Learning', tier: 'popular', implementation: 'Admin dashboard with team progress reports, custom learning paths per role, SSO integration, license management, compliance training modules with certification tracking.' },
      // Micro
      { name: 'Bookmark & Note-Taking on Videos', competitor: 'Coursera', tier: 'micro', implementation: 'Timestamped notes linked to video position, private/shared notes, export notes as markdown, search within notes across all courses.' },
      { name: 'Certificate Verification & LinkedIn Share', competitor: 'Coursera', tier: 'micro', implementation: 'Cryptographically verifiable certificate URLs, direct LinkedIn credential add, PDF certificate download, shareable badge links for portfolios.' },
    ],
  },

  // ─── 10. ENTERTAINMENT ─────────────────────────────────────────────────────
  {
    industry: 'entertainment',
    industryName: 'Media Streaming, Audio & Community Platforms',
    description: 'Video/audio streaming, live streaming, community platforms, content discovery',
    competitors: [
      'Netflix', 'Spotify', 'Discord', 'Twitch', 'YouTube',
      'Apple Music', 'Disney+', 'HBO Max',
    ],
    features: [
      // Big
      { name: 'Adaptive Bitrate ABR HLS/DASH Streaming', competitor: 'Netflix', tier: 'big', implementation: 'Network-aware ABR switching between 240p-4K, multiple audio tracks/subtitles, offline download with expiry, Preload next episode, data saver mode.' },
      { name: 'Cross-App Live Presence & Watch/Listen-Along', competitor: 'Spotify', tier: 'big', implementation: 'Synchronized watch parties with real-time chat, live now-playing status and playlist sync across Discord/Twitch, live viewer song-request queues.' },
      { name: 'AI-Powered Content Recommendations', competitor: 'Netflix', tier: 'big', implementation: 'Collaborative filtering + content-based recommendations, personalized homepage rows, "Because you watched X" carousels, taste profile builder, thumbs up/down rating system.' },
      { name: 'Creator Studio & Live Streaming Dashboard', competitor: 'Twitch', tier: 'big', implementation: 'OBS/restream.io integration, stream health monitoring, viewer engagement analytics, raid/host controls, monetization dashboard (subs, bits, ads), clip creation.' },
      // Popular
      { name: 'Personalized Playlists & Mixtapes', competitor: 'Spotify', tier: 'popular', implementation: 'Discover Weekly, Release Radar, Daily Mixes, AI-generated playlists based on mood/activity, collaborative playlist editing with friends.' },
      { name: 'Download for Offline Listening/Viewing', competitor: 'Spotify', tier: 'popular', implementation: 'Quality selector (low/medium/high/very high), download quota management, automatic sync across devices, expiry handling per content license.' },
      { name: 'Social Features: Follow, Like, Share, Comment', competitor: 'YouTube', tier: 'popular', implementation: 'User profiles with followers/following, like/dislike with ratio display, comment threads with replies and pinning, share to external platforms with OpenGraph cards.' },
      { name: 'Content Discovery & Trending', competitor: 'Netflix', tier: 'popular', implementation: 'Trending Now carousels, new releases, top 10 in your country, genre browsing with curated collections, continue watching with percentage progress.' },
      { name: 'Live Chat & Community Moderation', competitor: 'Twitch', tier: 'popular', implementation: 'Real-time chat with emotes/badges, slow mode, subscriber-only mode, AutoMod AI-powered moderation, custom emotes and bits animations.' },
      // Micro
      { name: 'Watchlist & Continue Watching', competitor: 'Netflix', tier: 'micro', implementation: '"My List" save functionality, continue watching row with progress bars, recently played section, "Play Next" auto-advance on episode completion.' },
      { name: 'Multiple User Profiles', competitor: 'Netflix', tier: 'micro', implementation: 'Up to 5 profiles with avatars, kids profile with age-appropriate content, profile PIN locks, individual watch history and recommendations per profile.' },
      { name: 'Podcast & Audiobook Player', competitor: 'Spotify', tier: 'micro', implementation: 'Chapter navigation, playback speed control, sleep timer, bookmarks, download episodes, smart speed (silence skipping).' },
    ],
  },

  // ─── 11. LOGISTICS ─────────────────────────────────────────────────────────
  {
    industry: 'logistics',
    industryName: 'Logistics, Supply Chain & Fulfillment',
    description: 'Warehouse management, shipping, tracking, last-mile delivery, 3PL',
    competitors: [
      'FedEx', 'UPS', 'DHL', 'Shiprocket', 'Delhivery',
      'BlueDart', 'Flexport', 'Freightos',
    ],
    features: [
      // Big
      { name: 'Multi-Carrier Rate Shopping & Label Generation', competitor: 'Shiprocket', tier: 'big', implementation: 'Queries FedEx/UPS/DHL/USPS/Delhivery/BlueDart rate tables, calculates dimensional weight, selects optimal carrier, generates ZPL/PDF thermal shipping labels, bulk manifest creation.' },
      { name: 'Real-Time Shipment Tracking & Proactive Alerts', competitor: 'FedEx', tier: 'big', implementation: 'Multi-carrier tracking API integration, webhook ingestion for status changes (IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, NDR_EXCEPTION), proactive customer notifications at each milestone.' },
      { name: 'Warehouse Management System (WMS) with Pick-Pack-Ship', competitor: 'Shiprocket', tier: 'big', implementation: 'Inbound receiving with ASN, put-away optimization, wave picking lists sorted by bin coordinates, barcode scan verification, packing station with dimension weighing, quality check workflow.' },
      { name: 'Last-Mile Delivery Dispatch & Route Optimization', competitor: 'Delhivery', tier: 'big', implementation: 'Dynamic courier allocation based on proximity and capacity, route optimization for multi-drop deliveries, real-time GPS tracking, delivery proof (photo/OTP/signature), NDR management.' },
      // Popular
      { name: 'Pincode Serviceability Matrix', competitor: 'Flipkart', tier: 'popular', implementation: '19,000+ pincode coverage with serviceability status, delivery SLA per origin-destination pair, COD eligibility per pincode, Hazmat and cold-chain restrictions.' },
      { name: 'International Shipping & Customs Documentation', competitor: 'DHL', tier: 'popular', implementation: 'Automated commercial invoice generation, HS code classification, customs duty calculation, prohibited items screening, multi-language documentation, tracking across borders.' },
      { name: 'Reverse Logistics & Returns Processing', competitor: 'FedEx', tier: 'popular', implementation: 'Return label generation, reverse shipment tracking, warehouse receipt and QC inspection, disposition routing (restock/discount/return to vendor/destroy).' },
      // Micro
      { name: 'Barcode & QR Code Scanning', competitor: 'UPS', tier: 'micro', implementation: 'Mobile scanner app for receiving, picking, packing, and shipping; GS1-128 barcode generation; serial number tracking for high-value items.' },
      { name: 'Shipping Insurance & Declared Value', competitor: 'FedEx', tier: 'micro', implementation: 'Declared value input with automatic insurance calculation, high-value item handling procedures, claim filing workflow for lost/damaged shipments.' },
    ],
  },

  // ─── 12. HOSPITALITY ───────────────────────────────────────────────────────
  {
    industry: 'hospitality',
    industryName: 'Hotels, Hospitality & Vacation Rentals',
    description: 'Hotel management, property management, guest experience, revenue optimization',
    competitors: [
      'Airbnb', 'Booking.com', 'Hostaway', 'Smoobu', 'Cloudbeds',
      'SiteMinder', 'STAAH', 'Guesty',
    ],
    features: [
      // Big
      { name: 'Property Management & Channel Manager', competitor: 'Hostaway', tier: 'big', implementation: 'Central reservation system, multi-channel calendar sync (Airbnb/Booking/VRBO/Expedia), rate parity enforcement, automated messaging sequences, cleaning and maintenance scheduling.' },
      { name: 'Dynamic Revenue & Yield Management', competitor: 'SiteMinder', tier: 'big', implementation: 'Algorithmic dynamic pricing based on demand, seasonality, competitor rates, occupancy targets; rule-based and ML-powered rate recommendations; price parity monitoring.' },
      { name: 'Guest Experience & Digital Concierge', competitor: 'Guesty', tier: 'big', implementation: 'Pre-arrival messaging with local recommendations, in-stay request management, digital guidebook with local tips, post-stay review request automation, guest messaging unified inbox.' },
      { name: 'Housekeeping & Maintenance Management', competitor: 'Cloudbeds', tier: 'big', implementation: 'Room status tracking (clean/dirty/inspected/out-of-order), cleaning task assignment and completion tracking, maintenance request management with priority levels, vendor coordination.' },
      // Popular
      { name: 'Direct Booking Engine with SEO', competitor: 'Smoobu', tier: 'popular', implementation: 'Branded direct booking website, SEO-optimized property pages, instant booking, custom domain, abandoned booking recovery emails, mobile-responsive design.' },
      { name: 'Guest Review Management', competitor: 'Hostaway', tier: 'popular', implementation: 'Auto-request reviews post-checkout, multi-platform review aggregation, sentiment analysis, response templates, review display on direct booking site, reputation monitoring.' },
      { name: 'Owner Reporting & Financial Management', competitor: 'Guesty', tier: 'popular', implementation: 'Owner statement generation with revenue breakdown by channel, expense tracking, occupancy reports, net income calculations, automated monthly PDF statements.' },
      // Micro
      { name: 'Smart-Lock & Keyless Entry Integration', competitor: 'Guesty', tier: 'micro', implementation: 'Auto-generated unique PIN codes per reservation, time-bounded access (check-in to check-out), automatic code revocation, smart lock brand integrations (August, Yale, Schlage).' },
      { name: 'Automated Messaging Templates', competitor: 'Hostaway', tier: 'micro', implementation: 'Pre/post-arrival messages, check-in instructions with smart-lock codes, local recommendations, checkout reminders, review requests, all with dynamic variable insertion.' },
    ],
  },

  // ─── 13. REAL ESTATE ───────────────────────────────────────────────────────
  {
    industry: 'real-estate',
    industryName: 'PropTech, Real Estate & Property Listings',
    description: 'Property listings, real estate search, 3D tours, mortgage calculators, agent tools',
    competitors: [
      'Zillow', 'Redfin', 'Trulia', 'Realtor.com', 'Rightmove',
      'Immobilienscout24', 'MagicBricks',
    ],
    features: [
      // Big
      { name: 'Interactive 3D Home Tours & Floor Plan Tracking', competitor: 'Zillow', tier: 'big', implementation: 'Panoramic 3D room-to-room walkthroughs synchronized with 2D floor plan showing real-time location and camera cone, dollhouse view, measurements overlay, virtual staging.' },
      { name: 'Automated Valuation Model (AVM) & Price Estimates', competitor: 'Zillow', tier: 'big', implementation: 'ML-powered home value estimate (Zestimate), comparable recent sales analysis, price trend graphs, neighborhood price heat map, rent vs buy calculator.' },
      { name: 'PITI Mortgage Calculator & Affordability Engine', competitor: 'Redfin', tier: 'big', implementation: 'Principal/Interest/Property Tax/Home Insurance/HOA calculation, amortization schedule display, pre-approval amount estimation, debt-to-income ratio analysis, down payment savings timeline.' },
      { name: 'Saved Searches & New Listing Alerts', competitor: 'Zillow', tier: 'big', implementation: 'Custom saved searches with filters (price, beds, baths, sqft, school district), daily email alerts for new matching listings, price change notifications, saved home comparison.' },
      // Popular
      { name: 'Interactive Map with Polygon Boundary Search', competitor: 'Zillow', tier: 'popular', implementation: 'Draw custom search area on map, school district boundary overlay, neighborhood boundaries, commute time calculation to specific addresses.' },
      { name: 'Agent Matching & Lead Routing', competitor: 'Zillow', tier: 'popular', implementation: 'Algorithmic agent matching based on specialty, location, rating, response time, lead routing rules, agent dashboard with lead management, automated follow-up sequences.' },
      { name: 'Virtual Staging & Room Redesign', competitor: 'Zillow', tier: 'popular', implementation: 'AI-powered virtual furniture placement in property photos, style presets (modern, traditional, minimalist), before/after slider comparison.' },
      // Micro
      { name: 'Neighborhood Insights & School Ratings', competitor: 'Zillow', tier: 'micro', implementation: 'Walk Score, Transit Score, Bike Score display, GreatSchools ratings, crime statistics, demographic data, local market trends, noise level estimates.' },
      { name: 'Rent vs Buy Comparison Tool', competitor: 'Redfin', tier: 'micro', implementation: 'Side-by-side comparison of renting vs buying with total cost analysis over 5/10/30 years, opportunity cost of down payment, tax benefit calculations.' },
      { name: 'Open House Scheduling & Virtual Tours', competitor: 'Redfin', tier: 'micro', implementation: 'Open house time slot booking, virtual tour link sharing, agent contact form, property detail sharing to social media, save/share functionality.' },
    ],
  },

  // ─── 14. AUTOMOTIVE ────────────────────────────────────────────────────────
  {
    industry: 'automotive',
    industryName: 'Automotive, Dealership & Vehicle Marketplace',
    description: 'Vehicle listings, dealership management, service scheduling, test drives',
    competitors: [
      'Cars.com', 'AutoTrader', 'CarGurus', 'Vroom', 'CarMax',
      'Tesla', 'TrueCar', 'Edmunds',
    ],
    features: [
      // Big
      { name: 'Vehicle Comparison Engine with 53-Point Inspection', competitor: 'CarMax', tier: 'big', implementation: 'Side-by-side comparison of up to 4 vehicles with 53-point inspection report, accident history, ownership history, market value comparison, loan calculator.' },
      { name: 'Trade-In Valuation & Instant Offer', competitor: 'CarMax', tier: 'big', implementation: 'VIN-based vehicle valuation, condition assessment questionnaire, instant cash offer valid for 7 days, appointment scheduling for in-person appraisal, offer acceptance workflow.' },
      { name: 'Service Appointment Scheduling with Lane Management', competitor: 'Tesla', tier: 'big', implementation: 'Service type selection with estimated duration, mobile ranger vs service center options, loaner vehicle availability, real-time service lane status, progress notifications.' },
      { name: 'Test Drive Scheduling with Digital Paperwork', competitor: 'Tesla', tier: 'big', implementation: 'Online test drive booking with home delivery option, digital driver license verification, insurance validation, electronic agreement signing, vehicle walkaround video documentation.' },
      // Popular
      { name: 'Financing Pre-Approval & Monthly Calculator', competitor: 'AutoTrader', tier: 'popular', implementation: 'Online credit application with soft-pull pre-approval, monthly payment calculator with APR/term/amount, trade-in value integration, lease vs buy comparison.' },
      { name: 'Vehicle History Report Integration', competitor: 'CarGurus', tier: 'popular', implementation: 'Carfax/AutoCheck integration showing accident history, service records, ownership count, odometer readings, title status (clean/salvage/flood).' },
      { name: 'Dealership Inventory & New Car Orders', competitor: 'Cars.com', tier: 'popular', implementation: 'Real-time dealer inventory sync, build-and-price configurator, factory order tracking, estimated delivery timeline, dealer rating and review integration.' },
      // Micro
      { name: 'Deal Rating & Price Analysis', competitor: 'CarGurus', tier: 'micro', implementation: 'Algorithmic deal rating (Great/Good/Fair/High), market price comparison, days-on-market analysis, price drop alerts, historical pricing chart per listing.' },
      { name: 'Recall & Maintenance Alert System', competitor: 'Edmunds', tier: 'micro', implementation: 'VIN-based recall lookup, maintenance schedule reminders, service interval tracking, recall repair status tracking, TSB (Technical Service Bulletin) database.' },
    ],
  },

  // ─── 15. GAMING ────────────────────────────────────────────────────────────
  {
    industry: 'gaming',
    industryName: 'Gaming Platforms, Game Launchers & Player Communities',
    description: 'Game launchers, player profiles, matchmaking, in-game stores, community features',
    competitors: [
      'Steam', 'Epic Games Store', 'PlayStation Store', 'Xbox',
      'Discord', 'Twitch', 'Roblox', 'Epic Games',
    ],
    features: [
      // Big
      { name: 'Digital Game Store & Library Management', competitor: 'Steam', tier: 'big', implementation: 'Game store with categories, wishlists, discovery queue, purchased game library, cloud save sync, family sharing, refund request system within play-time limits.' },
      { name: 'Friend System & Social Presence', competitor: 'Steam', tier: 'big', implementation: 'Friend list with online/away/in-game status, activity feed, friend activity sharing, group creation and management, voice and text chat, screen sharing.' },
      { name: 'Achievement System & Player Stats', competitor: 'Steam', tier: 'big', implementation: 'Per-game achievements with rarity percentages, player level and XP progression, global stats comparisons, leaderboards, stat tracking across play sessions.' },
      { name: 'Moderation & Community Features', competitor: 'Discord', tier: 'big', implementation: 'Game forums and community hubs, user-generated content moderation, reporting system, community guidelines enforcement, developer communication channels.' },
      // Popular
      { name: 'In-Game Item Marketplace & Trading', competitor: 'Steam', tier: 'popular', implementation: 'Community marketplace for in-game items, real-time price tracking, buy/sell orders, trade offers with confirmation, transaction history, market fee calculation.' },
      { name: 'Game Reviews & Recommendation Engine', competitor: 'Steam', tier: 'popular', implementation: 'User reviews with thumbs up/down, review filters (positive/negative/funny/spoilers), recommended based on playtime, curator recommendations, user tags.' },
      { name: 'Live Streaming Integration', competitor: 'Twitch', tier: 'popular', implementation: 'Broadcast to Twitch from within launcher, stream chat overlay, viewer count display, clipping tool, stream schedule management, subscriber notification integration.' },
      // Micro
      { name: 'Wishlist & Sale Notification', competitor: 'Steam', tier: 'micro', implementation: 'Add games to wishlist, price drop alerts, seasonal sale wishlist discounts, "You have X items on your wishlist on sale" notifications.' },
      { name: 'Profile Customization & Badges', competitor: 'Steam', tier: 'micro', implementation: 'Customizable profile with showcases, avatar and banner upload, profile badges for events/purchases, profile themes, featured games and artwork.' },
    ],
  },

  // ─── 16. SOCIAL ────────────────────────────────────────────────────────────
  {
    industry: 'social',
    industryName: 'Social Networks & Community Platforms',
    description: 'Social feeds, messaging, community building, content sharing, creator economy',
    competitors: [
      'Instagram', 'Twitter/X', 'Facebook', 'TikTok', 'LinkedIn',
      'Reddit', 'Discord', 'Pinterest',
    ],
    features: [
      // Big
      { name: 'Feed Algorithm & Content Ranking', competitor: 'Instagram', tier: 'big', implementation: 'ML-powered feed ranking based on engagement signals, recency, relationship strength, content type diversity; chronological and algorithmic feed toggle.' },
      { name: 'Creator Economy & Monetization', competitor: 'TikTok', tier: 'big', implementation: 'Creator fund revenue sharing, live stream gifting, subscription tiers for creators, brand partnership marketplace, tipping system, NFT/digital collectibles.' },
      { name: 'Real-Time Messaging & Group Chat', competitor: 'Discord', tier: 'big', implementation: '1:1 and group messaging, voice/video calls, server-based communities with channels, threaded conversations, message reactions, read receipts, typing indicators, end-to-end encryption option.' },
      { name: 'Content Moderation & Safety', competitor: 'Twitter', tier: 'big', implementation: 'AI-powered content moderation, user reporting workflow, automated rule enforcement, shadow banning, content filtering per user, safe search settings.' },
      // Popular
      { name: 'Stories & Ephemeral Content', competitor: 'Instagram', tier: 'popular', implementation: '24-hour disappearing stories, story highlights, story replies, polls and quizzes in stories, story analytics (views, replies, exits).' },
      { name: 'Hashtags & Discovery', competitor: 'TikTok', tier: 'popular', implementation: 'Trending hashtag pages, hashtag autocomplete, explore page with personalized content discovery, content challenges and trends, creator tags.' },
      { name: 'Verified Badges & Account Types', competitor: 'Twitter', tier: 'popular', implementation: 'Blue check verification for authentic accounts, organization badges, government account labels, impersonation protection, verification application process.' },
      // Micro
      { name: 'Reposts, Retweets & Thread Support', competitor: 'Twitter', tier: 'micro', implementation: 'Repost with/without comment, threaded conversations with visual line connectors, thread creation tool, thread bookmarking, quote-post formatting.' },
      { name: 'Close Friends & Follower Tiers', competitor: 'Instagram', tier: 'micro', implementation: 'Close Friends list for exclusive stories, follower-only content, follower requests with approval, private account mode, blocking and muting controls.' },
    ],
  },

  // ─── 17. SAAS ──────────────────────────────────────────────────────────────
  {
    industry: 'saas',
    industryName: 'SaaS Platforms & Cloud Software',
    description: 'Subscription software, cloud services, API products, developer tools',
    competitors: [
      'Salesforce', 'HubSpot', 'Slack', 'Notion', 'Airtable',
      'Intercom', 'Zendesk', 'Mailchimp',
    ],
    features: [
      // Big
      { name: 'Multi-Tenant Architecture with Tenant Isolation', competitor: 'Salesforce', tier: 'big', implementation: 'PostgreSQL RLS per tenant, tenant-scoped all database queries, tenant configuration management, white-label domain support, per-tenant feature flags.' },
      { name: 'Role-Based Access Control with Granular Permissions', competitor: 'HubSpot', tier: 'big', implementation: 'Role-based permission sets, custom role creation, seat-based licensing, admin/standard/viewer role templates, permission inheritance, SSO integration with SAML/OIDC.' },
      { name: 'Usage-Based & Seat-Based Billing', competitor: 'Stripe', tier: 'big', implementation: 'Tiered pricing by seats (per-user/month), metered usage billing (API calls, storage, compute), overage charges, mid-cycle seat changes with proration, annual prepayment discounts.' },
      { name: 'API Platform with SDK & Webhooks', competitor: 'Twilio', tier: 'big', implementation: 'RESTful API with OpenAPI docs, SDK libraries (JS/Python/Go/Ruby), webhook subscriptions with retry logic, API versioning, rate limiting per plan tier, developer portal.' },
      // Popular
      { name: 'Dashboard & Analytics Widgets', competitor: 'HubSpot', tier: 'popular', implementation: 'Customizable dashboard with drag-drop widgets, real-time data refresh, date range selectors, export to PDF/CSV, scheduled email reports, shareable dashboard links.' },
      { name: 'Workflow Automation & Integrations', competitor: 'Zapier', tier: 'popular', implementation: 'Visual workflow builder with triggers/actions/filters, pre-built integration templates (100+ apps), custom webhook triggers, conditional branching, error handling and retries.' },
      { name: 'Team Collaboration & Comments', competitor: 'Notion', tier: 'popular', implementation: 'Inline comments on records, @mention notifications, activity feed per record, change history with version comparison, thread resolution, approval workflows.' },
      // Micro
      { name: 'Embedded Help Center & Onboarding Tours', competitor: 'Intercom', tier: 'micro', implementation: 'Interactive product tours, contextual tooltips, searchable help center, chatbot for common questions, onboarding checklist with progress tracking.' },
      { name: 'Import/Export Data Management', competitor: 'HubSpot', tier: 'micro', implementation: 'CSV/JSON import with field mapping, bulk export with date range filters, scheduled exports, import preview with error detection, field-level permissions for data access.' },
    ],
  },

  // ─── 18. PRODUCTIVITY ──────────────────────────────────────────────────────
  {
    industry: 'productivity',
    industryName: 'Productivity, Collaboration & Project Management',
    description: 'Project management, task tracking, notes, collaboration, calendar',
    competitors: [
      'Linear', 'Notion', 'Asana', 'Monday.com', 'ClickUp',
      'Airtable', 'Miro', 'Figma',
    ],
    features: [
      // Big
      { name: 'Local-First Sync Engine & Cmd+K Command Palette', competitor: 'Linear', tier: 'big', implementation: 'Optimistic IndexedDB client state synced via delta packets, keyboard-first navigation (Cmd+K), cycle/triage queues, offline support with sync on reconnect, conflict resolution.' },
      { name: 'Multiplayer CRDT Canvas & Real-Time Collaboration', competitor: 'Figma', tier: 'big', implementation: 'Real-time multiplayer cursors, live presence indicators, operational transform for conflict-free editing, granular permissions (view/comment/edit), version history with branching.' },
      { name: 'Gantt Chart & Timeline Project View', competitor: 'Monday.com', tier: 'big', implementation: 'Visual timeline with dependencies, drag-to-reschedule, critical path highlighting, milestone markers, baseline vs actual comparison, resource allocation view.' },
      { name: 'Bidirectional CRM & Issue Tracker Sync', competitor: 'Linear', tier: 'big', implementation: 'Native Salesforce/HubSpot two-way sync linking support cases to engineering issues, automatic issue creation from customer feedback, status sync across platforms.' },
      // Popular
      { name: 'Kanban Board with Swimlanes & WIP Limits', competitor: 'Linear', tier: 'popular', implementation: 'Drag-and-drop task cards, swimlane grouping, work-in-progress limits, cycle time tracking, burndown charts, automated task transitions from PR merge.' },
      { name: 'Custom Fields & Database Views', competitor: 'Airtable', tier: 'popular', implementation: 'Flexible field types (text, number, date, select, multi-select, formula, rollup, lookup), multiple views per database (table, kanban, calendar, gallery, form), shared views.' },
      { name: 'Time Tracking & Timesheet Reporting', competitor: 'ClickUp', tier: 'popular', implementation: 'Manual and automatic time tracking per task/ticket, timesheet approval workflow, billable vs non-billable categorization, team utilization reports, export to payroll systems.' },
      { name: 'Meeting Notes & Recording Integration', competitor: 'Notion', tier: 'popular', implementation: 'Meeting note templates with action item extraction, video recording embed, transcript search, calendar sync, attendee assignment, post-meeting task creation.' },
      // Micro
      { name: 'Keyboard Shortcuts & Power User Features', competitor: 'Linear', tier: 'micro', implementation: 'Vim-style navigation, quick-create with Cmd+K, slash commands in editors, multi-select with Shift+Click, global search across all workspaces.' },
      { name: 'Email & Calendar Integration', competitor: 'Notion', tier: 'micro', implementation: 'Two-way email sync, calendar view with drag-to-reschedule, email-to-task creation, meeting link generation, availability scheduling.' },
    ],
  },

  // ─── 19. ENTERPRISE ────────────────────────────────────────────────────────
  {
    industry: 'enterprise',
    industryName: 'Enterprise ERP, Manufacturing & Supply Chain',
    description: 'ERP, manufacturing, QMS, supply chain, jewelry/retail ERP',
    competitors: [
      'SAP S/4HANA', 'Oracle NetSuite', 'Microsoft Dynamics 365',
      'ServiceNow', 'Workday', 'Alibaba',
    ],
    features: [
      // Big
      { name: 'End-to-End Multi-Stage Job Bag & Work-Order Ledger', competitor: 'SAP', tier: 'big', implementation: 'Tracks discrete manufacturing across every floor stage (CAD→CAM→Casting→Assembly→QA), recording exact gross/net/loss/scrap/recovery material weights at every handoff with zero unrecorded variance.' },
      { name: 'ISO 9001 QMS, CAPA & Audit Trail Engine', competitor: 'NetSuite', tier: 'big', implementation: 'Document control with revision sign-offs, NCR and CAPA root-cause workflows (5-Whys/Fishbone), risk matrices, continuous audit trail monitoring for compliance.' },
      { name: 'Automated AP Three-Way Matching', competitor: 'Oracle', tier: 'big', implementation: 'Native API matching Purchase Orders, Goods Receipt Notes, and Vendor Invoices; variance flagging, approval routing for discrepancies, automated payment scheduling.' },
      { name: 'Multi-Modal Freight Tracking & Supply Chain Visibility', competitor: 'Alibaba', tier: 'big', implementation: 'Land, sea, and air freight container tracking, pre-shipment QC inspection scheduling, customs documentation management, supplier performance dashboards.' },
      // Popular
      { name: 'Financial Consolidation & Reporting', competitor: 'NetSuite', tier: 'popular', implementation: 'Multi-entity/currency consolidation, GAAP/IFRS financial statements, intercompany eliminations, budgeting and forecasting, audit-ready financial reports.' },
      { name: 'Human Capital Management & Payroll', competitor: 'Workday', tier: 'popular', implementation: 'Employee lifecycle management, org chart, performance reviews, time tracking, payroll processing with tax compliance, benefits administration.' },
      { name: 'ITSM & IT Service Management', competitor: 'ServiceNow', tier: 'popular', implementation: 'Incident/problem/change management, CMDB, service catalog, automated ticket routing, SLA tracking, knowledge base, self-service portal.' },
      // Micro
      { name: 'Hardware Scale/Scanner Bridge Integration', competitor: 'Alibaba', tier: 'micro', implementation: 'WebSerial/WebUSB/local bridge for digital analytical balances, barcode/RFID readers, weighing scale data ingestion with tolerance checks.' },
      { name: 'AI Agent ERP Connectors', competitor: 'Nango', tier: 'micro', implementation: 'Governed OAuth/API connectors enabling AI agents to query ERP inventory and order ledgers safely with scoped permissions and audit logging.' },
    ],
  },
];

export function getIndustryDefinition(industry: Industry): IndustryDefinition | undefined {
  return INDUSTRY_REGISTRY.find(def => def.industry === industry);
}

export function getIndustryByPrompt(prompt: string): IndustryDefinition | undefined {
  const lower = prompt.toLowerCase();
  const keywordMap: Record<string, Industry> = {
    // E-commerce
    'ecom': 'ecommerce', 'e-commerce': 'ecommerce', 'shop': 'ecommerce', 'store': 'ecommerce',
    'marketplace': 'ecommerce', 'amazon': 'ecommerce', 'shopify': 'ecommerce', 'flipkart': 'ecommerce',
    'product': 'ecommerce', 'cart': 'ecommerce', 'checkout': 'ecommerce',
    // Food & Beverage
    'food': 'food-beverage', 'delivery': 'food-beverage', 'zomato': 'food-beverage',
    'swiggy': 'food-beverage', 'ubereats': 'food-beverage', 'doordash': 'food-beverage',
    'restaurant': 'food-beverage', 'catering': 'food-beverage', 'cloud kitchen': 'food-beverage',
    // Coffee Shop
    'coffee': 'coffee-shop', 'cafe': 'coffee-shop', 'café': 'coffee-shop',
    'espresso': 'coffee-shop', 'latte': 'coffee-shop', 'starbucks': 'coffee-shop',
    'blue bottle': 'coffee-shop', 'roastery': 'coffee-shop', 'brew': 'coffee-shop',
    // Healthcare
    'health': 'healthcare', 'medical': 'healthcare', 'clinic': 'healthcare',
    'doctor': 'healthcare', 'patient': 'healthcare', 'telemedicine': 'healthcare',
    'zocdoc': 'healthcare', 'practo': 'healthcare', 'appointment': 'healthcare',
    'ehr': 'healthcare', 'emr': 'healthcare', 'healthcare': 'healthcare',
    // AI Platform
    'ai': 'ai-platform', 'llm': 'ai-platform', 'gpt': 'ai-platform', 'chatbot': 'ai-platform',
    'openai': 'ai-platform', 'anthropic': 'ai-platform', 'claude': 'ai-platform',
    'agent': 'ai-platform', 'rag': 'ai-platform', 'copilot': 'ai-platform',
    'machine learning': 'ai-platform', 'ml': 'ai-platform', 'deep learning': 'ai-platform',
    // Booking
    'booking': 'booking', 'hotel': 'booking', 'reservation': 'booking',
    'airbnb': 'booking', 'vacation': 'booking', 'travel': 'booking',
    'hostaway': 'booking', 'opentable': 'booking', 'resy': 'booking',
    'property': 'booking', 'rental': 'booking',
    // FinTech
    'fintech': 'fintech', 'payment': 'fintech', 'stripe': 'fintech',
    'billing': 'fintech', 'invoice': 'fintech', 'wallet': 'fintech',
    'banking': 'fintech', 'neobank': 'fintech', 'paypal': 'fintech',
    'razorpay': 'fintech', 'money': 'fintech', 'payout': 'fintech',
    // Education
    'education': 'education', 'course': 'education', 'learning': 'education',
    'lms': 'education', 'coursera': 'education', 'udemy': 'education',
    'student': 'education', 'teacher': 'education', 'class': 'education',
    'training': 'education', 'certification': 'education', 'lab': 'education',
    // Entertainment
    'entertainment': 'entertainment', 'stream': 'entertainment', 'video': 'entertainment',
    'music': 'entertainment', 'spotify': 'entertainment', 'netflix': 'entertainment',
    'twitch': 'entertainment', 'live': 'entertainment', 'podcast': 'entertainment',
    'audio': 'entertainment', 'content': 'entertainment',
    // Logistics
    'logistics': 'logistics', 'shipping': 'logistics', 'delivery': 'logistics',
    'warehouse': 'logistics', 'fulfillment': 'logistics', 'courier': 'logistics',
    'tracking': 'logistics', 'supply chain': 'logistics', 'freight': 'logistics',
    // Hospitality
    'hospitality': 'hospitality', 'hotel': 'hospitality', 'resort': 'hospitality',
    'guest': 'hospitality', 'hostaway': 'hospitality', 'pms': 'hospitality',
    'vacation rental': 'hospitality',
    // Real Estate
    'real estate': 'real-estate', 'property': 'real-estate', 'zillow': 'real-estate',
    'listing': 'real-estate', 'mortgage': 'real-estate', 'home': 'real-estate',
    'house': 'real-estate', 'realtor': 'real-estate', 'prop': 'real-estate',
    // Automotive
    'automotive': 'automotive', 'car': 'automotive', 'vehicle': 'automotive',
    'dealer': 'automotive', 'auto': 'automotive', 'tesla': 'automotive',
    'test drive': 'automotive', 'trade-in': 'automotive',
    // Gaming
    'game': 'gaming', 'gaming': 'gaming', 'steam': 'gaming',
    'player': 'gaming', 'esports': 'gaming', 'roblox': 'gaming',
    // Social
    'social': 'social', 'feed': 'social', 'post': 'social',
    'follower': 'social', 'creator': 'social', 'community': 'social',
    'discord': 'social', 'instagram': 'social', 'twitter': 'social',
    // SaaS
    'saas': 'saas', 'subscription': 'saas', 'dashboard': 'saas',
    'crm': 'saas', 'workflow': 'saas', 'api': 'saas',
    'saaS': 'saas',
    // Productivity
    'productivity': 'productivity', 'task': 'productivity', 'project': 'productivity',
    'linear': 'productivity', 'notion': 'productivity', 'asana': 'productivity',
    'todo': 'productivity', 'kanban': 'productivity', 'notes': 'productivity',
    // Enterprise
    'enterprise': 'enterprise', 'erp': 'enterprise', 'manufacturing': 'enterprise',
    'supply chain': 'enterprise', 'qms': 'enterprise', 'sap': 'enterprise',
    'netsuite': 'enterprise', 'dynamics': 'enterprise', 'workday': 'enterprise',
  };

  // Two-tier scoring. Concrete domain ANCHORS (coffee, clinic, game, hotel…)
  // dominate generic CAPABILITY MODIFIERS (subscription, dashboard, admin,
  // billing…). Without this split, a prompt like "a coffee shop with
  // subscriptions and admin" resolves to SaaS, because "subscription" is a
  // longer keyword than "coffee" — a feature word was steering the domain.
  // Within a tier, longer (more specific) keywords outweigh shorter ones.
  const GENERIC_MODIFIERS = new Set<string>([
    // commerce capabilities
    'product', 'cart', 'checkout',
    // fulfillment
    'delivery', 'shipping', 'tracking', 'fulfillment', 'warehouse', 'courier',
    // money
    'payment', 'billing', 'invoice', 'payout',
    // medical ops
    'appointment',
    // media
    'stream', 'video', 'audio', 'content', 'podcast',
    // social
    'social', 'feed', 'post', 'follower', 'community', 'creator',
    // saas
    'saas', 'subscription', 'dashboard', 'crm', 'workflow', 'api',
    // productivity
    'productivity', 'task', 'project', 'todo', 'kanban', 'notes',
  ]);

  const scoreByIndustry = new Map<Industry, number>();
  const bump = (industry: Industry, points: number) => {
    scoreByIndustry.set(industry, (scoreByIndustry.get(industry) ?? 0) + points);
  };

  for (const [keyword, mappedIndustry] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      const isAnchor = !GENERIC_MODIFIERS.has(keyword);
      // Anchors (concrete nouns) outweigh modifiers; longer keywords win in-tie.
      bump(mappedIndustry, isAnchor ? keyword.length * 100 : keyword.length);
    }
  }

  let bestMatch: { industry: Industry; score: number } | null = null;
  for (const [industry, score] of scoreByIndustry) {
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { industry, score };
    }
  }

  if (bestMatch) {
    return getIndustryDefinition(bestMatch.industry);
  }
  return undefined;
}
