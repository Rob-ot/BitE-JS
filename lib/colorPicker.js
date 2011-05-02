(function (BE) {
  BE.fn.colorPicker = function (parent) {
    var self = this,
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
        colorElem = document.createElement("a")
        colorElem.href = "#"
        colorElem.className = "pickerColor"
        colorElem.style.display = "block"
        colorElem.style.backgroundColor = color
        colorElem.innerHTML = color
        parent.appendChild(colorElem)
      }
    }
    
    parent.addEventListener("click", function (e) {
      if (colors[e.target.style.backgroundColor]) {
        self.setColor(colors[e.target.style.backgroundColor])
      }
      e.preventDefault()
    }, false)
    
    return this
  }
}(BitE));
