const sinon = require('sinon');
const expect = require('chai').expect;
const {
  generateReferralCode,
  formatName,
} = require('../src/helper');

let mockDb;

describe('#formatName', () => {

  it('should replace any names that contain ???? with `shine`', () => {
    expect(formatName('??????#Sally?. .')).to.equal('shine');
    expect(formatName('?')).to.equal('shine');
  });

  it('should default to `shine` if no first name is provided', () => {
    expect(formatName()).to.equal('shine');
    expect(formatName('')).to.equal('shine');
    expect(formatName('   ')).to.equal('shine');
  })

  it('should trim leading & trailing white space ', () => {
    expect(formatName('  dj ')).to.equal('dj');
  });

  it('should only use 1st part of the name if there are multiple parts in a first name separated by whitespace', () => {
    expect(formatName('  Ann Marie Josephine')).to.equal('ann');
    expect(formatName('  Angel Grace Ariel Caroline McWaters')).to.equal('angel');
    expect(formatName(`d 'mjust  `)).to.equal('d');
    expect(formatName(`  An'gel Grace'`)).to.equal('angel');
  });

  it('should strip away any numbers and special chars including punctuation marks', () => {
    expect(formatName('d.j.')).to.equal('dj');
    expect(formatName('d.j.   khaLid.')).to.equal('dj');
    expect(formatName(`d'Angelo`)).to.equal('dangelo');
    expect(formatName('kha$%#Lid.')).to.equal('khalid');
    expect(formatName('O`neil!#grace$%&*%^@&*)-=953')).to.equal('oneilgrace');
  });

  it('should default to `shine` if the name is an empty string after parsing', () => {
    expect(formatName('   ')).to.equal('shine');
    expect(formatName('#%^((**))   ')).to.equal('shine');
    expect(formatName('....')).to.equal('shine');
    expect(formatName('/')).to.equal('shine');
    expect(formatName(`' `)).to.equal('shine');
    expect(formatName(':)')).to.equal('shine');
  })
});


describe('#generateReferralCode', () => {
  let mockDb, userData, randomizeList;

  beforeEach(() => {
    randomizeList = ['brilliant', 'kind'];
    mockDb = {
      queryAsync: sinon.stub().resolves([{
        count: 3
      }]),
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

  it(`should return a string in adjective-name formatted in lower case`, done => {
    generateReferralCode({
      first_name: 'Lucy'
    }, mockDb, randomizeList).then(
      result => {
        expect(result).to.be.oneOf(['brilliant-lucy-4', 'kind-lucy-4']);
        done();
      }
    );
  });
  it(`return a string that defaults to 'shine' for the first name if no first name is provided`, done => {
    generateReferralCode({
      last_name: 'smith'
    }, mockDb, randomizeList).then(
      result => {
        expect(result).to.be.oneOf(['brilliant-shine-4', 'kind-shine-4']);
        done();
      }
    );
  });
  it(`should return a string with a count that is the db count of the shared base code incremented by 1`, done => {
    mockDb = {
      queryAsync: sinon.stub().resolves([{
        count: 3
      }]),
    };
    generateReferralCode({
      first_name: 'sandy'
    }, mockDb, randomizeList).then(
      result => {
        expect(result[result.length - 1]).to.equal(`4`);
      }
    );

    mockDb = {
      queryAsync: sinon.stub().resolves([{
        count: 0
      }]),
    };
    generateReferralCode({
      first_name: 'sandy'
    }, mockDb, randomizeList).then(
      result => {
        expect(result[result.length - 1]).to.equal(`1`);
        done();
      }
    );
  });
});