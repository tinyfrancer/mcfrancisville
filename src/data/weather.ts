/**
 * The town's weather (phase L): most days clear, and now and then a day of soft rain or of fog,
 * the same all day and in every place, dealt from the day key.
 */
export type Weather = 'clear' | 'rain' | 'fog';

/** How many days in twenty are rainy, and how many foggy; the rest are clear. */
export const WEATHER_ODDS: Record<Exclude<Weather, 'clear'>, number> = { rain: 3, fog: 3 };

/** What the Curiosity Cabinet says of a critter that only comes out in some weather. */
export const WEATHER_NAMES: Record<Weather, string> = {
  clear: 'on clear days',
  rain: 'on rainy days',
  fog: 'on foggy days',
};
