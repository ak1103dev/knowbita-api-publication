const { Instructor } = require('models');

module.exports = (data) => {
  const promises = data.map((item) => {
    return Instructor.findOne({ name: item.instructor })
    .then((ins) => {
      if (ins === null) {
        const instructor = new Instructor({
          name: item.instructor
        });
        instructor.save();
        item.instructor = instructor._id;
      } else {
        item.instructor = ins._id;
      }
    })
    .then(() => item);
  });
  return Promise.all(promises)
  .then((array) => array);
};
