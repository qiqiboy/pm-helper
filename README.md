# pmer

提供一些便捷的使用 [`postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) 的一些辅助方法

<!-- vim-markdown-toc GFM -->

* [安装](#安装)
* [背景](#背景)
* [使用](#使用)
    - [`postMessage`](#postmessage)
    - [`addListener`](#addlistener)
    - [`addListenerOnce`](#addlisteneronce)

<!-- vim-markdown-toc -->

## 安装

```bash
$ npm install pmer --save
```

## 背景

`postMessage`的使用本身已经非常简单了，但是实际应用中，由于`postMessage`和`addEventListener('message')`的强解耦，导致消息的`收` `发`变得非常离散。

通过本项目提供的一些方法，可以更加简单的控制消息的监听与发送。

你可以发送消息，并监听是否收到回复；也可以主动监听指定的`type`消息，并且回复该消息。

## 使用

`pmer`目前提供了以下几个方法供使用：

### `postMessage`

向目标发送消息，返回一个promise对象。当目标窗口回复了消息后，可以通过该promise对象获得回复的消息信息

```typescript
/**
 * 发送消息
 * @param {Window} target 目标窗口, window.opener/window.parent/HTMLIFrameElement.contentWindow...
 * @param {string} type 消息类型
 * @param {any} message 消息体
 * @param {string} 可选，targetOrigin
 * @param {Transferable[]} 可选，transfer
 *
 * @return {Promise<any>} 返回promise，如果有收到回复消息，将会触发promose回调，否则60s后超时拒绝
 */
export declare function postMessage(
    target: Window,
    type: string,
    message: any,
    targetOrigin?: string,
    transfer?: Transferable[]
): Promise<any>;

// 给父级窗口发送 DELETE_USER 消息
postMessage(window.parent, 'DELETE_USER', 123);

// 如果父级窗口有回复该消息，则可以通过promise监听结果
//（注：如果父级窗口没有实现消息回复，那么60s后将会触发消息超时失败）
postMessage(window.parent, 'DELETE_USER', 123).then(() => console.log('delete succeed!'));
```

### `addListener`

监听当前窗口接受到的消息(只支持通过[`postMessage`](#postmessage)发送的消息)，并且可以回复该消息

```typescript
/**
 * 添加消息监听
 * @param {string|Array} msgTypes 要监听的消息类型，*表示任何消息
 * @param {function} listener 监听方法
 * @param {number} id 消息id，如果传递了id，那么必须id一致才会认为是正确的消息回复
 *
 * @return {function} 返回移除监听的方法
 */
export declare function addListener(msgTypes: ListenerTypes, listener: LisenterCall, id?: number): ListenerCancel;

// 监听 DELETE_USER 消息
addListener('DELETE_USER', message => {
    console.log('message:', message);
});

// 通过return一个值，可以回复该消息
addListener('DELETE_USER', message => {
    return 'delete succeed!';
});

// 你也可以返回一个promise对象(这里使用async/await语法)：
// postMessage(window, 'DELETE_USER', 123)
//      .then(() => console.log('删除成功'), () => console.log('删除失败'))
addListener('DELETE_USER', async userId => {
    await fetch('/delete/user/' + userId);
});

// addListener调用后会返回一个清理函数，可以通过该函数随时移除当前的消息监听
const removeListener = addListener('DELETE_USER', () => {});
removeListener();
```

### `addListenerOnce`

用法完全同`addListener`，唯一区别是当调用过一次后，会自动移除监听

```typescript
/**
 * 添加消息监听
 * @param {string|Array} msgTypes 要监听的消息类型，*表示任何消息
 * @param {function} listener 监听方法
 * @param {number} id 消息id，如果传递了id，那么必须id一致才会认为是正确的消息回复
 *
 * @return {function} 返回移除监听的方法
 */
export declare function addListenerOnce(msgTypes: ListenerTypes, listener: LisenterCall, id?: number): ListenerCancel;
```
