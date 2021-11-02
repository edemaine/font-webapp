class FontWebapp
  constructor: (@options) ->
    unless @render?
      console.warn "Abstract FontWebapp doesn't do any rendering"
    unless @options?
      throw new Error "FontWebapp requires options argument"
    @furls = @options.furls
    unless @furls?
      @furls = (new (@options.Furls ? Furls))
      .addInputs()
      .syncState()
      .syncClass()
    unless @options.root?
      throw new Error "FontWebapp requires 'root' option"
    ## DOM initialization
    @root = findDOM @options.root
    @initDOM?()
    @options.init?.call @
    ## Automatic resizing
    if @resize?
      window.addEventListener 'resize', @resize.bind @
      @resize()
    ## First and future renders
    if @render?
      @furls.on 'stateChange', @furlsCallback = (changed) =>
        state = @furls.getState()
        if @options.shouldRender?
          return unless @options.shouldRender.call @, changed, state
        @render state
      @render @furls.getState()
  @downloadFile: (filename, content, contentType) ->
    unless @downloadA?
      @downloadA = document.createElement 'a'
      @downloadA.id = 'download'
      @downloadA.style.display = 'none'
      document.body.appendChild @downloadA
    @downloadA.href = URL.createObjectURL new Blob [content], type: contentType
    @downloadA.download = filename
    @downloadA.click()
    @downloadA.href = ''  # allow garbage collection of blob
  downloadFile: (filename, content, contentType) ->
    @constructor.downloadFile filename, content, contentType
  destroy: ->
    @furls.off 'stateChange', @furlsCallback if @furlsCallback?

class FontWebappSVG extends FontWebapp
  initDOM: ->
    SVGJS = @options.SVG ? SVG
    if @options.rootSVG?
      @svg = SVGJS @options.rootSVG
    else
      @svg = SVGJS().addTo @root
    @renderGroup = @svg.group()
  resize: ->
    offset = getOffset @root
    height = Math.max (@options.minHeight ? 100), window.innerHeight - offset.y
    @root.style.height = "#{height}px"
  render: (state = @furls.getState()) ->
    @renderGroup.clear()
    y = 0
    xmax = 0
    for line in state.text.split '\n'
      x = 0
      dy = 0
      row = []
      for char, c in line
        if char == ' ' and @options.spaceWidth?
          x += @options.spaceWidth
        else if (glyph = @options.renderChar.call @, char, state, @renderGroup)?
          x += @options.charKern unless c == 0 if @options.charKern?
          glyph.element.translate x - (glyph.x ? 0), y - (glyph.y ? 0)
          row.push glyph
          x += glyph.width
          xmax = Math.max xmax, x
          dy = Math.max dy, glyph.height
        else
          console.warn "Unrecognized character '#{char}'"
      ## Bottom alignment
      for glyph in row
        shiftY = dy - glyph.height
        continue unless shiftY
        if glyph.shiftY?
          glyph.shiftY shiftY
        else
          glyph.element.transform (translateY: shiftY), true
      y += dy + (@options.lineKern ? 0)
    margin = @options.margin ? 0
    @svg.viewbox
      x: -margin
      y: -margin
      width: xmax + 2*margin
      height: y + 2*margin
  destroy: ->
    super()
    if @options.rootSVG?
      @renderGroup.clear().remove()
    else
      @svg.clear().remove()
  downloadSVG: (filename, content = @svg.svg()) ->
    @downloadFile filename, content, 'image/svg+xml'

class FontWebappHTML extends FontWebapp
  sliderDefaults:
    text: 'Character size'
    textSize: 12
    textGap: 2
    thumbBorderColor: '#000'
    thumbBorderRadius: 5
    thumbBorderWidth: 2
    thumbWidth: 15
    thumbHeight: 30
    thumbShadow: 2
    trackBorderColor: '#000'
    trackBorderRadius: 2
    trackBorderWidth: 1.4
    trackHeight: 7
    trackColor: '#bbb'
    trackFocusColor: '#c8c8c8'
    trackShadow: 1
  initDOM: ->
    @slider = Object.assign {}, @sliderDefaults, @options.slider
    @charClass = @options.spaceClass or 'char'
    @spaceClass = @options.spaceClass or 'space'
    document.head.appendChild (@sizeStyle = document.createElement 'style')
    @charWidth = @options.charWidth ? 100

    return @updateSize() unless @options.sizeSlider
    @sizeSlider = findDOM @options.sizeSlider
    unless (id = @sizeSlider.getAttribute 'id')
      @sizeSlider.setAttribute 'id', (id = 'sizeSlider')
    @sizeSlider.innerHTML = ''
    @sizeSlider.appendChild (text = document.createElement 'span')
    text.innerHTML = @slider.text
    @sizeSlider.appendChild (@sizeInput = document.createElement 'input')
    @sizeInput.type = 'range'
    @sizeInput.step = 'any'  # allow non-integer offsets from min
    @sizeInput.min = @slider.min =
      @slider.trackBorderRadius + @slider.thumbWidth / 2
    @sizeInput.addEventListener 'input', => @updateSize()
    document.head.appendChild (sliderStyle = document.createElement 'style')
    ## Based on http://danielstern.ca/range.css/ and
    ## https://github.com/danielstern/range.css/blob/master/app/less/range.less
    sliderStyle.innerHTML = """
      ##{id} {
        width: 100%;
        position: relative;
      }
      ##{id} > span {
        position: absolute;
        font-size: #{@slider.textSize}px;
        top: #{-@slider.textSize - @slider.textGap +
               (@slider.thumbHeight - @slider.trackHeight) / 2}px;
      }
      @supports (-moz-appearance:none) {
        ##{id} > span {
        }
      }
      ##{id} > input {
        width: 100%;
        height: #{@slider.thumbHeight}px;
        margin: 0;
        background-color: transparent;
        -webkit-appearance: none;
      }
      ##{id} > input:focus {
        outline: none;
      }
    """ + (
      for pseudo in ['-webkit-slider-runnable-track', '-moz-range-track',
                     '-webkit-slider-thumb', '-moz-range-thumb']
        if pseudo.endsWith 'track'
          """
            ##{id} > input::#{pseudo} {
              background: #{@slider.trackColor};
              width: 100%;
              height: #{@slider.trackHeight}px;
              border: #{@slider.trackBorderWidth}px solid #{@slider.trackBorderColor};
              border-radius: #{@slider.trackBorderRadius}px;
              box-shadow: 0 #{@slider.trackShadow}px #{@slider.trackShadow}px #000;
              cursor: pointer;
              z-index: 1;
            }
            ##{id} > input:focus::#{pseudo} {
              background: #{@slider.trackFocusColor};
            }
          """
        else #if pseudo.endsWith 'thumb'
          """
            ##{id} > input::#{pseudo} {
              #{if pseudo == '-webkit-slider-thumb'
                """margin-top: #{-@slider.trackBorderWidth +
                @slider.trackHeight / 2 - @slider.thumbHeight / 2}px;"""
              else ''}\
              -webkit-appearance: none;
              width: #{@slider.thumbWidth}px;
              height: #{@slider.thumbHeight}px;
              background: #841a9b;
              border: #{@slider.thumbBorderWidth}px solid #{@slider.thumbBorderColor};
              border-radius: #{@slider.thumbBorderRadius}px;
              box-shadow: 0 #{@slider.thumbShadow}px #{@slider.thumbShadow}px #000;
              cursor: pointer;
            }
          """
    ).join '\n'
    ## Set input's max value after it's styled to width: 100%.
    @sizeResize()
    ## Set input's value after max value set.
    @sizeInput.value = @charWidth
    ## Set initial character size, which might be smaller if default is above
    ## max value for this screen width.
    @updateSize()
    ## Update size whenever input resizes.  This can happen outside of
    ## window resize events e.g. because a scrollbar appears/disappears.
    if ResizeObserver?
      @resizeObserver = new ResizeObserver (entries) =>
        for entry in entries when entry.target == @sizeInput
          if @sizeResize entry.borderBoxSize.inlineSize
            @updateSize()
      @resizeObserver.observe @sizeInput
  resize: ->
    ## Update input's max value to current screen width.
    if @sizeResize()
      ## In case this clipped input's value, resize.
      @updateSize()
  sizeResize: (width = @sizeInput.getBoundingClientRect().width) ->
    max = width - @slider.min
    if @sizeInput? and @sizeInput?.max != max
      @sizeInput?.max = max
  updateSize: ->
    @charWidth = parseFloat @sizeInput.value if @sizeInput?
    scale = @charWidth / @options.charWidth
    styles = ["""
      .char {
        display: inline-block;
        box-sizing: border-box;
        width: #{@charWidth}px;
      }
      .char > * { vertical-align: bottom; }
    """]
    for pad in ['charPadding', 'charPaddingLeft', 'charPaddingRight',
                'charPaddingTop', 'charPaddingBottom']
      if @options[pad]
        prop = pad
        .replace /^charP/, 'p'
        .replace /[LR]/, (m) -> "-#{m.toLowerCase()}"
        styles.push """
          .char { #{prop}: #{@options[pad] * scale}px; }
        """
    if @options.charKern
      styles.push """
        .char { margin-right: #{@options.charKern * scale}px; }
        .char:last-child { margin-right: 0 }
      """
    if @options.lineKern
      styles.push """
        .line { margin-bottom: #{@options.lineKern * scale}px; }
      """
    if @options.spaceWidth
      styles.push """
        .space {
          display: inline-block;
          margin-right: #{@options.spaceWidth * scale}px;
        }
      """
    styles.push ''
    @sizeStyle.innerHTML = styles.join '\n'
  render: (state = @furls.getState()) ->
    chars = {} if @options.linkIdenticalChars?
    @root.innerHTML = '' ## clear previous children
    for line in state.text.split '\n'
      @root.appendChild (outputLine = document.createElement 'div')
      outputLine.className = 'line'
      for char, c in line
        div = document.createElement 'div'
        if char == ' ' and @options.spaceWidth?
          div.className = 'space'
          outputLine.appendChild div
        else if (glyph = @options.renderChar.call @, char, state, div)?
          div.className = 'char'
          outputLine.appendChild div
          if @options.linkIdenticalChars?
            chars[char] ?= []
            chars[char].push glyph
        else
          console.warn "Unknown character '#{char}'"
    if @options.linkIdenticalChars?
      for char, glyphs of chars
        @options.linkIdenticalChars glyphs, char
  destroy: ->
    super()
    @root.innerHTML = ''
    @sizeSlider.innerHTML = ''
    @resizeObserver?.disconnect()

## Based on https://stackoverflow.com/a/34014786/7797661
getOffset = (el) ->
  x = y = 0
  while el and not isNaN(el.offsetLeft) and not isNaN(el.offsetTop)
    x += el.offsetLeft - el.scrollLeft + el.clientLeft
    y += el.offsetTop - el.scrollTop + el.clientTop
    el = el.offsetParent
  {x, y}

findDOM = (selector) ->
  if typeof selector == 'string'
    document.querySelector selector
  else
    selector

exports = {FontWebapp, FontWebappHTML, FontWebappSVG}
module?.exports = exports
window[key] = value for key, value of exports if window?
