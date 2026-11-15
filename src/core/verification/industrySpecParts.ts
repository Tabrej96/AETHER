/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Industry Specifications Part 3 - Logistics, Hospitality, Real Estate, Automotive
 */

import type { ProjectSpec, FeatureRequirement, SystemRequirement, CompetitorFeature } from './types.js';

function feat(p: number, pn: string, f: string, d: string, m: string, p2?: string | RegExp, cs?: string): FeatureRequirement {
  return { pillar: p, pillarName: pn, feature: f, description: d, verificationMethod: m as any, expectedPattern: p2 instanceof RegExp ? p2.source : p2, competitorSource: cs };
}
function sys(n: string, t: any, c: string[]): SystemRequirement { return { name: n, type: t, components: c }; }
function comp(c: string, f: string, cat: string, i: string): CompetitorFeature { return { competitor: c, feature: f, category: cat, implementation: i }; }

export function getLogisticsSpec(): ProjectSpec {
  const rf: FeatureRequirement[] = [
    feat(1,'Auth','Customer Registration','Shipper/receiver','code-pattern',/register|signup/i,'FedEx'),
    feat(1,'Auth','Driver Registration','Delivery drivers','code-pattern',/driver.*register/i,'UPS'),
    feat(2,'DB','Shipment Model','Package entity','code-pattern',/Shipment.*model|Package.*model/i,'FedEx'),
    feat(2,'DB','Tracking Model','Tracking history','code-pattern',/Tracking.*model|TrackingEvent/i,'UPS'),
    feat(2,'DB','Driver Model','Delivery personnel','code-pattern',/Driver.*model/i,'FedEx'),
    feat(2,'DB','Route Model','Route optimization','code-pattern',/Route.*model|DeliveryRoute/i,'UPS'),
    feat(3,'API','Shipment Creation API','Create/label shipments','code-pattern',/createShipment|createLabel/i,'FedEx'),
    feat(3,'API','Tracking API','Track shipment status','code-pattern',/trackShipment|tracking.*api|getTracking/i,'UPS'),
    feat(3,'API','Rate Calculation API','Shipping rates','code-pattern',/rate.*calc|shipping.*rate|getRate/i,'FedEx'),
    feat(3,'API','Driver Dispatch API','Assign drivers','code-pattern',/dispatch|driver.*assign/i,'UPS'),
    feat(4,'FE','Tracking Page','Public tracking','file-exists','src/**/Track*.{tsx,jsx}','FedEx'),
    feat(4,'FE','Shipment Creation','Create shipments','file-exists','src/**/CreateShipment*.{tsx,jsx}','UPS'),
    feat(4,'FE','Driver App','Mobile delivery','file-exists','src/**/DriverApp*.{tsx,jsx}','FedEx'),
    feat(4,'FE','Admin Dashboard','Operations','file-exists','src/**/AdminDashboard*.{tsx,jsx}','UPS'),
    feat(7,'Error','Delivery Failure Recovery','Handle failures','code-pattern',/delivery.*fail|attempt.*fail/i,'UPS'),
    feat(10,'Sec','Address Validation','Validate addresses','code-pattern',/address.*valid|validate.*address/i,'UPS'),
    feat(13,'Pay','Shipping Payment','Pay for labels','code-pattern',/shipping.*payment|label.*payment/i,'FedEx'),
    feat(14,'Notif','Delivery Notifications','Status updates','code-pattern',/delivery.*notif|status.*update/i,'FedEx'),
    feat(15,'Storage','Label Storage','PDF labels','code-pattern',/label.*store|pdf.*label/i,'FedEx'),
    feat(16,'Search','Shipment Search','By tracking number','code-pattern',/tracking.*search|shipment.*search/i,'FedEx'),
    feat(17,'Analytics','Delivery Analytics','Performance metrics','code-pattern',/delivery.*metric|on.*time.*rate/i,'FedEx'),
    feat(18,'Perf','Real-Time Updates','WebSocket tracking','code-pattern',/websocket|socket.*io|realtime/i,'UPS'),
  ];

  const files: string[] = [
    'src/features/auth/register.ts','src/features/tracking/track-page.tsx',
    'src/features/shipments/create-shipment.tsx','src/features/shipments/shipment-list.tsx',
    'src/features/driver/driver-app.tsx','src/features/driver/delivery-updates.tsx',
    'src/features/admin/operations-dashboard.tsx',
    'src/components/TrackingTimeline.tsx','src/components/LabelPreview.tsx','src/components/DriverMap.tsx',
    'src/lib/shipping/label-generator.ts','src/lib/shipping/rate-calculator.ts','src/lib/routing/route-optimizer.ts',
    'src/api/shipments/route.ts','src/api/tracking/route.ts','src/api/rates/route.ts',
    'src/app/track/[id]/page.tsx','src/app/ship/create/page.tsx','src/app/driver/page.tsx','src/app/admin/page.tsx',
  ];

  const tests: string[] = [
    'src/__tests__/shipments/shipment.test.ts','src/__tests__/tracking/tracking.test.ts',
    'src/__tests__/shipping/rate-calc.test.ts','e2e/tracking.spec.ts','e2e/create-shipment.spec.ts',
  ];

  const systems: SystemRequirement[] = [
    sys('Frontend','frontend',['Tracking','Shipment creation','Driver app','Admin dashboard']),
    sys('Backend API','backend',['Shipment API','Tracking API','Rate API','Dispatch API']),
    sys('Database','database',['Shipments','Tracking events','Drivers','Routes','Warehouses']),
    sys('Auth','auth',['Customer auth','Driver auth','Enterprise auth']),
    sys('Payment','payment',['Shipping payments','COD']),
    sys('Notification','notification',['Delivery updates']),
    sys('Storage','storage',['Label storage','Docs']),
    sys('Queue','queue',['Shipment processing']),
    sys('Monitoring','monitoring',['Delivery metrics']),
  ];

  const benchmarks: CompetitorFeature[] = [
    comp('FedEx','Real-Time Tracking','Tracking','Live GPS on map'),
    comp('UPS','Address Validation','Data Quality','Validated address API'),
    comp('DHL','Customs Automation','International','Automated customs docs'),
    comp('FedEx','Same-Day Delivery','Service','City same-day'),
  ];

  return { industry:'logistics', requiredFeatures:rf, requiredFiles:files, requiredTests:tests, requiredSystems:systems, competitorBenchmarks:benchmarks, completenessThreshold:100 };
}

export function getHospitalitySpec(): ProjectSpec {
  const rf: FeatureRequirement[] = [
    feat(1,'Auth','Guest Registration','Guest account','code-pattern',/register|signup|guest.*account/i,'Marriott'),
    feat(1,'Auth','Loyalty Login','Bonvoy/member login','code-pattern',/loyalty|member.*login|points/i,'Marriott'),
    feat(1,'Auth','Staff Login','Management portal','code-pattern',/staff.*login|hotel.*admin/i,'Hilton'),
    feat(2,'DB','Hotel/Room Model','Properties and rooms','code-pattern',/Hotel.*model|Room.*model/i,'Marriott'),
    feat(2,'DB','Reservation Model','Hotel booking','code-pattern',/Reservation.*model|HotelBooking/i,'Hilton'),
    feat(2,'DB','Guest Profile','Preferences and history','code-pattern',/Guest.*model|GuestProfile/i,'Marriott'),
    feat(3,'API','Hotel Search API','Search hotels','code-pattern',/hotel.*search|search.*hotel/i,'Marriott'),
    feat(3,'API','Reservation API','Book/modify/cancel','code-pattern',/createReservation|modifyReservation/i,'Hilton'),
    feat(3,'API','Room Service API','In-room orders','code-pattern',/room.*service|inRoom.*order/i,'Marriott'),
    feat(4,'FE','Hotel Search','Search/browse','file-exists','src/**/HotelSearch*.{tsx,jsx}','Marriott'),
    feat(4,'FE','Room Selection','Choose room type','file-exists','src/**/RoomSelect*.{tsx,jsx}','Hilton'),
    feat(4,'FE','Booking Flow','Reservation/payment','file-exists','src/**/HotelBooking*.{tsx,jsx}','Marriott'),
    feat(4,'FE','Guest Portal','Manage reservations','file-exists','src/**/GuestPortal*.{tsx,jsx}','Hilton'),
    feat(4,'FE','Staff Dashboard','Front desk','file-exists','src/**/StaffDashboard*.{tsx,jsx}','Marriott'),
    feat(13,'Pay','Room Payment','Pay for reservations','code-pattern',/stripe|paypal|room.*payment/i,'Hilton'),
    feat(13,'Pay','Points Redemption','Loyalty points','code-pattern',/point.*redeem|loyalty.*point/i,'Marriott'),
    feat(14,'Notif','Booking Confirmation','Email confirm','code-pattern',/booking.*confirm|reservation.*confirm/i,'Hilton'),
    feat(15,'Storage','Property Images','Hotel/room photos','code-pattern',/s3|cloudinary|upload.*image/i,'Hilton'),
    feat(16,'Search','Hotel Search','Location-based','code-pattern',/hotel.*search|search.*hotel/i,'Marriott'),
    feat(16,'Search','Map Browsing','Browse on map','code-pattern',/google.*map|mapbox/i,'Hilton'),
    feat(19,'A11y','Accessible Booking','WCAG-compliant','code-pattern',/aria-|role=|WCAG/i,'Marriott'),
  ];

  const files: string[] = [
    'src/features/auth/register.ts','src/features/hotels/hotel-search.tsx','src/features/hotels/hotel-detail.tsx',
    'src/features/hotels/room-selection.tsx','src/features/booking/booking-flow.tsx',
    'src/features/guest/guest-portal.tsx','src/features/guest/reservation-management.tsx',
    'src/features/staff/staff-dashboard.tsx',
    'src/components/HotelCard.tsx','src/components/RoomCard.tsx','src/components/DatePicker.tsx',
    'src/app/page.tsx','src/app/hotels/search/page.tsx','src/app/hotels/[id]/page.tsx',
    'src/app/booking/[id]/page.tsx','src/app/guest/reservations/page.tsx',
  ];

  const tests: string[] = [
    'src/__tests__/hotels/search.test.ts','src/__tests__/booking/booking-flow.test.ts',
    'src/__tests__/integration/hotel.integration.test.ts','e2e/hotel-search.spec.ts','e2e/hotel-booking.spec.ts',
  ];

  const systems: SystemRequirement[] = [
    sys('Frontend','frontend',['Hotel search','Room selection','Booking flow','Guest portal','Staff dashboard']),
    sys('Backend API','backend',['Hotel search API','Reservation API','Room service API']),
    sys('Database','database',['Hotels','Rooms','Reservations','Guests','Amenities']),
    sys('Auth','auth',['Guest auth','Staff auth','Loyalty program']),
    sys('Payment','payment',['Room payments','Points redemption']),
    sys('Notification','notification',['Confirmations','Check-in reminders']),
    sys('Storage','storage',['Hotel photos']),
    sys('Cache','cache',['Availability cache']),
  ];

  const benchmarks: CompetitorFeature[] = [
    comp('Marriott','Bonvoy Loyalty','Loyalty','Points-based rewards'),
    comp('Hilton','Digital Check-In','UX','Mobile check-in and digital key'),
    comp('Marriott','Mobile Key','UX','Smartphone as room key'),
  ];

  return { industry:'hospitality', requiredFeatures:rf, requiredFiles:files, requiredTests:tests, requiredSystems:systems, competitorBenchmarks:benchmarks, completenessThreshold:100 };
}

export function getRealEstateSpec(): ProjectSpec {
  const rf: FeatureRequirement[] = [
    feat(1,'Auth','User Registration','Buyer/seller/agent','code-pattern',/register|signup|agent.*register/i,'Zillow'),
    feat(1,'Auth','Agent Verification','License verification','code-pattern',/agent.*verif|license.*verif/i,'Realtor.com'),
    feat(1,'Auth','Saved Search Alerts','Email alerts','code-pattern',/saved.*search|search.*alert|new.*listing.*alert/i,'Zillow'),
    feat(2,'DB','Property Model','Listing details','code-pattern',/Property.*model|Listing.*model/i,'Zillow'),
    feat(2,'DB','Agent Model','Agent profiles','code-pattern',/Agent.*model|Realtor.*model/i,'Realtor.com'),
    feat(2,'DB','Neighborhood Model','Neighborhood data','code-pattern',/Neighborhood|Area.*model|MarketData/i,'Zillow'),
    feat(2,'DB','Mortgage Model','Loan calculations','code-pattern',/Mortgage.*model|Loan.*model/i,'Redfin'),
    feat(3,'API','Property Search API','Geo/filter search','code-pattern',/property.*search|listing.*search|geo.*search/i,'Zillow'),
    feat(3,'API','Property Details API','Full listing data','code-pattern',/property.*detail|listing.*detail/i,'Realtor.com'),
    feat(3,'API','Mortgage Calculator API','Payment estimates','code-pattern',/mortgage.*calc|loan.*calc|payment.*estim/i,'Redfin'),
    feat(3,'API','Neighborhood Data API','School/crime/walk scores','code-pattern',/neighborhood|school.*score|walk.*score/i,'Zillow'),
    feat(4,'FE','Property Search','Map view','file-exists','src/**/PropertySearch*.{tsx,jsx}','Zillow'),
    feat(4,'FE','Property Detail Page','Photos, tour','file-exists','src/**/PropertyDetail*.{tsx,jsx}','Realtor.com'),
    feat(4,'FE','Interactive Map','Map browsing','file-exists','src/**/PropertyMap*.{tsx,jsx}','Zillow'),
    feat(4,'FE','Mortgage Calculator','Interactive tool','file-exists','src/**/MortgageCalc*.{tsx,jsx}','Redfin'),
    feat(4,'FE','Agent Dashboard','Listing management','file-exists','src/**/AgentDashboard*.{tsx,jsx}','Realtor.com'),
    feat(13,'Pay','Lead Generation','Pay for leads','code-pattern',/lead.*payment|pay.*lead/i,'Zillow'),
    feat(13,'Pay','Listing Fees','Pay to list','code-pattern',/listing.*fee|list.*payment/i,'Realtor.com'),
    feat(14,'Notif','New Listing Alerts','Email alerts','code-pattern',/new.*listing|listing.*alert/i,'Zillow'),
    feat(14,'Notif','Price Change Alerts','Price drop alerts','code-pattern',/price.*change|price.*drop/i,'Redfin'),
    feat(15,'Storage','Property Images','High-quality photos','code-pattern',/s3|cloudinary|upload.*image/i,'Zillow'),
    feat(15,'Storage','Virtual Tours','3D tours','code-pattern',/virtual.*tour|3d.*tour/i,'Realtor.com'),
    feat(16,'Search','Map-Based Search','Draw boundaries','code-pattern',/draw.*boundary|map.*search/i,'Zillow'),
    feat(16,'Search','Autocomplete','Address autocomplete','code-pattern',/autocomplete|address.*search/i,'Redfin'),
    feat(17,'Analytics','Market Analytics','Price trends','code-pattern',/market.*analytic|price.*trend|zestimate/i,'Zillow'),
    feat(17,'Analytics','Lead Analytics','Conversion tracking','code-pattern',/lead.*analytic|conversion.*rate/i,'Realtor.com'),
  ];

  const files: string[] = [
    'src/features/auth/register.ts','src/features/properties/property-search.tsx','src/features/properties/property-detail.tsx',
    'src/features/properties/property-map.tsx','src/features/mortgage/mortgage-calculator.tsx',
    'src/features/agents/agent-profile.tsx','src/features/agents/agent-dashboard.tsx',
    'src/features/neighborhoods/neighborhood-data.tsx',
    'src/components/PropertyCard.tsx','src/components/ImageGallery.tsx','src/components/MortgageChart.tsx',
    'src/lib/property/valuation.ts','src/lib/maps/map-provider.ts',
    'src/app/page.tsx','src/app/homes/page.tsx','src/app/homes/[id]/page.tsx',
    'src/app/mortgage-calculator/page.tsx','src/app/agent/dashboard/page.tsx',
  ];

  const tests: string[] = [
    'src/__tests__/properties/property.test.ts','src/__tests__/mortgage/calculator.test.ts',
    'src/__tests__/valuation/valuation.test.ts','e2e/property-search.spec.ts','e2e/property-detail.spec.ts',
  ];

  const systems: SystemRequirement[] = [
    sys('Frontend','frontend',['Property search','Property detail','Interactive map','Mortgage calculator','Agent dashboard']),
    sys('Backend API','backend',['Search API','Listing API','Valuation API','Neighborhood data']),
    sys('Database','database',['Properties','Agents','Neighborhoods','Listings','Market data']),
    sys('Auth','auth',['User auth','Agent verification']),
    sys('Payment','payment',['Lead payments','Listing fees']),
    sys('Notification','notification',['New listing alerts','Price change alerts']),
    sys('Storage','storage',['Property photos','Virtual tours','CDN']),
    sys('Cache','cache',['Search cache','Valuation cache']),
  ];

  const benchmarks: CompetitorFeature[] = [
    comp('Zillow','Zestimate','Valuation','AI-powered home value'),
    comp('Zillow','3D Home Tours','UX','Immersive walkthroughs'),
    comp('Redfin','Touring Dashboard','UX','Schedule tours in-app'),
    comp('Zillow','Make Me Move','Discovery','Price your home'),
  ];

  return { industry:'real-estate', requiredFeatures:rf, requiredFiles:files, requiredTests:tests, requiredSystems:systems, competitorBenchmarks:benchmarks, completenessThreshold:100 };
}

export function getAutomotiveSpec(): ProjectSpec {
  const rf: FeatureRequirement[] = [
    feat(1,'Auth','User Registration','Buyer/seller','code-pattern',/register|signup/i,'Carvana'),
    feat(1,'Auth','Dealer Registration','Dealership','code-pattern',/dealer.*register|dealership/i,'Autotrader'),
    feat(1,'Auth','Social Login','Google/Facebook','code-pattern',/oauth|google.*login/i,'Tesla'),
    feat(2,'DB','Vehicle Model','Vehicle listing','code-pattern',/Vehicle.*model|Car.*model/i,'Autotrader'),
    feat(2,'DB','Dealership Model','Dealer profiles','code-pattern',/Dealership.*model|Dealer.*model/i,'Autotrader'),
    feat(2,'DB','Trade-In Model','Trade-in valuation','code-pattern',/TradeIn.*model|Trade.*model/i,'Carvana'),
    feat(2,'DB','Financing Model','Loan applications','code-pattern',/Financing.*model|Loan.*model/i,'Tesla'),
    feat(2,'DB','Service Model','Maintenance records','code-pattern',/Service.*model|Maintenance.*model/i,'Tesla'),
    feat(3,'API','Vehicle Search API','Search by criteria','code-pattern',/vehicle.*search|car.*search|inventory.*search/i,'Autotrader'),
    feat(3,'API','VIN Decoder API','VIN decode specs','code-pattern',/vin.*decode|decode.*vin/i,'Carvana'),
    feat(3,'API','Trade-In Valuation API','Trade-in value','code-pattern',/trade.*value|vehicle.*value/i,'Carvana'),
    feat(3,'API','Financing API','Loan application','code-pattern',/financing|loan.*apply|pre.*approv/i,'Tesla'),
    feat(4,'FE','Vehicle Search','Search/browse','file-exists','src/**/VehicleSearch*.{tsx,jsx}','Autotrader'),
    feat(4,'FE','Vehicle Detail','Photos, specs','file-exists','src/**/VehicleDetail*.{tsx,jsx}','Carvana'),
    feat(4,'FE','Trade-In Calculator','Get trade-in value','file-exists','src/**/TradeIn*.{tsx,jsx}','Carvana'),
    feat(4,'FE','Financing Application','Auto loan','file-exists','src/**/Financing*.{tsx,jsx}','Tesla'),
    feat(4,'FE','Service Scheduling','Book service','file-exists','src/**/ServiceSchedule*.{tsx,jsx}','Tesla'),
    feat(4,'FE','Dealership Dashboard','Inventory mgmt','file-exists','src/**/DealerDashboard*.{tsx,jsx}','Autotrader'),
    feat(6,'Data','Vehicle DTO','Vehicle types','code-pattern',/VehicleDTO|VehicleSchema/i,'Autotrader'),
    feat(6,'Data','Valuation DTO','Valuation schema','code-pattern',/ValuationDTO|TradeInDTO/i,'Carvana'),
    feat(6,'Data','Financing DTO','Loan schema','code-pattern',/FinancingDTO|LoanApplication/i,'Tesla'),
    feat(7,'Error','Payment Failure Recovery','Handle declines','code-pattern',/payment.*fail|declined/i,'Carvana'),
    feat(13,'Pay','Vehicle Purchase','Online purchase','code-pattern',/stripe|paypal|vehicle.*purchase/i,'Carvana'),
    feat(13,'Pay','Financing Integration','Auto loan','code-pattern',/auto.*loan|lender|financing.*partner/i,'Tesla'),
    feat(13,'Pay','Service Payment','Maintenance pay','code-pattern',/service.*payment|maintenance.*pay/i,'Tesla'),
    feat(14,'Notif','Service Reminders','Oil change alerts','code-pattern',/service.*remind|maintenance.*alert/i,'Tesla'),
    feat(15,'Storage','Vehicle Images','High-quality photos','code-pattern',/s3|cloudinary|upload.*image/i,'Carvana'),
    feat(15,'Storage','360-Degree Views','Interactive 360 photos','code-pattern',/360.*view|spin.*view/i,'Autotrader'),
    feat(16,'Search','Vehicle Search','By make/model/year','code-pattern',/vehicle.*search|car.*search/i,'Autotrader'),
    feat(16,'Search','VIN Search','Search by VIN','code-pattern',/vin.*search/i,'Carvana'),
    feat(16,'Search','Advanced Filters','Price/mileage/features','code-pattern',/filter.*price|filter.*mileage/i,'Autotrader'),
    feat(17,'Analytics','Inventory Analytics','Inventory metrics','code-pattern',/inventory.*analytic|vehicle.*metric/i,'Autotrader'),
    feat(17,'Analytics','Lead Analytics','Sales leads','code-pattern',/lead.*analytic|conversion.*rate/i,'Carvana'),
  ];

  const files: string[] = [
    'src/features/auth/register.ts','src/features/vehicles/vehicle-search.tsx','src/features/vehicles/vehicle-detail.tsx',
    'src/features/vehicles/vehicle-comparison.tsx','src/features/tradein/trade-in-calculator.tsx',
    'src/features/financing/financing-application.tsx','src/features/service/service-scheduler.tsx',
    'src/features/dealer/dealer-dashboard.tsx',
    'src/components/VehicleCard.tsx','src/components/VehicleGallery.tsx','src/components/FinancingForm.tsx',
    'src/lib/vehicles/vin-decoder.ts','src/lib/vehicles/valuation.ts','src/lib/financing/loan-calc.ts',
    'src/api/vehicles/route.ts','src/api/valuation/route.ts','src/api/financing/route.ts',
    'src/app/vehicles/page.tsx','src/app/vehicles/[id]/page.tsx','src/app/trade-in/page.tsx',
    'src/app/financing/page.tsx','src/app/dealer/dashboard/page.tsx',
  ];

  const tests: string[] = [
    'src/__tests__/vehicles/vehicle.test.ts','src/__tests__/vehicles/vin-decoder.test.ts',
    'src/__tests__/valuation/valuation.test.ts','src/__tests__/financing/loan.test.ts',
    'e2e/vehicle-search.spec.ts','e2e/vehicle-detail.spec.ts',
  ];

  const systems: SystemRequirement[] = [
    sys('Frontend','frontend',['Vehicle search','Vehicle detail','Trade-in calculator','Financing','Service scheduling']),
    sys('Backend API','backend',['Vehicle search API','VIN decoder','Valuation API','Financing API','Service booking']),
    sys('Database','database',['Vehicles','Dealerships','Trade-ins','Financing','Service records','Recalls']),
    sys('Auth','auth',['User auth','Dealer auth','OAuth']),
    sys('Payment','payment',['Vehicle purchase','Auto loans','Service payments']),
    sys('Notification','notification',['Service reminders','Recall alerts']),
    sys('Storage','storage',['Vehicle photos','360 views','CDN']),
  ];

  const benchmarks: CompetitorFeature[] = [
    comp('Carvana','Online Purchase','E-commerce','Buy car entirely online'),
    comp('Autotrader','VIN Search','Search','Search by VIN'),
    comp('Tesla','Online Financing','Finance','Digital loan application'),
    comp('Carvana','Trade-In Calculator','Valuation','Instant trade-in estimate'),
  ];

  return { industry:'automotive', requiredFeatures:rf, requiredFiles:files, requiredTests:tests, requiredSystems:systems, competitorBenchmarks:benchmarks, completenessThreshold:100 };
}
