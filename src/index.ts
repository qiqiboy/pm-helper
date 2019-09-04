export let PMER_MESSAGE_ID = 0; // 消息id

export const PMER_IDENT = 'PMER_MESSAGE_IDENT';

interface PMERMessageEvent<T = any> extends MessageEvent {
    // <IE10 browsers only support string data. You can visite 'parsedData' to get the transformed objects
    parsedData: {
        id: number;
        type: string;
        __ident__: string;
        message: T;
        error?: boolean;
    };
}

export { PMERMessageEvent as MessageEvent };

// Detect if postMessage can send objects(<ie10)
// Also see Modernizr: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/postmessage.js#L23-L25
let onlyStringMessage = false;

try {
    window.postMessage(
        {
            toString: function() {
                onlyStringMessage = true;
            }
        },
        '*'
    );
} catch (e) {}

function getReplyType(type) {
    return `PMER_REPLY::${type}`;
}

function isReplyType(type) {
    return /^PMER_REPLY::/.test(type);
}

function isWindow(mayWindow): mayWindow is Window {
    return mayWindow.window === mayWindow;
}

function sender(target: MessageEventSource, data, origin, transfer?) {
    if (onlyStringMessage) {
        data = JSON.stringify(data);
    }

    if (isWindow(target)) {
        target.postMessage(data, origin || '*', transfer);
    } else {
        target.postMessage(data, transfer);
    }
}

function processEvent(event: MessageEvent): PMERMessageEvent {
    let eventData = event.data;

    if (onlyStringMessage) {
        try {
            eventData = JSON.parse(event.data);
        } catch (e) {}
    }

    (event as PMERMessageEvent).parsedData = eventData;

    return event as PMERMessageEvent;
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
export function postMessage(
    target: MessageEventSource,
    type: string,
    message?: any,
    transfer?: Transferable[]
): Promise<any>;
export function postMessage(
    target: MessageEventSource,
    type: string,
    message?: any,
    targetOrigin?: string,
    transfer?: Transferable[]
): Promise<any>;
export function postMessage(
    target: MessageEventSource,
    type: string,
    message?: any,
    targetOrigin?: string | Transferable[],
    transfer?: Transferable[]
): Promise<any> {
    return new Promise((resolve, reject) => {
        // 我们发出消息，同时附带一个id标记
        const id = PMER_MESSAGE_ID++;
        let waitReplyTimer: any;

        if (Array.isArray(targetOrigin)) {
            // @ts-ignore
            [transfer, targetOrigin] = [targetOrigin];
        }

        sender(
            target,
            {
                __ident__: PMER_IDENT,
                id,
                type,
                message
            },
            targetOrigin,
            transfer
        );

        addListenerOnce(
            getReplyType(type),
            function(data, event) {
                clearTimeout(waitReplyTimer);

                if (event.parsedData.error) {
                    reject(new Error(data));
                } else {
                    resolve(data);
                }
            },
            event => event.parsedData.id === id
        );
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
type RemoveListener = () => void;
type ListenerTypes = string | '*' | string[];
type LisenterCall<T> = (message: T, event: PMERMessageEvent<T>) => any;
type FilterCall<T> = (event: PMERMessageEvent<T>) => boolean;

export function addListener<T = any>(msgTypes: ListenerTypes, listener: LisenterCall<T>, filter?: FilterCall<T>): RemoveListener {
    function receiveMessage(originEvent: MessageEvent) {
        const event = processEvent(originEvent);
        const eventData = event.parsedData;

        if (typeof eventData === 'object') {
            const { id: replyId, type, message, __ident__ } = eventData;

            if (!Array.isArray(msgTypes)) {
                msgTypes = [msgTypes];
            }

            // 确保消息的type、id值是我们说希望监听的
            if (
                __ident__ === PMER_IDENT &&
                msgTypes.some(item => item === '*' || item === type) &&
                (!filter || filter(event))
            ) {
                const returnData = listener(message, event);
                const replyMessage = (message, error = false) => {
                    sender(
                        event.source!,
                        {
                            __ident__: PMER_IDENT,
                            id: replyId,
                            type: getReplyType(type),
                            message,
                            error
                        },
                        event.origin
                    );
                };

                // 如果监听方法返回了数据，那么我们将数据当作相应结果再postMessage回去
                // 如果是回复类型，那么就不再继续对其进行回复，避免死锁
                if (event.source && !isReplyType(type)) {
                    if (typeof returnData === 'object' && typeof returnData.then === 'function') {
                        returnData.then(replyMessage, reason =>
                            replyMessage(reason instanceof Error ? reason.message : reason, true)
                        );
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
export function addListenerOnce<T = any>(msgTypes: ListenerTypes, listener: LisenterCall<T>, filter?: FilterCall<T>) {
    const removeListener = addListener(
        msgTypes,
        function(...args) {
            removeListener();

            return listener(...args);
        },
        filter
    );

    return removeListener;
}
