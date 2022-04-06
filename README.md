# font-webapp: Framework for webapps demoing JavaScript-rendered fonts

This framework aims to make it easier to write font webapps in the style of
[Erik Demaine and Martin Demaine's Mathematical and Puzzle Fonts/Typefaces](https://erikdemaine.org/fonts/).

In particular, the following webapps currently use font-webapp:

* [Cube Folding Font](https://erikdemaine.org/fonts/cubefolding/)
  ([code](https://github.com/edemaine/font-cubefolding))
* [Impossible Folding Font](https://erikdemaine.org/fonts/impossible/)
  ([code](https://github.com/edemaine/font-impossible/))
* [Juggling Font](https://erikdemaine.org/fonts/juggling/)
  ([code](https://github.com/edemaine/font-juggling/))
* [Spiral Galaxies Font](https://erikdemaine.org/fonts/spiralgalaxies/)
  ([code](https://github.com/edemaine/font-spiralgalaxies))
* [Tatamibari Font](https://erikdemaine.org/fonts/tatamibari/)
  ([code](https://github.com/edemaine/font-tatamibari))

These webapps have a common structure:

* Text input field where the user can input a custom message
* Automatic rendering of text within the selected font
  (via some typeface-specific JavaScript code,
   typically in SVG via [SVG.js](https://svgjs.dev/))
* Options to select font within the typeface
* Automatic tracking of text and options in URL query
  (via [furls](https://github.com/edemaine/furls))

The bulk of this framework is for positioning multiple glyphs to make the
input text (a simple typography system).
The updating triggered by form inputs (and URL sychronization) is handled by
[furls](https://github.com/edemaine/furls), but this framework automates the
call to furls for you if you want.

## Usage

You need to include `<script>` tags for `furls.js` and `font-webapp.js`.
This will make several top-level classes available:

### FontWebapp

`FontWebapp` is an abstract base class, so you shouldn't create one directly.
The following options can be specified for any derived class:

* `root` (**required**): DOM element or string query for DOM element
  (e.g. `"#output"`) for `<div>` that will contain the rendering.
  This element is automatically sized to fill the remainder of the screen
  (after whatever appears above the root element).
* `init()`: a function to call when the app is setup.
  For example, you might create symbols or groups for later rendering.
  Called with `this` set to the `FontWebapp` instance.
* `furls`: an instance of `Furls` if you want to initialize it yourself.
  By default, one is created and called with `.addInputs()`, `.syncState()`,
  and `.syncClass()`.
* `Furls` (default `window.Furls`): reference to `Furls` class
  from [furls](https://github.com/edemaine/furls) library.
* `shouldRender(changed, state)`: a function that decides whether the text
  needs to be rerendered from scratch, where `changed` is an object with a
  key for each changed input (the argument from the
  [furls `stateChange` event](https://github.com/edemaine/furls#events))
  and `state` is the current state of all inputs (from `furls.getState()`).
  The default behavior is "always render".
  Often it is helpful to define this function as an OR of various `changed`
  fields, such as `(changed) => changed.text || changed.puzzle`,
  that require explicit rerendering, while in other cases, implicitly modify
  the existing rendering using CSS classes from [furls class
  synchronization](https://github.com/edemaine/furls#class-synchronization).

In addition, a `FontWebapp` instance provides the following properties and
methods:

* `options`: the provided options object
* `root`: DOM element referred to by `options.root`
* `furls`: Furls instance
* `render()`: Force rerendering of text
* `destroy()`: Destroy any DOM/SVG rendered by this webapp
* `downloadFile(filename, content, contentType)`: Cause the user to download a
  file with the specified `filename`, `content` (string), and `contentType`.
  Also available as `FontWebapp.downloadFile()` in case you want to download
  a file without/before creating a `FontWebapp` instance.

### FontWebappSVG

`new FontWebappSVG(options)` creates a new reactive app with SVG font rendering.
For this renderer, you need to include a `<script>` tag for `svg.js`
(from [SVG.js](https://svgjs.dev/)).

`options` can be an object with any of the generic options above, plus
the following SVG-specific options:

* `renderChar(char, state, target)` (**required**): a function that renders a
  given character into SVG and returns a glyph object with details for layout.
  Called with `this` set to the `FontWebappSVG` instance,
  with `char` equal to a single-character string,
  `state` equal to the latest result from `furls.getState()`, and
  `target` equal to an SVG.js Group to render into
  (equal to `this.renderGroup`).
  The returned glyph can be `null`/`undefined` to indicate "font doesn't have
  that character", or an object with the following properties:
  * `element` (**required**): an SVG.js object representing the glyph.
    If the glyph consists of multiple SVG objects, wrap them in an
    `SVG.G` group and return that.
    This element shouldn't have a transform applied to it,
    as the framework will set a translation to position the glyph.
  * `width` (**required**): width of glyph for layout purposes, in SVG units.
    Shouldn't include "overhangs" that should intrude into adjacent characters.
  * `height` (**required**): height of glyph for layout purposes, in SVG units.
    Shouldn't include depth that should intrude into adjacent lines.
  * `x` (default `0`): minimum *x* coordinate.
  * `y` (default `0`): minimum *y* coordinate.
  * `shiftY(shift)`: shift the `element` or some portion of it vertically
    by a specified `shift` in order to align the bottoms of glyphs.
    Default behavior is to translate the entire `element`.
* `spaceWidth`: horizontal space to leave for a space character, in SVG units.
  Unless specified, space characters are handled like any other character.
* `charKern` (default `0`): horizontal space to add between characters,
  in SVG units.
* `lineKern` (default `0`): vertical space to add between lines, in SVG units.
* `rootSVG`: DOM element or string query for DOM element for existing `<svg>`
  element (within the `options.root` element) to use for rendering.
  Use this if you want to predefine `<defs>` or `<symbol>`s or `<style>`
  in the DOM.  Otherwise, a root `<svg>` element is created automatically
  within the `options.root` element.
* `SVG` (default `window.SVG`): reference to `SVG` class from
  [SVG.js](https://svgjs.dev/).
* `minHeight` (default 100): minimum number of pixels for `root` element's
  vertical size.

In addition, a `FontWebappSVG` instance provides the following properties and
methods:

* `svg`: an SVG.js instance.
* `renderGroup`: an SVG.js Group where the text is currently rendered
  (cleared for each render).
* `downloadSVG(filename, content)`: Cause the user to download an SVG file
  with the specified `filename` and `content` (string), where `content`
  defaults to a raw dump of the current rendered SVG (`svg.svg()`).

### FontWebappHTML

`new FontWebappHTML(options)` creates a new reactive app with HTML font
rendering, where

* Each line is represented by a `<div class="line">` container.
* Within each line, a glyph is represented by a `<div class="char">`
  containing arbitrary content.
* Within each line, a space is represented by a `<div class="space">`.

`options` can be an object with any of the generic options above, plus
the following SVG-specific options:

* `renderChar(char, state, target)` (**required**): a function that renders a
  given character into HTML and returns an arbitrary glyph object.
  Called with `this` set to the `FontWebappHTML` instance,
  with `char` equal to a single-character string,
  `state` equal to the latest result from `furls.getState()`, and
  `target` equal to an HTML element to render into.
  The returned glyph can be `null`/`undefined` to indicate "font doesn't have
  that character", or an arbitrary object.
  Any rendered elements should be added to `target`, e.g., via
  `target.appendChild(element)`.
* `linkIdenticalChars(glyphs, char)`: a function to call with all rendered
  glyphs (an array of `glyphs` as returned by `renderChar`) of the same
  character `char`. This can be useful to link together multiple renderings
  of the same character.
* `charWidth` (default `150`): horizontal size of every glyph
  (`<div class="char">`), in px units.
* `spaceWidth`: horizontal space to leave for a space character, in px units.
  Unless specified, space characters are handled like any other character.
* `charPadding` (default `0`): padding space to add around all sides of all
  characters, in px units.
* `charPaddingLeft`, `charPaddingRight`, `charPaddingTop`, `charPaddingBottom`
  (default `0`): padding space to add around specific sides of all characters,
  in px units.
* `charKern` (default `0`): horizontal space to add between characters,
  in px units.
* `lineKern` (default `0`): vertical space to add between lines, in px units.
* `sizeSlider`: DOM element or string query for DOM element (e.g. `"#size"`)
  for `<div>` to add a full-width slider to that controls character size.
  The initial value of the slider is `charWidth` (possibly clipped to be at
  most the slider width); dragging the slider effectively scales all px sizes
  above, including `charWidth`, `spaceWidth`, `charPadding*`, `charKern`, and
  `lineKern`.
* `sizeName`: `name` attribute for `<input type="range">` made by `sizeSlider`.
  This causes the size to be tracked by Furls and thus preserved in the URL.
* `slider`: visual configuration for the created `sizeSlider`, which consists
  of a "thumb" that moves along a "track", plus a text label above it.
  All of the following options are in px units unless otherwise specified.
  * `text` (default `'Character size'`): label above the slider
  * `textSize` (default `12`): font size for label
  * `textGap` (default `2`): space between label and track
  * `thumbBorderColor` (default `'#000'`): thumb outline color
  * `thumbBorderRadius` (default `5`): thumb outline rounding
  * `thumbBorderWidth` (default `2`): thumb outline thickness
  * `thumbWidth` (default `15`): thumb horizontal size, including outline
  * `thumbHeight` (default `30`): thumb vertical size, including outline
  * `thumbShadow` (default `2`): thumb shadow size
  * `trackBorderColor` (default `'#000'`): track outline color
  * `trackBorderRadius` (default `2`): track outline rounding
  * `trackBorderWidth` (default `1.4`): track outline thickness
  * `trackHeight` (default `7`): track vertical size, including outline
  * `trackColor` (default `'#bbb'`): track color
  * `trackFocusColor` (default `'#c8c8c8'`): track color when focused (clicked)
  * `trackShadow` (default `1`): track shadow size
