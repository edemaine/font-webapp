class FontWebapp
  constructor: (@options) ->
    unless @update?
      console.warn "Abstract FontWebapp doesn't do any updating"
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
    window.addEventListener 'resize', @resize.bind @
    @resize()
    ## First and future renders
    @furls.on 'stateChange', @update.bind @ if @update?
    @update?()
  resize: ->
    offset = getOffset @root
    height = Math.max (@options.minHeight ? 100), window.innerHeight - offset.y
    @root.style.height = "#{height}px"
  downloadFile: (filename, content, contentType) ->
    unless @downloadA?
      @downloadA = document.createElement 'a'
      @downloadA.id = 'download'
      @downloadA.style.display = 'none'
      document.body.appendChild @downloadA
    @downloadA.href = URL.createObjectURL new Blob [content], type: contentType
    @downloadA.download = filename
    @downloadA.click()
    @downloadA.href = ''  # allow garbage collection of blob

class FontWebappSVG extends FontWebapp
  initDOM: ->
    SVGJS = @options.SVG ? SVG
    if @options.rootSVG?
      @svg = SVGJS @options.rootSVG
    else
      @svg = SVGJS().addTo @root
    @renderGroup = @svg.group()
  update: (changed) ->
    state = @furls.getState()
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
  downloadSVG: (filename, content = @svg.svg()) ->
    @downloadFile filename, content, 'image/svg+xml'

class FontWebappHTML extends FontWebapp
  initDOM: ->

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
