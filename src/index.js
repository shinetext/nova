const AWS = require('aws-sdk');
const { generateReferralCode } = require('./helper');
const sns = new AWS.SNS({
  region: process.env.SERVICE_REGION,
});
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

  if (!user.referred_by) {
    throw new Error(`Missing referrer's referral code`);
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
    const query = `INSERT INTO ${process.env.PHOTON_DB_REFERRALS_TABLE} SET ?`;
    await db.queryAsync(query, [data]);
    return data;
  } catch (err) {
    console.log(err);
    throw new Error(`Error saving user to referrals db`);
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
    const { referralCode } = referrer;
    const referrerQuery = `SELECT *
    FROM ${process.env.DB_REFERRALS_TABLE}
    WHERE v2_code = ? 
    OR v1_code = ?`;

    const result = await db.queryAsync(referrerQuery, [
      `${referralCode}`,
      `${referralCode}`,
    ]);

    if (result && result.length > 0) {
      const { sms_user_id, fb_user_id, glow_user_id, kik_user_id } = result[0];

      let countQuery;
      // Get referral count of user
      if (result[0].v1_code && result[0].v2_code) {
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

      const count = await db.queryAsync(countQuery, [
        `${result[0].v2_code}`,
        `${result[0].v1_code}`,
      ]);

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
  getReferrerInfo,
  publishReferralEvent,
};
