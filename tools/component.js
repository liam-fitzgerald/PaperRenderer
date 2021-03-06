const types = {
  component: [
    'qr',
    'rect',
    'shard',
    'text',
    'sigil',
    'img',
    'ethereumAddress',
    'line',
  ],
  text: ['text', 'shard', 'ethereumAddress'],
  // types whose data is retrieved asynchronously (we do not import the figma data)
  async: ['sigil', 'qr'],
  // these Figma types house children elements, so we need to transverse all children nodes when we find a parentType
  group: ['group', 'instance', 'frame'],
}

const isType = (type) => {
  if (
    types.component.includes(type) ||
    types.async.includes(type) ||
    types.group.includes(type)
  )
    return true
  return false
}

// #text@meta.dateCreated --> ["text", "meta.dateCreated"]
const getComponentTagData = (child) => {
  // TEXT or FRAME type
  const figmaType = child.type.toLowerCase()

  // "#text@meta.patp" --> ["#text", "meta.patp"]
  const componentData = child.name.split('@')

  // "#text" --> "text"
  const componentType = componentData[0].replace('#', '')

  // "meta.dateCreated"
  const componentPath = componentData[1]

  // {type: "text", path: "meta.dateCreated"}
  if (isType(componentType))
    return {
      type: componentType,
      path: componentPath,
    }
  // {type: "text" path: "null"} --> text data provided in template
  else if (isType(figmaType))
    return {
      type: figmaType,
      path: null,
    }

  // when the type is not a figma/component type, it is not supported
  return {
    type: null,
    path: null,
  }
}

const getSvgPath = (child) => {
  const path = child.fillGeometry[0].path

  if (path === undefined || path === null || path === '')
    console.error(
      `Unable to get the path for the svg child: ${JSON.stringify(child)}`
    )

  return path
}

// For some reason, figma doesn't always return the correct fontWeights for textboxes. We correct this here.
const correctFontWeight = (child) => {
  const shims = {
    'Inter-Regular': 400,
    'Inter-Medium': 500,
    'Inter-SemiBold': 600,
    'SourceCodePro-Regular': 400,
    'SourceCodePro-Medium': 500,
  }

  if (shims[child.style.fontPostScriptName] !== undefined) {
    child.style.fontWeight = shims[child.style.fontPostScriptName]
  }

  return child
}

const rgba = (fills) => {
  if (fills.length === 0) return `rgba(0,0,0,0)`
  const color = fills[0].color
  const red = Math.floor(color.r * 255)
  const green = Math.floor(color.g * 255)
  const blue = Math.floor(color.b * 255)
  const alpha = Math.floor(color.a)
  return `rgba(${red},${green},${blue},${alpha})`
}

const qr = (child, frame) => {
  return {
    type: 'qr',
    draw: 'qr',
    data: null,
    path: getComponentTagData(child).path,
    size: child.absoluteBoundingBox.height,
    x: child.absoluteBoundingBox.x - frame.originX,
    y: child.absoluteBoundingBox.y - frame.originY,
  }
}

const sigil = (child, frame) => {
  return {
    type: 'sigil',
    draw: 'sigil',
    data: null,
    path: getComponentTagData(child).path,
    height: child.absoluteBoundingBox.height,
    width: child.absoluteBoundingBox.width,
    x: child.absoluteBoundingBox.x - frame.originX,
    y: child.absoluteBoundingBox.y - frame.originY,
  }
}

const img = (child, frame) => {
  return {
    type: 'img',
    draw: 'img',
    data: getSvgPath(child),
    path: getComponentTagData(child).path,
    width: child.absoluteBoundingBox.height,
    height: child.absoluteBoundingBox.width,
    x: child.absoluteBoundingBox.x - frame.originX,
    y: child.absoluteBoundingBox.y - frame.originY,
    color: rgba(child.fills),
  }
}

const text = (child, frame) => {
  child = correctFontWeight(child)
  return {
    type: 'text',
    draw: 'wrappedText',
    path: getComponentTagData(child).path,
    data: getComponentTagData(child).path === null ? child.characters : null,
    fontFamily: child.style.fontFamily,
    fontPostScriptName: child.style.fontPostScriptName,
    fontSize: child.style.fontSize,
    fontWeight: child.style.fontWeight,
    fontColor: rgba(child.fills),
    width: child.absoluteBoundingBox.width,
    height: child.absoluteBoundingBox.height,
    lineHeightPx: child.style.lineHeightPx,
    x: child.absoluteBoundingBox.x - frame.originX,
    y: child.absoluteBoundingBox.y - frame.originY,
  }
}

const shard = (child, frame) => {
  child = correctFontWeight(child)
  return {
    type: 'shard',
    draw: 'shard',
    path: getComponentTagData(child).path,
    data: null,
    fontFamily: child.style.fontFamily,
    fontPostScriptName: child.style.fontPostScriptName,
    fontSize: child.style.fontSize,
    fontWeight: child.style.fontWeight,
    fontColor: rgba(child.fills),
    width: child.absoluteBoundingBox.width,
    height: child.absoluteBoundingBox.height,
    lineHeightPx: child.style.lineHeightPx,
    x: child.absoluteBoundingBox.x - frame.originX,
    y: child.absoluteBoundingBox.y - frame.originY,
  }
}

const ethereumAddress = (child, frame) => {
  child = correctFontWeight(child)
  return {
    type: 'ethereumAddress',
    draw: 'ethereumAddress',
    path: getComponentTagData(child).path,
    data: null,
    fontWeight: child.style.fontWeight,
    fontFamily: child.style.fontFamily,
    fontPostScriptName: child.style.fontPostScriptName,
    fontSize: child.style.fontSize,
    width: child.absoluteBoundingBox.width,
    height: child.absoluteBoundingBox.height,
    lineHeightPx: child.style.lineHeightPx,
    x: child.absoluteBoundingBox.x - frame.originX,
    y: child.absoluteBoundingBox.y - frame.originY,
    fontColor: rgba(child.fills),
  }
}

// const wrapAddrSplitFour = (child, frame) => {
//   return {
//     type: 'wrapAddrSplitFour',
//     draw: 'ethereumAddressCompact',
//     path: getComponentTagData(child).path,
//     data: null,
//     fontWeight: child.style.fontWeight,
//     fontFamily: child.style.fontFamily,
//     fontSize: child.style.fontSize,
//     width: child.absoluteBoundingBox.width,
//     lineHeightPx: child.style.lineHeightPx,
//     x: child.absoluteBoundingBox.x - frame.originX,
//     y: child.absoluteBoundingBox.y - frame.originY,
//     fontColor: rgba(child.fills),
//   }
// }

const rect = (child, frame) => {
  // if(frame.originX === undefined)
  //   console.log(frame)
  return {
    type: 'rect',
    draw: 'rect',
    path: null,
    data: null,
    cornerRadius: child.cornerRadius,
    dashes: child.strokeDashes,
    x: child.absoluteBoundingBox.x - frame.originX,
    y: child.absoluteBoundingBox.y - frame.originY,
    width: child.absoluteBoundingBox.width,
    height: child.absoluteBoundingBox.height,
    fillColor: rgba(child.fills),
    strokeColor: rgba(child.strokes),
    strokeWeight: child.strokeWeight,
  }
}

const line = (child, frame) => {
  return {
    type: 'line',
    draw: 'line',
    path: null,
    data: null,
    dashes: child.strokeDashes,
    x: child.absoluteBoundingBox.x - frame.originX,
    y: child.absoluteBoundingBox.y - frame.originY,
    width: child.absoluteBoundingBox.width,
    height: child.absoluteBoundingBox.height,
    strokeColor: rgba(child.strokes),
    strokeWeight: child.strokeWeight,
  }
}

const components = {
  qr: (child, frame) => qr(child, frame),
  templateText: (child, frame) => templateText(child, frame),
  rect: (child, frame) => rect(child, frame),
  shard: (child, frame) => shard(child, frame),
  text: (child, frame) => text(child, frame),
  sigil: (child, frame) => sigil(child, frame),
  img: (child, frame) => img(child, frame),
  // wrapAddrSplitFour: (child, frame) => wrapAddrSplitFour(child, frame),
  ethereumAddress: (child, frame) => ethereumAddress(child, frame),
  line: (child, frame) => line(child, frame),
}

const getComponent = (child, frame) => {
  const type = getComponentTagData(child).type
  const component = components[type]
  if (component === undefined) {
    return null
  }
  return component(child, frame)
}

const template = (child, frames) => {
  return {
    type: 'template',
    path: null,
    figmaFrameID: child.name,
    frames: frames,
  }
}

const frame = (child, elements) => {
  // "galaxy, management, 4" --> ["galaxy", "management", "4"]
  const title = child.name
    .toString()
    .replace(/\s/g, '')
    .split(',')
  return {
    type: 'frame',
    classOf: title[0],
    usage: title[1],
    bin: title[2],
    path: null,
    originX: child.absoluteBoundingBox.x,
    originY: child.absoluteBoundingBox.y,
    elements: elements,
  }
}

const schemas = {
  template: (child, array) => template(child, array),
  frame: (child, array) => frame(child, array),
}

const getSchema = (child, type, array) => {
  if (type === 'CANVAS') type = 'TEMPLATE'
  return schemas[type.toLowerCase()](child, array)
}

module.exports = {
  getComponentTagData,
  getComponent,
  getSchema,
  types,
  isType,
}
