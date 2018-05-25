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

// avatar

interface User {
    readonly name: string;
}

interface ChatStarted {
    readonly kind: "started";
    readonly with: User;
}

interface MessageTo {
    readonly kind: "to";
    readonly to: User;
    readonly content: string;
}

interface MessageFrom {
    readonly kind: "from";
    readonly from: User;
    readonly content: string;
}

type Message = ChatStarted | MessageTo | MessageFrom;

export const main =
    () => {

        const notifier = new Notifier();

        const users = new VersionedList<User>();

        const messages = new VersionedList<Message>();

        const anonUser: User = { name: "'Please sign-in'" };

        let currentUser = anonUser;

        let chatee = anonUser;

        let isLogonPending = false;

        let isChatOpen = false;

        const isLoggedOn = () => currentUser !== anonUser;

        const simulateDataFeed =
            () => {

                const shouldCancel = () => !isLoggedOn();

                // simulate entry of users
                runTask(() => users.add({ name: "Betty" }), 1000, notifier, shouldCancel);

                runTask(() => users.add({ name: "Mike" }), 2000, notifier, shouldCancel);

                runTask(() => users.add({ name: "Pebbles" }), 3000, notifier, shouldCancel);

                runTask(() => users.add({ name: "Wilma" }), 4000, notifier, shouldCancel);

                // simulate receipt of message
                runTask(
                    () => {

                        const sender = users.getItem(3);

                        const simulatedReceipt: MessageFrom = {
                            kind: "from",
                            from: sender,
                            content: `Hi there ${currentUser.name}!  ${sender.name} here.`,
                        };

                        if (chatee !== sender) {

                            chatee = sender;

                            const simulatedStart: ChatStarted = {
                                kind: "started",
                                with: sender,
                            };

                            messages.add(simulatedStart);
                        }

                        messages.add(simulatedReceipt);
                    },
                    5000,
                    notifier,
                    shouldCancel,
                );
            };

        const logoff =
            () => {

                currentUser = anonUser;

                chatee = anonUser;

                messages.clear();

                users.clear();

                isChatOpen = false;
            };

        const logon =
            async (userName: string) => {

                isLogonPending = true;

                // simulate network delay
                await delay(1500, 0);

                isLogonPending = false;

                currentUser = { name: userName };

                isChatOpen = true;
            };

        const processUser =
            async () => {

                if (isLoggedOn()) {

                    logoff();

                    return;
                }

                const userName = prompt("Please sign-in");

                if (!notNullOrWhiteSpace(userName)) {
                    return;
                }

                await logon(userName);

                simulateDataFeed();
            };

        let sendingMessage = false;

        let messageContent = "";

        const submitMessage =
            async () => {

                if (!notNullOrWhiteSpace(messageContent) || !isLoggedOn() || chatee === anonUser) {
                    return;
                }

                const message: Message = {
                    kind: "to",
                    to: chatee,
                    content: messageContent,
                };

                messages.add(message);

                messageContent = "";

                sendingMessage = true;

                // simulate transmission
                await delay(250, 0);

                sendingMessage = false;

                // simulate a message response
                const responseFrom = chatee;

                runTask(
                    () => {
                        const simulatedResponse: MessageFrom = {
                            kind: "from",
                            from: responseFrom,
                            content: `Thanks for the note, ${currentUser.name}`,
                        };

                        messages.add(simulatedResponse);
                    },
                    1500,
                    notifier,
                    () => !isLoggedOn(),
                );
            };

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
                chatee = user;

                const message: ChatStarted = {
                    kind: "started",
                    with: user,
                };

                messages.add(message);
            };

        const selectedClass = "spa-x-select";

        const userTemplate = (user: User) =>
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
                                    onClick(() => { isChatOpen = !isChatOpen; }),
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
                                                // tslint:disable-next-line:max-line-length
                                                [className(() => "spa-chat-msg-send " + (sendingMessage ? selectedClass : "")),
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
                                    P([text("typescript end to end")]),
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

document.addEventListener("DOMContentLoaded", main, false);
