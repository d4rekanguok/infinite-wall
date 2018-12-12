function t(t){return t&&"object"==typeof t&&"default"in t?t.default:t}var o=t(require("react")),n=t(require("hammerjs")),i=function(t,o){return void 0===t&&(t=0),{row:~~(t/o),col:t%o}},e=function(t){function e(n){t.call(this,n),this.state={isReady:!1},this.wallRef=o.createRef(),this.slots=[],this.loopCount={x:0,y:0},this.contentRootPos={x:0,y:0},this.slotRootPos={x:0,y:0},this.wallBounding={},this.config={},this.slotConfig={},this.contentConfig={},this.updateRootPos=this.updateRootPos.bind(this),this.goToPos=this.goToPos.bind(this),this.snap=this.snap.bind(this)}return t&&(e.__proto__=t),(e.prototype=Object.create(t&&t.prototype)).constructor=e,e.prototype.componentDidMount=function(){var t=this,o=this.wallRef.current;this.wallBounding=o.getBoundingClientRect();var i=this.wallBounding;this.config=Object.assign({},this.props.config,{width:this.wallBounding.width/4,height:200});var e=this.config,s=e.contentSize,r={x:-.5*-this.config.width,y:-.5*-this.config.height};this.contentRootPos=Object.assign({},r),this.slotRootPos=Object.assign({},r),this.slotConfig=function(t){var o=t.wallBounding,n=t.config,i=o.height,e=n.width,s=n.height,r=n.gap,a=Math.round(o.width/(e+r))+1,h=Math.round(i/(s+r))+1;return{slotCols:a,slotRows:h,slotAmount:a*h,slotTotalWidth:(e+r)*a,slotTotalHeight:(s+r)*h}}({wallBounding:i,config:e}),this.contentConfig=function(t){var o=t.config,n=o.gap,i=o.cols,e=o.width,s=o.height,r=Math.ceil(t.contentSize/i);return{contentCols:i,contentRows:r,contentTotalWidth:(e+n)*i,contentTotalHeight:(s+n)*r}}({contentSize:s,config:e});var a=0,h=0,l=null;o.onwheel=function(o){o.stopPropagation();var n=t.contentRootPos;t.updateRootPos({x:n.x-o.deltaX,y:n.y-o.deltaY}),t.updateSlots(),clearTimeout(l),l=setTimeout(function(){t.snap({duration:200})},100)},window.onkeydown=function(o){var n=o.keyCode;if(!(n>40||n<37)){var i=t.contentRootPos,e=t.config,s=e.gap,r=e.width,a=e.height,h=i.x,l=i.y;switch(n){case 40:l+=s+a;break;case 39:h+=s+r;break;case 38:l-=s+a;break;case 37:h-=s+r}t.goToPos({x:h,y:l},{duration:150})}};var c=new n.Manager(o);c.add(new n.Pan({direction:n.DIRECTION_ALL,threshold:0})),c.on("panstart",function(o){console.log("panstart");var n=o.center,i=t.contentRootPos;h=n.y-i.y,a=n.x-i.x}),c.on("panmove",function(o){var n=o.center;t.updateRootPos({x:n.x-a,y:n.y-h}),t.updateSlots()}),c.on("panend",function(o){console.log("panend"),t.snap()}),this.createSlots(),this.setState({isReady:!0})},e.prototype.updateRootPos=function(t){void 0===t&&(t={x:0,y:0});var o=t.x,n=t.y,i=this.slotConfig,e=i.slotTotalWidth,s=i.slotTotalHeight,r=this.contentConfig,a=r.contentTotalWidth,h=this.contentRootPos,l=this.slotRootPos,c=this.loopCount;h.y=n%r.contentTotalHeight,h.x=o%a,c.y=-Math.ceil(n/s),c.y<0&&c.y++,c.x=-Math.ceil(o/e),c.x<0&&c.x++,l.y=n%s,l.x=o%e},e.prototype.snap=function(t){void 0===t&&(t={duration:150});var o=this.config,n=o.snap,i=o.gap;if(n){var e=this.contentRootPos,s=e.x,r=o.height+i,a=o.width+i,h=r/2,l=a/2,c=r*Math.round((e.y-h)/r)+h,d=a*Math.round((s-l)/a)+l;this.goToPos({x:d,y:c},t)}},e.prototype.goToPos=function(t,o){void 0===t&&(t={x:0,y:0}),void 0===o&&(o={duration:0});var n=o.duration;if(0===n)return this.updateRootPos(t),void this.updateSlots();var i=Object.assign({},this.contentRootPos),e=null,s={x:0,y:0},r=this.updateRootPos.bind(this),a=this.updateSlots.bind(this);window.requestAnimationFrame(function o(h){e||(e=h);var l=h-e;s.x=i.x+(t.x-i.x)/n*l,s.y=i.y+(t.y-i.y)/n*l,r(s),a(),l<n&&window.requestAnimationFrame(o)})},e.prototype.createSlots=function(){if(this.slots.length>0)console.error("slots had alisReady been created.");else{var t=this.slotConfig,n=t.slotAmount,e=t.slotCols,s=this.config,r=s.width,a=s.height,h=document.head,l=document.createElement("style");l.type="text/css",l.appendChild(document.createTextNode("\n      .infinite-wall-slot {\n        position: absolute;\n        display: block;\n        box-sizing: border-box;\n        top: 0; left: 0;\n        width: "+r+"px; height: "+a+"px;\n      }\n      ")),h.appendChild(l);for(var c=0;c<n;c++){var d=i(c,e),p=o.createRef();this.slots.push({gridPos:d,ref:p})}}},e.prototype.updateSlots=function(){var t=this;this.state.isReady&&this.slots.forEach(function(o){o.ref.current.updateSlot(t.slotRootPos,t.loopCount)})},e.prototype.render=function(){var t=this,o=this.slotConfig,n=this.contentConfig,i=this.config,e=this.slotRootPos;return h("ul",{style:{position:"absolute",margin:0,padding:0,top:0,left:0,width:"100%",height:"100%",overflow:"hidden"},ref:this.wallRef},this.state.isReady&&this.slots.map(function(r,a){return h(s,{ref:r.ref,key:a,id:a,gridPos:r.gridPos,slotConfig:o,config:i,contentConfig:n,initPos:e,render:t.props.render})}))},e}(o.PureComponent),s=function(t){function n(n){t.call(this,n),this.ref=o.createRef(),this.id=this.props.id,this.state={contentId:0},this.updateSlot=this.updateSlot.bind(this),this.getSlotPosFromRootPos=this.getSlotPosFromRootPos.bind(this)}return t&&(n.__proto__=t),(n.prototype=Object.create(t&&t.prototype)).constructor=n,n.prototype.componentDidMount=function(){this.updateSlot(this.props.initPos)},n.prototype.updateSlot=function(t,o){var n=this.state.contentId,i=this.getSlotPosFromRootPos(t),e=i.slotX,s=i.slotY,r=this.updateContent({col:i.col,row:i.row},o).contentId;r!==n&&this.setState({contentId:r}),this.ref.current.style="transform: translate("+e+"px, "+s+"px);"},n.prototype.getSlotPosFromRootPos=function(t){void 0===t&&(t={x:0,y:0});var o=this.props,n=o.slotConfig,i=o.gridPos,e=o.config,s=n.slotCols,r=n.slotRows,a=t.x,h=t.y,l=e.width,c=e.height,d=e.gap,p=i.col,u=i.row,f=Math.ceil(a/(l+d))+p;f>=s&&(p-=s),f<0&&(p+=s);var g=Math.ceil(h/(c+d))+u;return g>=r&&(u-=r),g<0&&(u+=r),{slotY:h+u*(c+d),slotX:a+p*(l+d),col:p,row:u}},n.prototype.updateContent=function(t,o){void 0===t&&(t={col:0,row:0}),void 0===o&&(o={x:0,y:0});var n,i,e=this.props,s=e.slotConfig,r=e.contentConfig,a=e.config.contentSize,h=r.contentCols,l=(i=(t.row+o.y*s.slotRows)%r.contentRows)*h+(n=(t.col+o.x*s.slotCols)%h);return l<0&&(l+=a),l>a&&(l=null),{contentCol:n,contentRow:i,contentId:l}},n.prototype.render=function(){var t=this.props.render;return h("li",{className:"infinite-wall-slot",ref:this.ref},t({data:{id:this.id,contentId:this.state.contentId}}))},n}(o.PureComponent);module.exports=e;
//# sourceMappingURL=index.js.map