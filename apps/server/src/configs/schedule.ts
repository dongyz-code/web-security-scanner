import { Schedule } from '@m170/utils/node';
import type { ScheduleTaskAdd } from '@m170/utils/node';

/** 全局定时任务 */
export const schedule = new Schedule();

/** 全局定时任务 */
export const ROOT_SCHEDULE = {
  list: [] as ScheduleTaskAdd[],
  add(item: ScheduleTaskAdd) {
    this.list.push(item);
  },
  install() {
    if (this.list.length) {
      this.list.forEach((item) => {
        schedule.add(item);
      });
      console.log({
        schedule: schedule.get(),
      });
    }
  },
};
