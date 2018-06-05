const sinon = require('sinon');
const expect = require('chai').expect;
const { generateReferralCode, getReferrerPlatformId } = require('./helper');

let mockDb;
describe('#generateReferralCode', () => {
  let mockDb, userData, randomizeList;

  beforeEach(() => {
    randomizeList = ['brilliant', 'kind'];
    mockDb = {
      queryAsync: sinon.stub().resolves([{ count: 3 }])
    };
    userData = {
      first_name: 'lucy'
    };
  });

  it(`should return a string in adjective-name-count format when user's first name is provided`, done => {
    generateReferralCode(userData, mockDb, randomizeList).then(result => {
      expect(result).to.be.oneOf(['brilliant-lucy-4', 'kind-lucy-4']);
      done();
    });
  });

  it(`return a string that defaults to 'shine' for the first name if no first name is provided`, () => {
    generateReferralCode({ last_name: 'smith' }, mockDb, randomizeList).then(
      result => {
        expect(result).to.equal('brilliant-shine-4');
        done();
      }
    );
  });
});

describe('#getReferrerPlatformId', () => {
  let referrer;
  beforeEach(() => {
    referrer = {
      sms_user_id: 63,
      fb_user_id: 985411724905343,
      glow_user_id: 2,
      kik_user_id: 45,
      v1_code: 'dbXYXkPa',
      v2_code: 'bedazzled-cat-209',
      referred_by: 'super-jon-10'
    };
  });
  it(`should return an object with the default platform and user's id for that platform`, () => {
    const defaultPlatform = 'fb';
    const result = getReferrerPlatformId(referrer, defaultPlatform);
    expect(result).to.deep.equal({
      platform: 'fb',
      platformId: 985411724905343
    });
  });
  it(`should return an object with the first platform found if defaultPlatform arg is not provided`, () => {
    const result = getReferrerPlatformId(referrer);
    expect(result).to.deep.equal({ platform: 'sms', platformId: 63 });
  });
});
