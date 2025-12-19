// scripts/idGenerator.js

/**
 * Generates a random ID with a given prefix and writes it into a DOM field.
 * Example: IN-04567, OUT-98231, STK-12345
 *
 * @param {string} prefix - Prefix for the ID (e.g., "IN", "OUT", "STK").
 * @param {string} fieldId - DOM input field ID to populate.
 */
export function generateId(prefix, fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;

  // Generate a 5-digit padded number
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  const padded = String(randomNum).padStart(5, "0");

  el.value = `${prefix}-${padded}`;
}
