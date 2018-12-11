// import Wall from './infinite-wall';

// const $container = document.querySelector('#container');
// const wall = new Wall($container);

import React from 'react'
import { render } from 'react-dom'
import Infinite from './infinite-wall/react'

const config = {
  width: 0.25,
  height: 200,
  cols: 7,
  gap: 5,
  snap: false,
}

const Cell = ({ data, state }) => <div>{data}</div>

const dataLength = 100;
const content = Array.from(Array(dataLength).keys());

const App = () => (
  <Infinite
    config={config}
    content={content}
    render={
    /* state: loading, ready, position etc; data: data to render into component */
      (props) => <Cell {...props} />
  } />
)

const $root = document.querySelector('#app');
render(<App />, $root)  