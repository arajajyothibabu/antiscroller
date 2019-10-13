# antiscroller
OS X Lion style cross-browser native scrolling on the web.

A fork from original [Antiscroll](https://github.com/Automattic/antiscroll) library with no jQuery dependency.

See [Demo](https://arajajyothibabu.github.io/antiscroller)

### Usage

#### Install using NPM

`npm i antiscroller`

### Add using UNPKG

`<script src="https://unpkg.com/antiscroller"></script>`


#### Initialize with the container

```html
<div id="container" class="antiscroll-wrap">
    <div class="antiscroll-inner">
        <!-- Your scrollable large content -->
    </div>
</div>
```

```javascript
import Antiscroll from 'antiscroller'; //for ES6

var container = document.getElementById("container");
var scroller = new Antiscroll(container, {
    autoHide: false
});
```

