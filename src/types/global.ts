import { User } from "@prisma/client";

export interface Error  {
    statusCode?: number;
  }
  

  export type Notification = {
    id: number;
    receiverId: number;
    senderId: number;
    isRead: boolean;
    createdAt: string;
    type: string;
    receiver: User;
    sender: User;
  };
  