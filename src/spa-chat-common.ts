export interface User {
    readonly name: string;
    readonly id: number;
}

export interface MessageFrom {
    readonly kind: "from";
    readonly from: User;
    readonly content: string;
}

export interface UserJoined {
    readonly kind: "userJoined";
    readonly user: User;
}

export interface UserLeft {
    readonly kind: "userLeft";
    readonly user: User;
}

export interface Nothing {
    readonly kind: "noop";
}

export interface Logon {
    readonly kind: "logon";
    readonly name: string;
}

export interface Logoff {
    readonly kind: "logoff";
    readonly id: number;
}

export interface SendMessage {
    readonly kind: "send";
    readonly to: number;
    readonly from: number;
    readonly content: string;
}

export interface RequestNotification {
    readonly kind: "notification";
    readonly id: number;
}

export type LoggedOnUsers = User[];

export type ChatCommand = Logon | Logoff | SendMessage | RequestNotification;

export const serverUrl = "http://localhost:3000";
