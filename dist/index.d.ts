export declare let mid: number;
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
export declare function postMessage(target: Window, type: string, message?: any, targetOrigin?: string, transfer?: Transferable[]): Promise<any>;
/**
 * 添加消息监听
 * @param {string|Array} msgTypes 要监听的消息类型，*表示任何消息
 * @param {function} listener 监听方法
 * @param {number} id 消息id，如果传递了id，那么必须id一致才会认为是正确的消息回复
 *
 * @return {function} 返回移除监听的方法
 *
 * @example
 * addListener('MSG_TYPE', (message, event) => {});
 */
declare type RemoveListener = () => void;
declare type ListenerTypes = string | '*' | string[];
declare type LisenterCall = (message: any, event: MessageEvent) => any;
export declare function addListener(msgTypes: ListenerTypes, listener: LisenterCall, id?: number): RemoveListener;
/**
 * 添加单次消息监听（收到一次消息后即移除）
 * @param {string|Array} msgTypes 要监听的消息类型，*表示任何消息
 * @param {function} listener 监听方法
 * @param {number} id 消息id，如果传递了id，那么必须id一致才会认为是正确的消息回复
 *
 * @return {function} 返回移除监听的方法
 *
 * @example
 * addListener('MSG_TYPE', (message, event) => {});
 */
export declare function addListenerOnce(msgTypes: ListenerTypes, listener: LisenterCall, id?: number): RemoveListener;
export {};
