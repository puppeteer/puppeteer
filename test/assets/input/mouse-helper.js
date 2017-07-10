// This injects a box into the page that moves with the mouse;
// Useful for debugging
let box = document.createElement('div');
box.setAttribute('style', [
  'pointer-events: none;',
  'position: absolute;',
  'top: 0;',
  'left:0;',
  'width: 10px;',
  'height: 10px;',
  'background: rgba(0,0,0,.6);'
].join('\n'));
document.body.appendChild(box);
document.addEventListener('mousemove', event => {
  box.style.left = event.pageX + 'px';
  box.style.top = event.pageY + 'px';
}, true);
