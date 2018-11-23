import Hammer from 'hammerjs';

export default class {
  constructor($wall) {
    this.$wall = $wall;
    this.$slots = [];

    const hammer = new Hammer.Manager($wall);
    hammer.add(new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }));

    this.wallBounding = $wall.getBoundingClientRect();
    const wallBounding = this.wallBounding;

    // configuration
    this.slotSize = { 
      w: wallBounding.width / 4, 
      h: 200 };

    this.gridSize = { cols: 5, rows: false, gap: 5, offsetX: .5, offsetY: .5 };
    const dataLength = 100;

    this.contentRootPos = { 
      x: -this.slotSize.w * this.gridSize.offsetX,
      y: -this.slotSize.h * this.gridSize.offsetY,
    };
    const contentRootPos = this.contentRootPos;

    // slot configs
    this.slotConfig = this.getSlotAmount();

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

      // looping rootPos
      const { slotTotalWidth, slotTotalHeight } = this.slotConfig;
      contentRootPos.y = (y - deltaY) % slotTotalHeight;
      contentRootPos.x = (x - deltaX) % slotTotalWidth;

      this.$slots.forEach(($slot, i) =>{
        this.updateSlotPosition($slot, i);
      });
    });

    hammer.on('panend', (e) => {
      console.log('panend');
      deltaX = 0;
      deltaY = 0;
    })

    const data = Array.from(Array(dataLength).keys());
    this.createSlots();


    this.getSlotGridPos = this.getSlotGridPos.bind(this);
    this.updateSlotPosition = this.updateSlotPosition.bind(this);
    this.getSlotAmount = this.getSlotAmount.bind(this);
    this.createSlots = this.createSlots.bind(this);
  }

  getSlotGridPos (i = 0) {
    const { slotCols:cols } = this.slotConfig;
    const col = i % cols;
    const row = ~~(i / cols);
    return { row, col };
  }

  updateSlotPosition ($slot, i) {
    const { slotCols, slotRows } = this.slotConfig;
    const { x:rootX, y:rootY } = this.contentRootPos;
    const { w:slotW, h:slotH } = this.slotSize;
    const { gap } = this.gridSize;

    let col = parseInt($slot.getAttribute('data-slot-col'), 10);
    let row = parseInt($slot.getAttribute('data-slot-row'), 10);
    // amount of slot that'll fit into the distance between rootX and this slot
    const slotHorizontalDistance = (Math.ceil(rootX / (slotW + gap)) + col);
    if (slotHorizontalDistance >= slotCols) col = col - slotCols;
    if (slotHorizontalDistance < 0) col =  col + slotCols;

    const slotVerticalDistance = (Math.ceil(rootY / (slotH + gap)) + row);
    if (slotVerticalDistance >= slotRows) row = row - slotRows;
    if (slotVerticalDistance < 0) row = row + slotRows;

    const slotX = rootX + (col * (slotW + gap));
    const slotY = rootY + (row * (slotH + gap)); 

    $slot.style = `transform: translate(${slotX}px, ${slotY}px);`;
  }

  getSlotAmount () {
    const { width, height } = this.wallBounding;
    const { w:slotW, h:slotH } = this.slotSize;
    const { gap } = this.gridSize;

    const slotCols = Math.round(width / (slotW + gap)) + 1;
    const slotRows = Math.round(height / (slotH + gap)) + 1;
    const slotAmount = slotCols * slotRows;

    const slotTotalWidth = (slotW + gap) * slotCols - gap;
    const slotTotalHeight = (slotH + gap) * slotRows - gap;
    
    return {
      slotCols,
      slotRows,
      slotAmount,
      slotTotalWidth,
      slotTotalHeight,
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

      $slot.textContent = i;
      this.$wall.appendChild($slot);
      // this.observer.observe($slot);
      this.$slots.push($slot);
    }
  }

  renderDataToSlot () {
    
  }
}
