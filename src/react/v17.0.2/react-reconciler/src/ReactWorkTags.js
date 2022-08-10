/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type WorkTag =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24;

export const FunctionComponent = 0; // 函数组件
export const ClassComponent = 1;   // class 组件
// 函数组件 或 class 组件
export const IndeterminateComponent = 2; // Before we know whether it is function or class
// 根节点，可能嵌套
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
// 传送门组件
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5; // 原生标签组件
export const HostText = 6;  // 文本
export const Fragment = 7; // Fragment 组件
export const Mode = 8; // 模式类型
export const ContextConsumer = 9; // Context Consumer 组件
export const ContextProvider = 10; // Context Provider 组件
export const ForwardRef = 11; // ForwardRef 组件，转发 ref 属性到子组件
export const Profiler = 12; // Profiler 组件
export const SuspenseComponent = 13;  // 懒加载组件
export const MemoComponent = 14; // React.memo 组件，通过检查 props 变更决定是否重新渲染组件
export const SimpleMemoComponent = 15;
export const LazyComponent = 16; // 动态加载组件
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const FundamentalComponent = 20;
export const ScopeComponent = 21;
export const Block = 22;
export const OffscreenComponent = 23;
export const LegacyHiddenComponent = 24;
