import Notification from "../models/Notification.js";

/**
 * Create or update a notification
 *
 * @param {Object} params
 * @param {ObjectId} params.recipient - user receiving the notification
 * @param {ObjectId} [params.sender] - user triggering the notification
 * @param {String} params.type - notification type
 * @param {String} params.title - short title
 * @param {String} params.text - description shown in UI
 * @param {String} [params.url] - deep link
 * @param {String} [params.icon] - icon name
 * @param {ObjectId} [params.article]
 * @param {ObjectId} [params.comment]
 * @param {ObjectId} [params.chat]
 * @param {ObjectId} [params.message]
 * @param {String} [params.groupKey] - used to group notifications
 * @param {Object} [params.metadata]
 * @param {String} [params.priority="normal"]
 * @param {Boolean} [params.isSilent=false]
 */
export const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  text,
  url,
  icon,
  article,
  comment,
  chat,
  message,
  groupKey,
  metadata = {},
  priority = "normal",
  isSilent = false,
}) => {
  // 🔒 Required fields guard
  if (!recipient || !type) return;

  // 🚫 Do not notify yourself
  if (sender && String(sender) === String(recipient)) return;

  const baseData = {
    recipient,
    sender,
    type,
    title,
    text,
    url,
    icon,
    article,
    comment,
    chat,
    message,
    metadata,
    priority,
    isSilent,
    read: false,
    deleted: false,
  };

  // 🔁 GROUPED NOTIFICATION (likes, repeated actions)
  if (groupKey) {
    const existing = await Notification.findOne({
      recipient,
      groupKey,
      deleted: false,
    });

    if (existing) {
      existing.count += 1;
      existing.read = false;
      existing.readAt = null;
      existing.updatedAt = new Date();
      await existing.save();
      return existing;
    }
  }

  // 🆕 CREATE NEW NOTIFICATION
  const notification = await Notification.create({
    ...baseData,
    groupKey,
    count: 1,
  });

  return notification;
};
