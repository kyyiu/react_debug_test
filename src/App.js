import React, { useEffect, useState } from 'react';
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

// propsDiff
/*class App extends React.Component {
  render() {
    return <PropsDiff/>
  }
}*/
function App() {
  const [r, setR] = useState(false)
  
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
    setR(!r)
    // fiberRoot.cur.unmount()
    // console.log(fiberRoot.cur);
    // fiberRoot.cur.render('hello')
  }


  // beginWork
  // return <BW></BW>
  return <>
    <R></R>
    <div>
      <span onClick={change}>lll</span>
    </div>
  </>
}

export default App;
