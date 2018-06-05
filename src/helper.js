const { PLATFORM_USER_IDS, PLATFORMS } = require('./constants/platforms');
const ADJECTIVES = require('./constants/adjectives');
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
  const name = `${data.first_name || 'shine'}`;
  const condition = `%${adjective}-${name}%`;
  let count;

  // Get row count of users who share the same name-adj base in referral code
  const countQuery = `
    SELECT count(*) AS count 
    FROM ${process.env.PHOTON_DB_REFERRALS_TABLE}
    WHERE v2_code like ?`;

  const result = await db.queryAsync(countQuery, [condition]);

  if (result && result.length > 0) {
    count = result[0].count + 1;
  } else {
    count = 1;
  }

  return `${adjective}-${name}-${count}`;
};

/**
 * Returns platform of referrer. If user is on > 1 platform,
 * uses defaultPlatform if passed or the first platform found.
 *
 * @param referrer {object}
 * @param db {object} Database connection
 * @return {object}
 *  .platform {string}
 *  .platformId {string}
 */
const getReferrerPlatformId = (referrer, defaultPlatform) => {
  const keysWithValues = Object.keys(referrer).filter(key => {
    return referrer[key];
  });

  let platforms = [];

  for (var i = 0; i < keysWithValues.length; i++) {
    switch (keysWithValues[i]) {
      case PLATFORM_USER_IDS.SMS:
        platforms.push(PLATFORMS.SMS);
        break;

      case PLATFORM_USER_IDS.FB:
        platforms.push(PLATFORMS.FB);
        break;

      case PLATFORM_USER_IDS.GLOW:
        platforms.push(PLATFORMS.GLOW);
        break;

      case PLATFORM_USER_IDS.KIK:
        platforms.push(PLATFORMS.KIK);
        break;

      default:
    }
  }

  let platformToUse;

  if (platforms.length > 1 && platforms.indexOf(defaultPlatform) > -1) {
    platformToUse = defaultPlatform;
  } else {
    platformToUse = platforms[0];
  }

  return {
    platform: platformToUse,
    platformId: referrer[`${platformToUse}_user_id`],
  };
};

module.exports = {
  getReferrerPlatformId,
  generateReferralCode,
};
