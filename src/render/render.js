import React from "react";


function TC() {
  return (
    <div className="tc">
      <span>tc</span>
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

class RenderTest extends React.Component {

  state = {
    v: 123,
    arr: []
  }

  foo = () => {
    const ne = this.state.arr.slice()
    this.setState({
      arr: [<div>1</div>,<TC></TC>, <TC></TC>]
    })
  }

  render() {
    const {
      arr
    } = this.state

    return (
      <div onClick={this.foo}>
        <div>aaa</div>
        {arr}
        <TC1></TC1>
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