'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

exports.PMER_MESSAGE_ID = 0; // 消息id

var PMER_IDENT = 'PMER_MESSAGE_IDENT';
// Detect if postMessage can send objects(<ie10)
// Also see Modernizr: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/postmessage.js#L23-L25
var onlyStringMessage = false;

try {
  window.postMessage({
    toString: function toString() {
      onlyStringMessage = true;
    }
  }, '*');
} catch (e) {}

function getReplyType(type) {
  return "PMER_REPLY::".concat(type);
}

function isReplyType(type) {
  return /^PMER_REPLY::/.test(type);
}

function isWindow(mayWindow) {
  return mayWindow.window === mayWindow;
}

function sender(target, data, origin, transfer) {
  if (onlyStringMessage) {
    data = JSON.stringify(data);
  }

  if (isWindow(target)) {
    target.postMessage(data, origin || '*', transfer);
  } else {
    target.postMessage(data, transfer);
  }
}

function processEvent(event) {
  var eventData = event.data;

  if (onlyStringMessage) {
    try {
      eventData = JSON.parse(event.data);
    } catch (e) {}
  }

  event.parsedData = eventData;
  return event;
}
/**
 * 发送消息
 * @param {Window} target 目标窗口, window.opener/window.parent/HTMLIFrameElement.contentWindow...
 * @param {string} type 消息类型
 * @param {any} message 消息体
 * @param {string} 可选，targetOrigin
 * @param {Transferable[]} 可选，transfer
 *
 * @return {Promise<any>} 返回promise，如果有收到回复消息，将会触发promose回调，否则60s后超时拒绝
 *
 * @example
 * postMessage(winodw.opener, 'MSG_TYPE', 'anything')
 *      .then(data => console.log('receive data:', data));
 */


function postMessage(target, type, message, targetOrigin, transfer) {
  return new Promise(function (resolve, reject) {
    // 我们发出消息，同时附带一个id标记
    var id = exports.PMER_MESSAGE_ID++;
    var waitReplyTimer;

    if (Array.isArray(targetOrigin)) {
      // @ts-ignore
      var _ref = [targetOrigin];
      transfer = _ref[0];
      targetOrigin = _ref[1];
    }

    sender(target, {
      __ident__: PMER_IDENT,
      id: id,
      type: type,
      message: message
    }, targetOrigin, transfer);
    addListenerOnce(getReplyType(type), function (data, event) {
      clearTimeout(waitReplyTimer);

      if (event.parsedData.error) {
        reject(new Error(data));
      } else {
        resolve(data);
      }
    }, function (event) {
      return event.parsedData.id === id;
    });
  });
}
/**
 * 添加消息监听
 * @param {string|Array} msgTypes 要监听的消息类型，*表示任何消息
 * @param {function} listener 监听方法
 * @param {Function} filter 消息过滤，可以通过该方法过滤不符合要求的消息
 *
 * @return {function} 返回移除监听的方法
 *
 * @example
 * addListener('MSG_TYPE', (message, event) => {});
 */

function addListener(msgTypes, listener, filter) {
  function receiveMessage(originEvent) {
    var event = processEvent(originEvent);
    var eventData = event.parsedData;

    if (typeof eventData === 'object') {
      var replyId = eventData.id,
          _type = eventData.type,
          _message = eventData.message,
          __ident__ = eventData.__ident__;

      if (!Array.isArray(msgTypes)) {
        msgTypes = [msgTypes];
      } // 确保消息的type、id值是我们说希望监听的


      if (__ident__ === PMER_IDENT && msgTypes.some(function (item) {
        return item === '*' || item === _type;
      }) && (!filter || filter(event))) {
        var returnData = listener(_message, event);

        var replyMessage = function replyMessage(message) {
          var error = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
          sender(event.source, {
            __ident__: PMER_IDENT,
            id: replyId,
            type: getReplyType(_type),
            message: message,
            error: error
          }, event.origin);
        }; // 如果监听方法返回了数据，那么我们将数据当作相应结果再postMessage回去
        // 如果是回复类型，那么就不再继续对其进行回复，避免死锁


        if (event.source && !isReplyType(_type)) {
          if (typeof returnData === 'object' && typeof returnData.then === 'function') {
            returnData.then(replyMessage, function (reason) {
              return replyMessage(reason instanceof Error ? reason.message : reason, true);
            });
          } else {
            replyMessage(returnData);
          }
        }
      }
    }
  }

  function removeListener() {
    window.removeEventListener('message', receiveMessage, false);
  }

  window.addEventListener('message', receiveMessage, false);
  return removeListener;
}
/**
 * 添加单次消息监听（收到一次消息后即移除）
 * @param {string|Array} msgTypes 要监听的消息类型，*表示任何消息
 * @param {function} listener 监听方法
 * @param {Function} filter 消息过滤，可以通过该方法过滤不符合要求的消息
 *
 * @return {function} 返回移除监听的方法
 *
 * @example
 * addListener('MSG_TYPE', (message, event) => {});
 */

function addListenerOnce(msgTypes, listener, filter) {
  var removeListener = addListener(msgTypes, function () {
    removeListener();
    return listener.apply(void 0, arguments);
  }, filter);
  return removeListener;
}

exports.PMER_IDENT = PMER_IDENT;
exports.addListener = addListener;
exports.addListenerOnce = addListenerOnce;
exports.postMessage = postMessage;
