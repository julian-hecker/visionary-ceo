"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* === Libraries === */
// ------------------------------------------
// Rellax.js
// Buttery smooth parallax library
// Copyright (c) 2016 Moe Amaya (@moeamaya)
// MIT license
//
// Thanks to Paraxify.js and Jaime Cabllero
// for parallax concepts
// ------------------------------------------
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.Rellax = factory();
  }
})(typeof window !== 'undefined' ? window : global, function () {
  var Rellax = function Rellax(el, options) {
    'use strict';

    var self = Object.create(Rellax.prototype);
    var posY = 0;
    var screenY = 0;
    var posX = 0;
    var screenX = 0;
    var blocks = [];
    var pause = true; // check what requestAnimationFrame to use, and if
    // it's not supported, use the onscroll event

    var loop = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.oRequestAnimationFrame || function (callback) {
      return setTimeout(callback, 1000 / 60);
    }; // store the id for later use


    var loopId = null; // Test via a getter in the options object to see if the passive property is accessed

    var supportsPassive = false;

    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function get() {
          supportsPassive = true;
        }
      });
      window.addEventListener('testPassive', null, opts);
      window.removeEventListener('testPassive', null, opts);
    } catch (e) {} // check what cancelAnimation method to use


    var clearLoop = window.cancelAnimationFrame || window.mozCancelAnimationFrame || clearTimeout; // check which transform property to use

    var transformProp = window.transformProp || function () {
      var testEl = document.createElement('div');

      if (testEl.style.transform === null) {
        var vendors = ['Webkit', 'Moz', 'ms'];

        for (var vendor in vendors) {
          if (testEl.style[vendors[vendor] + 'Transform'] !== undefined) {
            return vendors[vendor] + 'Transform';
          }
        }
      }

      return 'transform';
    }(); // Default Settings


    self.options = {
      speed: -2,
      verticalSpeed: null,
      horizontalSpeed: null,
      center: false,
      wrapper: null,
      relativeToWrapper: false,
      round: true,
      vertical: true,
      horizontal: false,
      verticalScrollAxis: 'y',
      horizontalScrollAxis: 'x',
      callback: function callback() {}
    }; // User defined options (might have more in the future)

    if (options) {
      Object.keys(options).forEach(function (key) {
        self.options[key] = options[key];
      });
    } // By default, rellax class


    if (!el) {
      el = '.rellax';
    } // check if el is a className or a node


    var elements = typeof el === 'string' ? document.querySelectorAll(el) : [el]; // Now query selector

    if (elements.length > 0) {
      self.elems = elements;
    } // The elements don't exist
    else {
        console.warn('Rellax: The elements you\'re trying to select don\'t exist.');
        return;
      } // Has a wrapper and it exists


    if (self.options.wrapper) {
      if (!self.options.wrapper.nodeType) {
        var wrapper = document.querySelector(self.options.wrapper);

        if (wrapper) {
          self.options.wrapper = wrapper;
        } else {
          console.warn('Rellax: The wrapper you\'re trying to use doesn\'t exist.');
          return;
        }
      }
    } // Get and cache initial position of all elements


    var cacheBlocks = function cacheBlocks() {
      for (var i = 0; i < self.elems.length; i++) {
        var block = createBlock(self.elems[i]);
        blocks.push(block);
      }
    }; // Let's kick this script off
    // Build array for cached element values


    var init = function init() {
      for (var i = 0; i < blocks.length; i++) {
        self.elems[i].style.cssText = blocks[i].style;
      }

      blocks = [];
      screenY = window.innerHeight;
      screenX = window.innerWidth;
      setPosition();
      cacheBlocks();
      animate(); // If paused, unpause and set listener for window resizing events

      if (pause) {
        window.addEventListener('resize', init);
        pause = false; // Start the loop

        update();
      }
    }; // We want to cache the parallax blocks'
    // values: base, top, height, speed
    // el: is dom object, return: el cache values


    var createBlock = function createBlock(el) {
      var dataPercentage = el.getAttribute('data-rellax-percentage');
      var dataSpeed = el.getAttribute('data-rellax-speed');
      var dataVerticalSpeed = el.getAttribute('data-rellax-vertical-speed');
      var dataHorizontalSpeed = el.getAttribute('data-rellax-horizontal-speed');
      var dataVericalScrollAxis = el.getAttribute('data-rellax-vertical-scroll-axis');
      var dataHorizontalScrollAxis = el.getAttribute('data-rellax-horizontal-scroll-axis');
      var dataZindex = el.getAttribute('data-rellax-zindex') || 0;
      var dataMin = el.getAttribute('data-rellax-min');
      var dataMax = el.getAttribute('data-rellax-max');
      var dataMinX = el.getAttribute('data-rellax-min-x');
      var dataMaxX = el.getAttribute('data-rellax-max-x');
      var dataMinY = el.getAttribute('data-rellax-min-y');
      var dataMaxY = el.getAttribute('data-rellax-max-y'); // initializing at scrollY = 0 (top of browser), scrollX = 0 (left of browser)
      // ensures elements are positioned based on HTML layout.
      //
      // If the element has the percentage attribute, the posY and posX needs to be
      // the current scroll position's value, so that the elements are still positioned based on HTML layout

      var wrapperPosY = self.options.wrapper ? self.options.wrapper.scrollTop : window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop; // If the option relativeToWrapper is true, use the wrappers offset to top, subtracted from the current page scroll.

      if (self.options.relativeToWrapper) {
        var scrollPosY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        wrapperPosY = scrollPosY - self.options.wrapper.offsetTop;
      }

      var posY = self.options.vertical ? dataPercentage || self.options.center ? wrapperPosY : 0 : 0;
      var posX = self.options.horizontal ? dataPercentage || self.options.center ? self.options.wrapper ? self.options.wrapper.scrollLeft : window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft : 0 : 0;
      var blockTop = posY + el.getBoundingClientRect().top;
      var blockHeight = el.clientHeight || el.offsetHeight || el.scrollHeight;
      var blockLeft = posX + el.getBoundingClientRect().left;
      var blockWidth = el.clientWidth || el.offsetWidth || el.scrollWidth; // apparently parallax equation everyone uses

      var percentageY = dataPercentage ? dataPercentage : (posY - blockTop + screenY) / (blockHeight + screenY);
      var percentageX = dataPercentage ? dataPercentage : (posX - blockLeft + screenX) / (blockWidth + screenX);

      if (self.options.center) {
        percentageX = 0.5;
        percentageY = 0.5;
      } // Optional individual block speed as data attr, otherwise global speed


      var speed = dataSpeed ? dataSpeed : self.options.speed;
      var verticalSpeed = dataVerticalSpeed ? dataVerticalSpeed : self.options.verticalSpeed;
      var horizontalSpeed = dataHorizontalSpeed ? dataHorizontalSpeed : self.options.horizontalSpeed; // Optional individual block movement axis direction as data attr, otherwise gobal movement direction

      var verticalScrollAxis = dataVericalScrollAxis ? dataVericalScrollAxis : self.options.verticalScrollAxis;
      var horizontalScrollAxis = dataHorizontalScrollAxis ? dataHorizontalScrollAxis : self.options.horizontalScrollAxis;
      var bases = updatePosition(percentageX, percentageY, speed, verticalSpeed, horizontalSpeed); // ~~Store non-translate3d transforms~~
      // Store inline styles and extract transforms

      var style = el.style.cssText;
      var transform = ''; // Check if there's an inline styled transform

      var searchResult = /transform\s*:/i.exec(style);

      if (searchResult) {
        // Get the index of the transform
        var index = searchResult.index; // Trim the style to the transform point and get the following semi-colon index

        var trimmedStyle = style.slice(index);
        var delimiter = trimmedStyle.indexOf(';'); // Remove 'transform' string and save the attribute

        if (delimiter) {
          transform = ' ' + trimmedStyle.slice(11, delimiter).replace(/\s/g, '');
        } else {
          transform = ' ' + trimmedStyle.slice(11).replace(/\s/g, '');
        }
      }

      return {
        baseX: bases.x,
        baseY: bases.y,
        top: blockTop,
        left: blockLeft,
        height: blockHeight,
        width: blockWidth,
        speed: speed,
        verticalSpeed: verticalSpeed,
        horizontalSpeed: horizontalSpeed,
        verticalScrollAxis: verticalScrollAxis,
        horizontalScrollAxis: horizontalScrollAxis,
        style: style,
        transform: transform,
        zindex: dataZindex,
        min: dataMin,
        max: dataMax,
        minX: dataMinX,
        maxX: dataMaxX,
        minY: dataMinY,
        maxY: dataMaxY
      };
    }; // set scroll position (posY, posX)
    // side effect method is not ideal, but okay for now
    // returns true if the scroll changed, false if nothing happened


    var setPosition = function setPosition() {
      var oldY = posY;
      var oldX = posX;
      posY = self.options.wrapper ? self.options.wrapper.scrollTop : (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
      posX = self.options.wrapper ? self.options.wrapper.scrollLeft : (document.documentElement || document.body.parentNode || document.body).scrollLeft || window.pageXOffset; // If option relativeToWrapper is true, use relative wrapper value instead.

      if (self.options.relativeToWrapper) {
        var scrollPosY = (document.documentElement || document.body.parentNode || document.body).scrollTop || window.pageYOffset;
        posY = scrollPosY - self.options.wrapper.offsetTop;
      }

      if (oldY != posY && self.options.vertical) {
        // scroll changed, return true
        return true;
      }

      if (oldX != posX && self.options.horizontal) {
        // scroll changed, return true
        return true;
      } // scroll did not change


      return false;
    }; // Ahh a pure function, gets new transform value
    // based on scrollPosition and speed
    // Allow for decimal pixel values


    var updatePosition = function updatePosition(percentageX, percentageY, speed, verticalSpeed, horizontalSpeed) {
      var result = {};
      var valueX = (horizontalSpeed ? horizontalSpeed : speed) * (100 * (1 - percentageX));
      var valueY = (verticalSpeed ? verticalSpeed : speed) * (100 * (1 - percentageY));
      result.x = self.options.round ? Math.round(valueX) : Math.round(valueX * 100) / 100;
      result.y = self.options.round ? Math.round(valueY) : Math.round(valueY * 100) / 100;
      return result;
    }; // Remove event listeners and loop again


    var deferredUpdate = function deferredUpdate() {
      window.removeEventListener('resize', deferredUpdate);
      window.removeEventListener('orientationchange', deferredUpdate);
      (self.options.wrapper ? self.options.wrapper : window).removeEventListener('scroll', deferredUpdate);
      (self.options.wrapper ? self.options.wrapper : document).removeEventListener('touchmove', deferredUpdate); // loop again

      loopId = loop(update);
    }; // Loop


    var update = function update() {
      if (setPosition() && pause === false) {
        animate(); // loop again

        loopId = loop(update);
      } else {
        loopId = null; // Don't animate until we get a position updating event

        window.addEventListener('resize', deferredUpdate);
        window.addEventListener('orientationchange', deferredUpdate);
        (self.options.wrapper ? self.options.wrapper : window).addEventListener('scroll', deferredUpdate, supportsPassive ? {
          passive: true
        } : false);
        (self.options.wrapper ? self.options.wrapper : document).addEventListener('touchmove', deferredUpdate, supportsPassive ? {
          passive: true
        } : false);
      }
    }; // Transform3d on parallax element


    var animate = function animate() {
      var positions;

      for (var i = 0; i < self.elems.length; i++) {
        // Determine relevant movement directions
        var verticalScrollAxis = blocks[i].verticalScrollAxis.toLowerCase();
        var horizontalScrollAxis = blocks[i].horizontalScrollAxis.toLowerCase();
        var verticalScrollX = verticalScrollAxis.indexOf('x') != -1 ? posY : 0;
        var verticalScrollY = verticalScrollAxis.indexOf('y') != -1 ? posY : 0;
        var horizontalScrollX = horizontalScrollAxis.indexOf('x') != -1 ? posX : 0;
        var horizontalScrollY = horizontalScrollAxis.indexOf('y') != -1 ? posX : 0;
        var percentageY = (verticalScrollY + horizontalScrollY - blocks[i].top + screenY) / (blocks[i].height + screenY);
        var percentageX = (verticalScrollX + horizontalScrollX - blocks[i].left + screenX) / (blocks[i].width + screenX); // Subtracting initialize value, so element stays in same spot as HTML

        positions = updatePosition(percentageX, percentageY, blocks[i].speed, blocks[i].verticalSpeed, blocks[i].horizontalSpeed);
        var positionY = positions.y - blocks[i].baseY;
        var positionX = positions.x - blocks[i].baseX; // The next two 'if' blocks go like this:
        // Check if a limit is defined (first 'min', then 'max');
        // Check if we need to change the Y or the X
        // (Currently working only if just one of the axes is enabled)
        // Then, check if the new position is inside the allowed limit
        // If so, use new position. If not, set position to limit.
        // Check if a min limit is defined

        if (blocks[i].min !== null) {
          if (self.options.vertical && !self.options.horizontal) {
            positionY = positionY <= blocks[i].min ? blocks[i].min : positionY;
          }

          if (self.options.horizontal && !self.options.vertical) {
            positionX = positionX <= blocks[i].min ? blocks[i].min : positionX;
          }
        } // Check if directional min limits are defined


        if (blocks[i].minY != null) {
          positionY = positionY <= blocks[i].minY ? blocks[i].minY : positionY;
        }

        if (blocks[i].minX != null) {
          positionX = positionX <= blocks[i].minX ? blocks[i].minX : positionX;
        } // Check if a max limit is defined


        if (blocks[i].max !== null) {
          if (self.options.vertical && !self.options.horizontal) {
            positionY = positionY >= blocks[i].max ? blocks[i].max : positionY;
          }

          if (self.options.horizontal && !self.options.vertical) {
            positionX = positionX >= blocks[i].max ? blocks[i].max : positionX;
          }
        } // Check if directional max limits are defined


        if (blocks[i].maxY != null) {
          positionY = positionY >= blocks[i].maxY ? blocks[i].maxY : positionY;
        }

        if (blocks[i].maxX != null) {
          positionX = positionX >= blocks[i].maxX ? blocks[i].maxX : positionX;
        }

        var zindex = blocks[i].zindex; // Move that element
        // (Set the new translation and append initial inline transforms.)

        var translate = 'translate3d(' + (self.options.horizontal ? positionX : '0') + 'px,' + (self.options.vertical ? positionY : '0') + 'px,' + zindex + 'px) ' + blocks[i].transform;
        self.elems[i].style[transformProp] = translate;
      }

      self.options.callback(positions);
    };

    self.destroy = function () {
      for (var i = 0; i < self.elems.length; i++) {
        self.elems[i].style.cssText = blocks[i].style;
      } // Remove resize event listener if not pause, and pause


      if (!pause) {
        window.removeEventListener('resize', init);
        pause = true;
      } // Clear the animation loop to prevent possible memory leak


      clearLoop(loopId);
      loopId = null;
    }; // Init


    init(); // Allow to recalculate the initial values whenever we want

    self.refresh = init;
    return self;
  };

  return Rellax;
});
/**
 * Julian Hecker
 * JavaScript for VisionaryCEO website
 */


if (!isIE()) {
  // execute scrolly things both on page load and on scroll
  window.addEventListener('load', handleScroll);
  window.addEventListener('scroll', handleScroll); // Add event listeners to each link with internal reference

  var scrollLinks = document.querySelectorAll('a[href^="#"]');

  var _loop = function _loop(i) {
    var scrollLink = scrollLinks[i];
    scrollLink.addEventListener('click', function (event) {
      handleClickLink(scrollLink.getAttribute('href'), event);
    });
  };

  for (var i = 0; i < scrollLinks.length; i++) {
    _loop(i);
  }
} else {
  iePolyfill();
}
/**
 * Modals
 * Many thanks to https://webdesign.tutsplus.com/tutorials/how-to-build-flexible-modal-dialogs-with-html-css-and-javascript--cms-33500
 */
// Make buttons open modals


var openButtons = document.querySelectorAll('[data-openmodal]'); // for (let el in openButtons) {

for (var _i = 0; _i < openButtons.length; _i++) {
  var el = openButtons[_i];
  el.addEventListener('click', function () {
    var modalId = this.dataset.openmodal;
    document.getElementById(modalId).classList.add('is-visible');
  });
} // Close modals


var closeButtons = document.querySelectorAll('[data-closemodal]'); // for (let el in closeButtons) {

for (var _i2 = 0; _i2 < closeButtons.length; _i2++) {
  var _el = closeButtons[_i2];

  _el.addEventListener('click', function () {
    var modalId = this.dataset.closemodal;
    document.getElementById(modalId).classList.remove('is-visible');
  });
}

document.addEventListener('click', function (e) {
  if (e.target == document.querySelector('.c-modal.is-visible')) {
    document.querySelector('.c-modal.is-visible').classList.remove('is-visible');
  }
});
document.addEventListener('keyup', function (e) {
  if (e.key == 'Escape' && document.querySelector('.c-modal.is-visible')) {
    document.querySelector('.c-modal.is-visible').classList.remove('is-visible');
  }
});
/**
 * Form Submissions
 */

if (document.querySelectorAll('.js-form')) {
  var forms = document.querySelectorAll('.js-form');

  for (var _i3 = 0; _i3 < forms.length; _i3++) {
    forms[_i3].addEventListener('submit', function (e) {
      handleSubmit(e);
    });
  }
} // Form Submissions
// Many thanks to https://stackoverflow.com/questions/25983603/how-to-submit-html-form-without-redirection/25983643


function handleSubmit(e) {
  var form = e.target;
  var url = form.getAttribute('action');
  var http = new XMLHttpRequest();
  http.open('POST', url, true); // Allow CORS
  // http.setRequestHeader('Access-Control-Allow-Origin', 'Vary');

  http.onload = function () {
    // tell user what happened
    alert(http.responseText); // clear fields

    form.reset(); // redirect to THANK YOU! page

    window.location.href = 'thank.html#';
  };

  http.onerror = function () {
    alert('Form Entry Failed! Try again!');
  };

  http.send(new FormData(form));
  e.preventDefault();
} // Scrolling Links


function handleClickLink(id, event) {
  scrollToElement(id);
  event.preventDefault();
} // Pass in an ID like '#about'


function scrollToElement(id) {
  var navbarHeight = document.querySelector('.js-navbar').offsetHeight; // 64

  var scrollTo = document.querySelector(id).offsetTop; // if scrollTo position is negative, scroll to 0 instead

  window.scrollTo(0, scrollTo - navbarHeight > 0 ? scrollTo - navbarHeight : 0);
}

function flipScrollButton() {
  var scrollButton = document.querySelector('.scroll');

  if (scrollButton) {
    if (window.scrollY > vh(45)) {
      // Magic Number
      scrollButton.classList.add('scroll--rotate');
      scrollButton.setAttribute('href', '#home');
    } else {
      scrollButton.classList.remove('scroll--rotate');
      scrollButton.setAttribute('href', '#about');
    }
  }
} // do on scroll


function handleScroll() {
  showOnEnterViewport();
  showNav();
  flipScrollButton();
}

; // === Helpers === //

function getY(elem) {
  return elem.getBoundingClientRect().top;
} // https://stackoverflow.com/questions/44109314/javascript-calculate-with-viewport-width-height/44109531


function vh(v) {
  var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  return v * h / 100;
} // Helper function from: http://stackoverflow.com/a/7557433/274826


function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();
  return rect.top <= 0 && rect.bottom >= 0 || rect.bottom >= (window.innerHeight || document.documentElement.clientHeight) && rect.top <= (window.innerHeight || document.documentElement.clientHeight) || rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
} // === Show Elements === //


function showOnEnterViewport() {
  // Many thanks to https://cssanimation.rocks/scroll-animations/
  var elementsToShow = document.querySelectorAll('.js-show-on-scroll'); // elementsToShow.forEach(function(elem) {
  //     if (isElementInViewport(elem)) {
  //         elem.classList.add('is-visible');
  //     } else {
  //         elem.classList.remove('is-visible');
  //     }
  // });

  for (var _i4 = 0; _i4 < elementsToShow.length; _i4++) {
    var elem = elementsToShow[_i4];

    if (isElementInViewport(elem)) {
      elem.classList.add('is-visible');
    } else {// to make animations permanent: don't remove visibility
      // elem.classList.remove('is-visible');
    }
  }
}

function showNav() {
  var navbar = document.querySelector('.js-navbar'); // Show navbar if you're scrolled down a little

  if (window.scrollY > vh(10)) {
    navbar.classList.remove('nav-bar--transparent');
  } else {
    // Only allowed to hide navbar if it's not open
    if (!navbar.querySelector('.nav-bar__nav--active')) {
      navbar.classList.add('nav-bar--transparent');
    }
  }
}

function toggleNav() {
  document.querySelector('.js-nav-bar-button').classList.toggle('nav-bar__button--active');
  document.querySelector('.js-nav-bar-nav').classList.toggle('nav-bar__nav--active');
  document.querySelector('.js-navbar').classList.toggle('nav-bar--active'); // Can't be transparent when opened

  var transparent = document.querySelector('.nav-bar--transparent');

  if (transparent) {
    transparent.classList.remove('nav-bar--transparent');
  }
} // === Poly Fills === //


function isIE() {
  var sUsrAg = navigator.userAgent;

  if (sUsrAg.indexOf('Trident') > -1 || sUsrAg.indexOf('MSIE') > -1) {
    return true;
  } else if (sUsrAg.indexOf('Edge') > -1) {
    return false; // Edge is decent compared to IE
  } else {
    return false;
  }
}

function iePolyfill() {
  // Force navbar visible because not smart IE
  var navbar = document.querySelector('.js-navbar');
  navbar.style.opacity = 1;
  navbar.style.pointerEvents = 'auto';
  navbar.classList.remove('nav-bar--transparent');
  navbar.style.padding = '3rem 0';
  navbar.style.position = 'relative'; // Actually no
  // shove navbar button to right on IE

  var button = document.querySelector('.nav-bar__button');
  button.style.marginLeft = 'auto'; // Force all 'on-scroll' items visible because IE >:(

  var animated = document.querySelectorAll('.js-show-on-scroll');

  for (var _i5 = 0; _i5 < animated.length; _i5++) {
    animated[_i5].classList.add('is-visible');
  } // remove carousels because IE


  var carousels = document.querySelectorAll('.carousel.section');

  for (var _i6 = 0; _i6 < carousels.length; _i6++) {
    carousels[_i6].parentNode.removeChild(carousels[_i6]);
  } // adjust position of page breadcrumbs cuz dumb IE


  var breadcrumbs = document.querySelector('.banner__content.container');

  if (breadcrumbs) {
    breadcrumbs.getElementsByClassName.top = '4.5rem';
  } // remove scroll button on dumb IE


  var scroll = document.querySelector('.scroll');

  if (scroll) {
    scroll.style.display = 'none';
  } // Remove all instances of parallax if there are any


  setTimeout(function () {
    if (rellaxBg) {
      rellaxBg.destroy();
    }
  }, 100);
}