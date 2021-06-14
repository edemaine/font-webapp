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
