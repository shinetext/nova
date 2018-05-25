const AWS = require('aws-sdk');
const Promise = require('bluebird');

const sns = new AWS.SNS({
  region: process.env.SERVICE_REGION,
});
Promise.promisifyAll(sns);

/**
 * Adds a user to the referralsv2 table
 *
 * @param user {object} User to add
 * @param db {object} Database connection
 * @return Promise
 */
const createUser = async (user, db) => {
  if (
    !user.fb_user_id &&
    !user.sms_user_id &&
    !user.glow_user_id &&
    !user.kik_user_id
  ) {
    throw new Error('Missing platform id for user');
  }

  if (!user.v1_code && !user.v2_code) {
    throw new Error('Missing a referral code for user');
  }

  const referralCode = await generateReferralCode(user);

  const data = {
    sms_user_id: user.sms_user_id,
    fb_user_id: user.fb_user_id,
    glow_user_id: user.glow_user_id,
    kik_user_id: user.kik_user_id,
    v1_code: user.v1_code,
    v2_code: referralCode,
    referred_by: user.referred_by,
  };

  try {
    const query = `INSERT INTO ${process.env.PHOTON_DB_REFERRALS_TABLE} SET ?`;
    await db.queryAsync(query, [data]);
    return data;
  } catch (err) {
    throw new Error(`Error saving user to referrals db`);
  }
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
const getReferrerPlatform = (referrer, defaultPlatform) => {
  const keysWithValues = Object.keys(referrer).filter(key => {
    return referrer[key];
  });

  let platforms = [];

  for (var i = 0; i < keysWithValues.length; i++) {
    switch (keysWithValues[i]) {
      case 'sms_user_id':
        platforms.push('sms');
        break;

      case 'fb_user_id':
        platforms.push('fb');
        break;

      case 'glow_user_id':
        platforms.push('app');
        break;

      case 'kik_user_id':
        platforms.push('kik');
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

/**
 * Gets a user's referral count and all platforms they're on.
 *
 * @param user {object} with v1 referral code (if exists) and v2 referral code
 *
 * @param db {object} Database connection
 * @return {Promise} user object
 *      .referral_count {number} User's referral count,
 *      .platform {string} platform of referrer

 */
const getReferrerInfo = async (referralCode, db) => {
  try {
    const referrerQuery = `SELECT *
    FROM ${process.env.DB_REFERRALS_TABLE}
    WHERE v2_code = ${referralCode}
    OR v1_code = ${referralCode}`;
    const result = db.queryAsync(referrerQuery);

    if (result && result.length > 0) {
      const { platform, platformId } = getReferrerPlatform(result[0]);

      // Get referral count of user
      if (result[0].v1_code && result[0].v2_code) {
        let countQuery;
        countQuery = `
        SELECT count(*)
        FROM ${process.env.DB_REFERRALS_TABLE}
        WHERE referred_by = ${result[0].v2_code}
        OR referred_by = ${result[0].v1_code};`;
      } else {
        countQuery = `
        SELECT count(*)
        FROM ${process.env.DB_REFERRALS_TABLE}
        WHERE referred_by = ${user.v2_code}
      )`;
      }

      try {
        const count = db.queryAsync(countQuery);

        return {
          referralCount: count,
          platform,
          platformId,
        };
      } catch (err) {
        throw new Error('Error querying user referral count: ', err.message);
      }
    }
  } catch (err) {
    throw new Error('No user found with given referral code:', err.message);
  }
};

/**
 * Publishes an AWS SNS topic for a signup event.
 *
 * @param topic {string} topic name
 * @param eventData {object} payload with new user and referrer data
 */
const publishReferralEvent = (topic, eventData) => {
  const message = JSON.stringify(eventData);
  const snsParams = {
    Message: message,
    TopicArn: topic,
  };

  sns.publish(snsParams, (err, data) => {
    if (err) {
      console.log(`An error occured publishing to SNS topic`, err.message);
      throw new Error(err.message);
    } else {
      console.log('Successfully published to SNS topic', data);
    }
  });
};

module.exports = {
  createUser,
  getReferrerInfo,
  publishReferralEvent,
};
