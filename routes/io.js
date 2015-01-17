function add_io_routes(app) {

  app.io.route('ready', function(req) {
    req.io.emit("do-task", {
      message: 'sup nublets'
    });
  }); 
}

module.exports = add_io_routes
