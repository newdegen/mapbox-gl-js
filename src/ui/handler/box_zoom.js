// @flow

import DOM from '../../util/dom';

import { bindAll } from '../../util/util';
import window from '../../util/window';
import { Event } from '../../util/evented';

import type Map from '../map';

/**
 * “矩形层级助手”帮助用户将地图放大到一个矩形范围内，其层级也会相应增加。
 * 矩形范围的生成方式：保持“shift”键被按住，然后在地图上点击鼠标左键，并且拖动鼠标。
 */
class BoxZoomHandler {
    _map: Map;
    _el: HTMLElement;
    _container: HTMLElement;
    _enabled: boolean;
    _active: boolean;
    _startPos: Point;
    _lastPos: Point;
    _box: HTMLElement;
    _clickTolerance: number;

    /**
     * @private
     */
    constructor(map: Map, options: {
        clickTolerance?: number
    }) {
        this._map = map;
        this._el = map.getCanvasContainer();
        this._container = map.getContainer();
        this._clickTolerance = options.clickTolerance || 1;

        bindAll([
            '_onMouseMove',
            '_onMouseUp',
            '_onKeyDown'
        ], this);
    }

    /**
     * 返回一个布尔值，用于表明“矩形层级”的交互功能是否可用。
     *
     * @返回值 {布尔类型} 返回“true”则表明“矩形层级”的交互功能可用。

     */
    isEnabled() {
        return !!this._enabled;
    }

    /**
     * 返回一个布尔值，用于表明“矩形层级”的交互功能是否正在被使用。
     *
     * @返回值 {布尔类型} 返回“true”则表明“矩形层级”的交互功能正在被使用。
     */
    isActive() {
        return !!this._active;
    }

    /**
     * 激活“矩形层级”功能。
     *
     * @示例
     *   map.boxZoom.enable();
     */
    enable() {
        if (this.isEnabled()) return;
        this._enabled = true;
    }

    /**
     * 关闭“矩形层级”功能。
     *
     * @示例
     *   map.boxZoom.disable();
     */
    disable() {
        if (!this.isEnabled()) return;
        this._enabled = false;
    }

    onMouseDown(e: MouseEvent) {
        if (!this.isEnabled()) return;
        if (!(e.shiftKey && e.button === 0)) return;

        window.document.addEventListener('mousemove', this._onMouseMove, false);
        window.document.addEventListener('keydown', this._onKeyDown, false);
        window.document.addEventListener('mouseup', this._onMouseUp, false);

        DOM.disableDrag();
        this._startPos = this._lastPos = DOM.mousePos(this._el, e);
        this._active = true;
    }

    _onMouseMove(e: MouseEvent) {
        const pos = DOM.mousePos(this._el, e);

        if (this._lastPos.equals(pos) || (!this._box && pos.dist(this._startPos) < this._clickTolerance)) {
            return;
        }

        const p0 = this._startPos;
        this._lastPos = pos;

        if (!this._box) {
            this._box = DOM.create('div', 'mapboxgl-boxzoom', this._container);
            this._container.classList.add('mapboxgl-crosshair');
            this._fireEvent('boxzoomstart', e);
        }

        const minX = Math.min(p0.x, pos.x),
            maxX = Math.max(p0.x, pos.x),
            minY = Math.min(p0.y, pos.y),
            maxY = Math.max(p0.y, pos.y);

        DOM.setTransform(this._box, `translate(${minX}px,${minY}px)`);

        this._box.style.width = `${maxX - minX}px`;
        this._box.style.height = `${maxY - minY}px`;
    }

    _onMouseUp(e: MouseEvent) {
        if (e.button !== 0) return;

        const p0 = this._startPos,
            p1 = DOM.mousePos(this._el, e);

        this._finish();

        DOM.suppressClick();

        if (p0.x === p1.x && p0.y === p1.y) {
            this._fireEvent('boxzoomcancel', e);
        } else {
            this._map
                .fitScreenCoordinates(p0, p1, this._map.getBearing(), {linear: true})
                .fire(new Event('boxzoomend', { originalEvent: e}));
        }
    }

    _onKeyDown(e: KeyboardEvent) {
        if (e.keyCode === 27) {
            this._finish();
            this._fireEvent('boxzoomcancel', e);
        }
    }

    _finish() {
        this._active = false;

        window.document.removeEventListener('mousemove', this._onMouseMove, false);
        window.document.removeEventListener('keydown', this._onKeyDown, false);
        window.document.removeEventListener('mouseup', this._onMouseUp, false);

        this._container.classList.remove('mapboxgl-crosshair');

        if (this._box) {
            DOM.remove(this._box);
            this._box = (null: any);
        }

        DOM.enableDrag();

        delete this._startPos;
        delete this._lastPos;
    }

    _fireEvent(type: string, e: *) {
        return this._map.fire(new Event(type, { originalEvent: e }));
    }
}

export default BoxZoomHandler;
