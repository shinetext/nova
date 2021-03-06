const ADJECTIVES = require('./constants/adjectives');

const formatName = (name) => {

  // If no name is provided, or
  // if name contains unicode chars, ie. non-latin-based names,
  // default to 'shine'
  if (!name || name.indexOf('?') !== -1) {
    return 'shine';
  }

  const parsed = name
    .trim() // Trim any leading & trailing white space
    .split(' ')[0] // Get only 1st part of first name if multiple words in name
    .replace(/[\W_\d]/g, '') // Strip away non-alphanumeric chars + digits
    .toLowerCase(); // Standardize casing

  if (parsed) {
    return parsed;
  }
  return 'shine';
};

/**
 * Generates referral code for a new user in the following format:
 * ${adjective} - ${first_name || 'shine'} - ${count}
 *
 * @param data {object} data of user signing up
 *   .firstName {string} new user's first name. Defaults to 'shine'
 *   .v1_code {string} if user is an sms user, has a v1 code
 *
 */
const generateReferralCode = async (data, db, wordList = ADJECTIVES) => {
  const adjective = `${wordList[Math.floor(Math.random() * wordList.length)]}`;
  const name = formatName(data.first_name);

  const condition = `${adjective}-${name}-%`;
  let count;

  // Get row count of users who share the same adj-name base in referral code
  const countQuery = `
    SELECT count(*) AS count 
    FROM ${process.env.DB_REFERRALS_TABLE}
    WHERE v2_code like ?`;

  const result = await db.queryAsync(countQuery, [condition]);

  if (result && result.length > 0) {
    count = result[0].count + 1;
  } else {
    count = 1;
  }

  return `${adjective}-${name}-${count}`;
};

module.exports = {
  generateReferralCode,
  formatName,
};