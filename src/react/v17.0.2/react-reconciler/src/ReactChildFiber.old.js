/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactElement} from 'shared/ReactElementType';
import type {ReactPortal} from 'shared/ReactTypes';
import type {BlockComponent} from 'react/src/ReactBlock';
import type {LazyComponent} from 'react/src/ReactLazy';
import type {Fiber} from './ReactInternalTypes';
import type {Lanes} from './ReactFiberLane';

import getComponentName from 'shared/getComponentName';
import {Placement, Deletion} from './ReactFiberFlags';
import {
  getIteratorFn,
  REACT_ELEMENT_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_LAZY_TYPE,
  REACT_BLOCK_TYPE,
} from 'shared/ReactSymbols';
import {
  FunctionComponent,
  ClassComponent,
  HostText,
  HostPortal,
  ForwardRef,
  Fragment,
  SimpleMemoComponent,
  Block,
} from './ReactWorkTags';
import invariant from 'shared/invariant';
import {
  warnAboutStringRefs,
  enableBlocksAPI,
  enableLazyElements,
} from 'shared/ReactFeatureFlags';

import {
  createWorkInProgress,
  resetWorkInProgress,
  createFiberFromElement,
  createFiberFromFragment,
  createFiberFromText,
  createFiberFromPortal,
} from './ReactFiber.old';
import {emptyRefsObject} from './ReactFiberClassComponent.old';
import {isCompatibleFamilyForHotReloading} from './ReactFiberHotReloading.old';
import {StrictMode} from './ReactTypeOfMode';

let didWarnAboutMaps;
let didWarnAboutGenerators;
let didWarnAboutStringRefs;
let ownerHasKeyUseWarning;
let ownerHasFunctionTypeWarning;
let warnForMissingKey = (child: mixed, returnFiber: Fiber) => {};

if (__DEV__) {
  didWarnAboutMaps = false;
  didWarnAboutGenerators = false;
  didWarnAboutStringRefs = {};

  /**
   * Warn if there's no key explicitly set on dynamic arrays of children or
   * object keys are not valid. This allows us to keep track of children between
   * updates.
   */
  ownerHasKeyUseWarning = {};
  ownerHasFunctionTypeWarning = {};

  warnForMissingKey = (child: mixed, returnFiber: Fiber) => {
    if (child === null || typeof child !== 'object') {
      return;
    }
    if (!child._store || child._store.validated || child.key != null) {
      return;
    }
    invariant(
      typeof child._store === 'object',
      'React Component in warnForMissingKey should have a _store. ' +
        'This error is likely caused by a bug in React. Please file an issue.',
    );
    child._store.validated = true;

    const componentName = getComponentName(returnFiber.type) || 'Component';

    if (ownerHasKeyUseWarning[componentName]) {
      return;
    }
    ownerHasKeyUseWarning[componentName] = true;

    console.error(
      'Each child in a list should have a unique ' +
        '"key" prop. See https://reactjs.org/link/warning-keys for ' +
        'more information.',
    );
  };
}

const isArray = Array.isArray;

function coerceRef(
  returnFiber: Fiber,
  current: Fiber | null,
  element: ReactElement,
) {
  const mixedRef = element.ref;
  if (
    mixedRef !== null &&
    typeof mixedRef !== 'function' &&
    typeof mixedRef !== 'object'
  ) {
    if (__DEV__) {
      // TODO: Clean this up once we turn on the string ref warning for
      // everyone, because the strict mode case will no longer be relevant
      if (
        (returnFiber.mode & StrictMode || warnAboutStringRefs) &&
        // We warn in ReactElement.js if owner and self are equal for string refs
        // because these cannot be automatically converted to an arrow function
        // using a codemod. Therefore, we don't have to warn about string refs again.
        !(
          element._owner &&
          element._self &&
          element._owner.stateNode !== element._self
        )
      ) {
        const componentName = getComponentName(returnFiber.type) || 'Component';
        if (!didWarnAboutStringRefs[componentName]) {
          if (warnAboutStringRefs) {
            console.error(
              'Component "%s" contains the string ref "%s". Support for string refs ' +
                'will be removed in a future major release. We recommend using ' +
                'useRef() or createRef() instead. ' +
                'Learn more about using refs safely here: ' +
                'https://reactjs.org/link/strict-mode-string-ref',
              componentName,
              mixedRef,
            );
          } else {
            console.error(
              'A string ref, "%s", has been found within a strict mode tree. ' +
                'String refs are a source of potential bugs and should be avoided. ' +
                'We recommend using useRef() or createRef() instead. ' +
                'Learn more about using refs safely here: ' +
                'https://reactjs.org/link/strict-mode-string-ref',
              mixedRef,
            );
          }
          didWarnAboutStringRefs[componentName] = true;
        }
      }
    }

    if (element._owner) {
      const owner: ?Fiber = (element._owner: any);
      let inst;
      if (owner) {
        const ownerFiber = ((owner: any): Fiber);
        invariant(
          ownerFiber.tag === ClassComponent,
          'Function components cannot have string refs. ' +
            'We recommend using useRef() instead. ' +
            'Learn more about using refs safely here: ' +
            'https://reactjs.org/link/strict-mode-string-ref',
        );
        inst = ownerFiber.stateNode;
      }
      invariant(
        inst,
        'Missing owner for string ref %s. This error is likely caused by a ' +
          'bug in React. Please file an issue.',
        mixedRef,
      );
      const stringRef = '' + mixedRef;
      // Check if previous string ref matches new string ref
      if (
        current !== null &&
        current.ref !== null &&
        typeof current.ref === 'function' &&
        current.ref._stringRef === stringRef
      ) {
        return current.ref;
      }
      const ref = function(value) {
        let refs = inst.refs;
        if (refs === emptyRefsObject) {
          // This is a lazy pooled frozen object, so we need to initialize.
          refs = inst.refs = {};
        }
        if (value === null) {
          delete refs[stringRef];
        } else {
          refs[stringRef] = value;
        }
      };
      ref._stringRef = stringRef;
      return ref;
    } else {
      invariant(
        typeof mixedRef === 'string',
        'Expected ref to be a function, a string, an object returned by React.createRef(), or null.',
      );
      invariant(
        element._owner,
        'Element ref was specified as a string (%s) but no owner was set. This could happen for one of' +
          ' the following reasons:\n' +
          '1. You may be adding a ref to a function component\n' +
          "2. You may be adding a ref to a component that was not created inside a component's render method\n" +
          '3. You have multiple copies of React loaded\n' +
          'See https://reactjs.org/link/refs-must-have-owner for more information.',
        mixedRef,
      );
    }
  }
  return mixedRef;
}

function throwOnInvalidObjectType(returnFiber: Fiber, newChild: Object) {
  if (returnFiber.type !== 'textarea') {
    invariant(
      false,
      'Objects are not valid as a React child (found: %s). ' +
        'If you meant to render a collection of children, use an array ' +
        'instead.',
      Object.prototype.toString.call(newChild) === '[object Object]'
        ? 'object with keys {' + Object.keys(newChild).join(', ') + '}'
        : newChild,
    );
  }
}

function warnOnFunctionType(returnFiber: Fiber) {
  if (__DEV__) {
    const componentName = getComponentName(returnFiber.type) || 'Component';

    if (ownerHasFunctionTypeWarning[componentName]) {
      return;
    }
    ownerHasFunctionTypeWarning[componentName] = true;

    console.error(
      'Functions are not valid as a React child. This may happen if ' +
        'you return a Component instead of <Component /> from render. ' +
        'Or maybe you meant to call this function rather than return it.',
    );
  }
}

// We avoid inlining this to avoid potential deopts from using try/catch.
/** @noinline */
function resolveLazyType<T, P>(
  lazyComponent: LazyComponent<T, P>,
): LazyComponent<T, P> | T {
  try {
    // If we can, let's peek at the resulting type.
    const payload = lazyComponent._payload;
    const init = lazyComponent._init;
    return init(payload);
  } catch (x) {
    // Leave it in place and let it throw again in the begin phase.
    return lazyComponent;
  }
}

// This wrapper function exists because I expect to clone the code in each path
// to be able to optimize each path individually by branching early. This needs
// a compiler or we can do it manually. Helpers that don't need this branching
// live outside of this function.
function ChildReconciler(shouldTrackSideEffects) {
  // 标记要删除的节点
  function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
    if (!shouldTrackSideEffects) {
      // Noop.
      return;
    }
    // Deletions are added in reversed order so we add it to the front.
    // At this point, the return fiber's effect list is empty except for
    // deletions, so we can just append the deletion to the list. The remaining
    // effects aren't added until the complete phase. Once we implement
    // resuming, this may not be true.
    const last = returnFiber.lastEffect;
    if (last !== null) {
      last.nextEffect = childToDelete;
      returnFiber.lastEffect = childToDelete;
    } else {
      returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
    }
    childToDelete.nextEffect = null;
    childToDelete.flags = Deletion;
  }

  function deleteRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
  ): null {
    if (!shouldTrackSideEffects) {
      // Noop.
      return null;
    }

    // TODO: For the shouldClone case, this could be micro-optimized a bit by
    // assuming that after the first child we've already added everything.
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  // 生成key：fiber的Map
  // 注意如果没有key，会使用所在位置当作key
  function mapRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber,
  ): Map<string | number, Fiber> {
    // Add the remaining children to a temporary map so that we can find them by
    // keys quickly. Implicit (null) keys get added to this set with their index
    // instead.
    const existingChildren: Map<string | number, Fiber> = new Map();

    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        // 没有key则用下标当作key
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }

    return existingChildren;
  }

  function useFiber(fiber: Fiber, pendingProps: mixed): Fiber {
    // We currently set sibling to null and index to 0 here because it is easy
    // to forget to do before returning it. E.g. for the single child case.
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  function placeChild(
    newFiber: Fiber,
    lastPlacedIndex: number,
    newIndex: number,
  ): number {
    // 记录新节点在渲染的位置
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
      // Noop.
      return lastPlacedIndex;
    }
    // 获取关联的旧节点
    const current = newFiber.alternate;
    // 若存在旧节点
    if (current !== null) {
      // 获取旧节点，在上一次渲染的位置
      const oldIndex = current.index;
      // 如果在最后一次复用节点的前面
      // 表示新节点可以需要移动放置在这个位置
      /**
       * 比如 oldfiber为 A B C D E
       * newFiber  A D B C E
       * 遍历新的放置
       * D 在后面不动返回D的位置（最后一次可复用的位置为D
       * B 位置小于D
       * 需要标记B移动（即放置在D后面这个位置
       * C 同理
       * ...
       */
      if (oldIndex < lastPlacedIndex) {
        // This is a move.
        newFiber.flags = Placement;
        return lastPlacedIndex;
      } else {
        // This item can stay in place.
        // 如果旧位置大于大于最近一次复用位置
        // 返回这个位置索引，这个节点不需要移动
        // 所以尽量不要把后面的节点移动到前面，避免过多的重新放置
        return oldIndex;
      }
    } else {
      // This is an insertion.
      // 不存在关联的旧节点，直接标记放置
      newFiber.flags = Placement;
      return lastPlacedIndex;
    }
  }

  function placeSingleChild(newFiber: Fiber): Fiber {
    // This is simpler for the single child case. We only need to do a
    // placement for inserting new children.
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags = Placement;
    }
    return newFiber;
  }

  function updateTextNode(
    returnFiber: Fiber,
    current: Fiber | null,
    textContent: string,
    lanes: Lanes,
  ) {
    if (current === null || current.tag !== HostText) {
      // Insert
      const created = createFiberFromText(textContent, returnFiber.mode, lanes);
      created.return = returnFiber;
      return created;
    } else {
      // Update
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: ReactElement,
    lanes: Lanes,
  ): Fiber {
    if (current !== null) {
      if (
        current.elementType === element.type ||
        // Keep this check inline so it only runs on the false path:
        (__DEV__ ? isCompatibleFamilyForHotReloading(current, element) : false)
      ) {
        // Move based on index
        const existing = useFiber(current, element.props);
        existing.ref = coerceRef(returnFiber, current, element);
        existing.return = returnFiber;
        if (__DEV__) {
          existing._debugSource = element._source;
          existing._debugOwner = element._owner;
        }
        return existing;
      } else if (enableBlocksAPI && current.tag === Block) {
        // The new Block might not be initialized yet. We need to initialize
        // it in case initializing it turns out it would match.
        let type = element.type;
        if (type.$$typeof === REACT_LAZY_TYPE) {
          type = resolveLazyType(type);
        }
        if (
          type.$$typeof === REACT_BLOCK_TYPE &&
          ((type: any): BlockComponent<any, any>)._render ===
            (current.type: BlockComponent<any, any>)._render
        ) {
          // Same as above but also update the .type field.
          const existing = useFiber(current, element.props);
          existing.return = returnFiber;
          existing.type = type;
          if (__DEV__) {
            existing._debugSource = element._source;
            existing._debugOwner = element._owner;
          }
          return existing;
        }
      }
    }
    // Insert
    const created = createFiberFromElement(element, returnFiber.mode, lanes);
    created.ref = coerceRef(returnFiber, current, element);
    created.return = returnFiber;
    return created;
  }

  function updatePortal(
    returnFiber: Fiber,
    current: Fiber | null,
    portal: ReactPortal,
    lanes: Lanes,
  ): Fiber {
    if (
      current === null ||
      current.tag !== HostPortal ||
      current.stateNode.containerInfo !== portal.containerInfo ||
      current.stateNode.implementation !== portal.implementation
    ) {
      // Insert
      const created = createFiberFromPortal(portal, returnFiber.mode, lanes);
      created.return = returnFiber;
      return created;
    } else {
      // Update
      const existing = useFiber(current, portal.children || []);
      existing.return = returnFiber;
      return existing;
    }
  }

  function updateFragment(
    returnFiber: Fiber,
    current: Fiber | null,
    fragment: Iterable<*>,
    lanes: Lanes,
    key: null | string,
  ): Fiber {
    if (current === null || current.tag !== Fragment) {
      // Insert
      const created = createFiberFromFragment(
        fragment,
        returnFiber.mode,
        lanes,
        key,
      );
      created.return = returnFiber;
      return created;
    } else {
      // Update
      const existing = useFiber(current, fragment);
      existing.return = returnFiber;
      return existing;
    }
  }

  function createChild(
    returnFiber: Fiber,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      const created = createFiberFromText(
        '' + newChild,
        returnFiber.mode,
        lanes,
      );
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(
            newChild,
            returnFiber.mode,
            lanes,
          );
          created.ref = coerceRef(returnFiber, null, newChild);
          created.return = returnFiber;
          return created;
        }
        case REACT_PORTAL_TYPE: {
          const created = createFiberFromPortal(
            newChild,
            returnFiber.mode,
            lanes,
          );
          created.return = returnFiber;
          return created;
        }
        case REACT_LAZY_TYPE: {
          if (enableLazyElements) {
            const payload = newChild._payload;
            const init = newChild._init;
            return createChild(returnFiber, init(payload), lanes);
          }
        }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        const created = createFiberFromFragment(
          newChild,
          returnFiber.mode,
          lanes,
          null,
        );
        created.return = returnFiber;
        return created;
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    if (__DEV__) {
      if (typeof newChild === 'function') {
        warnOnFunctionType(returnFiber);
      }
    }

    return null;
  }

  function updateSlot(
    returnFiber: Fiber,
    oldFiber: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    // Update the fiber if the keys match, otherwise return null.

    const key = oldFiber !== null ? oldFiber.key : null;

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys. If the previous node is implicitly keyed
      // we can continue to replace it without aborting even if it is not a text
      // node.
      if (key !== null) {
        return null;
      }
      return updateTextNode(returnFiber, oldFiber, '' + newChild, lanes);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          // 新旧key相同
          if (newChild.key === key) {
            if (newChild.type === REACT_FRAGMENT_TYPE) {
              return updateFragment(
                returnFiber,
                oldFiber,
                newChild.props.children,
                lanes,
                key,
              );
            }
            // type相同返回复用fiber
            return updateElement(returnFiber, oldFiber, newChild, lanes);
          } else {
            // key不同返回null
            return null;
          }
        }
        case REACT_PORTAL_TYPE: {
          if (newChild.key === key) {
            return updatePortal(returnFiber, oldFiber, newChild, lanes);
          } else {
            return null;
          }
        }
        case REACT_LAZY_TYPE: {
          if (enableLazyElements) {
            const payload = newChild._payload;
            const init = newChild._init;
            return updateSlot(returnFiber, oldFiber, init(payload), lanes);
          }
        }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        if (key !== null) {
          return null;
        }

        return updateFragment(returnFiber, oldFiber, newChild, lanes, null);
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    if (__DEV__) {
      if (typeof newChild === 'function') {
        warnOnFunctionType(returnFiber);
      }
    }

    return null;
  }

  function updateFromMap(
    existingChildren: Map<string | number, Fiber>,
    returnFiber: Fiber,
    newIdx: number,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      // Text nodes don't have keys, so we neither have to check the old nor
      // new node for the key. If both are text nodes, they match.
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild, lanes);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key,
            ) || null;
          if (newChild.type === REACT_FRAGMENT_TYPE) {
            return updateFragment(
              returnFiber,
              matchedFiber,
              newChild.props.children,
              lanes,
              newChild.key,
            );
          }
          return updateElement(returnFiber, matchedFiber, newChild, lanes);
        }
        case REACT_PORTAL_TYPE: {
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key,
            ) || null;
          return updatePortal(returnFiber, matchedFiber, newChild, lanes);
        }
        case REACT_LAZY_TYPE:
          if (enableLazyElements) {
            const payload = newChild._payload;
            const init = newChild._init;
            return updateFromMap(
              existingChildren,
              returnFiber,
              newIdx,
              init(payload),
              lanes,
            );
          }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        const matchedFiber = existingChildren.get(newIdx) || null;
        return updateFragment(returnFiber, matchedFiber, newChild, lanes, null);
      }

      throwOnInvalidObjectType(returnFiber, newChild);
    }

    if (__DEV__) {
      if (typeof newChild === 'function') {
        warnOnFunctionType(returnFiber);
      }
    }

    return null;
  }

  /**
   * Warns if there is a duplicate or missing key
   */
  function warnOnInvalidKey(
    child: mixed,
    knownKeys: Set<string> | null,
    returnFiber: Fiber,
  ): Set<string> | null {
    if (__DEV__) {
      if (typeof child !== 'object' || child === null) {
        return knownKeys;
      }
      switch (child.$$typeof) {
        case REACT_ELEMENT_TYPE:
        case REACT_PORTAL_TYPE:
          warnForMissingKey(child, returnFiber);
          const key = child.key;
          if (typeof key !== 'string') {
            break;
          }
          if (knownKeys === null) {
            knownKeys = new Set();
            knownKeys.add(key);
            break;
          }
          if (!knownKeys.has(key)) {
            knownKeys.add(key);
            break;
          }
          console.error(
            'Encountered two children with the same key, `%s`. ' +
              'Keys should be unique so that components maintain their identity ' +
              'across updates. Non-unique keys may cause children to be ' +
              'duplicated and/or omitted — the behavior is unsupported and ' +
              'could change in a future version.',
            key,
          );
          break;
        case REACT_LAZY_TYPE:
          if (enableLazyElements) {
            const payload = child._payload;
            const init = (child._init: any);
            warnOnInvalidKey(init(payload), knownKeys, returnFiber);
            break;
          }
        // We intentionally fallthrough here if enableLazyElements is not on.
        // eslint-disable-next-lined no-fallthrough
        default:
          break;
      }
    }
    return knownKeys;
  }
  // 多节点diff
  function reconcileChildrenArray(
    returnFiber: Fiber,  // returnFiber：currentFirstChild的父级fiber节点
    currentFirstChild: Fiber | null,  // currentFirstChild：当前执行更新任务的WIP（fiber）节点
    newChildren: Array<*>, //  newChildren：组件的render方法渲染出的新的ReactElement节点
    lanes: Lanes, //lanes：优先级相关
  ): Fiber | null {
    // This algorithm can't optimize by searching from both ends since we
    // don't have backpointers on fibers. I'm trying to see how far we can get
    // with that model. If it ends up not being worth the tradeoffs, we can
    // add it later.

    // Even with a two ended optimization, we'd want to optimize for the case
    // where there are few changes and brute force the comparison instead of
    // going for the Map. It'd like to explore hitting that path first in
    // forward-only mode and only go for the Map once we notice that we need
    // lots of look ahead. This doesn't handle reversal as well as two ended
    // search but that's unusual. Besides, for the two ended optimization to
    // work on Iterables, we'd need to copy the whole set.

    // In this first iteration, we'll just live with hitting the bad case
    // (adding everything to a Map) in for every insert/move.

    // If you change this code, also update reconcileChildrenIterator() which
    // uses the same algorithm.

    if (__DEV__) {
      // First, validate keys.
      let knownKeys = null;
      for (let i = 0; i < newChildren.length; i++) {
        const child = newChildren[i];
        knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
      }
    }

    // 构建后的第一个子节点，也就是 return 回去的节点(diff之后的新fiber链表的第一个fiber)
    let resultingFirstChild: Fiber | null = null;
    // 前一个新节点，用来接 sibling 指针的
    let previousNewFiber: Fiber | null = null;
    // 旧节点遍历指针, 新的child节点会和它进行比较
    let oldFiber = currentFirstChild;
    // 最后一个可复用的节点在oldFiber中的位置索引
    let lastPlacedIndex = 0;
    // newChildren的遍历索引, 存储遍历到的新节点的索引
    let newIdx = 0;
    // oldFiber的遍历索引, 记录目前遍历到的oldFiber的下一个节点
    let nextOldFiber = null;
    // 第一次遍历， 同时遍历oldFiber和newChildren
    // 该轮遍历来处理节点更新，依据节点是否可复用来决定是否中断遍历
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      // 老节点的位置大于新节点的位置, 不满足第一轮遍历规则（按序遍历
      // newChildren遍历完了，oldFiber链没有遍历完，此时需要中断遍历
      if (oldFiber.index > newIdx) {
        // 记录当前遍历位置
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      // 复用处理
      // 生成新的节点，判断key与tag是否相同就在updateSlot中
      // 对DOM类型的元素来说，key 和 tag都相同才会复用oldFiber
      // 并返回出去，否则返回null
      const newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        lanes,
      );
      // newFiber为 null说明 key 或 tag 不同，节点不可复用，中断遍历
      if (newFiber === null) {
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        if (oldFiber === null) {
          // 上面设置了null，需要还原老节点遍历位置
          oldFiber = nextOldFiber;
        }
        break;
      }
      if (shouldTrackSideEffects) {
        // 老节点存在， 新节点与之没有关联关系，标记删除老节点
        if (oldFiber && newFiber.alternate === null) {
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          // newFiber.alternate 等同于 oldFiber.alternate
          // oldFiber为WIP节点，它的alternate 就是 current节点

          // oldFiber存在，并且经过更新后的新fiber节点它还没有current节点,
          // 说明更新后展现在屏幕上不会有current节点，而更新后WIP
          // 节点会称为current节点，所以需要删除已有的WIP节点
          deleteChild(returnFiber, oldFiber);
        }
      }
      // 记录固定节点的位置
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      // 没有前一个新节点，表示是新节点的头一个
      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        // 把列表头关联给resultingFirstChild
        resultingFirstChild = newFiber;
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        // 正常的链表链接
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }


    // 第一次遍历后，newChildren遍历完成，表示新的节点都有可以复用的节点，把oldfiber中剩下的都标记删除, 返回新建结果
    if (newIdx === newChildren.length) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    // oldfiber遍历完， 表示有新增节点
    // 继续遍历剩下的新节点，拼在previousNewFiber.sibling上
    // 返回构建结果头节点
    if (oldFiber === null) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    // Add all children to a key map for quick lookups.
    // 执行到这是都没遍历完的情况，把剩余的旧子节点放入一个以key为键,值为oldFiber节点的map中
    // 这样在基于oldFiber节点新建新的fiber节点时，可以通过key快速地找出oldFiber
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    // Keep scanning and use the map to restore deleted items as moves.
    // 遍历剩下的新节点
    for (; newIdx < newChildren.length; newIdx++) {
      // 查找能否复用旧节点，可以则复用，不能则重新创建
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes,
      );
      // 创建好了新fiber
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          // 存在旧节点
          if (newFiber.alternate !== null) {
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            // 如果newFiber的alternate不为空，则说明newFiber不是新增的。
            // 也就说明着它是基于map中的oldFiber节点新建的,意味着oldFiber已经被使用了
            // 所以删除旧节点的映射, 因为下面会将剩余的节点全部标记删除
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key,
            );
          }
        }
        // 放置逻辑
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    if (shouldTrackSideEffects) {
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      // 删除剩余的旧节点
      existingChildren.forEach(child => deleteChild(returnFiber, child));
    }

    return resultingFirstChild;
  }

  function reconcileChildrenIterator(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildrenIterable: Iterable<*>,
    lanes: Lanes,
  ): Fiber | null {
    // This is the same implementation as reconcileChildrenArray(),
    // but using the iterator instead.

    const iteratorFn = getIteratorFn(newChildrenIterable);
    invariant(
      typeof iteratorFn === 'function',
      'An object is not an iterable. This error is likely caused by a bug in ' +
        'React. Please file an issue.',
    );

    if (__DEV__) {
      // We don't support rendering Generators because it's a mutation.
      // See https://github.com/facebook/react/issues/12995
      if (
        typeof Symbol === 'function' &&
        // $FlowFixMe Flow doesn't know about toStringTag
        newChildrenIterable[Symbol.toStringTag] === 'Generator'
      ) {
        if (!didWarnAboutGenerators) {
          console.error(
            'Using Generators as children is unsupported and will likely yield ' +
              'unexpected results because enumerating a generator mutates it. ' +
              'You may convert it to an array with `Array.from()` or the ' +
              '`[...spread]` operator before rendering. Keep in mind ' +
              'you might need to polyfill these features for older browsers.',
          );
        }
        didWarnAboutGenerators = true;
      }

      // Warn about using Maps as children
      if ((newChildrenIterable: any).entries === iteratorFn) {
        if (!didWarnAboutMaps) {
          console.error(
            'Using Maps as children is not supported. ' +
              'Use an array of keyed ReactElements instead.',
          );
        }
        didWarnAboutMaps = true;
      }

      // First, validate keys.
      // We'll get a different iterator later for the main pass.
      const newChildren = iteratorFn.call(newChildrenIterable);
      if (newChildren) {
        let knownKeys = null;
        let step = newChildren.next();
        for (; !step.done; step = newChildren.next()) {
          const child = step.value;
          knownKeys = warnOnInvalidKey(child, knownKeys, returnFiber);
        }
      }
    }

    const newChildren = iteratorFn.call(newChildrenIterable);
    invariant(newChildren != null, 'An iterable object provided no iterator.');

    let resultingFirstChild: Fiber | null = null;
    let previousNewFiber: Fiber | null = null;

    let oldFiber = currentFirstChild;
    let lastPlacedIndex = 0;
    let newIdx = 0;
    let nextOldFiber = null;

    let step = newChildren.next();
    for (
      ;
      oldFiber !== null && !step.done;
      newIdx++, step = newChildren.next()
    ) {
      if (oldFiber.index > newIdx) {
        nextOldFiber = oldFiber;
        oldFiber = null;
      } else {
        nextOldFiber = oldFiber.sibling;
      }
      const newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
      if (newFiber === null) {
        // TODO: This breaks on empty slots like null children. That's
        // unfortunate because it triggers the slow path all the time. We need
        // a better way to communicate whether this was a miss or null,
        // boolean, undefined, etc.
        if (oldFiber === null) {
          oldFiber = nextOldFiber;
        }
        break;
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          // We matched the slot, but we didn't reuse the existing fiber, so we
          // need to delete the existing child.
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        // TODO: Defer siblings if we're not at the right index for this slot.
        // I.e. if we had null values before, then we want to defer this
        // for each null value. However, we also don't want to call updateSlot
        // with the previous one.
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }

    if (step.done) {
      // We've reached the end of the new children. We can delete the rest.
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }

    if (oldFiber === null) {
      // If we don't have any more existing children we can choose a fast path
      // since the rest will all be insertions.
      for (; !step.done; newIdx++, step = newChildren.next()) {
        const newFiber = createChild(returnFiber, step.value, lanes);
        if (newFiber === null) {
          continue;
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultingFirstChild;
    }

    // Add all children to a key map for quick lookups.
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

    // Keep scanning and use the map to restore deleted items as moves.
    for (; !step.done; newIdx++, step = newChildren.next()) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        step.value,
        lanes,
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            // The new fiber is a work in progress, but if there exists a
            // current, that means that we reused the fiber. We need to delete
            // it from the child list so that we don't add it to the deletion
            // list.
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key,
            );
          }
        }
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
    }

    if (shouldTrackSideEffects) {
      // Any existing children that weren't consumed above were deleted. We need
      // to add them to the deletion list.
      existingChildren.forEach(child => deleteChild(returnFiber, child));
    }

    return resultingFirstChild;
  }

  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    textContent: string,
    lanes: Lanes,
  ): Fiber {
    // There's no need to check for keys on text nodes since we don't have a
    // way to define them.
    if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
      // We already have an existing node so let's just update it and delete
      // the rest.
      deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
      const existing = useFiber(currentFirstChild, textContent);
      existing.return = returnFiber;
      return existing;
    }
    // The existing first child is not a text node so we need to create one
    // and delete the existing ones.
    deleteRemainingChildren(returnFiber, currentFirstChild);
    const created = createFiberFromText(textContent, returnFiber.mode, lanes);
    created.return = returnFiber;
    return created;
  }
  // 单节点diff
  function reconcileSingleElement(
    returnFiber: Fiber,               // element的父节点
    currentFirstChild: Fiber | null,  // 显示中的fiber节点
    element: ReactElement,            // 新节点元素
    lanes: Lanes,
  ): Fiber {
    const key = element.key;
    let child = currentFirstChild;
    
    while (child !== null) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        switch (child.tag) {
          case Fragment: {
            if (element.type === REACT_FRAGMENT_TYPE) {
              deleteRemainingChildren(returnFiber, child.sibling);
              const existing = useFiber(child, element.props.children);
              existing.return = returnFiber;
              if (__DEV__) {
                existing._debugSource = element._source;
                existing._debugOwner = element._owner;
              }
              return existing;
            }
            break;
          }
          case Block:
            if (enableBlocksAPI) {
              let type = element.type;
              if (type.$$typeof === REACT_LAZY_TYPE) {
                type = resolveLazyType(type);
              }
              if (type.$$typeof === REACT_BLOCK_TYPE) {
                // The new Block might not be initialized yet. We need to initialize
                // it in case initializing it turns out it would match.
                if (
                  ((type: any): BlockComponent<any, any>)._render ===
                  (child.type: BlockComponent<any, any>)._render
                ) {
                  deleteRemainingChildren(returnFiber, child.sibling);
                  const existing = useFiber(child, element.props);
                  existing.type = type;
                  existing.return = returnFiber;
                  if (__DEV__) {
                    existing._debugSource = element._source;
                    existing._debugOwner = element._owner;
                  }
                  return existing;
                }
              }
            }
          // We intentionally fallthrough here if enableBlocksAPI is not on.
          // eslint-disable-next-lined no-fallthrough
          default: {
            // key相同， type相同,删除剩下的兄弟节点
            if (
              child.elementType === element.type ||
              // Keep this check inline so it only runs on the false path:
              (__DEV__
                ? isCompatibleFamilyForHotReloading(child, element)
                : false)
            ) {
              deleteRemainingChildren(returnFiber, child.sibling);
              // 将可复用的节点复制更新后返回新的fiber
              const existing = useFiber(child, element.props);
              existing.ref = coerceRef(returnFiber, child, element);
              existing.return = returnFiber;
              if (__DEV__) {
                existing._debugSource = element._source;
                existing._debugOwner = element._owner;
              }
              return existing;
            }
            break;
          }
        }
        // Didn't match.
        // key相同，但是type不同，表示唯一能复用的可能性消失，把这个节点和兄弟节点都标记删除跳出循环
        // 下面直接创建新的fiber
        deleteRemainingChildren(returnFiber, child);
        break;
      } else {
        // 因为key不相同， 没有复用可能，删除这个节点
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    // 创建fiber
    if (element.type === REACT_FRAGMENT_TYPE) {
      const created = createFiberFromFragment(
        element.props.children,
        returnFiber.mode,
        lanes,
        element.key,
      );
      created.return = returnFiber;
      return created;
    } else {
      const created = createFiberFromElement(element, returnFiber.mode, lanes);
      created.ref = coerceRef(returnFiber, currentFirstChild, element);
      created.return = returnFiber;
      return created;
    }
  }

  function reconcileSinglePortal(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    portal: ReactPortal,
    lanes: Lanes,
  ): Fiber {
    const key = portal.key;
    let child = currentFirstChild;
    while (child !== null) {
      // TODO: If key === null and child.key === null, then this only applies to
      // the first item in the list.
      if (child.key === key) {
        if (
          child.tag === HostPortal &&
          child.stateNode.containerInfo === portal.containerInfo &&
          child.stateNode.implementation === portal.implementation
        ) {
          deleteRemainingChildren(returnFiber, child.sibling);
          const existing = useFiber(child, portal.children || []);
          existing.return = returnFiber;
          return existing;
        } else {
          deleteRemainingChildren(returnFiber, child);
          break;
        }
      } else {
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    const created = createFiberFromPortal(portal, returnFiber.mode, lanes);
    created.return = returnFiber;
    return created;
  }

  // This API will tag the children with the side-effect of the reconciliation
  // itself. They will be added to the side-effect list as we pass through the
  // children and the parent.
  // diff入口
  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    // This function is not recursive.
    // If the top level item is an array, we treat it as a set of children,
    // not as a fragment. Nested arrays on the other hand will be treated as
    // fragment nodes. Recursion happens at the normal flow.

    // Handle top level unkeyed fragments as if they were arrays.
    // This leads to an ambiguity between <>{[...]}</> and <>...</>.
    // We treat the ambiguous cases above the same.
    const isUnkeyedTopLevelFragment =
      typeof newChild === 'object' &&
      newChild !== null &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      newChild.key === null;
    if (isUnkeyedTopLevelFragment) {
      newChild = newChild.props.children;
    }

    // Handle object types
    const isObject = typeof newChild === 'object' && newChild !== null;
    // 对象类型，可能是 REACT_ELEMENT_TYPE 或 REACT_PORTAL_TYPE
    if (isObject) {
      console.log('reconcileChildFibers', '---', 'isObject', isObject, newChild, newChild.$$typeof);
      // 数组newChild的$$typeofW为undefined
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes,
            ),
          );
        case REACT_PORTAL_TYPE:
          return placeSingleChild(
            reconcileSinglePortal(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes,
            ),
          );
        case REACT_LAZY_TYPE:
          if (enableLazyElements) {
            const payload = newChild._payload;
            const init = newChild._init;
            // TODO: This function is supposed to be non-recursive.
            return reconcileChildFibers(
              returnFiber,
              currentFirstChild,
              init(payload),
              lanes,
            );
          }
      }
    }

    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(
          returnFiber,
          currentFirstChild,
          '' + newChild,
          lanes,
        ),
      );
    }

    if (isArray(newChild)) {
      return reconcileChildrenArray(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes,
      );
    }

    if (getIteratorFn(newChild)) {
      return reconcileChildrenIterator(
        returnFiber,
        currentFirstChild,
        newChild,
        lanes,
      );
    }

    if (isObject) {
      throwOnInvalidObjectType(returnFiber, newChild);
    }

    if (__DEV__) {
      if (typeof newChild === 'function') {
        warnOnFunctionType(returnFiber);
      }
    }
    if (typeof newChild === 'undefined' && !isUnkeyedTopLevelFragment) {
      // If the new child is undefined, and the return fiber is a composite
      // component, throw an error. If Fiber return types are disabled,
      // we already threw above.
      switch (returnFiber.tag) {
        case ClassComponent: {
          if (__DEV__) {
            const instance = returnFiber.stateNode;
            if (instance.render._isMockFunction) {
              // We allow auto-mocks to proceed as if they're returning null.
              break;
            }
          }
        }
        // Intentionally fall through to the next case, which handles both
        // functions and classes
        // eslint-disable-next-lined no-fallthrough
        case Block:
        case FunctionComponent:
        case ForwardRef:
        case SimpleMemoComponent: {
          invariant(
            false,
            '%s(...): Nothing was returned from render. This usually means a ' +
              'return statement is missing. Or, to render nothing, ' +
              'return null.',
            getComponentName(returnFiber.type) || 'Component',
          );
        }
      }
    }

    // Remaining cases are all treated as empty.
    return deleteRemainingChildren(returnFiber, currentFirstChild);
  }

  return reconcileChildFibers;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);

export function cloneChildFibers(
  current: Fiber | null,
  workInProgress: Fiber,
): void {
  invariant(
    current === null || workInProgress.child === current.child,
    'Resuming work not yet implemented.',
  );

  if (workInProgress.child === null) {
    return;
  }

  let currentChild = workInProgress.child;
  let newChild = createWorkInProgress(currentChild, currentChild.pendingProps);
  workInProgress.child = newChild;

  newChild.return = workInProgress;
  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    newChild = newChild.sibling = createWorkInProgress(
      currentChild,
      currentChild.pendingProps,
    );
    newChild.return = workInProgress;
  }
  newChild.sibling = null;
}

// Reset a workInProgress child set to prepare it for a second pass.
export function resetChildFibers(workInProgress: Fiber, lanes: Lanes): void {
  let child = workInProgress.child;
  while (child !== null) {
    resetWorkInProgress(child, lanes);
    child = child.sibling;
  }
}
