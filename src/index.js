const AWS = require('aws-sdk');
const {
  generateReferralCode
} = require('./helper');
const sns = new AWS.SNS({
  region: process.env.SERVICE_REGION,
});
/**
 * Adds a user to the referralsv2 table
 *
 * @param user {object} User to add 
 *  .first_name {str}
 *  .referred_by {string}
 *  .fb_user_id {number}
 * @param db {object} Database connection
 * @return Promise
 */
const createUser = async (user, db) => {
  if (!user.fb_user_id &&
    !user.sms_user_id &&
    !user.glow_user_id &&
    !user.kik_user_id
  ) {
    throw new Error('Missing platform id for user');
  }

  const referralCode = await generateReferralCode(user, db);

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
    const query = `INSERT INTO ${process.env.DB_REFERRALS_TABLE} SET ?`;
    await db.queryAsync(query, [data]);
    return data;
  } catch (err) {
    console.log(err);
    throw new Error(`Error saving user to referrals db`);
  }
};

/**
 * Gets a user's referral code
 *
 * @param user {object}
 *  .fb_user_id || sms_user_id || glow_user_id || kik_user_id {number}
 * @param {string} platform (ie. 'fb', 'sms')
 * @param db {object} Database connection
 * @return Promise
 */
const getReferralCode = async (user, platform, db) => {
  try {
    const query = `SELECT * FROM ${process.env.DB_REFERRALS_TABLE} WHERE ?`;

    const result = await db.queryAsync(query, [{
      [`${platform}_user_id`]: user.id
    }, ]);

    if (result && result.length < 1) {
      throw new Error(`No ${platform} user ${user.id} found`);
    }
    return result[0].v2_code;
  } catch (err) {
    console.error(err.message);
    throw new Error(
      `An error occurred getting referral code for ${user}: ${err}`
    );
  }
};

/**
 * Gets a user's referral count
 *
 * @param user {object}
 *  .v2_code {string} ie. 'classy-chris-2'
 *  .v1_code {string} ie. 'dbXYXkPa'
 * @param db {object} Database connection
 * @return Promise
 */
const getReferralCount = async (user, db) => {
  let countQuery;
  if (user.v1_code && user.v2_code) {
    countQuery = `
        SELECT count(*) AS count
        FROM ${process.env.DB_REFERRALS_TABLE}
        WHERE referred_by = ?
        OR referred_by = ?`;
  } else {
    countQuery = `
        SELECT count(*) AS count
        FROM ${process.env.DB_REFERRALS_TABLE}
        WHERE referred_by = ?
      )`;
  }

  try {
    const count = await db.queryAsync(countQuery, [
      `${user.v2_code}`,
      `${user.v1_code}`,
    ]);

    return count;
  } catch (err) {
    throw new Error('An error occurred getting referral count: ', err);
  }
};

/**
 * Gets a user's referral count and all platforms they're on.
 *
 * @param user {object} with v1 referral code (if exists) and v2 referral code
 *
 * @param db {object} Database connection
 * @return {Promise} user object
 *      .referral_count {number} User's referral count,
 *      .platforms {object} platforms of referrer

 */
const getReferrerInfo = async (referrer, db) => {
  try {
    const {
      referralCode
    } = referrer;
    const referrerQuery = `SELECT *
    FROM ${process.env.DB_REFERRALS_TABLE}
    WHERE v2_code = ? 
    OR v1_code = ?`;

    const result = await db.queryAsync(referrerQuery, [
      `${referralCode}`,
      `${referralCode}`,
    ]);

    if (result && result.length > 0) {
      const {
        sms_user_id,
        fb_user_id,
        glow_user_id,
        kik_user_id
      } = result[0];
      const count = await getReferralCount(result[0], db);

      return {
        referralCount: count,
        platforms: {
          sms_user_id,
          fb_user_id,
          glow_user_id,
          kik_user_id,
        },
      };
    }
  } catch (err) {
    throw new Error(
      'An error occurred while querying referrer and referral count:',
      err
    );
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
  getReferralCode,
  getReferralCount,
  getReferrerInfo,
  publishReferralEvent,
};