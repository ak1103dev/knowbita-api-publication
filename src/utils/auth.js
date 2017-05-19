module.exports = {
  instructor: (req, res, next) => {
    if (req.user !== undefined && req.user.is_instructor) {
      next();
    } else {
      res.status(401).send('Only instructor can access this');
    }
  }
};
