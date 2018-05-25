import { Subject } from "rxjs/Subject";
import { Subscription } from "rxjs/Subscription";

export type A0 = () => void;

export type A1<T> = (b: T) => void;

export type F0<T> = () => T;

export type F1<T, U> = (b: T) => U;

export type View = HTMLElement;

export type Either<T> = T | F0<T>;

export const ENTER_KEY = 13;

export const ESCAPE_KEY = 27;

export const notNullOrWhiteSpace = (s: string | null): s is string => !!s && s.trim().length > 0;

export class Notifier {

    private readonly subject: Subject<object> = new Subject();

    private readonly dummy = {};

    private readonly subscriptions = new Map<Node, Subscription[]>();

    public fire() {
        this.subject.next(this.dummy);
    }

    public subscribe(onNext: A1<object>, dependency: Node) {

        const subscription = this.subject.subscribe(onNext);

        if (!this.subscriptions.get(dependency)) {
            this.subscriptions.set(dependency, new Array<Subscription>());
        }

        this.subscriptions.get(dependency)!.push(subscription);
    }

    public cleanup(dependency: Node) {

        if (!this.subscriptions.get(dependency)) {
            return;
        }

        this.subscriptions.get(dependency)!.forEach((a) => a.unsubscribe());

        this.subscriptions.delete(dependency);
    }
}

export interface IAttribute {
    set(o: View, watch: Notifier): void;
}

export interface IView {
    render(parent: View, watch: Notifier, attachToParent?: boolean): View;
}

export class VersionedList<T> {

    private version = 0;

    constructor(private items: T[] = new Array<T>()) { }

    public getVersion() {
        return this.version;
    }

    public getItems(): ReadonlyArray<T> {
        return  this.items;
    }

    public getItem(index: number): T {
        return this.items[index];
    }

    public count() { return this.items.length; }

    public add(item: T) {
        this.items.push(item);

        this.version++;
    }

    public remove(item: T) {
        this.delete(this.indexOf(item));
    }

    public delete(itemIndex: number) {
        this.items.splice(itemIndex, 1);

        this.version++;
    }

    public clear() {
        this.items.length = 0;

        this.version++;
    }

    public indexOf(obj: T, fromIndex = 0): number {

        if (fromIndex < 0) {
            fromIndex = Math.max(0, this.items.length + fromIndex);
        }
        for (let i = fromIndex, j = this.items.length; i < j; i++) {
            if (this.items[i] === obj) {
                return i;
            }
        }
        return -1;
    }

    public forEach(action: A1<T>) {
        this.items.forEach(action);
    }

    public filter(filter: F1<T, boolean>) {
        return this.items.filter(filter);
    }
}

class BaseElement<T extends View> implements IView {

    constructor(
        private readonly creator: F0<T>,
        private readonly attributes: IAttribute[] = new Array<IAttribute>(),
        private readonly children: IView[] = new Array<IView>()) { }

    public render(parent: View, watch: Notifier, attachToParent: boolean = true) {

        const view = this.creator();

        this.attributes.forEach((a) => a.set(view, watch));

        this.children.forEach((a) => a.render(view, watch));

        if (attachToParent) {
            parent.appendChild(view);
        }

        return view;
    }
}

class TextContentA implements IAttribute {

    private currentValue = "";

    public constructor(private readonly textContent: Either<string>) { }

    public set(o: View, watch: Notifier) {

        if (typeof this.textContent === "string") {

            this.currentValue = this.textContent;

            o.textContent = this.currentValue;
        } else {

            this.currentValue = this.textContent();

            o.textContent = this.currentValue;

            const gen = this.textContent;

            watch.subscribe(
                (_) => {

                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.textContent = this.currentValue;
                    }
                },
                o,
            );
        }
    }
}

class TitleA implements IAttribute {

    private currentValue = "";

    public constructor(private readonly title: Either<string>) { }

    public set(o: View, watch: Notifier) {

        if (typeof this.title === "string") {
            this.currentValue = this.title;

            o.title = this.currentValue;

        } else {

            this.currentValue = this.title();

            o.title = this.currentValue;

            const gen = this.title;

            watch.subscribe(
                (_) => {
                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.title = this.currentValue;
                    }
                },
                o,
            );
        }

    }

}

class DisabledA implements IAttribute {

    private currentValue = false;

    public constructor(private readonly disabled: Either<boolean>) { }

    public set(o: View, watch: Notifier) {

        const canDisable = (p: View): p is HTMLButtonElement | HTMLFieldSetElement |
            HTMLInputElement | HTMLOptGroupElement |
            HTMLOptionElement | HTMLSelectElement | HTMLTextAreaElement =>
                (p instanceof HTMLButtonElement) ||
                (p instanceof HTMLInputElement) ||
                (p instanceof HTMLOptionElement) ||
                (p instanceof HTMLFieldSetElement) ||
                (p instanceof HTMLOptGroupElement) ||
                (p instanceof HTMLSelectElement) ||
                (p instanceof HTMLTextAreaElement);

        if (!canDisable(o)) {
            return;
        }

        if (typeof this.disabled === "boolean") {
            this.currentValue = this.disabled;

            o.disabled = this.currentValue;
        } else {
            this.currentValue = this.disabled();

            o.disabled = this.currentValue;

            const gen = this.disabled;

            watch.subscribe(
                (_) => {

                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.disabled = this.currentValue;
                    }
                },
                o,
            );
        }

    }

}

class ClassNameA implements IAttribute {

    private currentValue = "";

    public constructor(private readonly className: Either<string>) { }

    public set(o: View, watch: Notifier) {

        if (typeof this.className === "string") {
            this.currentValue = this.className;

            o.className = this.currentValue;
        } else {
            this.currentValue = this.className();

            o.className = this.currentValue;

            const gen = this.className;

            watch.subscribe(
                (_) => {
                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.className = this.currentValue;
                    }
                },
                o,
            );
        }
    }

}

class FocusA implements IAttribute {

    private currentValue = false;

    public constructor(private readonly focus: Either<boolean>) { }

    public set(o: View, watch: Notifier) {

        if (typeof this.focus === "boolean") {
            this.currentValue = this.focus;

            if (this.currentValue) {
                o.focus();
            }
        } else {
            this.currentValue = this.focus();

            if (this.currentValue) {
                o.focus();
            }

            const gen = this.focus;

            watch.subscribe(
                (_) => {

                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;
                    }

                    if (this.currentValue && document.activeElement !== o) {
                        o.focus();
                    }
                },
                o,
            );
        }
    }
}

class HrefA implements IAttribute {

    private currentValue = "#";

    public constructor(private readonly href: Either<string>) { }

    public set(o: View, watch: Notifier) {

        const isHref = (p: View): p is HTMLAnchorElement | HTMLBaseElement | HTMLLinkElement | HTMLAreaElement =>
            (p instanceof HTMLAnchorElement) ||
            (p instanceof HTMLBaseElement) ||
            (p instanceof HTMLLinkElement) ||
            (p instanceof HTMLAreaElement);

        if (!isHref(o)) {
            return;
        }

        if (typeof this.href === "string") {

            this.currentValue = this.href;

            o.href = this.currentValue;
        } else {
            this.currentValue = this.href();

            o.href = this.currentValue;

            const gen = this.href;

            watch.subscribe(
                (_) => {
                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.href = this.currentValue;
                    }
                },
                o,
            );
        }

    }
}

class StringValueA implements IAttribute {

    private currentValue = "";

    public constructor(private readonly stringVal: Either<string>) { }

    public set(o: View, watch: Notifier) {

        const hasVal = (p: View): p is HTMLButtonElement | HTMLInputElement | HTMLOptionElement | HTMLSelectElement
                                     | HTMLTextAreaElement =>
                (p instanceof HTMLButtonElement) ||
                (p instanceof HTMLInputElement) ||
                (p instanceof HTMLOptionElement) ||
                (p instanceof HTMLSelectElement) ||
                (p instanceof HTMLTextAreaElement);

        if (!hasVal(o)) {
            return;
        }

        if (typeof this.stringVal === "string") {

            this.currentValue = this.stringVal;

            o.value = this.currentValue;
        } else {
            this.currentValue = this.stringVal();

            o.value = this.currentValue;

            const gen = this.stringVal;

            watch.subscribe(
                (_) => {
                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.value = this.currentValue;
                    }
                },
                o,
            );
        }

    }
}

class HtmlForA implements IAttribute {

    private currentValue = "";

    public constructor(private readonly htmlFor: Either<string>) { }

    public set(o: View, watch: Notifier) {

        if (!(o instanceof HTMLLabelElement)) {
            return;
        }

        if (typeof this.htmlFor === "string") {

            this.currentValue = this.htmlFor;

            o.htmlFor = this.currentValue;
        } else {
            this.currentValue = this.htmlFor();

            o.htmlFor = this.currentValue;

            const gen = this.htmlFor;

            watch.subscribe(
                (_) => {
                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.htmlFor = this.currentValue;
                    }
                },
                o,
            );
        }

    }

}

class PlaceholderA implements IAttribute {

    private currentValue = "";

    public constructor(private readonly placeholder: Either<string>) { }

    public set(o: View, watch: Notifier) {

        const hasPlaceholder = (p: View): p is HTMLInputElement | HTMLTextAreaElement =>
            (p instanceof HTMLInputElement) ||
            (p instanceof HTMLTextAreaElement);

        if (!hasPlaceholder(o)) {
            return;
        }

        if (typeof this.placeholder === "string") {

            this.currentValue = this.placeholder;

            o.placeholder = this.currentValue;
        } else {
            this.currentValue = this.placeholder();

            o.placeholder = this.currentValue;

            const gen = this.placeholder;

            watch.subscribe(
                (_) => {
                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.placeholder = this.currentValue;
                    }
                },
                o,
            );
        }
    }
}

class CheckedA implements IAttribute {

    private currentValue = false;

    public constructor(private readonly checked: Either<boolean>) { }

    public set(o: View, watch: Notifier) {

        if (!(o instanceof HTMLInputElement)) {
            return;
        }

        if (typeof this.checked === "boolean") {

            this.currentValue = this.checked;

            o.checked = this.currentValue;
        } else {
            this.currentValue = this.checked();

            o.checked = this.currentValue;

            const gen = this.checked;

            watch.subscribe(
                (_) => {
                    const s = gen();

                    if (this.currentValue !== s) {

                        this.currentValue = s;

                        o.checked = this.currentValue;
                    }
                },
                o,
            );
        }

    }

}

class ScrollIntoViewA implements IAttribute {

    private lastStyle: HTMLElement | null = null;

    public set(o: View, watch: Notifier) {

        const checkAdded =
            async () => {

                while (true) {
                    if (!o.parentElement) {
                        await delay(30, 0);

                        continue;
                    }

                    this.scrollTo(o.parentElement, o.offsetTop - 10, 300);

                    break;
                }
            };

        checkAdded();
    }

    // https://stackoverflow.com/a/45325140/1958167
    private scrollTo(element: HTMLElement, to: number, duration: number) {

        const start = element.scrollTop;
        const change = to - start;
        const increment = 20;
        let currentTime = 0;

        const easeInOutQuad = (t: number, b: number, c: number, d: number) => {

            t /= d / 2;

            if (t < 1) {

                return c / 2 * t * t + b;

            }

            t--;

            return -c / 2 * (t * (t - 2) - 1) + b;
        };

        const animateScroll = () => {

            currentTime += increment;

            const val = easeInOutQuad(currentTime, start, change, duration);

            element.scrollTop = val;

            if (currentTime < duration) {
                setTimeout(animateScroll, increment);
            }
        };

        animateScroll();
    }
}

class TemplateA<T> implements IAttribute {

    private currentVersion?: number;

    private currentValue?: VersionedList<T>;

    public constructor(
        private readonly source: Either<VersionedList<T>>,
        private readonly template: F1<T, IView>,
        private readonly placeholder: IView | null) { }

    public set(o: View, notifier: Notifier) {

        const load = () => {

            while (o.firstChild != null) {
                notifier.cleanup(o.firstChild);
                o.removeChild(o.firstChild);
            }

            if (this.currentValue && this.currentValue.count() > 0) {
                this.currentValue
                    .forEach(
                    (a) => this.template(a).render(o, notifier),
                );
            } else if (this.placeholder) {
                this.placeholder.render(o, notifier);
            }
        };

        if (this.source instanceof VersionedList) {

            this.currentValue = this.source;

            load();
        } else {
            this.currentValue = this.source();

            this.currentVersion = this.currentValue.getVersion();

            load();

            const gen = this.source;

            notifier.subscribe(
                (_) => {
                    const s = gen();

                    if (this.currentValue !== s || this.currentVersion !== s.getVersion()) {

                        this.currentValue = s;

                        this.currentVersion = s.getVersion();

                        load();
                    }
                },
                o,
            );
        }
    }
}

class OnBlurA implements IAttribute {

    public constructor(private readonly handler: A1<FocusEvent>) { }

    public set(o: View, watch: Notifier) {

        o.addEventListener("blur",
            (ev) => {

                this.handler(ev);

                watch.fire();
            });
    }
}

class OnDoubleClickA implements IAttribute {

    public constructor(private readonly handler: A1<MouseEvent>) { }

    public set(o: View, watch: Notifier) {

        o.addEventListener("dblclick",
            (ev) => {

                this.handler(ev);

                watch.fire();
            });
    }
}

class OnClickA implements IAttribute {

    public constructor(private readonly handler: A1<MouseEvent>) { }

    public set(o: View, watch: Notifier) {

        o.addEventListener("click",
            (ev) => {

                this.handler(ev);

                watch.fire();
            });
    }
}

class OnClickAsyncA<T> implements IAttribute {

    public constructor(private readonly handler: F1<MouseEvent, Promise<T>>) { }

    public set(o: View, watch: Notifier) {

        o.addEventListener("click",
            async (ev) => {

                const p = this.handler(ev);

                watch.fire();

                await p;

                watch.fire();
            });
    }
}

class OnTextChangedA implements IAttribute {

    public constructor(private readonly handler: A1<string>) { }

    public set(o: View, watch: Notifier) {

        const hasText = (p: View): p is HTMLInputElement | HTMLTextAreaElement =>
            (p instanceof HTMLInputElement) || (p instanceof HTMLTextAreaElement);

        if (!hasText(o)) {
            return;
        }

        o.addEventListener("keyup",
            () => {

                this.handler(o.value);

                watch.fire();
            });
    }
}

class OnCheckChangedA implements IAttribute {

    public constructor(private readonly handler: A1<boolean>) { }

    public set(o: View, watch: Notifier) {

        if (!(o instanceof HTMLInputElement)) {
            return;
        }

        o.addEventListener("click",
            () => {

                this.handler(o.checked);

                watch.fire();
            });
    }
}

class OnKeyUpA implements IAttribute {

    public constructor(private readonly handler: A1<KeyboardEvent>) { }

    public set(o: View, watch: Notifier) {

        o.addEventListener(
            "keyup",
            (e) => {
                this.handler(e);

                watch.fire();
            });
    }
}

class OnKeyUpAsyncA<T> implements IAttribute {

    public constructor(private readonly handler: F1<KeyboardEvent, Promise<T>>) { }

    public set(o: View, watch: Notifier) {

        o.addEventListener("keyup",
            async (e) => {
                const p = this.handler(e);

                watch.fire();

                await p;

                watch.fire();
            });
    }
}

class OnKeyDownA implements IAttribute {

    public constructor(private readonly handler: A1<KeyboardEvent>) { }

    public set(o: View, watch: Notifier) {

        o.addEventListener(
            "keydown",
            (e) => {

                this.handler(e);

                watch.fire();
            });
    }
}

/**
 * Creates an IView that is rendered as a Div
 * @param attributes The attributes to be applied to the Div.
 * @param children The child nodes to be appended to the Div.
 */
export const Div = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLDivElement>(() => document.createElement("div"), attributes, children);

export const Section = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<View>(() => document.createElement("section"), attributes, children);

export const Footer = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<View>(() => document.createElement("footer"), attributes, children);

export const P = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLParagraphElement>(() => document.createElement("p"), attributes, children);

export const A = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLAnchorElement>(() => document.createElement("a"), attributes, children);

export const Header = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<View>(() => document.createElement("header"), attributes, children);

export const H1 = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLHeadingElement>(
        () => document.createElement("h1"),
        attributes,
        children);

export const TextBox = (attributes: IAttribute[]) =>
    new BaseElement<HTMLInputElement>(
        () => {
            const t = document.createElement("input");

            t.type = "text";

            return t;
        },
        attributes,
        new Array<IView>());

export const CheckBox = (attributes: IAttribute[]) =>
    new BaseElement<HTMLInputElement>(
        () => {
            const t = document.createElement("input");

            t.type = "checkbox";

            return t;
        },
        attributes,
        new Array<IView>());

export const Button = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLButtonElement>(() => document.createElement("button"), attributes, children);

export const Li = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLLIElement>(() => document.createElement("li"), attributes, children);

export const Label = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLLabelElement>(() => document.createElement("label"), attributes, children);

export const Ul = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLUListElement>(() => document.createElement("ul"), attributes, children);

export const Span = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<HTMLSpanElement>(() => document.createElement("span"), attributes, children);

export const Strong = (attributes: IAttribute[], children: IView[] = new Array<IView>()) =>
    new BaseElement<View>(() => document.createElement("strong"), attributes, children);

export const Img = (attributes: IAttribute[]) =>
    new BaseElement<HTMLImageElement>(() => document.createElement("img"), attributes);

export const text = (text: Either<string>) => new TextContentA(text);
export const title = (text: Either<string>) => new TitleA(text);
export const disabled = (val: Either<boolean>) => new DisabledA(val);
export const href = (href: Either<string>) => new HrefA(href);
export const className = (href: Either<string>) => new ClassNameA(href);
export const htmlFor = (htmlFor: Either<string>) => new HtmlForA(htmlFor);
export const placeholder = (text: Either<string>) => new PlaceholderA(text);
export const focus = (text: Either<boolean>) => new FocusA(text);
export const value = (val: Either<string>) => new StringValueA(val);
export const checked = (val: Either<boolean>) => new CheckedA(val);
export const scrollIntoView = () => new ScrollIntoViewA();
export const template = <T>(
    source: Either<VersionedList<T>>,
    template: F1<T, IView>,
    placeholder?: IView) =>
    new TemplateA<T>(source, template, placeholder || null);
export const onClick = (handler: A1<MouseEvent>) => new OnClickA(handler);
export const onClickAsync = <T>(handler: F1<MouseEvent, Promise<T>>) => new OnClickAsyncA(handler);
export const onDoubleClick = (handler: A1<MouseEvent>) => new OnDoubleClickA(handler);
export const onTextChanged = (handler: A1<string>) => new OnTextChangedA(handler);
export const onCheckChanged = (handler: A1<boolean>) => new OnCheckChangedA(handler);
export const onKeyUp = (handler: A1<KeyboardEvent>) => new OnKeyUpA(handler);
export const onKeyUpAsync = <T>(handler: F1<KeyboardEvent, Promise<T>>) => new OnKeyUpAsyncA(handler);
export const onKeyDown = (handler: A1<KeyboardEvent>) => new OnKeyDownA(handler);
export const onBlur = (handler: A1<FocusEvent>) => new OnBlurA(handler);

export const delay = (milliseconds: number, count: number): Promise<number> =>
    new Promise<number>((resolve) => {
        setTimeout(() => {
            resolve(count);
        }, milliseconds);
    });

export const runTask =
    (task: A0, timeout: number, notifier: Notifier, shouldCancel: F0<boolean> = () => false) => {
        setTimeout(
            () => {

                if (shouldCancel()) {
                    return;
                }

                task();

                notifier.fire();
            }
            ,
            timeout);
    };

export interface RequestParameters {
    method: "GET" | "POST";
    url: string;
    headers?: Map<string, string>;
    params?: Map<string, string>;
    payload?: string;
}

// https://stackoverflow.com/questions/30008114/how-do-i-promisify-native-xhr
export const makeRequest = (opts: RequestParameters): Promise<string> => {
    return new Promise((resolve, reject) => {

        const xhr = new XMLHttpRequest();

        xhr.open(opts.method, opts.url);

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            }
        };

        xhr.onerror = () => {
            reject({
                status: xhr.status,
                statusText: xhr.statusText,
            });
        };

        if (opts.headers) {
            opts.headers.forEach((value, key) => xhr.setRequestHeader(key, value));
        }

        if (opts.params && opts.method === "GET") {

            const params: string[] = [];

            opts.params.forEach((value, key) => params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value)));

            xhr.send(params.join("&"));

        } else if (opts.method === "GET") {
            xhr.send();
        } else {
            xhr.send(opts.payload);
        }
    });
};
