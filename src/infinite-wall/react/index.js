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

const getContentGridConfig = ({ config, contentSize }) => {
  const { gap, cols: contentCols, width: slotW, height: slotH } = config;
  const contentRows = Math.ceil(contentSize / contentCols);

  const contentTotalWidth = (slotW + gap) * contentCols;
  const contentTotalHeight = (slotH + gap) * contentRows;

  return {
    contentCols,
    contentRows,
    contentTotalWidth,
    contentTotalHeight
  };
};

const getSlotGridPos = (i = 0, cols) => {
  const col = i % cols;
  const row = ~~(i / cols);
  return { row, col };
};

class Infinite extends React.PureComponent {
  constructor(props) {
    super(props);

    // react
    this.state = {
      isReady: false,
    };
    this.wallRef = React.createRef();

    // component
    this.slots = [];
    this.loopCount = {
      x: 0,
      y: 0
    };
    this.contentRootPos = {
      x: 0,
      y: 0
    };
    this.slotRootPos = {
      x: 0,
      y: 0
    };

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

    this.wallBounding = $wall.getBoundingClientRect();
    const wallBounding = this.wallBounding;

    // TODOS: parse config (%, etc.) & make correct dimension here

    this.config = {
      ...this.props.config,
      width: this.wallBounding.width / 4,
      height: 200
    };

    const config = this.config;
    const { contentSize } = config;
    // setup meaurement

    const contentRootPos = {
      x: -this.config.width * -0.5,
      y: -this.config.height * -0.5
    };

    this.slotRootPos = { ...contentRootPos };

    // slot configs
    this.slotConfig = getSlotGridConfig({ wallBounding, config });
    this.contentConfig = getContentGridConfig({ contentSize, config });

    let distanceX = 0;
    let distanceY = 0;

    // mousewheel events
    let timer = null;
    $wall.onwheel = e => {
      e.stopPropagation();

      const { deltaX, deltaY } = e;
      const { x, y } = this.contentRootPos;

      // total distance from original position
      const newRootPosY = y - deltaY;
      const newRootPosX = x - deltaX;

      this.updateRootPos({ x: newRootPosX, y: newRootPosY });
      this.updateSlots();

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

      const { x, y } = this.contentRootPos;
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
      const contentRootPos = this.contentRootPos;
      distanceY = y - contentRootPos.y;
      distanceX = x - contentRootPos.x;
    });

    hammer.on("panmove", e => {
      const { x, y } = e.center;

      // total distance from original position
      const newRootPosY = y - distanceY;
      const newRootPosX = x - distanceX;

      this.updateRootPos({ x: newRootPosX, y: newRootPosY });
      this.updateSlots();
    });

    hammer.on("panend", e => {
      console.log("panend");
      this.snap();
    });

    this.createSlots();

    this.setState({ 
      isReady: true,
    });
  }

  updateRootPos(distance = { x: 0, y: 0 }) {
    const { x, y } = distance;
    const { slotTotalWidth, slotTotalHeight } = this.slotConfig;
    const { contentTotalWidth, contentTotalHeight } = this.contentConfig;

    const { contentRootPos, slotRootPos, loopCount } = this;

    // loop content
    contentRootPos.y = y % contentTotalHeight;
    contentRootPos.x = x % contentTotalWidth;

    // keep track of loop count so we can place correct data on slot
    // since we're counting from the bottom right position (hence Math.ceil)
    // if loop count > 0, remove 1 loop to make it seamless
    loopCount.y = -Math.ceil(y / slotTotalHeight);
    if (loopCount.y < 0) loopCount.y++;
    loopCount.x = -Math.ceil(x / slotTotalWidth);
    if (loopCount.x < 0) loopCount.x++;

    // loop slot
    slotRootPos.y = y % slotTotalHeight;
    slotRootPos.x = x % slotTotalWidth;
  }

  snap(setting = { duration: 150 }) {
    const { snap, gap, width: w, height: h } = this.config;

    if (!snap) return;

    const { x:rootPosX, y:rootPosY } = this.contentRootPos;
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
      this.updateSlots();
      return;
    }

    const fromPos = {...this.contentRootPos};

    let start = null;
    const newPos = {x: 0, y: 0};
    const updateRootPos = this.updateRootPos.bind(this);
    const updateSlots = this.updateSlots.bind(this);

    function render (timestamp) {
      if (!start) start = timestamp;
      const delta = timestamp - start;
      newPos.x = fromPos.x + (toPos.x - fromPos.x) / duration * delta;
      newPos.y = fromPos.y + (toPos.y - fromPos.y) / duration * delta;

      updateRootPos(newPos);
      updateSlots();
      
      if (delta < duration) window.requestAnimationFrame(render);
    }
    
    window.requestAnimationFrame(render);
  }

  createSlots() {
    if (this.slots.length > 0) {
      console.error("slots had alisReady been created.");
      return;
    }
    const { slotAmount, slotCols } = this.slotConfig;
    const { width: w, height: h } = this.config;

    const head = document.head;
    const css = document.createElement("style");
    css.type = "text/css";
    css.appendChild(
      document.createTextNode(`
      .infinite-wall-slot {
        position: absolute;
        display: block;
        box-sizing: border-box;
        top: 0; left: 0;
        width: ${w}px; height: ${h}px;
      }
      `)
    );
    head.appendChild(css);

    for (let i = 0; i < slotAmount; i++) {
      const gridPos = getSlotGridPos(i, slotCols);
      const ref = React.createRef();
      this.slots.push({
        gridPos,
        ref
      });
    }
  }
  
  updateSlots() {
    if (!this.state.isReady) return;
    this.slots.forEach(slot => {
      const Slot = slot.ref.current;
      Slot.updateSlot(this.slotRootPos, this.loopCount);
    })
  }

  render() {
    const { isReady } = this.state;
    const { slotConfig, contentConfig, config, slotRootPos } = this;
    return (
      <ul style={{
        position: 'absolute',
        margin: 0,
        padding: 0,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }} ref={this.wallRef}>
        {isReady && this.slots.map(({gridPos, ref}, i) => (
          <Slot
            ref={ref}
            key={i}
            id={i}
            gridPos={gridPos}
            slotConfig={slotConfig}
            config={config}
            contentConfig={contentConfig}
            initPos={slotRootPos}
            render={this.props.render}
            />
        ))}
      </ul>
    );
  }
}

class Slot extends React.PureComponent {
  constructor (props) {
    super(props);
    this.ref = React.createRef();
    this.id = this.props.id;

    this.state = {
      contentId: 0,
    }

    this.updateSlot = this.updateSlot.bind(this);
    this.getSlotPosFromRootPos = this.getSlotPosFromRootPos.bind(this);
  }

  componentDidMount() {
    this.updateSlot(this.props.initPos);
  }

  updateSlot(slotRootPos, loopCount) {
    const { contentId:currentId } = this.state;
    const { slotX, slotY, col, row } = this.getSlotPosFromRootPos(slotRootPos);
    const { contentId } = this.updateContent({col, row}, loopCount);

    if (contentId !== currentId) this.setState({ contentId });
    this.ref.current.style = `transform: translate(${slotX}px, ${slotY}px);`;
  }

  getSlotPosFromRootPos(slotRootPos = { x: 0, y: 0}) {
    const { slotConfig, gridPos, config } = this.props;
    const { slotCols, slotRows } = slotConfig;
    const { x: rootX, y: rootY } = slotRootPos;
    const { width: slotW, height: slotH, gap } = config;

    let { col, row } = gridPos;
    // amount of slot that'll fit into the distance between rootX and this slot
    // basically, if slot's not in view -> move it to the other side of the grid
    const slotHorizontalDistance = Math.ceil(rootX / (slotW + gap)) + col;
    if (slotHorizontalDistance >= slotCols) col = col - slotCols;
    if (slotHorizontalDistance < 0) col = col + slotCols;
  
    const slotVerticalDistance = Math.ceil(rootY / (slotH + gap)) + row;
    if (slotVerticalDistance >= slotRows) row = row - slotRows;
    if (slotVerticalDistance < 0) row = row + slotRows;

    const slotX = rootX + col * (slotW + gap);
    const slotY = rootY + row * (slotH + gap);

    return { slotY, slotX, col, row };
  }

  updateContent(slotGridPos = { col: 0, row: 0 }, loopCount={x:0,y:0}) {
    const { slotConfig, contentConfig, config } = this.props;
    const { contentSize } = config;
    const { col, row } = slotGridPos;
    const { slotCols, slotRows } = slotConfig;
    const { contentCols, contentRows } = contentConfig;
    const { x: loopX, y: loopY } = loopCount;

    let contentCol, contentRow;

    // Content
    contentCol = (col + loopX * slotCols) % contentCols;
    contentRow = (row + loopY * slotRows) % contentRows;

    let contentId = contentRow * contentCols + contentCol;
    if (contentId < 0) contentId = contentId + contentSize;
    if (contentId > contentSize) contentId = null

    return {
      contentCol,
      contentRow,
      contentId,
    }
  }

  render () {
    const { render } = this.props;
    const data = {
      id: this.id,
      contentId: this.state.contentId,
    }
    return <li className="infinite-wall-slot" ref={this.ref}>{
      render({ data })
    }</li>
  }
}

export default Infinite;
