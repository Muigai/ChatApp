import {
    A,
    A0,
    A1,
    Button,
    CheckBox,
    checked,
    className,
    delay,
    disabled,
    Div,
    ENTER_KEY,
    ESCAPE_KEY,
    F0,
    F1,
    focus,
    Footer,
    H1,
    Header,
    href,
    htmlFor,
    IView,
    Label,
    Li,
    makeRequest,
    Notifier,
    notNullOrWhiteSpace,
    onBlur,
    onCheckChanged,
    onClick,
    onClickAsync,
    onDoubleClick,
    onKeyDown,
    onKeyUp,
    onKeyUpAsync,
    onTextChanged,
    P,
    placeholder,
    RequestParameters,
    runTask,
    scrollIntoView,
    Section,
    Span,
    Strong,
    template,
    text,
    TextBox,
    title,
    Ul,
    value,
    VersionedList,
} from "./utils";

import {
    ChatCommand,
    LoggedOnUsers,
    Logoff,
    Logon,
    MessageFrom,
    Nothing,
    RequestNotification,
    SendMessage,
    User,
    UserJoined,
    UserLeft,
} from "./spa-chat-common";

interface ChatStarted {
    readonly kind: "started";
    readonly with: User;
}

interface MessageTo {
    readonly kind: "to";
    readonly to: User;
    readonly content: string;
}

type Message = ChatStarted | MessageTo | MessageFrom | UserJoined | UserLeft;

type DataFeed = UserJoined | UserLeft | MessageFrom;

const serverUrl = "http://localhost:3000";

export const main =
    () => {

        const notifier = new Notifier();

        const users = new VersionedList<User>();

        const messages = new VersionedList<Message>();

        const anonUser: User = { name: "'Please sign-in'", id: 0 };

        let currentUser = anonUser;

        let chatee = anonUser;

        let isLogonPending = false;

        let isChatOpen = false;

        let messageContent = "";

        const isLoggedOn = () => currentUser !== anonUser;

        async function postToServer<T>(data: ChatCommand): Promise<T> {

            const opts: RequestParameters = {
                url: serverUrl,
                method: "POST",
                payload: JSON.stringify(data),
            };

            try {
                const begin = performance.now();
                const result = await makeRequest(opts);
                const end = performance.now();
                // tslint:disable-next-line:no-console
                console.log("Call to server took " + (end - begin) + " milliseconds.");
                return JSON.parse(result);
            } catch {
                return postToServer<T>(data);
            }
        }

        const initDataFeed =
            async () => {

                const notification: RequestNotification = { kind: "notification", id: currentUser.id };

                const data = await postToServer<DataFeed>(notification);

                if (isLoggedOn()) {

                    switch (data.kind) {
                        case "userJoined":
                            users.add(data.user);
                            break;
                        case "userLeft":
                            const left = users.filter((a) => a.id === data.user.id)[0];

                            if (left) {
                                users.remove(left);
                            }

                            if (left === chatee) {
                                chatee = anonUser;
                            }
                            break;
                    }

                    messages.add(data as Message);

                    notifier.fire();

                    initDataFeed();
                }
            };

        const logoff =
            async () => {

                const logoff: Logoff = { kind: "logoff", id: currentUser.id };

                currentUser = anonUser;

                chatee = anonUser;

                messages.clear();

                users.clear();

                isChatOpen = false;

                await postToServer(logoff);
            };

        const logon =
            async (userName: string) => {

                isLogonPending = true;

                const logonData: Logon = { kind: "logon", name: userName };

                const loggedOnUsers = await postToServer<LoggedOnUsers>(logonData);

                const loggedOnUser = loggedOnUsers.pop();

                if (loggedOnUser) {

                    currentUser = loggedOnUser;

                    isLogonPending = false;

                    isChatOpen = true;

                    loggedOnUsers.forEach((a) => users.add(a));
                }
            };

        const processUser =
            async () => {

                if (isLoggedOn()) {

                    await logoff();

                    return;
                }

                const userName = prompt("Please sign-in");

                if (!notNullOrWhiteSpace(userName)) {
                    return;
                }

                await logon(userName);

                initDataFeed();
            };

        const { submitMessage, isSubmitPending } =
            (() => {

                let sendingMessage = false;

                return {
                    submitMessage: async (): Promise<boolean> => {

                        if (!notNullOrWhiteSpace(messageContent) || !isLoggedOn() || chatee === anonUser) {
                            return false;
                        }

                        const message: Message = {
                            kind: "to",
                            to: chatee,
                            content: messageContent,
                        };

                        messages.add(message);

                        sendingMessage = true;

                        const send: SendMessage = {
                            kind: "send",
                            from: currentUser.id,
                            to: chatee.id,
                            content: messageContent,
                        };

                        try {

                            await postToServer(send);

                        } catch {

                            return await submitMessage(); // retry
                        }

                        messageContent = "";

                        sendingMessage = false;

                        return true;
                    },
                    isSubmitPending: () => sendingMessage,
                };
            })();

        const submitOnEnter =
            async (e: KeyboardEvent) => {

                if (e.keyCode !== ENTER_KEY) {
                    return;
                }

                await submitMessage();
            };

        const placeholderTemplate =
            Div(
                [className("spa-chat-list-note"),
                text(`To chat alone is the fate of all great souls...


                     No one is online`),
                ],
            );

        const startChat =
            (user: User) => {

                if (chatee === user) {
                    return;
                }

                chatee = user;

                const message: ChatStarted = {
                    kind: "started",
                    with: user,
                };

                messages.add(message);
            };

        const selectedClass = "spa-x-select";

        const userTemplate =
            (user: User) =>
                Div(
                    [className(() => "spa-chat-list-name " + (chatee === user ? selectedClass : "")),
                    text(user.name),
                    onClick(() => startChat(user)),
                    ],
                );

        const messageTemplate =
            (m: Message) => {

                const [style, content] =
                    (() => {
                        switch (m.kind) {
                            case "from":
                                return ["spa-chat-msg-log-msg", `${m.from.name}: ${m.content}`];
                            case "to":
                                return ["spa-chat-msg-log-me", `${currentUser.name}: ${m.content}`];
                            case "started":
                                return ["spa-chat-msg-log-alert", `Now chatting with ${m.with.name}`];
                            case "userJoined":
                                return ["spa-chat-msg-log-alert", `${m.user.name} has joined the chat`];
                            case "userLeft":
                                return ["spa-chat-msg-log-alert", `${m.user.name} has left the chat`];
                            default:
                                return ["", ""];
                        }
                    })();

                return Div([className(style), text(content), scrollIntoView()]);
            };

        const animateOpen = "spa-chat spa-chat-animate-open";

        const animateClose = "spa-chat spa-chat-animate-close";

        const isChatActive = () => isLoggedOn() && isChatOpen;

        const chatContainer =
            Div([className(() => isChatActive() ? animateOpen : animateClose)],
                [
                    Div([className("spa-chat-head")],
                        [
                            Div(
                                [
                                    className("spa-chat-head-toggle"),
                                    text(() => isChatOpen ? "=" : "+"),
                                    title(() => isChatOpen ? "Tap to close" : "Tap to open"),
                                    onClick(() => isChatOpen = !isChatOpen),
                                ]),
                            Div(
                                [className("spa-chat-head-title"),
                                text(() => "Chat " + (chatee === anonUser ? "" : chatee.name)),
                                ],
                            ),
                            Div([className("spa-chat-closer"), text("x")]),
                        ],
                    ),
                    Div([className(() => isChatActive() ? "spa-chat-sizer" : "hidden")],
                        [
                            Div([className("spa-chat-list")],
                                [
                                    Div(
                                        [
                                            className("spa-chat-list-box"),
                                            template(() => users, userTemplate, placeholderTemplate),
                                        ],
                                    ),
                                ],
                            ),
                            Div([className("spa-chat-msg")],
                                [
                                    Div(
                                        [className("spa-chat-msg-log"),
                                        template(() => messages, messageTemplate),
                                        ],
                                    ),
                                    Div([className("spa-chat-msg-in")],
                                        [
                                            TextBox(
                                                [disabled(() => chatee === anonUser),
                                                onTextChanged((s) => messageContent = s),
                                                onKeyUpAsync(submitOnEnter),
                                                value(() => messageContent),
                                                focus(() => true),
                                                ]),
                                            Div(
                                                [className(
                                                    // tslint:disable-next-line:max-line-length
                                                    () => "spa-chat-msg-send " + (isSubmitPending() ? selectedClass : ""),
                                                ),
                                                text("send"),
                                                onClickAsync(submitMessage),
                                                ]),
                                        ],
                                    ),
                                ],
                            ),
                        ],
                    ),
                ],
            );

        const mainContainer =
            Div([className("spa")],
                [
                    Div([className("spa-shell-head")],
                        [
                            Div([className("spa-shell-head-logo")],
                                [
                                    H1([text("SPA")]),
                                    P([text("typescript end-to-end")]),
                                ]),
                            Div([className("spa-shell-head-acct"),
                            text(() => isLogonPending ? "... processing ..." : currentUser.name),
                            onClickAsync(processUser),
                            ]),

                        ],
                    ),
                    Div([className("spa-shell-main")],
                        [
                            Div([className("spa-shell-main-nav")]),
                            Div([className("spa-shell-main-content")]),
                        ],
                    ),
                    Div([className("spa-shell-foot")]),
                ],
            );

        mainContainer.render(document.body, notifier, true);

        chatContainer.render(document.body, notifier, true);
    };

document.addEventListener("DOMContentLoaded", main, true);
