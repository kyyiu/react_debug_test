import { useCallback, useRef, useEffect } from "react";

/** 
 * 节流钩子 
 *  timeout时间内只执行一次callback
 *  频繁触发在某段时间内只触发第一次
 * */
export default (callback, timeout) => {
  const info = useRef({
    isWaiting: false,
    timer: -1
  })

  useEffect(() => {
    return () => {
      clearTimeout(info.current.timer)
    }
  }, [])
  return useCallback((...args) => {
    console.log('zzz2', info.current.timer, info.current.isWaiting);
    if (!info.current.isWaiting) {
      callback(...args)
      info.current.isWaiting = true
      clearTimeout(info.current.timer)
      info.current.timer = setTimeout(() => {
        info.current.isWaiting = false
      }, (timeout));
    }
  }, [callback, timeout])
}