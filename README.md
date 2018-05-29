# aframe-randomize-component

A component for randomizing dom elements.  **randomize** supports randomizing vectors, numbers or colors, and can randomly select from a list of possible values.  The randomize can modify the current entity (default) or a selector can be specified to randomize child elements.

The randomizer is configured by dynamic properties, which are of the form ```property:value``` or ```component.property:value```. Where value is either a | delimited list of choices to randomly pick from e.g. ```value1|value2|value3``` or two values separated by .. and a value is picked from within this range (including the start, but excluding the end) e.g. ```rangeStart...rangeEnd```.  Choice values can be anything, whilst range values only support number, vector and color.

[Click here for a demo](https://harlyq.github.io/aframe-randomize-component/)

## Usage
```html
<head>
  <script src="https://aframe.io/releases/0.8.2/aframe.min.js"></script>
  <!--script src="https://unpkg.com/aframe-randomize-component/aframe-randomize-component.js"></script-->
  <script src="aframe-randomize-component.js"></script>
</head>
<body>
  <a-scene>
    <a-entity randomize="_target:*; position:-2 -2 -5..2 2 -7; material.color:red..green; scale: 1 1 1|1.5 1.5 1.5|2 2 2;">
      <a-box></a-box>
      <a-box></a-box>
      <a-box></a-box>
    </a-entity>
  </a-scene>
</body>
```

## Properties
| Property | Description | Default Value | Type |
| -------- | ----------- | ------------- | ---- |
|_seed|random seed for the randomizer, set to -1 re-randomize each time|-1|int|
|_target|selector for children to randomize. use an empty string for self (default), * for all children, or any other type of css selector|''|string|

## Examples
```html
  // randomly position this element inside the box (-10,-10,-10) and (10,10,10)
  <a-entity randomize="position:-10 -10 -10..10 10 10"></a-entity>

  // random color from black to white
  <a-entity randomize="color:black..white"></a-entity>

  // set the material color of all children to red, green or blue
  <a-entity randomize="_target:*;material.color:red|#0f0|#0000ff"></a-entity>
```

## Limitations
when using a random range of colors, the random value is picked from the HSL space (not RGB).

When using a child selector (e.g. target is not empty) the randomizer will be applied if new children are added.

Attributes with arrays or strings cannot be randomized with a range (..), but can be randomized with a choice (|).

If an attribute does not exist on an entity then the randomizer will silently (no warnings or errors) not set that attribute.
