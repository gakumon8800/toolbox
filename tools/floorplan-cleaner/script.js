(function () {
  'use strict';

  // Application-wide constants keep future feature additions localized.
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var CANVAS_WIDTH = 1000;
  var CANVAS_HEIGHT = 700;
  var HANDLE_SIZE = 10;

  // Tool definitions describe placement defaults and visual intent.
  var TOOL_CONFIG = {
    outerWall: { label: '外壁線', family: 'line' },
    innerWall: { label: '内壁線', family: 'line' },
    livingArea: { label: '居室エリア', family: 'rect' },
    wetArea: { label: '水回りエリア', family: 'rect' },
    door: { label: 'ドア記号', family: 'symbol' },
    window: { label: '窓記号', family: 'symbol' },
    kitchen: { label: 'キッチン記号', family: 'symbol' },
    unitBath: { label: 'ユニットバス記号', family: 'symbol' },
    text: { label: 'テキスト', family: 'text' }
  };

  // Styling values are separated so drawing rules stay easy to maintain.
  var DRAW_STYLE = {
    outerWall: { stroke: '#253238', strokeWidth: 10 },
    innerWall: { stroke: '#4f5f66', strokeWidth: 6 },
    livingArea: { fill: '#f3e7d8', stroke: '#b89f7f', strokeWidth: 2 },
    wetArea: { fill: '#dff0fb', stroke: '#8db0c4', strokeWidth: 2 },
    text: { fill: '#1e2529', fontSize: 22 }
  };

  // Central state makes it easier to add templates or auto-detection later.
  var state = {
    activeTool: null,
    selectedId: null,
    elements: [],
    sourceImage: null,
    traceVisible: true,
    traceOpacity: 0.28,
    drag: null
  };

  var imageUpload = document.getElementById('imageUpload');
  var showTraceImage = document.getElementById('showTraceImage');
  var traceOpacity = document.getElementById('traceOpacity');
  var sourcePreview = document.getElementById('sourcePreview');
  var sourcePlaceholder = document.getElementById('sourcePlaceholder');
  var sourceInfo = document.getElementById('sourceInfo');
  var selectedTypeLabel = document.getElementById('selectedTypeLabel');
  var propX = document.getElementById('propX');
  var propY = document.getElementById('propY');
  var propWidth = document.getElementById('propWidth');
  var propHeight = document.getElementById('propHeight');
  var propRotation = document.getElementById('propRotation');
  var propLabel = document.getElementById('propLabel');
  var bringForwardButton = document.getElementById('bringForwardButton');
  var sendBackwardButton = document.getElementById('sendBackwardButton');
  var deleteButton = document.getElementById('deleteButton');
  var exportButton = document.getElementById('exportButton');
  var toolButtons = document.getElementById('toolButtons');
  var floorplanCanvas = document.getElementById('floorplanCanvas');
  var traceImage = document.getElementById('traceImage');
  var elementLayer = document.getElementById('elementLayer');
  var selectionLayer = document.getElementById('selectionLayer');

  function generateId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getSvgPoint(event) {
    var rect = floorplanCanvas.getBoundingClientRect();
    var scaleX = CANVAS_WIDTH / rect.width;
    var scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function createDefaultElement(tool, x, y) {
    var id = generateId(tool);

    if (tool === 'outerWall' || tool === 'innerWall') {
      return {
        id: id,
        type: tool,
        label: TOOL_CONFIG[tool].label,
        x1: clamp(x - 80, 0, CANVAS_WIDTH),
        y1: clamp(y, 0, CANVAS_HEIGHT),
        x2: clamp(x + 80, 0, CANVAS_WIDTH),
        y2: clamp(y, 0, CANVAS_HEIGHT),
        rotation: 0
      };
    }

    if (tool === 'livingArea' || tool === 'wetArea') {
      return {
        id: id,
        type: tool,
        x: clamp(x - 90, 0, CANVAS_WIDTH - 180),
        y: clamp(y - 70, 0, CANVAS_HEIGHT - 140),
        width: 180,
        height: 140,
        rotation: 0,
        label: tool === 'livingArea' ? '洋室' : '洗面室'
      };
    }

    if (tool === 'text') {
      return {
        id: id,
        type: tool,
        x: clamp(x, 20, CANVAS_WIDTH - 20),
        y: clamp(y, 24, CANVAS_HEIGHT - 20),
        width: 140,
        height: 36,
        rotation: 0,
        label: '部屋名'
      };
    }

    return {
      id: id,
      type: tool,
      x: clamp(x - 40, 0, CANVAS_WIDTH - 80),
      y: clamp(y - 20, 0, CANVAS_HEIGHT - 80),
      width: 80,
      height: 80,
      rotation: 0,
      label: TOOL_CONFIG[tool].label
    };
  }

  function getElementById(id) {
    return state.elements.find(function (item) {
      return item.id === id;
    }) || null;
  }

  function getBounds(element) {
    if (!element) {
      return null;
    }

    if (TOOL_CONFIG[element.type].family === 'line') {
      return {
        x: Math.min(element.x1, element.x2),
        y: Math.min(element.y1, element.y2),
        width: Math.max(24, Math.abs(element.x2 - element.x1)),
        height: Math.max(24, Math.abs(element.y2 - element.y1))
      };
    }

    if (element.type === 'text') {
      return {
        x: element.x,
        y: element.y - element.height,
        width: element.width,
        height: element.height
      };
    }

    return {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    };
  }

  function render() {
    renderTraceImage();
    renderElements();
    renderSelection();
    updatePropertyPanel();
  }

  // Source image is shared between the left preview and the canvas underlay.
  function renderTraceImage() {
    if (!state.sourceImage) {
      traceImage.setAttribute('href', '');
      traceImage.style.display = 'none';
      sourcePreview.classList.add('is-hidden');
      sourcePreview.style.display = 'none';
      sourcePlaceholder.classList.remove('is-hidden');
      sourceInfo.textContent = '画像未選択';
      return;
    }

    traceImage.setAttribute('href', state.sourceImage.url);
    traceImage.style.display = state.traceVisible ? 'block' : 'none';
    traceImage.setAttribute('opacity', String(state.traceOpacity));
    traceImage.setAttribute('width', String(CANVAS_WIDTH));
    traceImage.setAttribute('height', String(CANVAS_HEIGHT));

    sourcePreview.src = state.sourceImage.url;
    sourcePreview.style.display = 'block';
    sourcePreview.classList.remove('is-hidden');
    sourcePlaceholder.classList.add('is-hidden');
    sourceInfo.textContent = state.sourceImage.width + ' × ' + state.sourceImage.height + ' px';
  }

  // Drawing is rebuilt from state so later features can reuse the same pipeline.
  function renderElements() {
    elementLayer.innerHTML = '';

    state.elements.forEach(function (element) {
      var group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('data-id', element.id);
      group.classList.add('canvas-element');
      group.style.cursor = 'move';

      if (TOOL_CONFIG[element.type].family === 'line') {
        group.appendChild(createLineNode(element));
      } else if (TOOL_CONFIG[element.type].family === 'rect') {
        group.appendChild(createRectAreaNode(element));
      } else if (TOOL_CONFIG[element.type].family === 'text') {
        group.appendChild(createTextNode(element));
      } else {
        group.appendChild(createSymbolNode(element));
      }

      group.addEventListener('pointerdown', function (event) {
        event.stopPropagation();
        beginElementDrag(event, element.id);
      });

      elementLayer.appendChild(group);
    });
  }

  function createLineNode(element) {
    var line = document.createElementNS(SVG_NS, 'line');
    var style = DRAW_STYLE[element.type];

    line.setAttribute('x1', String(element.x1));
    line.setAttribute('y1', String(element.y1));
    line.setAttribute('x2', String(element.x2));
    line.setAttribute('y2', String(element.y2));
    line.setAttribute('stroke', style.stroke);
    line.setAttribute('stroke-width', String(style.strokeWidth));
    line.setAttribute('stroke-linecap', 'square');

    return line;
  }

  function createRectAreaNode(element) {
    var group = document.createElementNS(SVG_NS, 'g');
    var style = DRAW_STYLE[element.type];
    var rect = document.createElementNS(SVG_NS, 'rect');
    var text = document.createElementNS(SVG_NS, 'text');
    var cx = element.x + element.width / 2;
    var cy = element.y + element.height / 2;

    rect.setAttribute('x', String(element.x));
    rect.setAttribute('y', String(element.y));
    rect.setAttribute('width', String(element.width));
    rect.setAttribute('height', String(element.height));
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', style.fill);
    rect.setAttribute('stroke', style.stroke);
    rect.setAttribute('stroke-width', String(style.strokeWidth));

    text.setAttribute('x', String(cx));
    text.setAttribute('y', String(cy));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#1f2428');
    text.setAttribute('font-size', '20');
    text.setAttribute('font-weight', '700');
    text.textContent = element.label || '';

    if (element.rotation) {
      group.setAttribute('transform', 'rotate(' + element.rotation + ' ' + cx + ' ' + cy + ')');
    }

    group.appendChild(rect);
    group.appendChild(text);
    return group;
  }

  function createTextNode(element) {
    var text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(element.x));
    text.setAttribute('y', String(element.y));
    text.setAttribute('fill', DRAW_STYLE.text.fill);
    text.setAttribute('font-size', String(DRAW_STYLE.text.fontSize));
    text.setAttribute('font-weight', '700');
    text.textContent = element.label || '';
    return text;
  }

  // Symbol rendering stays isolated so additional fixtures can be added easily.
  function createSymbolNode(element) {
    var group = document.createElementNS(SVG_NS, 'g');
    var x = element.x;
    var y = element.y;
    var w = element.width;
    var h = element.height;
    var cx = x + w / 2;
    var cy = y + h / 2;

    if (element.rotation) {
      group.setAttribute('transform', 'rotate(' + element.rotation + ' ' + cx + ' ' + cy + ')');
    }

    if (element.type === 'door') {
      var doorLeaf = document.createElementNS(SVG_NS, 'path');
      var doorArc = document.createElementNS(SVG_NS, 'path');
      doorLeaf.setAttribute('d', 'M ' + x + ' ' + (y + h) + ' L ' + x + ' ' + y + ' L ' + (x + w) + ' ' + y);
      doorLeaf.setAttribute('fill', 'none');
      doorLeaf.setAttribute('stroke', '#34444a');
      doorLeaf.setAttribute('stroke-width', '4');
      doorArc.setAttribute('d', 'M ' + x + ' ' + y + ' A ' + w + ' ' + h + ' 0 0 1 ' + (x + w) + ' ' + (y + h));
      doorArc.setAttribute('fill', 'none');
      doorArc.setAttribute('stroke', '#9cb0b6');
      doorArc.setAttribute('stroke-width', '2');
      group.appendChild(doorLeaf);
      group.appendChild(doorArc);
      return group;
    }

    if (element.type === 'window') {
      var outer = document.createElementNS(SVG_NS, 'rect');
      var pane1 = document.createElementNS(SVG_NS, 'line');
      var pane2 = document.createElementNS(SVG_NS, 'line');
      outer.setAttribute('x', String(x));
      outer.setAttribute('y', String(y + h * 0.28));
      outer.setAttribute('width', String(w));
      outer.setAttribute('height', String(h * 0.44));
      outer.setAttribute('fill', '#ffffff');
      outer.setAttribute('stroke', '#4f5f66');
      outer.setAttribute('stroke-width', '3');
      pane1.setAttribute('x1', String(x + w / 3));
      pane1.setAttribute('y1', String(y + h * 0.28));
      pane1.setAttribute('x2', String(x + w / 3));
      pane1.setAttribute('y2', String(y + h * 0.72));
      pane1.setAttribute('stroke', '#9cb8d0');
      pane1.setAttribute('stroke-width', '2');
      pane2.setAttribute('x1', String(x + (w / 3) * 2));
      pane2.setAttribute('y1', String(y + h * 0.28));
      pane2.setAttribute('x2', String(x + (w / 3) * 2));
      pane2.setAttribute('y2', String(y + h * 0.72));
      pane2.setAttribute('stroke', '#9cb8d0');
      pane2.setAttribute('stroke-width', '2');
      group.appendChild(outer);
      group.appendChild(pane1);
      group.appendChild(pane2);
      return group;
    }

    if (element.type === 'kitchen') {
      var kitchenRect = document.createElementNS(SVG_NS, 'rect');
      var sink = document.createElementNS(SVG_NS, 'circle');
      var stove = document.createElementNS(SVG_NS, 'circle');
      var label = document.createElementNS(SVG_NS, 'text');
      kitchenRect.setAttribute('x', String(x));
      kitchenRect.setAttribute('y', String(y));
      kitchenRect.setAttribute('width', String(w));
      kitchenRect.setAttribute('height', String(h));
      kitchenRect.setAttribute('fill', '#ffffff');
      kitchenRect.setAttribute('stroke', '#4f5f66');
      kitchenRect.setAttribute('stroke-width', '3');
      sink.setAttribute('cx', String(x + w * 0.28));
      sink.setAttribute('cy', String(y + h * 0.38));
      sink.setAttribute('r', String(Math.min(w, h) * 0.12));
      sink.setAttribute('fill', 'none');
      sink.setAttribute('stroke', '#4f5f66');
      sink.setAttribute('stroke-width', '2');
      stove.setAttribute('cx', String(x + w * 0.72));
      stove.setAttribute('cy', String(y + h * 0.38));
      stove.setAttribute('r', String(Math.min(w, h) * 0.12));
      stove.setAttribute('fill', 'none');
      stove.setAttribute('stroke', '#4f5f66');
      stove.setAttribute('stroke-width', '2');
      label.setAttribute('x', String(cx));
      label.setAttribute('y', String(y + h * 0.78));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '16');
      label.setAttribute('font-weight', '700');
      label.textContent = 'K';
      group.appendChild(kitchenRect);
      group.appendChild(sink);
      group.appendChild(stove);
      group.appendChild(label);
      return group;
    }

    var bathRect = document.createElementNS(SVG_NS, 'rect');
    var tub = document.createElementNS(SVG_NS, 'rect');
    var bathLabel = document.createElementNS(SVG_NS, 'text');
    bathRect.setAttribute('x', String(x));
    bathRect.setAttribute('y', String(y));
    bathRect.setAttribute('width', String(w));
    bathRect.setAttribute('height', String(h));
    bathRect.setAttribute('fill', '#ffffff');
    bathRect.setAttribute('stroke', '#4f5f66');
    bathRect.setAttribute('stroke-width', '3');
    tub.setAttribute('x', String(x + w * 0.18));
    tub.setAttribute('y', String(y + h * 0.2));
    tub.setAttribute('width', String(w * 0.64));
    tub.setAttribute('height', String(h * 0.46));
    tub.setAttribute('rx', '8');
    tub.setAttribute('fill', '#eff7fd');
    tub.setAttribute('stroke', '#7aa3bc');
    tub.setAttribute('stroke-width', '2');
    bathLabel.setAttribute('x', String(cx));
    bathLabel.setAttribute('y', String(y + h * 0.84));
    bathLabel.setAttribute('text-anchor', 'middle');
    bathLabel.setAttribute('font-size', '15');
    bathLabel.setAttribute('font-weight', '700');
    bathLabel.textContent = 'UB';
    group.appendChild(bathRect);
    group.appendChild(tub);
    group.appendChild(bathLabel);
    return group;
  }

  function renderSelection() {
    selectionLayer.innerHTML = '';

    var selected = getElementById(state.selectedId);
    if (!selected) {
      return;
    }

    var bounds = getBounds(selected);
    var box = document.createElementNS(SVG_NS, 'rect');
    box.setAttribute('x', String(bounds.x));
    box.setAttribute('y', String(bounds.y));
    box.setAttribute('width', String(bounds.width));
    box.setAttribute('height', String(bounds.height));
    box.setAttribute('fill', 'none');
    box.setAttribute('stroke', '#008080');
    box.setAttribute('stroke-width', '2');
    box.setAttribute('stroke-dasharray', '8 5');
    selectionLayer.appendChild(box);

    if (TOOL_CONFIG[selected.type].family === 'line') {
      selectionLayer.appendChild(createEndpointHandle('start', selected.x1, selected.y1));
      selectionLayer.appendChild(createEndpointHandle('end', selected.x2, selected.y2));
      return;
    }

    ['nw', 'ne', 'sw', 'se'].forEach(function (direction) {
      selectionLayer.appendChild(createResizeHandle(bounds, direction));
    });
  }

  function createResizeHandle(bounds, direction) {
    var x = bounds.x;
    var y = bounds.y;

    if (direction.indexOf('e') !== -1) {
      x += bounds.width;
    }

    if (direction.indexOf('s') !== -1) {
      y += bounds.height;
    }

    var handle = document.createElementNS(SVG_NS, 'rect');
    handle.setAttribute('x', String(x - HANDLE_SIZE / 2));
    handle.setAttribute('y', String(y - HANDLE_SIZE / 2));
    handle.setAttribute('width', String(HANDLE_SIZE));
    handle.setAttribute('height', String(HANDLE_SIZE));
    handle.setAttribute('rx', '2');
    handle.setAttribute('fill', '#ffffff');
    handle.setAttribute('stroke', '#008080');
    handle.setAttribute('stroke-width', '2');
    handle.style.cursor = direction + '-resize';
    handle.addEventListener('pointerdown', function (event) {
      event.stopPropagation();
      beginResize(event, direction);
    });
    return handle;
  }

  function createEndpointHandle(pointName, x, y) {
    var handle = document.createElementNS(SVG_NS, 'circle');
    handle.setAttribute('cx', String(x));
    handle.setAttribute('cy', String(y));
    handle.setAttribute('r', '6');
    handle.setAttribute('fill', '#ffffff');
    handle.setAttribute('stroke', '#008080');
    handle.setAttribute('stroke-width', '2');
    handle.style.cursor = 'grab';
    handle.addEventListener('pointerdown', function (event) {
      event.stopPropagation();
      beginLineEndpointDrag(event, pointName);
    });
    return handle;
  }

  function selectElement(id) {
    state.selectedId = id;
    render();
  }

  function updatePropertyPanel() {
    var element = getElementById(state.selectedId);

    if (!element) {
      selectedTypeLabel.textContent = '未選択';
      propX.value = '';
      propY.value = '';
      propWidth.value = '';
      propHeight.value = '';
      propRotation.value = '';
      propLabel.value = '';
      return;
    }

    var bounds = getBounds(element);
    selectedTypeLabel.textContent = TOOL_CONFIG[element.type].label;
    propX.value = Math.round(bounds.x);
    propY.value = Math.round(bounds.y);
    propWidth.value = Math.round(bounds.width);
    propHeight.value = Math.round(bounds.height);
    propRotation.value = Math.round(element.rotation || 0);
    propLabel.value = element.label || '';
  }

  function beginElementDrag(event, id) {
    var element = getElementById(id);
    selectElement(id);
    state.drag = {
      kind: 'move',
      id: id,
      startPointer: getSvgPoint(event),
      snapshot: JSON.parse(JSON.stringify(element))
    };
    floorplanCanvas.setPointerCapture(event.pointerId);
  }

  function beginResize(event, direction) {
    var element = getElementById(state.selectedId);
    if (!element) {
      return;
    }

    state.drag = {
      kind: 'resize',
      id: element.id,
      direction: direction,
      startPointer: getSvgPoint(event),
      snapshot: JSON.parse(JSON.stringify(element))
    };
    floorplanCanvas.setPointerCapture(event.pointerId);
  }

  function beginLineEndpointDrag(event, pointName) {
    var element = getElementById(state.selectedId);
    if (!element) {
      return;
    }

    state.drag = {
      kind: 'line-endpoint',
      id: element.id,
      pointName: pointName,
      startPointer: getSvgPoint(event),
      snapshot: JSON.parse(JSON.stringify(element))
    };
    floorplanCanvas.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!state.drag) {
      return;
    }

    var element = getElementById(state.drag.id);
    if (!element) {
      return;
    }

    var pointer = getSvgPoint(event);
    var dx = pointer.x - state.drag.startPointer.x;
    var dy = pointer.y - state.drag.startPointer.y;

    if (state.drag.kind === 'move') {
      applyMove(element, state.drag.snapshot, dx, dy);
    } else if (state.drag.kind === 'resize') {
      applyResize(element, state.drag.snapshot, state.drag.direction, dx, dy);
    } else if (state.drag.kind === 'line-endpoint') {
      applyLineEndpointDrag(element, state.drag.snapshot, state.drag.pointName, dx, dy);
    }

    render();
  }

  function handlePointerUp(event) {
    if (!state.drag) {
      return;
    }

    floorplanCanvas.releasePointerCapture(event.pointerId);
    state.drag = null;
  }

  function applyMove(element, snapshot, dx, dy) {
    if (TOOL_CONFIG[element.type].family === 'line') {
      var nextDx = clamp(dx, -snapshot.x1, CANVAS_WIDTH - snapshot.x2);
      var nextDy = clamp(dy, -snapshot.y1, CANVAS_HEIGHT - snapshot.y2);
      element.x1 = snapshot.x1 + nextDx;
      element.y1 = snapshot.y1 + nextDy;
      element.x2 = snapshot.x2 + nextDx;
      element.y2 = snapshot.y2 + nextDy;
      return;
    }

    if (element.type === 'text') {
      element.x = clamp(snapshot.x + dx, 0, CANVAS_WIDTH - 20);
      element.y = clamp(snapshot.y + dy, element.height, CANVAS_HEIGHT);
      return;
    }

    element.x = clamp(snapshot.x + dx, 0, CANVAS_WIDTH - snapshot.width);
    element.y = clamp(snapshot.y + dy, 0, CANVAS_HEIGHT - snapshot.height);
  }

  function applyResize(element, snapshot, direction, dx, dy) {
    if (element.type === 'text') {
      element.width = clamp(snapshot.width + (direction.indexOf('e') !== -1 ? dx : -dx), 60, 400);
      element.height = clamp(snapshot.height + (direction.indexOf('s') !== -1 ? dy : -dy), 24, 120);
      if (direction.indexOf('w') !== -1) {
        element.x = clamp(snapshot.x + dx, 0, snapshot.x + snapshot.width - 60);
      }
      if (direction.indexOf('n') !== -1) {
        element.y = clamp(snapshot.y + dy, snapshot.height, CANVAS_HEIGHT);
      }
      return;
    }

    var nextX = snapshot.x;
    var nextY = snapshot.y;
    var nextWidth = snapshot.width;
    var nextHeight = snapshot.height;

    if (direction.indexOf('w') !== -1) {
      nextX = clamp(snapshot.x + dx, 0, snapshot.x + snapshot.width - 30);
      nextWidth = snapshot.width - (nextX - snapshot.x);
    }
    if (direction.indexOf('e') !== -1) {
      nextWidth = clamp(snapshot.width + dx, 30, CANVAS_WIDTH - snapshot.x);
    }
    if (direction.indexOf('n') !== -1) {
      nextY = clamp(snapshot.y + dy, 0, snapshot.y + snapshot.height - 30);
      nextHeight = snapshot.height - (nextY - snapshot.y);
    }
    if (direction.indexOf('s') !== -1) {
      nextHeight = clamp(snapshot.height + dy, 30, CANVAS_HEIGHT - snapshot.y);
    }

    element.x = nextX;
    element.y = nextY;
    element.width = nextWidth;
    element.height = nextHeight;
  }

  function applyLineEndpointDrag(element, snapshot, pointName, dx, dy) {
    if (pointName === 'start') {
      element.x1 = clamp(snapshot.x1 + dx, 0, CANVAS_WIDTH);
      element.y1 = clamp(snapshot.y1 + dy, 0, CANVAS_HEIGHT);
      return;
    }

    element.x2 = clamp(snapshot.x2 + dx, 0, CANVAS_WIDTH);
    element.y2 = clamp(snapshot.y2 + dy, 0, CANVAS_HEIGHT);
  }

  function addElementAtPointer(event) {
    if (!state.activeTool) {
      return;
    }

    var point = getSvgPoint(event);
    var element = createDefaultElement(state.activeTool, point.x, point.y);
    state.elements.push(element);
    state.selectedId = element.id;
    render();
  }

  function updateToolButtons() {
    toolButtons.querySelectorAll('.tool-button').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.tool === state.activeTool);
    });
  }

  function setActiveTool(tool) {
    state.activeTool = state.activeTool === tool ? null : tool;
    updateToolButtons();
  }

  function handleImageUpload(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      var image = new Image();
      image.onload = function () {
        state.sourceImage = {
          url: reader.result,
          width: image.width,
          height: image.height
        };
        render();
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function clearSelection() {
    state.selectedId = null;
    render();
  }

  function deleteSelectedElement() {
    if (!state.selectedId) {
      return;
    }

    state.elements = state.elements.filter(function (element) {
      return element.id !== state.selectedId;
    });
    state.selectedId = null;
    render();
  }

  function moveLayer(delta) {
    var index = state.elements.findIndex(function (element) {
      return element.id === state.selectedId;
    });

    if (index === -1) {
      return;
    }

    var nextIndex = clamp(index + delta, 0, state.elements.length - 1);
    if (nextIndex === index) {
      return;
    }

    var moved = state.elements.splice(index, 1)[0];
    state.elements.splice(nextIndex, 0, moved);
    render();
  }

  // Property application centralizes manual numeric edits from the inspector.
  function applyPropertyInputs() {
    var element = getElementById(state.selectedId);
    if (!element) {
      return;
    }

    var nextX = Number(propX.value);
    var nextY = Number(propY.value);
    var nextWidth = Number(propWidth.value);
    var nextHeight = Number(propHeight.value);
    var nextRotation = Number(propRotation.value);

    if (TOOL_CONFIG[element.type].family === 'line') {
      var bounds = getBounds(element);
      var dx = nextX - bounds.x;
      var dy = nextY - bounds.y;

      if (!Number.isNaN(nextX)) {
        element.x1 += dx;
        element.x2 += dx;
      }
      if (!Number.isNaN(nextY)) {
        element.y1 += dy;
        element.y2 += dy;
      }
      if (!Number.isNaN(nextWidth)) {
        element.x2 = element.x1 + (element.x2 >= element.x1 ? nextWidth : -nextWidth);
      }
      if (!Number.isNaN(nextHeight)) {
        element.y2 = element.y1 + (element.y2 >= element.y1 ? nextHeight : -nextHeight);
      }
    } else if (element.type === 'text') {
      if (!Number.isNaN(nextX)) {
        element.x = clamp(nextX, 0, CANVAS_WIDTH - 20);
      }
      if (!Number.isNaN(nextY)) {
        element.y = clamp(nextY + element.height, element.height, CANVAS_HEIGHT);
      }
      if (!Number.isNaN(nextWidth)) {
        element.width = clamp(nextWidth, 60, 400);
      }
      if (!Number.isNaN(nextHeight)) {
        element.height = clamp(nextHeight, 24, 120);
      }
    } else {
      if (!Number.isNaN(nextX)) {
        element.x = clamp(nextX, 0, CANVAS_WIDTH - 30);
      }
      if (!Number.isNaN(nextY)) {
        element.y = clamp(nextY, 0, CANVAS_HEIGHT - 30);
      }
      if (!Number.isNaN(nextWidth)) {
        element.width = clamp(nextWidth, 30, CANVAS_WIDTH - element.x);
      }
      if (!Number.isNaN(nextHeight)) {
        element.height = clamp(nextHeight, 30, CANVAS_HEIGHT - element.y);
      }
      if (!Number.isNaN(nextRotation)) {
        element.rotation = clamp(nextRotation, -180, 180);
      }
    }

    element.label = propLabel.value;
    render();
  }

  function downloadPng() {
    var clone = floorplanCanvas.cloneNode(true);
    clone.removeAttribute('class');
    clone.querySelector('#selectionLayer').innerHTML = '';

    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(clone);
    var blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var image = new Image();

    image.onload = function () {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = CANVAS_WIDTH * 2;
      canvas.height = CANVAS_HEIGHT * 2;
      context.scale(2, 2);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      URL.revokeObjectURL(url);

      var link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'floorplan-cleaner-export.png';
      link.click();
    };

    image.src = url;
  }

  function bindEvents() {
    imageUpload.addEventListener('change', handleImageUpload);
    showTraceImage.addEventListener('change', function () {
      state.traceVisible = showTraceImage.checked;
      render();
    });
    traceOpacity.addEventListener('input', function () {
      state.traceOpacity = Number(traceOpacity.value) / 100;
      render();
    });

    toolButtons.addEventListener('click', function (event) {
      var button = event.target.closest('.tool-button');
      if (!button) {
        return;
      }
      setActiveTool(button.dataset.tool);
    });

    floorplanCanvas.addEventListener('pointerdown', function (event) {
      if (event.target.closest('[data-id]') || event.target.closest('#selectionLayer')) {
        return;
      }

      if (state.activeTool) {
        addElementAtPointer(event);
        return;
      }

      clearSelection();
    });

    floorplanCanvas.addEventListener('pointermove', handlePointerMove);
    floorplanCanvas.addEventListener('pointerup', handlePointerUp);
    floorplanCanvas.addEventListener('pointerleave', function () {
      state.drag = null;
    });

    [propX, propY, propWidth, propHeight, propRotation].forEach(function (input) {
      input.addEventListener('change', applyPropertyInputs);
    });
    propLabel.addEventListener('input', applyPropertyInputs);

    bringForwardButton.addEventListener('click', function () {
      moveLayer(1);
    });
    sendBackwardButton.addEventListener('click', function () {
      moveLayer(-1);
    });
    deleteButton.addEventListener('click', deleteSelectedElement);
    exportButton.addEventListener('click', downloadPng);

    document.addEventListener('keydown', function (event) {
      if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedId) {
        if (event.target && event.target.tagName === 'INPUT') {
          return;
        }
        event.preventDefault();
        deleteSelectedElement();
      }
    });
  }

  function init() {
    bindEvents();
    updateToolButtons();
    render();
  }

  init();
})();
