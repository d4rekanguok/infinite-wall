import Hammer from 'hammerjs';

export default class {
  constructor($wall) {
    this.$wall = $wall;
    this.$slots = [];
    this.slotLoop = { x: 0, y: 0 };

    const dataLength = 69;
    this.data = Array.from(Array(dataLength).keys());

    const hammer = new Hammer.Manager($wall);
    hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }));

    this.wallBounding = $wall.getBoundingClientRect();
    const wallBounding = this.wallBounding;

    // configuration
    this.slotSize = { 
      w: wallBounding.width / 4, 
      h: 200 };

    this.gridSize = { cols: 7, rows: false, gap: 5, offsetX: -.5, offsetY: -.5 };

    this.contentRootPos = { 
      x: -this.slotSize.w * this.gridSize.offsetX,
      y: -this.slotSize.h * this.gridSize.offsetY,
    };
    const contentRootPos = this.contentRootPos;
    
    this.slotRootPos = {...contentRootPos};
    const slotRootPos = this.slotRootPos;

    // slot configs
    this.slotConfig = this.getSlotGridConfig();
    this.contentConfig = this.getContentGridConfig();

    let deltaX = 0;
    let deltaY = 0;

    hammer.on('panstart', (e) => {
      console.log('panstart');
      const { x, y } = e.center;
      deltaY = y - contentRootPos.y;
      deltaX = x - contentRootPos.x;
    });

    hammer.on('panmove', (e) => {
      const { x, y } = e.center;
      const { slotTotalWidth, slotTotalHeight } = this.slotConfig;
      const { contentTotalWidth, contentTotalHeight } = this.contentConfig;

      // total distance from original position
      const distanceY = y - deltaY;
      const distanceX = x - deltaX;

      // loop content
      contentRootPos.y = distanceY % contentTotalHeight;
      contentRootPos.x = distanceX % contentTotalWidth;

      // keep track of loop count so we can place correct data on slot
      // since we're counting from the bottom right position (hence Math.ceil)
      // if loop count > 0, remove 1 loop to make it seamless
      this.slotLoop.y = -Math.ceil(distanceY / slotTotalHeight);
      if (this.slotLoop.y < 0) this.slotLoop.y++;
      this.slotLoop.x = -Math.ceil(distanceX / slotTotalWidth);
      if (this.slotLoop.x < 0) this.slotLoop.x++;

      // loop slot
      slotRootPos.y = distanceY % slotTotalHeight;
      slotRootPos.x = distanceX % slotTotalWidth;

      console.log(contentRootPos);

      this.$slots.forEach(($slot, i) =>{
        this.updateSlotPosition($slot, i);
      });
    });

    hammer.on('panend', (e) => {
      console.log('panend');
      deltaX = 0;
      deltaY = 0;
    })

    this.createSlots();


    this.getSlotGridPos = this.getSlotGridPos.bind(this);
    this.updateSlotPosition = this.updateSlotPosition.bind(this);
    this.getSlotGridConfig = this.getSlotGridConfig.bind(this);
    this.createSlots = this.createSlots.bind(this);

    this.getContentGridConfig = this.getContentGridConfig.bind(this);
    this.renderDataToSlot = this.renderDataToSlot.bind(this);
  }

  getSlotGridPos (i = 0) {
    const { slotCols:cols } = this.slotConfig;
    const col = i % cols;
    const row = ~~(i / cols);
    return { row, col };
  }

  updateSlotPosition ($slot, i) {
    const { slotCols, slotRows } = this.slotConfig;
    const { contentCols, contentRows } = this.contentConfig;
    const { x:rootX, y:rootY } = this.slotRootPos;
    const { w:slotW, h:slotH } = this.slotSize;
    const { x:loopX, y:loopY } = this.slotLoop;
    const { gap } = this.gridSize;

    let contentCol, contentRow;
    let col = parseInt($slot.getAttribute('data-slot-col'), 10);
    let row = parseInt($slot.getAttribute('data-slot-row'), 10);
    // amount of slot that'll fit into the distance between rootX and this slot
    // basically, if slot's not in view -> move it to the other side of the grid
    const slotHorizontalDistance = (Math.ceil(rootX / (slotW + gap)) + col);
    if (slotHorizontalDistance >= slotCols) col = col - slotCols;
    if (slotHorizontalDistance < 0) col =  col + slotCols;

    const slotVerticalDistance = (Math.ceil(rootY / (slotH + gap)) + row);
    if (slotVerticalDistance >= slotRows) row = row - slotRows;
    if (slotVerticalDistance < 0) row = row + slotRows;

    const slotX = rootX + (col * (slotW + gap));
    const slotY = rootY + (row * (slotH + gap)); 

    $slot.style = `transform: translate(${slotX}px, ${slotY}px);`;

    // Content
    contentCol = (col + (loopX * slotCols)) % contentCols;
    contentRow = (row + (loopY * slotRows)) % contentRows;

    $slot.setAttribute('data-content-row', contentCol);
    $slot.setAttribute('data-content-col', contentRow);
    
    const contentId = contentRow * contentCols + contentCol;
    $slot.textContent = this.renderDataToSlot(contentId);
  }

  getSlotGridConfig () {
    const { width, height } = this.wallBounding;
    const { w:slotW, h:slotH } = this.slotSize;
    const { gap } = this.gridSize;

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
      slotTotalHeight,
    }
  }

  getContentGridConfig () {
    const { gap, cols:contentCols } = this.gridSize;
    const { w:slotW, h:slotH } = this.slotSize;
    const contentRows = Math.ceil(this.data.length / contentCols);

    const contentTotalWidth = (slotW + gap) * contentCols;
    const contentTotalHeight = (slotH + gap) * contentRows;

    return {
      contentCols,
      contentRows,
      contentTotalWidth,
      contentTotalHeight,
    }
  }

  createSlots () {
    const { slotAmount } = this.slotConfig;
    this.$slots = [];

    const { w, h } = this.slotSize;
    const head = document.head;
    const css = document.createElement('style');
    css.type = 'text/css';
    css.appendChild(document.createTextNode(`
    #${this.$wall.id} .slot {
      position: absolute;
      display: block;
      box-sizing: border-box;
      top: 0; left: 0;
      width: ${w}px; height: ${h}px;
    }
    `));
    head.appendChild(css);

    for (let i = 0; i < slotAmount; i++) {
      const $slot = document.createElement('div');
      const { row, col } = this.getSlotGridPos(i);

      $slot.classList.add(`slot`, `slot-${i}`);

      $slot.setAttribute('data-slot-id', i);
      $slot.setAttribute('data-slot-row', row);
      $slot.setAttribute('data-slot-col', col);

      this.updateSlotPosition($slot, i);
      this.$wall.appendChild($slot);
      // this.observer.observe($slot);
      this.$slots.push($slot);
    }
  }

  renderDataToSlot (i) {
    // this is not accounting for the empty slot,
    // which is why the top of the scroll doesn't loop.
    // But it makes the wall more seamless
    if (i < 0) i = i + this.data.length;
    if (i > this.data.length) return null;
    return this.data[i];
  }
}
