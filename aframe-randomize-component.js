(function (AFRAME) {
  const RES = 4
  const identityFn = e => e
  
  let uniqueId = 0
  
  // note, cannot randomize these properties
  const randomizeSchema = {
    "_seed": {
      type: "int",
      default: -1,
      /*#if dev*/description: "random seed for the randomizer, set to -1 re-randomize each time",/*#endif*/
    },

    "_target": {
      default: "",
      /*#if dev*/description: "selector for children to randomize. use an empty string for self (default), * for all children, or any other type of css selector",/*#endif*/
    }
  }
  
  AFRAME.registerComponent('randomize', {
    // This schema is dynamic, we will add custom properties in updateSchema
    schema: randomizeSchema,
    multiple: true,
  
    init: function() {
      this.randNumber = this.randNumber.bind(this)
      this.randVec2 = this.randVec2.bind(this)
      this.randVec3 = this.randVec3.bind(this)
      this.randColor = this.randColor.bind(this)
      this.randSeed = 1234567 // current seed
      this.lastSeed = this.randSeed // last seed from data
      this.processedElements = []
      this.mutationObserver = new MutationObserver(this.childrenMutated.bind(this))
    },
  
    updateSchema: function(newData) {
      // console.log("New Data", newData)
  
      if (Object.keys(newData).every(x => isNaN(x))) {
        let newSchema = Object.assign({}, this.schema)
  
        for (let prop in newData) {
          if (!(prop in newSchema)) { // add new properties, ignore the rest
            const propData = newData[prop]
            const options = toOptions(propData)
            const range = toRange(propData)
  
            if (options === undefined && range === undefined) {
              console.error(`unable to parse property '${prop}', expecting .. or | in: '${propData}'`)
            } else {
              newSchema[prop] = {
                type: "string",
                options,
                range,
                parse: identityFn,
              }
            }
          }
        }
  
        this.schema = newSchema
      } else {
        console.error(`cannot read properties, expecting <property>:<value>; '${Object.values(newData).join("")}'`)
      }
    },
  
    update: function(oldData) {
      if (this.data._seed !== this.lastSeed) {
        this.randSeed = this.data._seed
        this.lasSeed = this.randSeed
      }

      this.processedElements = []
      this.mutationObserver.disconnect() // will be connected later if we randomize children

      if (this.data._target === "") {
        this.randomizeEntity(this.el)
      } else {
        this.randomizeChildren()
        this.mutationObserver.observe(this.el, {childList: true})
      }
    },

    childrenMutated: function(mutationsList) {
      for (let mutation of mutationsList) {
        if (mutation.type === "childList") {
          this.randomizeChildren()
        }
      }
    },
  
    random: function() {
      if (this.randSeed < 0) {
        return Math.random()
      } else {
        this.randSeed = (1664525*this.randSeed + 1013904223) % 0xffffffff
        return this.randSeed/0xffffffff
      }
    },
  
    randomRange: function(min, max) {
      return this.random()*(max - min) + min
    },
  
    randomizeChildren: function() {
      const data = this.data
      this.resetSelectsOnNextSelect = true
  
      // TODO manage selects
      for (let i = 0, n = this.el.children.length; i < n; i++) {
        let entity = this.el.children[i]

        if (!this.processedElements.includes(entity) && entity.matches(data._target)) {
          this.randomizeEntity(entity)
          this.processedElements.push(entity)
        }
      }
    },

    randomizeEntity: function(entity) {
      for (let prop in this.schema) {
        if (prop in randomizeSchema) { 
          continue  // cannot randomize the randomizer's base properties
        }

        let schemaProp = this.schema[prop]

        if (schemaProp.options) {
          // multiple options, pick a random one
          const options = schemaProp.options
          const v = options[~~(options.length*this.random())]
          setProperty(entity, prop, v)

        } else if (schemaProp.range) {
          // range of possible values
          if (!schemaProp.randFn) {
            // create a randomizer to use for this properties type of data
            let x = getProperty(entity, prop)
            this.formatProperty(schemaProp, x) // may return undefined
          }

          if (schemaProp.randFn) {
            const v = schemaProp.randFn(schemaProp.range[0], schemaProp.range[1])
            setProperty(entity, prop, v)
          }
        }
      }
    },
  
    // define the randFn for this property, and convert the range values into their native format
    // if a property does not have a randFn then leave it undefined, we will try again with another 
    // entity (this lets us define a randomizer for properties that only exist on some entities)
    formatProperty: function (prop, x) {
      if (x === null || typeof x === "undefined") {
        // do nothing
      } else if (typeof x === "string") {
        if (x.length > 0 && x[0] === "#") {
          let minHSL = {}
          let maxHSL = {}
          new THREE.Color(prop.range[0].toLowerCase()).getHSL(minHSL)
          new THREE.Color(prop.range[1].toLowerCase()).getHSL(maxHSL)
          prop.range[0] = minHSL
          prop.range[1] = maxHSL
          prop.randFn = this.randColor
        }
      } else if (typeof x === "number") {
        prop.range[0] = parseFloat(prop.range[0])
        prop.range[1] = parseFloat(prop.range[1])
        prop.randFn = this.randNumber
      } else if (typeof x === "object") {
        if (Array.isArray(x)) {
          // cannot create an array randomizer
        } else if ("x" in x && "y" in x && "z" in x && "w" in x) {
          prop.randFn = this.randVec4
        } else if ("x" in x && "y" in x && "z" in x) {
          prop.randFn = this.randVec3
        } else if ("x" in x && "y" in x) {
          prop.randFn = this.randVec2
        } 
        if (prop.randFn) {
          prop.range[0] = AFRAME.utils.coordinates.parse(prop.range[0])
          prop.range[1] = AFRAME.utils.coordinates.parse(prop.range[1])
        }
      }
    },
  
    // returns a value in the range [min, max) or [0, min) if there is no max
    randNumber: function(min, max) {
      return this.randomRange(min, max).toFixed(RES)
    },
  
    randVec4: function(min, max) {
      return this.randomRange(min.x, max.x).toFixed(RES) + " " + this.randomRange(min.y, max.y).toFixed(RES) + " " + this.randomRange(min.z, max.z).toFixed(RES) + " " + this.randomRange(min.w, max.w).toFixed(RES)
    },
  
    randVec3: function(min, max) {
      return this.randomRange(min.x, max.x).toFixed(RES) + " " + this.randomRange(min.y, max.y).toFixed(RES) + " " + this.randomRange(min.z, max.z).toFixed(RES)
    },
  
    randVec2: function(min, max) {
      return this.randomRange(min.x, max.x).toFixed(RES) + " " + this.randomRange(min.y, max.y).toFixed(RES)
    },
  
    // randomize in HSL space
    randColor: (function() {
      let tempColor = new THREE.Color()

      return function(min, max) {
        const h = this.randomRange(min.h, max.h)
        const s = this.randomRange(min.s, max.s)
        const l = this.randomRange(min.l, max.l)        
        return "#" + tempColor.setHSL(h, s, l).getHexString()
      }
    })(),
  })
  
  function toRange(str) {
    const split = nestedSplit(str, "..")
    return split.length > 1 ? split : undefined
  }
  
  function toOptions(str) {
    const split = nestedSplit(str, "|")
    return split.length > 1 ? split : undefined
  }
  
  function getProperty(entity, prop) {
    return prop.includes(".") ? AFRAME.utils.entity.getComponentProperty(entity, componentToKebabCase(prop)) : entity.getAttribute(prop)
  }
  
  function setProperty(entity, prop, v) {
    if (typeof v !== "undefined") {
      if (prop.includes(".")) {
        AFRAME.utils.entity.setComponentProperty(entity, componentToKebabCase(prop), v)
      } else {
        entity.setAttribute(prop, v)
      }
    }
  }
  
  // AFrame components may be in kebab-case, but when using getComponentProperty() or setComponentProperty() the properties are 
  // always in camelCase. When we receive a NewData from UpdateSchema() all kebab-case are converted to camelCase, so if 
  // we use getComponentProperty() or setComponentProperty() we need to convert the component part into kebab-case but keep the 
  // property part in camelCase
  function componentToKebabCase(str) {
    const i = str.indexOf(".")
    if (i === -1) { return str }
  
    return toKebabCase(str.slice(0, i)) + str.slice(i)
  }
  
  function toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
  }
  
  // splits a string by the separator, but ignores separators that are nested within
  // characters listed in nestedChars
  // e.g. nestedSplit(str, ",", ["''", '""', "{}", "[]"])
  function nestedSplit(str, separator = ",", nestedChars = ["''", '""', "{}", "[]", "()"]) {
    let split = []
    let stack = []
    let startI = 0 // position of current token
    let k = 0 // separator index
  
    for (let i = 0, n = str.length; i < n; i++) {
      const c = str[i]
      if (stack.length > 0 && c === stack[stack.length - 1][1]) {
        stack.pop() // new nested chars started
      } else {
        for (let nest of nestedChars) {
          if (c === nest[0]) {
            stack.push(nest) // last nested chars completed
          }
        }
      }
  
      if (stack.length === 0 && c === separator[k]) {
        // no nested chars and separator found
        if (++k === separator.length) {
          // separator complete
          split.push(str.substring(startI, i - k + 1))
          startI = i + 1
          k = 0
        }
      }
    }
  
    split.push(str.substring(startI, str.length))
    return split
  }
  
  // console.log(nestedSplit("", ","))
  // console.log(nestedSplit("a,b,c", ","))
  // console.log(nestedSplit("a b,c d,e f", ","))
  // console.log(nestedSplit("[a,b,c],'d,e',f", ","))
  // console.log(nestedSplit("[a,b,c],{x:d,y:e},\"f,g,h\"", ","))
  // console.log(nestedSplit("a..'b..c'..d", ".."))
})(AFRAME)
