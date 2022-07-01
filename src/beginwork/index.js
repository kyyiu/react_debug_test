import React from "react";

/**
 * beginWOrk入口
 * \react-reconciler\src\ReactFiberBeginWork.old.js 里面的beginWOrk入口函数
 */

class BW extends React.Component {

  state = {
    val: 0,
    renderCount: 1
  }

  componentDidMount() {


  }

  startView = () => {
    const btn = document.querySelector('.add')
    // 这次还没有完成更新，点击事件进来插队，会显示2，然后显示3, 比如renderCount为400000
    // 如果完成更新则先显示1，然后显示3, 比如renderCount为10

    // setState的时候使用的是v17.0.2\react-reconciler\src\ReactFiberClassComponent.old.js这个文件的classComponentUpdater里面的enqueueSetState方法
    
    setTimeout(() => {
      this.setState(p => {
        return {
          val: p.val + 1
        }
      })
    })
    setTimeout(() => {
      btn.click()
    }, 50)
  }

  updateData = () => {
    this.setState(p => {
      return {
        val: p.val + 2
      }
    })
  }

  render() {
    const {
      val,
      renderCount
    } = this.state
    return (
      <div>
        <button className="add" onClick={this.updateData}>
          点我更新---当前val---{val}
        </button>
        <button onClick={this.startView}></button>
        <div>
          {Array.from(new Array(renderCount)).map( (v,index) =>
            <div key={index}>{val}</div>
          )}
        </div>
      </div>
      
    )
  }
}

export default BW;