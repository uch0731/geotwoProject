const opacityInput = document.getElementById('opacity-input');
const opacityOutput = document.getElementById('opacity-output');

var selectBox = document.getElementById("regionSelect");

fetch('http://localhost/map/regions')
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
            var option = document.createElement('option');
            option.text = item;
            selectBox.add(option);
        });
    })
    .catch(error => {
        console.error('데이터를 가져오는 도중 오류가 발생했습니다:', error);
    });

var drawActive = "";

//layer 관리 메뉴
var layerButton = document.getElementById('layerButton');
var layerDropdown = document.getElementById('layerDropdown');

layerButton.addEventListener('click', function (event) {
    event.stopPropagation();

    if (layerDropdown.classList.contains('show')) {
        layerDropdown
            .classList
            .remove('show');
        hideContextMenu();
    } else {
        layerDropdown
            .classList
            .add('show');
    }
});

layerDropdown.addEventListener('click', function (event) {
    event.stopPropagation();
});

window.addEventListener('click', function (event) {
    const contextMenu = document.getElementById('context-menu');
    const LayerInfoPopup = document.getElementById('popup');
    const LayerAttrPopup = document.getElementById('attrPopup');
    if (layerDropdown.classList.contains('show') && event.target !== contextMenu && !contextMenu.contains(event.target) && !LayerInfoPopup.contains(event.target) && !LayerAttrPopup.contains(event.target) && !canGetInfo) {
        layerDropdown
            .classList
            .remove('show');
        hideContextMenu();
    }
});

var source = new ol
    .source
    .OSM()

var viewLayer = new ol
    .layer
    .Tile({source: source});

var vworldSource = new ol
    .source
    .XYZ({url: 'http://xdworld.vworld.kr:8080/2d/Base/201802/{z}/{x}/{y}.png'});

var vworldViewLayer = new ol
    .layer
    .Tile({source: vworldSource});

var view = new ol.View({
    center: [
        126.9784, 37.5665
    ],
    zoom: 16,
    projection: 'EPSG:4326'
});

var overViewMapCtrl = new ol
    .control
    .OverviewMap({
        className: 'ol-overviewmap ol-custom-overviewmap',
        layers: [
            new ol
                .layer
                .Tile({source: source})
        ],
        collapseLabel: '\u00BB',
        label: '\u00AB',
        collapsed: true
    })

var mouseControlCoordinate = new ol
    .control
    .MousePosition({
        coordinateFormat: function (coord) {
            var lon = coord[0].toFixed(4);
            var lat = coord[1].toFixed(4);
            return '경도: ' + lon + ' 위도: ' + lat;
        },
        className: 'mposition',
        target: document.getElementById('mouseCoordinate')
    });

var mapView = new ol.Map({
    target: "map",
    layers: [viewLayer],
    view: view,
    controls: [
        new ol
            .control
            .Rotate(),
        overViewMapCtrl,
        mouseControlCoordinate
    ]
});

vworldViewLayer.setVisible(false);
mapView.addLayer(vworldViewLayer);

var startView = mapView
    .getView()
    .calculateExtent();

function makeLayer(
    layer,
    name = "",
    tableName = "",
    sequence = "",
    visible = false,
    opacity = 1.0,
    srs = "",
    bBox = [],
    schema = [],
    dataSource = []
) {
    this.layer = layer;
    this.name = name;
    this.tableName = tableName;
    this.sequence = sequence;
    this.visible = visible;
    this.opacity = opacity;
    this.srs = srs;
    this.bBox = bBox;
    this.schema = schema;
    this.dataSource = dataSource;
}

// 레이어 getMap 시군구 레이어
var getSggLayer = new ol
    .layer
    .Tile({
        source: new ol
            .source
            .TileWMS({
                url: 'http://localhost:9090/geoserver/wms',
                params: {
                    'LAYERS': 'seoul:lard_adm_sect_sgg'
                },
                serverType: 'geoserver'
            })
    });

var sggLayer = new makeLayer(getSggLayer);

//도로 레이어
var getRoadLayer = new ol
    .layer
    .Tile({
        source: new ol
            .source
            .TileWMS({
                url: 'http://localhost:9090/geoserver/wms',
                params: {
                    'LAYERS': 'seoul:seoul_road'
                },
                serverType: 'geoserver'
            })
    });
var roadLayer = new makeLayer(getRoadLayer);

//건물 레이어
var getBuildingLayer = new ol
    .layer
    .Tile({
        source: new ol
            .source
            .TileWMS({
                url: 'http://localhost:9090/geoserver/wms',
                params: {
                    'LAYERS': 'seoul:building'
                },
                serverType: 'geoserver'
            })
    });
var buildingLayer = new makeLayer(getBuildingLayer);

//학교 레이어
var getSchoolLayer = new ol
    .layer
    .Tile({
        source: new ol
            .source
            .TileWMS({
                url: 'http://localhost:9090/geoserver/wms',
                params: {
                    'LAYERS': 'seoul:elemschooldata'
                },
                serverType: 'geoserver'
            })
    });
var schoolLayer = new makeLayer(getSchoolLayer);

const layerInfoGroup = [sggLayer, roadLayer, buildingLayer, schoolLayer];
var layerGroup = new ol
    .layer
    .Group({});

layerGroup
    .getLayers()
    .push(sggLayer.layer);
layerGroup
    .getLayers()
    .push(roadLayer.layer);
layerGroup
    .getLayers()
    .push(buildingLayer.layer);
layerGroup
    .getLayers()
    .push(schoolLayer.layer);
mapView.addLayer(layerGroup);

var layerDropdown = document.getElementById('layerDropdown');
var layerCheckboxes = layerDropdown.querySelectorAll('input[type="checkbox"]');

// 체크박스 이벤트
function handleCheckboxChange(checkbox) {
    var layerId = checkbox.id;
    var layer = window[layerId];
    console.log(checkbox.id);
    if (checkbox.checked) {
        layer
            .layer
            .setVisible(true);
        layer.visible = true;
    } else {
        layer
            .layer
            .setVisible(false);
        layer.visible = false;
    }

    var layerCopy = {
        layerId: layerId,
        visible: layer.visible
    };

    updateLayerVisible(layerCopy);
}

// 체크박스에 이벤트 추가
layerCheckboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
        handleCheckboxChange(checkbox);
    });
});

// zoom-in, zoom-out 기능
document
    .getElementById('zoom-out')
    .onclick = function () {
        var view = mapView.getView();
        var zoom = view.getZoom();
        view.setZoom(zoom - 1);
    };

document
    .getElementById('zoom-in')
    .onclick = function () {
        var view = mapView.getView();
        var zoom = view.getZoom();
        view.setZoom(zoom + 1);
    };

var HistoryManager = function () {
    this.history = []; // 이동 기록을 저장할 배열
    this.currentIndex = -1; // 현재 인덱스를 초기화
    this.canMoveEnd = true;
    console.log(this.history, this.currentIndex);
};

HistoryManager.prototype.handleMoveEnd = function (event) {
    if (this.canMoveEnd) {
        var center = event
            .map
            .getView()
            .getCenter();
        var zoom = event
            .map
            .getView()
            .getZoom();

        // 현재 인덱스 이후의 기록 모두 제거
        this
            .history
            .splice(this.currentIndex + 1, this.history.length - this.currentIndex - 1);

        // 새로운 기록 추가
        this
            .history
            .push({center: center, zoom: zoom});

        if (this.history.length > 5) {
            this
                .history
                .shift(); // 가장 오래된 기록 제거
            this.currentIndex--;
        }

        // 현재 인덱스 갱신
        this.currentIndex = this.history.length - 1;
        console.log(this.history, this.currentIndex);
    }
    this.canMoveEnd = true;
};

HistoryManager.prototype.goBack = function () {
    this.canMoveEnd = false;
    if (this.currentIndex > 0) {
        this.currentIndex--;
        var historyEntry = this.history[this.currentIndex];
        mapView
            .getView()
            .setCenter(historyEntry.center);
        mapView
            .getView()
            .setZoom(historyEntry.zoom);
    }
    console.log(this.history, this.currentIndex);
};

HistoryManager.prototype.goForward = function () {
    this.canMoveEnd = false;
    if (this.currentIndex < this.history.length - 1) {
        this.currentIndex++;
        var historyEntry = this.history[this.currentIndex];
        mapView
            .getView()
            .setCenter(historyEntry.center);
        mapView
            .getView()
            .setZoom(historyEntry.zoom);
    }
    console.log(this.history, this.currentIndex);
};

var btnGoBack = document.getElementById('btnGoBack');
var btnGoForward = document.getElementById('btnGoForward');
var historyManager = new HistoryManager();
btnGoBack.addEventListener('click', historyManager.goBack.bind(historyManager));
btnGoForward.addEventListener(
    'click',
    historyManager.goForward.bind(historyManager)
);

mapView.on('moveend', historyManager.handleMoveEnd.bind(historyManager));

document
    .getElementById("set-view")
    .addEventListener("click", function () {
        mapView
            .getView()
            .fit(startView, {duration: 500});
    });

var selectedCheckbox;

document.addEventListener('mousedown', function (event) {
    const checkboxContainer = event
        .target
        .closest('.custom-checkbox');
    const contextMenu = document.getElementById('context-menu');
    if (event.target === checkboxContainer || event.target === contextMenu || contextMenu.contains(event.target) || event.target === layerDown || event.target === layerUp) {
        return;
    }
    if (event.target === selectedCheckbox) {
        selectedCheckbox
            .classList
            .remove('selected');
        selectedCheckbox = null;
        contextMenu.style.display = 'none';
    }
});

function toggleSelection(checkboxContainer, event) {
    if (selectedCheckbox === checkboxContainer && event.button === 0) {
        // 이미 선택된 체크박스를 다시 클릭하면 선택 해제
        checkboxContainer
            .classList
            .remove('selected');
        selectedCheckbox = null;
        hideContextMenu();
    } else {
        // 다른 체크박스를 클릭하면 선택
        if (selectedCheckbox) {
            selectedCheckbox
                .classList
                .remove('selected');
        }
        hideContextMenu();
        checkboxContainer
            .classList
            .add('selected');
        selectedCheckbox = checkboxContainer;
    }
}

function showContextMenu(event, checkboxContainer) {
    event.preventDefault();
    toggleSelection(checkboxContainer, event);
    const checkboxId = checkboxContainer
        .querySelector('input[type="checkbox"]')
        .id;
    var layer = window[checkboxId];
    opacityInput.value = layer
        .opacity
        .toFixed(2);
    opacityOutput.innerText = layer
        .opacity
        .toFixed(2);
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.display = 'block';
    contextMenu.style.zIndex = '9999';
    console.log(checkboxId);

}

function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'none';
}

document
    .getElementById("viewLayer")
    .addEventListener("click", function () {
        var id = selectedCheckbox
            .querySelector('input')
            .id;
        var layer = window[id];
        mapView
            .getView()
            .fit(layer.bBox, {
                padding: [10, 10, 10, 10]
            });
    });

const vectorSource = new ol
    .source
    .Vector();

var vector = new ol
    .layer
    .Vector({
        source: vectorSource,
        style: new ol
            .style
            .Style({
                fill: new ol
                    .style
                    .Fill({color: 'rgba(255, 255, 255, 0.7)'}),
                stroke: new ol
                    .style
                    .Stroke({color: '#ff6633', width: 2}),
                image: new ol
                    .style
                    .Circle({
                        radius: 7,
                        fill: new ol
                            .style
                            .Fill({color: '#ff6633'})
                    })
            })
    });
vector.setZIndex(999);
mapView.addLayer(vector);
const continuePolygonMsg = '두번 클릭하면 종료';
const continueLineMsg = '두번 클릭하면 종료';
let helpTooltipElement;
let helpTooltip;
let measureTooltipElement;
let measureTooltip;
let sketch;
let helpMsg;

const pointerMoveHandler = function (evt) {
    if (evt.dragging) {
        return;
    }

    helpMsg = '클릭하여 그리기 시작';

    if (sketch) {
        const geom = sketch.getGeometry();
        if (geom instanceof ol.geom.Polygon) {
            helpMsg = continuePolygonMsg;
        } else if (geom instanceof ol.geom.LineString) {
            helpMsg = continueLineMsg;
        }
    }

    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);

    helpTooltipElement
        .classList
        .remove('hidden');
};

var typeSelect = 'line';
let draw;

const formatLength = function (line) {
    const length = ol
        .sphere
        .getLength(line, {projection: 'EPSG:4326'});
    let output;
    if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + ' km';
    } else {
        output = Math.round(length * 100) / 100 + ' m';
    }
    return output;
};

const formatArea = function (polygon) {
    const area = ol
        .sphere
        .getArea(polygon, {projection: 'EPSG:4326'});
    let output;
    if (area > 10000) {
        output = Math.round((area / 1000000) * 100) / 100 + ' km<sup>2</sup>';
    } else {
        output = Math.round(area * 100) / 100 + ' m<sup>2</sup>';
    }
    return output;
};

const style = new ol
    .style
    .Style({
        fill: new ol
            .style
            .Fill({color: 'rgba(255, 255, 255, 0.7)'}),
        stroke: new ol
            .style
            .Stroke({
                color: 'rgba(0, 0, 0, 1.0)',
                lineDash: [
                    10, 10
                ],
                width: 2
            }),
        image: new ol
            .style
            .Circle({
                radius: 5,
                stroke: new ol
                    .style
                    .Stroke({color: 'rgba(0, 0, 0, 0.7)'}),
                fill: new ol
                    .style
                    .Fill({color: 'rgba(255, 255, 255, 0.9)'})
            })
    });

function addInteraction() {
    console.log("add");
    const type = typeSelect;
    draw = new ol
        .interaction
        .Draw({
            source: vectorSource,
            type: type,
            style: function (feature) {
                const geometryType = feature
                    .getGeometry()
                    .getType();
                if (geometryType === type || geometryType === 'Point') {
                    return style;
                }
            }
        });
    mapView.addInteraction(draw);

    createMeasureTooltip();
    createHelpTooltip();

    let listener;
    draw.on('drawstart', function (evt) {
        sketch = evt.feature;
        let tooltipCoord = evt.coordinate;

        listener = sketch
            .getGeometry()
            .on('change', function (evt) {
                const geom = evt.target;
                let output;
                if (geom instanceof ol.geom.Polygon) {
                    output = formatArea(geom);
                    tooltipCoord = geom
                        .getInteriorPoint()
                        .getCoordinates();
                } else if (geom instanceof ol.geom.LineString) {
                    output = formatLength(geom);
                    tooltipCoord = geom.getLastCoordinate();
                } else if (geom instanceof ol.geom.Circle) {
                    var circleToPolygon = ol
                        .geom
                        .Polygon
                        .fromCircle(geom);
                    output = formatArea(circleToPolygon);
                    tooltipCoord = circleToPolygon
                        .getInteriorPoint()
                        .getCoordinates();
                }
                measureTooltipElement.innerHTML = output;
                measureTooltip.setPosition(tooltipCoord);
            });
    });

    draw.on('drawend', function () {
        measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
        measureTooltip.setOffset([0, -7]);
        sketch = null;
        measureTooltipElement = null;
        createMeasureTooltip();
        ol
            .Observable
            .unByKey(listener);
    });
}

function createHelpTooltip() {
    if (helpTooltipElement) {
        helpTooltipElement
            .parentNode
            .removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'ol-tooltip hidden';
    helpTooltip = new ol.Overlay({
        element: helpTooltipElement,
        offset: [
            15, 0
        ],
        positioning: 'center-left'
    });
    mapView.addOverlay(helpTooltip);
}

function createMeasureTooltip() {
    if (measureTooltipElement) {
        measureTooltipElement
            .parentNode
            .removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
    measureTooltip = new ol.Overlay({
        element: measureTooltipElement,
        offset: [
            0, -15
        ],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false
    });
    mapView.addOverlay(measureTooltip);
}

const measureLine = document.getElementById('measureLine');
measureLine.addEventListener('click', function () {
    typeSelect = 'LineString';
    console.log(drawActive);
    mapView.removeInteraction(draw);
    if (drawActive == 'LineString') {
        mapView.removeEventListener('pointermove', pointerMoveHandler);
        helpTooltipElement.innerHTML = "";
        drawActive = '';
    } else {
        mapView.on('pointermove', pointerMoveHandler);
        addInteraction();
        drawActive = 'LineString';
    }
});

const measurePolygon = document.getElementById('measurePolygon');
measurePolygon.addEventListener('click', function () {
    typeSelect = 'Polygon';
    console.log(drawActive);
    mapView.removeInteraction(draw);
    if (drawActive == 'Polygon') {
        mapView.removeEventListener('pointermove', pointerMoveHandler);
        helpTooltipElement.innerHTML = "";
        drawActive = '';
    } else {
        mapView.on('pointermove', pointerMoveHandler);
        addInteraction();
        drawActive = 'Polygon';
    }
});

const measureCircle = document.getElementById('measureCircle');
measureCircle.addEventListener('click', function () {
    typeSelect = 'Circle';
    console.log(drawActive);
    mapView.removeInteraction(draw);
    if (drawActive == 'Circle') {
        mapView.removeEventListener('pointermove', pointerMoveHandler);
        helpTooltipElement.innerHTML = "";
        drawActive = '';
    } else {
        mapView.on('pointermove', pointerMoveHandler);
        addInteraction();
        drawActive = 'Circle';
    }
});
var selectedButton = null;

const refresh = document.getElementById('refresh');
refresh.addEventListener('click', function () {
    mapView.removeInteraction(draw);
    mapView
        .getOverlays()
        .clear();
    vector
        .getSource()
        .clear();
    selectedButton.style.backgroundColor = "";
    drawActive = "";
});

//이미지 저장
const imageDownload = document.getElementById('imageDownload');
imageDownload.addEventListener('click', function () {
    var mapCanvas = document.createElement('canvas');
    var mapSize = mapView.getSize();
    mapCanvas.width = mapSize[0];
    mapCanvas.height = mapSize[1];
    var mapContext = mapCanvas.getContext('2d');

    mapContext.drawImage(
        mapView.getTargetElement().querySelector('.ol-layer canvas'),
        0,
        0,
        mapSize[0],
        mapSize[1]
    );

    var mapImage = new Image();
    mapImage.src = mapCanvas.toDataURL();

    var link = document.createElement('a');
    link.href = mapImage.src;
    link.download = 'map_image.png';
    link.click();
});

//scale바

var scaleBar = document.getElementById('scale-bar');
scaleBar.value = getScale(mapView.getView());

mapView.on('moveend', function (event) {
    console.log(mapView.getView().getResolution());
    scaleBar.value = getScale(mapView.getView().getResolution()).toFixed(0);
});

// var scaleBar = document.getElementById('scale-bar'); scaleBar.innerHTML =
// getScale(mapView.getView()); mapView.on('moveend', function (event) {
// scaleBar.innerHTML = getScale(mapView.getView().getResolution()); });
// function getScale(view) {     var projection = view.getProjection();     var
// resolution = view.getResolution();      console.log(resolution);     var
// metersPerUnit = ol         .proj         .getPointResolution(projection,
// resolution, view.getCenter());     console.log(metersPerUnit);     return
// (metersPerUnit * 10000).toFixed(3); }

function getScale(resolution) {
    const units = mapView
        .getView()
        .getProjection()
        .getUnits();
    const dpi = 25.4 / 0.28;
    const mpu = ol
        .proj
        .Units
        .METERS_PER_UNIT[units];
    const scale = resolution * (mpu * 39.37 * dpi);
    return scale;
}

function changeColor(button) {
    if (selectedButton === button || selectedButton === null) {
        if (button.style.backgroundColor == "skyblue") {
            button.style.backgroundColor = "";
        } else {
            button.style.backgroundColor = "skyblue";
        }
    } else if (selectedButton !== null) {
        selectedButton.style.backgroundColor = "";
        button.style.backgroundColor = "skyblue";
    }
    selectedButton = button;
}

const viewOsm = document.getElementById('osm');
viewOsm.addEventListener('click', function () {
    viewLayer.setVisible(true);
    vworldViewLayer.setVisible(false);
});

const viewVworld = document.getElementById('vworld');
viewVworld.addEventListener('click', function () {
    viewLayer.setVisible(false);
    vworldViewLayer.setVisible(true);
});

function applyScale(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event
            .target
            .blur();
        createViewFromScale(event.target.value);
    }
}

function createViewFromScale(inputScale) {
    const units = mapView
        .getView()
        .getProjection()
        .getUnits();
    const dpi = 25.4 / 0.28;
    const mpu = ol
        .proj
        .Units
        .METERS_PER_UNIT[units];
    const resolution = inputScale / (mpu * 39.37 * dpi);

    console.log(resolution);
    var newView = new ol.View({
        center: mapView
            .getView()
            .getCenter(),
        resolution: resolution,
        projection: 'EPSG:4326'
    });
    // mapView     .getView()     .fit(newView.calculateExtent(), {duration: 500});
    mapView.setView(newView);
    console.log(mapView.getView().getResolution());
}

// function createViewFromScale(inputScale) {     console.log(inputScale); var
// scale = parseFloat(inputScale);     var resolution = (scale / 1000); 스케일을
// 해상도로 변환     console.log(resolution);     var newView = new ol.View({ center:
// mapView             .getView()             .getCenter(), resolution:
// resolution,         projection: 'EPSG:4326'     }); console.log(newView);
// mapView         .getView() .fit(newView.calculateExtent(), {duration: 500});
// } 레이어 위치 조절

var layerDropdown = document.getElementById("layerDropdown");
var selectedDivId;
var selectedDiv;
var nextSibling;
var nextSiblingId;
var previousSibling;
var previousSiblingid;

const layerUp = document.getElementById('layerUp');
layerUp.addEventListener('click', function () {
    selectedDivId = selectedCheckbox
        .querySelector('input')
        .id;
    var layer = window[selectedDivId];
    selectedDiv = document
        .getElementById(selectedDivId)
        .parentNode;
    previousSibling = getPreviousSiblingElement(selectedDiv);
    previousSiblingid = previousSibling
        .querySelector('input')
        .id;
    var prevLayer = window[previousSiblingid];
    if (layer.sequence < 3) {
        layer.sequence++;
        layer
            .layer
            .setZIndex(layer.sequence);
        prevLayer.sequence--;
        prevLayer
            .layer
            .setZIndex(prevLayer.sequence);
        layerDropdown.insertBefore(selectedDiv, previousSibling);
    }
    var layerCopy1 = {
        layerId: selectedDivId,
        sequence: layer.sequence
    };

    var layerCopy2 = {
        layerId: previousSiblingid,
        sequence: prevLayer.sequence
    };
    updateLayerSequence(layerCopy1);
    updateLayerSequence(layerCopy2);
    console.log(layer.sequence);
    console.log(prevLayer.sequence);
});

const layerDown = document.getElementById('layerDown');
layerDown.addEventListener('click', function () {
    selectedDivId = selectedCheckbox
        .querySelector('input')
        .id;
    var layer = window[selectedDivId];
    selectedDiv = document
        .getElementById(selectedDivId)
        .parentNode;
    nextSibling = getNextSiblingElement(selectedDiv);
    nextSiblingId = nextSibling
        .querySelector('input')
        .id;
    var nextLayer = window[nextSiblingId];
    if (layer.sequence > 0) {
        layer.sequence--;
        layer
            .layer
            .setZIndex(layer.sequence);
        nextLayer.sequence++;
        nextLayer
            .layer
            .setZIndex(nextLayer.sequence);
        layerDropdown.insertBefore(nextSibling, selectedDiv);
    }
    var layerCopy1 = {
        layerId: selectedDivId,
        sequence: layer.sequence
    };

    var layerCopy2 = {
        layerId: nextSiblingId,
        sequence: nextLayer.sequence
    };
    updateLayerSequence(layerCopy1);
    updateLayerSequence(layerCopy2);
    console.log(layer.sequence);
    console.log(nextLayer.sequence);
});

function getNextSiblingElement(element) {
    var sibling = element.nextSibling;
    while (sibling && sibling.nodeType !== 1) {
        sibling = sibling.nextSibling;
    }
    return sibling;
}

function getPreviousSiblingElement(element) {
    var sibling = element.previousSibling;
    while (sibling && sibling.nodeType !== 1) {
        sibling = sibling.previousSibling;
    }
    return sibling;
}

function update() {
    var id = selectedCheckbox
        .querySelector('input')
        .id;
    var layer = window[id];
    const opacity = parseFloat(opacityInput.value);
    layer
        .layer
        .setOpacity(opacity);
    layer.opacity = opacity;
    opacityOutput.innerText = opacity.toFixed(2);
}

opacityInput.addEventListener('input', update);

function moveEndRegion(event) {
    const center = mapView
        .getView()
        .getCenter();
    console.log(center);

    fetch('http://localhost/map/point/regions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(center)
    })
        .then(response => response.text()) // 응답 데이터를 문자열로 받음
        .then(data => {
            console.log(data);
            selectBox.value = data;
        })
        .catch(error => {
            console.error('요청을 보내는 도중 오류가 발생했습니다:', error);
        });

}

mapView.on('moveend', moveEndRegion);

regionSelect.addEventListener('change', function () {
    const selectedValue = selectBox.value;
    fetch('http://localhost/map/region/point', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedValue)
    })
        .then(response => response.text())
        .then(data => {
            const wktFormat = new ol
                .format
                .WKT();
            const feature = wktFormat.readFeature(data);

            if (feature) {
                const geometry = feature.getGeometry();

                if (geometry instanceof ol.geom.MultiPolygon) {
                    const extent = geometry.getExtent();
                    console.log("extent: " + extent);

                    mapView
                        .getView()
                        .fit(extent, {
                            padding: [50, 50, 50, 50]
                        });
                } else {
                    console.log("주어진 데이터가 멀티폴리곤 형식이 아닙니다.");
                }
            } else {
                console.log("데이터를 파싱할 수 없습니다.");
            }
        })
        .catch(error => {
            console.error(error);
        });
});

const layerInfoButton = document.getElementById('layerInfo');
const popup = document.getElementById('popup');
const closeButton = document.getElementsByClassName('close')[0];
const popupTitle = document.getElementById('popupTitle');
const layerDataSource = document.getElementById('layerDataSource');
const layerName = document.getElementById('layerName');
const layerSrs = document.getElementById('layerSrs');
const layerBBOX = document.getElementById('layerBBOX');
const layerSchema = document.getElementById('layerSchema');

layerInfoButton.addEventListener('click', showLayerInfo);
closeButton.addEventListener('click', closePopup);

function showLayerInfo() {
    layerSchema.innerHTML = "";

    var id = selectedCheckbox
        .querySelector('input')
        .id;
    var layer = window[id];

    layerDataSource.innerHTML = "스토어 : " + layer.dataSource[0] + "<br> 소스 : " +
            layer.dataSource[1];

    layerName.innerHTML = layer.name;
    layerSrs.innerHTML = layer.srs;

    layerBBOX.innerHTML = "minx : " + layer
        .bBox[0]
        .toFixed(4) + "&emsp; miny : " + layer
        .bBox[1]
        .toFixed(4) + "<br> maxx :  " + layer
        .bBox[2]
        .toFixed(4) + "&emsp;maxy : " + layer
        .bBox[3]
        .toFixed(4);

    Object
        .keys(layer.schema)
        .forEach(function (key) {
            var row = layerSchema.insertRow();
            var keyCell = row.insertCell();
            var valueCell = row.insertCell();
            keyCell.textContent = key;
            valueCell.textContent = layer.schema[key];
        });

    const popupTitleText = "[" + layer.name + "] 레이어 정보";
    popupTitle.textContent = popupTitleText;
    popup.style.display = 'block';
}

function closePopup() {
    popup.style.display = 'none';
}

const layerAttrButton = document.getElementById('layerAttr');
const attrPopup = document.getElementById('attrPopup');
const attrCloseButton = document.getElementsByClassName('attrPopupClose')[0];
const attrPopupTitle = document.getElementById('attrPopupTitle');
var layerAttrContent = document.getElementById('attrPopupContent');
const nextPageButton = document.getElementById('nextPageButton');
const prevPageButton = document.getElementById('prevPageButton');
var feautres = '';
var currentPage = 1;
var pageSize = 5;
var totalItems = 0;
var totalPages = 0;
var attrLayerName = "";
nextPageButton.addEventListener('click', fetchNextPage);
prevPageButton.addEventListener('click', fetchPrevPage);

layerAttrButton.addEventListener('click', showLayerAttr);
attrCloseButton.addEventListener('click', attrClosePopup);

function showLayerAttr() {
    console.log("show layer attr");
    var popupContent = document.getElementById('attrPopupContent');

    // 이전 내용 지우기
    currentPage = 1;
    pageSize = 5;
    totalItems = 0;
    totalPages = 0;
    popupContent.innerHTML = '';

    var id = selectedCheckbox
        .querySelector('input')
        .id;
    var layer = window[id];
    attrLayerName = layer.tableName;

    var baseUrl = 'http://localhost:9090/geoserver/wfs';
    var params = {
        'service': 'WFS',
        'version': '2.0.0',
        'request': 'GetFeature',
        'typeName': 'seoul:' + attrLayerName,
        'outputFormat': 'application/json'
    };

    var url = baseUrl + '?' + Object
        .keys(params)
        .map(function (key) {
            return key + '=' + encodeURIComponent(params[key]);
        })
        .join('&');

    fetchData(url)
        .then(function () {
            console.log(features); // features 변수 사용
            pagingData();
            // 추가적인 코드 작성
        })
        .catch(function (error) {
            console.log('오류 발생: ' + error);
        });

    const popupTitleText = "[" + attrLayerName + "] 속성 조회";
    attrPopupTitle.textContent = popupTitleText;
    attrPopup.style.display = 'block';
}

function fetchData(url) {
    return fetch(url)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('오류 발생: ' + response.status);
            }
        })
        .then(function (data) {
            features = data.features; // 레이어의 피처 목록
        })
        .catch(function (error) {
            console.log('오류 발생: ' + error);
        });
}

function attrClosePopup() {
    attrPopup.style.display = 'none';
}

function fetchNextPage() {
    console.log(currentPage);
    if (currentPage < totalPages) {
        currentPage++;
        pagingData();
    }
}

function fetchPrevPage() {
    console.log('이전 페이지');
    if (currentPage > 1) {
        currentPage--;
        pagingData();
    }
}
var highlightedRow = null; // 이전에 하이라이트된 row를 저장하는 변수

function pagingData() {
    totalItems = features.length;
    totalPages = Math.ceil(totalItems / pageSize);

    var startIndex = (currentPage - 1) * pageSize;
    var endIndex = Math.min(startIndex + pageSize, totalItems);
    var currentPageItems = features.slice(startIndex, endIndex);
    var attributeNames = Object.keys(currentPageItems[0].properties);

    var html = '<table>';
    html += '<thead><tr>';
    attributeNames.forEach(function (attributeName) {
        html += '<th>' + attributeName + '</th>';
    });
    html += '</tr></thead>';
    html += '<tbody>';
    currentPageItems.forEach(function (feature) {
        var properties = feature.properties;
        html += '<tr>';
        attributeNames.forEach(function (attributeName) {
            html += '<td>' + properties[attributeName] + '</td>';
        });
        html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    layerAttrContent.innerHTML = html;

    var rows = document.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        row.addEventListener('click', function () {
            var rowData = this.cells;
            var jsonData = {};

            for (var j = 0; j < rowData.length; j++) {
                var columnName = attributeNames[j];
                var cellData = rowData[j].innerHTML;
                jsonData[columnName] = cellData;
            }

            console.log(jsonData);
            if (highlightedRow !== null) {
                highlightedRow
                    .classList
                    .remove('highlight');
            }

            // 클릭한 row에 하이라이트 클래스 추가
            this
                .classList
                .add('highlight');
            highlightedRow = this; // 현재 클릭한 row를 저장
            fetch('http://localhost/map/selected/' + attrLayerName, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            })
                .then(response => response.text())
                .then(data => {
                    const wktFormat = new ol
                        .format
                        .WKT();
                    const feature = wktFormat.readFeature(data);

                    if (feature) {
                        const geometry = feature.getGeometry();

                        if (geometry instanceof ol.geom.MultiPolygon) {
                            const extent = geometry.getExtent();
                            console.log("extent: " + extent);

                            mapView
                                .getView()
                                .fit(extent, {
                                    padding: [50, 50, 50, 50]
                                });
                        } else {
                            console.log("주어진 데이터가 멀티폴리곤 형식이 아닙니다.");
                        }
                    } else {
                        console.log("데이터를 파싱할 수 없습니다.");
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        });
    }

    var pagingInfo = '페이지: ' + currentPage + '/' + totalPages;
    document
        .getElementById('paging-info')
        .innerHTML = pagingInfo;

    if (currentPage === totalPages) {
        document
            .getElementById('nextPageButton')
            .disabled = true;
    } else {
        document
            .getElementById('nextPageButton')
            .disabled = false;
    }
}

var x = 0;
var y = 0;
document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function (event) {
        if (canGetInfo) {
            x = event.pageX;
            y = event.pageY;
        }
    });
});

var mapObjectHandler = function (event) {
    var coordinate = event.coordinate;
    var id = selectedCheckbox
        .querySelector('input')
        .id;
    var layer = window[id];

    var params = {
        'service': 'WFS',
        'version': '2.0.0',
        'request': 'GetFeature',
        'typeName': 'seoul:' + layer.tableName,
        'outputFormat': 'application/json',
        'cql_filter': 'INTERSECTS(the_geom,POINT(' + coordinate[1] + ' ' + coordinate[0] + '))'
    };

    var url = 'http://localhost:9090/geoserver/wfs?' + new URLSearchParams(params).toString();
    console.log(url)

    fetch(url)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Geoserver에서 응답을 받지 못했습니다.');
            }
        })
        .then(function (data) {
            console.log(data.features[0].properties);
            showObjInfo(data.features[0].properties);
        })
        .catch(function (error) {
            console.error('오류 발생:', error);
        });
};

var canGetInfo = false;
const objectInfo = document.getElementById('retrieve');
objectInfo.addEventListener('click', function () {
    canGetInfo = !canGetInfo;
    if (canGetInfo) {
        console.log('객체조회 가능');
        mapView.on('click', mapObjectHandler);
    } else {
        objPopup.style.display = 'none';
        mapView.un('click', mapObjectHandler);
    }
});

function changeColor2(button) {
    if (button.style.backgroundColor == "skyblue") {
        button.style.backgroundColor = "";
    } else {
        button.style.backgroundColor = "skyblue";
    }
}

const objPopup = document.getElementById('objPopup');
const objPopupClose = document.getElementsByClassName('objPopupClose')[0];
const objPopupTitle = document.getElementById('objPopupTitle');
var objPopupContent = document.getElementById('objPopupContent');

objPopupClose.addEventListener('click', objClosePopup);

function showObjInfo(data) {
    objPopupContent.innerHTML = '';
    var id = selectedCheckbox
        .querySelector('input')
        .id;
    var layer = window[id];

    const popupTitleText = "[" + layer.name + "] 객체조회";

    Object
        .keys(data)
        .forEach(function (key) {
            var row = objPopupContent.insertRow();
            var keyCell = row.insertCell();
            var valueCell = row.insertCell();
            keyCell.textContent = key;
            valueCell.textContent = data[key];
        });
    objPopupTitle.textContent = popupTitleText;
    objPopup.style.left = x;
    objPopup.style.top = y;
    objPopup.style.display = 'block';
}

function objClosePopup() {
    console.log("닫기");
    objPopup.style.display = 'none';
}

// 초기세팅
fetch('http://localhost/map/layerMetaInfo')
    .then(response => response.json())
    .then(data => {
        var arr = [];
        data.forEach(item => {
            console.log(item);

            const text = document.getElementById(item.layerId + 'Label');
            setLayerVisible(item);
            arr.push(item.layerId);
            setLayerName(item);
            text.innerHTML = item.name;
        });
        setLayerOrder(arr);
        for (let i = 0; i < layerInfoGroup.length; i++) {
            let element = layerInfoGroup[i];
            getLayerInfo(element);
        }
    })
    .catch(error => {
        console.error('데이터를 가져오는 도중 오류가 발생했습니다:', error);
    });

//시작할때 레이어 정보 세팅
function getLayerInfo(layer) {
    const url = 'http://localhost:9090/geoserver/rest/workspaces/seoul/datastores/seoul/feature' +
            'types/' + layer.tableName + '.json';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const boundingBox = data.featureType.nativeBoundingBox;
            layer.srs = data.featureType.srs;
            layer.dataSource = [data.featureType.store.name, data.featureType.name];
            layer.bBox = [boundingBox.minx, boundingBox.miny, boundingBox.maxx, boundingBox.maxy];
            console.log(layer);

            var attributes = data.featureType.attributes.attribute;

            for (var i = 0; i < attributes.length; i++) {
                var attribute = attributes[i];
                var str = attribute.binding;
                var parts = str.split(".");
                layer.schema[attribute.name] = parts[parts.length - 1];
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

function setLayerVisible(item) {
    var target = document.getElementById(item.layerId);
    var layer = window[item.layerId];

    if (item.visible) {
        layer
            .layer
            .setVisible(true);
        layer.visible = true;
        target.checked = true;
    } else {
        layer
            .layer
            .setVisible(false);
        layer.visible = false;
        target.checked = false;

    }
}
function setLayerName(item) {
    var layer = window[item.layerId];
    layer.name = item.name;
    layer.tableName = item.tableName;
}
function setLayerOrder(newOrder) {
    var container = document.getElementById("layerDropdown");
    var index = 3;
    newOrder.forEach(function (selectedDivId) {
        var layer = window[selectedDivId];
        var selectedDiv = document
            .getElementById(selectedDivId)
            .parentNode;
        layer.sequence = index;
        layer
            .layer
            .setZIndex(index);
        index--;
        container.appendChild(selectedDiv);
    });
}

function updateLayerVisible(target) {
    fetch('http://localhost/map/layerMetaInfo/visible', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(target)
    })
}

function updateLayerSequence(target) {
    fetch('http://localhost/map/layerMetaInfo/sequence', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(target)
    })
}

function updateLayerName(target) {
    fetch('http://localhost/map/layerMetaInfo/name', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(target)
    })
}

function changeLayerName(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event
            .target
            .blur();
    }
}

var saveButton = document.getElementById('save');

saveButton.addEventListener('click', function () {
    console.log(layerName.textContent);

    var layerId = selectedCheckbox
        .querySelector('input')
        .id;
    var layer = window[layerId];
    layer.name = layerName
        .textContent
        .trim();
    var layerCopy = {
        layerId: layerId,
        name: layer.name
    };

    updateLayerName(layerCopy);
    closePopup();
    const text = document.getElementById(layerId + 'Label');
    text.innerHTML = layer.name;
});

//검색

const searchPopup = document.getElementById('searchPopup');
const searchPopupcloseButton = document.getElementsByClassName(
    'searchPopupclose'
)[0];
const searchPopupTtile = document.getElementById('searchPopupTitle');
var searchResult = document.getElementById('searchResult');
searchPopupcloseButton.addEventListener('click', closeSearchPopup);

const params = new URLSearchParams({
    service: 'search',
    request: 'search',
    version: '2.0',
    crs: 'EPSG:4326',
    size: 5,
    page: 1,
    query: '',
    type: 'place',
    format: 'json',
    errorformat: 'json',
    domain: 'http://127.0.0.1:9091/projectMap.html',
    key: '9CFEBF3D-D9AC-3EB3-BC78-5380CF807E5E'
});

const baseUrl = 'https://api.vworld.kr/req/search';

function search() {

    searchResult.innerHTML = '';
    var searchInput = document.getElementById('search-input');
    if (searchInput.value != params.get('query')) {
        searchLayerGroup
            .getLayers()
            .clear();
        params.set('page', 1);
    }
    params.set('query', searchInput.value);
    const url = `${baseUrl}?${params.toString()}`;
    console.log(url);
    console.log(params.get('page'));
    //cors error 해결위해 ajax 사용 -> dataType jsonp
    $.ajax({
        type: "get",
        url: "http://api.vworld.kr/req/search",
        data: params.toString(),
        dataType: 'jsonp',
        async: false,
        success: function (data) {
            console.log(data.response.status);
            if (data.response.status == "NOT_FOUND" || data.response.status == "ERROR") {
                alert("검색결과가 없습니다.");
            } else {
                extractedData = [];
                for (var i = 0; i < data.response.result.items.length; i++) {
                    var item = data
                        .response
                        .result
                        .items[i];
                    extractedData.push(
                        {title: item.title, road: item.address.road, parcel: item.address.parcel, longitude: item.point.x, latitude: item.point.y}
                    );
                }

                Object
                    .keys(extractedData)
                    .forEach(function (key) {
                        var row = searchResult.insertRow();
                        var keyCell = row.insertCell();
                        var valueCell = row.insertCell();
                        keyCell.textContent = Number(key) + 1;
                        valueCell.innerHTML = '장소 : ' + extractedData[key].title + '<br>도로명 주소 : ' +
                                extractedData[key].road + '<br>주소 : ' + extractedData[key].parcel;
                        row.addEventListener('click', function () {
                            var rowData = this.cells;
                            var cellData = rowData[0].innerHTML;
                            console.log(
                                extractedData[cellData - 1].longitude + " " + extractedData[cellData - 1].latitude
                            );
                        });
                    });
                console.log(extractedData);
                displayPoint(extractedData);
            }
        },
        complete: function () {
            console.log('good');
        },
        error: function (xhr, status, error) {
            console.log(xhr, status, error);
        }
    });

    const popupTitleText = "[" + searchInput.value + "] 검색 결과";
    searchPopupTtile.textContent = popupTitleText;
    searchPopup.style.display = 'block';
}

var searchLayerGroup = new ol
    .layer
    .Group({});
mapView.addLayer(searchLayerGroup);

function displayPoint(items) {
    var points = [];
    // schools 배열을 순회하면서 각 학교의 좌표를 지도에 표시
    items.forEach(function (item) {
        const wkt = 'POINT (' + item.longitude + ' ' + item.latitude + ')';
        var coordinates = wktToCoordinates(wkt); // WKT 좌표를 OpenLayers 좌표로 변환
        var marker = new ol.Feature({
            geometry: new ol
                .geom
                .Point(coordinates)
                // type: 'school' type 속성 추가
        }); // 좌표로부터 특징(feature) 생성
        var style = new ol
            .style
            .Style({
                image: new ol
                    .style
                    .Circle({
                        radius: 7,
                        fill: new ol
                            .style
                            .Fill({color: 'blue'}),
                        stroke: new ol
                            .style
                            .Stroke({color: 'white', width: 2})
                    }),
                text: new ol
                    .style
                    .Text({
                        // 텍스트 스타일 추가
                        text: '📍' + item.title,
                        // 학교 이름을 텍스트로 표시
                        fill: new ol
                            .style
                            .Fill({color: 'black'}),
                        stroke: new ol
                            .style
                            .Stroke({color: 'white', width: 2}),
                        offsetX: 0,
                        offsetY: -15
                    })
            });
        marker.setStyle(style);
        points.push(marker);
        // marker.setProperties({schoolName: school.schoolName});
        // schoolLayerGroup.getLayers().push(vectorLayer);
        // mapView.addLayer(vectorLayer);  지도에 레이어 추가
    });

    var vectorSource = new ol
        .source
        .Vector({
            features: points // 특징(feature)을 담은 벡터 소스 생성
        });

    var vectorLayer = new ol
        .layer
        .Vector({
            source: vectorSource // 벡터 소스를 담은 레이어 생성
        });
    searchLayerGroup
        .getLayers()
        .push(vectorLayer);
    console.log(searchLayerGroup);
}

function closeSearchPopup() {
    searchPopup.style.display = 'none';
}

function clearInput() {
    searchLayerGroup
        .getLayers()
        .clear();
    params.set('page', 1);
    closeSearchPopup();
    var searchInput = document.getElementById('search-input');
    searchInput.value = "";
}

const prevPageSearch = document.getElementById('prevPageSearch');
const nextPageSearch = document.getElementById('nextPageSearch');
prevPageSearch.addEventListener('click', prevSearch);
nextPageSearch.addEventListener('click', nextSearch);

function prevSearch() {
    if (params.get('page') > 1) {
        params.set('page', Number(params.get('page')) - 1);
        search();
    }
}

function nextSearch() {
    params.set('page', Number(params.get('page')) + 1);
    search();
}

function wktToCoordinates(wkt) {
    // WKT 파서 생성
    var format = new ol
        .format
        .WKT();
    // WKT를 OpenLayers 좌표로 변환
    var feature = format.readFeature(wkt);
    var coordinates = feature
        .getGeometry()
        .getCoordinates();
    return coordinates;
} 