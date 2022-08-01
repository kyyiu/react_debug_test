import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { fiberRoot } from './global';

const root = document.getElementById('root')

console.log(fiberRoot, 'mm');
// Concurrent mode
const cur = ReactDOM.createRoot(root);
fiberRoot.cur = cur
cur.render(<App/>)



// setTimeout(() => {
//   // fiberRoot._internalRoot.current = null
//   fiberRoot.unmount()
//   fiberRoot.render('hello')
//   console.log(fiberRoot, 'ss');
// }, 2000)

// blocking mode
// ReactDOM.createBlockingRoot(root).render(<App />);

// Sync mode
// ReactDOM.render(<App />, root);

// console.log('React 源码调试，当前版本：' + React.version);


// 模式
// legacy 模式： ReactDOM.render(<App />, rootNode)。
// 这是当前 React app 使用的方式。当前没有计划删除本模式，
// 但是这个模式可能不支持这些新功能。

// blocking 模式： ReactDOM.createBlockingRoot(rootNode).render(<App />)。
// 目前正在实验中。作为迁移到 concurrent 模式的第一个步骤。

// concurrent 模式： ReactDOM.createRoot(rootNode).render(<App />)。
// 目前在实验中，未来稳定之后，打算作为 React 的默认开发模式。这个模式开启了所有的新功能。

// legacy模式是我们常用的，
// 它构建dom的过程是同步的，
// 所以在render的reconciler中，
// 如果diff的过程特别耗时，那么导致的结果就是js一直阻塞高优先级的任务(例如用户的点击事件)，
// 表现为页面的卡顿，无法响应。

// concurrent Mode是react未来的模式，
// 它用时间片调度实现了异步可中断的任务，
// 根据设备性能的不同，时间片的长度也不一样，
// 在每个时间片中，如果任务到了过期时间，
// 就会主动让出线程给高优先级的任务。这部分将在第15节 scheduler&lane模型 。