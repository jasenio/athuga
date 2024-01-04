function isTeacher(req, res, next) {
  return next();
    if (isAuthenticated && req.session.teacher) {
      // User is authenticated, continue to the route handler
      return next();
    } else {
      // User is not authenticated, redirect or send an error response
      return res.status(401).json({ message: 'UnauthorizedTeacher' });
    }
  }
  function isAuthenticated(req, res, next) {
    return next();
    if (req.session && req.session.userId) {
      // User is authenticated, continue to the route handler
      return next();
    } else {
      // User is not authenticated, redirect or send an error response
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
  module.exports = {
    isAuthenticated,
    isTeacher,
  };