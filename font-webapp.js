(function() {
  var FontWebapp, FontWebappHTML, FontWebappSVG, exports, findDOM, getOffset, key, value;

  FontWebapp = class FontWebapp {
    constructor(options) {
      var ref, ref1;
      this.options = options;
      if (this.render == null) {
        console.warn("Abstract FontWebapp doesn't do any rendering");
      }
      if (this.options == null) {
        throw new Error("FontWebapp requires options argument");
      }
      this.furls = this.options.furls;
      if (this.furls == null) {
        this.furls = (new ((ref = this.options.Furls) != null ? ref : Furls)()).addInputs().syncState().syncClass();
      }
      if (this.options.root == null) {
        throw new Error("FontWebapp requires 'root' option");
      }
      //# DOM initialization
      this.root = findDOM(this.options.root);
      if (typeof this.initDOM === "function") {
        this.initDOM();
      }
      if ((ref1 = this.options.init) != null) {
        ref1.call(this);
      }
      //# Automatic resizing
      if (this.resize != null) {
        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
      }
      //# First and future renders
      if (this.render != null) {
        this.furls.on('stateChange', this.furlsCallback = (changed) => {
          var state;
          state = this.furls.getState();
          if (this.options.shouldRender != null) {
            if (!this.options.shouldRender.call(this, changed, state)) {
              return;
            }
          }
          return this.render(state);
        });
        this.render(this.furls.getState());
      }
    }

    static downloadFile(filename, content, contentType) {
      if (this.downloadA == null) {
        this.downloadA = document.createElement('a');
        this.downloadA.id = 'download';
        this.downloadA.style.display = 'none';
        document.body.appendChild(this.downloadA);
      }
      this.downloadA.href = URL.createObjectURL(new Blob([content], {
        type: contentType
      }));
      this.downloadA.download = filename;
      this.downloadA.click();
      return this.downloadA.href = ''; // allow garbage collection of blob
    }

    downloadFile(filename, content, contentType) {
      return this.constructor.downloadFile(filename, content, contentType);
    }

    destroy() {
      if (this.furlsCallback != null) {
        return this.furls.off('stateChange', this.furlsCallback);
      }
    }

  };

  FontWebappSVG = class FontWebappSVG extends FontWebapp {
    initDOM() {
      var SVGJS, ref;
      SVGJS = (ref = this.options.SVG) != null ? ref : SVG;
      if (this.options.rootSVG != null) {
        this.svg = SVGJS(this.options.rootSVG);
      } else {
        this.svg = SVGJS().addTo(this.root);
      }
      return this.renderGroup = this.svg.group();
    }

    resize() {
      var height, offset, ref;
      offset = getOffset(this.root);
      height = Math.max((ref = this.options.minHeight) != null ? ref : 100, window.innerHeight - offset.y);
      return this.root.style.height = `${height}px`;
    }

    render(state = this.furls.getState()) {
      var c, char, dy, glyph, i, j, k, len, len1, len2, line, margin, ref, ref1, ref2, ref3, ref4, row, shiftY, x, xmax, y;
      this.renderGroup.clear();
      y = 0;
      xmax = 0;
      ref = state.text.split('\n');
      for (i = 0, len = ref.length; i < len; i++) {
        line = ref[i];
        x = 0;
        dy = 0;
        row = [];
        for (c = j = 0, len1 = line.length; j < len1; c = ++j) {
          char = line[c];
          if (char === ' ' && (this.options.spaceWidth != null)) {
            x += this.options.spaceWidth;
          } else if ((glyph = this.options.renderChar.call(this, char, state, this.renderGroup)) != null) {
            if (this.options.charKern != null) {
              if (c !== 0) {
                x += this.options.charKern;
              }
            }
            glyph.element.translate(x - ((ref1 = glyph.x) != null ? ref1 : 0), y - ((ref2 = glyph.y) != null ? ref2 : 0));
            row.push(glyph);
            x += glyph.width;
            xmax = Math.max(xmax, x);
            dy = Math.max(dy, glyph.height);
          } else {
            console.warn(`Unrecognized character '${char}'`);
          }
        }
//# Bottom alignment
        for (k = 0, len2 = row.length; k < len2; k++) {
          glyph = row[k];
          shiftY = dy - glyph.height;
          if (!shiftY) {
            continue;
          }
          if (glyph.shiftY != null) {
            glyph.shiftY(shiftY);
          } else {
            glyph.element.transform({
              translateY: shiftY
            }, true);
          }
        }
        y += dy + ((ref3 = this.options.lineKern) != null ? ref3 : 0);
      }
      margin = (ref4 = this.options.margin) != null ? ref4 : 0;
      return this.svg.viewbox({
        x: -margin,
        y: -margin,
        width: xmax + 2 * margin,
        height: y + 2 * margin
      });
    }

    destroy() {
      super.destroy();
      if (this.options.rootSVG != null) {
        return this.renderGroup.clear().remove();
      } else {
        return this.svg.clear().remove();
      }
    }

    downloadSVG(filename, content = this.svg.svg()) {
      return this.downloadFile(filename, content, 'image/svg+xml');
    }

  };

  FontWebappHTML = (function() {
    var ref;

    class FontWebappHTML extends FontWebapp {
      initDOM() {
        var id, pseudo, ref, sliderStyle, text;
        this.slider = Object.assign({}, this.sliderDefaults, this.options.slider);
        this.charClass = this.options.spaceClass || 'char';
        this.spaceClass = this.options.spaceClass || 'space';
        document.head.appendChild((this.sizeStyle = document.createElement('style')));
        this.charWidth = (ref = this.options.charWidth) != null ? ref : 100;
        if (!this.options.sizeSlider) {
          return this.updateSize();
        }
        this.sizeSlider = findDOM(this.options.sizeSlider);
        if (!(id = this.sizeSlider.getAttribute('id'))) {
          this.sizeSlider.setAttribute('id', (id = 'sizeSlider'));
        }
        this.sizeSlider.innerHTML = '';
        this.sizeSlider.appendChild((text = document.createElement('span')));
        text.innerHTML = this.slider.text;
        this.sizeSlider.appendChild((this.sizeInput = document.createElement('input')));
        this.sizeInput.type = 'range';
        this.sizeInput.step = 'any'; // allow non-integer offsets from min
        this.sizeInput.min = this.slider.min = this.slider.trackBorderRadius + this.slider.thumbWidth / 2;
        this.sizeInput.addEventListener('input', () => {
          return this.updateSize();
        });
        document.head.appendChild((sliderStyle = document.createElement('style')));
        //# Based on http://danielstern.ca/range.css/ and
        //# https://github.com/danielstern/range.css/blob/master/app/less/range.less
        sliderStyle.innerHTML = `#${id} {
  width: 100%;
  position: relative;
}
#${id} > span {
  position: absolute;
  font-size: ${this.slider.textSize}px;
  top: ${-this.slider.textSize - this.slider.textGap + (this.slider.thumbHeight - this.slider.trackHeight) / 2}px;
}
@supports (-moz-appearance:none) {
  #${id} > span {
  }
}
#${id} > input {
  width: 100%;
  height: ${this.slider.thumbHeight}px;
  margin: 0;
  background-color: transparent;
  -webkit-appearance: none;
}
#${id} > input:focus {
  outline: none;
}` + ((function() {
          var i, len, ref1, results;
          ref1 = ['-webkit-slider-runnable-track', '-moz-range-track', '-webkit-slider-thumb', '-moz-range-thumb'];
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            pseudo = ref1[i];
            if (pseudo.endsWith('track')) {
              results.push(`#${id} > input::${pseudo} {
  background: ${this.slider.trackColor};
  width: 100%;
  height: ${this.slider.trackHeight}px;
  border: ${this.slider.trackBorderWidth}px solid ${this.slider.trackBorderColor};
  border-radius: ${this.slider.trackBorderRadius}px;
  box-shadow: 0 ${this.slider.trackShadow}px ${this.slider.trackShadow}px #000;
  cursor: pointer;
  z-index: 1;
}
#${id} > input:focus::${pseudo} {
  background: ${this.slider.trackFocusColor};
}`);
            } else {
              results.push(`#${id} > input::${pseudo} {
  ${pseudo === '-webkit-slider-thumb' ? `margin-top: ${-this.slider.trackBorderWidth + this.slider.trackHeight / 2 - this.slider.thumbHeight / 2}px;` : ''}-webkit-appearance: none;
  width: ${this.slider.thumbWidth}px;
  height: ${this.slider.thumbHeight}px;
  background: #841a9b;
  border: ${this.slider.thumbBorderWidth}px solid ${this.slider.thumbBorderColor};
  border-radius: ${this.slider.thumbBorderRadius}px;
  box-shadow: 0 ${this.slider.thumbShadow}px ${this.slider.thumbShadow}px #000;
  cursor: pointer;
}`);
            }
          }
          return results;
        }).call(this)).join('\n');
        //# Set input's max value after it's styled to width: 100%.
        this.sizeResize();
        //# Set input's value after max value set.
        this.sizeInput.value = this.charWidth;
        //# Set initial character size, which might be smaller if default is above
        //# max value for this screen width.
        this.updateSize();
        //# Update size whenever input resizes.  This can happen outside of
        //# window resize events e.g. because a scrollbar appears/disappears.
        if (typeof ResizeObserver !== "undefined" && ResizeObserver !== null) {
          this.resizeObserver = new ResizeObserver((entries) => {
            var entry, i, len, results;
            results = [];
            for (i = 0, len = entries.length; i < len; i++) {
              entry = entries[i];
              if (entry.target === this.sizeInput) {
                if (this.sizeResize(entry.borderBoxSize.inlineSize)) {
                  results.push(this.updateSize());
                } else {
                  results.push(void 0);
                }
              }
            }
            return results;
          });
          return this.resizeObserver.observe(this.sizeInput);
        }
      }

      resize() {
        //# Update input's max value to current screen width.
        if (this.sizeResize()) {
          //# In case this clipped input's value, resize.
          return this.updateSize();
        }
      }

      sizeResize(width = (ref = this.sizeInput) != null ? ref.getBoundingClientRect().width : void 0) {
        var max, ref1;
        if (width) { // sizeInput exists and is visible
          max = width - this.slider.min;
        } else {
          max = this.charWidth; // avoid capping desired size
        }
        if ((this.sizeInput != null) && this.sizeInput.max !== max) {
          return (ref1 = this.sizeInput) != null ? ref1.max = max : void 0;
        }
      }

      updateSize() {
        var i, len, pad, prop, ref1, scale, styles;
        if (this.sizeInput != null) {
          this.charWidth = parseFloat(this.sizeInput.value);
        }
        scale = this.charWidth / this.options.charWidth;
        styles = [
          `.char {
  display: inline-block;
  box-sizing: border-box;
  width: ${this.charWidth}px;
}
.char > * { vertical-align: bottom; }`
        ];
        ref1 = ['charPadding', 'charPaddingLeft', 'charPaddingRight', 'charPaddingTop', 'charPaddingBottom'];
        for (i = 0, len = ref1.length; i < len; i++) {
          pad = ref1[i];
          if (this.options[pad]) {
            prop = pad.replace(/^charP/, 'p').replace(/[LR]/, function(m) {
              return `-${m.toLowerCase()}`;
            });
            styles.push(`.char { ${prop}: ${this.options[pad] * scale}px; }`);
          }
        }
        if (this.options.charKern) {
          styles.push(`.char { margin-right: ${this.options.charKern * scale}px; }
.char:last-child { margin-right: 0 }`);
        }
        if (this.options.lineKern) {
          styles.push(`.line { margin-bottom: ${this.options.lineKern * scale}px; }`);
        }
        if (this.options.spaceWidth) {
          styles.push(`.space {
  display: inline-block;
  margin-right: ${this.options.spaceWidth * scale}px;
}`);
        }
        styles.push('');
        return this.sizeStyle.innerHTML = styles.join('\n');
      }

      render(state = this.furls.getState()) {
        var c, char, chars, div, glyph, glyphs, i, j, len, len1, line, outputLine, ref1, results;
        if (this.options.linkIdenticalChars != null) {
          chars = {};
        }
        this.root.innerHTML = ''; //# clear previous children
        ref1 = state.text.split('\n');
        for (i = 0, len = ref1.length; i < len; i++) {
          line = ref1[i];
          this.root.appendChild((outputLine = document.createElement('div')));
          outputLine.className = 'line';
          for (c = j = 0, len1 = line.length; j < len1; c = ++j) {
            char = line[c];
            div = document.createElement('div');
            if (char === ' ' && (this.options.spaceWidth != null)) {
              div.className = 'space';
              outputLine.appendChild(div);
            } else if ((glyph = this.options.renderChar.call(this, char, state, div)) != null) {
              div.className = 'char';
              outputLine.appendChild(div);
              if (this.options.linkIdenticalChars != null) {
                if (chars[char] == null) {
                  chars[char] = [];
                }
                chars[char].push(glyph);
              }
            } else {
              console.warn(`Unknown character '${char}'`);
            }
          }
        }
        if (this.options.linkIdenticalChars != null) {
          results = [];
          for (char in chars) {
            glyphs = chars[char];
            results.push(this.options.linkIdenticalChars(glyphs, char));
          }
          return results;
        }
      }

      destroy() {
        var ref1;
        super.destroy();
        this.root.innerHTML = '';
        this.sizeSlider.innerHTML = '';
        return (ref1 = this.resizeObserver) != null ? ref1.disconnect() : void 0;
      }

    };

    FontWebappHTML.prototype.sliderDefaults = {
      text: 'Character size',
      textSize: 12,
      textGap: 2,
      thumbBorderColor: '#000',
      thumbBorderRadius: 5,
      thumbBorderWidth: 2,
      thumbWidth: 15,
      thumbHeight: 30,
      thumbShadow: 2,
      trackBorderColor: '#000',
      trackBorderRadius: 2,
      trackBorderWidth: 1.4,
      trackHeight: 7,
      trackColor: '#bbb',
      trackFocusColor: '#c8c8c8',
      trackShadow: 1
    };

    return FontWebappHTML;

  }).call(this);

  //# Based on https://stackoverflow.com/a/34014786/7797661
  getOffset = function(el) {
    var x, y;
    x = y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
      x += el.offsetLeft - el.scrollLeft + el.clientLeft;
      y += el.offsetTop - el.scrollTop + el.clientTop;
      el = el.offsetParent;
    }
    return {x, y};
  };

  findDOM = function(selector) {
    if (typeof selector === 'string') {
      return document.querySelector(selector);
    } else {
      return selector;
    }
  };

  exports = {FontWebapp, FontWebappHTML, FontWebappSVG};

  if (typeof module !== "undefined" && module !== null) {
    module.exports = exports;
  }

  if (typeof window !== "undefined" && window !== null) {
    for (key in exports) {
      value = exports[key];
      window[key] = value;
    }
  }

}).call(this);
