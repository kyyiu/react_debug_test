import { useEffect, useRef, useCallback } from "react";
/**
 * 频繁触发某段时间只执行最后一次触发
 */
export default (cb, timeout) => {
  const info = useRef({
    timer: -1,
    cb
  })
  useEffect(() => {
    info.current.cb = cb
  }, [cb])

  useEffect(() => {
    return () => {
      clearTimeout(info.current.timer)
    }
  }, [])

  return useCallback((...args) => {
    clearTimeout(info.current.timer)
    info.current.timer = setTimeout(() => {
      info.current.cb(...args)
    }, timeout);
  }, [timeout])
}