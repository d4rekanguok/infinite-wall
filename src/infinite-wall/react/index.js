import React from "react";
import Hammer from "hammerjs";

const getSlotGridConfig = ({ wallBounding, config }) => {
  const { width, height } = wallBounding;
  const { width: slotW, height: slotH, gap } = config;

  const slotCols = Math.round(width / (slotW + gap)) + 1;
  const slotRows = Math.round(height / (slotH + gap)) + 1;
  const slotAmount = slotCols * slotRows;

  const slotTotalWidth = (slotW + gap) * slotCols;
  const slotTotalHeight = (slotH + gap) * slotRows;

  return {
    slotCols,
    slotRows,
    slotAmount,
    slotTotalWidth,
    slotTotalHeight
  };
};

const getContentGridConfig = ({ config, contentAmount }) => {
  const { gap, cols: contentCols, width: slotW, height: slotH } = config;
  const contentRows = Math.ceil(contentAmount / contentCols);

  const contentTotalWidth = (slotW + gap) * contentCols;
  const contentTotalHeight = (slotH + gap) * contentRows;

  return {
    contentCols,
    contentRows,
    contentTotalWidth,
    contentTotalHeight
  };
};

class Infinite extends React.Component {
  constructor(props) {
    super(props);

    // react
    this.state = {
      ready: false,
      loopCount: {
        x: 0,
        y: 0
      },
      contentRootPos: {
        x: 0,
        y: 0
      },
      slotRootPos: {
        x: 0,
        y: 0
      },
    };
    this.wallRef = React.createRef();

    // component
    this.wallBounding = {};
    this.config = {};
    this.slotConfig = {};
    this.contentConfig = {};

    this.updateRootPos = this.updateRootPos.bind(this);
    this.goToPos = this.goToPos.bind(this);
    this.snap = this.snap.bind(this);
  }

  componentDidMount() {
    const $wall = this.wallRef.current;
    const contentAmount = this.props.content.length;

    this.wallBounding = $wall.getBoundingClientRect();
    const wallBounding = this.wallBounding;

    // TODOS: parse config (%, etc.) & make correct dimension here

    this.config = {
      ...this.props.config,
      width: this.wallBounding.width / 4,
      height: 200
    };

    const config = this.config;
    // setup meaurement

    const contentRootPos = {
      x: -this.config.width * -0.5,
      y: -this.config.height * -0.5
    };

    const slotRootPos = { ...contentRootPos };

    // slot configs
    this.slotConfig = getSlotGridConfig({ wallBounding, config });
    this.contentConfig = getContentGridConfig({ contentAmount, config });

    let distanceX = 0;
    let distanceY = 0;

    // mousewheel events
    let timer = null;
    $wall.onwheel = e => {
      e.stopPropagation();

      const { deltaX, deltaY } = e;
      const { x, y } = this.state.contentRootPos;

      // total distance from original position
      const newRootPosY = y - deltaY;
      const newRootPosX = x - deltaX;

      this.updateRootPos({ x: newRootPosX, y: newRootPosY });
      // this.updateSlots();

      // snap when scroll stops
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.snap({ duration: 200 });
      }, 100);
    };

    // support keyboard arrows;
    window.onkeydown = e => {
      const { keyCode } = e;
      if (keyCode > 40 || keyCode < 37) return;

      const { x, y } = this.state.contentRootPos;
      const { gap, width: w, height: h } = this.config;

      let newRootPosX = x;
      let newRootPosY = y;

      switch (keyCode) {
        case 40:
          // key: arrowDown;
          newRootPosY += gap + h;
          break;
        case 39:
          // key: arrowRight;
          newRootPosX += gap + w;
          break;
        case 38:
          // key: arrowUp;
          newRootPosY -= gap + h;
          break;
        case 37:
          // key: arrowLeft;
          newRootPosX -= gap + w;
          break;
        default:
      }

      this.goToPos({ x: newRootPosX, y: newRootPosY }, { duration: 150 });
    };

    const hammer = new Hammer.Manager($wall);
    hammer.add(
      new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 })
    );

    hammer.on("panstart", e => {
      console.log("panstart");
      const { x, y } = e.center;
      // distance from pointer to current content root
      const contentRootPos = { ...this.state.contentRootPos };
      distanceY = y - contentRootPos.y;
      distanceX = x - contentRootPos.x;
    });

    hammer.on("panmove", e => {
      const { x, y } = e.center;

      // total distance from original position
      const newRootPosY = y - distanceY;
      const newRootPosX = x - distanceX;

      this.updateRootPos({ x: newRootPosX, y: newRootPosY });
      // this.updateSlots();
    });

    hammer.on("panend", e => {
      console.log("panend");
      this.snap();
    });

    this.setState({ 
      ready: true,
      contentRootPos,
      slotRootPos,
    });
  }

  updateRootPos(distance = { x: 0, y: 0 }) {
    const { x, y } = distance;
    const { slotTotalWidth, slotTotalHeight } = this.slotConfig;
    const { contentTotalWidth, contentTotalHeight } = this.contentConfig;

    const _contentRootPos = { ...this.state.contentRootPos };
    const _slotRootPos = { ...this.state.slotRootPos };
    const _loopCount = { ...this.state.loopCount };

    // loop content
    _contentRootPos.y = y % contentTotalHeight;
    _contentRootPos.x = x % contentTotalWidth;

    // keep track of loop count so we can place correct data on slot
    // since we're counting from the bottom right position (hence Math.ceil)
    // if loop count > 0, remove 1 loop to make it seamless
    _loopCount.y = -Math.ceil(y / slotTotalHeight);
    if (_loopCount.y < 0) _loopCount.y++;
    _loopCount.x = -Math.ceil(x / slotTotalWidth);
    if (_loopCount.x < 0) _loopCount.x++;

    // loop slot
    _slotRootPos.y = y % slotTotalHeight;
    _slotRootPos.x = x % slotTotalWidth;

    this.setState({
      loopCount: _loopCount,
      contentRootPos: _contentRootPos,
      slotRootPos: _slotRootPos,
    })
  }

  snap(setting = { duration: 150 }) {
    const { snap, gap, width: w, height: h } = this.config;

    if (!snap) return;

    const { x:rootPosX, y:rootPosY } = this.state.contentRootPos;
    const snapY = h + gap;
    const snapX = w + gap;
    const offsetY = snapY / 2;
    const offsetX = snapX / 2;
    
    const newPosY = snapY * Math.round((rootPosY - offsetY) / snapY) + offsetY;
    const newPosX = snapX * Math.round((rootPosX - offsetX) / snapX) + offsetX;

    this.goToPos({
      x: newPosX,
      y: newPosY,
    }, setting);
  }

  goToPos(toPos = {x: 0, y: 0}, setting = {
    duration: 0,
  }) {
    const { duration } = setting;

    if (duration === 0) {
      this.updateRootPos(toPos);
      // this.updateSlots();
      return;
    }

    const fromPos = {...this.contentRootPos};

    let start = null;
    const newPos = {x: 0, y: 0};
    const updateRootPos = this.updateRootPos.bind(this);
    // const updateSlots = this.updateSlots.bind(this);

    function render (timestamp) {
      if (!start) start = timestamp;
      const delta = timestamp - start;
      newPos.x = fromPos.x + (toPos.x - fromPos.x) / duration * delta;
      newPos.y = fromPos.y + (toPos.y - fromPos.y) / duration * delta;

      updateRootPos(newPos);
      // updateSlots();
      
      if (delta < duration) window.requestAnimationFrame(render);
    }
    
    window.requestAnimationFrame(render);
  }

  render() {
    const state = this.state;
    const data = 0;
    return <div ref={this.wallRef}>{this.props.render({ state, data })}</div>;
  }
}

export default Infinite;
