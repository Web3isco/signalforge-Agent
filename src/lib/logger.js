function formatTimestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function createLogger(scope, sink) {
  function emit(level, message, data) {
    const entry = {
      time: formatTimestamp(),
      scope,
      level,
      message,
      data: data || null
    };

    if (typeof sink === "function") {
      sink(entry);
    }

    const prefix = `[${scope}] ${message}`;
    if (level === "error") {
      console.error(prefix);
      if (data) console.error(data);
      return;
    }

    if (level === "warn") {
      console.warn(prefix);
      if (data) console.warn(data);
      return;
    }

    console.log(prefix);
    if (data) console.log(data);
  }

  return {
    info: (message, data) => emit("info", message, data),
    warn: (message, data) => emit("warn", message, data),
    error: (message, data) => emit("error", message, data),
    json: (data) => emit("info", "data", data)
  };
}

module.exports = { createLogger };
