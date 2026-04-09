function createLogger(scope) {
  function prefix(message) {
    return `[${scope}] ${message}`;
  }

  return {
    info(message) {
      console.log(prefix(message));
    },
    error(message) {
      console.error(prefix(message));
    },
    json(value) {
      console.log(JSON.stringify(value, null, 2));
    }
  };
}

module.exports = {
  createLogger
};
