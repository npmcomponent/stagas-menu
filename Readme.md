
# Menu

  Menu component with structural styling to give you a clean slate.

  ![js menu component](http://f.cl.ly/items/1Z1d3B1j283y3e200g3E/Screen%20Shot%202012-07-31%20at%203.57.10%20PM.png)

## Installation

```
$ npm install menu-component
```

## Features

  - events for composition
  - structural CSS letting you decide on style
  - fluent API
  - arrow key navigation

## Events

  - `show` when shown
  - `hide` when hidden
  - `remove` (item) when an item is removed
  - `select` (item) when an item is selected
  - `*` menu item events are emitted when clicked

## Example

```js
var Menu = require('menu');

var menu = new Menu;

menu
.add('Add item')
.add('Edit item', function(){ console.log('edit'); })
.add('Remove item', function(){ console.log('remove'); })
.add('Remove "Add item"', function(){
  menu.remove('Add item');
  menu.remove('Remove "Add item"');
});

menu.on('select', function(item){
  console.log('selected "%s"', item);
});

menu.on('Add item', function(){
  console.log('added an item');
});

oncontextmenu = function(e){
  e.preventDefault();
  menu.moveTo(e.pageX, e.pageY);
  menu.show();
};
```

## License

MIT

## API

### Menu()

Initialize a new `Menu`.

```js
var Menu = require('menu');
var menu = new Menu();
var menu = Menu();
```

Emits:

- "show" when shown
- "hide" when hidden
- "remove" with the item name when an item is removed
- "select" (item) when an item is selected
- * menu item events are emitted when clicked

### Menu.prototype()

Inherit from `Emitter.prototype`.

### Menu.move(`direction`:`String`)

Focus on the next menu item in `direction`.


### Menu.get(`slug`:`String`)
> _returns_ MenuItem

Gets a menu item named `slug`.


### Menu.add(`text`:`String`, `fn`:`Function`)
> _returns_ Menu

Add a new menu item with the given `text`, optional `slug` and callback `fn`.

When the item is clicked `fn()` will be invoked
and the `Menu` is immediately closed. When clicked
an event of the name `text` is emitted regardless of
the callback function being present.

Using events to handle selection:

```js
menu.add('Hello');

menu.on('Hello', function(){
  console.log('clicked hello');
});
```

Using callbacks:

```js
menu.add('Hello', function(){
  console.log('clicked hello');
});
```

Using a custom slug, otherwise "hello" is generated
from the `text` given, which may conflict with "rich"
styling like icons within menu items, or i18n.

```js
menu.add('add-item', 'Add Item');

menu.on('add-item', function(){
  console.log('clicked "Add Item"');
});

menu.add('add-item', 'Add Item', function(){
  console.log('clicked "Add Item"');
});
```

### Menu.remove(`slug`:`String`)
> _returns_ Menu

Remove an item by the given `slug`:

```js
menu.add('Add item');
menu.remove('Add item');
```

Or with custom slugs:

```js
menu.add('add-item', 'Add item');
menu.remove('add-item');
```

### Menu.change(`slug`:`String`)
> _returns_ Menu

Change menu item with `slug`.


### Menu.clear()
> _returns_ Menu

Clear menu.


### Menu.has(`item`:`MenuItem`)
> _returns_ Boolean

Check if a menu item is present.

```js
menu.add('Add item');

menu.has('Add item');
// => true

menu.has('add-item');
// => true

menu.has('Foo');
// => false
```

### Menu.indexOf(`item`:`MenuItem`)
> _returns_ Number

Find index of menu `item`.


### Menu.moveTo(`x`:`Number`, `y`:`Number`)
> _returns_ Menu

Move context menu to `(x, y)`.


### Menu.moveToCenter(`x`:`Number`, `y`:`Number`)
> _returns_ Menu

Move context menu to `(x, y)`.


### Menu.show()
> _returns_ Menu

Show the menu.


### Menu.hide()
> _returns_ Menu

Hide the menu.


### Menu.showItem(`item`:`Element`)
> _returns_ Menu

Show a menu item.


### Menu.hideItem(`item`:`Element`)
> _returns_ Menu

Hide a menu item.


### Menu.unhideAll()
> _returns_ Menu

Unhide all items.


### Menu.toggle()
> _returns_ Menu

Toggle the menu.


### Menu.filter(`fn`:`Function`)
> _returns_ Menu

Filter menu using `fn`.


### Menu.isOpen()
> _returns_ Boolean

Check if menu is visible.


### Menu.isSelecting()
> _returns_ Boolean

Check if user is selecting.


### MenuItem(`item`:`Object`)

MenuItem class.


