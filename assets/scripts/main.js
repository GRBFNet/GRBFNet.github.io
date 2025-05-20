//* ======================== Slide Control ===================== */
var contents = document.getElementsByClassName("slide-content");
var dots = document.querySelectorAll(".slide-menu .dot");

function showSlide(idx) {
  for (var i = 0; i < contents.length; i++) {
    contents[i].style.display = i === idx ? "block" : "none";
    if (dots[i]) dots[i].classList.toggle('active', i === idx);
  }
}

// Dot navigation
if (document.getElementById("slide-menu")) {
  document.getElementById("slide-menu").addEventListener("click", function(e) {
    const idx = [...this.children]
      .filter(el => el.className.indexOf('dot') > -1)
      .indexOf(e.target);
    if (idx >= 0) {
      showSlide(idx);
    }
  });
}

// Button navigation for zoomed image slider
const leftBtns = [
  document.getElementById('img_prev_btn'),
  document.getElementById('img_prev_btn2'),
  document.getElementById('img_prev_btn3'),
  document.getElementById('img_prev_btn4')
];
const rightBtns = [
  document.getElementById('img_next_btn'),
  document.getElementById('img_next_btn2'),
  document.getElementById('img_next_btn3'),
  document.getElementById('img_next_btn4')
];

let currentSlide = 0;
function prevSlide() {
  currentSlide = (currentSlide - 1 + contents.length) % contents.length;
  showSlide(currentSlide);
}
function nextSlide() {
  currentSlide = (currentSlide + 1) % contents.length;
  showSlide(currentSlide);
}
leftBtns.forEach(btn => btn && btn.addEventListener('click', prevSlide));
rightBtns.forEach(btn => btn && btn.addEventListener('click', nextSlide));

//* ======================== Video Control ===================== */
function ToggleVideo(x) {
  var videos = document.getElementsByClassName(x + '-video');
  for (var i = 0; i < videos.length; i++) {
      if (videos[i].paused) {
          videos[i].play();
      } else {
          videos[i].pause();
      }
  }
};


function SlowVideo(x) {
  var videos = document.getElementsByClassName(x + '-video');
  for (var i = 0; i < videos.length; i++) {
    videos[i].playbackRate = videos[i].playbackRate * 0.9;
    videos[i].play();
  }
  
  var msg = document.getElementById(x + '-msg');
  msg.innerHTML = 'Speed: ' + '×' + videos[0].playbackRate.toFixed(2);

  msg.classList.add("fade-in-out");
  msg.style.animation = 'none';
  msg.offsetHeight; /* trigger reflow */
  msg.style.animation = null; };


function FastVideo(x) {
  var videos = document.getElementsByClassName(x + '-video');
  for (var i = 0; i < videos.length; i++) {
    videos[i].playbackRate = videos[i].playbackRate / 0.9;
    videos[i].play();
  }

  var msg = document.getElementById(x + '-msg');
  msg.innerHTML = 'Speed: ' + '×' + videos[0].playbackRate.toFixed(2);

  msg.classList.add("fade-in-out");
  msg.style.animation = 'none';
  msg.offsetHeight; /* trigger reflow */
  msg.style.animation = null; 
};

function RestartVideo(x) {
  var videos = document.getElementsByClassName(x + '-video');
  for (var i = 0; i < videos.length; i++) {
    videos[i].pause();
    videos[i].playbackRate = 1.0;
    videos[i].currentTime = 0;
    videos[i].play();
  }
  
  var msg = document.getElementById(x + '-msg');
  msg.innerHTML = 'Speed: ' + '×' + videos[0].playbackRate.toFixed(2);

  msg.classList.add("fade-in-out");
  msg.style.animation = 'none';
  msg.offsetHeight; /* trigger reflow */
  msg.style.animation = null; 
};

//* ======================== Slide Show Control ===================== */
const slider = document.querySelector('.container .slider');
const [btnLeft, btnRight] = ['prev_btn', 'next_btn'].map(id => document.getElementById(id));
let interval;

// Set positions
const setPositions = () => 
    [...slider.children].forEach((item, i) => 
        item.style.left = `${(i-1) * 440}px`);

// Initial setup
setPositions();

// Set transition speed
const setTransitionSpeed = (speed) => {
    [...slider.children].forEach(item => 
        item.style.transitionDuration = speed);
};

// Slide functions
const next = (isAuto = false) => { 
    setTransitionSpeed(isAuto ? '1.5s' : '0.2s');
    slider.appendChild(slider.firstElementChild); 
    setPositions(); 
};

const prev = () => { 
    setTransitionSpeed('0.2s');
    slider.prepend(slider.lastElementChild); 
    setPositions(); 
};

// Auto slide
const startAuto = () => interval = interval || setInterval(() => next(true), 2000);
const stopAuto = () => { clearInterval(interval); interval = null; };

// Event listeners
btnRight.addEventListener('click', () => next(false));
btnLeft.addEventListener('click', prev);

// Mouse hover controls
[slider, btnLeft, btnRight].forEach(el => {
    el.addEventListener('mouseover', stopAuto);
    el.addEventListener('mouseout', startAuto);
});

// Start auto slide
startAuto();