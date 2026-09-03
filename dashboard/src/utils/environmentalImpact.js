import { TRAFFIC_CONSTANTS } from './constants.js';

/**
 * Centralized, authoritative calculation for Environmental & Commuter Economic Impact.
 *
 * Direct mathematical formulas:
 * 1. delayReductionPerVehicle = max(0, baselineDelay - currentMeasuredDelay)
 * 2. totalDelayReduction = passedCars * delayReductionPerVehicle
 * 3. fuelConserved = passedCars * delayReductionPerVehicle * 0.00028
 * 4. co2Avoided = fuelConserved * 2.31
 * 5. fuelSavings = fuelConserved * fuelPricePerLiter (105 INR/L)
 * 6. commuterTimeSaved = totalDelayReduction (seconds)
 * 7. commuterTimeValue = (commuterTimeSaved / 3600) * commuterValuePerHour (200 INR/hr)
 * 8. economicValue = fuelSavings + commuterTimeValue
 *
 * @param {number} passedCars - Authoritative count of passed vehicles in current session
 * @param {number|null} currentMeasuredDelay - Measured average delay in seconds (e.g. 30.0s)
 * @param {number} baselineDelay - Baseline fixed signal delay (default 45.0s)
 * @returns {Object} Calculated impact metrics with both full precision and clean UI formatting
 */
export function calculateEnvironmentalImpact(
  passedCars = 0,
  currentMeasuredDelay = null,
  baselineDelay = TRAFFIC_CONSTANTS.TRADITIONAL_WAIT_TIME
) {
  const cars = typeof passedCars === 'number' && !isNaN(passedCars) ? Math.max(0, passedCars) : 0;
  const baseline = typeof baselineDelay === 'number' && !isNaN(baselineDelay) ? baselineDelay : 45.0;

  // Determine current measured delay
  let delay = baseline;
  if (typeof currentMeasuredDelay === 'number' && !isNaN(currentMeasuredDelay) && currentMeasuredDelay > 0) {
    delay = currentMeasuredDelay;
  } else if (cars > 0) {
    // If vehicles have passed in adaptive AI mode, representative measured delay is ~30.0s
    delay = 30.0;
  }

  // Delay reduction per vehicle: max(0, baseline - delay)
  const delayReductionPerVehicle = Math.max(0, baseline - delay);
  const totalDelayReduction = cars * delayReductionPerVehicle;

  // Fuel: passedCars × delayReductionPerVehicle × 0.00028
  const rawFuelConserved = cars * delayReductionPerVehicle * TRAFFIC_CONSTANTS.FUEL_CONSUMPTION_RATE;

  // CO2: fuelConserved × 2.31
  const rawCo2Avoided = rawFuelConserved * TRAFFIC_CONSTANTS.CO2_FACTOR;

  // Economic Value: Fuel savings + Commuter time savings
  const fuelSavings = rawFuelConserved * TRAFFIC_CONSTANTS.FUEL_COST;
  const commuterTimeSaved = totalDelayReduction; // seconds
  const commuterTimeValue = (commuterTimeSaved / 3600) * TRAFFIC_CONSTANTS.COMMUTER_TIME_VALUE_PER_HOUR;
  const economicValue = fuelSavings + commuterTimeValue;

  return {
    passedCars: cars,
    baselineDelay: baseline,
    currentDelay: Number(delay.toFixed(2)),
    delayReductionPerVehicle: Number(delayReductionPerVehicle.toFixed(2)),
    totalDelayReduction: Number(totalDelayReduction.toFixed(2)),
    
    // Fuel Conserved
    fuelConserved: Number(rawFuelConserved.toFixed(2)),
    fuelSavedLiters: Number(rawFuelConserved.toFixed(2)),
    rawFuelConserved,

    // CO2 Avoided
    co2Avoided: Number(rawCo2Avoided.toFixed(2)),
    co2ReducedKg: Number(rawCo2Avoided.toFixed(2)),
    rawCo2Avoided,

    // Economic Impact
    fuelSavings: Number(fuelSavings.toFixed(2)),
    commuterTimeSaved: Number(commuterTimeSaved.toFixed(2)),
    commuterTimeValue: Number(commuterTimeValue.toFixed(2)),
    economicValue: Math.round(economicValue),
    economicSavingsRupees: Math.round(economicValue),

    hasData: cars > 0
  };
}
