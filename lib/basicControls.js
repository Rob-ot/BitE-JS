(function (BE) {
  BE.fn.basicControls = function () {
    var self = this,
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
      zoomLevel = 20
    
    
    function addFrameToList (e) {
      var frameId = e.frameId,
        newFrameListOption = document.createElement("option")
      newFrameListOption.value = frameId
      newFrameListOption.innerHTML = "Frame " + frameId
      frameList.appendChild(newFrameListOption)
      frameList.selectedIndex = frameId
    }
    this.bind("newFrame", addFrameToList)
    
    function clearFrameList () {
      frameList.innerHTML = ""
    }
    this.bind("reset", clearFrameList)
    
    function addFrame (e) {
      var oldFrameId = self.getCurrentFrameId(),
        newFrameId = self.createFrame(),
        copyCurrent = copyOnNew.checked
      copyCurrent && self.copyFrameTo(oldFrameId, newFrameId)
      self.setVisibleFrame(newFrameId)
    }
    addFrameBtn.addEventListener("click", addFrame, false)
    frameList.addEventListener("change", function (e) {
      self.setVisibleFrame(frameList.selectedIndex)
    }, false)
    
    document.addEventListener("keyup", function (e) {
      // left arrow
      if (e.keyCode === 37) {
        frameList.selectedIndex = self.setVisibleFrame("prev")
      }
      // right arrow
      else if (e.keyCode === 39) {
        frameList.selectedIndex = self.setVisibleFrame("next")
      }
      else if (e.keyCode === 78) {
        addFrame()
      }
    }, false)
    
    function nextFrame () {
      var newFrame
      if (playingFrame !== -1) {
        newFrame = self.setVisibleFrame("next")
        if (playingFrame !== newFrame) {
          frameList.selectedIndex = newFrame
          playingFrame = newFrame
          setTimeout(nextFrame, playTimeout)
        }
        else {
          if (repeatElem.checked) {
            playingFrame = 0
            self.setVisibleFrame(0)
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
        self.setVisibleFrame(0)
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
      var json = JSON.stringify(self.getCompressedFrames())
      loadSaveArea.value = json
      loadSaveArea.select()
    }, false)
    loadElem.addEventListener("click", function (e) {
      self.loadCompressedFrames(JSON.parse(loadSaveArea.value))
    }, false)
    
    clearElem.addEventListener("click", function (e) {
      if (confirm("You want to delete EVERYTHING (including the text area)?")) {
        self.reset()
        loadSaveArea.value = ""
      }
    }, false)
    
    zoomIn.addEventListener("click", function (e) {
      zoomLevel < 100 && (zoomLevel++)
      self.setSize(zoomLevel)
      self.updateCanvasOffset()
    }, false)
    zoomOut.addEventListener("click", function (e) {
      zoomLevel > 1 && (zoomLevel--)
      self.setSize(zoomLevel)
      self.updateCanvasOffset()
    }, false)
  }
}(BitE));
