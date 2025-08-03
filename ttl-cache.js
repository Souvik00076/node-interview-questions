
class TTLCache {
  constructor(ttl = 60_000) {
    this.cache = new Map();
    this.timers = new Map();
    this.ttl = ttl;
  }
  delete(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
    }
    return this.cache.delete(key);
  }
  cleanup() {
    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < Date.now()) {
        this.delete(key);
      }
    }
  }
  set(key, value, ttl = this.ttl) {
    const entry = this.cache.get(key);
    if (entry) {
      this.delete(key);
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
    const timerId = setTimeout(() => {
      this.delete(key);
    }, ttl);
    this.timers.set(key, timerId);
  }
  get(key) {
    if (!key) return undefined;
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiry < Date.now()) {
      this.delete(key);
      return undefined;
    }
    return entry.value;
  }
  getLru(key) {
    if (!key) return undefined;
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expiry < Date.now()) {
      this.delete(key);
      return undefined;
    }
    const value = entry.value;
    this.delete(key);
    this.set(key, value)
    return value
  }
  size() {
    this.cleanup();
    return this.cache.size;
  }
  clear() {
    for (const [key, _] of this.timers.entries()) {
      this.delete(key);
    }
  }
  getRemainingTTL(key) {
    const item = this.cache.get(key);
    if (!item) return -1;
    const remaining = item.expiry - Date.now();
    return remaining > 0 ? remaining : 0;
  }
  keys() {
    this.cleanup();
    return Array.from(this.cache.keys());
  }
}

// Test the corrected implementation
const cache = new TTLCache(3000); // 3 second TTL

console.log('=== Testing Corrected Implementation ===');

// Test set/get
cache.set('test1', 'value1');
cache.set('test2', 'value2', 1000); // 1 second TTL
console.log('Immediate get test1:', cache.get('test1')); // Should work
console.log('Immediate get test2:', cache.get('test2')); // Should work
console.log('Cache size:', cache.size());

// Test expiration
setTimeout(() => {
  console.log('\nAfter 1.5 seconds:');
  console.log('Get test1:', cache.get('test1')); // Should still exist
  console.log('Get test2:', cache.get('test2')); // Should be expired
  console.log('Cache size:', cache.size());
}, 1500);

setTimeout(() => {
  console.log('\nAfter 3.5 seconds:');
  console.log('Get test1:', cache.get('test1')); // Should be expired
  console.log('Cache size:', cache.size());
}, 3500);
