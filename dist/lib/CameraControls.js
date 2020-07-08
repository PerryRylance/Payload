"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraControls = void 0;
var types_1 = require("./types");
var constants_1 = require("./constants");
var math_utils_1 = require("./utils/math-utils");
var isTouchEvent_1 = require("./utils/isTouchEvent");
var extractClientCoordFromEvent_1 = require("./utils/extractClientCoordFromEvent");
var notSupportedInOrthographicCamera_1 = require("./utils/notSupportedInOrthographicCamera");
var EventDispatcher_1 = require("./EventDispatcher");
var isMac = /Mac/.test(navigator.platform);
var readonlyACTION = Object.freeze(types_1.ACTION);
var TOUCH_DOLLY_FACTOR = 1 / 8;
var THREE;
var _ORIGIN;
var _AXIS_Y;
var _AXIS_Z;
var _v2;
var _v3A;
var _v3B;
var _v3C;
var _xColumn;
var _yColumn;
var _sphericalA;
var _sphericalB;
var _box3A;
var _box3B;
var _quaternionA;
var _quaternionB;
var _rotationMatrix;
var _raycaster;
var CameraControls = (function (_super) {
    __extends(CameraControls, _super);
    function CameraControls(camera, domElement) {
        var _this = _super.call(this) || this;
        _this.enabled = true;
        _this.minPolarAngle = 0;
        _this.maxPolarAngle = Math.PI;
        _this.minAzimuthAngle = -Infinity;
        _this.maxAzimuthAngle = Infinity;
        _this.minDistance = 0;
        _this.maxDistance = Infinity;
        _this.minZoom = 0.01;
        _this.maxZoom = Infinity;
        _this.dampingFactor = 0.05;
        _this.draggingDampingFactor = 0.25;
        _this.azimuthRotateSpeed = 1.0;
        _this.polarRotateSpeed = 1.0;
        _this.dollySpeed = 1.0;
        _this.truckSpeed = 2.0;
        _this.dollyToCursor = false;
        _this.verticalDragToForward = false;
        _this.boundaryFriction = 0.0;
        _this.colliderMeshes = [];
        _this._state = types_1.ACTION.NONE;
        _this._viewport = null;
        _this._zoomControlAmount = 0;
        _this._dollyControlAmount = 0;
        _this._boundaryEnclosesCamera = false;
        _this._needsUpdate = true;
        _this._updatedLastTime = false;
        _this._camera = camera;
        _this._yAxisUpSpace = new THREE.Quaternion().setFromUnitVectors(_this._camera.up, _AXIS_Y);
        _this._yAxisUpSpaceInverse = _this._yAxisUpSpace.clone().inverse();
        _this._state = types_1.ACTION.NONE;
        _this._domElement = domElement;
        _this._target = new THREE.Vector3();
        _this._targetEnd = _this._target.clone();
        _this._spherical = new THREE.Spherical().setFromVector3(_v3A.copy(_this._camera.position).applyQuaternion(_this._yAxisUpSpace));
        _this._sphericalEnd = _this._spherical.clone();
        _this._zoom = _this._camera.zoom;
        _this._zoomEnd = _this._zoom;
        _this._nearPlaneCorners = [
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
        ];
        _this._updateNearPlaneCorners();
        _this._boundary = new THREE.Box3(new THREE.Vector3(-Infinity, -Infinity, -Infinity), new THREE.Vector3(Infinity, Infinity, Infinity));
        _this._target0 = _this._target.clone();
        _this._position0 = _this._camera.position.clone();
        _this._zoom0 = _this._zoom;
        _this._dollyControlCoord = new THREE.Vector2();
        _this.mouseButtons = {
            left: types_1.ACTION.ROTATE,
            middle: types_1.ACTION.DOLLY,
            right: types_1.ACTION.TRUCK,
            wheel: _this._camera.isPerspectiveCamera ? types_1.ACTION.DOLLY :
                _this._camera.isOrthographicCamera ? types_1.ACTION.ZOOM :
                    types_1.ACTION.NONE,
        };
        _this.touches = {
            one: types_1.ACTION.TOUCH_ROTATE,
            two: _this._camera.isPerspectiveCamera ? types_1.ACTION.TOUCH_DOLLY_TRUCK :
                _this._camera.isOrthographicCamera ? types_1.ACTION.TOUCH_ZOOM_TRUCK :
                    types_1.ACTION.NONE,
            three: types_1.ACTION.TOUCH_TRUCK,
        };
        if (_this._domElement) {
            var dragStartPosition_1 = new THREE.Vector2();
            var lastDragPosition_1 = new THREE.Vector2();
            var dollyStart_1 = new THREE.Vector2();
            var elementRect_1 = new THREE.Vector4();
            var truckInternal_1 = function (deltaX, deltaY) {
                if (_this._camera.isPerspectiveCamera) {
                    var camera_1 = _this._camera;
                    var offset = _v3A.copy(camera_1.position).sub(_this._target);
                    var fov = camera_1.getEffectiveFOV() * THREE.Math.DEG2RAD;
                    var targetDistance = offset.length() * Math.tan(fov * 0.5);
                    var truckX = (_this.truckSpeed * deltaX * targetDistance / elementRect_1.w);
                    var pedestalY = (_this.truckSpeed * deltaY * targetDistance / elementRect_1.w);
                    if (_this.verticalDragToForward) {
                        _this.truck(truckX, 0, true);
                        _this.forward(-pedestalY, true);
                    }
                    else {
                        _this.truck(truckX, pedestalY, true);
                    }
                }
                else if (_this._camera.isOrthographicCamera) {
                    var camera_2 = _this._camera;
                    var truckX = deltaX * (camera_2.right - camera_2.left) / camera_2.zoom / elementRect_1.z;
                    var pedestalY = deltaY * (camera_2.top - camera_2.bottom) / camera_2.zoom / elementRect_1.w;
                    _this.truck(truckX, pedestalY, true);
                }
            };
            var rotateInternal_1 = function (deltaX, deltaY) {
                var theta = constants_1.PI_2 * _this.azimuthRotateSpeed * deltaX / elementRect_1.w;
                var phi = constants_1.PI_2 * _this.polarRotateSpeed * deltaY / elementRect_1.w;
                _this.rotate(theta, phi, true);
            };
            var dollyInternal_1 = function (delta, x, y) {
                var dollyScale = Math.pow(0.95, -delta * _this.dollySpeed);
                var distance = _this._sphericalEnd.radius * dollyScale;
                var prevRadius = _this._sphericalEnd.radius;
                _this.dollyTo(distance);
                if (_this.dollyToCursor) {
                    _this._dollyControlAmount += _this._sphericalEnd.radius - prevRadius;
                    _this._dollyControlCoord.set(x, y);
                }
                return;
            };
            var zoomInternal_1 = function (delta, x, y) {
                var zoomScale = Math.pow(0.95, delta * _this.dollySpeed);
                var prevZoom = _this._zoom;
                _this.zoomTo(_this._zoom * zoomScale);
                if (_this.dollyToCursor) {
                    _this._zoomControlAmount -= _this._zoom - prevZoom;
                    _this._dollyControlCoord.set(x, y);
                }
                return;
            };
            var onMouseDown_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
                var prevState = _this._state;
                switch (event.button) {
                    case THREE.MOUSE.LEFT:
                        _this._state = _this.mouseButtons.left;
                        break;
                    case THREE.MOUSE.MIDDLE:
                        _this._state = _this.mouseButtons.middle;
                        break;
                    case THREE.MOUSE.RIGHT:
                        _this._state = _this.mouseButtons.right;
                        break;
                }
                if (prevState !== _this._state) {
                    startDragging_1(event);
                }
            };
            var onTouchStart_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
                var prevState = _this._state;
                switch (event.touches.length) {
                    case 1:
                        _this._state = _this.touches.one;
                        break;
                    case 2:
                        _this._state = _this.touches.two;
                        break;
                    case 3:
                        _this._state = _this.touches.three;
                        break;
                }
                if (prevState !== _this._state) {
                    startDragging_1(event);
                }
            };
            var lastScrollTimeStamp_1 = -1;
            var onMouseWheel_1 = function (event) {
                if (!_this.enabled || _this.mouseButtons.wheel === types_1.ACTION.NONE)
                    return;
                event.preventDefault();
                if (_this.dollyToCursor ||
                    _this.mouseButtons.wheel === types_1.ACTION.ROTATE ||
                    _this.mouseButtons.wheel === types_1.ACTION.TRUCK) {
                    var now = performance.now();
                    if (lastScrollTimeStamp_1 - now < 1000)
                        _this._getClientRect(elementRect_1);
                    lastScrollTimeStamp_1 = now;
                }
                var deltaYFactor = isMac ? -1 : -3;
                var delta = (event.deltaMode === 1) ? event.deltaY / deltaYFactor : event.deltaY / (deltaYFactor * 10);
                var x = _this.dollyToCursor ? (event.clientX - elementRect_1.x) / elementRect_1.z * 2 - 1 : 0;
                var y = _this.dollyToCursor ? (event.clientY - elementRect_1.y) / elementRect_1.w * -2 + 1 : 0;
                switch (_this.mouseButtons.wheel) {
                    case types_1.ACTION.ROTATE: {
                        rotateInternal_1(event.deltaX, event.deltaY);
                        break;
                    }
                    case types_1.ACTION.TRUCK: {
                        truckInternal_1(event.deltaX, event.deltaY);
                        break;
                    }
                    case types_1.ACTION.DOLLY: {
                        dollyInternal_1(-delta, x, y);
                        break;
                    }
                    case types_1.ACTION.ZOOM: {
                        zoomInternal_1(-delta, x, y);
                        break;
                    }
                }
                _this.dispatchEvent({
                    type: 'control',
                    originalEvent: event,
                });
            };
            var onContextMenu_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
            };
            var startDragging_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
                extractClientCoordFromEvent_1.extractClientCoordFromEvent(event, _v2);
                _this._getClientRect(elementRect_1);
                dragStartPosition_1.copy(_v2);
                lastDragPosition_1.copy(_v2);
                var isMultiTouch = isTouchEvent_1.isTouchEvent(event) && event.touches.length >= 2;
                if (isMultiTouch) {
                    var touchEvent = event;
                    var dx = _v2.x - touchEvent.touches[1].clientX;
                    var dy = _v2.y - touchEvent.touches[1].clientY;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    dollyStart_1.set(0, distance);
                    var x = (touchEvent.touches[0].clientX + touchEvent.touches[1].clientX) * 0.5;
                    var y = (touchEvent.touches[0].clientY + touchEvent.touches[1].clientY) * 0.5;
                    lastDragPosition_1.set(x, y);
                }
                document.addEventListener('mousemove', dragging_1);
                document.addEventListener('touchmove', dragging_1, { passive: false });
                document.addEventListener('mouseup', endDragging_1);
                document.addEventListener('touchend', endDragging_1);
                _this.dispatchEvent({
                    type: 'controlstart',
                    originalEvent: event,
                });
            };
            var dragging_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
                extractClientCoordFromEvent_1.extractClientCoordFromEvent(event, _v2);
                var deltaX = lastDragPosition_1.x - _v2.x;
                var deltaY = lastDragPosition_1.y - _v2.y;
                lastDragPosition_1.copy(_v2);
                switch (_this._state) {
                    case types_1.ACTION.ROTATE:
                    case types_1.ACTION.TOUCH_ROTATE: {
                        rotateInternal_1(deltaX, deltaY);
                        break;
                    }
                    case types_1.ACTION.DOLLY:
                    case types_1.ACTION.ZOOM: {
                        var dollyX = _this.dollyToCursor ? (dragStartPosition_1.x - elementRect_1.x) / elementRect_1.z * 2 - 1 : 0;
                        var dollyY = _this.dollyToCursor ? (dragStartPosition_1.y - elementRect_1.y) / elementRect_1.w * -2 + 1 : 0;
                        _this._state === types_1.ACTION.DOLLY ?
                            dollyInternal_1(deltaY * TOUCH_DOLLY_FACTOR, dollyX, dollyY) :
                            zoomInternal_1(deltaY * TOUCH_DOLLY_FACTOR, dollyX, dollyY);
                        break;
                    }
                    case types_1.ACTION.TOUCH_DOLLY:
                    case types_1.ACTION.TOUCH_ZOOM:
                    case types_1.ACTION.TOUCH_DOLLY_TRUCK:
                    case types_1.ACTION.TOUCH_ZOOM_TRUCK: {
                        var touchEvent = event;
                        var dx = _v2.x - touchEvent.touches[1].clientX;
                        var dy = _v2.y - touchEvent.touches[1].clientY;
                        var distance = Math.sqrt(dx * dx + dy * dy);
                        var dollyDelta = dollyStart_1.y - distance;
                        dollyStart_1.set(0, distance);
                        var dollyX = _this.dollyToCursor ? (lastDragPosition_1.x - elementRect_1.x) / elementRect_1.z * 2 - 1 : 0;
                        var dollyY = _this.dollyToCursor ? (lastDragPosition_1.y - elementRect_1.y) / elementRect_1.w * -2 + 1 : 0;
                        _this._state === types_1.ACTION.TOUCH_DOLLY ||
                            _this._state === types_1.ACTION.TOUCH_DOLLY_TRUCK ?
                            dollyInternal_1(dollyDelta * TOUCH_DOLLY_FACTOR, dollyX, dollyY) :
                            zoomInternal_1(dollyDelta * TOUCH_DOLLY_FACTOR, dollyX, dollyY);
                        if (_this._state === types_1.ACTION.TOUCH_DOLLY_TRUCK ||
                            _this._state === types_1.ACTION.TOUCH_ZOOM_TRUCK) {
                            truckInternal_1(deltaX, deltaY);
                        }
                        break;
                    }
                    case types_1.ACTION.TRUCK:
                    case types_1.ACTION.TOUCH_TRUCK: {
                        truckInternal_1(deltaX, deltaY);
                        break;
                    }
                }
                _this.dispatchEvent({
                    type: 'control',
                    originalEvent: event,
                });
            };
            var endDragging_1 = function (event) {
                if (!_this.enabled)
                    return;
                _this._state = types_1.ACTION.NONE;
                document.removeEventListener('mousemove', dragging_1);
                document.removeEventListener('touchmove', dragging_1, { passive: false });
                document.removeEventListener('mouseup', endDragging_1);
                document.removeEventListener('touchend', endDragging_1);
                _this.dispatchEvent({
                    type: 'controlend',
                    originalEvent: event,
                });
            };
            _this._domElement.addEventListener('mousedown', onMouseDown_1);
            _this._domElement.addEventListener('touchstart', onTouchStart_1);
            _this._domElement.addEventListener('wheel', onMouseWheel_1);
            _this._domElement.addEventListener('contextmenu', onContextMenu_1);
            _this._removeAllEventListeners = function () {
                _this._domElement.removeEventListener('mousedown', onMouseDown_1);
                _this._domElement.removeEventListener('touchstart', onTouchStart_1);
                _this._domElement.removeEventListener('wheel', onMouseWheel_1);
                _this._domElement.removeEventListener('contextmenu', onContextMenu_1);
                document.removeEventListener('mousemove', dragging_1);
                document.removeEventListener('touchmove', dragging_1, { passive: false });
                document.removeEventListener('mouseup', endDragging_1);
                document.removeEventListener('touchend', endDragging_1);
            };
        }
        _this.update(0);
        return _this;
    }
    CameraControls.install = function (libs) {
        THREE = libs.THREE;
        _ORIGIN = Object.freeze(new THREE.Vector3(0, 0, 0));
        _AXIS_Y = Object.freeze(new THREE.Vector3(0, 1, 0));
        _AXIS_Z = Object.freeze(new THREE.Vector3(0, 0, 1));
        _v2 = new THREE.Vector2();
        _v3A = new THREE.Vector3();
        _v3B = new THREE.Vector3();
        _v3C = new THREE.Vector3();
        _xColumn = new THREE.Vector3();
        _yColumn = new THREE.Vector3();
        _sphericalA = new THREE.Spherical();
        _sphericalB = new THREE.Spherical();
        _box3A = new THREE.Box3();
        _box3B = new THREE.Box3();
        _quaternionA = new THREE.Quaternion();
        _quaternionB = new THREE.Quaternion();
        _rotationMatrix = new THREE.Matrix4();
        _raycaster = new THREE.Raycaster();
    };
    Object.defineProperty(CameraControls, "ACTION", {
        get: function () {
            return readonlyACTION;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "currentAction", {
        get: function () {
            return this._state;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "distance", {
        get: function () {
            return this._spherical.radius;
        },
        set: function (distance) {
            if (this._spherical.radius === distance &&
                this._sphericalEnd.radius === distance)
                return;
            this._spherical.radius = distance;
            this._sphericalEnd.radius = distance;
            this._needsUpdate = true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "azimuthAngle", {
        get: function () {
            return this._spherical.theta;
        },
        set: function (azimuthAngle) {
            if (this._spherical.theta === azimuthAngle &&
                this._sphericalEnd.theta === azimuthAngle)
                return;
            this._spherical.theta = azimuthAngle;
            this._sphericalEnd.theta = azimuthAngle;
            this._needsUpdate = true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "polarAngle", {
        get: function () {
            return this._spherical.phi;
        },
        set: function (polarAngle) {
            if (this._spherical.phi === polarAngle &&
                this._sphericalEnd.phi === polarAngle)
                return;
            this._spherical.phi = polarAngle;
            this._sphericalEnd.phi = polarAngle;
            this._needsUpdate = true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "phiSpeed", {
        set: function (speed) {
            console.warn('phiSpeed was renamed. use azimuthRotateSpeed instead');
            this.azimuthRotateSpeed = speed;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "thetaSpeed", {
        set: function (speed) {
            console.warn('thetaSpeed was renamed. use polarRotateSpeed instead');
            this.polarRotateSpeed = speed;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "boundaryEnclosesCamera", {
        get: function () {
            return this._boundaryEnclosesCamera;
        },
        set: function (boundaryEnclosesCamera) {
            this._boundaryEnclosesCamera = boundaryEnclosesCamera;
            this._needsUpdate = true;
        },
        enumerable: false,
        configurable: true
    });
    CameraControls.prototype.rotate = function (azimuthAngle, polarAngle, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.rotateTo(this._sphericalEnd.theta + azimuthAngle, this._sphericalEnd.phi + polarAngle, enableTransition);
    };
    CameraControls.prototype.rotateTo = function (azimuthAngle, polarAngle, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var theta = THREE.Math.clamp(azimuthAngle, this.minAzimuthAngle, this.maxAzimuthAngle);
        var phi = THREE.Math.clamp(polarAngle, this.minPolarAngle, this.maxPolarAngle);
        this._sphericalEnd.theta = theta;
        this._sphericalEnd.phi = phi;
        this._sphericalEnd.makeSafe();
        if (!enableTransition) {
            this._spherical.theta = this._sphericalEnd.theta;
            this._spherical.phi = this._sphericalEnd.phi;
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.dolly = function (distance, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.dollyTo(this._sphericalEnd.radius - distance, enableTransition);
    };
    CameraControls.prototype.dollyTo = function (distance, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        if (notSupportedInOrthographicCamera_1.notSupportedInOrthographicCamera(this._camera, 'dolly'))
            return;
        this._sphericalEnd.radius = THREE.Math.clamp(distance, this.minDistance, this.maxDistance);
        if (!enableTransition) {
            this._spherical.radius = this._sphericalEnd.radius;
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.zoom = function (zoomStep, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.zoomTo(this._zoomEnd + zoomStep, enableTransition);
    };
    CameraControls.prototype.zoomTo = function (zoom, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this._zoomEnd = THREE.Math.clamp(zoom, this.minZoom, this.maxZoom);
        if (!enableTransition) {
            this._zoom = this._zoomEnd;
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.pan = function (x, y, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        console.log('`pan` has been renamed to `truck`');
        this.truck(x, y, enableTransition);
    };
    CameraControls.prototype.truck = function (x, y, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this._camera.updateMatrix();
        _xColumn.setFromMatrixColumn(this._camera.matrix, 0);
        _yColumn.setFromMatrixColumn(this._camera.matrix, 1);
        _xColumn.multiplyScalar(x);
        _yColumn.multiplyScalar(-y);
        var offset = _v3A.copy(_xColumn).add(_yColumn);
        this._encloseToBoundary(this._targetEnd, offset, this.boundaryFriction);
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.forward = function (distance, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        _v3A.setFromMatrixColumn(this._camera.matrix, 0);
        _v3A.crossVectors(this._camera.up, _v3A);
        _v3A.multiplyScalar(distance);
        this._encloseToBoundary(this._targetEnd, _v3A, this.boundaryFriction);
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.moveTo = function (x, y, z, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this._targetEnd.set(x, y, z);
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.fitTo = function (box3OrObject, enableTransition, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.paddingLeft, paddingLeft = _c === void 0 ? 0 : _c, _d = _b.paddingRight, paddingRight = _d === void 0 ? 0 : _d, _e = _b.paddingBottom, paddingBottom = _e === void 0 ? 0 : _e, _f = _b.paddingTop, paddingTop = _f === void 0 ? 0 : _f;
        var aabb = box3OrObject.isBox3
            ? _box3A.copy(box3OrObject)
            : _box3A.setFromObject(box3OrObject);
        var theta = math_utils_1.roundToStep(this._sphericalEnd.theta, constants_1.PI_HALF);
        var phi = math_utils_1.roundToStep(this._sphericalEnd.phi, constants_1.PI_HALF);
        this.rotateTo(theta, phi, enableTransition);
        var normal = _v3A.setFromSpherical(this._sphericalEnd).normalize();
        var rotation = _quaternionA.setFromUnitVectors(normal, _AXIS_Z);
        var viewFromPolar = math_utils_1.approxEquals(Math.abs(normal.y), 1);
        if (viewFromPolar) {
            rotation.multiply(_quaternionB.setFromAxisAngle(_AXIS_Y, theta));
        }
        var bb = _box3B.makeEmpty();
        _v3B.copy(aabb.min).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.min).setX(aabb.max.x).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.min).setY(aabb.max.y).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.max).setZ(aabb.min.z).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.min).setZ(aabb.max.z).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.max).setY(aabb.min.y).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.max).setX(aabb.min.x).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.max).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        rotation.setFromUnitVectors(_AXIS_Z, normal);
        bb.min.x -= paddingLeft;
        bb.min.y -= paddingBottom;
        bb.max.x += paddingRight;
        bb.max.y += paddingTop;
        var bbSize = bb.getSize(_v3A);
        var center = bb.getCenter(_v3B).applyQuaternion(rotation);
        var isPerspectiveCamera = this._camera.isPerspectiveCamera;
        var isOrthographicCamera = this._camera.isOrthographicCamera;
        if (isPerspectiveCamera) {
            var distance = this.getDistanceToFit(bbSize.x, bbSize.y, bbSize.z);
            this.moveTo(center.x, center.y, center.z, enableTransition);
            this.dollyTo(distance, enableTransition);
            return;
        }
        else if (isOrthographicCamera) {
            var camera = this._camera;
            var width = camera.right - camera.left;
            var height = camera.top - camera.bottom;
            var zoom = Math.min(width / bbSize.x, height / bbSize.y);
            this.moveTo(center.x, center.y, center.z, enableTransition);
            this.zoomTo(zoom, enableTransition);
            return;
        }
    };
    CameraControls.prototype.setLookAt = function (positionX, positionY, positionZ, targetX, targetY, targetZ, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var position = _v3A.set(positionX, positionY, positionZ);
        var target = _v3B.set(targetX, targetY, targetZ);
        this._targetEnd.copy(target);
        this._sphericalEnd.setFromVector3(position.sub(target).applyQuaternion(this._yAxisUpSpace));
        this.normalizeRotations();
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
            this._spherical.copy(this._sphericalEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.lerpLookAt = function (positionAX, positionAY, positionAZ, targetAX, targetAY, targetAZ, positionBX, positionBY, positionBZ, targetBX, targetBY, targetBZ, t, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var positionA = _v3A.set(positionAX, positionAY, positionAZ);
        var targetA = _v3B.set(targetAX, targetAY, targetAZ);
        _sphericalA.setFromVector3(positionA.sub(targetA).applyQuaternion(this._yAxisUpSpace));
        var targetB = _v3A.set(targetBX, targetBY, targetBZ);
        this._targetEnd.copy(targetA).lerp(targetB, t);
        var positionB = _v3B.set(positionBX, positionBY, positionBZ);
        _sphericalB.setFromVector3(positionB.sub(targetB).applyQuaternion(this._yAxisUpSpace));
        var deltaTheta = _sphericalB.theta - _sphericalA.theta;
        var deltaPhi = _sphericalB.phi - _sphericalA.phi;
        var deltaRadius = _sphericalB.radius - _sphericalA.radius;
        this._sphericalEnd.set(_sphericalA.radius + deltaRadius * t, _sphericalA.phi + deltaPhi * t, _sphericalA.theta + deltaTheta * t);
        this.normalizeRotations();
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
            this._spherical.copy(this._sphericalEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.setPosition = function (positionX, positionY, positionZ, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.setLookAt(positionX, positionY, positionZ, this._targetEnd.x, this._targetEnd.y, this._targetEnd.z, enableTransition);
    };
    CameraControls.prototype.setTarget = function (targetX, targetY, targetZ, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var pos = this.getPosition(_v3A);
        this.setLookAt(pos.x, pos.y, pos.z, targetX, targetY, targetZ, enableTransition);
    };
    CameraControls.prototype.setBoundary = function (box3) {
        if (!box3) {
            this._boundary.min.set(-Infinity, -Infinity, -Infinity);
            this._boundary.max.set(Infinity, Infinity, Infinity);
            this._needsUpdate = true;
            return;
        }
        this._boundary.copy(box3);
        this._boundary.clampPoint(this._targetEnd, this._targetEnd);
        this._needsUpdate = true;
    };
    CameraControls.prototype.setViewport = function (viewportOrX, y, width, height) {
        if (viewportOrX === null) {
            this._viewport = null;
            return;
        }
        this._viewport = this._viewport || new THREE.Vector4();
        if (typeof viewportOrX === 'number') {
            this._viewport.set(viewportOrX, y, width, height);
        }
        else {
            this._viewport.copy(viewportOrX);
        }
    };
    CameraControls.prototype.getDistanceToFit = function (width, height, depth) {
        if (notSupportedInOrthographicCamera_1.notSupportedInOrthographicCamera(this._camera, 'getDistanceToFit'))
            return this._spherical.radius;
        var camera = this._camera;
        var boundingRectAspect = width / height;
        var fov = camera.getEffectiveFOV() * THREE.Math.DEG2RAD;
        var aspect = camera.aspect;
        var heightToFit = boundingRectAspect < aspect ? height : width / aspect;
        return heightToFit * 0.5 / Math.tan(fov * 0.5) + depth * 0.5;
    };
    CameraControls.prototype.getTarget = function (out) {
        var _out = !!out && out.isVector3 ? out : new THREE.Vector3();
        return _out.copy(this._targetEnd);
    };
    CameraControls.prototype.getPosition = function (out) {
        var _out = !!out && out.isVector3 ? out : new THREE.Vector3();
        return _out.setFromSpherical(this._sphericalEnd).applyQuaternion(this._yAxisUpSpaceInverse).add(this._targetEnd);
    };
    CameraControls.prototype.normalizeRotations = function () {
        this._sphericalEnd.theta = this._sphericalEnd.theta % constants_1.PI_2;
        if (this._sphericalEnd.theta < 0)
            this._sphericalEnd.theta += constants_1.PI_2;
        this._spherical.theta += constants_1.PI_2 * Math.round((this._sphericalEnd.theta - this._spherical.theta) / constants_1.PI_2);
    };
    CameraControls.prototype.reset = function (enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.setLookAt(this._position0.x, this._position0.y, this._position0.z, this._target0.x, this._target0.y, this._target0.z, enableTransition);
        this.zoomTo(this._zoom0, enableTransition);
    };
    CameraControls.prototype.saveState = function () {
        this._target0.copy(this._target);
        this._position0.copy(this._camera.position);
        this._zoom0 = this._zoom;
    };
    CameraControls.prototype.updateCameraUp = function () {
        this._yAxisUpSpace.setFromUnitVectors(this._camera.up, _AXIS_Y);
        this._yAxisUpSpaceInverse.copy(this._yAxisUpSpace).inverse();
    };
    CameraControls.prototype.update = function (delta) {
        var dampingFactor = this._state === types_1.ACTION.NONE ? this.dampingFactor : this.draggingDampingFactor;
        var lerpRatio = 1.0 - Math.exp(-dampingFactor * delta * constants_1.FPS_60);
        var deltaTheta = this._sphericalEnd.theta - this._spherical.theta;
        var deltaPhi = this._sphericalEnd.phi - this._spherical.phi;
        var deltaRadius = this._sphericalEnd.radius - this._spherical.radius;
        var deltaTarget = _v3A.subVectors(this._targetEnd, this._target);
        if (!math_utils_1.approxZero(deltaTheta) ||
            !math_utils_1.approxZero(deltaPhi) ||
            !math_utils_1.approxZero(deltaRadius) ||
            !math_utils_1.approxZero(deltaTarget.x) ||
            !math_utils_1.approxZero(deltaTarget.y) ||
            !math_utils_1.approxZero(deltaTarget.z)) {
            this._spherical.set(this._spherical.radius + deltaRadius * lerpRatio, this._spherical.phi + deltaPhi * lerpRatio, this._spherical.theta + deltaTheta * lerpRatio);
            this._target.add(deltaTarget.multiplyScalar(lerpRatio));
            this._needsUpdate = true;
        }
        else {
            this._spherical.copy(this._sphericalEnd);
            this._target.copy(this._targetEnd);
        }
        if (this._dollyControlAmount !== 0 || this._zoomControlAmount !== 0) {
            if (this._camera.isPerspectiveCamera) {
                var camera = this._camera;
                var direction = _v3A.setFromSpherical(this._sphericalEnd).applyQuaternion(this._yAxisUpSpaceInverse).normalize().negate();
                var planeX = _v3B.copy(direction).cross(camera.up).normalize();
                if (planeX.lengthSq() === 0)
                    planeX.x = 1.0;
                var planeY = _v3C.crossVectors(planeX, direction);
                var worldToScreen = this._sphericalEnd.radius * Math.tan(camera.getEffectiveFOV() * THREE.Math.DEG2RAD * 0.5);
                var prevRadius = this._sphericalEnd.radius - this._dollyControlAmount;
                var prevZoom = this._zoomEnd - this._zoomControlAmount;
                var dollyLerpRatio = !this._dollyControlAmount ? 0 : (prevRadius - this._sphericalEnd.radius) / this._sphericalEnd.radius;
                var zoomLerpRatio = !this._zoomControlAmount ? 0 : (prevZoom - this._zoomEnd) / this._zoomEnd;
                var cursor = _v3A.copy(this._targetEnd)
                    .add(planeX.multiplyScalar(this._dollyControlCoord.x * worldToScreen * camera.aspect))
                    .add(planeY.multiplyScalar(this._dollyControlCoord.y * worldToScreen));
                this._targetEnd.lerp(cursor, dollyLerpRatio + zoomLerpRatio);
                this._target.copy(this._targetEnd);
            }
            this._dollyControlAmount = 0;
            this._zoomControlAmount = 0;
        }
        var maxDistance = this._collisionTest();
        this._spherical.radius = Math.min(this._spherical.radius, maxDistance);
        this._spherical.makeSafe();
        this._camera.position.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).add(this._target);
        this._camera.lookAt(this._target);
        if (this._boundaryEnclosesCamera) {
            this._encloseToBoundary(this._camera.position.copy(this._target), _v3A.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse), 1.0);
        }
        var zoomDelta = this._zoomEnd - this._zoom;
        this._zoom += zoomDelta * lerpRatio;
        if (this._camera.zoom !== this._zoom) {
            if (math_utils_1.approxZero(zoomDelta))
                this._zoom = this._zoomEnd;
            this._camera.zoom = this._zoom;
            this._camera.updateProjectionMatrix();
            this._updateNearPlaneCorners();
            this._needsUpdate = true;
        }
        var updated = this._needsUpdate;
        if (updated && !this._updatedLastTime) {
            this.dispatchEvent({ type: 'wake' });
            this.dispatchEvent({ type: 'update' });
        }
        else if (updated) {
            this.dispatchEvent({ type: 'update' });
        }
        else if (!updated && this._updatedLastTime) {
            this.dispatchEvent({ type: 'sleep' });
        }
        this._updatedLastTime = updated;
        this._needsUpdate = false;
        return updated;
    };
    CameraControls.prototype.toJSON = function () {
        return JSON.stringify({
            enabled: this.enabled,
            minDistance: this.minDistance,
            maxDistance: math_utils_1.infinityToMaxNumber(this.maxDistance),
            minZoom: this.minZoom,
            maxZoom: math_utils_1.infinityToMaxNumber(this.maxZoom),
            minPolarAngle: this.minPolarAngle,
            maxPolarAngle: math_utils_1.infinityToMaxNumber(this.maxPolarAngle),
            minAzimuthAngle: math_utils_1.infinityToMaxNumber(this.minAzimuthAngle),
            maxAzimuthAngle: math_utils_1.infinityToMaxNumber(this.maxAzimuthAngle),
            dampingFactor: this.dampingFactor,
            draggingDampingFactor: this.draggingDampingFactor,
            dollySpeed: this.dollySpeed,
            truckSpeed: this.truckSpeed,
            dollyToCursor: this.dollyToCursor,
            verticalDragToForward: this.verticalDragToForward,
            target: this._targetEnd.toArray(),
            position: this._camera.position.toArray(),
            zoom: this._camera.zoom,
            target0: this._target0.toArray(),
            position0: this._position0.toArray(),
            zoom0: this._zoom0,
        });
    };
    CameraControls.prototype.fromJSON = function (json, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var obj = JSON.parse(json);
        var position = _v3A.fromArray(obj.position);
        this.enabled = obj.enabled;
        this.minDistance = obj.minDistance;
        this.maxDistance = math_utils_1.maxNumberToInfinity(obj.maxDistance);
        this.minZoom = obj.minZoom;
        this.maxZoom = math_utils_1.maxNumberToInfinity(obj.maxZoom);
        this.minPolarAngle = obj.minPolarAngle;
        this.maxPolarAngle = math_utils_1.maxNumberToInfinity(obj.maxPolarAngle);
        this.minAzimuthAngle = math_utils_1.maxNumberToInfinity(obj.minAzimuthAngle);
        this.maxAzimuthAngle = math_utils_1.maxNumberToInfinity(obj.maxAzimuthAngle);
        this.dampingFactor = obj.dampingFactor;
        this.draggingDampingFactor = obj.draggingDampingFactor;
        this.dollySpeed = obj.dollySpeed;
        this.truckSpeed = obj.truckSpeed;
        this.dollyToCursor = obj.dollyToCursor;
        this.verticalDragToForward = obj.verticalDragToForward;
        this._target0.fromArray(obj.target0);
        this._position0.fromArray(obj.position0);
        this._zoom0 = obj.zoom0;
        this.moveTo(obj.target[0], obj.target[1], obj.target[2], enableTransition);
        _sphericalA.setFromVector3(position.sub(this._targetEnd).applyQuaternion(this._yAxisUpSpace));
        this.rotateTo(_sphericalA.theta, _sphericalA.phi, enableTransition);
        this.zoomTo(obj.zoom, enableTransition);
        this._needsUpdate = true;
    };
    CameraControls.prototype.dispose = function () {
        this._removeAllEventListeners();
    };
    CameraControls.prototype._encloseToBoundary = function (position, offset, friction) {
        var offsetLength2 = offset.lengthSq();
        if (offsetLength2 === 0.0) {
            return position;
        }
        var newTarget = _v3B.copy(offset).add(position);
        var clampedTarget = this._boundary.clampPoint(newTarget, _v3C);
        var deltaClampedTarget = clampedTarget.sub(newTarget);
        var deltaClampedTargetLength2 = deltaClampedTarget.lengthSq();
        if (deltaClampedTargetLength2 === 0.0) {
            return position.add(offset);
        }
        else if (deltaClampedTargetLength2 === offsetLength2) {
            return position;
        }
        else if (friction === 0.0) {
            return position.add(offset).add(deltaClampedTarget);
        }
        else {
            var offsetFactor = 1.0 + friction * deltaClampedTargetLength2 / offset.dot(deltaClampedTarget);
            return position
                .add(_v3B.copy(offset).multiplyScalar(offsetFactor))
                .add(deltaClampedTarget.multiplyScalar(1.0 - friction));
        }
    };
    CameraControls.prototype._updateNearPlaneCorners = function () {
        if (this._camera.isPerspectiveCamera) {
            var camera = this._camera;
            var near = camera.near;
            var fov = camera.getEffectiveFOV() * THREE.Math.DEG2RAD;
            var heightHalf = Math.tan(fov * 0.5) * near;
            var widthHalf = heightHalf * camera.aspect;
            this._nearPlaneCorners[0].set(-widthHalf, -heightHalf, 0);
            this._nearPlaneCorners[1].set(widthHalf, -heightHalf, 0);
            this._nearPlaneCorners[2].set(widthHalf, heightHalf, 0);
            this._nearPlaneCorners[3].set(-widthHalf, heightHalf, 0);
        }
        else if (this._camera.isOrthographicCamera) {
            var camera = this._camera;
            var zoomInv = 1 / camera.zoom;
            var left = camera.left * zoomInv;
            var right = camera.right * zoomInv;
            var top_1 = camera.top * zoomInv;
            var bottom = camera.bottom * zoomInv;
            this._nearPlaneCorners[0].set(left, top_1, 0);
            this._nearPlaneCorners[1].set(right, top_1, 0);
            this._nearPlaneCorners[2].set(right, bottom, 0);
            this._nearPlaneCorners[3].set(left, bottom, 0);
        }
    };
    CameraControls.prototype._collisionTest = function () {
        var distance = Infinity;
        var hasCollider = this.colliderMeshes.length >= 1;
        if (!hasCollider)
            return distance;
        if (notSupportedInOrthographicCamera_1.notSupportedInOrthographicCamera(this._camera, '_collisionTest'))
            return distance;
        distance = this._spherical.radius;
        var direction = _v3A.setFromSpherical(this._spherical).divideScalar(distance);
        _rotationMatrix.lookAt(_ORIGIN, direction, this._camera.up);
        for (var i = 0; i < 4; i++) {
            var nearPlaneCorner = _v3B.copy(this._nearPlaneCorners[i]);
            nearPlaneCorner.applyMatrix4(_rotationMatrix);
            var origin_1 = _v3C.addVectors(this._target, nearPlaneCorner);
            _raycaster.set(origin_1, direction);
            _raycaster.far = distance;
            var intersects = _raycaster.intersectObjects(this.colliderMeshes);
            if (intersects.length !== 0 && intersects[0].distance < distance) {
                distance = intersects[0].distance;
            }
        }
        return distance;
    };
    CameraControls.prototype._getClientRect = function (target) {
        var rect = this._domElement.getBoundingClientRect();
        target.x = rect.left;
        target.y = rect.top;
        if (this._viewport) {
            target.x += this._viewport.x;
            target.y += rect.height - this._viewport.w - this._viewport.y;
            target.z = this._viewport.z;
            target.w = this._viewport.w;
        }
        else {
            target.z = rect.width;
            target.w = rect.height;
        }
        return target;
    };
    CameraControls.prototype._removeAllEventListeners = function () { };
    return CameraControls;
}(EventDispatcher_1.EventDispatcher));
exports.CameraControls = CameraControls;
