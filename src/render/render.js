import React, {useEffect, useState, useRef, useLayoutEffect} from "react";
import { fiberRoot } from '../global';
let start, end

function useUpdate(
  callback = () => {},
  dependences,
  initialData = false
) {
  const [s, sS] = useState(1)
  const isInitialMount = useRef(true)
  useEffect(() => {
    // 第一次,也就是mount阶段 不执行onChange,只有后续更新的时候才调用
    // 因为在页面中,一般mount阶段会写请求数据之类的操作
    if (isInitialMount.current && !initialData) {
      isInitialMount.current = false
    } else {
      if (s=== 1) {
        sS(2)
      }
      callback()
    }
  }, dependences)
}




function TC(p) {
  return (
    <div className="tc">
      <span>{p.children}</span>
    </div>
  )
}

function TC1() {
  return (
    <div>
      tc1
    </div>
  )
}

function HostBefore(prop) {
  useEffect(() => {
    console.log('uffff1');
    return () => {
      console.log('uffff2');
    }
  }, [])
  return <div>
    {
      prop.children
    }
  </div>
}


// 相同key
let c = 0
function AET() {
  const difficult = true
  // 相同type第n次相同的key会把n-1次的key引用占据，导致第n-1次的z真实dom遗留在页面无法清除
  const [arr, sArr] = difficult ? useState([{id: 1, name: '1'},{id: 1, name: '2'}, {id: 1, name: 'x'}]) : useState([1,1,1])
  // useLayoutEffect(() => {
  //   console.log('effffff', arr, fiberRoot.cur);
  // }, [arr])
  function add() {
    difficult ?  sArr([ ...arr, {id: 1, name: 'z'}, {id: 2, name: 's'}]) : sArr([...arr,1,2])
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

function A() {
  function a(e, a) {
    a.stopPropagation()
    console.log('cccc', e, a);
  }
  return <div onClick={(e) => a('xxx',e)}>dddd</div>
}

const useData = (ini) => {
  let fi = true
  const [data, setData] = useState(ini)
  const rf = useRef()
  console.log('useDataf',rf);
  useEffect(()=> {
    if (rf.current) {
      console.log('useData', data, rf);
    }
    
    rf.current = true
    return () => {
      console.log('useDtaum');
    }
  }, [data])
  return [data, setData]
}

function U() {
  const [d, sd] = useData(1)
  return <div onClick={() => sd(d+1)}>当前d值: {d}</div>
}

class RenderTest extends React.Component {

  state = {
    v: 123,
    arr: []
  }

  foo = () => {
    console.log('HostBefore_start', start = +new Date());
    // this.setState({
    //   arr: [...this.state.arr, ...Array(1).fill(0)]
    // })
  }
  
  // React.createElement("div", {
  //   onClick: (void 0).foo
  // }, 
  // [/*#__PURE__*/React.createElement(TC1, null)], 
  // /*#__PURE__*/React.createElement("div", null, "aaa"), 
  // arr, 
  // [1].map(e => e + 3)
  // /*#__PURE__*/React.createElement(TC1, null));

  componentDidUpdate() {
    console.log('HostBefore_end', +new Date() - start);
  }

  render() {
    const {
      arr
    } = this.state

    return (
      <div onClick={this.foo}>
        {
          arr.length ?
          <HostBefore>
          {
            arr.map((e, i) => {
              return <TC key={i} count={arr.length}>{`im TC${i}`}</TC>
            })
          }
          </HostBefore> : null
        }
        <U></U>
      </div>
    )
    

    return (
      <div className="f1" onClick={this.foo}>
        ttt
        <div className="f2">
          <span className="son1">哈哈哈</span>
        </div>
        <div className="f3">
          <span>stable1</span>
          {
            arr.map(e => {
              return <span key={e} data={Math.random()} className="son2">
                {e}
              </span>
            })
          }
          <TC></TC>
          <span>stable2</span>
          <span>stable3</span>
        </div>
        <div className="f4">
          <span >
            before
          </span>
        </div>
        {/* <div className="f3"></div>
        <span className="f4">略略略</span> */}
      </div>
    )
  }
}

export default RenderTest