/**
 * Dolman HashMap
 * ===============
 *
 * Very basic hashmap abstraction to find our actions back in the express
 * stack.
 */
function HashMap() {

  // Internal state
  this.id = 1;
  this.store = {};
}

/**
 * Adding a record to the map.
 */
HashMap.prototype.set = function(key, value) {
  var id = this.id++;

  // Adding an invisible property to the key
  Object.defineProperty(key, '__hashId', {
    value: id,
    enumerable: false,
    writable: false,
    configurable: true
  });

  this.store[id] = value;

  return this;
};

/**
 * Getting a record from the map.
 */
HashMap.prototype.get = function(key) {
  var id = key.__hashId;

  if (!id)
    return;

  return this.store[id];
};

module.exports = HashMap;
