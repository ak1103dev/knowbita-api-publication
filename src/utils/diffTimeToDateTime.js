const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Bangkok');

module.exports = (diffTime) => {
  const arr = diffTime.split(' ');
  return moment().subtract(parseInt(arr[0]), arr[1]).format();
};
