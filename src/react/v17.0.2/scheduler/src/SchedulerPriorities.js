/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// PriorityLevel 用来标记更新的优先级，如提交更新的用 ImmediatePriority ，
// 即立即执行的优先级。而用户交互的行为事件的优先级是 UserBlockingPriority。PriorityLevel 的数值越大，代表优先级越低。

export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

// TODO: Use symbols?
export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2; // 用户的交互行为
export const NormalPriority = 3;
export const LowPriority = 4; // 低优先级，如异步
export const IdlePriority = 5;
