/**
 * Extract LeetCode username from URL or raw input.
 */

const LEETCODE_URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)\/?$/i;

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{1,30}$/;

function extractUsername(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return { valid: false, error: 'Username or profile URL is required' };

  const urlMatch = trimmed.match(LEETCODE_URL_PATTERN);
  if (urlMatch) {
    return { valid: true, username: urlMatch[1].toLowerCase() };
  }

  if (USERNAME_PATTERN.test(trimmed)) {
    return { valid: true, username: trimmed.toLowerCase() };
  }

  return {
    valid: false,
    error: 'Invalid LeetCode username or URL. Example: https://leetcode.com/username/',
  };
}

module.exports = { extractUsername, LEETCODE_URL_PATTERN, USERNAME_PATTERN };
