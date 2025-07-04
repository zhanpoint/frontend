import { useEffect, useRef } from 'react';

/**
 * 点击外部区域 Hook
 * 检测用户是否点击了指定元素外部区域
 * @param {Function} handler - 点击外部区域时的回调函数
 * @param {Array} events - 需要监听的事件类型数组
 * @returns {React.RefObject} 需要绑定到元素的 ref
 */
export function useClickOutside(handler, events = ['mousedown', 'touchstart']) {
    const ref = useRef(null);

    useEffect(() => {
        const listener = (event) => {
            // 如果 ref 为空或者点击的是内部元素，则不执行回调
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };

        // 为每个事件类型添加监听器
        events.forEach((event) => {
            document.addEventListener(event, listener, true);
        });

        return () => {
            // 清理监听器
            events.forEach((event) => {
                document.removeEventListener(event, listener, true);
            });
        };
    }, [handler, events]);

    return ref;
}

export default useClickOutside; 