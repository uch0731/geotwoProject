var drawActive = false;

//layer 관리 메뉴
var layerButton = document.getElementById('layerButton');
var layerDropdown = document.getElementById('layerDropdown');

layerButton.addEventListener('click', function (event) {
    event.stopPropagation(); // 이벤트 버블링 방지

    if (layerDropdown.classList.contains('show')) {
        layerDropdown
            .classList
            .remove('show');
        // hideContextMenu();
    } else {
        layerDropdown
            .classList
            .add('show');
    }
});

layerDropdown.addEventListener('click', function (event) {
    event.stopPropagation(); // 이벤트 버블링 방지
});

window.addEventListener('click', function (event) {
    const contextMenu = document.getElementById('context-menu');
    if (layerDropdown.classList.contains('show') && event.target !== contextMenu && !contextMenu.contains(event.target)) {
        layerDropdown
            .classList
            .remove('show');
    }
    // hideContextMenu();
});

//드래그앤 드롭 기능 source 생성
var source = new ol
    .source
    .OSM()

//타일레이어 생성하기
var viewLayer = new ol
    .layer
    .Tile({source: source});

//view 생성
var view = new ol.View({
    center: [
        126.9784, 37.5665
    ],
    zoom: 16,
    projection: 'EPSG:4326'
});

//overviewmap 생성하기
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
        collapsed: true, // 처음에는 축소된 상태로 시작

    })

var mouseControlCoordinate = new ol
    .control
    .MousePosition({
        coordinateFormat: function (coord) {
            var lon = coord[0].toFixed(4); // 경도를 소수점 셋째 자리까지 표시
            var lat = coord[1].toFixed(4); // 위도를 소수점 셋째 자리까지 표시
            return '경도: ' + lon + ' 위도: ' + lat;
        },
        className: 'mposition', // CSS 클래스 이름
        target: document.getElementById('mouseCoordinate'), // 좌표를 표시할 요소
    });

var mapView = new ol.Map({
    target: "map",
    layers: [viewLayer],
    view: view,
    controls: [
        // 원하는 컨트롤들을 여기에 지정합니다
        new ol
            .control
            .Rotate(),
        overViewMapCtrl,
        mouseControlCoordinate
    ]
});

var startView = mapView
    .getView()
    .calculateExtent();

// 레이어 getMap 시군구 레이어
var sggLayer = new ol
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
sggLayer.setVisible(false);

//도로 레이어
var roadLayer = new ol
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
roadLayer.setVisible(false);

//건물 레이어
var buildingLayer = new ol
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
buildingLayer.setVisible(false);

//학교 레이어
var schoolLayer = new ol
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
schoolLayer.setVisible(false);

//Visible false 인 레이어들 추가
mapView.addLayer(sggLayer);
mapView.addLayer(roadLayer);
mapView.addLayer(buildingLayer);
mapView.addLayer(schoolLayer);

// 체크박스 요소 가져오기
var layerDropdown = document.getElementById('layerDropdown');
var layerCheckboxes = layerDropdown.querySelectorAll('input[type="checkbox"]');

// 체크박스에 이벤트 추가
layerCheckboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
        var layerId = checkbox.id;
        var layer = window[layerId]; // 이미 정의된 레이어 변수 사용

        if (checkbox.checked) {
            layer.setVisible(true);
        } else {
            layer.setVisible(false);
        }
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

        // 최대 5개의 기록 관리
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

var selectedCheckbox; // 선택된 체크박스를 저장할 변수

document.addEventListener('mousedown', function (event) {
    const checkboxContainer = event
        .target
        .closest('.custom-checkbox');
    const contextMenu = document.getElementById('context-menu');
    if (checkboxContainer || event.target === contextMenu || contextMenu.contains(event.target)) {
        // 체크박스나 컨텍스트 메뉴 내부를 클릭한 경우는 처리하지 않음
        return;
    }
    if (selectedCheckbox) {
        // 체크박스 외부를 클릭한 경우 선택 해제 및 컨텍스트 메뉴 숨김
        selectedCheckbox
            .classList
            .remove('selected');
        selectedCheckbox = null;
        contextMenu.style.display = 'none';
    }
});

function toggleSelection(checkboxContainer) {
    if (selectedCheckbox === checkboxContainer) {
        // 이미 선택된 체크박스를 다시 클릭하면 선택 해제
        checkboxContainer
            .classList
            .remove('selected');
        selectedCheckbox = null;
        hideContextMenu();
    } else {
        // 다른 체크박스를 클릭하면 선택 처리
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
    toggleSelection(checkboxContainer);

    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.display = 'block';
    contextMenu.style.zIndex = '9999';
    const checkboxId = checkboxContainer
        .querySelector('input[type="checkbox"]')
        .id;
    console.log(checkboxId);

}

function hideContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.display = 'none';
}

function performFunction1() {
    // 기능1 수행
}

function performFunction2() {
    // 기능2 수행
}

function performFunction3() {
    // 기능3 수행
}

const opacityInput = document.getElementById('opacity-input');
const opacityOutput = document.getElementById('opacity-output');
function update() {
    const opacity = parseFloat(opacityInput.value);
    sggLayer.setOpacity(opacity);
    opacityOutput.innerText = opacity.toFixed(2);
}
opacityInput.addEventListener('input', update);
update();

// draw
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

mapView.addLayer(vector);
const continuePolygonMsg = '두번 클릭하면 종료';
const continueLineMsg = '두번 클릭하면 종료';
let helpTooltipElement;
let helpTooltip;
let measureTooltipElement;
let measureTooltip;
let sketch;
let helpMsg;

// mapView     .getViewport()     .addEventListener('mouseout', function () {
// helpTooltipElement             .classList             .add('hidden');     });

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
    drawActive = !drawActive; // 그리기 모드 상태 반전
    console.log(drawActive);
    if (drawActive) {
        mapView.on('pointermove', pointerMoveHandler);
        addInteraction(); // 그리기 도구 활성화
    } else {
        mapView.removeEventListener('pointermove', pointerMoveHandler);
        mapView.removeInteraction(draw); // 그리기 도구 비활성화
        helpTooltipElement.innerHTML = "";
    }
});

const measurePolygon = document.getElementById('measurePolygon');
measurePolygon.addEventListener('click', function () {
    typeSelect = 'Polygon';
    drawActive = !drawActive; // 그리기 모드 상태 반전
    console.log(drawActive);
    if (drawActive) {
        mapView.on('pointermove', pointerMoveHandler);
        addInteraction(); // 그리기 도구 활성화
    } else {
        mapView.removeEventListener('pointermove', pointerMoveHandler);
        mapView.removeInteraction(draw); // 그리기 도구 비활성화
        helpTooltipElement.innerHTML = "";
    }
});

const measureCircle = document.getElementById('measureCircle');
measureCircle.addEventListener('click', function () {
    typeSelect = 'Circle';
    drawActive = !drawActive; // 그리기 모드 상태 반전
    console.log(drawActive);
    if (drawActive) {
        mapView.on('pointermove', pointerMoveHandler);
        addInteraction(); // 그리기 도구 활성화
    } else {
        mapView.removeEventListener('pointermove', pointerMoveHandler);
        mapView.removeInteraction(draw); // 그리기 도구 비활성화
        helpTooltipElement.innerHTML = "";
    }
});

const refresh = document.getElementById('refresh');
refresh.addEventListener('click', function () {
    mapView
        .getOverlays()
        .clear();
    vector
        .getSource()
        .clear();
});

//이미지 저장
const imageDownload = document.getElementById('imageDownload');
imageDownload.addEventListener('click', function () {
    var mapCanvas = document.createElement('canvas');
    var mapSize = mapView.getSize();
    mapCanvas.width = mapSize[0];
    mapCanvas.height = mapSize[1];
    var mapContext = mapCanvas.getContext('2d');

    // 맵을 캔버스에 그립니다.
    mapContext.drawImage(
        mapView.getTargetElement().querySelector('.ol-layer canvas'),
        0,
        0,
        mapSize[0],
        mapSize[1]
    );

    // Canvas의 데이터를 이미지로 변환합니다.
    var mapImage = new Image();
    mapImage.src = mapCanvas.toDataURL();

    // 이미지를 다운로드합니다.
    var link = document.createElement('a');
    link.href = mapImage.src;
    link.download = 'map_image.png';
    link.click();
});

//scale바

var scaleBar = document.getElementById('scale-bar');
scaleBar.innerHTML = 'Scale: 1 : ' + getScale(mapView.getView()) + ' km';

mapView.on('moveend', function (event) {
    scaleBar.innerHTML = 'Scale: 1 : ' + getScale(mapView.getView()) + ' km';
});

function getScale(view) {
    var projection = view.getProjection();
    var resolution = view.getResolution();
    var dpi = window.devicePixelRatio * 96; // Get the actual DPI of the device
    // console.log(resolution);
    var metersPerUnit = ol
        .proj
        .getPointResolution(projection, resolution, view.getCenter());
    console.log(metersPerUnit);
    return (metersPerUnit * 10000).toFixed(3); // Convert to kilometers
}