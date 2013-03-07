
/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , viewport = require('viewport')
  , o = require('jquery');

/**
 * Expose `Menu`.
 */

module.exports = Menu;

/**
 * Initialize a new `Menu`.
 *
 * ```js
 * var Menu = require('menu');
 * var menu = new Menu();
 * var menu = Menu();
 * ```
 *
 * Emits:
 *
 * - "show" when shown
 * - "hide" when hidden
 * - "remove" with the item name when an item is removed
 * - "select" (item) when an item is selected
 * - * menu item events are emitted when clicked
 *
 * @api public
 */

function Menu() {
  if (!(this instanceof Menu)) return new Menu;
  Emitter.call(this);
  this.items = [];
  this.el = o('<ul class=menu>').hide().appendTo('body');
  this.on('show', this.bindEvents.bind(this));
  this.on('hide', this.unbindEvents.bind(this));
  this._isOpen = false;
}

/**
 * Inherit from `Emitter.prototype`.
 */

Menu.prototype = new Emitter;

/**
 * Deselect selected menu items.
 *
 * @api private
 */

Menu.prototype.deselect = function(ev){
  if (!this.selected) return;
  this.selected.el.removeClass('selected');
  this.selected = null;
};

/**
 * Bind event listeners.
 *
 * @api private
 */

Menu.prototype.bindEvents = function(){
  this.bindKeyboardEvents();
  this.bindMouseEvents();
};

/**
 * Unbind event listeners.
 *
 * @api private
 */

Menu.prototype.unbindEvents = function(){
  this.unbindKeyboardEvents();
  this.unbindMouseEvents();
};

/**
 * Bind mouse events.
 *
 * @api private
 */

Menu.prototype.bindMouseEvents = function(){
  this.onbodyclickBound = this.onbodyclick.bind(this)
  this.deselectBound = this.deselect.bind(this);
  var self = this;
  setTimeout(function () {
    o('html').bind('mouseup', self.onbodyclickBound);
  }, 0)
  this.el.one('mouseover', 'a', this.deselectBound);
};

/**
 * Unbind mouse events.
 *
 * @api private
 */

Menu.prototype.unbindMouseEvents = function(){
  o('html').unbind('mouseup', this.onbodyclickBound);
};

/**
 * Bind keyboard events.
 *
 * @api private
 */

Menu.prototype.bindKeyboardEvents = function(){
  this.onkeydownBound = this.onkeydown.bind(this);
  o('html').bind('keydown', this.onkeydownBound);
  return this;
};

/**
 * Unbind keyboard events.
 *
 * @api private
 */

Menu.prototype.unbindKeyboardEvents = function(){
  o('html').unbind('keydown', this.onkeydownBound);
  return this;
};

/**
 * Emit selected if any.
 *
 * @api private
 */

Menu.prototype.emitSelected = function(){
  if (this.selected) {
    this.emit('select', this.selected);
    this.emit(this.selected.slug, this.selected);
    this.emit(this.selected.text, this.selected);
    this.selected.fn && this.selected.fn();
  }
};

/**
 * Handle keydown events.
 *
 * @api private
 */

Menu.prototype.onkeydown = function(e){
  switch (e.keyCode) {
    case 13: // enter
    case 39: // right
    case 9: // tab
      this.emitSelected();
      this.hide();
    break;

    case 27: // tab
    case 37: // left
      this.deselect();
      this.hide();
    break;

    case 38: // up
      e.preventDefault();
      this.move('prev');
      this._isSelecting = true;
    break;

    case 40: // down
      e.preventDefault();
      this.move('next');
      this._isSelecting = true;
    break;
  }
};

/**
 * Handle body click event.
 *
 * @api private
 */

Menu.prototype.onbodyclick = function() {
  if (this.isOpen()) this.hide();
};

/**
 * Select (highlight) an item.
 *
 * @param {MenuItem} item
 * @api private
 */

Menu.prototype.select = function(item){
  this.selected = item;
  this.selected.el.addClass('selected');
  this.selected.el.find('a').focus();
};

/**
 * Focus on the next menu item in `direction`.
 *
 * @param {String} direction "prev" or "next"
 * @api public
 */

Menu.prototype.move = function(direction){
  var sel = this.selected;

  var items = this.items.slice();
  items = items.filter(function (item) {
    return ! item.hidden;
  });

  if (!sel) {
    if ('next' == direction)
      sel = items[items.length-1];
    else sel = items[0];
  }
  else {
    sel.el.removeClass('selected');
  }

  var index = items.indexOf(sel);

  if ('next' == direction){
    if (++index >= items.length) index = 0;
    sel = items[index];
  }
  else if ('prev' == direction){
    if (--index < 0) index = items.length-1;
    sel = items[index];
  }

  this.select(sel);
};

/**
 * Gets a menu item named `slug`.
 *
 * @param {String} slug
 * @return {MenuItem}
 * @api public
 */

Menu.prototype.get = function(slug){
  slug = createSlug(slug);
  var item = this.items.filter(function(item){
    return item.slug === slug;
  })[0];
  return item;
};

/**
 * Add a new menu item with the given `text`, optional `slug` and callback `fn`.
 *
 * When the item is clicked `fn()` will be invoked
 * and the `Menu` is immediately closed. When clicked
 * an event of the name `text` is emitted regardless of
 * the callback function being present.
 *
 * Using events to handle selection:
 *
 * ```js
 * menu.add('Hello');
 *
 * menu.on('Hello', function(){
 *   console.log('clicked hello');
 * });
 * ```
 *
 * Using callbacks:
 *
 * ```js
 * menu.add('Hello', function(){
 *   console.log('clicked hello');
 * });
 * ```
 *
 * Using a custom slug, otherwise "hello" is generated
 * from the `text` given, which may conflict with "rich"
 * styling like icons within menu items, or i18n.
 *
 * ```js
 * menu.add('add-item', 'Add Item');
 *
 * menu.on('add-item', function(){
 *   console.log('clicked "Add Item"');
 * });
 *
 * menu.add('add-item', 'Add Item', function(){
 *   console.log('clicked "Add Item"');
 * });
 * ```
 *
 * @param {String} text
 * @param {Function} fn
 * @return {Menu}
 * @api public
 */

Menu.prototype.add = function(text, fn){
  var slug, meta;

  // slug, text, [fn]
  if ('string' == typeof fn) {
    slug = text;
    text = fn;
    fn = arguments[2];
  } else {
    slug = createSlug(text);
  }

  if ('object' == typeof fn) {
    meta = fn;
    fn = arguments[2];
  }

  var self = this
    , el = o('<li><a href="#">' + text + '</a></li>');

  el
  .addClass('menu-item-' + slug)
  .appendTo(this.el)
  .on('click', function(e){
    e.preventDefault();
  })
  .on('mousedown', function(e){
    self._isSelecting = true;
  })
  .on('mouseup', function(e){
    e.preventDefault();
    self.select(item);
    self.emitSelected();
  });

  var item = new MenuItem({
    el: el
  , text: text
  , slug: slug
  , meta: meta
  , fn: fn
  });

  if (this.has(slug)) {
    this.hideItem(item);
  }

  this.items.push(item);

  return this;
};

/**
 * Remove an item by the given `slug`:
 *
 * ```js
 * menu.add('Add item');
 * menu.remove('Add item');
 * ```
 *
 * Or with custom slugs:
 *
 * ```js
 * menu.add('add-item', 'Add item');
 * menu.remove('add-item');
 * ```
 *
 * @param {String} slug
 * @return {Menu}
 * @api public
 */

Menu.prototype.remove = function(slug){
  var item = this.get(slug);
  if (!(item instanceof MenuItem)) {
    throw new Error('Not a MenuItem: "'+slug+'"');
  }
  var i = this.indexOf(item);
  if (!~i) {
    throw new Error('Not in Menu.items: "'+slug+'"');
  }
  item.el.remove();
  this.emit('remove', this.items.splice(i, 1));
  return this;
};

/**
 * Change menu item with `slug`.
 *
 * @param {String} slug
 * @return {Menu}
 * @api public
 */

Menu.prototype.change = function(slug){
  this.add.apply(this, [].slice.call(arguments, 1));
  var item = this.items.pop();
  var old = this.get(slug);
  this.el[0].insertBefore(item.el[0], old.el[0]);
  old.el.remove()
  this.items.splice(this.indexOf(old), 1, item);
  this.select(item);
  return this;
};

/**
 * Clear menu.
 *
 * @return {Menu}
 * @api public
 */

Menu.prototype.clear = function(){
  this.el.empty();
  this.items.length = 0;
  return this;
};

/**
 * Check if a menu item is present.
 *
 * ```js
 * menu.add('Add item');
 *
 * menu.has('Add item');
 * // => true
 *
 * menu.has('add-item');
 * // => true
 *
 * menu.has('Foo');
 * // => false
 * ```
 *
 * @param {MenuItem} item
 * @return {Boolean}
 * @api public
 */

Menu.prototype.has = function(item){
  return !!~this.items.indexOf(item);
}

/**
 * Find index of menu `item`.
 *
 * @param {MenuItem} item
 * @return {Number}
 * @api public
 */

Menu.prototype.indexOf = function(item){
  return this.items.indexOf(item);
}

/**
 * Move context menu to `(x, y)`.
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Menu}
 * @api public
 */

Menu.prototype.moveTo = function(x, y){
  var height = o(this.el).outerHeight();
  var width = o(this.el).outerWidth();

  if (y+height > viewport.bottom) {
    y = viewport.bottom-height;
  }

  if (y < viewport.top) {
    y = viewport.top;
  }

  if (x+width > viewport.right) {
    x = viewport.right-width;
  }

  if (x < viewport.left) {
    x = viewport.left;
  }

  this.el.css({
    top: y,
    left: x
  });

  return this;
};

/**
 * Move context menu to `(x, y)`.
 *
 * @param {Number} x
 * @param {Number} y
 * @return {Menu}
 * @api public
 */

Menu.prototype.moveToCenter = function(x, y){
  y -= this.el.outerHeight(true)/2
  this.moveTo(x, y);
  return this;
};

/**
 * Show the menu.
 *
 * @return {Menu}
 * @api public
 */

Menu.prototype.show = function(){
  if (this.isOpen()) return this;
  this.el.show();
  this._isOpen = true;
  this.emit('show');
  return this;
};

/**
 * Hide the menu.
 *
 * @return {Menu}
 * @api public
 */

Menu.prototype.hide = function(){
  if (!this.isOpen()) return this;
  this.emit('hide');
  this.el.hide();
  this._isOpen = false;
  this._isSelecting = false
  return this;
};

/**
 * Show a menu item.
 *
 * @param {MenuItem} item
 * @return {Menu}
 * @api public
 */

Menu.prototype.showItem = function(item){
  item.hidden = false;
  item.el.css({ display: 'block' });
  return this;
};

/**
 * Hide a menu item.
 *
 * @param {MenuItem} item
 * @return {Menu}
 * @api public
 */

Menu.prototype.hideItem = function(item){
  item.hidden = true;
  item.el.css({ display: 'none' });
  return this;
};

/**
 * Unhide all items.
 *
 * @return {Menu}
 * @api public
 */

Menu.prototype.unhideAll = function(){
  var self = this;
  this.items.forEach(function(item){
    self.showItem(item);
  });
  return this;
};

/**
 * Toggle the menu.
 *
 * @return {Menu}
 * @api public
 */

Menu.prototype.toggle = function(){
  if (this.isOpen()) this.hide();
  else this.show();
  return this;
};

/**
 * Filter menu using `fn`.
 *
 * @param {Function} fn
 * @return {Menu}
 * @api public
 */

Menu.prototype.filter = function(fn){
  var self = this;
  this.items.forEach(function (item) {
    if (fn(item)) {
      self.showItem(item);
    }
    else {
      self.hideItem(item);
    }
  });
  return this;
};

/**
 * Check if menu is visible.
 *
 * @return {Boolean}
 * @api public
 */

Menu.prototype.isOpen = function(){
  return this._isOpen;
};

/**
 * Check if user is selecting.
 *
 * @return {Boolean}
 * @api public
 */

Menu.prototype.isSelecting = function(){
  return this._isSelecting;
};

/**
 * MenuItem class.
 *
 * @param {Object} item
 * @api public
 */

function MenuItem(item) {
  this.el = item.el
  this.text = item.text
  this.slug = item.slug
  this.meta = item.meta
  this.fn = item.fn
}

/**
 * Generate a slug from `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function createSlug(str) {
  return String(str)
    .toLowerCase()
    .replace(/ +/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
