window.JsBridge = {
  _callbacks: {},
  _callbackSeq: 0,

  // Web 调 Flutter
  callHandler: function (event, data) {
    return new Promise((resolve, reject) => {
      const callbackId = "web_cb_" + this._callbackSeq++;
      this._callbacks[callbackId] = { resolve, reject };
      const id = new Date().getTime();
      const message = {
        id,
        event,
        returnEvent: callbackId,
        data,
      };
      if (window.flutter_invoke) {
        window.flutter_invoke.postMessage(JSON.stringify(message));
      } else {
        reject("Flutter 端未注册 flutter_invoke");
      }
    });
  },

  // Flutter 回调 Web 的调用
  _handleCallback: function (message) {
    const cb = this._callbacks[message.event];
    if (cb) {
      if (message.error) {
        cb.reject(message.error);
      } else {
        cb.resolve(message.result);
      }
      delete this._callbacks[message.callbackId];
    }
  },

  handlers: {},

  // 注册供 Flutter 调用的方法
  registerHandler: function (method, handler) {
    this.handlers[method] = handler;
  },

  // Flutter 调 Web
  _handleFlutterMessage: function (message) {
    const { method, params, callbackId } = message;
    if (this.handlers && this.handlers[method]) {
      Promise.resolve(this.handlers[method](params))
        .then((result) => {
          if (callbackId) {
            window.JsBridge._handleCallback({
              callbackId,
              result,
              error: null,
            });
          }
        })
        .catch((err) => {
          if (callbackId) {
            window.JsBridge._handleCallback({
              callbackId,
              result: null,
              error: err.message,
            });
          }
        });
    }
  },
};

window.halal = {
  getAuthCode: function (params) {
    return new Promise((resolve, reject) => {
      window.JsBridge.callHandler("getAuthCode", params)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
