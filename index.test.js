const AWS = require('aws-sdk');
const sinon = require('sinon');
const expect = require('chai').expect;
const {
  createUser,
  getReferrerInfo,
  publishReferralEvent
} = require('./index');

describe('Nova', () => {
  let mockDb;

  describe('#createUser', () => {
    beforeEach(() => {
      mockDb = {
        queryAsync: sinon.stub()
      };
      mockDb.queryAsync.resolves([]);
    });
    it('should create a user record with an assigned referral code', done => {
      const mockUser = {
        first_name: 'leo',
        fb_user_id: 985411724905343,
        referred_by: 'classy-chris-10'
      };

      createUser(mockUser, mockDb).then(result => {
        expect(result).to.include.all.keys(
          'sms_user_id',
          'fb_user_id',
          'glow_user_id',
          'kik_user_id',
          'v1_code',
          'v2_code',
          'referred_by'
        );
        expect(result.v2_code).to.match(/.leo./);
        done();
      });
    });

    it(`should throw if platform id or referrer's referral code is missing`, done => {
      createUser({ sms_user_id: '2' })
        .then(result => {
          expect(result).to.throw();
        })
        .catch(err => {});

      createUser({ referred_by: 'sassy-sandy-3' })
        .then(result => {
          expect(result).to.throw();
        })
        .catch(err => {
          done();
        });
    });
  });

  describe('#getReferrerInfo', () => {
    beforeEach(() => {
      mockDb = {
        queryAsync: sinon.stub()
      };
      mockDb.queryAsync
        .onCall(0)
        .resolves([
          {
            sms_user_id: 63,
            fb_user_id: 985411724905343,
            glow_user_id: 2,
            kik_user_id: 45,
            v1_code: 'dbXYXkPa',
            v2_code: 'bedazzled-cat-209',
            referred_by: 'super-jon-10'
          }
        ])
        .onCall(1)
        .resolves(5);
    });

    it(`should return an object with properties for a user's referral count and platforms they're on`, done => {
      getReferrerInfo(
        { referralCode: 'bedazzled-cat-209', defaultPlatform: 'fb' },
        mockDb
      ).then(result => {
        expect(result).to.deep.equal({
          referralCount: 5,
          platform: 'fb',
          platformId: 985411724905343
        });
        done();
      });
    });
  });

  describe('#publishReferralEvent', () => {
    let mockSNSPublishSpy;
    beforeEach(() => {
      mockSNSPublishSpy = sinon.stub(AWS.SNS.prototype, 'makeRequest').returns({
        publish: sinon.spy()
      });
    });

    it('should call publish the SNS topic', () => {
      publishReferralEvent('test-topic', {
        newUser: {
          test_data: 'test'
        },
        referrer: {
          test_data: 'test'
        }
      });
      expect(mockSNSPublishSpy.calledOnce);
    });
  });
});
