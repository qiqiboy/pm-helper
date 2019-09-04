export declare let PMER_MESSAGE_ID: number;
export declare const PMER_IDENT = "PMER_MESSAGE_IDENT";
interface PMERMessageEvent<T = any> extends MessageEvent {
    parsedData: {
        id: number;
        type: string;
        __ident__: string;
        message: T;
        error?: boolean;
    };
}
export { PMERMessageEvent as MessageEvent };
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
export declare function postMessage(target: MessageEventSource, type: string, message?: any, transfer?: Transferable[]): Promise<any>;
export declare function postMessage(target: MessageEventSource, type: string, message?: any, targetOrigin?: string, transfer?: Transferable[]): Promise<any>;
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
declare type RemoveListener = () => void;
declare type ListenerTypes = string | '*' | string[];
declare type LisenterCall = (message: any, event: PMERMessageEvent) => any;
declare type FilterCall = (event: PMERMessageEvent) => boolean;
export declare function addListener(msgTypes: ListenerTypes, listener: LisenterCall, filter?: FilterCall): RemoveListener;
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
export declare function addListenerOnce(msgTypes: ListenerTypes, listener: LisenterCall, filter?: FilterCall): RemoveListener;
