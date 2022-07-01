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
