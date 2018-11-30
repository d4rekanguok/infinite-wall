import Hammer from "hammerjs";

export default class {
  constructor($wall) {
    this.$wall = $wall;
    this.$slots = [];

    const dataLength = 70;
    this.content = Array.from(Array(dataLength).keys());

    const hammer = new Hammer.Manager($wall);
    hammer.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );

    this.wallBounding = $wall.getBoundingClientRect();
    const wallBounding = this.wallBounding;

    // configuration
    this.slotSize = {
      w: wallBounding.width / 4,
      h: 200
    };

    this.gridSize = {
      w: wallBounding.width / 4,
      h: 200,
      cols: 7,
      rows: false,
      gap: 5,
      snap: true,
    };

    this.slotLoop = { x: 0, y: 0 };
    
    this.contentRootPos = {
      x: -this.slotSize.w * -0.5,
      y: -this.slotSize.h * -0.5,
    };

    this.slotRootPos = { ...this.contentRootPos };

    // slot configs
    this.slotConfig = this.getSlotGridConfig();
    this.contentConfig = this.getContentGridConfig();

    let distanceX = 0;
    let distanceY = 0;

    hammer.on("panstart", e => {
      console.log("panstart");
      const { x, y } = e.center;
      // distance from pointer to current content root
      distanceY = y - this.contentRootPos.y;
      distanceX = x - this.contentRootPos.x;
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
      const { snap, gap, w, h } = this.gridSize;

      if (!snap) return;

      const { x:rootPosX, y:rootPosY } = this.contentRootPos;
      const snapY = h + gap;
      const snapX = w + gap;
      const offsetY = snapY / 2;
      const offsetX = snapX / 2;
      
      const newPosY = snapY * Math.round((rootPosY - offsetY) / snapY) + offsetY;
      const newPosX = snapX * Math.round((rootPosX - offsetX) / snapX) + offsetX;

      //  5.3 => 5.0, 5.3 => 5.5
      //  5.8 => 6.0, 5.8 => 5.5
      //  6.1 => 6.0, 6.1 =>
 
      this.goToPos({
        x: newPosX,
        y: newPosY,
      }, { duration: 150 })
    });

    this.createSlots();
  }

  updateRootPos(distance = {x: 0, y: 0}) {
    const { x, y } = distance;
    const { slotTotalWidth, slotTotalHeight } = this.slotConfig;
    const { contentTotalWidth, contentTotalHeight } = this.contentConfig;

    const contentRootPos = this.contentRootPos;
    const slotRootPos = this.slotRootPos;
    // loop content
    contentRootPos.y = y % contentTotalHeight;
    contentRootPos.x = x % contentTotalWidth;
    
    // keep track of loop count so we can place correct data on slot
    // since we're counting from the bottom right position (hence Math.ceil)
    // if loop count > 0, remove 1 loop to make it seamless
    this.slotLoop.y = -Math.ceil(y / slotTotalHeight);
    if (this.slotLoop.y < 0) this.slotLoop.y++;
    this.slotLoop.x = -Math.ceil(x / slotTotalWidth);
    if (this.slotLoop.x < 0) this.slotLoop.x++;

    // loop slot
    slotRootPos.y = y % slotTotalHeight;
    slotRootPos.x = x % slotTotalWidth;
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

  // Slot
  getSlotGridPos(i = 0) {
    const { slotCols: cols } = this.slotConfig;
    const col = i % cols;
    const row = ~~(i / cols);
    return { row, col };
  }

  getSlotPosFromGridPos(gridPos = { col: 0, row: 0 }) {
    const { slotCols, slotRows } = this.slotConfig;
    const { x: rootX, y: rootY } = this.slotRootPos;
    const { w: slotW, h: slotH } = this.slotSize;
    const { gap } = this.gridSize;

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

  updateSlotPos($slot, toPos = { x: 0, y: 0 }) {
    const { x, y } = toPos;
    $slot.style = `transform: translate(${x}px, ${y}px);`;
  }

  updateSlots () {
    this.$slots.forEach(($slot) => {
      const col = parseInt($slot.getAttribute("data-slot-col"), 10);
      const row = parseInt($slot.getAttribute("data-slot-row"), 10);
      const {
        slotX,
        slotY,
        col: newCol,
        row: newRow
      } = this.getSlotPosFromGridPos({ col, row });
      this.updateSlotPos($slot, { x: slotX, y: slotY });
      this.updateContent($slot, { col: newCol, row: newRow });
    });
  }

  getSlotGridConfig() {
    const { width, height } = this.wallBounding;
    const { w: slotW, h: slotH } = this.slotSize;
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
      slotTotalHeight
    };
  }

  createSlots() {
    if (this.$slots.length > 0) {
      console.error("slots had already been created.");
      return;
    }
    const { slotAmount } = this.slotConfig;
    const { w, h } = this.slotSize;

    const head = document.head;
    const css = document.createElement("style");
    css.type = "text/css";
    css.appendChild(
      document.createTextNode(`
      #${this.$wall.id} .slot {
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
      const $slot = document.createElement("div");
      const { row, col } = this.getSlotGridPos(i);

      $slot.classList.add(`slot`, `slot-${i}`);

      $slot.setAttribute("data-slot-id", i);
      $slot.setAttribute("data-slot-row", row);
      $slot.setAttribute("data-slot-col", col);

      const {
        slotX,
        slotY,
        col: newCol,
        row: newRow
      } = this.getSlotPosFromGridPos({ col, row });
      this.updateSlotPos($slot, { x: slotX, y: slotY });
      this.updateContent($slot, { col: newCol, row: newRow });
      this.$wall.appendChild($slot);
      // this.observer.observe($slot);
      this.$slots.push($slot);
    }
  }

  renderContentToSlot(i) {
    // this is not accounting for the empty slot,
    // which is why the top of the scroll doesn't loop.
    // But it makes the wall more seamless
    if (i < 0) i = i + this.content.length;
    if (i > this.content.length) return null;
    return this.content[i];
  }

  getContentGridConfig() {
    const { gap, cols: contentCols } = this.gridSize;
    const { w: slotW, h: slotH } = this.slotSize;
    const contentRows = Math.ceil(this.content.length / contentCols);

    const contentTotalWidth = (slotW + gap) * contentCols;
    const contentTotalHeight = (slotH + gap) * contentRows;

    return {
      contentCols,
      contentRows,
      contentTotalWidth,
      contentTotalHeight
    };
  }

  updateContent($slot, slotGridPos = { col: 0, row: 0 }) {
    const { col, row } = slotGridPos;
    const { slotCols, slotRows } = this.slotConfig;
    const { contentCols, contentRows } = this.contentConfig;
    const { x: loopX, y: loopY } = this.slotLoop;

    let contentCol, contentRow;

    // Content
    contentCol = (col + loopX * slotCols) % contentCols;
    contentRow = (row + loopY * slotRows) % contentRows;

    $slot.setAttribute("data-content-row", contentCol);
    $slot.setAttribute("data-content-col", contentRow);

    const contentId = contentRow * contentCols + contentCol;
    $slot.textContent = this.renderContentToSlot(contentId);
  }
}
