"use strict";
class CanvasCellSim {
    constructor(selector, cellsize, cellborder, fnInit, fnStep, fnApply, fnColor) {
        this.dirty = true;
        this.fully_init = false;
        this.iv_step = 0;
        this.iv_draw = 0;
        this.fps_counter = 0;
        this.fps_time = Date.now();
        this.fps_delta = 1;
        this.fps_delta_counter = 0;
        this.fps = 1;
        this.ups_counter = 0;
        this.ups_time = Date.now();
        this.ups_delta = 1;
        this.ups_delta_counter = 0;
        this.ups = 1;
        this.canvas = document.querySelector(selector);
        this.cellSize = cellsize;
        this.cellBorderSize = cellborder;
        this.fnInit = fnInit;
        this.fnStep = fnStep;
        this.fnApply = fnApply;
        this.fnColor = fnColor;
        this.grid = [[this.initCell(0, 0, true)]];
        this.context = new CanvasCellSimContext(this, this.grid[0][0].value);
        this.offsetX = 0;
        this.offsetY = 0;
    }
    initCell(x, y, initial) {
        let c1 = this.fnInit(x, y, initial);
        let c2 = this.fnInit(x, y, initial);
        c2 = this.fnApply(c1, c2);
        return new CanvasCell(x, y, c1, c2, this.fnApply);
    }
    step() {
        this.fixGridSizeX(!this.fully_init);
        this.fixGridSizeY(!this.fully_init);
        this.fully_init = true;
        let width = this.grid[0].length;
        let height = this.grid.length;
        for (let gy = 0; gy < height; gy++)
            for (let gx = 0; gx < width; gx++)
                this.grid[gy][gx].backup();
        this.context.gridWidth = width;
        this.context.gridHeight = height;
        for (let gy = 0; gy < height; gy++) {
            for (let gx = 0; gx < width; gx++) {
                this.context.x = gx - this.offsetX;
                this.context.y = gy - this.offsetY;
                this.context.value = this.grid[gy][gx].value;
                let changed = this.fnStep(this.context);
                this.grid[gy][gx].value = this.context.value;
                if (changed)
                    this.dirty = this.grid[gy][gx].dirty = true;
            }
        }
    }
    fixGridSizeX(initial) {
        const curr = this.grid[0].length;
        const calc = Math.ceil(((this.canvas.clientWidth / this.cellSize) - 1) / 2) * 2 + 1 + 2 * this.cellBorderSize;
        if (this.canvas.width !== this.canvas.getBoundingClientRect().width)
            this.canvas.width = this.canvas.getBoundingClientRect().width;
        if (curr === calc)
            return;
        console.log("fixGridSizeX");
        this.canvas.width = this.canvas.getBoundingClientRect().width;
        if (calc > curr) {
            let inc = (calc - curr) / 2;
            for (let y = 0; y < this.grid.length; y++) {
                for (let i = 0; i < inc; i++) {
                    this.grid[y].unshift(this.initCell(-(this.offsetX + i + 1), y, initial));
                    this.grid[y].push(this.initCell(+(this.offsetX + i + 1), y, initial));
                }
            }
            this.offsetX += inc;
        }
        else {
            let inc = (curr - calc) / 2;
            for (let y = 0; y < this.grid.length; y++) {
                for (let i = 0; i < inc; i++) {
                    this.grid[y].pop();
                    this.grid[y].shift();
                }
            }
            this.offsetX -= inc;
        }
    }
    fixGridSizeY(initial) {
        const curr = this.grid.length;
        const calc = Math.ceil(((this.canvas.clientHeight / this.cellSize) - 1) / 2) * 2 + 1 + 2 * this.cellBorderSize;
        if (this.canvas.height !== this.canvas.getBoundingClientRect().height)
            this.canvas.height = this.canvas.getBoundingClientRect().height;
        if (curr === calc)
            return;
        console.log("fixGridSizeY");
        if (calc > curr) {
            let inc = (calc - curr) / 2;
            for (let i = 0; i < inc; i++) {
                let nN = [];
                for (let x = 0; x < this.grid[0].length; x++)
                    nN.push(this.initCell(x - this.offsetX, -(this.offsetY + i + 1), initial));
                this.grid.unshift(nN);
                let nS = [];
                for (let x = 0; x < this.grid[0].length; x++)
                    nS.push(this.initCell(x - this.offsetX, +(this.offsetY + i + 1), initial));
                this.grid.push(nS);
            }
            this.offsetY += inc;
        }
        else {
            let inc = (curr - calc) / 2;
            for (let i = 0; i < inc; i++) {
                this.grid.pop();
                this.grid.shift();
            }
            this.offsetY -= inc;
        }
    }
    draw() {
        if (!this.dirty)
            return;
        let width = this.grid[0].length;
        let height = this.grid.length;
        let canvasWidth = this.canvas.clientWidth;
        let canvasHeight = this.canvas.clientHeight;
        var ctx = this.canvas.getContext('2d', { alpha: false });
        for (let gy = 0; gy < height; gy++) {
            for (let gx = 0; gx < width; gx++) {
                const cx = Math.floor(canvasWidth / 2) + (gx - this.offsetX) * this.cellSize - this.cellSize / 2;
                const cy = Math.floor(canvasHeight / 2) + (gy - this.offsetY) * this.cellSize - this.cellSize / 2;
                if (this.grid[gy][gx].dirty) {
                    this.grid[gy][gx].dirty = false;
                    ctx.fillStyle = this.fnColor(this.grid[gy][gx].value);
                    ctx.fillRect(cx, cy, this.cellSize, this.cellSize);
                }
            }
        }
        this.dirty = false;
    }
    startStepping(interval) {
        this.step();
        clearInterval(this.iv_step);
        this.iv_step = setInterval(() => {
            const t0 = Date.now();
            this.step();
            this.ups_delta_counter += (Date.now() - t0);
            this.ups_counter++;
            if (this.ups_counter > 16) {
                const delta = Date.now() - this.ups_time;
                this.ups = this.ups_counter * 1000 / delta;
                this.ups_delta = this.ups_delta_counter / this.ups_counter;
                this.ups_time = Date.now();
                this.ups_counter = 0;
                this.ups_delta_counter = 0;
            }
        }, interval);
    }
    startDrawing() {
        this.iv_draw += 1;
        const magic = this.iv_draw;
        const fn = () => {
            if (magic != this.iv_draw)
                return;
            const t0 = Date.now();
            this.draw();
            this.fps_delta_counter += (Date.now() - t0);
            this.fps_counter++;
            if (this.fps_counter > 16) {
                const delta = Date.now() - this.fps_time;
                this.fps = this.fps_counter * 1000 / delta;
                this.fps_delta = this.fps_delta_counter / this.fps_counter;
                this.fps_time = Date.now();
                this.fps_counter = 0;
                this.fps_delta_counter = 0;
                console.log("FPS: " + this.fps + " (possible: " + (1000 / this.fps_delta) + ")    |    UPS: " + this.ups + " (possible: " + (1000 / this.ups_delta) + ")");
            }
            requestAnimationFrame(fn);
        };
        requestAnimationFrame(fn);
    }
}
class CanvasCell {
    constructor(x, y, cell, cellbackup, fnApply) {
        this.dirty = true;
        this.x = x;
        this.y = y;
        this.value = cell;
        this.value_backup = cellbackup;
        this.fnApply = fnApply;
    }
    backup() {
        this.value_backup = this.fnApply(this.value, this.value_backup);
    }
}
class CanvasCellSimContext {
    constructor(s, dummy) {
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.x = 0;
        this.y = 0;
        this.sim = s;
        this.value = dummy;
    }
    getRelativeWrapped(dx, dy) {
        let gx = ((this.x + this.sim.offsetX + dx) % this.gridWidth + this.gridWidth) % this.gridWidth;
        let gy = ((this.y + this.sim.offsetY + dy) % this.gridHeight + this.gridHeight) % this.gridHeight;
        return this.sim.grid[gy][gx].value_backup;
    }
    getRelativeClamped(dx, dy, def) {
        let gx = this.x + this.sim.offsetX + dx;
        let gy = this.y + this.sim.offsetY + dy;
        if (gx < 0 || gy < 0 || gx >= this.gridWidth || gy >= this.gridHeight)
            return def;
        return this.sim.grid[gy][gx].value_backup;
    }
    countMooreNeighborsWrapped(fn) {
        let c = 0;
        if (fn(this.getRelativeWrapped(-1, -1)))
            c++;
        if (fn(this.getRelativeWrapped(0, -1)))
            c++;
        if (fn(this.getRelativeWrapped(+1, -1)))
            c++;
        if (fn(this.getRelativeWrapped(+1, 0)))
            c++;
        if (fn(this.getRelativeWrapped(+1, +1)))
            c++;
        if (fn(this.getRelativeWrapped(0, +1)))
            c++;
        if (fn(this.getRelativeWrapped(-1, +1)))
            c++;
        if (fn(this.getRelativeWrapped(-1, 0)))
            c++;
        return c;
    }
    countNeumannNeighborsWrapped(fn) {
        let c = 0;
        if (fn(this.getRelativeWrapped(0, -1)))
            c++;
        if (fn(this.getRelativeWrapped(+1, 0)))
            c++;
        if (fn(this.getRelativeWrapped(0, +1)))
            c++;
        if (fn(this.getRelativeWrapped(-1, 0)))
            c++;
        return c;
    }
    countMooreNeighborsClamped(fn, def) {
        let c = 0;
        if (fn(this.getRelativeClamped(-1, -1, def)))
            c++;
        if (fn(this.getRelativeClamped(0, -1, def)))
            c++;
        if (fn(this.getRelativeClamped(+1, -1, def)))
            c++;
        if (fn(this.getRelativeClamped(+1, 0, def)))
            c++;
        if (fn(this.getRelativeClamped(+1, +1, def)))
            c++;
        if (fn(this.getRelativeClamped(0, +1, def)))
            c++;
        if (fn(this.getRelativeClamped(-1, +1, def)))
            c++;
        if (fn(this.getRelativeClamped(-1, 0, def)))
            c++;
        return c;
    }
    countNeumannNeighborsClamped(fn, def) {
        let c = 0;
        if (fn(this.getRelativeClamped(0, -1, def)))
            c++;
        if (fn(this.getRelativeClamped(+1, 0, def)))
            c++;
        if (fn(this.getRelativeClamped(0, +1, def)))
            c++;
        if (fn(this.getRelativeClamped(-1, 0, def)))
            c++;
        return c;
    }
}