const sinon = require('sinon');
const expect = require('chai').expect;
const {
  generateReferralCode,
  getReferrerPlatformId,
} = require('../src/helper');

let mockDb;
describe('#generateReferralCode', () => {
  let mockDb, userData, randomizeList;

  beforeEach(() => {
    randomizeList = ['brilliant', 'kind'];
    mockDb = {
      queryAsync: sinon.stub().resolves([{ count: 3 }]),
    };
    userData = {
      first_name: 'lucy',
    };
  });

  it(`should return a string in adjective-name-count format when user's first name is provided`, done => {
    generateReferralCode(userData, mockDb, randomizeList).then(result => {
      expect(result).to.be.oneOf(['brilliant-lucy-4', 'kind-lucy-4']);
      done();
    });
  });

  it(`return a string that defaults to 'shine' for the first name if no first name is provided`, done => {
    generateReferralCode(
      { last_name: 'smith' },
      mockDb,
      randomizeList
    ).then(result => {
      expect(result).to.be.oneOf(['brilliant-shine-4', 'kind-shine-4']);
      done();
    });
  });
  it(`should return a string with a count that is the db count of the shared base code incremented by 1`, done => {
    mockDb = {
      queryAsync: sinon.stub().resolves([{ count: 3 }]),
    };
    generateReferralCode(
      { first_name: 'sandy' },
      mockDb,
      randomizeList
    ).then(result => {
      expect(result[result.length - 1]).to.equal(`4`);
    });

    mockDb = {
      queryAsync: sinon.stub().resolves([{ count: 0 }]),
    };
    generateReferralCode(
      { first_name: 'sandy' },
      mockDb,
      randomizeList
    ).then(result => {
      expect(result[result.length - 1]).to.equal(`1`);
      done();
    });
  });
});
