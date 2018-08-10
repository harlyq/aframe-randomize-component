# aframe-randomize-component

A component for randomizing dom elements.  **randomize** supports randomizing vectors, numbers or colors, and can randomly select from a list of possible values.

The randomizer is configured by dynamic properties, which are of the form ```property:value``` or ```component.property:value```. Where value is either a | delimited list of choices to randomly pick from e.g. ```value1|value2|value3``` or two values separated by .. and a value is picked from within this range (including the start, but excluding the end) e.g. ```rangeStart...rangeEnd```.  Choice values can be anything, whilst range values only support number, vector and color.

[Click here for a demo](https://harlyq.github.io/aframe-randomize-component/)

## Usage
```html
<head>
  <script src="https://aframe.io/releases/0.8.2/aframe.min.js"></script>
  <script src="https://unpkg.com/aframe-randomize-component@^0.3.0/aframe-randomize-component.js"></script>
</head>
<body>
  <a-scene>
    <a-box randomize="position:-2 -2 -5..2 2 -7; material.color:red..green; scale: 1 1 1|1.5 1.5 1.5|2 2 2;"></a-box>
  </a-scene>
</body>
```

## Properties
| Property | Description | Default Value | Type |
| -------- | ----------- | ------------- | ---- |
|seed|random seed for the randomizer, set to -1 re-randomize each time|-1|number|
|\<component\>.\<attribute\>|set the attribute on a component with a value, a range (a..b) or a choice (a\|b\|c)|""|string|
|\<component\>|set a component with a value, a range (a..b) or a choice (a\|b\|c)|""|string|

## Examples
```html
  // randomly position this element inside the box (-10,-10,-10) and (10,10,10)
  <a-entity randomize="position:-10 -10 -10..10 10 10"></a-entity>

  // random color from black to white
  <a-entity randomize="material.color:black..white"></a-entity>

  // set the material color to red, #0f0 or #0000ff
  <a-entity randomize="material.color:red|#0f0|#0000ff"></a-entity>
```

## Limitations
when using a random range of colors, the random value is picked from the HSL space (not RGB).

Properties with strings cannot be randomized with a range (..), but can be randomized with a choice (|).

When modifying properties on a primitive it is best to use the component mapping rather than the property directly.  For example use **material.color** rather than **color**.