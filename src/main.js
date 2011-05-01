/*
Copyright (C) 2011 by Rob Middleton

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var colorPicker = (function (parent) {
  var onPick,
    colors = {
      "white":   [255, 255, 255],
      "silver":  [192, 192, 192],
      "grey":    [128, 128, 128],
      "black":   [  0,   0,   0],
      "brown":   [159,  92,  43],
      "red":     [255,   0,   0],
      "maroon":  [128,   0,   0],
      "orange":  [255, 165,   0],
      "yellow":  [255, 255,   0],
      "olive":   [128, 128,   0],
      "lime":    [  0, 255,   0],
      "green":   [  0, 128,   0],
      "aqua":    [  0, 255, 255],
      "teal":    [  0, 128, 128],
      "blue":    [  0,   0, 255],
      "navy":    [  0,   0, 128],
      "fuchsia": [255,   0, 255],
      "purple":  [128,   0, 128]
    },
    color,
    colorElem
  
  for (color in colors) {
    if (colors.hasOwnProperty(color)) {
      colorElem = document.createElement("div")
      colorElem.className = "pickerColor"
      colorElem.style.backgroundColor = color
      colorElem.innerHTML = color
      parent.appendChild(colorElem)
    }
  }
  
  parent.addEventListener("click", function (e) {
    if (colors[e.target.style.backgroundColor] && onPick) {
      onPick(colors[e.target.style.backgroundColor])
    }
  }, false)
  
  return {
    "onPick": function (cb) {
      onPick = cb
    }
  }
  
}(document.getElementById("colorPicker")))

function Pixel (colors, x, y) {
  this.outlined = false
  this.x = x
  this.y = y
  this.colors = colors
}

Pixel.prototype.setColors = function (newColors) {
  this.colors = newColors
}
Pixel.prototype.getColors = function () {
  return this.colors
}

Pixel.prototype.setOutlined = function (outlined) {
  this.outlined = outlined
}
Pixel.prototype.isOutlined = function () {
  return this.outlined
}

Pixel.prototype.serialize = function () {
  return [this.colors, this.x, this.y]
}
Pixel.prototype.fromSerialized = function (pix) {
  this.colors = pix[0]
  this.x = pix[1]
  this.y = pix[2]
}

function Frame () {
  this.pixels = []
  this.blankTo(255, 255, 255)
}

Frame.prototype.setPixAt = function (x, y, color) {
  this.pixels[x][y].setColors(color)
}

Frame.prototype.blankTo = function (r, g, b) {
  var x, y
  for (x = 0; x < 50; x++) {
    if (! this.pixels[x]) {
      this.pixels[x] = []
    }
    for (y = 0; y < 30; y++) {
      this.pixels[x][y] = new Pixel([r, g, b], x, y)
    }
  }
}

Frame.prototype.serialize = function () {
  var x, y, serials = []
  for (x = 0; x < 50; x++) {
    serials[x] = []
    for (y = 0; y < 30; y++) {
      serials[x][y] = this.pixels[x][y].serialize()
    }
  }
  return serials
}

Frame.prototype.fromSerialized = function (frm) {
  var x, y
  for (x = 0; x < 50; x++) {
    for (y = 0; y < 30; y++) {
      this.pixels[x][y].fromSerialized(frm[x][y])
    }
  }
}



var drawrer = (function (canvas) {
  var exports = {},
    frames = [],
    currentFrame,
    viewSize = 20,
    canvas2d = canvas.getContext("2d"),
    currentColor = [0, 0, 0],
    currentOutline,
    onNewFrame = function () {},
    onReset = function () {}
  
  function drawPix (x, y, colors) {
    var pixel = frames[currentFrame].pixels[x][y]
    canvas2d.fillStyle = "rgb(" + colors[0] + "," + colors[1] + "," + colors[2] + ")"
    canvas2d.fillRect(x * viewSize, y * viewSize, viewSize, viewSize)
    
    if (pixel.isOutlined()) {
      canvas2d.strokeStyle = "rgb(" + currentColor[0] + "," + currentColor[1] + "," + currentColor[2] + ")"
      canvas2d.strokeRect(x * viewSize + 0.5, y * viewSize + 0.5, viewSize - 1, viewSize - 1)
    }
  }
  
  function write () {
    var x, y, colors,
      pixels = frames[currentFrame].pixels
    for (x = 0; x < 50; x++) {
      for (y = 0; y < 30; y++) {
        colors = pixels[x][y].getColors()
        drawPix(x, y, colors)
      }
    }
  }
  
  function coordHasPix (x, y) {
    return (x >= 0 && y >= 0 && x < 50 && y < 30)
  }
  
  exports.setPixAt = function (setX, setY) {
    var x = Math.floor(setX / viewSize),
      y = Math.floor(setY / viewSize)
    if (! coordHasPix(x, y)) {
      return
    }
    frames[currentFrame].setPixAt(x, y, currentColor)
    drawPix(x, y, currentColor)
  }
  
  exports.setColor = function (color) {
    currentColor = color
  }
  
  exports.setOutline = function (setX, setY) {
    
    var x = Math.floor(setX / viewSize),
      y = Math.floor(setY / viewSize),
      pixel
    if (! coordHasPix(x, y)) {
      return
    }
    pixel = frames[currentFrame].pixels[x][y]
    
    if (currentOutline) {
      currentOutline.setOutlined(false)
      drawPix(currentOutline.x, currentOutline.y, currentOutline.getColors())
    }
    currentOutline = pixel
    pixel.setOutlined(true)
    drawPix(x, y, pixel.getColors())
  }
  
  exports.setLine = function (lowX, lowY, highX, highY) {
    /*
    var swap, x
    // since this can be in many directions we want to normalize the data
    if (lowX > highX) {
      swap = lowX
      lowX = highX
      highX = swap
    }
    
    for (x = lowX; x < highX; x++) {
      exports.setPixAt(x, highY)
    }
    */
  }
  
  exports.createFrame = function () {
    var newId = frames.length
    frames[newId] = new Frame()
    onNewFrame(newId)
    return newId
  }
  
  exports.onNewFrame = function (cb) {
    onNewFrame = cb
  }
  
  exports.reset = function () {
    frames = []
    onReset()
    exports.setVisibleFrame(exports.createFrame())
  }
  
  exports.onReset = function (cb) {
    onReset = cb
  }
  
  exports.setVisibleFrame = function (frameId) {
    if (typeof frameId === "string") {
      if (frameId === "next") {
        if (currentFrame + 1 < frames.length) {
          currentFrame++
        }
      }
      else {
        if (currentFrame - 1 >= 0) {
          currentFrame--
        }
      }
    }
    else {
      currentFrame = frameId
    }
    write()
    return currentFrame
  }
  
  exports.copyFrameTo = function (sourceFrameId, destFrameId) {
    frames[destFrameId].fromSerialized(frames[sourceFrameId].serialize())
  }
  
  function frameDifference (fromFrameId, toFrameId) {
    var x, y, fromColors, toColors,
      differences = {},
      fromFrame = frames[fromFrameId] || null,
      toFrame = frames[toFrameId]
    
    for (x = 0; x < 50; x++) {
      for (y = 0; y < 30; y++) {
        // we want a default frame of all white
        fromColors = (fromFrame === null) ? [255, 255, 255] : fromFrame.pixels[x][y].getColors()
        toColors = toFrame.pixels[x][y].getColors()
        if (! (fromColors[0] === toColors[0] &&
            fromColors[1] === toColors[1] &&
            fromColors[2] === toColors[2])) {
          if (! differences[x]) {
            differences[x] = {}
          }
          differences[x][y] = toColors
        }
      }
    }
    return differences
  }
  
  exports.getCompressedFrames = function () {
    var i, frameData = []
    for (i = 0; i < frames.length; i++) {
      frameData[i] = frameDifference(i - 1, i)
    }
    return frameData
  }
  
  function pixMapToSerializedFrame (pixMap) {
    var x, y, serials = []
    for (x = 0; x < 50; x++) {
      serials[x] = []
      for (y = 0; y < 30; y++) {
        serials[x][y] = [pixMap[x][y], x, y]
      }
    }
    return serials
  }
  
  exports.loadCompressedFrames = function (frameData) {
    var i, x, y, frameState = []
    
    exports.reset()
    
    // fill framestate with white for default frame
    for (x = 0; x < 50; x++) {
      frameState[x] = []
      for (y = 0; y < 30; y++) {
        // all white
        frameState[x][y] = [255, 255, 255]
      }
    }
    
    for (i = 0; i < frameData.length; i++) {
      // create a new frame if there isnt one
      if (! frames[i]) {
        exports.createFrame()
      }
      // write current frame to default frame
      for (x in frameData[i]) {
        if (frameData[i].hasOwnProperty(x)) {
          for (y in frameData[i][x]) {
            if (frameData[i][x].hasOwnProperty(y)) {
              frameState[x][y] = frameData[i][x][y]
            }
          }
        }
      }
      // write framestate to corrosponding frame
      frames[i].fromSerialized(pixMapToSerializedFrame(frameState))
    }
    // and refresh the current frame for good luck
    write()
  }
  
  exports.getCurrentFrameId = function () {
    return currentFrame
  }
  
  exports.setSize = function (size) {
    var w = size * 50,
      h = size * 30
    viewSize = size
    canvas.width = w
    canvas.height = h
    canvas.style.width = w + "px"
    canvas.style.height = h + "px"
    write()
  }
  
  exports.reset()
  
  return exports
}(document.getElementById("sheet")));

(function () {
  var canvas = document.getElementById("sheet"),
    canvasOffsetTop,
    canvasOffsetLeft,
    addFrameBtn = document.getElementById("addFrame"),
    copyOnNew = document.getElementById("copyOnNew"),
    frameList = document.getElementById("frameList"),
    playPause = document.getElementById("playPause"),
    playSpeedElem = document.getElementById("playSpeed"),
    repeatElem = document.getElementById("repeat"),
    playingFrame = -1,
    playTimeout = 1000 / parseInt(playSpeedElem.value, 10),
    loadElem = document.getElementById("load"),
    saveElem = document.getElementById("save"),
    loadSaveArea = document.getElementById("loadSaveArea"),
    clearElem = document.getElementById("clear"),
    zoomIn = document.getElementById("zoomIn"),
    zoomOut = document.getElementById("zoomOut"),
    zoomLevel = 20,
    mouseDown = false,
    lastDrawX,
    lastDrawY
  
  
  colorPicker.onPick(drawrer.setColor)
  
  canvas.addEventListener("click", function (e) {
    if (e.shiftKey) {
      if (lastDrawX) {
        drawrer.setLine(lastDrawX, lastDrawY, e.pageX - canvasOffsetLeft, e.pageY - canvasOffsetTop)
      }
    }
    else {
      drawrer.setPixAt(e.pageX - canvasOffsetLeft, e.pageY - canvasOffsetTop)
      lastDrawX = e.pageX - canvasOffsetLeft
      lastDrawY = e.pageY - canvasOffsetTop
    }
  }, false)
  canvas.addEventListener("mousedown", function (e) {
    mouseDown = true
    e.preventDefault()
  }, false)
  document.addEventListener("mouseup", function (e) {
    mouseDown = false
  }, false)
  document.addEventListener("mouseout", function (e) {
    if (e.target.tagName.toLowerCase() === "html") {
      mouseDown = false
    }
  }, false)
  
  document.addEventListener("mousemove", function (e) {
    if (e.target.id === "sheet" && mouseDown) {
      drawrer.setPixAt(e.pageX - canvasOffsetLeft, e.pageY - canvasOffsetTop)
      lastDrawX = e.pageX - canvasOffsetLeft
      lastDrawY = e.pageY - canvasOffsetTop
    }
    drawrer.setOutline(e.pageX - canvasOffsetLeft, e.pageY - canvasOffsetTop)
  }, false)
  
  function addFrameToList (frameId) {
    var newFrameListOption = document.createElement("option")
    newFrameListOption.value = frameId
    newFrameListOption.innerHTML = "Frame " + frameId
    frameList.appendChild(newFrameListOption)
    frameList.selectedIndex = frameId
  }
  drawrer.onNewFrame(addFrameToList)
  
  function clearFrameList () {
    frameList.innerHTML = ""
  }
  drawrer.onReset(clearFrameList)
  
  function addFrame (e) {
    var oldFrameId = drawrer.getCurrentFrameId(),
      newFrameId = drawrer.createFrame(),
      copyCurrent = copyOnNew.checked
    copyCurrent && drawrer.copyFrameTo(oldFrameId, newFrameId)
    drawrer.setVisibleFrame(newFrameId)
  }
  addFrameBtn.addEventListener("click", addFrame, false)
  frameList.addEventListener("change", function (e) {
    drawrer.setVisibleFrame(frameList.selectedIndex)
  }, false)
  
  document.addEventListener("keyup", function (e) {
    // left arrow
    if (e.keyCode === 37) {
      frameList.selectedIndex = drawrer.setVisibleFrame("prev")
    }
    // right arrow
    else if (e.keyCode === 39) {
      frameList.selectedIndex = drawrer.setVisibleFrame("next")
    }
    else if (e.keyCode === 78) {
      addFrame()
    }
  }, false)
  
  function nextFrame () {
    var newFrame
    if (playingFrame !== -1) {
      newFrame = drawrer.setVisibleFrame("next")
      if (playingFrame !== newFrame) {
        frameList.selectedIndex = newFrame
        playingFrame = newFrame
        setTimeout(nextFrame, playTimeout)
      }
      else {
        if (repeatElem.checked) {
          playingFrame = 0
          drawrer.setVisibleFrame(0)
          setTimeout(nextFrame, playTimeout)
        }
        else {
          playingFrame = -1
        }
      }
    }
  }
  
  playPause.addEventListener("click", function (e) {
    if (playingFrame === -1) {
      playingFrame = 0
      drawrer.setVisibleFrame(0)
      setTimeout(nextFrame, playTimeout)
    }
    else {
      playingFrame = -1
    }
  }, false)
  
  playSpeedElem.addEventListener("change", function (e) {
    playTimeout = 1000 / parseInt(e.target.value, 10)
    if (playTimeout === Infinity) {
      playTimeout = 1000
    }
  }, false)
  
  saveElem.addEventListener("click", function (e) {
    var json = JSON.stringify(drawrer.getCompressedFrames())
    loadSaveArea.value = json
    loadSaveArea.select()
  }, false)
  loadElem.addEventListener("click", function (e) {
    drawrer.loadCompressedFrames(JSON.parse(loadSaveArea.value))
  }, false)
  
  clearElem.addEventListener("click", function (e) {
    if (confirm("You want to delete EVERYTHING (including the text area)?")) {
      drawrer.reset()
      loadSaveArea.value = ""
    }
  }, false)
  
  function updateCanvasOffset () {
    canvasOffsetTop = canvas.offsetTop + canvas.clientTop
    canvasOffsetLeft = canvas.offsetLeft + canvas.clientLeft
  }
  updateCanvasOffset()
  window.addEventListener("resize", updateCanvasOffset, false)
  zoomIn.addEventListener("click", function (e) {
    zoomLevel < 100 && (zoomLevel++)
    drawrer.setSize(zoomLevel)
    updateCanvasOffset()
  }, false)
  zoomOut.addEventListener("click", function (e) {
    zoomLevel > 1 && (zoomLevel--)
    drawrer.setSize(zoomLevel)
    updateCanvasOffset()
  }, false)
  
}());
