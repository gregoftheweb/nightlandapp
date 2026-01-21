// app/sub-games/aerowreckage-puzzle/utils.ts
// Utility functions for the Dead Dial puzzle

import { PUZZLE_CONFIG } from './config'
import { DialDirection } from './types'

/**
 * Normalize an angle to the range [0, 2π)
 */
export function normalizeAngle(angle: number): number {
  const TWO_PI = 2 * Math.PI
  let normalized = angle % TWO_PI
  if (normalized < 0) {
    normalized += TWO_PI
  }
  return normalized
}

/**
 * Convert an angle (in radians) to a dial number
 * @param angle - Angle in radians
 * @param totalNumbers - Total numbers on the dial
 * @returns Number on dial (0 to totalNumbers-1)
 */
export function angleToNumber(
  angle: number,
  totalNumbers: number = PUZZLE_CONFIG.totalNumbers
): number {
  const normalized = normalizeAngle(angle)
  const fraction = normalized / (2 * Math.PI)
  const number = Math.round(fraction * totalNumbers) % totalNumbers
  return number
}

/**
 * Convert a dial number to an angle (in radians)
 * @param number - Number on dial (0 to totalNumbers-1)
 * @param totalNumbers - Total numbers on the dial
 * @returns Angle in radians
 */
export function numberToAngle(
  number: number,
  totalNumbers: number = PUZZLE_CONFIG.totalNumbers
): number {
  return (number / totalNumbers) * 2 * Math.PI
}

/**
 * Determine rotation direction from angle delta
 * @param angleDelta - Change in angle (current - previous)
 * @returns 'CW' for clockwise, 'CCW' for counter-clockwise, or null if no rotation
 */
export function getRotationDirection(angleDelta: number): DialDirection | null {
  if (Math.abs(angleDelta) < 0.01) {
    return null // No significant rotation
  }

  // Normalize the delta to handle wrap-around
  let normalizedDelta = angleDelta
  if (normalizedDelta > Math.PI) {
    normalizedDelta -= 2 * Math.PI
  } else if (normalizedDelta < -Math.PI) {
    normalizedDelta += 2 * Math.PI
  }

  // In standard math coordinates (Y-axis points DOWN on screen):
  // Positive angle delta = clockwise rotation (numbers increasing visually clockwise)
  // Negative angle delta = counter-clockwise rotation (numbers decreasing visually counter-clockwise)
  return normalizedDelta > 0 ? 'CW' : 'CCW'
}

/**
 * Check if current number is within tolerance of target number
 * @param current - Current number on dial
 * @param target - Target number
 * @param tolerance - Allowed deviation
 * @param totalNumbers - Total numbers on dial
 * @returns True if within tolerance
 */
export function isWithinTolerance(
  current: number,
  target: number,
  tolerance: number = PUZZLE_CONFIG.tolerance,
  totalNumbers: number = PUZZLE_CONFIG.totalNumbers
): boolean {
  // Calculate the shortest distance considering wrap-around
  const diff = Math.abs(current - target)
  const wrapDiff = totalNumbers - diff
  const shortestDiff = Math.min(diff, wrapDiff)

  return shortestDiff <= tolerance
}

/**
 * Format a number for display on the dial (with leading zero if needed)
 */
export function formatDialNumber(number: number): string {
  return number.toString().padStart(2, '0')
}
