type NotificationApi = import('antd/lib/notification').NotificationApi;

interface ExtendedNotificationApi extends NotificationApi {
  /** 正在执行状态 */
  executing: NotificationApi['info'];
}

// 增加notification自定义api
declare module 'antd' {
  export * from 'antd/lib/index.d';
  export const notification: ExtendedNotificationApi;
}
