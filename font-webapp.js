(function() {
  var FontWebapp, FontWebappHTML, FontWebappSVG, exports, findDOM, getOffset, key, value;

  FontWebapp = class FontWebapp {
    constructor(options) {
      var ref, ref1;
      this.options = options;
      if (this.update == null) {
        console.warn("Abstract FontWebapp doesn't do any updating");
      }
      if (this.options == null) {
        throw new Error("FontWebapp requires options argument");
      }
      this.furls = this.options.furls;
      if (this.furls == null) {
        this.furls = (new ((ref = this.options.Furls) != null ? ref : Furls)()).addInputs().syncState();
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
      window.addEventListener('resize', this.resize.bind(this));
      this.resize();
      if (this.update != null) {
        //# First and future renders
        this.furls.on('stateChange', this.update.bind(this));
      }
      if (typeof this.update === "function") {
        this.update();
      }
    }

    resize() {
      var height, offset, ref;
      offset = getOffset(this.root);
      height = Math.max((ref = this.options.minHeight) != null ? ref : 100, window.innerHeight - offset.y);
      return this.root.style.height = `${height}px`;
    }

    downloadFile(filename, content, contentType) {
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

    update(changed) {
      var c, char, dy, glyph, i, j, k, len, len1, len2, line, margin, ref, ref1, ref2, ref3, ref4, row, shiftY, state, x, xmax, y;
      state = this.furls.getState();
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
          } else if ((glyph = this.options.renderChar.call(this, char, state)) != null) {
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

    downloadSVG(filename, content = this.svg.svg()) {
      return this.downloadFile(filename, content, 'image/svg+xml');
    }

  };

  FontWebappHTML = class FontWebappHTML extends FontWebapp {
    initDOM() {}

  };

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
