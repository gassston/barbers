import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export const reminderQueue = new Queue("reminders", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const reportQueue = new Queue("reports", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 20 },
  },
});

export interface ReminderJobData {
  appointmentId: string;
  type: "email" | "sms" | "both";
}

export interface ReportJobData {
  type: "revenue" | "no_show";
  from: string;
  to: string;
  requestedBy: string;
}
