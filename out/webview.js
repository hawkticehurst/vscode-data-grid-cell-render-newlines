// node_modules/@microsoft/fast-element/dist/esm/platform.js
var $global = function() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  try {
    return new Function("return this")();
  } catch (_a) {
    return {};
  }
}();
if ($global.trustedTypes === void 0) {
  $global.trustedTypes = { createPolicy: (n, r) => r };
}
var propConfig = {
  configurable: false,
  enumerable: false,
  writable: false
};
if ($global.FAST === void 0) {
  Reflect.defineProperty($global, "FAST", Object.assign({ value: /* @__PURE__ */ Object.create(null) }, propConfig));
}
var FAST = $global.FAST;
if (FAST.getById === void 0) {
  const storage = /* @__PURE__ */ Object.create(null);
  Reflect.defineProperty(FAST, "getById", Object.assign({ value(id, initialize) {
    let found = storage[id];
    if (found === void 0) {
      found = initialize ? storage[id] = initialize() : null;
    }
    return found;
  } }, propConfig));
}
var emptyArray = Object.freeze([]);
function createMetadataLocator() {
  const metadataLookup = /* @__PURE__ */ new WeakMap();
  return function(target) {
    let metadata = metadataLookup.get(target);
    if (metadata === void 0) {
      let currentTarget = Reflect.getPrototypeOf(target);
      while (metadata === void 0 && currentTarget !== null) {
        metadata = metadataLookup.get(currentTarget);
        currentTarget = Reflect.getPrototypeOf(currentTarget);
      }
      metadata = metadata === void 0 ? [] : metadata.slice(0);
      metadataLookup.set(target, metadata);
    }
    return metadata;
  };
}

// node_modules/@microsoft/fast-element/dist/esm/dom.js
var updateQueue = $global.FAST.getById(1, () => {
  const tasks = [];
  const pendingErrors = [];
  function throwFirstError() {
    if (pendingErrors.length) {
      throw pendingErrors.shift();
    }
  }
  function tryRunTask(task) {
    try {
      task.call();
    } catch (error) {
      pendingErrors.push(error);
      setTimeout(throwFirstError, 0);
    }
  }
  function process() {
    const capacity = 1024;
    let index = 0;
    while (index < tasks.length) {
      tryRunTask(tasks[index]);
      index++;
      if (index > capacity) {
        for (let scan = 0, newLength = tasks.length - index; scan < newLength; scan++) {
          tasks[scan] = tasks[scan + index];
        }
        tasks.length -= index;
        index = 0;
      }
    }
    tasks.length = 0;
  }
  function enqueue(callable) {
    if (tasks.length < 1) {
      $global.requestAnimationFrame(process);
    }
    tasks.push(callable);
  }
  return Object.freeze({
    enqueue,
    process
  });
});
var fastHTMLPolicy = $global.trustedTypes.createPolicy("fast-html", {
  createHTML: (html2) => html2
});
var htmlPolicy = fastHTMLPolicy;
var marker = `fast-${Math.random().toString(36).substring(2, 8)}`;
var _interpolationStart = `${marker}{`;
var _interpolationEnd = `}${marker}`;
var DOM = Object.freeze({
  supportsAdoptedStyleSheets: Array.isArray(document.adoptedStyleSheets) && "replace" in CSSStyleSheet.prototype,
  setHTMLPolicy(policy) {
    if (htmlPolicy !== fastHTMLPolicy) {
      throw new Error("The HTML policy can only be set once.");
    }
    htmlPolicy = policy;
  },
  createHTML(html2) {
    return htmlPolicy.createHTML(html2);
  },
  isMarker(node) {
    return node && node.nodeType === 8 && node.data.startsWith(marker);
  },
  extractDirectiveIndexFromMarker(node) {
    return parseInt(node.data.replace(`${marker}:`, ""));
  },
  createInterpolationPlaceholder(index) {
    return `${_interpolationStart}${index}${_interpolationEnd}`;
  },
  createCustomAttributePlaceholder(attributeName, index) {
    return `${attributeName}="${this.createInterpolationPlaceholder(index)}"`;
  },
  createBlockPlaceholder(index) {
    return `<!--${marker}:${index}-->`;
  },
  queueUpdate: updateQueue.enqueue,
  processUpdates: updateQueue.process,
  nextUpdate() {
    return new Promise(updateQueue.enqueue);
  },
  setAttribute(element, attributeName, value) {
    if (value === null || value === void 0) {
      element.removeAttribute(attributeName);
    } else {
      element.setAttribute(attributeName, value);
    }
  },
  setBooleanAttribute(element, attributeName, value) {
    value ? element.setAttribute(attributeName, "") : element.removeAttribute(attributeName);
  },
  removeChildNodes(parent) {
    for (let child = parent.firstChild; child !== null; child = parent.firstChild) {
      parent.removeChild(child);
    }
  },
  createTemplateWalker(fragment) {
    return document.createTreeWalker(
      fragment,
      133,
      null,
      false
    );
  }
});

// node_modules/@microsoft/fast-element/dist/esm/observation/notifier.js
var SubscriberSet = class {
  constructor(source, initialSubscriber) {
    this.sub1 = void 0;
    this.sub2 = void 0;
    this.spillover = void 0;
    this.source = source;
    this.sub1 = initialSubscriber;
  }
  has(subscriber) {
    return this.spillover === void 0 ? this.sub1 === subscriber || this.sub2 === subscriber : this.spillover.indexOf(subscriber) !== -1;
  }
  subscribe(subscriber) {
    const spillover = this.spillover;
    if (spillover === void 0) {
      if (this.has(subscriber)) {
        return;
      }
      if (this.sub1 === void 0) {
        this.sub1 = subscriber;
        return;
      }
      if (this.sub2 === void 0) {
        this.sub2 = subscriber;
        return;
      }
      this.spillover = [this.sub1, this.sub2, subscriber];
      this.sub1 = void 0;
      this.sub2 = void 0;
    } else {
      const index = spillover.indexOf(subscriber);
      if (index === -1) {
        spillover.push(subscriber);
      }
    }
  }
  unsubscribe(subscriber) {
    const spillover = this.spillover;
    if (spillover === void 0) {
      if (this.sub1 === subscriber) {
        this.sub1 = void 0;
      } else if (this.sub2 === subscriber) {
        this.sub2 = void 0;
      }
    } else {
      const index = spillover.indexOf(subscriber);
      if (index !== -1) {
        spillover.splice(index, 1);
      }
    }
  }
  notify(args) {
    const spillover = this.spillover;
    const source = this.source;
    if (spillover === void 0) {
      const sub1 = this.sub1;
      const sub2 = this.sub2;
      if (sub1 !== void 0) {
        sub1.handleChange(source, args);
      }
      if (sub2 !== void 0) {
        sub2.handleChange(source, args);
      }
    } else {
      for (let i = 0, ii = spillover.length; i < ii; ++i) {
        spillover[i].handleChange(source, args);
      }
    }
  }
};
var PropertyChangeNotifier = class {
  constructor(source) {
    this.subscribers = {};
    this.sourceSubscribers = null;
    this.source = source;
  }
  notify(propertyName) {
    var _a;
    const subscribers = this.subscribers[propertyName];
    if (subscribers !== void 0) {
      subscribers.notify(propertyName);
    }
    (_a = this.sourceSubscribers) === null || _a === void 0 ? void 0 : _a.notify(propertyName);
  }
  subscribe(subscriber, propertyToWatch) {
    var _a;
    if (propertyToWatch) {
      let subscribers = this.subscribers[propertyToWatch];
      if (subscribers === void 0) {
        this.subscribers[propertyToWatch] = subscribers = new SubscriberSet(this.source);
      }
      subscribers.subscribe(subscriber);
    } else {
      this.sourceSubscribers = (_a = this.sourceSubscribers) !== null && _a !== void 0 ? _a : new SubscriberSet(this.source);
      this.sourceSubscribers.subscribe(subscriber);
    }
  }
  unsubscribe(subscriber, propertyToUnwatch) {
    var _a;
    if (propertyToUnwatch) {
      const subscribers = this.subscribers[propertyToUnwatch];
      if (subscribers !== void 0) {
        subscribers.unsubscribe(subscriber);
      }
    } else {
      (_a = this.sourceSubscribers) === null || _a === void 0 ? void 0 : _a.unsubscribe(subscriber);
    }
  }
};

// node_modules/@microsoft/fast-element/dist/esm/observation/observable.js
var Observable = FAST.getById(2, () => {
  const volatileRegex = /(:|&&|\|\||if)/;
  const notifierLookup = /* @__PURE__ */ new WeakMap();
  const queueUpdate = DOM.queueUpdate;
  let watcher = void 0;
  let createArrayObserver = (array) => {
    throw new Error("Must call enableArrayObservation before observing arrays.");
  };
  function getNotifier(source) {
    let found = source.$fastController || notifierLookup.get(source);
    if (found === void 0) {
      if (Array.isArray(source)) {
        found = createArrayObserver(source);
      } else {
        notifierLookup.set(source, found = new PropertyChangeNotifier(source));
      }
    }
    return found;
  }
  const getAccessors = createMetadataLocator();
  class DefaultObservableAccessor {
    constructor(name) {
      this.name = name;
      this.field = `_${name}`;
      this.callback = `${name}Changed`;
    }
    getValue(source) {
      if (watcher !== void 0) {
        watcher.watch(source, this.name);
      }
      return source[this.field];
    }
    setValue(source, newValue) {
      const field = this.field;
      const oldValue = source[field];
      if (oldValue !== newValue) {
        source[field] = newValue;
        const callback = source[this.callback];
        if (typeof callback === "function") {
          callback.call(source, oldValue, newValue);
        }
        getNotifier(source).notify(this.name);
      }
    }
  }
  class BindingObserverImplementation extends SubscriberSet {
    constructor(binding, initialSubscriber, isVolatileBinding = false) {
      super(binding, initialSubscriber);
      this.binding = binding;
      this.isVolatileBinding = isVolatileBinding;
      this.needsRefresh = true;
      this.needsQueue = true;
      this.first = this;
      this.last = null;
      this.propertySource = void 0;
      this.propertyName = void 0;
      this.notifier = void 0;
      this.next = void 0;
    }
    observe(source, context) {
      if (this.needsRefresh && this.last !== null) {
        this.disconnect();
      }
      const previousWatcher = watcher;
      watcher = this.needsRefresh ? this : void 0;
      this.needsRefresh = this.isVolatileBinding;
      const result = this.binding(source, context);
      watcher = previousWatcher;
      return result;
    }
    disconnect() {
      if (this.last !== null) {
        let current = this.first;
        while (current !== void 0) {
          current.notifier.unsubscribe(this, current.propertyName);
          current = current.next;
        }
        this.last = null;
        this.needsRefresh = this.needsQueue = true;
      }
    }
    watch(propertySource, propertyName) {
      const prev = this.last;
      const notifier = getNotifier(propertySource);
      const current = prev === null ? this.first : {};
      current.propertySource = propertySource;
      current.propertyName = propertyName;
      current.notifier = notifier;
      notifier.subscribe(this, propertyName);
      if (prev !== null) {
        if (!this.needsRefresh) {
          let prevValue;
          watcher = void 0;
          prevValue = prev.propertySource[prev.propertyName];
          watcher = this;
          if (propertySource === prevValue) {
            this.needsRefresh = true;
          }
        }
        prev.next = current;
      }
      this.last = current;
    }
    handleChange() {
      if (this.needsQueue) {
        this.needsQueue = false;
        queueUpdate(this);
      }
    }
    call() {
      if (this.last !== null) {
        this.needsQueue = true;
        this.notify(this);
      }
    }
    records() {
      let next = this.first;
      return {
        next: () => {
          const current = next;
          if (current === void 0) {
            return { value: void 0, done: true };
          } else {
            next = next.next;
            return {
              value: current,
              done: false
            };
          }
        },
        [Symbol.iterator]: function() {
          return this;
        }
      };
    }
  }
  return Object.freeze({
    setArrayObserverFactory(factory) {
      createArrayObserver = factory;
    },
    getNotifier,
    track(source, propertyName) {
      if (watcher !== void 0) {
        watcher.watch(source, propertyName);
      }
    },
    trackVolatile() {
      if (watcher !== void 0) {
        watcher.needsRefresh = true;
      }
    },
    notify(source, args) {
      getNotifier(source).notify(args);
    },
    defineProperty(target, nameOrAccessor) {
      if (typeof nameOrAccessor === "string") {
        nameOrAccessor = new DefaultObservableAccessor(nameOrAccessor);
      }
      getAccessors(target).push(nameOrAccessor);
      Reflect.defineProperty(target, nameOrAccessor.name, {
        enumerable: true,
        get: function() {
          return nameOrAccessor.getValue(this);
        },
        set: function(newValue) {
          nameOrAccessor.setValue(this, newValue);
        }
      });
    },
    getAccessors,
    binding(binding, initialSubscriber, isVolatileBinding = this.isVolatileBinding(binding)) {
      return new BindingObserverImplementation(binding, initialSubscriber, isVolatileBinding);
    },
    isVolatileBinding(binding) {
      return volatileRegex.test(binding.toString());
    }
  });
});
function observable(target, nameOrAccessor) {
  Observable.defineProperty(target, nameOrAccessor);
}
var contextEvent = FAST.getById(3, () => {
  let current = null;
  return {
    get() {
      return current;
    },
    set(event) {
      current = event;
    }
  };
});
var ExecutionContext = class {
  constructor() {
    this.index = 0;
    this.length = 0;
    this.parent = null;
    this.parentContext = null;
  }
  get event() {
    return contextEvent.get();
  }
  get isEven() {
    return this.index % 2 === 0;
  }
  get isOdd() {
    return this.index % 2 !== 0;
  }
  get isFirst() {
    return this.index === 0;
  }
  get isInMiddle() {
    return !this.isFirst && !this.isLast;
  }
  get isLast() {
    return this.index === this.length - 1;
  }
  static setEvent(event) {
    contextEvent.set(event);
  }
};
Observable.defineProperty(ExecutionContext.prototype, "index");
Observable.defineProperty(ExecutionContext.prototype, "length");
var defaultExecutionContext = Object.seal(new ExecutionContext());

// node_modules/@microsoft/fast-element/dist/esm/templating/html-directive.js
var HTMLDirective = class {
  constructor() {
    this.targetIndex = 0;
  }
};
var TargetedHTMLDirective = class extends HTMLDirective {
  constructor() {
    super(...arguments);
    this.createPlaceholder = DOM.createInterpolationPlaceholder;
  }
};
var AttachedBehaviorHTMLDirective = class extends HTMLDirective {
  constructor(name, behavior, options) {
    super();
    this.name = name;
    this.behavior = behavior;
    this.options = options;
  }
  createPlaceholder(index) {
    return DOM.createCustomAttributePlaceholder(this.name, index);
  }
  createBehavior(target) {
    return new this.behavior(target, this.options);
  }
};

// node_modules/@microsoft/fast-element/dist/esm/templating/binding.js
function normalBind(source, context) {
  this.source = source;
  this.context = context;
  if (this.bindingObserver === null) {
    this.bindingObserver = Observable.binding(this.binding, this, this.isBindingVolatile);
  }
  this.updateTarget(this.bindingObserver.observe(source, context));
}
function triggerBind(source, context) {
  this.source = source;
  this.context = context;
  this.target.addEventListener(this.targetName, this);
}
function normalUnbind() {
  this.bindingObserver.disconnect();
  this.source = null;
  this.context = null;
}
function contentUnbind() {
  this.bindingObserver.disconnect();
  this.source = null;
  this.context = null;
  const view = this.target.$fastView;
  if (view !== void 0 && view.isComposed) {
    view.unbind();
    view.needsBindOnly = true;
  }
}
function triggerUnbind() {
  this.target.removeEventListener(this.targetName, this);
  this.source = null;
  this.context = null;
}
function updateAttributeTarget(value) {
  DOM.setAttribute(this.target, this.targetName, value);
}
function updateBooleanAttributeTarget(value) {
  DOM.setBooleanAttribute(this.target, this.targetName, value);
}
function updateContentTarget(value) {
  if (value === null || value === void 0) {
    value = "";
  }
  if (value.create) {
    this.target.textContent = "";
    let view = this.target.$fastView;
    if (view === void 0) {
      view = value.create();
    } else {
      if (this.target.$fastTemplate !== value) {
        if (view.isComposed) {
          view.remove();
          view.unbind();
        }
        view = value.create();
      }
    }
    if (!view.isComposed) {
      view.isComposed = true;
      view.bind(this.source, this.context);
      view.insertBefore(this.target);
      this.target.$fastView = view;
      this.target.$fastTemplate = value;
    } else if (view.needsBindOnly) {
      view.needsBindOnly = false;
      view.bind(this.source, this.context);
    }
  } else {
    const view = this.target.$fastView;
    if (view !== void 0 && view.isComposed) {
      view.isComposed = false;
      view.remove();
      if (view.needsBindOnly) {
        view.needsBindOnly = false;
      } else {
        view.unbind();
      }
    }
    this.target.textContent = value;
  }
}
function updatePropertyTarget(value) {
  this.target[this.targetName] = value;
}
function updateClassTarget(value) {
  const classVersions = this.classVersions || /* @__PURE__ */ Object.create(null);
  const target = this.target;
  let version = this.version || 0;
  if (value !== null && value !== void 0 && value.length) {
    const names = value.split(/\s+/);
    for (let i = 0, ii = names.length; i < ii; ++i) {
      const currentName = names[i];
      if (currentName === "") {
        continue;
      }
      classVersions[currentName] = version;
      target.classList.add(currentName);
    }
  }
  this.classVersions = classVersions;
  this.version = version + 1;
  if (version === 0) {
    return;
  }
  version -= 1;
  for (const name in classVersions) {
    if (classVersions[name] === version) {
      target.classList.remove(name);
    }
  }
}
var HTMLBindingDirective = class extends TargetedHTMLDirective {
  constructor(binding) {
    super();
    this.binding = binding;
    this.bind = normalBind;
    this.unbind = normalUnbind;
    this.updateTarget = updateAttributeTarget;
    this.isBindingVolatile = Observable.isVolatileBinding(this.binding);
  }
  get targetName() {
    return this.originalTargetName;
  }
  set targetName(value) {
    this.originalTargetName = value;
    if (value === void 0) {
      return;
    }
    switch (value[0]) {
      case ":":
        this.cleanedTargetName = value.substr(1);
        this.updateTarget = updatePropertyTarget;
        if (this.cleanedTargetName === "innerHTML") {
          const binding = this.binding;
          this.binding = (s, c) => DOM.createHTML(binding(s, c));
        }
        break;
      case "?":
        this.cleanedTargetName = value.substr(1);
        this.updateTarget = updateBooleanAttributeTarget;
        break;
      case "@":
        this.cleanedTargetName = value.substr(1);
        this.bind = triggerBind;
        this.unbind = triggerUnbind;
        break;
      default:
        this.cleanedTargetName = value;
        if (value === "class") {
          this.updateTarget = updateClassTarget;
        }
        break;
    }
  }
  targetAtContent() {
    this.updateTarget = updateContentTarget;
    this.unbind = contentUnbind;
  }
  createBehavior(target) {
    return new BindingBehavior(target, this.binding, this.isBindingVolatile, this.bind, this.unbind, this.updateTarget, this.cleanedTargetName);
  }
};
var BindingBehavior = class {
  constructor(target, binding, isBindingVolatile, bind, unbind, updateTarget, targetName) {
    this.source = null;
    this.context = null;
    this.bindingObserver = null;
    this.target = target;
    this.binding = binding;
    this.isBindingVolatile = isBindingVolatile;
    this.bind = bind;
    this.unbind = unbind;
    this.updateTarget = updateTarget;
    this.targetName = targetName;
  }
  handleChange() {
    this.updateTarget(this.bindingObserver.observe(this.source, this.context));
  }
  handleEvent(event) {
    ExecutionContext.setEvent(event);
    const result = this.binding(this.source, this.context);
    ExecutionContext.setEvent(null);
    if (result !== true) {
      event.preventDefault();
    }
  }
};

// node_modules/@microsoft/fast-element/dist/esm/templating/compiler.js
var sharedContext = null;
var CompilationContext = class {
  addFactory(factory) {
    factory.targetIndex = this.targetIndex;
    this.behaviorFactories.push(factory);
  }
  captureContentBinding(directive) {
    directive.targetAtContent();
    this.addFactory(directive);
  }
  reset() {
    this.behaviorFactories = [];
    this.targetIndex = -1;
  }
  release() {
    sharedContext = this;
  }
  static borrow(directives) {
    const shareable = sharedContext || new CompilationContext();
    shareable.directives = directives;
    shareable.reset();
    sharedContext = null;
    return shareable;
  }
};
function createAggregateBinding(parts) {
  if (parts.length === 1) {
    return parts[0];
  }
  let targetName;
  const partCount = parts.length;
  const finalParts = parts.map((x) => {
    if (typeof x === "string") {
      return () => x;
    }
    targetName = x.targetName || targetName;
    return x.binding;
  });
  const binding = (scope, context) => {
    let output = "";
    for (let i = 0; i < partCount; ++i) {
      output += finalParts[i](scope, context);
    }
    return output;
  };
  const directive = new HTMLBindingDirective(binding);
  directive.targetName = targetName;
  return directive;
}
var interpolationEndLength = _interpolationEnd.length;
function parseContent(context, value) {
  const valueParts = value.split(_interpolationStart);
  if (valueParts.length === 1) {
    return null;
  }
  const bindingParts = [];
  for (let i = 0, ii = valueParts.length; i < ii; ++i) {
    const current = valueParts[i];
    const index = current.indexOf(_interpolationEnd);
    let literal;
    if (index === -1) {
      literal = current;
    } else {
      const directiveIndex = parseInt(current.substring(0, index));
      bindingParts.push(context.directives[directiveIndex]);
      literal = current.substring(index + interpolationEndLength);
    }
    if (literal !== "") {
      bindingParts.push(literal);
    }
  }
  return bindingParts;
}
function compileAttributes(context, node, includeBasicValues = false) {
  const attributes = node.attributes;
  for (let i = 0, ii = attributes.length; i < ii; ++i) {
    const attr2 = attributes[i];
    const attrValue = attr2.value;
    const parseResult = parseContent(context, attrValue);
    let result = null;
    if (parseResult === null) {
      if (includeBasicValues) {
        result = new HTMLBindingDirective(() => attrValue);
        result.targetName = attr2.name;
      }
    } else {
      result = createAggregateBinding(parseResult);
    }
    if (result !== null) {
      node.removeAttributeNode(attr2);
      i--;
      ii--;
      context.addFactory(result);
    }
  }
}
function compileContent(context, node, walker) {
  const parseResult = parseContent(context, node.textContent);
  if (parseResult !== null) {
    let lastNode = node;
    for (let i = 0, ii = parseResult.length; i < ii; ++i) {
      const currentPart = parseResult[i];
      const currentNode = i === 0 ? node : lastNode.parentNode.insertBefore(document.createTextNode(""), lastNode.nextSibling);
      if (typeof currentPart === "string") {
        currentNode.textContent = currentPart;
      } else {
        currentNode.textContent = " ";
        context.captureContentBinding(currentPart);
      }
      lastNode = currentNode;
      context.targetIndex++;
      if (currentNode !== node) {
        walker.nextNode();
      }
    }
    context.targetIndex--;
  }
}
function compileTemplate(template, directives) {
  const fragment = template.content;
  document.adoptNode(fragment);
  const context = CompilationContext.borrow(directives);
  compileAttributes(context, template, true);
  const hostBehaviorFactories = context.behaviorFactories;
  context.reset();
  const walker = DOM.createTemplateWalker(fragment);
  let node;
  while (node = walker.nextNode()) {
    context.targetIndex++;
    switch (node.nodeType) {
      case 1:
        compileAttributes(context, node);
        break;
      case 3:
        compileContent(context, node, walker);
        break;
      case 8:
        if (DOM.isMarker(node)) {
          context.addFactory(directives[DOM.extractDirectiveIndexFromMarker(node)]);
        }
    }
  }
  let targetOffset = 0;
  if (DOM.isMarker(fragment.firstChild) || fragment.childNodes.length === 1 && directives.length) {
    fragment.insertBefore(document.createComment(""), fragment.firstChild);
    targetOffset = -1;
  }
  const viewBehaviorFactories = context.behaviorFactories;
  context.release();
  return {
    fragment,
    viewBehaviorFactories,
    hostBehaviorFactories,
    targetOffset
  };
}

// node_modules/@microsoft/fast-element/dist/esm/templating/view.js
var range = document.createRange();
var HTMLView = class {
  constructor(fragment, behaviors) {
    this.fragment = fragment;
    this.behaviors = behaviors;
    this.source = null;
    this.context = null;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
  }
  appendTo(node) {
    node.appendChild(this.fragment);
  }
  insertBefore(node) {
    if (this.fragment.hasChildNodes()) {
      node.parentNode.insertBefore(this.fragment, node);
    } else {
      const end = this.lastChild;
      if (node.previousSibling === end)
        return;
      const parentNode = node.parentNode;
      let current = this.firstChild;
      let next;
      while (current !== end) {
        next = current.nextSibling;
        parentNode.insertBefore(current, node);
        current = next;
      }
      parentNode.insertBefore(end, node);
    }
  }
  remove() {
    const fragment = this.fragment;
    const end = this.lastChild;
    let current = this.firstChild;
    let next;
    while (current !== end) {
      next = current.nextSibling;
      fragment.appendChild(current);
      current = next;
    }
    fragment.appendChild(end);
  }
  dispose() {
    const parent = this.firstChild.parentNode;
    const end = this.lastChild;
    let current = this.firstChild;
    let next;
    while (current !== end) {
      next = current.nextSibling;
      parent.removeChild(current);
      current = next;
    }
    parent.removeChild(end);
    const behaviors = this.behaviors;
    const oldSource = this.source;
    for (let i = 0, ii = behaviors.length; i < ii; ++i) {
      behaviors[i].unbind(oldSource);
    }
  }
  bind(source, context) {
    const behaviors = this.behaviors;
    if (this.source === source) {
      return;
    } else if (this.source !== null) {
      const oldSource = this.source;
      this.source = source;
      this.context = context;
      for (let i = 0, ii = behaviors.length; i < ii; ++i) {
        const current = behaviors[i];
        current.unbind(oldSource);
        current.bind(source, context);
      }
    } else {
      this.source = source;
      this.context = context;
      for (let i = 0, ii = behaviors.length; i < ii; ++i) {
        behaviors[i].bind(source, context);
      }
    }
  }
  unbind() {
    if (this.source === null) {
      return;
    }
    const behaviors = this.behaviors;
    const oldSource = this.source;
    for (let i = 0, ii = behaviors.length; i < ii; ++i) {
      behaviors[i].unbind(oldSource);
    }
    this.source = null;
  }
  static disposeContiguousBatch(views) {
    if (views.length === 0) {
      return;
    }
    range.setStartBefore(views[0].firstChild);
    range.setEndAfter(views[views.length - 1].lastChild);
    range.deleteContents();
    for (let i = 0, ii = views.length; i < ii; ++i) {
      const view = views[i];
      const behaviors = view.behaviors;
      const oldSource = view.source;
      for (let j = 0, jj = behaviors.length; j < jj; ++j) {
        behaviors[j].unbind(oldSource);
      }
    }
  }
};

// node_modules/@microsoft/fast-element/dist/esm/templating/template.js
var ViewTemplate = class {
  constructor(html2, directives) {
    this.behaviorCount = 0;
    this.hasHostBehaviors = false;
    this.fragment = null;
    this.targetOffset = 0;
    this.viewBehaviorFactories = null;
    this.hostBehaviorFactories = null;
    this.html = html2;
    this.directives = directives;
  }
  create(hostBindingTarget) {
    if (this.fragment === null) {
      let template;
      const html2 = this.html;
      if (typeof html2 === "string") {
        template = document.createElement("template");
        template.innerHTML = DOM.createHTML(html2);
        const fec = template.content.firstElementChild;
        if (fec !== null && fec.tagName === "TEMPLATE") {
          template = fec;
        }
      } else {
        template = html2;
      }
      const result = compileTemplate(template, this.directives);
      this.fragment = result.fragment;
      this.viewBehaviorFactories = result.viewBehaviorFactories;
      this.hostBehaviorFactories = result.hostBehaviorFactories;
      this.targetOffset = result.targetOffset;
      this.behaviorCount = this.viewBehaviorFactories.length + this.hostBehaviorFactories.length;
      this.hasHostBehaviors = this.hostBehaviorFactories.length > 0;
    }
    const fragment = this.fragment.cloneNode(true);
    const viewFactories = this.viewBehaviorFactories;
    const behaviors = new Array(this.behaviorCount);
    const walker = DOM.createTemplateWalker(fragment);
    let behaviorIndex = 0;
    let targetIndex = this.targetOffset;
    let node = walker.nextNode();
    for (let ii = viewFactories.length; behaviorIndex < ii; ++behaviorIndex) {
      const factory = viewFactories[behaviorIndex];
      const factoryIndex = factory.targetIndex;
      while (node !== null) {
        if (targetIndex === factoryIndex) {
          behaviors[behaviorIndex] = factory.createBehavior(node);
          break;
        } else {
          node = walker.nextNode();
          targetIndex++;
        }
      }
    }
    if (this.hasHostBehaviors) {
      const hostFactories = this.hostBehaviorFactories;
      for (let i = 0, ii = hostFactories.length; i < ii; ++i, ++behaviorIndex) {
        behaviors[behaviorIndex] = hostFactories[i].createBehavior(hostBindingTarget);
      }
    }
    return new HTMLView(fragment, behaviors);
  }
  render(source, host, hostBindingTarget) {
    if (typeof host === "string") {
      host = document.getElementById(host);
    }
    if (hostBindingTarget === void 0) {
      hostBindingTarget = host;
    }
    const view = this.create(hostBindingTarget);
    view.bind(source, defaultExecutionContext);
    view.appendTo(host);
    return view;
  }
};
var lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;
function html(strings, ...values) {
  const directives = [];
  let html2 = "";
  for (let i = 0, ii = strings.length - 1; i < ii; ++i) {
    const currentString = strings[i];
    let value = values[i];
    html2 += currentString;
    if (value instanceof ViewTemplate) {
      const template = value;
      value = () => template;
    }
    if (typeof value === "function") {
      value = new HTMLBindingDirective(value);
    }
    if (value instanceof TargetedHTMLDirective) {
      const match = lastAttributeNameRegex.exec(currentString);
      if (match !== null) {
        value.targetName = match[2];
      }
    }
    if (value instanceof HTMLDirective) {
      html2 += value.createPlaceholder(directives.length);
      directives.push(value);
    } else {
      html2 += value;
    }
  }
  html2 += strings[strings.length - 1];
  return new ViewTemplate(html2, directives);
}

// node_modules/@microsoft/fast-element/dist/esm/styles/element-styles.js
var ElementStyles = class {
  constructor() {
    this.targets = /* @__PURE__ */ new WeakSet();
  }
  addStylesTo(target) {
    this.targets.add(target);
  }
  removeStylesFrom(target) {
    this.targets.delete(target);
  }
  isAttachedTo(target) {
    return this.targets.has(target);
  }
  withBehaviors(...behaviors) {
    this.behaviors = this.behaviors === null ? behaviors : this.behaviors.concat(behaviors);
    return this;
  }
};
ElementStyles.create = (() => {
  if (DOM.supportsAdoptedStyleSheets) {
    const styleSheetCache = /* @__PURE__ */ new Map();
    return (styles) => new AdoptedStyleSheetsStyles(styles, styleSheetCache);
  }
  return (styles) => new StyleElementStyles(styles);
})();
function reduceStyles(styles) {
  return styles.map((x) => x instanceof ElementStyles ? reduceStyles(x.styles) : [x]).reduce((prev, curr) => prev.concat(curr), []);
}
function reduceBehaviors(styles) {
  return styles.map((x) => x instanceof ElementStyles ? x.behaviors : null).reduce((prev, curr) => {
    if (curr === null) {
      return prev;
    }
    if (prev === null) {
      prev = [];
    }
    return prev.concat(curr);
  }, null);
}
var AdoptedStyleSheetsStyles = class extends ElementStyles {
  constructor(styles, styleSheetCache) {
    super();
    this.styles = styles;
    this.styleSheetCache = styleSheetCache;
    this._styleSheets = void 0;
    this.behaviors = reduceBehaviors(styles);
  }
  get styleSheets() {
    if (this._styleSheets === void 0) {
      const styles = this.styles;
      const styleSheetCache = this.styleSheetCache;
      this._styleSheets = reduceStyles(styles).map((x) => {
        if (x instanceof CSSStyleSheet) {
          return x;
        }
        let sheet = styleSheetCache.get(x);
        if (sheet === void 0) {
          sheet = new CSSStyleSheet();
          sheet.replaceSync(x);
          styleSheetCache.set(x, sheet);
        }
        return sheet;
      });
    }
    return this._styleSheets;
  }
  addStylesTo(target) {
    target.adoptedStyleSheets = [...target.adoptedStyleSheets, ...this.styleSheets];
    super.addStylesTo(target);
  }
  removeStylesFrom(target) {
    const sourceSheets = this.styleSheets;
    target.adoptedStyleSheets = target.adoptedStyleSheets.filter((x) => sourceSheets.indexOf(x) === -1);
    super.removeStylesFrom(target);
  }
};
var styleClassId = 0;
function getNextStyleClass() {
  return `fast-style-class-${++styleClassId}`;
}
var StyleElementStyles = class extends ElementStyles {
  constructor(styles) {
    super();
    this.styles = styles;
    this.behaviors = null;
    this.behaviors = reduceBehaviors(styles);
    this.styleSheets = reduceStyles(styles);
    this.styleClass = getNextStyleClass();
  }
  addStylesTo(target) {
    const styleSheets = this.styleSheets;
    const styleClass = this.styleClass;
    target = this.normalizeTarget(target);
    for (let i = 0; i < styleSheets.length; i++) {
      const element = document.createElement("style");
      element.innerHTML = styleSheets[i];
      element.className = styleClass;
      target.append(element);
    }
    super.addStylesTo(target);
  }
  removeStylesFrom(target) {
    target = this.normalizeTarget(target);
    const styles = target.querySelectorAll(`.${this.styleClass}`);
    for (let i = 0, ii = styles.length; i < ii; ++i) {
      target.removeChild(styles[i]);
    }
    super.removeStylesFrom(target);
  }
  isAttachedTo(target) {
    return super.isAttachedTo(this.normalizeTarget(target));
  }
  normalizeTarget(target) {
    return target === document ? document.body : target;
  }
};

// node_modules/@microsoft/fast-element/dist/esm/components/attributes.js
var AttributeConfiguration = Object.freeze({
  locate: createMetadataLocator()
});
var booleanConverter = {
  toView(value) {
    return value ? "true" : "false";
  },
  fromView(value) {
    if (value === null || value === void 0 || value === "false" || value === false || value === 0) {
      return false;
    }
    return true;
  }
};
var AttributeDefinition = class {
  constructor(Owner, name, attribute = name.toLowerCase(), mode = "reflect", converter) {
    this.guards = /* @__PURE__ */ new Set();
    this.Owner = Owner;
    this.name = name;
    this.attribute = attribute;
    this.mode = mode;
    this.converter = converter;
    this.fieldName = `_${name}`;
    this.callbackName = `${name}Changed`;
    this.hasCallback = this.callbackName in Owner.prototype;
    if (mode === "boolean" && converter === void 0) {
      this.converter = booleanConverter;
    }
  }
  setValue(source, newValue) {
    const oldValue = source[this.fieldName];
    const converter = this.converter;
    if (converter !== void 0) {
      newValue = converter.fromView(newValue);
    }
    if (oldValue !== newValue) {
      source[this.fieldName] = newValue;
      this.tryReflectToAttribute(source);
      if (this.hasCallback) {
        source[this.callbackName](oldValue, newValue);
      }
      source.$fastController.notify(this.name);
    }
  }
  getValue(source) {
    Observable.track(source, this.name);
    return source[this.fieldName];
  }
  onAttributeChangedCallback(element, value) {
    if (this.guards.has(element)) {
      return;
    }
    this.guards.add(element);
    this.setValue(element, value);
    this.guards.delete(element);
  }
  tryReflectToAttribute(element) {
    const mode = this.mode;
    const guards = this.guards;
    if (guards.has(element) || mode === "fromView") {
      return;
    }
    DOM.queueUpdate(() => {
      guards.add(element);
      const latestValue = element[this.fieldName];
      switch (mode) {
        case "reflect":
          const converter = this.converter;
          DOM.setAttribute(element, this.attribute, converter !== void 0 ? converter.toView(latestValue) : latestValue);
          break;
        case "boolean":
          DOM.setBooleanAttribute(element, this.attribute, latestValue);
          break;
      }
      guards.delete(element);
    });
  }
  static collect(Owner, ...attributeLists) {
    const attributes = [];
    attributeLists.push(AttributeConfiguration.locate(Owner));
    for (let i = 0, ii = attributeLists.length; i < ii; ++i) {
      const list = attributeLists[i];
      if (list === void 0) {
        continue;
      }
      for (let j = 0, jj = list.length; j < jj; ++j) {
        const config = list[j];
        if (typeof config === "string") {
          attributes.push(new AttributeDefinition(Owner, config));
        } else {
          attributes.push(new AttributeDefinition(Owner, config.property, config.attribute, config.mode, config.converter));
        }
      }
    }
    return attributes;
  }
};
function attr(configOrTarget, prop) {
  let config;
  function decorator($target, $prop) {
    if (arguments.length > 1) {
      config.property = $prop;
    }
    AttributeConfiguration.locate($target.constructor).push(config);
  }
  if (arguments.length > 1) {
    config = {};
    decorator(configOrTarget, prop);
    return;
  }
  config = configOrTarget === void 0 ? {} : configOrTarget;
  return decorator;
}

// node_modules/@microsoft/fast-element/dist/esm/components/fast-definitions.js
var defaultShadowOptions = { mode: "open" };
var defaultElementOptions = {};
var fastRegistry = FAST.getById(4, () => {
  const typeToDefinition = /* @__PURE__ */ new Map();
  return Object.freeze({
    register(definition) {
      if (typeToDefinition.has(definition.type)) {
        return false;
      }
      typeToDefinition.set(definition.type, definition);
      return true;
    },
    getByType(key) {
      return typeToDefinition.get(key);
    }
  });
});
var FASTElementDefinition = class {
  constructor(type, nameOrConfig = type.definition) {
    if (typeof nameOrConfig === "string") {
      nameOrConfig = { name: nameOrConfig };
    }
    this.type = type;
    this.name = nameOrConfig.name;
    this.template = nameOrConfig.template;
    const attributes = AttributeDefinition.collect(type, nameOrConfig.attributes);
    const observedAttributes = new Array(attributes.length);
    const propertyLookup = {};
    const attributeLookup = {};
    for (let i = 0, ii = attributes.length; i < ii; ++i) {
      const current = attributes[i];
      observedAttributes[i] = current.attribute;
      propertyLookup[current.name] = current;
      attributeLookup[current.attribute] = current;
    }
    this.attributes = attributes;
    this.observedAttributes = observedAttributes;
    this.propertyLookup = propertyLookup;
    this.attributeLookup = attributeLookup;
    this.shadowOptions = nameOrConfig.shadowOptions === void 0 ? defaultShadowOptions : nameOrConfig.shadowOptions === null ? void 0 : Object.assign(Object.assign({}, defaultShadowOptions), nameOrConfig.shadowOptions);
    this.elementOptions = nameOrConfig.elementOptions === void 0 ? defaultElementOptions : Object.assign(Object.assign({}, defaultElementOptions), nameOrConfig.elementOptions);
    this.styles = nameOrConfig.styles === void 0 ? void 0 : Array.isArray(nameOrConfig.styles) ? ElementStyles.create(nameOrConfig.styles) : nameOrConfig.styles instanceof ElementStyles ? nameOrConfig.styles : ElementStyles.create([nameOrConfig.styles]);
  }
  get isDefined() {
    return !!fastRegistry.getByType(this.type);
  }
  define(registry = customElements) {
    const type = this.type;
    if (fastRegistry.register(this)) {
      const attributes = this.attributes;
      const proto = type.prototype;
      for (let i = 0, ii = attributes.length; i < ii; ++i) {
        Observable.defineProperty(proto, attributes[i]);
      }
      Reflect.defineProperty(type, "observedAttributes", {
        value: this.observedAttributes,
        enumerable: true
      });
    }
    if (!registry.get(this.name)) {
      registry.define(this.name, type, this.elementOptions);
    }
    return this;
  }
};
FASTElementDefinition.forType = fastRegistry.getByType;

// node_modules/@microsoft/fast-element/dist/esm/components/controller.js
var shadowRoots = /* @__PURE__ */ new WeakMap();
var defaultEventOptions = {
  bubbles: true,
  composed: true,
  cancelable: true
};
function getShadowRoot(element) {
  return element.shadowRoot || shadowRoots.get(element) || null;
}
var Controller = class extends PropertyChangeNotifier {
  constructor(element, definition) {
    super(element);
    this.boundObservables = null;
    this.behaviors = null;
    this.needsInitialization = true;
    this._template = null;
    this._styles = null;
    this._isConnected = false;
    this.$fastController = this;
    this.view = null;
    this.element = element;
    this.definition = definition;
    const shadowOptions = definition.shadowOptions;
    if (shadowOptions !== void 0) {
      const shadowRoot = element.attachShadow(shadowOptions);
      if (shadowOptions.mode === "closed") {
        shadowRoots.set(element, shadowRoot);
      }
    }
    const accessors = Observable.getAccessors(element);
    if (accessors.length > 0) {
      const boundObservables = this.boundObservables = /* @__PURE__ */ Object.create(null);
      for (let i = 0, ii = accessors.length; i < ii; ++i) {
        const propertyName = accessors[i].name;
        const value = element[propertyName];
        if (value !== void 0) {
          delete element[propertyName];
          boundObservables[propertyName] = value;
        }
      }
    }
  }
  get isConnected() {
    Observable.track(this, "isConnected");
    return this._isConnected;
  }
  setIsConnected(value) {
    this._isConnected = value;
    Observable.notify(this, "isConnected");
  }
  get template() {
    return this._template;
  }
  set template(value) {
    if (this._template === value) {
      return;
    }
    this._template = value;
    if (!this.needsInitialization) {
      this.renderTemplate(value);
    }
  }
  get styles() {
    return this._styles;
  }
  set styles(value) {
    if (this._styles === value) {
      return;
    }
    if (this._styles !== null) {
      this.removeStyles(this._styles);
    }
    this._styles = value;
    if (!this.needsInitialization && value !== null) {
      this.addStyles(value);
    }
  }
  addStyles(styles) {
    const target = getShadowRoot(this.element) || this.element.getRootNode();
    if (styles instanceof HTMLStyleElement) {
      target.append(styles);
    } else if (!styles.isAttachedTo(target)) {
      const sourceBehaviors = styles.behaviors;
      styles.addStylesTo(target);
      if (sourceBehaviors !== null) {
        this.addBehaviors(sourceBehaviors);
      }
    }
  }
  removeStyles(styles) {
    const target = getShadowRoot(this.element) || this.element.getRootNode();
    if (styles instanceof HTMLStyleElement) {
      target.removeChild(styles);
    } else if (styles.isAttachedTo(target)) {
      const sourceBehaviors = styles.behaviors;
      styles.removeStylesFrom(target);
      if (sourceBehaviors !== null) {
        this.removeBehaviors(sourceBehaviors);
      }
    }
  }
  addBehaviors(behaviors) {
    const targetBehaviors = this.behaviors || (this.behaviors = /* @__PURE__ */ new Map());
    const length = behaviors.length;
    const behaviorsToBind = [];
    for (let i = 0; i < length; ++i) {
      const behavior = behaviors[i];
      if (targetBehaviors.has(behavior)) {
        targetBehaviors.set(behavior, targetBehaviors.get(behavior) + 1);
      } else {
        targetBehaviors.set(behavior, 1);
        behaviorsToBind.push(behavior);
      }
    }
    if (this._isConnected) {
      const element = this.element;
      for (let i = 0; i < behaviorsToBind.length; ++i) {
        behaviorsToBind[i].bind(element, defaultExecutionContext);
      }
    }
  }
  removeBehaviors(behaviors, force = false) {
    const targetBehaviors = this.behaviors;
    if (targetBehaviors === null) {
      return;
    }
    const length = behaviors.length;
    const behaviorsToUnbind = [];
    for (let i = 0; i < length; ++i) {
      const behavior = behaviors[i];
      if (targetBehaviors.has(behavior)) {
        const count = targetBehaviors.get(behavior) - 1;
        count === 0 || force ? targetBehaviors.delete(behavior) && behaviorsToUnbind.push(behavior) : targetBehaviors.set(behavior, count);
      }
    }
    if (this._isConnected) {
      const element = this.element;
      for (let i = 0; i < behaviorsToUnbind.length; ++i) {
        behaviorsToUnbind[i].unbind(element);
      }
    }
  }
  onConnectedCallback() {
    if (this._isConnected) {
      return;
    }
    const element = this.element;
    if (this.needsInitialization) {
      this.finishInitialization();
    } else if (this.view !== null) {
      this.view.bind(element, defaultExecutionContext);
    }
    const behaviors = this.behaviors;
    if (behaviors !== null) {
      for (const [behavior] of behaviors) {
        behavior.bind(element, defaultExecutionContext);
      }
    }
    this.setIsConnected(true);
  }
  onDisconnectedCallback() {
    if (!this._isConnected) {
      return;
    }
    this.setIsConnected(false);
    const view = this.view;
    if (view !== null) {
      view.unbind();
    }
    const behaviors = this.behaviors;
    if (behaviors !== null) {
      const element = this.element;
      for (const [behavior] of behaviors) {
        behavior.unbind(element);
      }
    }
  }
  onAttributeChangedCallback(name, oldValue, newValue) {
    const attrDef = this.definition.attributeLookup[name];
    if (attrDef !== void 0) {
      attrDef.onAttributeChangedCallback(this.element, newValue);
    }
  }
  emit(type, detail, options) {
    if (this._isConnected) {
      return this.element.dispatchEvent(new CustomEvent(type, Object.assign(Object.assign({ detail }, defaultEventOptions), options)));
    }
    return false;
  }
  finishInitialization() {
    const element = this.element;
    const boundObservables = this.boundObservables;
    if (boundObservables !== null) {
      const propertyNames = Object.keys(boundObservables);
      for (let i = 0, ii = propertyNames.length; i < ii; ++i) {
        const propertyName = propertyNames[i];
        element[propertyName] = boundObservables[propertyName];
      }
      this.boundObservables = null;
    }
    const definition = this.definition;
    if (this._template === null) {
      if (this.element.resolveTemplate) {
        this._template = this.element.resolveTemplate();
      } else if (definition.template) {
        this._template = definition.template || null;
      }
    }
    if (this._template !== null) {
      this.renderTemplate(this._template);
    }
    if (this._styles === null) {
      if (this.element.resolveStyles) {
        this._styles = this.element.resolveStyles();
      } else if (definition.styles) {
        this._styles = definition.styles || null;
      }
    }
    if (this._styles !== null) {
      this.addStyles(this._styles);
    }
    this.needsInitialization = false;
  }
  renderTemplate(template) {
    const element = this.element;
    const host = getShadowRoot(element) || element;
    if (this.view !== null) {
      this.view.dispose();
      this.view = null;
    } else if (!this.needsInitialization) {
      DOM.removeChildNodes(host);
    }
    if (template) {
      this.view = template.render(element, host, element);
    }
  }
  static forCustomElement(element) {
    const controller = element.$fastController;
    if (controller !== void 0) {
      return controller;
    }
    const definition = FASTElementDefinition.forType(element.constructor);
    if (definition === void 0) {
      throw new Error("Missing FASTElement definition.");
    }
    return element.$fastController = new Controller(element, definition);
  }
};

// node_modules/@microsoft/fast-element/dist/esm/components/fast-element.js
function createFASTElement(BaseType) {
  return class extends BaseType {
    constructor() {
      super();
      Controller.forCustomElement(this);
    }
    $emit(type, detail, options) {
      return this.$fastController.emit(type, detail, options);
    }
    connectedCallback() {
      this.$fastController.onConnectedCallback();
    }
    disconnectedCallback() {
      this.$fastController.onDisconnectedCallback();
    }
    attributeChangedCallback(name, oldValue, newValue) {
      this.$fastController.onAttributeChangedCallback(name, oldValue, newValue);
    }
  };
}
var FASTElement = Object.assign(createFASTElement(HTMLElement), {
  from(BaseType) {
    return createFASTElement(BaseType);
  },
  define(type, nameOrDef) {
    return new FASTElementDefinition(type, nameOrDef).define().type;
  }
});

// node_modules/@microsoft/fast-element/dist/esm/styles/css-directive.js
var CSSDirective = class {
  createCSS() {
    return "";
  }
  createBehavior() {
    return void 0;
  }
};

// node_modules/@microsoft/fast-element/dist/esm/styles/css.js
function collectStyles(strings, values) {
  const styles = [];
  let cssString = "";
  const behaviors = [];
  for (let i = 0, ii = strings.length - 1; i < ii; ++i) {
    cssString += strings[i];
    let value = values[i];
    if (value instanceof CSSDirective) {
      const behavior = value.createBehavior();
      value = value.createCSS();
      if (behavior) {
        behaviors.push(behavior);
      }
    }
    if (value instanceof ElementStyles || value instanceof CSSStyleSheet) {
      if (cssString.trim() !== "") {
        styles.push(cssString);
        cssString = "";
      }
      styles.push(value);
    } else {
      cssString += value;
    }
  }
  cssString += strings[strings.length - 1];
  if (cssString.trim() !== "") {
    styles.push(cssString);
  }
  return {
    styles,
    behaviors
  };
}
function css(strings, ...values) {
  const { styles, behaviors } = collectStyles(strings, values);
  const elementStyles = ElementStyles.create(styles);
  if (behaviors.length) {
    elementStyles.withBehaviors(...behaviors);
  }
  return elementStyles;
}

// node_modules/@microsoft/fast-element/dist/esm/observation/array-change-records.js
function newSplice(index, removed, addedCount) {
  return {
    index,
    removed,
    addedCount
  };
}
var EDIT_LEAVE = 0;
var EDIT_UPDATE = 1;
var EDIT_ADD = 2;
var EDIT_DELETE = 3;
function calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd) {
  const rowCount = oldEnd - oldStart + 1;
  const columnCount = currentEnd - currentStart + 1;
  const distances = new Array(rowCount);
  let north;
  let west;
  for (let i = 0; i < rowCount; ++i) {
    distances[i] = new Array(columnCount);
    distances[i][0] = i;
  }
  for (let j = 0; j < columnCount; ++j) {
    distances[0][j] = j;
  }
  for (let i = 1; i < rowCount; ++i) {
    for (let j = 1; j < columnCount; ++j) {
      if (current[currentStart + j - 1] === old[oldStart + i - 1]) {
        distances[i][j] = distances[i - 1][j - 1];
      } else {
        north = distances[i - 1][j] + 1;
        west = distances[i][j - 1] + 1;
        distances[i][j] = north < west ? north : west;
      }
    }
  }
  return distances;
}
function spliceOperationsFromEditDistances(distances) {
  let i = distances.length - 1;
  let j = distances[0].length - 1;
  let current = distances[i][j];
  const edits = [];
  while (i > 0 || j > 0) {
    if (i === 0) {
      edits.push(EDIT_ADD);
      j--;
      continue;
    }
    if (j === 0) {
      edits.push(EDIT_DELETE);
      i--;
      continue;
    }
    const northWest = distances[i - 1][j - 1];
    const west = distances[i - 1][j];
    const north = distances[i][j - 1];
    let min;
    if (west < north) {
      min = west < northWest ? west : northWest;
    } else {
      min = north < northWest ? north : northWest;
    }
    if (min === northWest) {
      if (northWest === current) {
        edits.push(EDIT_LEAVE);
      } else {
        edits.push(EDIT_UPDATE);
        current = northWest;
      }
      i--;
      j--;
    } else if (min === west) {
      edits.push(EDIT_DELETE);
      i--;
      current = west;
    } else {
      edits.push(EDIT_ADD);
      j--;
      current = north;
    }
  }
  edits.reverse();
  return edits;
}
function sharedPrefix(current, old, searchLength) {
  for (let i = 0; i < searchLength; ++i) {
    if (current[i] !== old[i]) {
      return i;
    }
  }
  return searchLength;
}
function sharedSuffix(current, old, searchLength) {
  let index1 = current.length;
  let index2 = old.length;
  let count = 0;
  while (count < searchLength && current[--index1] === old[--index2]) {
    count++;
  }
  return count;
}
function intersect(start1, end1, start2, end2) {
  if (end1 < start2 || end2 < start1) {
    return -1;
  }
  if (end1 === start2 || end2 === start1) {
    return 0;
  }
  if (start1 < start2) {
    if (end1 < end2) {
      return end1 - start2;
    }
    return end2 - start2;
  }
  if (end2 < end1) {
    return end2 - start1;
  }
  return end1 - start1;
}
function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
  let prefixCount = 0;
  let suffixCount = 0;
  const minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
  if (currentStart === 0 && oldStart === 0) {
    prefixCount = sharedPrefix(current, old, minLength);
  }
  if (currentEnd === current.length && oldEnd === old.length) {
    suffixCount = sharedSuffix(current, old, minLength - prefixCount);
  }
  currentStart += prefixCount;
  oldStart += prefixCount;
  currentEnd -= suffixCount;
  oldEnd -= suffixCount;
  if (currentEnd - currentStart === 0 && oldEnd - oldStart === 0) {
    return emptyArray;
  }
  if (currentStart === currentEnd) {
    const splice2 = newSplice(currentStart, [], 0);
    while (oldStart < oldEnd) {
      splice2.removed.push(old[oldStart++]);
    }
    return [splice2];
  } else if (oldStart === oldEnd) {
    return [newSplice(currentStart, [], currentEnd - currentStart)];
  }
  const ops = spliceOperationsFromEditDistances(calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));
  const splices = [];
  let splice = void 0;
  let index = currentStart;
  let oldIndex = oldStart;
  for (let i = 0; i < ops.length; ++i) {
    switch (ops[i]) {
      case EDIT_LEAVE:
        if (splice !== void 0) {
          splices.push(splice);
          splice = void 0;
        }
        index++;
        oldIndex++;
        break;
      case EDIT_UPDATE:
        if (splice === void 0) {
          splice = newSplice(index, [], 0);
        }
        splice.addedCount++;
        index++;
        splice.removed.push(old[oldIndex]);
        oldIndex++;
        break;
      case EDIT_ADD:
        if (splice === void 0) {
          splice = newSplice(index, [], 0);
        }
        splice.addedCount++;
        index++;
        break;
      case EDIT_DELETE:
        if (splice === void 0) {
          splice = newSplice(index, [], 0);
        }
        splice.removed.push(old[oldIndex]);
        oldIndex++;
        break;
    }
  }
  if (splice !== void 0) {
    splices.push(splice);
  }
  return splices;
}
var $push = Array.prototype.push;
function mergeSplice(splices, index, removed, addedCount) {
  const splice = newSplice(index, removed, addedCount);
  let inserted = false;
  let insertionOffset = 0;
  for (let i = 0; i < splices.length; i++) {
    const current = splices[i];
    current.index += insertionOffset;
    if (inserted) {
      continue;
    }
    const intersectCount = intersect(splice.index, splice.index + splice.removed.length, current.index, current.index + current.addedCount);
    if (intersectCount >= 0) {
      splices.splice(i, 1);
      i--;
      insertionOffset -= current.addedCount - current.removed.length;
      splice.addedCount += current.addedCount - intersectCount;
      const deleteCount = splice.removed.length + current.removed.length - intersectCount;
      if (!splice.addedCount && !deleteCount) {
        inserted = true;
      } else {
        let currentRemoved = current.removed;
        if (splice.index < current.index) {
          const prepend = splice.removed.slice(0, current.index - splice.index);
          $push.apply(prepend, currentRemoved);
          currentRemoved = prepend;
        }
        if (splice.index + splice.removed.length > current.index + current.addedCount) {
          const append = splice.removed.slice(current.index + current.addedCount - splice.index);
          $push.apply(currentRemoved, append);
        }
        splice.removed = currentRemoved;
        if (current.index < splice.index) {
          splice.index = current.index;
        }
      }
    } else if (splice.index < current.index) {
      inserted = true;
      splices.splice(i, 0, splice);
      i++;
      const offset = splice.addedCount - splice.removed.length;
      current.index += offset;
      insertionOffset += offset;
    }
  }
  if (!inserted) {
    splices.push(splice);
  }
}
function createInitialSplices(changeRecords) {
  const splices = [];
  for (let i = 0, ii = changeRecords.length; i < ii; i++) {
    const record = changeRecords[i];
    mergeSplice(splices, record.index, record.removed, record.addedCount);
  }
  return splices;
}
function projectArraySplices(array, changeRecords) {
  let splices = [];
  const initialSplices = createInitialSplices(changeRecords);
  for (let i = 0, ii = initialSplices.length; i < ii; ++i) {
    const splice = initialSplices[i];
    if (splice.addedCount === 1 && splice.removed.length === 1) {
      if (splice.removed[0] !== array[splice.index]) {
        splices.push(splice);
      }
      continue;
    }
    splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount, splice.removed, 0, splice.removed.length));
  }
  return splices;
}

// node_modules/@microsoft/fast-element/dist/esm/observation/array-observer.js
var arrayObservationEnabled = false;
function adjustIndex(changeRecord, array) {
  let index = changeRecord.index;
  const arrayLength = array.length;
  if (index > arrayLength) {
    index = arrayLength - changeRecord.addedCount;
  } else if (index < 0) {
    index = arrayLength + changeRecord.removed.length + index - changeRecord.addedCount;
  }
  if (index < 0) {
    index = 0;
  }
  changeRecord.index = index;
  return changeRecord;
}
var ArrayObserver = class extends SubscriberSet {
  constructor(source) {
    super(source);
    this.oldCollection = void 0;
    this.splices = void 0;
    this.needsQueue = true;
    this.call = this.flush;
    Reflect.defineProperty(source, "$fastController", {
      value: this,
      enumerable: false
    });
  }
  subscribe(subscriber) {
    this.flush();
    super.subscribe(subscriber);
  }
  addSplice(splice) {
    if (this.splices === void 0) {
      this.splices = [splice];
    } else {
      this.splices.push(splice);
    }
    if (this.needsQueue) {
      this.needsQueue = false;
      DOM.queueUpdate(this);
    }
  }
  reset(oldCollection) {
    this.oldCollection = oldCollection;
    if (this.needsQueue) {
      this.needsQueue = false;
      DOM.queueUpdate(this);
    }
  }
  flush() {
    const splices = this.splices;
    const oldCollection = this.oldCollection;
    if (splices === void 0 && oldCollection === void 0) {
      return;
    }
    this.needsQueue = true;
    this.splices = void 0;
    this.oldCollection = void 0;
    const finalSplices = oldCollection === void 0 ? projectArraySplices(this.source, splices) : calcSplices(this.source, 0, this.source.length, oldCollection, 0, oldCollection.length);
    this.notify(finalSplices);
  }
};
function enableArrayObservation() {
  if (arrayObservationEnabled) {
    return;
  }
  arrayObservationEnabled = true;
  Observable.setArrayObserverFactory((collection) => {
    return new ArrayObserver(collection);
  });
  const proto = Array.prototype;
  if (proto.$fastPatch) {
    return;
  }
  Reflect.defineProperty(proto, "$fastPatch", {
    value: 1,
    enumerable: false
  });
  const pop = proto.pop;
  const push = proto.push;
  const reverse = proto.reverse;
  const shift = proto.shift;
  const sort = proto.sort;
  const splice = proto.splice;
  const unshift = proto.unshift;
  proto.pop = function() {
    const notEmpty = this.length > 0;
    const methodCallResult = pop.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0 && notEmpty) {
      o.addSplice(newSplice(this.length, [methodCallResult], 0));
    }
    return methodCallResult;
  };
  proto.push = function() {
    const methodCallResult = push.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0) {
      o.addSplice(adjustIndex(newSplice(this.length - arguments.length, [], arguments.length), this));
    }
    return methodCallResult;
  };
  proto.reverse = function() {
    let oldArray;
    const o = this.$fastController;
    if (o !== void 0) {
      o.flush();
      oldArray = this.slice();
    }
    const methodCallResult = reverse.apply(this, arguments);
    if (o !== void 0) {
      o.reset(oldArray);
    }
    return methodCallResult;
  };
  proto.shift = function() {
    const notEmpty = this.length > 0;
    const methodCallResult = shift.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0 && notEmpty) {
      o.addSplice(newSplice(0, [methodCallResult], 0));
    }
    return methodCallResult;
  };
  proto.sort = function() {
    let oldArray;
    const o = this.$fastController;
    if (o !== void 0) {
      o.flush();
      oldArray = this.slice();
    }
    const methodCallResult = sort.apply(this, arguments);
    if (o !== void 0) {
      o.reset(oldArray);
    }
    return methodCallResult;
  };
  proto.splice = function() {
    const methodCallResult = splice.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0) {
      o.addSplice(adjustIndex(newSplice(+arguments[0], methodCallResult, arguments.length > 2 ? arguments.length - 2 : 0), this));
    }
    return methodCallResult;
  };
  proto.unshift = function() {
    const methodCallResult = unshift.apply(this, arguments);
    const o = this.$fastController;
    if (o !== void 0) {
      o.addSplice(adjustIndex(newSplice(0, [], arguments.length), this));
    }
    return methodCallResult;
  };
}

// node_modules/@microsoft/fast-element/dist/esm/templating/repeat.js
var defaultRepeatOptions = Object.freeze({
  positioning: false,
  recycle: true
});
function bindWithoutPositioning(view, items, index, context) {
  view.bind(items[index], context);
}
function bindWithPositioning(view, items, index, context) {
  const childContext = Object.create(context);
  childContext.index = index;
  childContext.length = items.length;
  view.bind(items[index], childContext);
}
var RepeatBehavior = class {
  constructor(location, itemsBinding, isItemsBindingVolatile, templateBinding, isTemplateBindingVolatile, options) {
    this.location = location;
    this.itemsBinding = itemsBinding;
    this.templateBinding = templateBinding;
    this.options = options;
    this.source = null;
    this.views = [];
    this.items = null;
    this.itemsObserver = null;
    this.originalContext = void 0;
    this.childContext = void 0;
    this.bindView = bindWithoutPositioning;
    this.itemsBindingObserver = Observable.binding(itemsBinding, this, isItemsBindingVolatile);
    this.templateBindingObserver = Observable.binding(templateBinding, this, isTemplateBindingVolatile);
    if (options.positioning) {
      this.bindView = bindWithPositioning;
    }
  }
  bind(source, context) {
    this.source = source;
    this.originalContext = context;
    this.childContext = Object.create(context);
    this.childContext.parent = source;
    this.childContext.parentContext = this.originalContext;
    this.items = this.itemsBindingObserver.observe(source, this.originalContext);
    this.template = this.templateBindingObserver.observe(source, this.originalContext);
    this.observeItems(true);
    this.refreshAllViews();
  }
  unbind() {
    this.source = null;
    this.items = null;
    if (this.itemsObserver !== null) {
      this.itemsObserver.unsubscribe(this);
    }
    this.unbindAllViews();
    this.itemsBindingObserver.disconnect();
    this.templateBindingObserver.disconnect();
  }
  handleChange(source, args) {
    if (source === this.itemsBinding) {
      this.items = this.itemsBindingObserver.observe(this.source, this.originalContext);
      this.observeItems();
      this.refreshAllViews();
    } else if (source === this.templateBinding) {
      this.template = this.templateBindingObserver.observe(this.source, this.originalContext);
      this.refreshAllViews(true);
    } else {
      this.updateViews(args);
    }
  }
  observeItems(force = false) {
    if (!this.items) {
      this.items = emptyArray;
      return;
    }
    const oldObserver = this.itemsObserver;
    const newObserver = this.itemsObserver = Observable.getNotifier(this.items);
    const hasNewObserver = oldObserver !== newObserver;
    if (hasNewObserver && oldObserver !== null) {
      oldObserver.unsubscribe(this);
    }
    if (hasNewObserver || force) {
      newObserver.subscribe(this);
    }
  }
  updateViews(splices) {
    const childContext = this.childContext;
    const views = this.views;
    const bindView = this.bindView;
    const items = this.items;
    const template = this.template;
    const recycle = this.options.recycle;
    const leftoverViews = [];
    let leftoverIndex = 0;
    let availableViews = 0;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      const splice = splices[i];
      const removed = splice.removed;
      let removeIndex = 0;
      let addIndex = splice.index;
      const end = addIndex + splice.addedCount;
      const removedViews = views.splice(splice.index, removed.length);
      const totalAvailableViews = availableViews = leftoverViews.length + removedViews.length;
      for (; addIndex < end; ++addIndex) {
        const neighbor = views[addIndex];
        const location = neighbor ? neighbor.firstChild : this.location;
        let view;
        if (recycle && availableViews > 0) {
          if (removeIndex <= totalAvailableViews && removedViews.length > 0) {
            view = removedViews[removeIndex];
            removeIndex++;
          } else {
            view = leftoverViews[leftoverIndex];
            leftoverIndex++;
          }
          availableViews--;
        } else {
          view = template.create();
        }
        views.splice(addIndex, 0, view);
        bindView(view, items, addIndex, childContext);
        view.insertBefore(location);
      }
      if (removedViews[removeIndex]) {
        leftoverViews.push(...removedViews.slice(removeIndex));
      }
    }
    for (let i = leftoverIndex, ii = leftoverViews.length; i < ii; ++i) {
      leftoverViews[i].dispose();
    }
    if (this.options.positioning) {
      for (let i = 0, ii = views.length; i < ii; ++i) {
        const currentContext = views[i].context;
        currentContext.length = ii;
        currentContext.index = i;
      }
    }
  }
  refreshAllViews(templateChanged = false) {
    const items = this.items;
    const childContext = this.childContext;
    const template = this.template;
    const location = this.location;
    const bindView = this.bindView;
    let itemsLength = items.length;
    let views = this.views;
    let viewsLength = views.length;
    if (itemsLength === 0 || templateChanged || !this.options.recycle) {
      HTMLView.disposeContiguousBatch(views);
      viewsLength = 0;
    }
    if (viewsLength === 0) {
      this.views = views = new Array(itemsLength);
      for (let i = 0; i < itemsLength; ++i) {
        const view = template.create();
        bindView(view, items, i, childContext);
        views[i] = view;
        view.insertBefore(location);
      }
    } else {
      let i = 0;
      for (; i < itemsLength; ++i) {
        if (i < viewsLength) {
          const view = views[i];
          bindView(view, items, i, childContext);
        } else {
          const view = template.create();
          bindView(view, items, i, childContext);
          views.push(view);
          view.insertBefore(location);
        }
      }
      const removed = views.splice(i, viewsLength - i);
      for (i = 0, itemsLength = removed.length; i < itemsLength; ++i) {
        removed[i].dispose();
      }
    }
  }
  unbindAllViews() {
    const views = this.views;
    for (let i = 0, ii = views.length; i < ii; ++i) {
      views[i].unbind();
    }
  }
};
var RepeatDirective = class extends HTMLDirective {
  constructor(itemsBinding, templateBinding, options) {
    super();
    this.itemsBinding = itemsBinding;
    this.templateBinding = templateBinding;
    this.options = options;
    this.createPlaceholder = DOM.createBlockPlaceholder;
    enableArrayObservation();
    this.isItemsBindingVolatile = Observable.isVolatileBinding(itemsBinding);
    this.isTemplateBindingVolatile = Observable.isVolatileBinding(templateBinding);
  }
  createBehavior(target) {
    return new RepeatBehavior(target, this.itemsBinding, this.isItemsBindingVolatile, this.templateBinding, this.isTemplateBindingVolatile, this.options);
  }
};

// node_modules/@microsoft/fast-element/dist/esm/templating/node-observation.js
function elements(selector) {
  if (selector) {
    return function(value, index, array) {
      return value.nodeType === 1 && value.matches(selector);
    };
  }
  return function(value, index, array) {
    return value.nodeType === 1;
  };
}
var NodeObservationBehavior = class {
  constructor(target, options) {
    this.target = target;
    this.options = options;
    this.source = null;
  }
  bind(source) {
    const name = this.options.property;
    this.shouldUpdate = Observable.getAccessors(source).some((x) => x.name === name);
    this.source = source;
    this.updateTarget(this.computeNodes());
    if (this.shouldUpdate) {
      this.observe();
    }
  }
  unbind() {
    this.updateTarget(emptyArray);
    this.source = null;
    if (this.shouldUpdate) {
      this.disconnect();
    }
  }
  handleEvent() {
    this.updateTarget(this.computeNodes());
  }
  computeNodes() {
    let nodes = this.getNodes();
    if (this.options.filter !== void 0) {
      nodes = nodes.filter(this.options.filter);
    }
    return nodes;
  }
  updateTarget(value) {
    this.source[this.options.property] = value;
  }
};

// node_modules/@microsoft/fast-element/dist/esm/templating/slotted.js
var SlottedBehavior = class extends NodeObservationBehavior {
  constructor(target, options) {
    super(target, options);
  }
  observe() {
    this.target.addEventListener("slotchange", this);
  }
  disconnect() {
    this.target.removeEventListener("slotchange", this);
  }
  getNodes() {
    return this.target.assignedNodes(this.options);
  }
};
function slotted(propertyOrOptions) {
  if (typeof propertyOrOptions === "string") {
    propertyOrOptions = { property: propertyOrOptions };
  }
  return new AttachedBehaviorHTMLDirective("fast-slotted", SlottedBehavior, propertyOrOptions);
}

// node_modules/@microsoft/fast-element/dist/esm/templating/children.js
var ChildrenBehavior = class extends NodeObservationBehavior {
  constructor(target, options) {
    super(target, options);
    this.observer = null;
    options.childList = true;
  }
  observe() {
    if (this.observer === null) {
      this.observer = new MutationObserver(this.handleEvent.bind(this));
    }
    this.observer.observe(this.target, this.options);
  }
  disconnect() {
    this.observer.disconnect();
  }
  getNodes() {
    if ("subtree" in this.options) {
      return Array.from(this.target.querySelectorAll(this.options.selector));
    }
    return Array.from(this.target.childNodes);
  }
};
function children(propertyOrOptions) {
  if (typeof propertyOrOptions === "string") {
    propertyOrOptions = {
      property: propertyOrOptions
    };
  }
  return new AttachedBehaviorHTMLDirective("fast-children", ChildrenBehavior, propertyOrOptions);
}

// node_modules/tslib/tslib.es6.js
function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

// node_modules/@microsoft/fast-foundation/dist/esm/di/di.js
var metadataByTarget = /* @__PURE__ */ new Map();
if (!("metadata" in Reflect)) {
  Reflect.metadata = function(key, value) {
    return function(target) {
      Reflect.defineMetadata(key, value, target);
    };
  };
  Reflect.defineMetadata = function(key, value, target) {
    let metadata = metadataByTarget.get(target);
    if (metadata === void 0) {
      metadataByTarget.set(target, metadata = /* @__PURE__ */ new Map());
    }
    metadata.set(key, value);
  };
  Reflect.getOwnMetadata = function(key, target) {
    const metadata = metadataByTarget.get(target);
    if (metadata !== void 0) {
      return metadata.get(key);
    }
    return void 0;
  };
}
var ResolverBuilder = class {
  constructor(container, key) {
    this.container = container;
    this.key = key;
  }
  instance(value) {
    return this.registerResolver(0, value);
  }
  singleton(value) {
    return this.registerResolver(1, value);
  }
  transient(value) {
    return this.registerResolver(2, value);
  }
  callback(value) {
    return this.registerResolver(3, value);
  }
  cachedCallback(value) {
    return this.registerResolver(3, cacheCallbackResult(value));
  }
  aliasTo(destinationKey) {
    return this.registerResolver(5, destinationKey);
  }
  registerResolver(strategy, state) {
    const { container, key } = this;
    this.container = this.key = void 0;
    return container.registerResolver(key, new ResolverImpl(key, strategy, state));
  }
};
function cloneArrayWithPossibleProps(source) {
  const clone = source.slice();
  const keys = Object.keys(source);
  const len = keys.length;
  let key;
  for (let i = 0; i < len; ++i) {
    key = keys[i];
    if (!isArrayIndex(key)) {
      clone[key] = source[key];
    }
  }
  return clone;
}
var DefaultResolver = Object.freeze({
  none(key) {
    throw Error(`${key.toString()} not registered, did you forget to add @singleton()?`);
  },
  singleton(key) {
    return new ResolverImpl(key, 1, key);
  },
  transient(key) {
    return new ResolverImpl(key, 2, key);
  }
});
var ContainerConfiguration = Object.freeze({
  default: Object.freeze({
    parentLocator: () => null,
    responsibleForOwnerRequests: false,
    defaultResolver: DefaultResolver.singleton
  })
});
var dependencyLookup = /* @__PURE__ */ new Map();
function getParamTypes(key) {
  return (Type) => {
    return Reflect.getOwnMetadata(key, Type);
  };
}
var rootDOMContainer = null;
var DI = Object.freeze({
  createContainer(config) {
    return new ContainerImpl(null, Object.assign({}, ContainerConfiguration.default, config));
  },
  findResponsibleContainer(node) {
    const owned = node.$$container$$;
    if (owned && owned.responsibleForOwnerRequests) {
      return owned;
    }
    return DI.findParentContainer(node);
  },
  findParentContainer(node) {
    const event = new CustomEvent(DILocateParentEventType, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { container: void 0 }
    });
    node.dispatchEvent(event);
    return event.detail.container || DI.getOrCreateDOMContainer();
  },
  getOrCreateDOMContainer(node, config) {
    if (!node) {
      return rootDOMContainer || (rootDOMContainer = new ContainerImpl(null, Object.assign({}, ContainerConfiguration.default, config, {
        parentLocator: () => null
      })));
    }
    return node.$$container$$ || new ContainerImpl(node, Object.assign({}, ContainerConfiguration.default, config, {
      parentLocator: DI.findParentContainer
    }));
  },
  getDesignParamtypes: getParamTypes("design:paramtypes"),
  getAnnotationParamtypes: getParamTypes("di:paramtypes"),
  getOrCreateAnnotationParamTypes(Type) {
    let annotationParamtypes = this.getAnnotationParamtypes(Type);
    if (annotationParamtypes === void 0) {
      Reflect.defineMetadata("di:paramtypes", annotationParamtypes = [], Type);
    }
    return annotationParamtypes;
  },
  getDependencies(Type) {
    let dependencies = dependencyLookup.get(Type);
    if (dependencies === void 0) {
      const inject2 = Type.inject;
      if (inject2 === void 0) {
        const designParamtypes = DI.getDesignParamtypes(Type);
        const annotationParamtypes = DI.getAnnotationParamtypes(Type);
        if (designParamtypes === void 0) {
          if (annotationParamtypes === void 0) {
            const Proto = Object.getPrototypeOf(Type);
            if (typeof Proto === "function" && Proto !== Function.prototype) {
              dependencies = cloneArrayWithPossibleProps(DI.getDependencies(Proto));
            } else {
              dependencies = [];
            }
          } else {
            dependencies = cloneArrayWithPossibleProps(annotationParamtypes);
          }
        } else if (annotationParamtypes === void 0) {
          dependencies = cloneArrayWithPossibleProps(designParamtypes);
        } else {
          dependencies = cloneArrayWithPossibleProps(designParamtypes);
          let len = annotationParamtypes.length;
          let auAnnotationParamtype;
          for (let i = 0; i < len; ++i) {
            auAnnotationParamtype = annotationParamtypes[i];
            if (auAnnotationParamtype !== void 0) {
              dependencies[i] = auAnnotationParamtype;
            }
          }
          const keys = Object.keys(annotationParamtypes);
          len = keys.length;
          let key;
          for (let i = 0; i < len; ++i) {
            key = keys[i];
            if (!isArrayIndex(key)) {
              dependencies[key] = annotationParamtypes[key];
            }
          }
        }
      } else {
        dependencies = cloneArrayWithPossibleProps(inject2);
      }
      dependencyLookup.set(Type, dependencies);
    }
    return dependencies;
  },
  defineProperty(target, propertyName, key, respectConnection = false) {
    const diPropertyKey = `$di_${propertyName}`;
    Reflect.defineProperty(target, propertyName, {
      get: function() {
        let value = this[diPropertyKey];
        if (value === void 0) {
          const container = this instanceof HTMLElement ? DI.findResponsibleContainer(this) : DI.getOrCreateDOMContainer();
          value = container.get(key);
          this[diPropertyKey] = value;
          if (respectConnection && this instanceof FASTElement) {
            const notifier = this.$fastController;
            const handleChange = () => {
              const newContainer = DI.findResponsibleContainer(this);
              const newValue = newContainer.get(key);
              const oldValue = this[diPropertyKey];
              if (newValue !== oldValue) {
                this[diPropertyKey] = value;
                notifier.notify(propertyName);
              }
            };
            notifier.subscribe({ handleChange }, "isConnected");
          }
        }
        return value;
      }
    });
  },
  createInterface(nameConfigOrCallback, configuror) {
    const configure = typeof nameConfigOrCallback === "function" ? nameConfigOrCallback : configuror;
    const friendlyName = typeof nameConfigOrCallback === "string" ? nameConfigOrCallback : nameConfigOrCallback && "friendlyName" in nameConfigOrCallback ? nameConfigOrCallback.friendlyName || defaultFriendlyName : defaultFriendlyName;
    const respectConnection = typeof nameConfigOrCallback === "string" ? false : nameConfigOrCallback && "respectConnection" in nameConfigOrCallback ? nameConfigOrCallback.respectConnection || false : false;
    const Interface = function(target, property, index) {
      if (target == null || new.target !== void 0) {
        throw new Error(`No registration for interface: '${Interface.friendlyName}'`);
      }
      if (property) {
        DI.defineProperty(target, property, Interface, respectConnection);
      } else {
        const annotationParamtypes = DI.getOrCreateAnnotationParamTypes(target);
        annotationParamtypes[index] = Interface;
      }
    };
    Interface.$isInterface = true;
    Interface.friendlyName = friendlyName == null ? "(anonymous)" : friendlyName;
    if (configure != null) {
      Interface.register = function(container, key) {
        return configure(new ResolverBuilder(container, key !== null && key !== void 0 ? key : Interface));
      };
    }
    Interface.toString = function toString() {
      return `InterfaceSymbol<${Interface.friendlyName}>`;
    };
    return Interface;
  },
  inject(...dependencies) {
    return function(target, key, descriptor) {
      if (typeof descriptor === "number") {
        const annotationParamtypes = DI.getOrCreateAnnotationParamTypes(target);
        const dep = dependencies[0];
        if (dep !== void 0) {
          annotationParamtypes[descriptor] = dep;
        }
      } else if (key) {
        DI.defineProperty(target, key, dependencies[0]);
      } else {
        const annotationParamtypes = descriptor ? DI.getOrCreateAnnotationParamTypes(descriptor.value) : DI.getOrCreateAnnotationParamTypes(target);
        let dep;
        for (let i = 0; i < dependencies.length; ++i) {
          dep = dependencies[i];
          if (dep !== void 0) {
            annotationParamtypes[i] = dep;
          }
        }
      }
    };
  },
  transient(target) {
    target.register = function register(container) {
      const registration = Registration.transient(target, target);
      return registration.register(container);
    };
    target.registerInRequestor = false;
    return target;
  },
  singleton(target, options = defaultSingletonOptions) {
    target.register = function register(container) {
      const registration = Registration.singleton(target, target);
      return registration.register(container);
    };
    target.registerInRequestor = options.scoped;
    return target;
  }
});
var Container = DI.createInterface("Container");
function createResolver(getter) {
  return function(key) {
    const resolver = function(target, property, descriptor) {
      DI.inject(resolver)(target, property, descriptor);
    };
    resolver.$isResolver = true;
    resolver.resolve = function(handler, requestor) {
      return getter(key, handler, requestor);
    };
    return resolver;
  };
}
var inject = DI.inject;
var defaultSingletonOptions = { scoped: false };
function createAllResolver(getter) {
  return function(key, searchAncestors) {
    searchAncestors = !!searchAncestors;
    const resolver = function(target, property, descriptor) {
      DI.inject(resolver)(target, property, descriptor);
    };
    resolver.$isResolver = true;
    resolver.resolve = function(handler, requestor) {
      return getter(key, handler, requestor, searchAncestors);
    };
    return resolver;
  };
}
var all = createAllResolver((key, handler, requestor, searchAncestors) => requestor.getAll(key, searchAncestors));
var lazy = createResolver((key, handler, requestor) => {
  return () => requestor.get(key);
});
var optional = createResolver((key, handler, requestor) => {
  if (requestor.has(key, true)) {
    return requestor.get(key);
  } else {
    return void 0;
  }
});
function ignore(target, property, descriptor) {
  DI.inject(ignore)(target, property, descriptor);
}
ignore.$isResolver = true;
ignore.resolve = () => void 0;
var newInstanceForScope = createResolver((key, handler, requestor) => {
  const instance = createNewInstance(key, handler);
  const resolver = new ResolverImpl(key, 0, instance);
  requestor.registerResolver(key, resolver);
  return instance;
});
var newInstanceOf = createResolver((key, handler, _requestor) => createNewInstance(key, handler));
function createNewInstance(key, handler) {
  return handler.getFactory(key).construct(handler);
}
var ResolverImpl = class {
  constructor(key, strategy, state) {
    this.key = key;
    this.strategy = strategy;
    this.state = state;
    this.resolving = false;
  }
  get $isResolver() {
    return true;
  }
  register(container) {
    return container.registerResolver(this.key, this);
  }
  resolve(handler, requestor) {
    switch (this.strategy) {
      case 0:
        return this.state;
      case 1: {
        if (this.resolving) {
          throw new Error(`Cyclic dependency found: ${this.state.name}`);
        }
        this.resolving = true;
        this.state = handler.getFactory(this.state).construct(requestor);
        this.strategy = 0;
        this.resolving = false;
        return this.state;
      }
      case 2: {
        const factory = handler.getFactory(this.state);
        if (factory === null) {
          throw new Error(`Resolver for ${String(this.key)} returned a null factory`);
        }
        return factory.construct(requestor);
      }
      case 3:
        return this.state(handler, requestor, this);
      case 4:
        return this.state[0].resolve(handler, requestor);
      case 5:
        return requestor.get(this.state);
      default:
        throw new Error(`Invalid resolver strategy specified: ${this.strategy}.`);
    }
  }
  getFactory(container) {
    var _a, _b, _c;
    switch (this.strategy) {
      case 1:
      case 2:
        return container.getFactory(this.state);
      case 5:
        return (_c = (_b = (_a = container.getResolver(this.state)) === null || _a === void 0 ? void 0 : _a.getFactory) === null || _b === void 0 ? void 0 : _b.call(_a, container)) !== null && _c !== void 0 ? _c : null;
      default:
        return null;
    }
  }
};
function containerGetKey(d) {
  return this.get(d);
}
function transformInstance(inst, transform) {
  return transform(inst);
}
var FactoryImpl = class {
  constructor(Type, dependencies) {
    this.Type = Type;
    this.dependencies = dependencies;
    this.transformers = null;
  }
  construct(container, dynamicDependencies) {
    let instance;
    if (dynamicDependencies === void 0) {
      instance = new this.Type(...this.dependencies.map(containerGetKey, container));
    } else {
      instance = new this.Type(...this.dependencies.map(containerGetKey, container), ...dynamicDependencies);
    }
    if (this.transformers == null) {
      return instance;
    }
    return this.transformers.reduce(transformInstance, instance);
  }
  registerTransformer(transformer) {
    (this.transformers || (this.transformers = [])).push(transformer);
  }
};
var containerResolver = {
  $isResolver: true,
  resolve(handler, requestor) {
    return requestor;
  }
};
function isRegistry(obj) {
  return typeof obj.register === "function";
}
function isSelfRegistry(obj) {
  return isRegistry(obj) && typeof obj.registerInRequestor === "boolean";
}
function isRegisterInRequester(obj) {
  return isSelfRegistry(obj) && obj.registerInRequestor;
}
function isClass(obj) {
  return obj.prototype !== void 0;
}
var InstrinsicTypeNames = /* @__PURE__ */ new Set([
  "Array",
  "ArrayBuffer",
  "Boolean",
  "DataView",
  "Date",
  "Error",
  "EvalError",
  "Float32Array",
  "Float64Array",
  "Function",
  "Int8Array",
  "Int16Array",
  "Int32Array",
  "Map",
  "Number",
  "Object",
  "Promise",
  "RangeError",
  "ReferenceError",
  "RegExp",
  "Set",
  "SharedArrayBuffer",
  "String",
  "SyntaxError",
  "TypeError",
  "Uint8Array",
  "Uint8ClampedArray",
  "Uint16Array",
  "Uint32Array",
  "URIError",
  "WeakMap",
  "WeakSet"
]);
var DILocateParentEventType = "__DI_LOCATE_PARENT__";
var factories = /* @__PURE__ */ new Map();
var ContainerImpl = class {
  constructor(owner, config) {
    this.owner = owner;
    this.config = config;
    this._parent = void 0;
    this.registerDepth = 0;
    this.context = null;
    if (owner !== null) {
      owner.$$container$$ = this;
    }
    this.resolvers = /* @__PURE__ */ new Map();
    this.resolvers.set(Container, containerResolver);
    if (owner instanceof Node) {
      owner.addEventListener(DILocateParentEventType, (e) => {
        if (e.composedPath()[0] !== this.owner) {
          e.detail.container = this;
          e.stopImmediatePropagation();
        }
      });
    }
  }
  get parent() {
    if (this._parent === void 0) {
      this._parent = this.config.parentLocator(this.owner);
    }
    return this._parent;
  }
  get depth() {
    return this.parent === null ? 0 : this.parent.depth + 1;
  }
  get responsibleForOwnerRequests() {
    return this.config.responsibleForOwnerRequests;
  }
  registerWithContext(context, ...params) {
    this.context = context;
    this.register(...params);
    this.context = null;
    return this;
  }
  register(...params) {
    if (++this.registerDepth === 100) {
      throw new Error("Unable to autoregister dependency");
    }
    let current;
    let keys;
    let value;
    let j;
    let jj;
    const context = this.context;
    for (let i = 0, ii = params.length; i < ii; ++i) {
      current = params[i];
      if (!isObject(current)) {
        continue;
      }
      if (isRegistry(current)) {
        current.register(this, context);
      } else if (isClass(current)) {
        Registration.singleton(current, current).register(this);
      } else {
        keys = Object.keys(current);
        j = 0;
        jj = keys.length;
        for (; j < jj; ++j) {
          value = current[keys[j]];
          if (!isObject(value)) {
            continue;
          }
          if (isRegistry(value)) {
            value.register(this, context);
          } else {
            this.register(value);
          }
        }
      }
    }
    --this.registerDepth;
    return this;
  }
  registerResolver(key, resolver) {
    validateKey(key);
    const resolvers = this.resolvers;
    const result = resolvers.get(key);
    if (result == null) {
      resolvers.set(key, resolver);
    } else if (result instanceof ResolverImpl && result.strategy === 4) {
      result.state.push(resolver);
    } else {
      resolvers.set(key, new ResolverImpl(key, 4, [result, resolver]));
    }
    return resolver;
  }
  registerTransformer(key, transformer) {
    const resolver = this.getResolver(key);
    if (resolver == null) {
      return false;
    }
    if (resolver.getFactory) {
      const factory = resolver.getFactory(this);
      if (factory == null) {
        return false;
      }
      factory.registerTransformer(transformer);
      return true;
    }
    return false;
  }
  getResolver(key, autoRegister = true) {
    validateKey(key);
    if (key.resolve !== void 0) {
      return key;
    }
    let current = this;
    let resolver;
    while (current != null) {
      resolver = current.resolvers.get(key);
      if (resolver == null) {
        if (current.parent == null) {
          const handler = isRegisterInRequester(key) ? this : current;
          return autoRegister ? this.jitRegister(key, handler) : null;
        }
        current = current.parent;
      } else {
        return resolver;
      }
    }
    return null;
  }
  has(key, searchAncestors = false) {
    return this.resolvers.has(key) ? true : searchAncestors && this.parent != null ? this.parent.has(key, true) : false;
  }
  get(key) {
    validateKey(key);
    if (key.$isResolver) {
      return key.resolve(this, this);
    }
    let current = this;
    let resolver;
    while (current != null) {
      resolver = current.resolvers.get(key);
      if (resolver == null) {
        if (current.parent == null) {
          const handler = isRegisterInRequester(key) ? this : current;
          resolver = this.jitRegister(key, handler);
          return resolver.resolve(current, this);
        }
        current = current.parent;
      } else {
        return resolver.resolve(current, this);
      }
    }
    throw new Error(`Unable to resolve key: ${key}`);
  }
  getAll(key, searchAncestors = false) {
    validateKey(key);
    const requestor = this;
    let current = requestor;
    let resolver;
    if (searchAncestors) {
      let resolutions = emptyArray;
      while (current != null) {
        resolver = current.resolvers.get(key);
        if (resolver != null) {
          resolutions = resolutions.concat(
            buildAllResponse(resolver, current, requestor)
          );
        }
        current = current.parent;
      }
      return resolutions;
    } else {
      while (current != null) {
        resolver = current.resolvers.get(key);
        if (resolver == null) {
          current = current.parent;
          if (current == null) {
            return emptyArray;
          }
        } else {
          return buildAllResponse(resolver, current, requestor);
        }
      }
    }
    return emptyArray;
  }
  getFactory(Type) {
    let factory = factories.get(Type);
    if (factory === void 0) {
      if (isNativeFunction(Type)) {
        throw new Error(`${Type.name} is a native function and therefore cannot be safely constructed by DI. If this is intentional, please use a callback or cachedCallback resolver.`);
      }
      factories.set(Type, factory = new FactoryImpl(Type, DI.getDependencies(Type)));
    }
    return factory;
  }
  registerFactory(key, factory) {
    factories.set(key, factory);
  }
  createChild(config) {
    return new ContainerImpl(null, Object.assign({}, this.config, config, { parentLocator: () => this }));
  }
  jitRegister(keyAsValue, handler) {
    if (typeof keyAsValue !== "function") {
      throw new Error(`Attempted to jitRegister something that is not a constructor: '${keyAsValue}'. Did you forget to register this dependency?`);
    }
    if (InstrinsicTypeNames.has(keyAsValue.name)) {
      throw new Error(`Attempted to jitRegister an intrinsic type: ${keyAsValue.name}. Did you forget to add @inject(Key)`);
    }
    if (isRegistry(keyAsValue)) {
      const registrationResolver = keyAsValue.register(handler);
      if (!(registrationResolver instanceof Object) || registrationResolver.resolve == null) {
        const newResolver = handler.resolvers.get(keyAsValue);
        if (newResolver != void 0) {
          return newResolver;
        }
        throw new Error("A valid resolver was not returned from the static register method");
      }
      return registrationResolver;
    } else if (keyAsValue.$isInterface) {
      throw new Error(`Attempted to jitRegister an interface: ${keyAsValue.friendlyName}`);
    } else {
      const resolver = this.config.defaultResolver(keyAsValue, handler);
      handler.resolvers.set(keyAsValue, resolver);
      return resolver;
    }
  }
};
var cache = /* @__PURE__ */ new WeakMap();
function cacheCallbackResult(fun) {
  return function(handler, requestor, resolver) {
    if (cache.has(resolver)) {
      return cache.get(resolver);
    }
    const t = fun(handler, requestor, resolver);
    cache.set(resolver, t);
    return t;
  };
}
var Registration = Object.freeze({
  instance(key, value) {
    return new ResolverImpl(key, 0, value);
  },
  singleton(key, value) {
    return new ResolverImpl(key, 1, value);
  },
  transient(key, value) {
    return new ResolverImpl(key, 2, value);
  },
  callback(key, callback) {
    return new ResolverImpl(key, 3, callback);
  },
  cachedCallback(key, callback) {
    return new ResolverImpl(key, 3, cacheCallbackResult(callback));
  },
  aliasTo(originalKey, aliasKey) {
    return new ResolverImpl(aliasKey, 5, originalKey);
  }
});
function validateKey(key) {
  if (key === null || key === void 0) {
    throw new Error("key/value cannot be null or undefined. Are you trying to inject/register something that doesn't exist with DI?");
  }
}
function buildAllResponse(resolver, handler, requestor) {
  if (resolver instanceof ResolverImpl && resolver.strategy === 4) {
    const state = resolver.state;
    let i = state.length;
    const results = new Array(i);
    while (i--) {
      results[i] = state[i].resolve(handler, requestor);
    }
    return results;
  }
  return [resolver.resolve(handler, requestor)];
}
var defaultFriendlyName = "(anonymous)";
function isObject(value) {
  return typeof value === "object" && value !== null || typeof value === "function";
}
var isNativeFunction = function() {
  const lookup = /* @__PURE__ */ new WeakMap();
  let isNative = false;
  let sourceText = "";
  let i = 0;
  return function(fn) {
    isNative = lookup.get(fn);
    if (isNative === void 0) {
      sourceText = fn.toString();
      i = sourceText.length;
      isNative = i >= 29 && i <= 100 && sourceText.charCodeAt(i - 1) === 125 && sourceText.charCodeAt(i - 2) <= 32 && sourceText.charCodeAt(i - 3) === 93 && sourceText.charCodeAt(i - 4) === 101 && sourceText.charCodeAt(i - 5) === 100 && sourceText.charCodeAt(i - 6) === 111 && sourceText.charCodeAt(i - 7) === 99 && sourceText.charCodeAt(i - 8) === 32 && sourceText.charCodeAt(i - 9) === 101 && sourceText.charCodeAt(i - 10) === 118 && sourceText.charCodeAt(i - 11) === 105 && sourceText.charCodeAt(i - 12) === 116 && sourceText.charCodeAt(i - 13) === 97 && sourceText.charCodeAt(i - 14) === 110 && sourceText.charCodeAt(i - 15) === 88;
      lookup.set(fn, isNative);
    }
    return isNative;
  };
}();
var isNumericLookup = {};
function isArrayIndex(value) {
  switch (typeof value) {
    case "number":
      return value >= 0 && (value | 0) === value;
    case "string": {
      const result = isNumericLookup[value];
      if (result !== void 0) {
        return result;
      }
      const length = value.length;
      if (length === 0) {
        return isNumericLookup[value] = false;
      }
      let ch = 0;
      for (let i = 0; i < length; ++i) {
        ch = value.charCodeAt(i);
        if (i === 0 && ch === 48 && length > 1 || ch < 48 || ch > 57) {
          return isNumericLookup[value] = false;
        }
      }
      return isNumericLookup[value] = true;
    }
    default:
      return false;
  }
}

// node_modules/@microsoft/fast-foundation/dist/esm/design-system/component-presentation.js
function presentationKeyFromTag(tagName) {
  return `${tagName.toLowerCase()}:presentation`;
}
var presentationRegistry = /* @__PURE__ */ new Map();
var ComponentPresentation = Object.freeze({
  define(tagName, presentation, container) {
    const key = presentationKeyFromTag(tagName);
    const existing = presentationRegistry.get(key);
    if (existing === void 0) {
      presentationRegistry.set(key, presentation);
    } else {
      presentationRegistry.set(key, false);
    }
    container.register(Registration.instance(key, presentation));
  },
  forTag(tagName, element) {
    const key = presentationKeyFromTag(tagName);
    const existing = presentationRegistry.get(key);
    if (existing === false) {
      const container = DI.findResponsibleContainer(element);
      return container.get(key);
    }
    return existing || null;
  }
});
var DefaultComponentPresentation = class {
  constructor(template, styles) {
    this.template = template || null;
    this.styles = styles === void 0 ? null : Array.isArray(styles) ? ElementStyles.create(styles) : styles instanceof ElementStyles ? styles : ElementStyles.create([styles]);
  }
  applyTo(element) {
    const controller = element.$fastController;
    if (controller.template === null) {
      controller.template = this.template;
    }
    if (controller.styles === null) {
      controller.styles = this.styles;
    }
  }
};

// node_modules/@microsoft/fast-foundation/dist/esm/foundation-element/foundation-element.js
var FoundationElement = class extends FASTElement {
  constructor() {
    super(...arguments);
    this._presentation = void 0;
  }
  get $presentation() {
    if (this._presentation === void 0) {
      this._presentation = ComponentPresentation.forTag(this.tagName, this);
    }
    return this._presentation;
  }
  templateChanged() {
    if (this.template !== void 0) {
      this.$fastController.template = this.template;
    }
  }
  stylesChanged() {
    if (this.styles !== void 0) {
      this.$fastController.styles = this.styles;
    }
  }
  connectedCallback() {
    if (this.$presentation !== null) {
      this.$presentation.applyTo(this);
    }
    super.connectedCallback();
  }
  static compose(elementDefinition) {
    return (overrideDefinition = {}) => new FoundationElementRegistry(this === FoundationElement ? class extends FoundationElement {
    } : this, elementDefinition, overrideDefinition);
  }
};
__decorate([
  observable
], FoundationElement.prototype, "template", void 0);
__decorate([
  observable
], FoundationElement.prototype, "styles", void 0);
function resolveOption(option, context, definition) {
  if (typeof option === "function") {
    return option(context, definition);
  }
  return option;
}
var FoundationElementRegistry = class {
  constructor(type, elementDefinition, overrideDefinition) {
    this.type = type;
    this.elementDefinition = elementDefinition;
    this.overrideDefinition = overrideDefinition;
    this.definition = Object.assign(Object.assign({}, this.elementDefinition), this.overrideDefinition);
  }
  register(container, context) {
    const definition = this.definition;
    const overrideDefinition = this.overrideDefinition;
    const prefix = definition.prefix || context.elementPrefix;
    const name = `${prefix}-${definition.baseName}`;
    context.tryDefineElement({
      name,
      type: this.type,
      baseClass: this.elementDefinition.baseClass,
      callback: (x) => {
        const presentation = new DefaultComponentPresentation(resolveOption(definition.template, x, definition), resolveOption(definition.styles, x, definition));
        x.definePresentation(presentation);
        let shadowOptions = resolveOption(definition.shadowOptions, x, definition);
        if (x.shadowRootMode) {
          if (shadowOptions) {
            if (!overrideDefinition.shadowOptions) {
              shadowOptions.mode = x.shadowRootMode;
            }
          } else if (shadowOptions !== null) {
            shadowOptions = { mode: x.shadowRootMode };
          }
        }
        x.defineElement({
          elementOptions: resolveOption(definition.elementOptions, x, definition),
          shadowOptions,
          attributes: resolveOption(definition.attributes, x, definition)
        });
      }
    });
  }
};

// node_modules/exenv-es6/dist/can-use-dom.js
function canUseDOM() {
  return !!(typeof window !== "undefined" && window.document && window.document.createElement);
}

// node_modules/@microsoft/fast-web-utilities/dist/dom.js
function getNonce() {
  const node = document.querySelector('meta[property="csp-nonce"]');
  if (node) {
    return node.getAttribute("content");
  } else {
    return null;
  }
}
var _canUseFocusVisible;
function canUseFocusVisible() {
  if (typeof _canUseFocusVisible === "boolean") {
    return _canUseFocusVisible;
  }
  if (!canUseDOM()) {
    _canUseFocusVisible = false;
    return _canUseFocusVisible;
  }
  const styleElement = document.createElement("style");
  const styleNonce = getNonce();
  if (styleNonce !== null) {
    styleElement.setAttribute("nonce", styleNonce);
  }
  document.head.appendChild(styleElement);
  try {
    styleElement.sheet.insertRule("foo:focus-visible {color:inherit}", 0);
    _canUseFocusVisible = true;
  } catch (e) {
    _canUseFocusVisible = false;
  } finally {
    document.head.removeChild(styleElement);
  }
  return _canUseFocusVisible;
}

// node_modules/@microsoft/fast-web-utilities/dist/events.js
var eventFocus = "focus";
var eventFocusIn = "focusin";
var eventFocusOut = "focusout";
var eventKeyDown = "keydown";

// node_modules/@microsoft/fast-web-utilities/dist/key-codes.js
var KeyCodes;
(function(KeyCodes2) {
  KeyCodes2[KeyCodes2["alt"] = 18] = "alt";
  KeyCodes2[KeyCodes2["arrowDown"] = 40] = "arrowDown";
  KeyCodes2[KeyCodes2["arrowLeft"] = 37] = "arrowLeft";
  KeyCodes2[KeyCodes2["arrowRight"] = 39] = "arrowRight";
  KeyCodes2[KeyCodes2["arrowUp"] = 38] = "arrowUp";
  KeyCodes2[KeyCodes2["back"] = 8] = "back";
  KeyCodes2[KeyCodes2["backSlash"] = 220] = "backSlash";
  KeyCodes2[KeyCodes2["break"] = 19] = "break";
  KeyCodes2[KeyCodes2["capsLock"] = 20] = "capsLock";
  KeyCodes2[KeyCodes2["closeBracket"] = 221] = "closeBracket";
  KeyCodes2[KeyCodes2["colon"] = 186] = "colon";
  KeyCodes2[KeyCodes2["colon2"] = 59] = "colon2";
  KeyCodes2[KeyCodes2["comma"] = 188] = "comma";
  KeyCodes2[KeyCodes2["ctrl"] = 17] = "ctrl";
  KeyCodes2[KeyCodes2["delete"] = 46] = "delete";
  KeyCodes2[KeyCodes2["end"] = 35] = "end";
  KeyCodes2[KeyCodes2["enter"] = 13] = "enter";
  KeyCodes2[KeyCodes2["equals"] = 187] = "equals";
  KeyCodes2[KeyCodes2["equals2"] = 61] = "equals2";
  KeyCodes2[KeyCodes2["equals3"] = 107] = "equals3";
  KeyCodes2[KeyCodes2["escape"] = 27] = "escape";
  KeyCodes2[KeyCodes2["forwardSlash"] = 191] = "forwardSlash";
  KeyCodes2[KeyCodes2["function1"] = 112] = "function1";
  KeyCodes2[KeyCodes2["function10"] = 121] = "function10";
  KeyCodes2[KeyCodes2["function11"] = 122] = "function11";
  KeyCodes2[KeyCodes2["function12"] = 123] = "function12";
  KeyCodes2[KeyCodes2["function2"] = 113] = "function2";
  KeyCodes2[KeyCodes2["function3"] = 114] = "function3";
  KeyCodes2[KeyCodes2["function4"] = 115] = "function4";
  KeyCodes2[KeyCodes2["function5"] = 116] = "function5";
  KeyCodes2[KeyCodes2["function6"] = 117] = "function6";
  KeyCodes2[KeyCodes2["function7"] = 118] = "function7";
  KeyCodes2[KeyCodes2["function8"] = 119] = "function8";
  KeyCodes2[KeyCodes2["function9"] = 120] = "function9";
  KeyCodes2[KeyCodes2["home"] = 36] = "home";
  KeyCodes2[KeyCodes2["insert"] = 45] = "insert";
  KeyCodes2[KeyCodes2["menu"] = 93] = "menu";
  KeyCodes2[KeyCodes2["minus"] = 189] = "minus";
  KeyCodes2[KeyCodes2["minus2"] = 109] = "minus2";
  KeyCodes2[KeyCodes2["numLock"] = 144] = "numLock";
  KeyCodes2[KeyCodes2["numPad0"] = 96] = "numPad0";
  KeyCodes2[KeyCodes2["numPad1"] = 97] = "numPad1";
  KeyCodes2[KeyCodes2["numPad2"] = 98] = "numPad2";
  KeyCodes2[KeyCodes2["numPad3"] = 99] = "numPad3";
  KeyCodes2[KeyCodes2["numPad4"] = 100] = "numPad4";
  KeyCodes2[KeyCodes2["numPad5"] = 101] = "numPad5";
  KeyCodes2[KeyCodes2["numPad6"] = 102] = "numPad6";
  KeyCodes2[KeyCodes2["numPad7"] = 103] = "numPad7";
  KeyCodes2[KeyCodes2["numPad8"] = 104] = "numPad8";
  KeyCodes2[KeyCodes2["numPad9"] = 105] = "numPad9";
  KeyCodes2[KeyCodes2["numPadDivide"] = 111] = "numPadDivide";
  KeyCodes2[KeyCodes2["numPadDot"] = 110] = "numPadDot";
  KeyCodes2[KeyCodes2["numPadMinus"] = 109] = "numPadMinus";
  KeyCodes2[KeyCodes2["numPadMultiply"] = 106] = "numPadMultiply";
  KeyCodes2[KeyCodes2["numPadPlus"] = 107] = "numPadPlus";
  KeyCodes2[KeyCodes2["openBracket"] = 219] = "openBracket";
  KeyCodes2[KeyCodes2["pageDown"] = 34] = "pageDown";
  KeyCodes2[KeyCodes2["pageUp"] = 33] = "pageUp";
  KeyCodes2[KeyCodes2["period"] = 190] = "period";
  KeyCodes2[KeyCodes2["print"] = 44] = "print";
  KeyCodes2[KeyCodes2["quote"] = 222] = "quote";
  KeyCodes2[KeyCodes2["scrollLock"] = 145] = "scrollLock";
  KeyCodes2[KeyCodes2["shift"] = 16] = "shift";
  KeyCodes2[KeyCodes2["space"] = 32] = "space";
  KeyCodes2[KeyCodes2["tab"] = 9] = "tab";
  KeyCodes2[KeyCodes2["tilde"] = 192] = "tilde";
  KeyCodes2[KeyCodes2["windowsLeft"] = 91] = "windowsLeft";
  KeyCodes2[KeyCodes2["windowsOpera"] = 219] = "windowsOpera";
  KeyCodes2[KeyCodes2["windowsRight"] = 92] = "windowsRight";
})(KeyCodes || (KeyCodes = {}));
var keyArrowDown = "ArrowDown";
var keyArrowLeft = "ArrowLeft";
var keyArrowRight = "ArrowRight";
var keyArrowUp = "ArrowUp";
var keyEnter = "Enter";
var keyEscape = "Escape";
var keyHome = "Home";
var keyEnd = "End";
var keyFunction2 = "F2";
var keyPageDown = "PageDown";
var keyPageUp = "PageUp";

// node_modules/@microsoft/fast-foundation/dist/esm/data-grid/data-grid.options.js
var GenerateHeaderOptions = {
  none: "none",
  default: "default",
  sticky: "sticky"
};
var DataGridCellTypes = {
  default: "default",
  columnHeader: "columnheader",
  rowHeader: "rowheader"
};
var DataGridRowTypes = {
  default: "default",
  header: "header",
  stickyHeader: "sticky-header"
};

// node_modules/@microsoft/fast-foundation/dist/esm/data-grid/data-grid-row.js
var DataGridRow = class extends FoundationElement {
  constructor() {
    super(...arguments);
    this.rowType = DataGridRowTypes.default;
    this.rowData = null;
    this.columnDefinitions = null;
    this.isActiveRow = false;
    this.cellsRepeatBehavior = null;
    this.cellsPlaceholder = null;
    this.focusColumnIndex = 0;
    this.refocusOnLoad = false;
    this.updateRowStyle = () => {
      this.style.gridTemplateColumns = this.gridTemplateColumns;
    };
  }
  gridTemplateColumnsChanged() {
    if (this.$fastController.isConnected) {
      this.updateRowStyle();
    }
  }
  rowTypeChanged() {
    if (this.$fastController.isConnected) {
      this.updateItemTemplate();
    }
  }
  rowDataChanged() {
    if (this.rowData !== null && this.isActiveRow) {
      this.refocusOnLoad = true;
      return;
    }
  }
  cellItemTemplateChanged() {
    this.updateItemTemplate();
  }
  headerCellItemTemplateChanged() {
    this.updateItemTemplate();
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.cellsRepeatBehavior === null) {
      this.cellsPlaceholder = document.createComment("");
      this.appendChild(this.cellsPlaceholder);
      this.updateItemTemplate();
      this.cellsRepeatBehavior = new RepeatDirective((x) => x.columnDefinitions, (x) => x.activeCellItemTemplate, { positioning: true }).createBehavior(this.cellsPlaceholder);
      this.$fastController.addBehaviors([this.cellsRepeatBehavior]);
    }
    this.addEventListener("cell-focused", this.handleCellFocus);
    this.addEventListener(eventFocusOut, this.handleFocusout);
    this.addEventListener(eventKeyDown, this.handleKeydown);
    this.updateRowStyle();
    if (this.refocusOnLoad) {
      this.refocusOnLoad = false;
      if (this.cellElements.length > this.focusColumnIndex) {
        this.cellElements[this.focusColumnIndex].focus();
      }
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("cell-focused", this.handleCellFocus);
    this.removeEventListener(eventFocusOut, this.handleFocusout);
    this.removeEventListener(eventKeyDown, this.handleKeydown);
  }
  handleFocusout(e) {
    if (!this.contains(e.target)) {
      this.isActiveRow = false;
      this.focusColumnIndex = 0;
    }
  }
  handleCellFocus(e) {
    this.isActiveRow = true;
    this.focusColumnIndex = this.cellElements.indexOf(e.target);
    this.$emit("row-focused", this);
  }
  handleKeydown(e) {
    if (e.defaultPrevented) {
      return;
    }
    let newFocusColumnIndex = 0;
    switch (e.key) {
      case keyArrowLeft:
        newFocusColumnIndex = Math.max(0, this.focusColumnIndex - 1);
        this.cellElements[newFocusColumnIndex].focus();
        e.preventDefault();
        break;
      case keyArrowRight:
        newFocusColumnIndex = Math.min(this.cellElements.length - 1, this.focusColumnIndex + 1);
        this.cellElements[newFocusColumnIndex].focus();
        e.preventDefault();
        break;
      case keyHome:
        if (!e.ctrlKey) {
          this.cellElements[0].focus();
          e.preventDefault();
        }
        break;
      case keyEnd:
        if (!e.ctrlKey) {
          this.cellElements[this.cellElements.length - 1].focus();
          e.preventDefault();
        }
        break;
    }
  }
  updateItemTemplate() {
    this.activeCellItemTemplate = this.rowType === DataGridRowTypes.default && this.cellItemTemplate !== void 0 ? this.cellItemTemplate : this.rowType === DataGridRowTypes.default && this.cellItemTemplate === void 0 ? this.defaultCellItemTemplate : this.headerCellItemTemplate !== void 0 ? this.headerCellItemTemplate : this.defaultHeaderCellItemTemplate;
  }
};
__decorate([
  attr({ attribute: "grid-template-columns" })
], DataGridRow.prototype, "gridTemplateColumns", void 0);
__decorate([
  attr({ attribute: "row-type" })
], DataGridRow.prototype, "rowType", void 0);
__decorate([
  observable
], DataGridRow.prototype, "rowData", void 0);
__decorate([
  observable
], DataGridRow.prototype, "columnDefinitions", void 0);
__decorate([
  observable
], DataGridRow.prototype, "cellItemTemplate", void 0);
__decorate([
  observable
], DataGridRow.prototype, "headerCellItemTemplate", void 0);
__decorate([
  observable
], DataGridRow.prototype, "rowIndex", void 0);
__decorate([
  observable
], DataGridRow.prototype, "isActiveRow", void 0);
__decorate([
  observable
], DataGridRow.prototype, "activeCellItemTemplate", void 0);
__decorate([
  observable
], DataGridRow.prototype, "defaultCellItemTemplate", void 0);
__decorate([
  observable
], DataGridRow.prototype, "defaultHeaderCellItemTemplate", void 0);
__decorate([
  observable
], DataGridRow.prototype, "cellElements", void 0);

// node_modules/@microsoft/fast-foundation/dist/esm/data-grid/data-grid.template.js
function createRowItemTemplate(context) {
  const rowTag = context.tagFor(DataGridRow);
  return html`
    <${rowTag}
        :rowData="${(x) => x}"
        :cellItemTemplate="${(x, c) => c.parent.cellItemTemplate}"
        :headerCellItemTemplate="${(x, c) => c.parent.headerCellItemTemplate}"
    ></${rowTag}>
`;
}
var dataGridTemplate = (context, definition) => {
  const rowItemTemplate = createRowItemTemplate(context);
  const rowTag = context.tagFor(DataGridRow);
  return html`
        <template
            role="grid"
            tabindex="0"
            :rowElementTag="${() => rowTag}"
            :defaultRowItemTemplate="${rowItemTemplate}"
            ${children({
    property: "rowElements",
    filter: elements("[role=row]")
  })}
        >
            <slot></slot>
        </template>
    `;
};

// node_modules/@microsoft/fast-foundation/dist/esm/data-grid/data-grid.js
var DataGrid = class extends FoundationElement {
  constructor() {
    super();
    this.noTabbing = false;
    this.generateHeader = GenerateHeaderOptions.default;
    this.rowsData = [];
    this.columnDefinitions = null;
    this.focusRowIndex = 0;
    this.focusColumnIndex = 0;
    this.rowsPlaceholder = null;
    this.generatedHeader = null;
    this.isUpdatingFocus = false;
    this.pendingFocusUpdate = false;
    this.rowindexUpdateQueued = false;
    this.columnDefinitionsStale = true;
    this.generatedGridTemplateColumns = "";
    this.focusOnCell = (rowIndex, columnIndex, scrollIntoView) => {
      if (this.rowElements.length === 0) {
        this.focusRowIndex = 0;
        this.focusColumnIndex = 0;
        return;
      }
      const focusRowIndex = Math.max(0, Math.min(this.rowElements.length - 1, rowIndex));
      const focusRow = this.rowElements[focusRowIndex];
      const cells = focusRow.querySelectorAll('[role="cell"], [role="gridcell"], [role="columnheader"], [role="rowheader"]');
      const focusColumnIndex = Math.max(0, Math.min(cells.length - 1, columnIndex));
      const focusTarget = cells[focusColumnIndex];
      if (scrollIntoView && this.scrollHeight !== this.clientHeight && (focusRowIndex < this.focusRowIndex && this.scrollTop > 0 || focusRowIndex > this.focusRowIndex && this.scrollTop < this.scrollHeight - this.clientHeight)) {
        focusTarget.scrollIntoView({ block: "center", inline: "center" });
      }
      focusTarget.focus();
    };
    this.onChildListChange = (mutations, observer) => {
      if (mutations && mutations.length) {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((newNode) => {
            if (newNode.nodeType === 1 && newNode.getAttribute("role") === "row") {
              newNode.columnDefinitions = this.columnDefinitions;
            }
          });
        });
        this.queueRowIndexUpdate();
      }
    };
    this.queueRowIndexUpdate = () => {
      if (!this.rowindexUpdateQueued) {
        this.rowindexUpdateQueued = true;
        DOM.queueUpdate(this.updateRowIndexes);
      }
    };
    this.updateRowIndexes = () => {
      let newGridTemplateColumns = this.gridTemplateColumns;
      if (newGridTemplateColumns === void 0) {
        if (this.generatedGridTemplateColumns === "" && this.rowElements.length > 0) {
          const firstRow = this.rowElements[0];
          this.generatedGridTemplateColumns = new Array(firstRow.cellElements.length).fill("1fr").join(" ");
        }
        newGridTemplateColumns = this.generatedGridTemplateColumns;
      }
      this.rowElements.forEach((element, index) => {
        const thisRow = element;
        thisRow.rowIndex = index;
        thisRow.gridTemplateColumns = newGridTemplateColumns;
        if (this.columnDefinitionsStale) {
          thisRow.columnDefinitions = this.columnDefinitions;
        }
      });
      this.rowindexUpdateQueued = false;
      this.columnDefinitionsStale = false;
    };
  }
  static generateTemplateColumns(columnDefinitions) {
    let templateColumns = "";
    columnDefinitions.forEach((column) => {
      templateColumns = `${templateColumns}${templateColumns === "" ? "" : " "}${"1fr"}`;
    });
    return templateColumns;
  }
  noTabbingChanged() {
    if (this.$fastController.isConnected) {
      if (this.noTabbing) {
        this.setAttribute("tabIndex", "-1");
      } else {
        this.setAttribute("tabIndex", this.contains(document.activeElement) || this === document.activeElement ? "-1" : "0");
      }
    }
  }
  generateHeaderChanged() {
    if (this.$fastController.isConnected) {
      this.toggleGeneratedHeader();
    }
  }
  gridTemplateColumnsChanged() {
    if (this.$fastController.isConnected) {
      this.updateRowIndexes();
    }
  }
  rowsDataChanged() {
    if (this.columnDefinitions === null && this.rowsData.length > 0) {
      this.columnDefinitions = DataGrid.generateColumns(this.rowsData[0]);
    }
    if (this.$fastController.isConnected) {
      this.toggleGeneratedHeader();
    }
  }
  columnDefinitionsChanged() {
    if (this.columnDefinitions === null) {
      this.generatedGridTemplateColumns = "";
      return;
    }
    this.generatedGridTemplateColumns = DataGrid.generateTemplateColumns(this.columnDefinitions);
    if (this.$fastController.isConnected) {
      this.columnDefinitionsStale = true;
      this.queueRowIndexUpdate();
    }
  }
  headerCellItemTemplateChanged() {
    if (this.$fastController.isConnected) {
      if (this.generatedHeader !== null) {
        this.generatedHeader.headerCellItemTemplate = this.headerCellItemTemplate;
      }
    }
  }
  focusRowIndexChanged() {
    if (this.$fastController.isConnected) {
      this.queueFocusUpdate();
    }
  }
  focusColumnIndexChanged() {
    if (this.$fastController.isConnected) {
      this.queueFocusUpdate();
    }
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.rowItemTemplate === void 0) {
      this.rowItemTemplate = this.defaultRowItemTemplate;
    }
    this.rowsPlaceholder = document.createComment("");
    this.appendChild(this.rowsPlaceholder);
    this.toggleGeneratedHeader();
    this.rowsRepeatBehavior = new RepeatDirective((x) => x.rowsData, (x) => x.rowItemTemplate, { positioning: true }).createBehavior(this.rowsPlaceholder);
    this.$fastController.addBehaviors([this.rowsRepeatBehavior]);
    this.addEventListener("row-focused", this.handleRowFocus);
    this.addEventListener(eventFocus, this.handleFocus);
    this.addEventListener(eventKeyDown, this.handleKeydown);
    this.addEventListener(eventFocusOut, this.handleFocusOut);
    this.observer = new MutationObserver(this.onChildListChange);
    this.observer.observe(this, { childList: true });
    if (this.noTabbing) {
      this.setAttribute("tabindex", "-1");
    }
    DOM.queueUpdate(this.queueRowIndexUpdate);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("row-focused", this.handleRowFocus);
    this.removeEventListener(eventFocus, this.handleFocus);
    this.removeEventListener(eventKeyDown, this.handleKeydown);
    this.removeEventListener(eventFocusOut, this.handleFocusOut);
    this.observer.disconnect();
    this.rowsPlaceholder = null;
    this.generatedHeader = null;
  }
  handleRowFocus(e) {
    this.isUpdatingFocus = true;
    const focusRow = e.target;
    this.focusRowIndex = this.rowElements.indexOf(focusRow);
    this.focusColumnIndex = focusRow.focusColumnIndex;
    this.setAttribute("tabIndex", "-1");
    this.isUpdatingFocus = false;
  }
  handleFocus(e) {
    this.focusOnCell(this.focusRowIndex, this.focusColumnIndex, true);
  }
  handleFocusOut(e) {
    if (e.relatedTarget === null || !this.contains(e.relatedTarget)) {
      this.setAttribute("tabIndex", this.noTabbing ? "-1" : "0");
    }
  }
  handleKeydown(e) {
    if (e.defaultPrevented) {
      return;
    }
    let newFocusRowIndex;
    const maxIndex = this.rowElements.length - 1;
    const currentGridBottom = this.offsetHeight + this.scrollTop;
    const lastRow = this.rowElements[maxIndex];
    switch (e.key) {
      case keyArrowUp:
        e.preventDefault();
        this.focusOnCell(this.focusRowIndex - 1, this.focusColumnIndex, true);
        break;
      case keyArrowDown:
        e.preventDefault();
        this.focusOnCell(this.focusRowIndex + 1, this.focusColumnIndex, true);
        break;
      case keyPageUp:
        e.preventDefault();
        if (this.rowElements.length === 0) {
          this.focusOnCell(0, 0, false);
          break;
        }
        if (this.focusRowIndex === 0) {
          this.focusOnCell(0, this.focusColumnIndex, false);
          return;
        }
        newFocusRowIndex = this.focusRowIndex - 1;
        for (newFocusRowIndex; newFocusRowIndex >= 0; newFocusRowIndex--) {
          const thisRow = this.rowElements[newFocusRowIndex];
          if (thisRow.offsetTop < this.scrollTop) {
            this.scrollTop = thisRow.offsetTop + thisRow.clientHeight - this.clientHeight;
            break;
          }
        }
        this.focusOnCell(newFocusRowIndex, this.focusColumnIndex, false);
        break;
      case keyPageDown:
        e.preventDefault();
        if (this.rowElements.length === 0) {
          this.focusOnCell(0, 0, false);
          break;
        }
        if (this.focusRowIndex >= maxIndex || lastRow.offsetTop + lastRow.offsetHeight <= currentGridBottom) {
          this.focusOnCell(maxIndex, this.focusColumnIndex, false);
          return;
        }
        newFocusRowIndex = this.focusRowIndex + 1;
        for (newFocusRowIndex; newFocusRowIndex <= maxIndex; newFocusRowIndex++) {
          const thisRow = this.rowElements[newFocusRowIndex];
          if (thisRow.offsetTop + thisRow.offsetHeight > currentGridBottom) {
            let stickyHeaderOffset = 0;
            if (this.generateHeader === GenerateHeaderOptions.sticky && this.generatedHeader !== null) {
              stickyHeaderOffset = this.generatedHeader.clientHeight;
            }
            this.scrollTop = thisRow.offsetTop - stickyHeaderOffset;
            break;
          }
        }
        this.focusOnCell(newFocusRowIndex, this.focusColumnIndex, false);
        break;
      case keyHome:
        if (e.ctrlKey) {
          e.preventDefault();
          this.focusOnCell(0, 0, true);
        }
        break;
      case keyEnd:
        if (e.ctrlKey && this.columnDefinitions !== null) {
          e.preventDefault();
          this.focusOnCell(this.rowElements.length - 1, this.columnDefinitions.length - 1, true);
        }
        break;
    }
  }
  queueFocusUpdate() {
    if (this.isUpdatingFocus && (this.contains(document.activeElement) || this === document.activeElement)) {
      return;
    }
    if (this.pendingFocusUpdate === false) {
      this.pendingFocusUpdate = true;
      DOM.queueUpdate(() => this.updateFocus());
    }
  }
  updateFocus() {
    this.pendingFocusUpdate = false;
    this.focusOnCell(this.focusRowIndex, this.focusColumnIndex, true);
  }
  toggleGeneratedHeader() {
    if (this.generatedHeader !== null) {
      this.removeChild(this.generatedHeader);
      this.generatedHeader = null;
    }
    if (this.generateHeader !== GenerateHeaderOptions.none && this.rowsData.length > 0) {
      const generatedHeaderElement = document.createElement(this.rowElementTag);
      this.generatedHeader = generatedHeaderElement;
      this.generatedHeader.columnDefinitions = this.columnDefinitions;
      this.generatedHeader.gridTemplateColumns = this.gridTemplateColumns;
      this.generatedHeader.rowType = this.generateHeader === GenerateHeaderOptions.sticky ? DataGridRowTypes.stickyHeader : DataGridRowTypes.header;
      if (this.firstChild !== null || this.rowsPlaceholder !== null) {
        this.insertBefore(generatedHeaderElement, this.firstChild !== null ? this.firstChild : this.rowsPlaceholder);
      }
      return;
    }
  }
};
DataGrid.generateColumns = (row) => {
  return Object.getOwnPropertyNames(row).map((property, index) => {
    return {
      columnDataKey: property,
      gridColumn: `${index}`
    };
  });
};
__decorate([
  attr({ attribute: "no-tabbing", mode: "boolean" })
], DataGrid.prototype, "noTabbing", void 0);
__decorate([
  attr({ attribute: "generate-header" })
], DataGrid.prototype, "generateHeader", void 0);
__decorate([
  attr({ attribute: "grid-template-columns" })
], DataGrid.prototype, "gridTemplateColumns", void 0);
__decorate([
  observable
], DataGrid.prototype, "rowsData", void 0);
__decorate([
  observable
], DataGrid.prototype, "columnDefinitions", void 0);
__decorate([
  observable
], DataGrid.prototype, "rowItemTemplate", void 0);
__decorate([
  observable
], DataGrid.prototype, "cellItemTemplate", void 0);
__decorate([
  observable
], DataGrid.prototype, "headerCellItemTemplate", void 0);
__decorate([
  observable
], DataGrid.prototype, "focusRowIndex", void 0);
__decorate([
  observable
], DataGrid.prototype, "focusColumnIndex", void 0);
__decorate([
  observable
], DataGrid.prototype, "defaultRowItemTemplate", void 0);
__decorate([
  observable
], DataGrid.prototype, "rowElementTag", void 0);
__decorate([
  observable
], DataGrid.prototype, "rowElements", void 0);

// node_modules/@microsoft/fast-foundation/dist/esm/data-grid/data-grid-cell.js
var defaultCellContentsTemplate = html`
    <template>
        ${(x) => x.rowData === null || x.columnDefinition === null || x.columnDefinition.columnDataKey === null ? null : x.rowData[x.columnDefinition.columnDataKey]}
    </template>
`;
var defaultHeaderCellContentsTemplate = html`
    <template>
        ${(x) => x.columnDefinition === null ? null : x.columnDefinition.title === void 0 ? x.columnDefinition.columnDataKey : x.columnDefinition.title}
    </template>
`;
var DataGridCell = class extends FoundationElement {
  constructor() {
    super(...arguments);
    this.cellType = DataGridCellTypes.default;
    this.rowData = null;
    this.columnDefinition = null;
    this.isActiveCell = false;
    this.customCellView = null;
    this.updateCellStyle = () => {
      this.style.gridColumn = this.gridColumn;
    };
  }
  cellTypeChanged() {
    if (this.$fastController.isConnected) {
      this.updateCellView();
    }
  }
  gridColumnChanged() {
    if (this.$fastController.isConnected) {
      this.updateCellStyle();
    }
  }
  columnDefinitionChanged(oldValue, newValue) {
    if (this.$fastController.isConnected) {
      this.updateCellView();
    }
  }
  connectedCallback() {
    var _a;
    super.connectedCallback();
    this.addEventListener(eventFocusIn, this.handleFocusin);
    this.addEventListener(eventFocusOut, this.handleFocusout);
    this.addEventListener(eventKeyDown, this.handleKeydown);
    this.style.gridColumn = `${((_a = this.columnDefinition) === null || _a === void 0 ? void 0 : _a.gridColumn) === void 0 ? 0 : this.columnDefinition.gridColumn}`;
    this.updateCellView();
    this.updateCellStyle();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(eventFocusIn, this.handleFocusin);
    this.removeEventListener(eventFocusOut, this.handleFocusout);
    this.removeEventListener(eventKeyDown, this.handleKeydown);
    this.disconnectCellView();
  }
  handleFocusin(e) {
    if (this.isActiveCell) {
      return;
    }
    this.isActiveCell = true;
    switch (this.cellType) {
      case DataGridCellTypes.columnHeader:
        if (this.columnDefinition !== null && this.columnDefinition.headerCellInternalFocusQueue !== true && typeof this.columnDefinition.headerCellFocusTargetCallback === "function") {
          const focusTarget = this.columnDefinition.headerCellFocusTargetCallback(this);
          if (focusTarget !== null) {
            focusTarget.focus();
          }
        }
        break;
      default:
        if (this.columnDefinition !== null && this.columnDefinition.cellInternalFocusQueue !== true && typeof this.columnDefinition.cellFocusTargetCallback === "function") {
          const focusTarget = this.columnDefinition.cellFocusTargetCallback(this);
          if (focusTarget !== null) {
            focusTarget.focus();
          }
        }
        break;
    }
    this.$emit("cell-focused", this);
  }
  handleFocusout(e) {
    if (this !== document.activeElement && !this.contains(document.activeElement)) {
      this.isActiveCell = false;
    }
  }
  handleKeydown(e) {
    if (e.defaultPrevented || this.columnDefinition === null || this.cellType === DataGridCellTypes.default && this.columnDefinition.cellInternalFocusQueue !== true || this.cellType === DataGridCellTypes.columnHeader && this.columnDefinition.headerCellInternalFocusQueue !== true) {
      return;
    }
    switch (e.key) {
      case keyEnter:
      case keyFunction2:
        if (this.contains(document.activeElement) && document.activeElement !== this) {
          return;
        }
        switch (this.cellType) {
          case DataGridCellTypes.columnHeader:
            if (this.columnDefinition.headerCellFocusTargetCallback !== void 0) {
              const focusTarget = this.columnDefinition.headerCellFocusTargetCallback(this);
              if (focusTarget !== null) {
                focusTarget.focus();
              }
              e.preventDefault();
            }
            break;
          default:
            if (this.columnDefinition.cellFocusTargetCallback !== void 0) {
              const focusTarget = this.columnDefinition.cellFocusTargetCallback(this);
              if (focusTarget !== null) {
                focusTarget.focus();
              }
              e.preventDefault();
            }
            break;
        }
        break;
      case keyEscape:
        if (this.contains(document.activeElement) && document.activeElement !== this) {
          this.focus();
          e.preventDefault();
        }
        break;
    }
  }
  updateCellView() {
    this.disconnectCellView();
    if (this.columnDefinition === null) {
      return;
    }
    switch (this.cellType) {
      case DataGridCellTypes.columnHeader:
        if (this.columnDefinition.headerCellTemplate !== void 0) {
          this.customCellView = this.columnDefinition.headerCellTemplate.render(this, this);
        } else {
          this.customCellView = defaultHeaderCellContentsTemplate.render(this, this);
        }
        break;
      case void 0:
      case DataGridCellTypes.rowHeader:
      case DataGridCellTypes.default:
        if (this.columnDefinition.cellTemplate !== void 0) {
          this.customCellView = this.columnDefinition.cellTemplate.render(this, this);
        } else {
          this.customCellView = defaultCellContentsTemplate.render(this, this);
        }
        break;
    }
  }
  disconnectCellView() {
    if (this.customCellView !== null) {
      this.customCellView.dispose();
      this.customCellView = null;
    }
  }
};
__decorate([
  attr({ attribute: "cell-type" })
], DataGridCell.prototype, "cellType", void 0);
__decorate([
  attr({ attribute: "grid-column" })
], DataGridCell.prototype, "gridColumn", void 0);
__decorate([
  observable
], DataGridCell.prototype, "rowData", void 0);
__decorate([
  observable
], DataGridCell.prototype, "columnDefinition", void 0);

// node_modules/@microsoft/fast-foundation/dist/esm/data-grid/data-grid-row.template.js
function createCellItemTemplate(context) {
  const cellTag = context.tagFor(DataGridCell);
  return html`
    <${cellTag}
        cell-type="${(x) => x.isRowHeader ? "rowheader" : void 0}"
        grid-column="${(x, c) => c.index + 1}"
        :rowData="${(x, c) => c.parent.rowData}"
        :columnDefinition="${(x) => x}"
    ></${cellTag}>
`;
}
function createHeaderCellItemTemplate(context) {
  const cellTag = context.tagFor(DataGridCell);
  return html`
    <${cellTag}
        cell-type="columnheader"
        grid-column="${(x, c) => c.index + 1}"
        :columnDefinition="${(x) => x}"
    ></${cellTag}>
`;
}
var dataGridRowTemplate = (context, definition) => {
  const cellItemTemplate = createCellItemTemplate(context);
  const headerCellItemTemplate = createHeaderCellItemTemplate(context);
  return html`
        <template
            role="row"
            class="${(x) => x.rowType !== "default" ? x.rowType : ""}"
            :defaultCellItemTemplate="${cellItemTemplate}"
            :defaultHeaderCellItemTemplate="${headerCellItemTemplate}"
            ${children({
    property: "cellElements",
    filter: elements('[role="cell"],[role="gridcell"],[role="columnheader"],[role="rowheader"]')
  })}
        >
            <slot ${slotted("slottedCellElements")}></slot>
        </template>
    `;
};

// node_modules/@microsoft/fast-foundation/dist/esm/data-grid/data-grid-cell.template.js
var dataGridCellTemplate = (context, definition) => {
  return html`
        <template
            tabindex="-1"
            role="${(x) => !x.cellType || x.cellType === "default" ? "gridcell" : x.cellType}"
            class="
            ${(x) => x.cellType === "columnheader" ? "column-header" : x.cellType === "rowheader" ? "row-header" : ""}
            "
        >
            <slot></slot>
        </template>
    `;
};

// node_modules/@microsoft/fast-foundation/dist/esm/utilities/composed-parent.js
function composedParent(element) {
  const parentNode = element.parentElement;
  if (parentNode) {
    return parentNode;
  } else {
    const rootNode = element.getRootNode();
    if (rootNode.host instanceof HTMLElement) {
      return rootNode.host;
    }
  }
  return null;
}

// node_modules/@microsoft/fast-foundation/dist/esm/utilities/composed-contains.js
function composedContains(reference, test) {
  let current = test;
  while (current !== null) {
    if (current === reference) {
      return true;
    }
    current = composedParent(current);
  }
  return false;
}

// node_modules/@microsoft/fast-foundation/dist/esm/design-token/custom-property-manager.js
var defaultElement = document.createElement("div");
function isFastElement(element) {
  return element instanceof FASTElement;
}
var QueuedStyleSheetTarget = class {
  setProperty(name, value) {
    DOM.queueUpdate(() => this.target.setProperty(name, value));
  }
  removeProperty(name) {
    DOM.queueUpdate(() => this.target.removeProperty(name));
  }
};
var ConstructableStyleSheetTarget = class extends QueuedStyleSheetTarget {
  constructor(source) {
    super();
    const sheet = new CSSStyleSheet();
    this.target = sheet.cssRules[sheet.insertRule(":host{}")].style;
    source.$fastController.addStyles(ElementStyles.create([sheet]));
  }
};
var DocumentStyleSheetTarget = class extends QueuedStyleSheetTarget {
  constructor() {
    super();
    const sheet = new CSSStyleSheet();
    this.target = sheet.cssRules[sheet.insertRule(":root{}")].style;
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      sheet
    ];
  }
};
var HeadStyleElementStyleSheetTarget = class extends QueuedStyleSheetTarget {
  constructor() {
    super();
    this.style = document.createElement("style");
    document.head.appendChild(this.style);
    const { sheet } = this.style;
    if (sheet) {
      const index = sheet.insertRule(":root{}", sheet.cssRules.length);
      this.target = sheet.cssRules[index].style;
    }
  }
};
var StyleElementStyleSheetTarget = class {
  constructor(target) {
    this.store = /* @__PURE__ */ new Map();
    this.target = null;
    const controller = target.$fastController;
    this.style = document.createElement("style");
    controller.addStyles(this.style);
    Observable.getNotifier(controller).subscribe(this, "isConnected");
    this.handleChange(controller, "isConnected");
  }
  targetChanged() {
    if (this.target !== null) {
      for (const [key, value] of this.store.entries()) {
        this.target.setProperty(key, value);
      }
    }
  }
  setProperty(name, value) {
    this.store.set(name, value);
    DOM.queueUpdate(() => {
      if (this.target !== null) {
        this.target.setProperty(name, value);
      }
    });
  }
  removeProperty(name) {
    this.store.delete(name);
    DOM.queueUpdate(() => {
      if (this.target !== null) {
        this.target.removeProperty(name);
      }
    });
  }
  handleChange(source, key) {
    const { sheet } = this.style;
    if (sheet) {
      const index = sheet.insertRule(":host{}", sheet.cssRules.length);
      this.target = sheet.cssRules[index].style;
    } else {
      this.target = null;
    }
  }
};
__decorate([
  observable
], StyleElementStyleSheetTarget.prototype, "target", void 0);
var ElementStyleSheetTarget = class {
  constructor(source) {
    this.target = source.style;
  }
  setProperty(name, value) {
    DOM.queueUpdate(() => this.target.setProperty(name, value));
  }
  removeProperty(name) {
    DOM.queueUpdate(() => this.target.removeProperty(name));
  }
};
var RootStyleSheetTarget = class {
  setProperty(name, value) {
    RootStyleSheetTarget.properties[name] = value;
    for (const target of RootStyleSheetTarget.roots.values()) {
      PropertyTargetManager.getOrCreate(RootStyleSheetTarget.normalizeRoot(target)).setProperty(name, value);
    }
  }
  removeProperty(name) {
    delete RootStyleSheetTarget.properties[name];
    for (const target of RootStyleSheetTarget.roots.values()) {
      PropertyTargetManager.getOrCreate(RootStyleSheetTarget.normalizeRoot(target)).removeProperty(name);
    }
  }
  static registerRoot(root) {
    const { roots } = RootStyleSheetTarget;
    if (!roots.has(root)) {
      roots.add(root);
      const target = PropertyTargetManager.getOrCreate(this.normalizeRoot(root));
      for (const key in RootStyleSheetTarget.properties) {
        target.setProperty(key, RootStyleSheetTarget.properties[key]);
      }
    }
  }
  static unregisterRoot(root) {
    const { roots } = RootStyleSheetTarget;
    if (roots.has(root)) {
      roots.delete(root);
      const target = PropertyTargetManager.getOrCreate(RootStyleSheetTarget.normalizeRoot(root));
      for (const key in RootStyleSheetTarget.properties) {
        target.removeProperty(key);
      }
    }
  }
  static normalizeRoot(root) {
    return root === defaultElement ? document : root;
  }
};
RootStyleSheetTarget.roots = /* @__PURE__ */ new Set();
RootStyleSheetTarget.properties = {};
var propertyTargetCache = /* @__PURE__ */ new WeakMap();
var propertyTargetCtor = DOM.supportsAdoptedStyleSheets ? ConstructableStyleSheetTarget : StyleElementStyleSheetTarget;
var PropertyTargetManager = Object.freeze({
  getOrCreate(source) {
    if (propertyTargetCache.has(source)) {
      return propertyTargetCache.get(source);
    }
    let target;
    if (source === defaultElement) {
      target = new RootStyleSheetTarget();
    } else if (source instanceof Document) {
      target = DOM.supportsAdoptedStyleSheets ? new DocumentStyleSheetTarget() : new HeadStyleElementStyleSheetTarget();
    } else if (isFastElement(source)) {
      target = new propertyTargetCtor(source);
    } else {
      target = new ElementStyleSheetTarget(source);
    }
    propertyTargetCache.set(source, target);
    return target;
  }
});

// node_modules/@microsoft/fast-foundation/dist/esm/design-token/design-token.js
var DesignTokenImpl = class extends CSSDirective {
  constructor(configuration) {
    super();
    this.subscribers = /* @__PURE__ */ new WeakMap();
    this._appliedTo = /* @__PURE__ */ new Set();
    this.name = configuration.name;
    if (configuration.cssCustomPropertyName !== null) {
      this.cssCustomProperty = `--${configuration.cssCustomPropertyName}`;
      this.cssVar = `var(${this.cssCustomProperty})`;
    }
    this.id = DesignTokenImpl.uniqueId();
    DesignTokenImpl.tokensById.set(this.id, this);
  }
  get appliedTo() {
    return [...this._appliedTo];
  }
  static from(nameOrConfig) {
    return new DesignTokenImpl({
      name: typeof nameOrConfig === "string" ? nameOrConfig : nameOrConfig.name,
      cssCustomPropertyName: typeof nameOrConfig === "string" ? nameOrConfig : nameOrConfig.cssCustomPropertyName === void 0 ? nameOrConfig.name : nameOrConfig.cssCustomPropertyName
    });
  }
  static isCSSDesignToken(token) {
    return typeof token.cssCustomProperty === "string";
  }
  static isDerivedDesignTokenValue(value) {
    return typeof value === "function";
  }
  static getTokenById(id) {
    return DesignTokenImpl.tokensById.get(id);
  }
  getOrCreateSubscriberSet(target = this) {
    return this.subscribers.get(target) || this.subscribers.set(target, /* @__PURE__ */ new Set()) && this.subscribers.get(target);
  }
  createCSS() {
    return this.cssVar || "";
  }
  getValueFor(element) {
    const value = DesignTokenNode.getOrCreate(element).get(this);
    if (value !== void 0) {
      return value;
    }
    throw new Error(`Value could not be retrieved for token named "${this.name}". Ensure the value is set for ${element} or an ancestor of ${element}.`);
  }
  setValueFor(element, value) {
    this._appliedTo.add(element);
    if (value instanceof DesignTokenImpl) {
      value = this.alias(value);
    }
    DesignTokenNode.getOrCreate(element).set(this, value);
    return this;
  }
  deleteValueFor(element) {
    this._appliedTo.delete(element);
    if (DesignTokenNode.existsFor(element)) {
      DesignTokenNode.getOrCreate(element).delete(this);
    }
    return this;
  }
  withDefault(value) {
    this.setValueFor(defaultElement, value);
    return this;
  }
  subscribe(subscriber, target) {
    const subscriberSet = this.getOrCreateSubscriberSet(target);
    if (target && !DesignTokenNode.existsFor(target)) {
      DesignTokenNode.getOrCreate(target);
    }
    if (!subscriberSet.has(subscriber)) {
      subscriberSet.add(subscriber);
    }
  }
  unsubscribe(subscriber, target) {
    const list = this.subscribers.get(target || this);
    if (list && list.has(subscriber)) {
      list.delete(subscriber);
    }
  }
  notify(element) {
    const record = Object.freeze({ token: this, target: element });
    if (this.subscribers.has(this)) {
      this.subscribers.get(this).forEach((sub) => sub.handleChange(record));
    }
    if (this.subscribers.has(element)) {
      this.subscribers.get(element).forEach((sub) => sub.handleChange(record));
    }
  }
  alias(token) {
    return (target) => token.getValueFor(target);
  }
};
DesignTokenImpl.uniqueId = (() => {
  let id = 0;
  return () => {
    id++;
    return id.toString(16);
  };
})();
DesignTokenImpl.tokensById = /* @__PURE__ */ new Map();
var CustomPropertyReflector = class {
  startReflection(token, target) {
    token.subscribe(this, target);
    this.handleChange({ token, target });
  }
  stopReflection(token, target) {
    token.unsubscribe(this, target);
    this.remove(token, target);
  }
  handleChange(record) {
    const { token, target } = record;
    this.add(token, target);
  }
  add(token, target) {
    PropertyTargetManager.getOrCreate(target).setProperty(token.cssCustomProperty, this.resolveCSSValue(DesignTokenNode.getOrCreate(target).get(token)));
  }
  remove(token, target) {
    PropertyTargetManager.getOrCreate(target).removeProperty(token.cssCustomProperty);
  }
  resolveCSSValue(value) {
    return value && typeof value.createCSS === "function" ? value.createCSS() : value;
  }
};
var DesignTokenBindingObserver = class {
  constructor(source, token, node) {
    this.source = source;
    this.token = token;
    this.node = node;
    this.dependencies = /* @__PURE__ */ new Set();
    this.observer = Observable.binding(source, this, false);
    this.observer.handleChange = this.observer.call;
    this.handleChange();
  }
  disconnect() {
    this.observer.disconnect();
  }
  handleChange() {
    this.node.store.set(this.token, this.observer.observe(this.node.target, defaultExecutionContext));
  }
};
var Store = class {
  constructor() {
    this.values = /* @__PURE__ */ new Map();
  }
  set(token, value) {
    if (this.values.get(token) !== value) {
      this.values.set(token, value);
      Observable.getNotifier(this).notify(token.id);
    }
  }
  get(token) {
    Observable.track(this, token.id);
    return this.values.get(token);
  }
  delete(token) {
    this.values.delete(token);
  }
  all() {
    return this.values.entries();
  }
};
var nodeCache = /* @__PURE__ */ new WeakMap();
var childToParent = /* @__PURE__ */ new WeakMap();
var DesignTokenNode = class {
  constructor(target) {
    this.target = target;
    this.store = new Store();
    this.children = [];
    this.assignedValues = /* @__PURE__ */ new Map();
    this.reflecting = /* @__PURE__ */ new Set();
    this.bindingObservers = /* @__PURE__ */ new Map();
    this.tokenValueChangeHandler = {
      handleChange: (source, arg) => {
        const token = DesignTokenImpl.getTokenById(arg);
        if (token) {
          token.notify(this.target);
          if (DesignTokenImpl.isCSSDesignToken(token)) {
            const parent = this.parent;
            const reflecting = this.isReflecting(token);
            if (parent) {
              const parentValue = parent.get(token);
              const sourceValue = source.get(token);
              if (parentValue !== sourceValue && !reflecting) {
                this.reflectToCSS(token);
              } else if (parentValue === sourceValue && reflecting) {
                this.stopReflectToCSS(token);
              }
            } else if (!reflecting) {
              this.reflectToCSS(token);
            }
          }
        }
      }
    };
    nodeCache.set(target, this);
    Observable.getNotifier(this.store).subscribe(this.tokenValueChangeHandler);
    if (target instanceof FASTElement) {
      target.$fastController.addBehaviors([this]);
    } else if (target.isConnected) {
      this.bind();
    }
  }
  static getOrCreate(target) {
    return nodeCache.get(target) || new DesignTokenNode(target);
  }
  static existsFor(target) {
    return nodeCache.has(target);
  }
  static findParent(node) {
    if (!(defaultElement === node.target)) {
      let parent = composedParent(node.target);
      while (parent !== null) {
        if (nodeCache.has(parent)) {
          return nodeCache.get(parent);
        }
        parent = composedParent(parent);
      }
      return DesignTokenNode.getOrCreate(defaultElement);
    }
    return null;
  }
  static findClosestAssignedNode(token, start) {
    let current = start;
    do {
      if (current.has(token)) {
        return current;
      }
      current = current.parent ? current.parent : current.target !== defaultElement ? DesignTokenNode.getOrCreate(defaultElement) : null;
    } while (current !== null);
    return null;
  }
  get parent() {
    return childToParent.get(this) || null;
  }
  has(token) {
    return this.assignedValues.has(token);
  }
  get(token) {
    const value = this.store.get(token);
    if (value !== void 0) {
      return value;
    }
    const raw = this.getRaw(token);
    if (raw !== void 0) {
      this.hydrate(token, raw);
      return this.get(token);
    }
  }
  getRaw(token) {
    var _a;
    if (this.assignedValues.has(token)) {
      return this.assignedValues.get(token);
    }
    return (_a = DesignTokenNode.findClosestAssignedNode(token, this)) === null || _a === void 0 ? void 0 : _a.getRaw(token);
  }
  set(token, value) {
    if (DesignTokenImpl.isDerivedDesignTokenValue(this.assignedValues.get(token))) {
      this.tearDownBindingObserver(token);
    }
    this.assignedValues.set(token, value);
    if (DesignTokenImpl.isDerivedDesignTokenValue(value)) {
      this.setupBindingObserver(token, value);
    } else {
      this.store.set(token, value);
    }
  }
  delete(token) {
    this.assignedValues.delete(token);
    this.tearDownBindingObserver(token);
    const upstream = this.getRaw(token);
    if (upstream) {
      this.hydrate(token, upstream);
    } else {
      this.store.delete(token);
    }
  }
  bind() {
    const parent = DesignTokenNode.findParent(this);
    if (parent) {
      parent.appendChild(this);
    }
    for (const key of this.assignedValues.keys()) {
      key.notify(this.target);
    }
  }
  unbind() {
    if (this.parent) {
      const parent = childToParent.get(this);
      parent.removeChild(this);
    }
  }
  appendChild(child) {
    if (child.parent) {
      childToParent.get(child).removeChild(child);
    }
    const reParent = this.children.filter((x) => child.contains(x));
    childToParent.set(child, this);
    this.children.push(child);
    reParent.forEach((x) => child.appendChild(x));
    Observable.getNotifier(this.store).subscribe(child);
    for (const [token, value] of this.store.all()) {
      child.hydrate(token, this.bindingObservers.has(token) ? this.getRaw(token) : value);
    }
  }
  removeChild(child) {
    const childIndex = this.children.indexOf(child);
    if (childIndex !== -1) {
      this.children.splice(childIndex, 1);
    }
    Observable.getNotifier(this.store).unsubscribe(child);
    return child.parent === this ? childToParent.delete(child) : false;
  }
  contains(test) {
    return composedContains(this.target, test.target);
  }
  reflectToCSS(token) {
    if (!this.isReflecting(token)) {
      this.reflecting.add(token);
      DesignTokenNode.cssCustomPropertyReflector.startReflection(token, this.target);
    }
  }
  stopReflectToCSS(token) {
    if (this.isReflecting(token)) {
      this.reflecting.delete(token);
      DesignTokenNode.cssCustomPropertyReflector.stopReflection(token, this.target);
    }
  }
  isReflecting(token) {
    return this.reflecting.has(token);
  }
  handleChange(source, property) {
    const token = DesignTokenImpl.getTokenById(property);
    if (!token) {
      return;
    }
    this.hydrate(token, this.getRaw(token));
  }
  hydrate(token, value) {
    if (!this.has(token)) {
      const observer = this.bindingObservers.get(token);
      if (DesignTokenImpl.isDerivedDesignTokenValue(value)) {
        if (observer) {
          if (observer.source !== value) {
            this.tearDownBindingObserver(token);
            this.setupBindingObserver(token, value);
          }
        } else {
          this.setupBindingObserver(token, value);
        }
      } else {
        if (observer) {
          this.tearDownBindingObserver(token);
        }
        this.store.set(token, value);
      }
    }
  }
  setupBindingObserver(token, source) {
    const binding = new DesignTokenBindingObserver(source, token, this);
    this.bindingObservers.set(token, binding);
    return binding;
  }
  tearDownBindingObserver(token) {
    if (this.bindingObservers.has(token)) {
      this.bindingObservers.get(token).disconnect();
      this.bindingObservers.delete(token);
      return true;
    }
    return false;
  }
};
DesignTokenNode.cssCustomPropertyReflector = new CustomPropertyReflector();
__decorate([
  observable
], DesignTokenNode.prototype, "children", void 0);
function create(nameOrConfig) {
  return DesignTokenImpl.from(nameOrConfig);
}
var DesignToken = Object.freeze({
  create,
  notifyConnection(element) {
    if (!element.isConnected || !DesignTokenNode.existsFor(element)) {
      return false;
    }
    DesignTokenNode.getOrCreate(element).bind();
    return true;
  },
  notifyDisconnection(element) {
    if (element.isConnected || !DesignTokenNode.existsFor(element)) {
      return false;
    }
    DesignTokenNode.getOrCreate(element).unbind();
    return true;
  },
  registerRoot(target = defaultElement) {
    RootStyleSheetTarget.registerRoot(target);
  },
  unregisterRoot(target = defaultElement) {
    RootStyleSheetTarget.unregisterRoot(target);
  }
});

// node_modules/@microsoft/fast-foundation/dist/esm/design-system/design-system.js
var ElementDisambiguation = Object.freeze({
  definitionCallbackOnly: null,
  ignoreDuplicate: Symbol()
});
var elementTypesByTag = /* @__PURE__ */ new Map();
var elementTagsByType = /* @__PURE__ */ new Map();
var rootDesignSystem = null;
var designSystemKey = DI.createInterface((x) => x.cachedCallback((handler) => {
  if (rootDesignSystem === null) {
    rootDesignSystem = new DefaultDesignSystem(null, handler);
  }
  return rootDesignSystem;
}));
var DesignSystem = Object.freeze({
  tagFor(type) {
    return elementTagsByType.get(type);
  },
  responsibleFor(element) {
    const owned = element.$$designSystem$$;
    if (owned) {
      return owned;
    }
    const container = DI.findResponsibleContainer(element);
    return container.get(designSystemKey);
  },
  getOrCreate(node) {
    if (!node) {
      if (rootDesignSystem === null) {
        rootDesignSystem = DI.getOrCreateDOMContainer().get(designSystemKey);
      }
      return rootDesignSystem;
    }
    const owned = node.$$designSystem$$;
    if (owned) {
      return owned;
    }
    const container = DI.getOrCreateDOMContainer(node);
    if (container.has(designSystemKey, false)) {
      return container.get(designSystemKey);
    } else {
      const system = new DefaultDesignSystem(node, container);
      container.register(Registration.instance(designSystemKey, system));
      return system;
    }
  }
});
function extractTryDefineElementParams(params, elementDefinitionType, elementDefinitionCallback) {
  if (typeof params === "string") {
    return {
      name: params,
      type: elementDefinitionType,
      callback: elementDefinitionCallback
    };
  } else {
    return params;
  }
}
var DefaultDesignSystem = class {
  constructor(owner, container) {
    this.owner = owner;
    this.container = container;
    this.designTokensInitialized = false;
    this.prefix = "fast";
    this.shadowRootMode = void 0;
    this.disambiguate = () => ElementDisambiguation.definitionCallbackOnly;
    if (owner !== null) {
      owner.$$designSystem$$ = this;
    }
  }
  withPrefix(prefix) {
    this.prefix = prefix;
    return this;
  }
  withShadowRootMode(mode) {
    this.shadowRootMode = mode;
    return this;
  }
  withElementDisambiguation(callback) {
    this.disambiguate = callback;
    return this;
  }
  withDesignTokenRoot(root) {
    this.designTokenRoot = root;
    return this;
  }
  register(...registrations) {
    const container = this.container;
    const elementDefinitionEntries = [];
    const disambiguate = this.disambiguate;
    const shadowRootMode = this.shadowRootMode;
    const context = {
      elementPrefix: this.prefix,
      tryDefineElement(params, elementDefinitionType, elementDefinitionCallback) {
        const extractedParams = extractTryDefineElementParams(params, elementDefinitionType, elementDefinitionCallback);
        const { name, callback, baseClass } = extractedParams;
        let { type } = extractedParams;
        let elementName = name;
        let typeFoundByName = elementTypesByTag.get(elementName);
        let needsDefine = true;
        while (typeFoundByName) {
          const result = disambiguate(elementName, type, typeFoundByName);
          switch (result) {
            case ElementDisambiguation.ignoreDuplicate:
              return;
            case ElementDisambiguation.definitionCallbackOnly:
              needsDefine = false;
              typeFoundByName = void 0;
              break;
            default:
              elementName = result;
              typeFoundByName = elementTypesByTag.get(elementName);
              break;
          }
        }
        if (needsDefine) {
          if (elementTagsByType.has(type) || type === FoundationElement) {
            type = class extends type {
            };
          }
          elementTypesByTag.set(elementName, type);
          elementTagsByType.set(type, elementName);
          if (baseClass) {
            elementTagsByType.set(baseClass, elementName);
          }
        }
        elementDefinitionEntries.push(new ElementDefinitionEntry(container, elementName, type, shadowRootMode, callback, needsDefine));
      }
    };
    if (!this.designTokensInitialized) {
      this.designTokensInitialized = true;
      if (this.designTokenRoot !== null) {
        DesignToken.registerRoot(this.designTokenRoot);
      }
    }
    container.registerWithContext(context, ...registrations);
    for (const entry of elementDefinitionEntries) {
      entry.callback(entry);
      if (entry.willDefine && entry.definition !== null) {
        entry.definition.define();
      }
    }
    return this;
  }
};
var ElementDefinitionEntry = class {
  constructor(container, name, type, shadowRootMode, callback, willDefine) {
    this.container = container;
    this.name = name;
    this.type = type;
    this.shadowRootMode = shadowRootMode;
    this.callback = callback;
    this.willDefine = willDefine;
    this.definition = null;
  }
  definePresentation(presentation) {
    ComponentPresentation.define(this.name, presentation, this.container);
  }
  defineElement(definition) {
    this.definition = new FASTElementDefinition(this.type, Object.assign(Object.assign({}, definition), { name: this.name }));
  }
  tagFor(type) {
    return DesignSystem.tagFor(type);
  }
};

// node_modules/@microsoft/fast-foundation/dist/esm/utilities/style/focus.js
var focusVisible = canUseFocusVisible() ? "focus-visible" : "focus";

// node_modules/@vscode/webview-ui-toolkit/dist/vscode-design-system.js
function provideVSCodeDesignSystem(element) {
  return DesignSystem.getOrCreate(element).withPrefix("vscode");
}

// node_modules/@vscode/webview-ui-toolkit/dist/utilities/theme/applyTheme.js
function initThemeChangeListener(tokenMappings2) {
  window.addEventListener("load", () => {
    const observer = new MutationObserver(() => {
      applyCurrentTheme(tokenMappings2);
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"]
    });
    applyCurrentTheme(tokenMappings2);
  });
}
function applyCurrentTheme(tokenMappings2) {
  const styles = getComputedStyle(document.body);
  const body = document.querySelector("body");
  if (body) {
    const themeKind = body.getAttribute("data-vscode-theme-kind");
    for (const [vscodeTokenName, toolkitToken] of tokenMappings2) {
      let value = styles.getPropertyValue(vscodeTokenName).toString();
      if (themeKind === "vscode-high-contrast") {
        if (value.length === 0 && toolkitToken.name.includes("background")) {
          value = "transparent";
        }
        if (toolkitToken.name === "button-icon-hover-background") {
          value = "transparent";
        }
      } else if (themeKind === "vscode-high-contrast-light") {
        if (value.length === 0 && toolkitToken.name.includes("background")) {
          switch (toolkitToken.name) {
            case "button-primary-hover-background":
              value = "#0F4A85";
              break;
            case "button-secondary-hover-background":
              value = "transparent";
              break;
            case "button-icon-hover-background":
              value = "transparent";
              break;
          }
        }
      } else {
        if (toolkitToken.name === "contrast-active-border") {
          value = "transparent";
        }
      }
      toolkitToken.setValueFor(body, value);
    }
  }
}

// node_modules/@vscode/webview-ui-toolkit/dist/utilities/design-tokens/create.js
var tokenMappings = /* @__PURE__ */ new Map();
var isThemeListenerInitialized = false;
function create2(name, vscodeThemeVar) {
  const designToken = DesignToken.create(name);
  if (vscodeThemeVar) {
    if (vscodeThemeVar.includes("--fake-vscode-token")) {
      const uniqueId = "id" + Math.random().toString(16).slice(2);
      vscodeThemeVar = `${vscodeThemeVar}-${uniqueId}`;
    }
    tokenMappings.set(vscodeThemeVar, designToken);
  }
  if (!isThemeListenerInitialized) {
    initThemeChangeListener(tokenMappings);
    isThemeListenerInitialized = true;
  }
  return designToken;
}

// node_modules/@vscode/webview-ui-toolkit/dist/design-tokens.js
var background = create2("background", "--vscode-editor-background").withDefault("#1e1e1e");
var borderWidth = create2("border-width").withDefault(1);
var contrastActiveBorder = create2("contrast-active-border", "--vscode-contrastActiveBorder").withDefault("#f38518");
var contrastBorder = create2("contrast-border", "--vscode-contrastBorder").withDefault("#6fc3df");
var cornerRadius = create2("corner-radius").withDefault(0);
var cornerRadiusRound = create2("corner-radius-round").withDefault(2);
var designUnit = create2("design-unit").withDefault(4);
var disabledOpacity = create2("disabled-opacity").withDefault(0.4);
var focusBorder = create2("focus-border", "--vscode-focusBorder").withDefault("#007fd4");
var fontFamily = create2("font-family", "--vscode-font-family").withDefault("-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol");
var fontWeight = create2("font-weight", "--vscode-font-weight").withDefault("400");
var foreground = create2("foreground", "--vscode-foreground").withDefault("#cccccc");
var inputHeight = create2("input-height").withDefault("26");
var inputMinWidth = create2("input-min-width").withDefault("100px");
var typeRampBaseFontSize = create2("type-ramp-base-font-size", "--vscode-font-size").withDefault("13px");
var typeRampBaseLineHeight = create2("type-ramp-base-line-height").withDefault("normal");
var typeRampMinus1FontSize = create2("type-ramp-minus1-font-size").withDefault("11px");
var typeRampMinus1LineHeight = create2("type-ramp-minus1-line-height").withDefault("16px");
var typeRampMinus2FontSize = create2("type-ramp-minus2-font-size").withDefault("9px");
var typeRampMinus2LineHeight = create2("type-ramp-minus2-line-height").withDefault("16px");
var typeRampPlus1FontSize = create2("type-ramp-plus1-font-size").withDefault("16px");
var typeRampPlus1LineHeight = create2("type-ramp-plus1-line-height").withDefault("24px");
var scrollbarWidth = create2("scrollbarWidth").withDefault("10px");
var scrollbarHeight = create2("scrollbarHeight").withDefault("10px");
var scrollbarSliderBackground = create2("scrollbar-slider-background", "--vscode-scrollbarSlider-background").withDefault("#79797966");
var scrollbarSliderHoverBackground = create2("scrollbar-slider-hover-background", "--vscode-scrollbarSlider-hoverBackground").withDefault("#646464b3");
var scrollbarSliderActiveBackground = create2("scrollbar-slider-active-background", "--vscode-scrollbarSlider-activeBackground").withDefault("#bfbfbf66");
var badgeBackground = create2("badge-background", "--vscode-badge-background").withDefault("#4d4d4d");
var badgeForeground = create2("badge-foreground", "--vscode-badge-foreground").withDefault("#ffffff");
var buttonBorder = create2("button-border", "--vscode-button-border").withDefault("transparent");
var buttonIconBackground = create2("button-icon-background").withDefault("transparent");
var buttonIconCornerRadius = create2("button-icon-corner-radius").withDefault("5px");
var buttonIconFocusBorderOffset = create2("button-icon-outline-offset").withDefault(0);
var buttonIconHoverBackground = create2("button-icon-hover-background", "--fake-vscode-token").withDefault("rgba(90, 93, 94, 0.31)");
var buttonIconPadding = create2("button-icon-padding").withDefault("3px");
var buttonPrimaryBackground = create2("button-primary-background", "--vscode-button-background").withDefault("#0e639c");
var buttonPrimaryForeground = create2("button-primary-foreground", "--vscode-button-foreground").withDefault("#ffffff");
var buttonPrimaryHoverBackground = create2("button-primary-hover-background", "--vscode-button-hoverBackground").withDefault("#1177bb");
var buttonSecondaryBackground = create2("button-secondary-background", "--vscode-button-secondaryBackground").withDefault("#3a3d41");
var buttonSecondaryForeground = create2("button-secondary-foreground", "--vscode-button-secondaryForeground").withDefault("#ffffff");
var buttonSecondaryHoverBackground = create2("button-secondary-hover-background", "--vscode-button-secondaryHoverBackground").withDefault("#45494e");
var buttonPaddingHorizontal = create2("button-padding-horizontal").withDefault("11px");
var buttonPaddingVertical = create2("button-padding-vertical").withDefault("4px");
var checkboxBackground = create2("checkbox-background", "--vscode-checkbox-background").withDefault("#3c3c3c");
var checkboxBorder = create2("checkbox-border", "--vscode-checkbox-border").withDefault("#3c3c3c");
var checkboxCornerRadius = create2("checkbox-corner-radius").withDefault(3);
var checkboxForeground = create2("checkbox-foreground", "--vscode-checkbox-foreground").withDefault("#f0f0f0");
var listActiveSelectionBackground = create2("list-active-selection-background", "--vscode-list-activeSelectionBackground").withDefault("#094771");
var listActiveSelectionForeground = create2("list-active-selection-foreground", "--vscode-list-activeSelectionForeground").withDefault("#ffffff");
var listHoverBackground = create2("list-hover-background", "--vscode-list-hoverBackground").withDefault("#2a2d2e");
var dividerBackground = create2("divider-background", "--vscode-settings-dropdownListBorder").withDefault("#454545");
var dropdownBackground = create2("dropdown-background", "--vscode-dropdown-background").withDefault("#3c3c3c");
var dropdownBorder = create2("dropdown-border", "--vscode-dropdown-border").withDefault("#3c3c3c");
var dropdownForeground = create2("dropdown-foreground", "--vscode-dropdown-foreground").withDefault("#f0f0f0");
var dropdownListMaxHeight = create2("dropdown-list-max-height").withDefault("200px");
var inputBackground = create2("input-background", "--vscode-input-background").withDefault("#3c3c3c");
var inputForeground = create2("input-foreground", "--vscode-input-foreground").withDefault("#cccccc");
var inputPlaceholderForeground = create2("input-placeholder-foreground", "--vscode-input-placeholderForeground").withDefault("#cccccc");
var linkActiveForeground = create2("link-active-foreground", "--vscode-textLink-activeForeground").withDefault("#3794ff");
var linkForeground = create2("link-foreground", "--vscode-textLink-foreground").withDefault("#3794ff");
var progressBackground = create2("progress-background", "--vscode-progressBar-background").withDefault("#0e70c0");
var panelTabActiveBorder = create2("panel-tab-active-border", "--vscode-panelTitle-activeBorder").withDefault("#e7e7e7");
var panelTabActiveForeground = create2("panel-tab-active-foreground", "--vscode-panelTitle-activeForeground").withDefault("#e7e7e7");
var panelTabForeground = create2("panel-tab-foreground", "--vscode-panelTitle-inactiveForeground").withDefault("#e7e7e799");
var panelViewBackground = create2("panel-view-background", "--vscode-panel-background").withDefault("#1e1e1e");
var panelViewBorder = create2("panel-view-border", "--vscode-panel-border").withDefault("#80808059");
var tagCornerRadius = create2("tag-corner-radius").withDefault("2px");

// node_modules/@vscode/webview-ui-toolkit/dist/data-grid/data-grid.styles.js
var dataGridStyles = (context, definition) => css`
	:host {
		display: flex;
		position: relative;
		flex-direction: column;
		width: 100%;
	}
`;

// node_modules/@vscode/webview-ui-toolkit/dist/data-grid/data-grid-row.styles.js
var dataGridRowStyles = (context, definition) => css`
	:host {
		display: grid;
		padding: calc((${designUnit} / 4) * 1px) 0;
		box-sizing: border-box;
		width: 100%;
		background: transparent;
	}
	:host(.header) {
	}
	:host(.sticky-header) {
		background: ${background};
		position: sticky;
		top: 0;
	}
	:host(:hover) {
		background: ${listHoverBackground};
		outline: 1px dotted ${contrastActiveBorder};
		outline-offset: -1px;
	}
`;

// node_modules/@vscode/webview-ui-toolkit/dist/data-grid/data-grid-cell.styles.js
var dataGridCellStyles = (context, definition) => css`
	:host {
		padding: calc(${designUnit} * 1px) calc(${designUnit} * 3px);
		color: ${foreground};
		opacity: 1;
		box-sizing: border-box;
		font-family: ${fontFamily};
		font-size: ${typeRampBaseFontSize};
		line-height: ${typeRampBaseLineHeight};
		font-weight: 400;
		border: solid calc(${borderWidth} * 1px) transparent;
		border-radius: calc(${cornerRadius} * 1px);
	}
	:host(.column-header) {
		font-weight: 600;
	}
	:host(:${focusVisible}),
	:host(:focus),
	:host(:active) {
		background: ${listActiveSelectionBackground};
		border: solid calc(${borderWidth} * 1px) ${focusBorder};
		color: ${listActiveSelectionForeground};
		outline: none;
	}
	:host(:${focusVisible}) ::slotted(*),
	:host(:focus) ::slotted(*),
	:host(:active) ::slotted(*) {
		color: ${listActiveSelectionForeground} !important;
	}
	slot {
		white-space: pre-line;
    display: flex;
		overflow-wrap: anywhere;
	}
`;

// node_modules/@vscode/webview-ui-toolkit/dist/data-grid/index.js
var DataGrid2 = class extends DataGrid {
  connectedCallback() {
    super.connectedCallback();
    const ariaLabelValue = this.getAttribute("aria-label");
    if (!ariaLabelValue) {
      this.setAttribute("aria-label", "Data Grid");
    }
  }
};
var vsCodeDataGrid = DataGrid2.compose({
  baseName: "data-grid",
  baseClass: DataGrid,
  template: dataGridTemplate,
  styles: dataGridStyles
});
var DataGridRow2 = class extends DataGridRow {
};
var vsCodeDataGridRow = DataGridRow2.compose({
  baseName: "data-grid-row",
  baseClass: DataGridRow,
  template: dataGridRowTemplate,
  styles: dataGridRowStyles
});
var DataGridCell2 = class extends DataGridCell {
};
var vsCodeDataGridCell = DataGridCell2.compose({
  baseName: "data-grid-cell",
  baseClass: DataGridCell,
  template: dataGridCellTemplate,
  styles: dataGridCellStyles
});

// src/webview/main.ts
provideVSCodeDesignSystem().register(vsCodeDataGrid(), vsCodeDataGridCell(), vsCodeDataGridRow());
window.addEventListener("load", main);
function main() {
  const basicDataGrid = document.getElementById("basic-grid");
  basicDataGrid.rowsData = [
    {
      name: "Isadora Meyers",
      email: "ac.mi@icloud.couk",
      phone: "(523) 454-7331",
      country: "Chile"
    },
    {
      name: "Tasha Hess\n\nHere's some text that already\ncomes with newlines included!",
      email: "tasha.hess@protonmail.couk",
      phone: "(578) 194-4268",
      country: "Canada"
    },
    {
      name: "Dustin Bell",
      email: "pede.sagittis.augue@yahoo.com",
      phone: "(852) 676-6719",
      country: "Brazil"
    },
    {
      name: "Damon Haynes",
      email: "nisl.arcu.iaculis@aol.org",
      phone: "(311) 205-2738",
      country: "Indonesia"
    },
    {
      name: "Caleb Vazquez",
      email: "interdum.feugiat.sed@yahoo.edu",
      phone: "(454) 800-7845",
      country: "Peru"
    },
    {
      name: "Flavia Herman",
      email: "magna.tellus.faucibus@aol.org",
      phone: "(456) 891-2764",
      country: "Australia"
    },
    {
      name: "Stella Raymond",
      email: "lorem.eu.metus@hotmail.net",
      phone: "(323) 241-3541",
      country: "United Kingdom"
    },
    {
      name: "Lisandra Brooks",
      email: "sapien.cursus.in@yahoo.ca",
      phone: "(175) 344-7646",
      country: "Sweden"
    },
    {
      name: "Stone Fischer",
      email: "porttitor.eros@google.ca",
      phone: "(845) 908-7645",
      country: "Ukraine"
    },
    {
      name: "Demetrius Strickland",
      email: "mi.enim@outlook.net",
      phone: "(733) 706-8928",
      country: "Spain"
    }
  ];
  basicDataGrid.columnDefinitions = [
    { columnDataKey: "name", title: "Name" },
    { columnDataKey: "email", title: "Email" },
    { columnDataKey: "phone", title: "Phone Number" },
    { columnDataKey: "country", title: "Country" }
  ];
  initEditableDataGrid("basic-grid");
}
function initEditableDataGrid(id) {
  const grid = document.getElementById(id);
  grid?.addEventListener("cell-focused", (e) => {
    const cell = e.target;
    if (!cell || cell.role !== "gridcell") {
      return;
    }
    if (cell.className === "column-header") {
      return;
    }
    const handleKeydownClosure = (e2) => {
      handleKeydown(e2, cell);
    };
    const handleClickClosure = () => {
      setCellEditable(cell);
    };
    const handleBlurClosure = () => {
      syncCellChanges(cell);
      unsetCellEditable(cell);
      cell.removeEventListener("blur", handleBlurClosure);
      cell.removeEventListener("keydown", handleKeydownClosure);
      cell.removeEventListener("click", handleClickClosure);
    };
    cell.addEventListener("keydown", handleKeydownClosure);
    cell.addEventListener("click", handleClickClosure, { once: true });
    cell.addEventListener("blur", handleBlurClosure);
  });
}
function setCellEditable(cell) {
  cell.setAttribute("contenteditable", "true");
  selectCellText(cell);
}
function handleKeydown(e, cell) {
  if (!cell.hasAttribute("contenteditable") || cell.getAttribute("contenteditable") === "false") {
    if (e.key === "Enter") {
      e.preventDefault();
      setCellEditable(cell);
    }
  } else {
    if (e.key === "Enter" && e.shiftKey) {
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown") {
    } else if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      syncCellChanges(cell);
      unsetCellEditable(cell);
    }
  }
}
function unsetCellEditable(cell) {
  cell.setAttribute("contenteditable", "false");
  deselectCellText();
}
function selectCellText(cell) {
  const selection = window.getSelection();
  if (selection) {
    const range2 = document.createRange();
    range2.selectNodeContents(cell);
    selection.removeAllRanges();
    selection.addRange(range2);
  }
}
function deselectCellText() {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}
function syncCellChanges(cell) {
  const column = cell.columnDefinition;
  const row = cell.rowData;
  if (column && row) {
    const originalValue = row[column.columnDataKey];
    const newValue = cell.innerText;
    if (originalValue !== newValue) {
      row[column.columnDataKey] = newValue;
    }
  }
}
/*! Bundled license information:

tslib/tslib.es6.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)
*/
//# sourceMappingURL=webview.js.map
