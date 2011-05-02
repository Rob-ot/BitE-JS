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

(function (window) {
  
  function exports (options) {
    return new BE(options)
  }
  
  function BE (options) {
    var self = this
    
    this.events = {}
    this.frames = []
    this.mouseDown = false
    this.viewSize = 20
    this.currentColor = [0, 0, 0]
    this.canvasOffsetTop = 0
    this.canvasOffsetLeft = 0
    this.lastDrawX = 0
    this.lastDrawY = 0
    this.currentFrame
    this.currentOutline
    
    this.canvas = options.canvas
    
    this.canvasCtx = this.canvas.getContext("2d")
    
    this.reset()
    
    this.canvas.addEventListener("click", function (e) {
      if (e.shiftKey) {
        if (self.lastDrawX) {
          self.setLine(self.lastDrawX, self.lastDrawY, e.pageX - self.canvasOffsetLeft, e.pageY - self.canvasOffsetTop)
        }
      }
      else {
        self.setPixAt(e.pageX - self.canvasOffsetLeft, e.pageY - self.canvasOffsetTop)
        self.lastDrawX = e.pageX - self.canvasOffsetLeft
        self.lastDrawY = e.pageY - self.canvasOffsetTop
      }
    }, false)
    
    this.canvas.addEventListener("mousedown", function (e) {
      self.mouseDown = true
      e.preventDefault()
    }, false)
    
    document.addEventListener("mouseup", function (e) {
      self.mouseDown = false
    }, false)
    
    document.addEventListener("mouseout", function (e) {
      if (e.target.tagName.toLowerCase() === "html") {
        self.mouseDown = false
      }
    }, false)
    
    document.addEventListener("mousemove", function (e) {
      if (self.mouseDown && e.target.id === "sheet") {
        self.setPixAt(e.pageX - self.canvasOffsetLeft, e.pageY - self.canvasOffsetTop)
        self.lastDrawX = e.pageX - self.canvasOffsetLeft
        self.lastDrawY = e.pageY - self.canvasOffsetTop
      }
      self.setOutline(e.pageX - self.canvasOffsetLeft, e.pageY - self.canvasOffsetTop)
    }, false)
    
    this.updateCanvasOffset = function () {
      self.canvasOffsetTop = self.canvas.offsetTop + self.canvas.clientTop
      self.canvasOffsetLeft = self.canvas.offsetLeft + self.canvas.clientLeft
    }
    this.updateCanvasOffset()
    window.addEventListener("resize", this.updateCanvasOffset, false)
  }
  
    
  // A pixel is 1 box on 1 frame, not an actual screen pixel
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
  
  BE.prototype.Pixel = Pixel

  
  
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
  
  BE.prototype.Frame = Frame
  
  
  // bind a custom event
  BE.prototype.bind = function (type, fn) {
    if (! this.events[type]) this.events[type] = []
    this.events[type].push(fn)
    return this
  }
  
  // trigger a custom event
  BE.prototype.trigger = function (type, e) {
    var fns = this.events[type]
    if (fns) {
      for (var i = 0; i < fns.length; i++) {
        fns[i](e) // todo - add preventDefault and propogation
      }
    }
    return this
  }
  
  // unbind a custom event
  BE.prototype.unbind = function (type, fn) {
    var fns = this.events[type]
    if (fns) {
      for (var i = 0; i < fns.length; i++) {
        if (fns[i] === fn) {
          fns.splice(i, 1)
          return true
        }
      }
    }
    return false
  }
  
  BE.prototype.drawPix = function (x, y, colors) {
    var pixel = this.frames[this.currentFrame].pixels[x][y]
    this.canvasCtx.fillStyle = "rgb(" + colors[0] + "," + colors[1] + "," + colors[2] + ")"
    this.canvasCtx.fillRect(x * this.viewSize, y * this.viewSize, this.viewSize, this.viewSize)
    
    if (pixel.isOutlined()) {
      this.canvasCtx.strokeStyle = "rgb(" + this.currentColor[0] + "," + this.currentColor[1] + "," + this.currentColor[2] + ")"
      this.canvasCtx.strokeRect(x * this.viewSize + 0.5, y * this.viewSize + 0.5, this.viewSize - 1, this.viewSize - 1)
    }
  }
  
  BE.prototype.write = function () {
    var x, y, colors,
      pixels = this.frames[this.currentFrame].pixels
    for (x = 0; x < 50; x++) {
      for (y = 0; y < 30; y++) {
        colors = pixels[x][y].getColors()
        this.drawPix(x, y, colors)
      }
    }
  }
  
  BE.prototype.coordHasPix = function (x, y) {
    return (x >= 0 && y >= 0 && x < 50 && y < 30)
  }
  
  BE.prototype.setPixAt = function (setX, setY) {
    var x = Math.floor(setX / this.viewSize),
      y = Math.floor(setY / this.viewSize)
    if (! this.coordHasPix(x, y)) {
      return
    }
    this.frames[this.currentFrame].setPixAt(x, y, this.currentColor)
    this.drawPix(x, y, this.currentColor)
  }
  
  BE.prototype.setColor = function (color) {
    this.currentColor = color
  }
  
  BE.prototype.setOutline = function (setX, setY) {
    
    var x = Math.floor(setX / this.viewSize),
      y = Math.floor(setY / this.viewSize),
      pixel
    if (! this.coordHasPix(x, y)) {
      return
    }
    pixel = this.frames[this.currentFrame].pixels[x][y]
    
    if (this.currentOutline) {
      this.currentOutline.setOutlined(false)
      this.drawPix(this.currentOutline.x, this.currentOutline.y, this.currentOutline.getColors())
    }
    this.currentOutline = pixel
    pixel.setOutlined(true)
    this.drawPix(x, y, pixel.getColors())
  }
  
  BE.prototype.setLine = function (lowX, lowY, highX, highY) {
    /*
    var swap, x
    // since this can be in many directions we want to normalize the data
    if (lowX > highX) {
      swap = lowX
      lowX = highX
      highX = swap
    }
    
    for (x = lowX; x < highX; x++) {
      this.setPixAt(x, highY)
    }
    */
  }
  
  BE.prototype.createFrame = function () {
    var newId = this.frames.length
    this.frames[newId] = new Frame()
    this.trigger("newFrame", {frame: this.frames[newId], frameId: newId})
    return newId
  }
  
  BE.prototype.reset = function () {
    this.frames = []
    this.trigger("reset")
    this.setVisibleFrame(this.createFrame())
  }
  
  BE.prototype.setVisibleFrame = function (frameId) {
    if (typeof frameId === "string") {
      if (frameId === "next") {
        if (this.currentFrame + 1 < this.frames.length) {
          this.currentFrame++
        }
      }
      else {
        if (this.currentFrame - 1 >= 0) {
          this.currentFrame--
        }
      }
    }
    else {
      this.currentFrame = frameId
    }
    this.write()
    return this.currentFrame
  }
  
  BE.prototype.copyFrameTo = function (sourceFrameId, destFrameId) {
    this.frames[destFrameId].fromSerialized(this.frames[sourceFrameId].serialize())
  }
  
  BE.prototype.frameDifference = function (fromFrameId, toFrameId) {
    var x, y, fromColors, toColors,
      differences = {},
      fromFrame = this.frames[fromFrameId] || null,
      toFrame = this.frames[toFrameId]
    
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
  
  BE.prototype.getCompressedFrames = function () {
    var i, frameData = []
    for (i = 0; i < this.frames.length; i++) {
      frameData[i] = this.frameDifference(i - 1, i)
    }
    return frameData
  }
  
  BE.prototype.pixMapToSerializedFrame = function (pixMap) {
    var x, y, serials = []
    for (x = 0; x < 50; x++) {
      serials[x] = []
      for (y = 0; y < 30; y++) {
        serials[x][y] = [pixMap[x][y], x, y]
      }
    }
    return serials
  }
  
  BE.prototype.loadCompressedFrames = function (frameData) {
    var i, x, y, frameState = []
    
    this.reset()
    
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
      if (! this.frames[i]) {
        this.createFrame()
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
      this.frames[i].fromSerialized(this.pixMapToSerializedFrame(frameState))
    }
    // and refresh the current frame for good luck
    this.write()
  }
  
  BE.prototype.getCurrentFrameId = function () {
    return this.currentFrame
  }
  
  BE.prototype.setSize = function (size) {
    var w = size * 50,
      h = size * 30
    this.viewSize = size
    this.canvas.width = w
    this.canvas.height = h
    this.canvas.style.width = w + "px"
    this.canvas.style.height = h + "px"
    this.write()
  }
  
  exports.fn = BE.prototype
  window.BitE = exports
}(window));
