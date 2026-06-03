// run() 的三态返回(任务机制设计 3.1)
export enum TaskStatus {
  // 还没干完,下 tick 继续跑这个 task
  Running,
  // 正常完成(装满 / 倒空 / 建好)→ 找下一个 task
  Done,
  // 任务失效(目标没了 / 已被别人做完)→ 丢弃,重新挑
  Invalid
}

// 命令模式的 Command 接口:把"一步行为 + 自带世界校验"封装成对象。
// 注意:Task 对象不持久化,每 tick 由任务工厂从 TaskDescriptor 现造,用完即弃。
export interface Task {
  run(creep: Creep): TaskStatus;
}
