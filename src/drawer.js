import React, { useEffect, useRef, useState } from "react"

const useMountTransition = (isMounted, unmountDelay) => {
  const [hasTransitionedIn, setHasTransitionedIn] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (isMounted && !hasTransitionedIn) {
      setHasTransitionedIn(true);
    } else if (!isMounted && hasTransitionedIn) {
      timeoutId = setTimeout(() => setHasTransitionedIn(false), unmountDelay);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [unmountDelay, isMounted, hasTransitionedIn]);

  return hasTransitionedIn;
};


function Drawer({
  isOpen,
  children,
  className,
  onClose,
  position='left'
}) {
  const bodyRef = useRef(document.querySelector('body'))
  useEffect(() => {
    bodyRef.current.style.overflow = isOpen ? 'hidden' : ''
  }, [isOpen])

  return <div 
    aria-hidden={isOpen ? 'false' : 'true'}
    className={`drawer-container ${isOpen ? 'open' : ''} ${className ? className : ''}`}>
      <div 
        className={`drawer ${position}`}>
        {children}
      </div>
      <div className="backdrop" onClick={onClose}></div>
  </div>
}

export default function() {
  const [isOpen, setIsOpen] = useState(false)
  console.log('zzz', isOpen);
  return <div>
    <button onClick={() => setIsOpen(!isOpen)}>drawer</button>
    {
      1 ? <Ani></Ani> : <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <button type="button" onClick={() => setInsOpen(false)}>关闭</button>
      <p>xxxxx</p>
      <input type="text"></input>
    </Drawer>
    }
  </div>
}


const Ani = () => {
  const [isMounted, setIsMounted] = useState(false);
  const hasTransitionedIn = useMountTransition(isMounted, 1000);
  return     <div className="container">
    <button onClick={() => setIsMounted(!isMounted)}>
      {`${isMounted ? "Hide" : "Show"} Element`}
    </button>

    <div className="content">
      {(hasTransitionedIn || isMounted) && (
        <div
          className={`card ${hasTransitionedIn && "in"} ${
            isMounted && "visible"
          }`}
        >
          Card Content
        </div>
      )}
    </div>
  </div>
}