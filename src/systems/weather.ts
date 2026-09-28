import { WEATHER_ODDS, type Weather } from '../data/weather';
import { specialDayOf } from './friendship';
import { hashString, seeded } from './random';

/**
 * The weather on a day, from its key alone (decisions.md 4), so every place and every reload
 * agrees, and nothing needs saving. Her special days are always clear: a party round the well
 * shouldn't be rained on.
 */
export function weatherOn(day: string): Weather {
  if (specialDayOf(day) !== null) return 'clear';
  const roll = Math.floor(seeded(hashString(`weather:${day}`))() * 20);
  if (roll < WEATHER_ODDS.rain) return 'rain';
  if (roll < WEATHER_ODDS.rain + WEATHER_ODDS.fog) return 'fog';
  return 'clear';
}
