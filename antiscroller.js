/**
 * Antiscroll, fork from https://github.com/Automattic/antiscroll
 */
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.Antiscroll = factory();
    }

    var _antiscrollStylesInserted = false;

    function _insertAnstiscrollStylesheet(){
        if(!_antiscrollStylesInserted){
            _antiscrollStylesInserted = true;
            var element = document.createElement('style'), sheet, ruleIndex = 0;
            document.head.appendChild(element);
            sheet = element.sheet;
            var styles = [
                ".antiscroll-wrap {display: inline-block;position: relative;overflow: hidden;}",
                ".antiscroll-scrollbar{background:gray;background:rgba(0,0,0,.5);-webkit-border-radius:7px;"
                + "-moz-border-radius:7px;border-radius:7px;-webkit-box-shadow:0 0 1px #fff;"
                + "-moz-box-shadow:0 0 1px #fff;box-shadow:0 0 1px #fff;position:absolute;opacity:0;"
                + "-webkit-transition:linear .3s opacity;-moz-transition:linear .3s opacity;"
                + "-o-transition:linear .3s opacity}",
                ".antiscroll-scrollbar-shown{opacity:1,filter:progid:DXImageTransform.Microsoft.Alpha(Opacity=100);}",
                ".antiscroll-scrollbar-horizontal{height:7px;margin-left:2px;bottom:2px;left:0}",
                ".antiscroll-scrollbar-vertical{width:7px;margin-top:2px;right:2px;top:0}",
                ".antiscroll-inner{overflow:scroll}",
                ".antiscroll-inner::-webkit-scrollbar{width:0;height:0;}",
                ".antiscroll-inner::scrollbar{width:0;height:0;}",
            ];
            styles.forEach(function(style, index){
                try {
                    sheet.insertRule(style, index);
                } catch(e){
                    //Catch it
                }
            });
        }
    }

    _insertAnstiscrollStylesheet();

}(this, function () {
    function Antiscroll(el, opts) {
        this.el = el;
        this.options = opts || {};
    
        this.x = (false !== this.options.x) || this.options.forceHorizontal;
        this.y = (false !== this.options.y) || this.options.forceVertical;
        this.autoHide = false !== this.options.autoHide;
        this.padding = undefined == this.options.padding ? 2 : this.options.padding;
    
        this.inner = this.el.querySelector('.antiscroll-inner');
        this.inner.style.width = this.inner.offsetWidth + (this.y ? scrollbarSize() : 0);
        this.inner.style.height = this.inner.offsetHeight + (this.x ? scrollbarSize() : 0);
    
        this.refresh();
    };
    
    Antiscroll.prototype.refresh = function () {
        var needHScroll = this.inner.scrollWidth > this.el.offsetWidth + (this.y ? scrollbarSize() : 0),
            needVScroll = this.inner.scrollHeight > this.el.offsetHeight + (this.x ? scrollbarSize() : 0);
    
        if (this.x) {
            if (!this.horizontal && needHScroll) {
                this.horizontal = new Scrollbar.Horizontal(this);
            } else if (this.horizontal && !needHScroll) {
                this.horizontal.destroy();
                this.horizontal = null;
            } else if (this.horizontal) {
                this.horizontal.update();
            }
        }
    
        if (this.y) {
            if (!this.vertical && needVScroll) {
                this.vertical = new Scrollbar.Vertical(this);
            } else if (this.vertical && !needVScroll) {
                this.vertical.destroy();
                this.vertical = null;
            } else if (this.vertical) {
                this.vertical.update();
            }
        }
    
    };
    
    Antiscroll.prototype.destroy = function () {
        if (this.horizontal) {
            this.horizontal.destroy();
            this.horizontal = null
        }
        if (this.vertical) {
            this.vertical.destroy();
            this.vertical = null
        }
        return this;
    };
    
    Antiscroll.prototype.rebuild = function () {
        this.destroy();
        this.inner.setAttribute('style', '');
        Antiscroll.call(this, this.el, this.options);
        return this;
    };
    
    function attachEvent(el, event, handler) {
        el.addEventListener(event, handler);
    }
    
    function Scrollbar(pane) {
        this.pane = pane;
        this.pane.el.append(this.el);
        this.innerEl = this.pane.inner;
    
        this.dragging = false;
        this.enter = false;
        this.shown = false;
    
        // hovering
        attachEvent(this.pane.el, "mouseenter", this.mouseenter.bind(this));
        attachEvent(this.pane.el, "mouseleave", this.mouseleave.bind(this));
    
        // dragging
        attachEvent(this.el, "mousedown", this.mousedown.bind(this));
    
        // scrolling
        this.innerPaneScrollListener = this.scroll.bind(this);
        attachEvent(this.pane.inner, "scroll", this.innerPaneScrollListener);
    
        // wheel -optional-
        this.innerPaneMouseWheelListener = this.mousewheel.bind(this);
        attachEvent(this.pane.inner, "mousewheel", this.innerPaneMouseWheelListener);
    
        // show
        var initialDisplay = this.pane.options.initialDisplay;
    
        if (initialDisplay !== false) {
            this.show();
            if (this.pane.autoHide) {
                this.hiding = setTimeout(this.hide.bind(this), parseInt(initialDisplay, 10) || 3000);
            }
        }
    };
    
    Scrollbar.prototype.destroy = function () {
        this.el.remove();
        this.pane.inner.removeEventListener('scroll', this.innerPaneScrollListener);
        this.pane.inner.removeEventListener('mousewheel', this.innerPaneMouseWheelListener);
        return this;
    };
    
    Scrollbar.prototype.mouseenter = function () {
        this.enter = true;
        this.show();
    };
    
    Scrollbar.prototype.mouseleave = function () {
        this.enter = false;
    
        if (!this.dragging) {
            if (this.pane.autoHide) {
                this.hide();
            }
        }
    };
    
    Scrollbar.prototype.scroll = function () {
        if (!this.shown) {
            this.show();
            if (!this.enter && !this.dragging) {
                if (this.pane.autoHide) {
                    this.hiding = setTimeout(this.hide.bind(this), 1500);
                }
            }
        }
        this.update();
    };
    
    Scrollbar.prototype.mousedown = function (ev) {
        ev.preventDefault();
    
        this.dragging = true;
    
        this.startPageY = ev.pageY - parseInt(this.el.style.top, 10);
        this.startPageX = ev.pageX - parseInt(this.el.style.left, 10);
    
        // prevent crazy selections on IE
        attachEvent(this.el.ownerDocument, "selectstart", function () {
            return false;
        });
    
        var pane = this.pane,
            move = this.mousemove.bind(this),
            self = this;
    
        attachEvent(this.el.ownerDocument, "mousemove", move);
        attachEvent(this.el.ownerDocument, "mouseup", function () {
            self.dragging = false;
            this.onselectstart = null;
    
            this.removeEventListener('mousemove', move);
    
            if (!self.enter) {
                self.hide();
            }
        });
    
    };

    Scrollbar.prototype.show = function (duration) {
        if (!this.shown && this.update()) {
            this.el.classList.add('antiscroll-scrollbar-shown');
            if (this.hiding) {
                clearTimeout(this.hiding);
                this.hiding = null;
            }
            this.shown = true;
        }
    };
    
    Scrollbar.prototype.hide = function () {
        if (this.pane.autoHide !== false && this.shown) {
            // check for dragging
            this.el.classList.remove('antiscroll-scrollbar-shown');
            this.shown = false;
        }
    };
    
    Scrollbar.prototype.createHorizontalScrollbar = function() {
        var node = document.createElement('div');
        node.classList.add("antiscroll-scrollbar", "antiscroll-scrollbar-horizontal");
        return node;
    }
    
    Scrollbar.prototype.createVerticalScrollbar = function() {
        var node = document.createElement('div');
        node.classList.add("antiscroll-scrollbar", "antiscroll-scrollbar-vertical");
        return node;
    }
    
    Scrollbar.Horizontal = function (pane) {
        this.el = this.createHorizontalScrollbar();
        pane.el.append(this.el);
        Scrollbar.call(this, pane);
    };
    
    /**
     * Inherits from Scrollbar.
     */
    
    inherits(Scrollbar.Horizontal, Scrollbar);
    
    Scrollbar.Horizontal.prototype.update = function () {
        var paneWidth = this.pane.el.offsetWidth,
            trackWidth = paneWidth - this.pane.padding * 2,
            innerEl = this.pane.inner;
    
        this.el.style.width = trackWidth * paneWidth / innerEl.scrollWidth + "px";
        this.el.style.left = trackWidth * innerEl.scrollLeft / innerEl.scrollWidth + "px";
    
        return paneWidth < innerEl.scrollWidth;
    };
    
    Scrollbar.Horizontal.prototype.mousemove = function (ev) {
        var trackWidth = this.pane.el.offsetWidth - this.pane.padding * 2,
            pos = ev.pageX - this.startPageX,
            barWidth = this.el.offsetWidth,
            innerEl = this.pane.inner
    
        // minimum top is 0, maximum is the track height
        var y = Math.min(Math.max(pos, 0), trackWidth - barWidth);
    
        innerEl.scrollLeft = (innerEl.scrollWidth - this.pane.el.offsetWidth) *
            y / (trackWidth - barWidth);
    };
    
    Scrollbar.Horizontal.prototype.mousewheel = function (ev, delta, x, y) {
        if ((x < 0 && 0 == this.pane.inner.scrollLeft) ||
            (x > 0 && (this.innerEl.scrollLeft + Math.ceil(this.pane.el.offsetWidth) ==
                this.innerEl.scrollWidth))) {
            ev.preventDefault();
            return false;
        }
    };

    Scrollbar.Vertical = function (pane) {
        this.el = this.createVerticalScrollbar();
        pane.el.append(this.el);
        Scrollbar.call(this, pane);
    };
    
    /**
     * Inherits from Scrollbar.
     */
    
    inherits(Scrollbar.Vertical, Scrollbar);

    Scrollbar.Vertical.prototype.update = function () {
        var paneHeight = this.pane.el.offsetHeight,
            trackHeight = paneHeight - this.pane.padding * 2,
            innerEl = this.innerEl;
    
        var scrollbarHeight = trackHeight * paneHeight / innerEl.scrollHeight;
        scrollbarHeight = scrollbarHeight < 20 ? 20 : scrollbarHeight;
    
        var topPos = trackHeight * innerEl.scrollTop / innerEl.scrollHeight;
    
        if ((topPos + scrollbarHeight) > trackHeight) {
            var diff = (topPos + scrollbarHeight) - trackHeight;
            topPos = topPos - diff - 3;
        }
    
        this.el.style.height = scrollbarHeight + "px";
        this.el.style.top = topPos + "px";
        return paneHeight < innerEl.scrollHeight;
    };

    Scrollbar.Vertical.prototype.mousemove = function (ev) {
        var paneHeight = this.pane.el.offsetHeight,
            trackHeight = paneHeight - this.pane.padding * 2,
            pos = ev.pageY - this.startPageY,
            barHeight = this.el.offsetHeight,
            innerEl = this.innerEl
    
        // minimum top is 0, maximum is the track height
        var y = Math.min(Math.max(pos, 0), trackHeight - barHeight);
    
        innerEl.scrollTop = (innerEl.scrollHeight - paneHeight) *
            y / (trackHeight - barHeight);
    };

    Scrollbar.Vertical.prototype.mousewheel = function (ev, delta, x, y) {
        if ((y > 0 && 0 == this.innerEl.scrollTop) ||
            (y < 0 && (this.innerEl.scrollTop + Math.ceil(this.pane.el.offsetHeight) ==
                this.innerEl.scrollHeight))) {
            ev.preventDefault();
            return false;
        }
    };
 
    function inherits(ctorA, ctorB) {
        function f() {};
        f.prototype = ctorB.prototype;
        ctorA.prototype = new f;
    };
    
    /**
     * Scrollbar size detection.
     */
    
    var size;
    
    function scrollbarSize() {
        if (size === undefined) {
            var div = document.createElement('div');
            div.classList.add("antiscroll-inner");
            div.style.width = '50px';
            div.style.height = "50px";
            div.style.overflowY = "scroll";
            div.innerHTML = '<div style="height:100px;width:100%"/>';
            document.body.append(div);
            var w1 = div.offsetWidth;
            var w2 = div.querySelector('div').offsetWidth;
            div.remove();
    
            size = w1 - w2;
        }
    
        return size;
    };

    return Antiscroll;

}));