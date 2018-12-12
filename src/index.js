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
  snap: true,
  contentSize: 100,
}

const Cell = ({ data }) => (
  <div style={{
    color: 'blue',
  }}>
    {`${data.contentId}`}
  </div>
)

const dataLength = 100;
const content = Array.from(Array(dataLength).keys());

const App = () => (
  <Infinite
    config={config}
    render={
    /* state: loading, ready, position etc; data: data to render into component */
      (props) => <Cell {...props} />
  } />
)

const $root = document.querySelector('#app');
render(<App />, $root)  