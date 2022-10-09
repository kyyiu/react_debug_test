import React, { useLayoutEffect, useState } from "react"


function F(p) {
  useLayoutEffect(() => {
    console.log('rrr1');
    return () => {
      console.log('rrr2');
    }
  }, [])
  return 1
}

function App2() {
  const [a, sa] = useState(false)

  setTimeout(() => {
    sa(!a)
    debugger
  }, 3000)
  return <div>
    app2 
    {
      a || <F a={a}></F>
    }
  </div>
}

export default App2