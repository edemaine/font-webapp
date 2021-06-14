# font-webapp: Framework for webapps demoing JavaScript-rendered fonts

This framework aims to make it easier to write font webapps in the style of
[Erik Demaine and Martin Demaine's Mathematical and Puzzle Fonts/Typefaces](https://erikdemaine.org/fonts/).

In particular, the following webapps currently use font-webapp:

* [Cube Folding Font](https://erikdemaine.org/fonts/cubefolding/)
  ([code](https://github.com/edemaine/font-cubefolding))
* [Impossible Folding Font](https://erikdemaine.org/fonts/impossible/)
  ([code](https://github.com/edemaine/font-impossible/))

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
  (e.g. `"#output"`) for `div` that will contain the rendering.
  This element is automatically sized to fill the remainder of the screen
  (after whatever appears above the root element).
* `minHeight` (default 100): minimum number of pixels for `root` element's
  vertical size.
* `init()`: a function to call when the app is setup.
  For example, you might create symbols or groups for later rendering.
  Called with `this` set to the `FontWebapp` instance.
* `furls`: an instance of `Furls` if you want to initialize it yourself.
  By default, one is created and called with `.addInputs()` and `.syncState()`.
* `Furls` (default `window.Furls`): reference to `Furls` class
  from [furls](https://github.com/edemaine/furls) library.

### FontWebappSVG

`new FontWebappSVG(options)` creates a new reactive app with SVG font rendering.
For this renderer, you need to include a `<script>` tag for `svg.js`
(from [SVG.js](https://svgjs.dev/)).

`options` can be an object with any of the generic options above, plus
the following SVG-specific options:

* `renderChar(char, state)` (**required**): a function that renders a given
  character into SVG and returns a glyph object with details for layout.
  Called with `this` set to the `FontWebappSVG` instance.
  In particular, `this.renderGroup` is a group to render into,
  cleared between each text render.
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
* `SVG` (default `window.SVG`): reference to `SVG` class from
  [SVG.js](https://svgjs.dev/).
