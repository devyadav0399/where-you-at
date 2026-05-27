let _io;

function init(io) {
  _io = io;
}

function emit(event, data) {
  if (_io) _io.emit(event, data);
}

module.exports = { init, emit };
