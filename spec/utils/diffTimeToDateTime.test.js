const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Bangkok');

const { expect } = require('chai');
const diffTimeToDateTime = require('../../src/utils/diffTimeToDateTime');

describe('diff time to date time', () => {
  it('should show date time for 1 week ago', () => {
    const expectedValue = moment().subtract(1, 'week').format();
    const input = '1 week ago';
    expect(diffTimeToDateTime(input)).to.equal(expectedValue);
  });
  it('should show date time for 1 month ago', () => {
    const expectedValue = moment().subtract(1, 'month').format();
    const input = '1 month ago';
    expect(diffTimeToDateTime(input)).to.equal(expectedValue);
  });
  it('should show date time for 2 months ago', () => {
    const expectedValue = moment().subtract(2, 'months').format();
    const input = '2 months ago';
    expect(diffTimeToDateTime(input)).to.equal(expectedValue);
  });
  it('should show date time for 1 year ago', () => {
    const expectedValue = moment().subtract(1, 'year').format();
    const input = '1 year ago';
    expect(diffTimeToDateTime(input)).to.equal(expectedValue);
  });
  it('should show date time for 3 years ago', () => {
    const expectedValue = moment().subtract(3, 'years').format();
    const input = '3 years ago';
    expect(diffTimeToDateTime(input)).to.equal(expectedValue);
  });
});
