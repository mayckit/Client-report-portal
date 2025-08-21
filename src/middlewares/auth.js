function isAdmin(req, res, next) {
    if (req.session.usuarioId && req.session.admin) {
      return next();
    }
    res.redirect('/login');
  }
  
  function isLoggedIn(req, res, next) {
    if (req.session.usuarioId) {
      return next();
    }
    res.redirect('/login');
  }
  
  module.exports = {
    isAdmin,
    isLoggedIn
  };