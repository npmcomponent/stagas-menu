
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
 * Emits:
 *
 *   - "show" when shown
 *   - "hide" when hidden
 *   - "remove" with the item name when an item is removed
 *   - "select" (item) when an item is selected
 *   - * menu item events are emitted when clicked
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
  this.el.find('.selected').removeClass('selected');
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
  o('html').bind('mouseup', this.onbodyclickBound);
  this.el.on('mouseover', 'a', this.deselectBound);
};

/**
 * Unbind mouse events.
 *
 * @api private
 */

Menu.prototype.unbindMouseEvents = function(){
  o('html').unbind('mouseup', this.onbodyclickBound);
  this.el.off('mouseover', 'a', this.deselectBound);
};

/**
 * Bind keyboard events.
 *
 * @api private
 */

Menu.prototype.bindKeyboardEvents = function(){
  o(document).bind('keydown.menu', this.onkeydown.bind(this));
  return this;
};

/**
 * Unbind keyboard events.
 *
 * @api private
 */

Menu.prototype.unbindKeyboardEvents = function(){
  o(document).unbind('keydown.menu');
  return this;
};

/**
 * Handle keydown events.
 *
 * @api private
 */

Menu.prototype.onkeydown = function(e){
  switch (e.keyCode) {
    // enter
    case 13:
      this.emit('select', this.selected);
      this.emit(this.selected.slug, this.selected.text, this.selected.meta);
      this.selected.fn && this.selected.fn();
      this.hide();
    break;

    // esc
    case 27:
      this.hide();
    break;

    // up
    case 38:
      e.preventDefault();
      this.move('prev');
    break;

    // down
    case 40:
      e.preventDefault();
      this.move('next');
    break;
  }
};

/**
 * Handle body click event.
 *
 * @api private
 */

Menu.prototype.onbodyclick = function() {
  if (this._isOpen) this.hide();
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
 * @return {Element}
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
 * Add menu item with the given `text` and optional callback `fn`.
 *
 * When the item is clicked `fn()` will be invoked
 * and the `Menu` is immediately closed. When clicked
 * an event of the name `text` is emitted regardless of
 * the callback function being present.
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
  .on('mouseup', function(e){
    e.preventDefault();
    e.stopPropagation();
    self.emit('select', item);
    self.emit(slug, text, meta);
    fn && fn();
    self.hide();
  });

  if (this.has(slug)) {
    this.hideItem(el);
  }

  var item = new MenuItem({
    el: el
  , text: text
  , slug: slug
  , meta: meta
  , fn: fn
  });

  this.items.push(item);

  return this;
};

/**
 * Remove menu item by `slug`.
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
  var item = this.items[this.items.length-1];
  var old = this.get(slug);
  this.el[0].insertBefore(item.el[0], old.el[0]);
  old.el.remove();
  old.el = item.el;
  old.slug = item.slug;
  old.text = item.text;
  old.meta = item.meta;
  old.fn = item.fn;
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
 * Check if this menu has `item`.
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
  viewport.refresh();

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
  this.emit('show');
  this.el.show();
  this._isOpen = true;
  return this;
};

/**
 * Hide the menu.
 *
 * @return {Menu}
 * @api public
 */

Menu.prototype.hide = function(){
  this._isOpen = false;
  this.el.hide();
  this.emit('hide');
  return this;
};

/**
 * Show a menu item.
 *
 * @param {Element} item
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
 * @param {Element} item
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
