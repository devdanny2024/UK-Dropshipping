/**
 * UK2ME Delivery Engine (M2 R6) — pure, side-effect-free date logic.
 *
 * Two independent legs:
 *   Leg 1  store → in-country hub      (calendar days; Express UK-only)
 *   Leg 2  hub  → Lagos               (working days;  Express UK-only)
 * Despatch from the hub happens on a fixed weekday (Thursday by default); an order
 * must be at the hub `despatchCutoffDays` before that day to make the week's despatch.
 *
 * Kept dependency-free so it is unit-testable and reusable. Configuration is loaded
 * from AppSetting via `getDeliveryConfig()` in lib/settings.ts.
 */

export type Speed = 'STD' | 'EXPRESS';

export interface DeliveryConfig {
  processingDays: number;        // order placed → ready for Leg 1 (working days)
  leg1StdMin: number;
  leg1StdMax: number;
  leg1ExpressMin: number;
  leg1ExpressMax: number;
  despatchWeekday: number;       // 0=Sun … 4=Thu … 6=Sat
  despatchCutoffDays: number;    // must be at hub this many days before despatch
  leg2StdMin: number;            // working days
  leg2StdMax: number;
  leg2ExpressMin: number;
  leg2ExpressMax: number;
  expressRegions: string[];      // regions allowed to use Express, e.g. ['UK']
}

export interface DeliveryEstimateInput {
  placedAt: Date;
  region: string;                // 'UK' | 'US'
  leg1Speed: Speed;
  leg2Speed: Speed;
  config: DeliveryConfig;
}

export interface DeliveryLeg {
  leg: 1 | 2;
  speed: Speed;
  label: string;
}

export interface DeliveryEstimate {
  region: string;
  leg1Speed: Speed;              // effective speed (downgraded if express not allowed)
  leg2Speed: Speed;
  expressAvailable: boolean;
  readyAt: Date;
  hubArriveMin: Date;
  hubArriveMax: Date;
  despatchDate: Date;
  deliveryMin: Date;
  deliveryMax: Date;
  legs: DeliveryLeg[];
  notices: string[];
}

/** Add `n` calendar days to a date (does not mutate the input). */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

/** Add `n` working days (skips Saturday & Sunday). `n` may be 0. */
export function addWorkingDays(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d;
}

/** First date on/after `from` whose weekday is `weekday` (0=Sun … 6=Sat). */
export function nextDespatchDay(from: Date, weekday: number): Date {
  const d = new Date(from.getTime());
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Compute the despatch day and delivery window for an order.
 * Express on either leg is honoured only when the region is in `expressRegions`;
 * otherwise the leg falls back to standard with a notice.
 */
export function estimateDelivery(input: DeliveryEstimateInput): DeliveryEstimate {
  const { placedAt, region, config } = input;
  const notices: string[] = [];
  const expressAvailable = config.expressRegions.includes(region);

  const leg1Speed: Speed = input.leg1Speed === 'EXPRESS' && !expressAvailable ? 'STD' : input.leg1Speed;
  const leg2Speed: Speed = input.leg2Speed === 'EXPRESS' && !expressAvailable ? 'STD' : input.leg2Speed;
  if (input.leg1Speed === 'EXPRESS' && !expressAvailable) {
    notices.push(`Express is only available for ${config.expressRegions.join(', ')}; Leg 1 set to standard.`);
  }
  if (input.leg2Speed === 'EXPRESS' && !expressAvailable) {
    notices.push(`Express is only available for ${config.expressRegions.join(', ')}; Leg 2 set to standard.`);
  }

  const leg1Min = leg1Speed === 'EXPRESS' ? config.leg1ExpressMin : config.leg1StdMin;
  const leg1Max = leg1Speed === 'EXPRESS' ? config.leg1ExpressMax : config.leg1StdMax;
  const leg2Min = leg2Speed === 'EXPRESS' ? config.leg2ExpressMin : config.leg2StdMin;
  const leg2Max = leg2Speed === 'EXPRESS' ? config.leg2ExpressMax : config.leg2StdMax;

  const readyAt = addWorkingDays(placedAt, config.processingDays);
  // Leg 1 (store → hub) is counted in calendar days.
  const hubArriveMin = addDays(readyAt, leg1Min);
  const hubArriveMax = addDays(readyAt, leg1Max);
  // Must be at the hub `cutoffDays` before the despatch weekday to make that despatch.
  const despatchDate = nextDespatchDay(addDays(hubArriveMax, config.despatchCutoffDays), config.despatchWeekday);
  // Leg 2 (hub → Lagos) is counted in working days.
  const deliveryMin = addWorkingDays(despatchDate, leg2Min);
  const deliveryMax = addWorkingDays(despatchDate, leg2Max);

  return {
    region,
    leg1Speed,
    leg2Speed,
    expressAvailable,
    readyAt,
    hubArriveMin,
    hubArriveMax,
    despatchDate,
    deliveryMin,
    deliveryMax,
    legs: [
      { leg: 1, speed: leg1Speed, label: `Store → hub (${leg1Speed === 'EXPRESS' ? 'express' : 'standard'})` },
      { leg: 2, speed: leg2Speed, label: `Hub → Lagos (${leg2Speed === 'EXPRESS' ? 'express' : 'standard'})` },
    ],
    notices,
  };
}
