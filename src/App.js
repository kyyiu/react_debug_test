import React, { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import ReactDOM from 'react-dom';
import State from './components/State'
import LanesDemo from './components/LanesDemo'
import AppSibling from './components/AppSibling'
import TasksWithDifferentPriorities from './components/TasksWithDifferentPriorities'
import SchedulerTask from './components/SchedulerTask'
import Concurrent from './components/ConcurrentInput'
import Diff from './components/Diff'
import PropsDiff from './components/PropsDiff'
import Hooks from "./components/Hooks";
import EventDemo from "./components/EventDemo";
import ContextDemo from "./components/Context";
import './App.css';
import { fiberRoot } from './global';


// import BW from './beginwork'
import R from './render/render'
import { useDidMount } from './hooks/useDidMount';

// propsDiff
/*class App extends React.Component {
  render() {
    return <PropsDiff/>
  }
}*/

function I(p) {
  const {data} = p
  console.log('render--I');
  return <div>{data}</div>
}

function App2() {
  useDidMount()
  const [r, setR] = useState(false)
  useEffect(() => {
    console.log('hh');
  }, [])
  // 事件系统
  // return <EventDemo/>

  // return <Hooks/>
  // fiber树
  // return (
  //   <div className="App">
  //     <span className={'app-span'} onClick={() => setCount(count + 1)}>App{count}</span>
  //     <AppSibling count={count}/>
  //   </div>
  // );

  // Scheduler调度任务与用户交互
  // return <SchedulerTask/>

  // 高优先级插队
  // return <TasksWithDifferentPriorities/>

  // context
  // return <ContextDemo/>

  // diff 算法
  // return <Diff ref={'diffRef'}/>
  const change = () => {
    console.log('ffff', fiberRoot.cur);
    setR(!r)
    // fiberRoot.cur.unmount()
    // console.log(fiberRoot.cur);
    // fiberRoot.cur.render('hello')
  }

  const x = Math.random()


  // beginWork
  // return <BW></BW>
  return <>
    <R></R>
    <div>
      <span onClick={change}>lll</span>
    </div>
    <div>
      {
        useMemo(() => {
          console.log('render--', x);
          return <I data={x}></I>
        }, [x])
      }
    </div>
  </>
}

let mountNode = null;

function Dialog() {
  function d() {
    if (mountNode) {
      ReactDOM.unmountComponentAtNode(mountNode)
      console.log('aaa', fiberRoot);
    }
  }
  return <div onClick={d}>456</div>
}

const rf = React.createRef()
const rf2 = React.createRef()

function App() {
  const [s, ss] = useState(1)
  function r() {
    if (!mountNode) {
      mountNode = document.createElement('div');
      document.body.appendChild(mountNode);
    }
    ss(s+1)
    ReactDOM.render(<Dialog/>, mountNode)
  }
  useEffect(() => {
    console.log('ffffffffffffff', rf, rf2);
  }, [])
  return <div>123{s}
    <span ref={rf}>hhh</span>
    <I data={'llll'} ref={rf2}></I>
  </div>
}

export default App;
