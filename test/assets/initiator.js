const script = document.createElement('script');
script.src = './injectedfile.js';
document.body.appendChild(script);

const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = './injectedstyle.css';
document.head.appendChild(style);
