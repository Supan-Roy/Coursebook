// Notification Service for browser-based task reminders
const notificationService = {
  // Track notified task IDs to avoid duplicate notifications
  notifiedTasks: new Set(),

  // Request permission from user
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Check if notifications are enabled
  isEnabled() {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  // Show notification
  show(title, options = {}) {
    if (this.isEnabled()) {
      const defaultOptions = {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'coursebook-notification',
        requireInteraction: true,
        ...options,
      };
      return new Notification(title, defaultOptions);
    }
  },

  // Check if task is due and show notification
  checkAndNotifyTask(task) {
    if (!task.due_date || !task.due_time || task.is_completed) {
      return;
    }

    // Skip if we already notified about this task
    const taskNotificationKey = `task-${task.id}-${task.due_date}-${task.due_time}`;
    if (this.notifiedTasks.has(taskNotificationKey)) {
      return;
    }

    const now = new Date();
    const [dueHours, dueMinutes] = task.due_time.split(':').map(Number);
    const taskDueDate = new Date(task.due_date);
    const taskDueTime = new Date(
      taskDueDate.getFullYear(),
      taskDueDate.getMonth(),
      taskDueDate.getDate(),
      dueHours,
      dueMinutes,
      0
    );

    // Check if task is due (within notification window)
    const timeDiff = taskDueTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    // Show notification if task is due within 5 minutes before or 5 minutes after
    // This gives users a reasonable window to see and act on the notification
    if (minutesDiff >= -5 && minutesDiff <= 5) {
      // Mark as notified
      this.notifiedTasks.add(taskNotificationKey);
      
      // Clear the notification record after 10 minutes to allow re-notification if task wasn't completed
      setTimeout(() => {
        this.notifiedTasks.delete(taskNotificationKey);
      }, 10 * 60 * 1000);

      // Show the notification
      this.show(`Task Due: ${task.title}`, {
        body: `Due at ${task.due_time}${task.description ? ' - ' + task.description : ''}`,
        tag: `task-${task.id}`,
      });

      console.log(`[Notification] Task due: ${task.title} at ${task.due_time}`);
      return true;
    }

    return false;
  },

  // Check multiple tasks
  checkAndNotifyTasks(tasks) {
    if (!this.isEnabled() || !tasks || tasks.length === 0) {
      return;
    }
    tasks.forEach((task) => this.checkAndNotifyTask(task));
  },

  // Set up periodic checks
  setupPeriodicCheck(todos, intervalSeconds = 60) {
    console.log(`[Notifications] Starting periodic check every ${intervalSeconds} seconds for ${todos.length} tasks`);
    return setInterval(() => {
      this.checkAndNotifyTasks(todos);
    }, intervalSeconds * 1000);
  },

  // Clear interval
  clearPeriodicCheck(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
      console.log('[Notifications] Periodic check stopped');
    }
  },

  // Reset tracked notifications (useful for testing or when reloading tasks)
  resetNotified() {
    this.notifiedTasks.clear();
    console.log('[Notifications] Cleared notification history');
  },
};

export default notificationService;
