import React, {useState, useLayoutEffect} from "react"
import { fiberRoot } from '../../global'
export default function SameKey(params) {
  const difficult = true
  // 相同type第n次相同的key会把n-1次的key引用占据，导致第n-1次的z真实dom遗留在页面无法清除
  const [arr, sArr] = difficult ? useState([{id: 1, name: '1'},{id: 1, name: '2'}, {id: 1, name: 'x'}]) : useState([1,1,1])
  useLayoutEffect(() => {
    console.log('effffff', arr, fiberRoot.cur);
  }, [arr])
  function add() {
    difficult ?  sArr([ ...arr, {id: 1, name: Math.random()}, {id: 2, name:  Math.random()}]) : sArr([...arr,1,2])
  }
  function del() {
    difficult ? sArr([{id: 2, name: 'sb2'},{id: 2, name: 'sb4'}]) : sArr([2, 2])
  }

  return <div>
    {
      arr.map((e, i) => <div key={difficult ? e.id : e}>
        {difficult ? e.name : i}
      </div>)
    }
    <button onClick={add}>+</button>
    <button onClick={del}>-</button>
  </div>
}

// export default function X() {
//   return <div>
//     <div>1</div>
//     <div>2</div>
//   </div>
// }