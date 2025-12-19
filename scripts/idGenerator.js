// scripts/idGenerator.js

/**
 * Generates a random ID with a given prefix.
 * Example: OUT-04567, STK-98231
 *
 * @param {string} prefix - Prefix for the ID (e.g., "OUT", "STK").
 * @param {string} fieldId - DOM input field ID to populate.
 * @param {boolean} verbose - Optional: enable console logging.
 */
export function generateRandomId(prefix, fieldId, verbose = false) {
  // random number between 1 and 99999
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  // pad with leading zeros to 5 digits
  const padded = String(randomNum).padStart(5, "0");
  const newId = `${prefix}-${padded}`;

  // populate the input field if present
  const input = document.getElementById(fieldId);
  if (input) input.value = newId;

  if (verbose) {
    console.log(`✅ Generated random ID: ${newId}`);
  }

  return newId;
}
