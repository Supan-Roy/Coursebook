// Notification Service for browser-based task reminders
const notificationService = {
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

    const now = new Date();
    const [dueHours, dueMinutes] = task.due_time.split(':');
    const taskDueTime = new Date(
      new Date(task.due_date).getFullYear(),
      new Date(task.due_date).getMonth(),
      new Date(task.due_date).getDate(),
      parseInt(dueHours),
      parseInt(dueMinutes),
      0
    );

    // Check if task is due (within 1 minute window)
    const timeDiff = taskDueTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    // If due time is within next 2 minutes or just passed, notify
    if (minutesDiff >= 0 && minutesDiff <= 2) {
      this.show(`Task Due: ${task.title}`, {
        body: `Due at ${task.due_time}${task.description ? '\n' + task.description : ''}`,
        tag: `task-${task.id}`,
      });
      return true;
    }

    return false;
  },

  // Check multiple tasks
  checkAndNotifyTasks(tasks) {
    tasks.forEach((task) => this.checkAndNotifyTask(task));
  },

  // Set up periodic checks
  setupPeriodicCheck(todos, intervalSeconds = 60) {
    return setInterval(() => {
      this.checkAndNotifyTasks(todos);
    }, intervalSeconds * 1000);
  },

  // Clear interval
  clearPeriodicCheck(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  },
};

export default notificationService;
