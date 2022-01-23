
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/main.svelte generated by Svelte v3.44.3 */

    const file$b = "src/components/main.svelte";

    function create_fragment$b(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let div3;
    	let h1;
    	let t7;
    	let div8;
    	let div5;
    	let h20;
    	let t9;
    	let div4;
    	let button2;
    	let t11;
    	let button3;
    	let t13;
    	let div7;
    	let h21;
    	let t15;
    	let div6;
    	let button4;
    	let t17;
    	let button5;
    	let t19;
    	let footer;
    	let p;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Zaloguj";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Rejestracja";
    			t5 = space();
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Witaj w serwisie jobspike!";
    			t7 = space();
    			div8 = element("div");
    			div5 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Szukam pracy";
    			t9 = space();
    			div4 = element("div");
    			button2 = element("button");
    			button2.textContent = "Szukam ogłoszenia";
    			t11 = space();
    			button3 = element("button");
    			button3.textContent = "Dodaj ogłoszenie";
    			t13 = space();
    			div7 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Dam prace";
    			t15 = space();
    			div6 = element("div");
    			button4 = element("button");
    			button4.textContent = "Szukam ogłoszenia";
    			t17 = space();
    			button5 = element("button");
    			button5.textContent = "Dodaj ogłoszenie";
    			t19 = space();
    			footer = element("footer");
    			p = element("p");
    			p.textContent = "Support: help.jobspike@gmail.com";
    			if (!src_url_equal(img.src, img_src_value = "/graphic/jobspikelogolong.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "jobspike logo");
    			attr_dev(img, "id", "logo");
    			attr_dev(img, "class", "svelte-a9h37n");
    			add_location(img, file$b, 2, 4, 28);
    			attr_dev(div0, "class", "upperspace svelte-a9h37n");
    			add_location(div0, file$b, 3, 4, 104);
    			attr_dev(button0, "class", "logreg svelte-a9h37n");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "onclick", "window.location.href='#/login'");
    			add_location(button0, file$b, 5, 8, 169);
    			attr_dev(button1, "class", "logreg svelte-a9h37n");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "onclick", "window.location.href='#/rejestr'");
    			add_location(button1, file$b, 6, 8, 272);
    			attr_dev(div1, "class", "logbutt svelte-a9h37n");
    			add_location(div1, file$b, 4, 4, 139);
    			attr_dev(div2, "class", "navigate svelte-a9h37n");
    			add_location(div2, file$b, 1, 0, 1);
    			add_location(h1, file$b, 10, 4, 417);
    			attr_dev(div3, "class", "welcome svelte-a9h37n");
    			add_location(div3, file$b, 9, 0, 391);
    			add_location(h20, file$b, 14, 8, 533);
    			attr_dev(button2, "class", "ogloszbutt col-xxl-4 svelte-a9h37n");
    			attr_dev(button2, "onclick", "window.location.href='#/szukam'");
    			add_location(button2, file$b, 16, 12, 609);
    			attr_dev(button3, "class", "ogloszbutt col-xxl-4 svelte-a9h37n");
    			attr_dev(button3, "onclick", "window.location.href='#/dodaj_szukam'");
    			add_location(button3, file$b, 17, 12, 727);
    			attr_dev(div4, "class", "margin-10 container svelte-a9h37n");
    			add_location(div4, file$b, 15, 8, 563);
    			attr_dev(div5, "class", "optioncircle svelte-a9h37n");
    			add_location(div5, file$b, 13, 4, 498);
    			add_location(h21, file$b, 21, 8, 904);
    			attr_dev(button4, "class", "ogloszbutt col-xxl-4 svelte-a9h37n");
    			attr_dev(button4, "onclick", "window.location.href='#/dam'");
    			add_location(button4, file$b, 23, 12, 977);
    			attr_dev(button5, "class", "ogloszbutt col-xxl-4 svelte-a9h37n");
    			attr_dev(button5, "onclick", "window.location.href='#/dodaj_dam'");
    			add_location(button5, file$b, 24, 12, 1092);
    			attr_dev(div6, "class", "margin-10 container svelte-a9h37n");
    			add_location(div6, file$b, 22, 8, 931);
    			attr_dev(div7, "class", "optioncircle svelte-a9h37n");
    			add_location(div7, file$b, 20, 4, 868);
    			attr_dev(div8, "class", "optionmenu row mb-3 svelte-a9h37n");
    			add_location(div8, file$b, 12, 0, 460);
    			add_location(p, file$b, 29, 4, 1246);
    			attr_dev(footer, "class", "svelte-a9h37n");
    			add_location(footer, file$b, 28, 0, 1233);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h1);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div5);
    			append_dev(div5, h20);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, button2);
    			append_dev(div4, t11);
    			append_dev(div4, button3);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			append_dev(div7, h21);
    			append_dev(div7, t15);
    			append_dev(div7, div6);
    			append_dev(div6, button4);
    			append_dev(div6, t17);
    			append_dev(div6, button5);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(div8);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/login.svelte generated by Svelte v3.44.3 */

    const file$a = "src/components/login.svelte";

    function create_fragment$a(ctx) {
    	let div8;
    	let div7;
    	let div0;
    	let h1;
    	let t1;
    	let div6;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let a;
    	let t9;
    	let div5;
    	let div3;
    	let button0;
    	let t11;
    	let div4;
    	let button1;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Zaloguj się do jobspike";
    			t1 = space();
    			div6 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "E-mail";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Hasło";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			a = element("a");
    			a.textContent = "Nie pamietam hasła";
    			t9 = space();
    			div5 = element("div");
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Nie mam konta";
    			t11 = space();
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "Zaloguj";
    			add_location(h1, file$a, 3, 12, 110);
    			attr_dev(div0, "class", "top lightgreen svelte-176mb5k");
    			add_location(div0, file$a, 2, 8, 69);
    			attr_dev(label0, "for", "mail");
    			add_location(label0, file$a, 7, 16, 240);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "mail");
    			attr_dev(input0, "class", "svelte-176mb5k");
    			add_location(input0, file$a, 8, 16, 289);
    			attr_dev(div1, "class", "mail svelte-176mb5k");
    			add_location(div1, file$a, 6, 12, 205);
    			attr_dev(label1, "for", "haslo");
    			add_location(label1, file$a, 11, 16, 405);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "haslo");
    			attr_dev(input1, "class", "svelte-176mb5k");
    			add_location(input1, file$a, 12, 16, 454);
    			attr_dev(div2, "class", "haslo svelte-176mb5k");
    			add_location(div2, file$a, 10, 12, 369);
    			attr_dev(a, "href", "#/login/forgot");
    			attr_dev(a, "class", "forgot svelte-176mb5k");
    			add_location(a, file$a, 14, 12, 522);
    			attr_dev(button0, "id", "regbutt");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "onclick", "window.location.href='#/rejestr'");
    			attr_dev(button0, "class", "svelte-176mb5k");
    			add_location(button0, file$a, 17, 20, 678);
    			attr_dev(div3, "class", "guzikbox1 svelte-176mb5k");
    			add_location(div3, file$a, 16, 16, 634);
    			attr_dev(button1, "id", "logbutt");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "svelte-176mb5k");
    			add_location(button1, file$a, 20, 20, 862);
    			attr_dev(div4, "class", "guzikbox2 svelte-176mb5k");
    			add_location(div4, file$a, 19, 16, 818);
    			attr_dev(div5, "class", "guziki svelte-176mb5k");
    			add_location(div5, file$a, 15, 12, 597);
    			attr_dev(div6, "class", "bottom green svelte-176mb5k");
    			add_location(div6, file$a, 5, 8, 166);
    			attr_dev(div7, "class", "logowanie");
    			add_location(div7, file$a, 1, 4, 37);
    			attr_dev(div8, "class", "darkgreen loginbox svelte-176mb5k");
    			add_location(div8, file$a, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div0);
    			append_dev(div0, h1);
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div6, t4);
    			append_dev(div6, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, input1);
    			append_dev(div6, t7);
    			append_dev(div6, a);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div3, button0);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, button1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/components/register.svelte generated by Svelte v3.44.3 */

    const file$9 = "src/components/register.svelte";

    function create_fragment$9(ctx) {
    	let div10;
    	let div9;
    	let div0;
    	let h1;
    	let t1;
    	let div8;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div3;
    	let label2;
    	let t9;
    	let input2;
    	let t10;
    	let div4;
    	let input3;
    	let t11;
    	let label3;
    	let a;
    	let t13;
    	let div7;
    	let div5;
    	let button0;
    	let t15;
    	let div6;
    	let button1;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Rejestracja w jobspike";
    			t1 = space();
    			div8 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "E-mail";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Hasło";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Powtórz hasło";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			div4 = element("div");
    			input3 = element("input");
    			t11 = space();
    			label3 = element("label");
    			a = element("a");
    			a.textContent = "Akceptuję regulamin serwisu";
    			t13 = space();
    			div7 = element("div");
    			div5 = element("div");
    			button0 = element("button");
    			button0.textContent = "Mam już konto";
    			t15 = space();
    			div6 = element("div");
    			button1 = element("button");
    			button1.textContent = "Zarejestruj";
    			add_location(h1, file$9, 3, 12, 110);
    			attr_dev(div0, "class", "top lightgreen svelte-1teov3l");
    			add_location(div0, file$9, 2, 8, 69);
    			attr_dev(label0, "for", "mail");
    			add_location(label0, file$9, 7, 16, 239);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "mail");
    			attr_dev(input0, "class", "svelte-1teov3l");
    			add_location(input0, file$9, 8, 16, 288);
    			attr_dev(div1, "class", "mail svelte-1teov3l");
    			add_location(div1, file$9, 6, 12, 204);
    			attr_dev(label1, "for", "haslo");
    			add_location(label1, file$9, 11, 16, 402);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "haslo");
    			attr_dev(input1, "class", "svelte-1teov3l");
    			add_location(input1, file$9, 12, 16, 451);
    			attr_dev(div2, "class", "haslo svelte-1teov3l");
    			add_location(div2, file$9, 10, 12, 366);
    			attr_dev(label2, "for", "repeat");
    			add_location(label2, file$9, 15, 16, 556);
    			attr_dev(input2, "type", "password");
    			attr_dev(input2, "id", "repeat");
    			attr_dev(input2, "class", "svelte-1teov3l");
    			add_location(input2, file$9, 16, 16, 614);
    			attr_dev(div3, "class", "repeat svelte-1teov3l");
    			add_location(div3, file$9, 14, 12, 519);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "id", "accept");
    			attr_dev(input3, "class", "svelte-1teov3l");
    			add_location(input3, file$9, 19, 16, 720);
    			attr_dev(a, "href", "...");
    			attr_dev(a, "class", "svelte-1teov3l");
    			add_location(a, file$9, 20, 36, 792);
    			attr_dev(label3, "for", "accept");
    			attr_dev(label3, "class", "svelte-1teov3l");
    			add_location(label3, file$9, 20, 16, 772);
    			attr_dev(div4, "class", "accept svelte-1teov3l");
    			add_location(div4, file$9, 18, 12, 683);
    			attr_dev(button0, "id", "login");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "onclick", "window.location.href='#/login'");
    			attr_dev(button0, "class", "svelte-1teov3l");
    			add_location(button0, file$9, 24, 20, 958);
    			attr_dev(div5, "class", "guzikbox1 svelte-1teov3l");
    			add_location(div5, file$9, 23, 16, 914);
    			attr_dev(button1, "id", "rejestr");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "svelte-1teov3l");
    			add_location(button1, file$9, 27, 20, 1138);
    			attr_dev(div6, "class", "guzikbox2 svelte-1teov3l");
    			add_location(div6, file$9, 26, 16, 1094);
    			attr_dev(div7, "class", "guziki svelte-1teov3l");
    			add_location(div7, file$9, 22, 12, 877);
    			attr_dev(div8, "class", "bottom green svelte-1teov3l");
    			add_location(div8, file$9, 5, 8, 165);
    			attr_dev(div9, "class", "logowanie");
    			add_location(div9, file$9, 1, 4, 37);
    			attr_dev(div10, "class", "darkgreen loginbox svelte-1teov3l");
    			add_location(div10, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, div0);
    			append_dev(div0, h1);
    			append_dev(div9, t1);
    			append_dev(div9, div8);
    			append_dev(div8, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div8, t4);
    			append_dev(div8, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, input1);
    			append_dev(div8, t7);
    			append_dev(div8, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t9);
    			append_dev(div3, input2);
    			append_dev(div8, t10);
    			append_dev(div8, div4);
    			append_dev(div4, input3);
    			append_dev(div4, t11);
    			append_dev(div4, label3);
    			append_dev(label3, a);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, button0);
    			append_dev(div7, t15);
    			append_dev(div7, div6);
    			append_dev(div6, button1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Register', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Register> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Register extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Register",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/dodaj_szukam.svelte generated by Svelte v3.44.3 */

    const file$8 = "src/components/dodaj_szukam.svelte";

    function create_fragment$8(ctx) {
    	let div12;
    	let div0;
    	let h1;
    	let t1;
    	let div11;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t11;
    	let div3;
    	let label2;
    	let t13;
    	let select1;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let option8;
    	let t19;
    	let div4;
    	let label3;
    	let t21;
    	let input1;
    	let t22;
    	let div5;
    	let label4;
    	let t24;
    	let input2;
    	let t25;
    	let div6;
    	let label5;
    	let t27;
    	let input3;
    	let t28;
    	let div7;
    	let label6;
    	let t30;
    	let textarea;
    	let t31;
    	let h2;
    	let t33;
    	let div8;
    	let label7;
    	let t35;
    	let input4;
    	let t36;
    	let div9;
    	let label8;
    	let t38;
    	let input5;
    	let t39;
    	let div10;
    	let button;
    	let t41;
    	let footer;
    	let p;

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Szukam pracy";
    			t1 = space();
    			div11 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nazwa ogłoszenia";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Wymiar pracy";
    			t6 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Pełen etat";
    			option1 = element("option");
    			option1.textContent = "Dodatkowa / Sezonowa";
    			option2 = element("option");
    			option2.textContent = "Niepełny etat";
    			option3 = element("option");
    			option3.textContent = "Praktyka / Staż";
    			t11 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Typ umowy";
    			t13 = space();
    			select1 = element("select");
    			option4 = element("option");
    			option4.textContent = "Umowa o pracę";
    			option5 = element("option");
    			option5.textContent = "Umowa zlecenie";
    			option6 = element("option");
    			option6.textContent = "Umowa o dzieło";
    			option7 = element("option");
    			option7.textContent = "Samozatrudnienie";
    			option8 = element("option");
    			option8.textContent = "Inny";
    			t19 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Stanowisko";
    			t21 = space();
    			input1 = element("input");
    			t22 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "Wykształcenie";
    			t24 = space();
    			input2 = element("input");
    			t25 = space();
    			div6 = element("div");
    			label5 = element("label");
    			label5.textContent = "Miejscowosc";
    			t27 = space();
    			input3 = element("input");
    			t28 = space();
    			div7 = element("div");
    			label6 = element("label");
    			label6.textContent = "Opis";
    			t30 = space();
    			textarea = element("textarea");
    			t31 = space();
    			h2 = element("h2");
    			h2.textContent = "Kontakt";
    			t33 = space();
    			div8 = element("div");
    			label7 = element("label");
    			label7.textContent = "Numer telefonu";
    			t35 = space();
    			input4 = element("input");
    			t36 = space();
    			div9 = element("div");
    			label8 = element("label");
    			label8.textContent = "Adres e-mail";
    			t38 = space();
    			input5 = element("input");
    			t39 = space();
    			div10 = element("div");
    			button = element("button");
    			button.textContent = "Dodaj ogłoszenie";
    			t41 = space();
    			footer = element("footer");
    			p = element("p");
    			p.textContent = "Support: help.jobspike@gmail.com";
    			attr_dev(h1, "class", "svelte-qm37ns");
    			add_location(h1, file$8, 2, 8, 53);
    			attr_dev(div0, "class", "tytul");
    			add_location(div0, file$8, 1, 4, 25);
    			attr_dev(label0, "for", "nazwa");
    			attr_dev(label0, "class", "svelte-qm37ns");
    			add_location(label0, file$8, 6, 12, 151);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "nazwa");
    			attr_dev(input0, "class", "svelte-qm37ns");
    			add_location(input0, file$8, 7, 12, 207);
    			attr_dev(div1, "class", "nazwa svelte-qm37ns");
    			add_location(div1, file$8, 5, 8, 119);
    			attr_dev(label1, "for", "wymiar");
    			attr_dev(label1, "class", "svelte-qm37ns");
    			add_location(label1, file$8, 10, 12, 295);
    			option0.__value = "1";
    			option0.value = option0.__value;
    			add_location(option0, file$8, 12, 16, 385);
    			option1.__value = "2";
    			option1.value = option1.__value;
    			add_location(option1, file$8, 13, 16, 439);
    			option2.__value = "3";
    			option2.value = option2.__value;
    			add_location(option2, file$8, 14, 16, 503);
    			option3.__value = "4";
    			option3.value = option3.__value;
    			add_location(option3, file$8, 15, 16, 560);
    			attr_dev(select0, "id", "wymiar");
    			attr_dev(select0, "class", "svelte-qm37ns");
    			add_location(select0, file$8, 11, 12, 348);
    			attr_dev(div2, "class", "wymiar svelte-qm37ns");
    			add_location(div2, file$8, 9, 8, 262);
    			attr_dev(label2, "for", "typ");
    			attr_dev(label2, "class", "svelte-qm37ns");
    			add_location(label2, file$8, 19, 12, 678);
    			option4.__value = "1";
    			option4.value = option4.__value;
    			add_location(option4, file$8, 21, 16, 759);
    			option5.__value = "2";
    			option5.value = option5.__value;
    			add_location(option5, file$8, 22, 16, 816);
    			option6.__value = "3";
    			option6.value = option6.__value;
    			add_location(option6, file$8, 23, 16, 874);
    			option7.__value = "4";
    			option7.value = option7.__value;
    			add_location(option7, file$8, 24, 16, 932);
    			option8.__value = "5";
    			option8.value = option8.__value;
    			add_location(option8, file$8, 25, 16, 992);
    			attr_dev(select1, "id", "typ");
    			attr_dev(select1, "class", "svelte-qm37ns");
    			add_location(select1, file$8, 20, 12, 725);
    			attr_dev(div3, "class", "typ svelte-qm37ns");
    			add_location(div3, file$8, 18, 8, 648);
    			attr_dev(label3, "for", "stanowisko");
    			attr_dev(label3, "class", "svelte-qm37ns");
    			add_location(label3, file$8, 29, 12, 1106);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "stanowisko");
    			attr_dev(input1, "class", "svelte-qm37ns");
    			add_location(input1, file$8, 30, 12, 1161);
    			attr_dev(div4, "class", "stanowisko svelte-qm37ns");
    			add_location(div4, file$8, 28, 8, 1069);
    			attr_dev(label4, "for", "wyksztalcenie");
    			attr_dev(label4, "class", "svelte-qm37ns");
    			add_location(label4, file$8, 33, 12, 1260);
    			attr_dev(input2, "id", "wyksztalcenie");
    			attr_dev(input2, "class", "svelte-qm37ns");
    			add_location(input2, file$8, 34, 12, 1321);
    			attr_dev(div5, "class", "wyksztalcenie svelte-qm37ns");
    			add_location(div5, file$8, 32, 8, 1220);
    			attr_dev(label5, "for", "miejscowosc");
    			attr_dev(label5, "class", "svelte-qm37ns");
    			add_location(label5, file$8, 37, 12, 1410);
    			attr_dev(input3, "id", "miejscowosc");
    			attr_dev(input3, "class", "svelte-qm37ns");
    			add_location(input3, file$8, 38, 12, 1467);
    			attr_dev(div6, "class", "miejscowosc svelte-qm37ns");
    			add_location(div6, file$8, 36, 8, 1372);
    			attr_dev(label6, "for", "opis");
    			attr_dev(label6, "class", "svelte-qm37ns");
    			add_location(label6, file$8, 41, 12, 1547);
    			attr_dev(textarea, "id", "opis");
    			attr_dev(textarea, "class", "svelte-qm37ns");
    			add_location(textarea, file$8, 42, 12, 1590);
    			attr_dev(div7, "class", "opis svelte-qm37ns");
    			add_location(div7, file$8, 40, 8, 1516);
    			attr_dev(h2, "class", "svelte-qm37ns");
    			add_location(h2, file$8, 44, 8, 1645);
    			attr_dev(label7, "for", "numer");
    			attr_dev(label7, "class", "svelte-qm37ns");
    			add_location(label7, file$8, 46, 12, 1702);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "id", "numer");
    			attr_dev(input4, "class", "svelte-qm37ns");
    			add_location(input4, file$8, 47, 12, 1756);
    			attr_dev(div8, "class", "numer svelte-qm37ns");
    			add_location(div8, file$8, 45, 8, 1670);
    			attr_dev(label8, "for", "email");
    			attr_dev(label8, "class", "svelte-qm37ns");
    			add_location(label8, file$8, 50, 12, 1844);
    			attr_dev(input5, "id", "email");
    			attr_dev(input5, "class", "svelte-qm37ns");
    			add_location(input5, file$8, 51, 12, 1896);
    			attr_dev(div9, "class", "email svelte-qm37ns");
    			add_location(div9, file$8, 49, 8, 1812);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-qm37ns");
    			add_location(button, file$8, 54, 12, 1972);
    			attr_dev(div10, "class", "submit svelte-qm37ns");
    			add_location(div10, file$8, 53, 8, 1939);
    			attr_dev(div11, "class", "inputs svelte-qm37ns");
    			add_location(div11, file$8, 4, 4, 90);
    			attr_dev(div12, "class", "szukam");
    			add_location(div12, file$8, 0, 0, 0);
    			add_location(p, file$8, 59, 4, 2066);
    			attr_dev(footer, "class", "svelte-qm37ns");
    			add_location(footer, file$8, 58, 0, 2053);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div0);
    			append_dev(div0, h1);
    			append_dev(div12, t1);
    			append_dev(div12, div11);
    			append_dev(div11, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div11, t4);
    			append_dev(div11, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(div11, t11);
    			append_dev(div11, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t13);
    			append_dev(div3, select1);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			append_dev(select1, option7);
    			append_dev(select1, option8);
    			append_dev(div11, t19);
    			append_dev(div11, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t21);
    			append_dev(div4, input1);
    			append_dev(div11, t22);
    			append_dev(div11, div5);
    			append_dev(div5, label4);
    			append_dev(div5, t24);
    			append_dev(div5, input2);
    			append_dev(div11, t25);
    			append_dev(div11, div6);
    			append_dev(div6, label5);
    			append_dev(div6, t27);
    			append_dev(div6, input3);
    			append_dev(div11, t28);
    			append_dev(div11, div7);
    			append_dev(div7, label6);
    			append_dev(div7, t30);
    			append_dev(div7, textarea);
    			append_dev(div11, t31);
    			append_dev(div11, h2);
    			append_dev(div11, t33);
    			append_dev(div11, div8);
    			append_dev(div8, label7);
    			append_dev(div8, t35);
    			append_dev(div8, input4);
    			append_dev(div11, t36);
    			append_dev(div11, div9);
    			append_dev(div9, label8);
    			append_dev(div9, t38);
    			append_dev(div9, input5);
    			append_dev(div11, t39);
    			append_dev(div11, div10);
    			append_dev(div10, button);
    			insert_dev(target, t41, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			if (detaching) detach_dev(t41);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dodaj_szukam', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Dodaj_szukam> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Dodaj_szukam extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dodaj_szukam",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/dodaj_dam.svelte generated by Svelte v3.44.3 */

    const file$7 = "src/components/dodaj_dam.svelte";

    function create_fragment$7(ctx) {
    	let div13;
    	let div0;
    	let h1;
    	let t1;
    	let div12;
    	let div1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let label1;
    	let t6;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t11;
    	let div3;
    	let label2;
    	let t13;
    	let select1;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let option8;
    	let t19;
    	let div4;
    	let label3;
    	let t21;
    	let input1;
    	let t22;
    	let div6;
    	let label4;
    	let t24;
    	let div5;
    	let p0;
    	let t26;
    	let input2;
    	let t27;
    	let p1;
    	let t29;
    	let input3;
    	let t30;
    	let label5;
    	let t32;
    	let input4;
    	let t33;
    	let div7;
    	let label6;
    	let t35;
    	let input5;
    	let t36;
    	let div8;
    	let label7;
    	let t38;
    	let textarea;
    	let t39;
    	let h2;
    	let t41;
    	let div9;
    	let label8;
    	let t43;
    	let input6;
    	let t44;
    	let div10;
    	let label9;
    	let t46;
    	let input7;
    	let t47;
    	let div11;
    	let button;
    	let t49;
    	let footer;
    	let p2;

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Dam prace";
    			t1 = space();
    			div12 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Nazwa ogłoszenia";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Wymiar pracy";
    			t6 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Pełen etat";
    			option1 = element("option");
    			option1.textContent = "Dodatkowa / Sezonowa";
    			option2 = element("option");
    			option2.textContent = "Niepełny etat";
    			option3 = element("option");
    			option3.textContent = "Praktyka / Staż";
    			t11 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Typ umowy";
    			t13 = space();
    			select1 = element("select");
    			option4 = element("option");
    			option4.textContent = "Umowa o pracę";
    			option5 = element("option");
    			option5.textContent = "Umowa zlecenie";
    			option6 = element("option");
    			option6.textContent = "Umowa o dzieło";
    			option7 = element("option");
    			option7.textContent = "Samozatrudnienie";
    			option8 = element("option");
    			option8.textContent = "Inny";
    			t19 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Stanowisko";
    			t21 = space();
    			input1 = element("input");
    			t22 = space();
    			div6 = element("div");
    			label4 = element("label");
    			label4.textContent = "Płaca";
    			t24 = space();
    			div5 = element("div");
    			p0 = element("p");
    			p0.textContent = "Od";
    			t26 = space();
    			input2 = element("input");
    			t27 = space();
    			p1 = element("p");
    			p1.textContent = "do";
    			t29 = space();
    			input3 = element("input");
    			t30 = space();
    			label5 = element("label");
    			label5.textContent = "Format płacy";
    			t32 = space();
    			input4 = element("input");
    			t33 = space();
    			div7 = element("div");
    			label6 = element("label");
    			label6.textContent = "Miejscowosc";
    			t35 = space();
    			input5 = element("input");
    			t36 = space();
    			div8 = element("div");
    			label7 = element("label");
    			label7.textContent = "Opis";
    			t38 = space();
    			textarea = element("textarea");
    			t39 = space();
    			h2 = element("h2");
    			h2.textContent = "Kontakt";
    			t41 = space();
    			div9 = element("div");
    			label8 = element("label");
    			label8.textContent = "Numer telefonu";
    			t43 = space();
    			input6 = element("input");
    			t44 = space();
    			div10 = element("div");
    			label9 = element("label");
    			label9.textContent = "Adres e-mail";
    			t46 = space();
    			input7 = element("input");
    			t47 = space();
    			div11 = element("div");
    			button = element("button");
    			button.textContent = "Dodaj ogłoszenie";
    			t49 = space();
    			footer = element("footer");
    			p2 = element("p");
    			p2.textContent = "Support: help.jobspike@gmail.com";
    			attr_dev(h1, "class", "svelte-ja8nki");
    			add_location(h1, file$7, 2, 8, 50);
    			attr_dev(div0, "class", "tytul");
    			add_location(div0, file$7, 1, 4, 22);
    			attr_dev(label0, "for", "nazwa");
    			attr_dev(label0, "class", "svelte-ja8nki");
    			add_location(label0, file$7, 6, 12, 145);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "nazwa");
    			attr_dev(input0, "class", "svelte-ja8nki");
    			add_location(input0, file$7, 7, 12, 201);
    			attr_dev(div1, "class", "nazwa svelte-ja8nki");
    			add_location(div1, file$7, 5, 8, 113);
    			attr_dev(label1, "for", "wymiar");
    			attr_dev(label1, "class", "svelte-ja8nki");
    			add_location(label1, file$7, 10, 12, 289);
    			option0.__value = "1";
    			option0.value = option0.__value;
    			add_location(option0, file$7, 12, 16, 379);
    			option1.__value = "2";
    			option1.value = option1.__value;
    			add_location(option1, file$7, 13, 16, 433);
    			option2.__value = "3";
    			option2.value = option2.__value;
    			add_location(option2, file$7, 14, 16, 497);
    			option3.__value = "4";
    			option3.value = option3.__value;
    			add_location(option3, file$7, 15, 16, 554);
    			attr_dev(select0, "id", "wymiar");
    			attr_dev(select0, "class", "svelte-ja8nki");
    			add_location(select0, file$7, 11, 12, 342);
    			attr_dev(div2, "class", "wymiar svelte-ja8nki");
    			add_location(div2, file$7, 9, 8, 256);
    			attr_dev(label2, "for", "typ");
    			attr_dev(label2, "class", "svelte-ja8nki");
    			add_location(label2, file$7, 19, 12, 672);
    			option4.__value = "1";
    			option4.value = option4.__value;
    			add_location(option4, file$7, 21, 16, 753);
    			option5.__value = "2";
    			option5.value = option5.__value;
    			add_location(option5, file$7, 22, 16, 810);
    			option6.__value = "3";
    			option6.value = option6.__value;
    			add_location(option6, file$7, 23, 16, 868);
    			option7.__value = "4";
    			option7.value = option7.__value;
    			add_location(option7, file$7, 24, 16, 926);
    			option8.__value = "5";
    			option8.value = option8.__value;
    			add_location(option8, file$7, 25, 16, 986);
    			attr_dev(select1, "id", "typ");
    			attr_dev(select1, "class", "svelte-ja8nki");
    			add_location(select1, file$7, 20, 12, 719);
    			attr_dev(div3, "class", "typ svelte-ja8nki");
    			add_location(div3, file$7, 18, 8, 642);
    			attr_dev(label3, "for", "stanowisko");
    			attr_dev(label3, "class", "svelte-ja8nki");
    			add_location(label3, file$7, 29, 12, 1100);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", "stanowisko");
    			attr_dev(input1, "class", "svelte-ja8nki");
    			add_location(input1, file$7, 30, 12, 1155);
    			attr_dev(div4, "class", "stanowisko svelte-ja8nki");
    			add_location(div4, file$7, 28, 8, 1063);
    			attr_dev(label4, "for", "placa1");
    			attr_dev(label4, "class", "svelte-ja8nki");
    			add_location(label4, file$7, 33, 16, 1250);
    			attr_dev(p0, "class", "od svelte-ja8nki");
    			add_location(p0, file$7, 35, 20, 1339);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "id", "placa1");
    			attr_dev(input2, "class", "svelte-ja8nki");
    			add_location(input2, file$7, 36, 20, 1380);
    			attr_dev(p1, "class", "do svelte-ja8nki");
    			add_location(p1, file$7, 37, 20, 1434);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "id", "placa2");
    			attr_dev(input3, "class", "svelte-ja8nki");
    			add_location(input3, file$7, 38, 20, 1475);
    			attr_dev(div5, "class", "oddo svelte-ja8nki");
    			add_location(div5, file$7, 34, 16, 1300);
    			attr_dev(label5, "for", "format_placy");
    			attr_dev(label5, "class", "svelte-ja8nki");
    			add_location(label5, file$7, 40, 16, 1548);
    			attr_dev(input4, "type", "text");
    			attr_dev(input4, "id", "format_placy");
    			attr_dev(input4, "placeholder", "np. brutto/mies");
    			attr_dev(input4, "class", "svelte-ja8nki");
    			add_location(input4, file$7, 41, 16, 1611);
    			attr_dev(div6, "class", "placa svelte-ja8nki");
    			add_location(div6, file$7, 32, 8, 1214);
    			attr_dev(label6, "for", "miejscowosc");
    			attr_dev(label6, "class", "svelte-ja8nki");
    			add_location(label6, file$7, 44, 12, 1741);
    			attr_dev(input5, "id", "miejscowosc");
    			attr_dev(input5, "class", "svelte-ja8nki");
    			add_location(input5, file$7, 45, 12, 1798);
    			attr_dev(div7, "class", "miejscowosc svelte-ja8nki");
    			add_location(div7, file$7, 43, 8, 1703);
    			attr_dev(label7, "for", "opis");
    			attr_dev(label7, "class", "svelte-ja8nki");
    			add_location(label7, file$7, 48, 12, 1878);
    			attr_dev(textarea, "id", "opis");
    			attr_dev(textarea, "class", "svelte-ja8nki");
    			add_location(textarea, file$7, 49, 12, 1921);
    			attr_dev(div8, "class", "opis svelte-ja8nki");
    			add_location(div8, file$7, 47, 8, 1847);
    			attr_dev(h2, "class", "svelte-ja8nki");
    			add_location(h2, file$7, 51, 8, 1976);
    			attr_dev(label8, "for", "numer");
    			attr_dev(label8, "class", "svelte-ja8nki");
    			add_location(label8, file$7, 53, 12, 2033);
    			attr_dev(input6, "type", "number");
    			attr_dev(input6, "id", "numer");
    			attr_dev(input6, "class", "svelte-ja8nki");
    			add_location(input6, file$7, 54, 12, 2087);
    			attr_dev(div9, "class", "numer svelte-ja8nki");
    			add_location(div9, file$7, 52, 8, 2001);
    			attr_dev(label9, "for", "email");
    			attr_dev(label9, "class", "svelte-ja8nki");
    			add_location(label9, file$7, 57, 12, 2175);
    			attr_dev(input7, "id", "email");
    			attr_dev(input7, "class", "svelte-ja8nki");
    			add_location(input7, file$7, 58, 12, 2227);
    			attr_dev(div10, "class", "email svelte-ja8nki");
    			add_location(div10, file$7, 56, 8, 2143);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-ja8nki");
    			add_location(button, file$7, 61, 12, 2303);
    			attr_dev(div11, "class", "submit svelte-ja8nki");
    			add_location(div11, file$7, 60, 8, 2270);
    			attr_dev(div12, "class", "inputs svelte-ja8nki");
    			add_location(div12, file$7, 4, 4, 84);
    			attr_dev(div13, "class", "dam");
    			add_location(div13, file$7, 0, 0, 0);
    			add_location(p2, file$7, 66, 4, 2397);
    			attr_dev(footer, "class", "svelte-ja8nki");
    			add_location(footer, file$7, 65, 0, 2384);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div0);
    			append_dev(div0, h1);
    			append_dev(div13, t1);
    			append_dev(div13, div12);
    			append_dev(div12, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div12, t4);
    			append_dev(div12, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t6);
    			append_dev(div2, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(div12, t11);
    			append_dev(div12, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t13);
    			append_dev(div3, select1);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			append_dev(select1, option7);
    			append_dev(select1, option8);
    			append_dev(div12, t19);
    			append_dev(div12, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t21);
    			append_dev(div4, input1);
    			append_dev(div12, t22);
    			append_dev(div12, div6);
    			append_dev(div6, label4);
    			append_dev(div6, t24);
    			append_dev(div6, div5);
    			append_dev(div5, p0);
    			append_dev(div5, t26);
    			append_dev(div5, input2);
    			append_dev(div5, t27);
    			append_dev(div5, p1);
    			append_dev(div5, t29);
    			append_dev(div5, input3);
    			append_dev(div6, t30);
    			append_dev(div6, label5);
    			append_dev(div6, t32);
    			append_dev(div6, input4);
    			append_dev(div12, t33);
    			append_dev(div12, div7);
    			append_dev(div7, label6);
    			append_dev(div7, t35);
    			append_dev(div7, input5);
    			append_dev(div12, t36);
    			append_dev(div12, div8);
    			append_dev(div8, label7);
    			append_dev(div8, t38);
    			append_dev(div8, textarea);
    			append_dev(div12, t39);
    			append_dev(div12, h2);
    			append_dev(div12, t41);
    			append_dev(div12, div9);
    			append_dev(div9, label8);
    			append_dev(div9, t43);
    			append_dev(div9, input6);
    			append_dev(div12, t44);
    			append_dev(div12, div10);
    			append_dev(div10, label9);
    			append_dev(div10, t46);
    			append_dev(div10, input7);
    			append_dev(div12, t47);
    			append_dev(div12, div11);
    			append_dev(div11, button);
    			insert_dev(target, t49, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    			if (detaching) detach_dev(t49);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dodaj_dam', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Dodaj_dam> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Dodaj_dam extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dodaj_dam",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/dam.svelte generated by Svelte v3.44.3 */

    const file$6 = "src/components/dam.svelte";

    function create_fragment$6(ctx) {
    	let div10;
    	let h1;
    	let t1;
    	let div0;
    	let input0;
    	let t2;
    	let button0;
    	let t4;
    	let div8;
    	let script;
    	let t6;
    	let button1;
    	let t8;
    	let div7;
    	let div1;
    	let label0;
    	let t10;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t15;
    	let div2;
    	let label1;
    	let t17;
    	let select1;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let option8;
    	let t23;
    	let div3;
    	let label2;
    	let t25;
    	let input1;
    	let t26;
    	let div4;
    	let label3;
    	let t28;
    	let input2;
    	let t29;
    	let div5;
    	let label4;
    	let t31;
    	let input3;
    	let t32;
    	let div6;
    	let label5;
    	let t34;
    	let select2;
    	let option9;
    	let option10;
    	let t37;
    	let button2;
    	let t39;
    	let div9;
    	let t40;
    	let footer;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Szukam pracownika";
    			t1 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = ">";
    			t4 = space();
    			div8 = element("div");
    			script = element("script");
    			script.textContent = "function menu(){\n                var x = document.getElementById(\"zmiana\");\n                if (x.style.display === \"none\"){\n                    x.style.display = \"block\"\n                } else {\n                    x.style.display = \"none\"\n                }\n            }";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Filtry";
    			t8 = space();
    			div7 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Wymiar pracy";
    			t10 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Pełen etat";
    			option1 = element("option");
    			option1.textContent = "Dodatkowa / Sezonowa";
    			option2 = element("option");
    			option2.textContent = "Niepełny etat";
    			option3 = element("option");
    			option3.textContent = "Praktyka / Staż";
    			t15 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Typ umowy";
    			t17 = space();
    			select1 = element("select");
    			option4 = element("option");
    			option4.textContent = "Umowa o pracę";
    			option5 = element("option");
    			option5.textContent = "Umowa zlecenie";
    			option6 = element("option");
    			option6.textContent = "Umowa o dzieło";
    			option7 = element("option");
    			option7.textContent = "Samozatrudnienie";
    			option8 = element("option");
    			option8.textContent = "Inne";
    			t23 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Miejscowość";
    			t25 = space();
    			input1 = element("input");
    			t26 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Szukaj w opisach";
    			t28 = space();
    			input2 = element("input");
    			t29 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "Szukaj w stanowiskach";
    			t31 = space();
    			input3 = element("input");
    			t32 = space();
    			div6 = element("div");
    			label5 = element("label");
    			label5.textContent = "Sortuj od:";
    			t34 = space();
    			select2 = element("select");
    			option9 = element("option");
    			option9.textContent = "Najowszych";
    			option10 = element("option");
    			option10.textContent = "Najstarszych";
    			t37 = space();
    			button2 = element("button");
    			button2.textContent = "Zatwierdź";
    			t39 = space();
    			div9 = element("div");
    			t40 = space();
    			footer = element("footer");
    			p = element("p");
    			p.textContent = "Support: help.jobspike@gmail.com";
    			attr_dev(h1, "class", "svelte-ou2tj9");
    			add_location(h1, file$6, 1, 4, 26);
    			attr_dev(input0, "type", "search");
    			attr_dev(input0, "id", "search");
    			attr_dev(input0, "placeholder", "Szukaj...");
    			attr_dev(input0, "class", "svelte-ou2tj9");
    			add_location(input0, file$6, 3, 8, 86);
    			attr_dev(button0, "type", "submit");
    			attr_dev(button0, "class", "svelte-ou2tj9");
    			add_location(button0, file$6, 4, 8, 152);
    			attr_dev(div0, "class", "search svelte-ou2tj9");
    			add_location(div0, file$6, 2, 4, 57);
    			add_location(script, file$6, 7, 8, 229);
    			attr_dev(button1, "type", "submit");
    			attr_dev(button1, "class", "svelte-ou2tj9");
    			add_location(button1, file$6, 17, 8, 549);
    			attr_dev(label0, "for", "wymiar");
    			attr_dev(label0, "class", "svelte-ou2tj9");
    			add_location(label0, file$6, 21, 16, 742);
    			option0.__value = "1";
    			option0.value = option0.__value;
    			add_location(option0, file$6, 23, 20, 840);
    			option1.__value = "2";
    			option1.value = option1.__value;
    			add_location(option1, file$6, 24, 20, 898);
    			option2.__value = "3";
    			option2.value = option2.__value;
    			add_location(option2, file$6, 25, 20, 966);
    			option3.__value = "4";
    			option3.value = option3.__value;
    			add_location(option3, file$6, 26, 20, 1027);
    			attr_dev(select0, "id", "wymiar");
    			attr_dev(select0, "class", "svelte-ou2tj9");
    			add_location(select0, file$6, 22, 16, 799);
    			attr_dev(div1, "class", "wymiar");
    			add_location(div1, file$6, 20, 12, 705);
    			attr_dev(label1, "for", "typ");
    			attr_dev(label1, "class", "svelte-ou2tj9");
    			add_location(label1, file$6, 31, 16, 1161);
    			option4.__value = "1";
    			option4.value = option4.__value;
    			add_location(option4, file$6, 33, 20, 1250);
    			option5.__value = "2";
    			option5.value = option5.__value;
    			add_location(option5, file$6, 34, 20, 1311);
    			option6.__value = "3";
    			option6.value = option6.__value;
    			add_location(option6, file$6, 35, 20, 1373);
    			option7.__value = "4";
    			option7.value = option7.__value;
    			add_location(option7, file$6, 36, 20, 1435);
    			option8.__value = "5";
    			option8.value = option8.__value;
    			add_location(option8, file$6, 37, 20, 1499);
    			attr_dev(select1, "id", "typ");
    			attr_dev(select1, "class", "svelte-ou2tj9");
    			add_location(select1, file$6, 32, 16, 1212);
    			attr_dev(div2, "type", "typ");
    			add_location(div2, file$6, 30, 12, 1128);
    			attr_dev(label2, "for", "miejscowosc");
    			attr_dev(label2, "class", "svelte-ou2tj9");
    			add_location(label2, file$6, 41, 16, 1630);
    			attr_dev(input1, "id", "miejscowosc");
    			attr_dev(input1, "class", "svelte-ou2tj9");
    			add_location(input1, file$6, 42, 16, 1691);
    			attr_dev(div3, "class", "miejscowosc svelte-ou2tj9");
    			add_location(div3, file$6, 40, 12, 1588);
    			attr_dev(label3, "for", "opisy");
    			attr_dev(label3, "class", "svelte-ou2tj9");
    			add_location(label3, file$6, 45, 16, 1783);
    			attr_dev(input2, "id", "opisy");
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$6, 46, 16, 1843);
    			attr_dev(div4, "class", "opisy svelte-ou2tj9");
    			add_location(div4, file$6, 44, 12, 1747);
    			attr_dev(label4, "for", "stanowiska");
    			attr_dev(label4, "class", "svelte-ou2tj9");
    			add_location(label4, file$6, 49, 16, 1950);
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file$6, 50, 16, 2020);
    			attr_dev(div5, "class", "stanowiska svelte-ou2tj9");
    			add_location(div5, file$6, 48, 12, 1909);
    			attr_dev(label5, "for", "sortuj");
    			attr_dev(label5, "class", "svelte-ou2tj9");
    			add_location(label5, file$6, 53, 16, 2112);
    			option9.__value = "1";
    			option9.value = option9.__value;
    			add_location(option9, file$6, 55, 20, 2208);
    			option10.__value = "2";
    			option10.value = option10.__value;
    			add_location(option10, file$6, 56, 20, 2266);
    			attr_dev(select2, "id", "sortuj");
    			attr_dev(select2, "class", "svelte-ou2tj9");
    			add_location(select2, file$6, 54, 16, 2167);
    			attr_dev(div6, "class", "sortuj");
    			add_location(div6, file$6, 52, 12, 2075);
    			attr_dev(button2, "id", "zatwierdz");
    			attr_dev(button2, "class", "svelte-ou2tj9");
    			add_location(button2, file$6, 59, 12, 2363);
    			attr_dev(div7, "class", "darkgreen zmienfiltry row mb-3 svelte-ou2tj9");
    			attr_dev(div7, "id", "zmiana");
    			set_style(div7, "display", "none");
    			add_location(div7, file$6, 19, 8, 613);
    			attr_dev(div8, "class", "filtry svelte-ou2tj9");
    			add_location(div8, file$6, 6, 4, 200);
    			attr_dev(div9, "class", "ogloszenia");
    			add_location(div9, file$6, 62, 4, 2435);
    			attr_dev(div10, "class", "kontent svelte-ou2tj9");
    			add_location(div10, file$6, 0, 0, 0);
    			add_location(p, file$6, 66, 4, 2491);
    			attr_dev(footer, "class", "svelte-ou2tj9");
    			add_location(footer, file$6, 65, 0, 2478);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, h1);
    			append_dev(div10, t1);
    			append_dev(div10, div0);
    			append_dev(div0, input0);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(div10, t4);
    			append_dev(div10, div8);
    			append_dev(div8, script);
    			append_dev(div8, t6);
    			append_dev(div8, button1);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div7, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t10);
    			append_dev(div1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(div7, t15);
    			append_dev(div7, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t17);
    			append_dev(div2, select1);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			append_dev(select1, option7);
    			append_dev(select1, option8);
    			append_dev(div7, t23);
    			append_dev(div7, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t25);
    			append_dev(div3, input1);
    			append_dev(div7, t26);
    			append_dev(div7, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t28);
    			append_dev(div4, input2);
    			append_dev(div7, t29);
    			append_dev(div7, div5);
    			append_dev(div5, label4);
    			append_dev(div5, t31);
    			append_dev(div5, input3);
    			append_dev(div7, t32);
    			append_dev(div7, div6);
    			append_dev(div6, label5);
    			append_dev(div6, t34);
    			append_dev(div6, select2);
    			append_dev(select2, option9);
    			append_dev(select2, option10);
    			append_dev(div7, t37);
    			append_dev(div7, button2);
    			append_dev(div10, t39);
    			append_dev(div10, div9);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p);

    			if (!mounted) {
    				dispose = listen_dev(button1, "click", menu, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Dam', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Dam> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Dam extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dam",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/szukam.svelte generated by Svelte v3.44.3 */

    const file$5 = "src/components/szukam.svelte";

    function create_fragment$5(ctx) {
    	let div10;
    	let h1;
    	let t1;
    	let div0;
    	let input0;
    	let t2;
    	let button0;
    	let t4;
    	let div8;
    	let script;
    	let t6;
    	let button1;
    	let t8;
    	let div7;
    	let div1;
    	let label0;
    	let t10;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t15;
    	let div2;
    	let label1;
    	let t17;
    	let select1;
    	let option4;
    	let option5;
    	let option6;
    	let option7;
    	let option8;
    	let t23;
    	let div3;
    	let label2;
    	let t25;
    	let input1;
    	let t26;
    	let div4;
    	let label3;
    	let t28;
    	let input2;
    	let t29;
    	let div5;
    	let label4;
    	let t31;
    	let input3;
    	let t32;
    	let div6;
    	let label5;
    	let t34;
    	let select2;
    	let option9;
    	let option10;
    	let t37;
    	let button2;
    	let t39;
    	let div9;
    	let t40;
    	let footer;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Szukam pracy";
    			t1 = space();
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = ">";
    			t4 = space();
    			div8 = element("div");
    			script = element("script");
    			script.textContent = "function menu(){\n                var x = document.getElementById(\"zmiana\");\n                if (x.style.display === \"none\"){\n                    x.style.display = \"block\"\n                } else {\n                    x.style.display = \"none\"\n                }\n            }";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Filtry";
    			t8 = space();
    			div7 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Wymiar pracy";
    			t10 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Pełen etat";
    			option1 = element("option");
    			option1.textContent = "Dodatkowa / Sezonowa";
    			option2 = element("option");
    			option2.textContent = "Niepełny etat";
    			option3 = element("option");
    			option3.textContent = "Praktyka / Staż";
    			t15 = space();
    			div2 = element("div");
    			label1 = element("label");
    			label1.textContent = "Typ umowy";
    			t17 = space();
    			select1 = element("select");
    			option4 = element("option");
    			option4.textContent = "Umowa o pracę";
    			option5 = element("option");
    			option5.textContent = "Umowa zlecenie";
    			option6 = element("option");
    			option6.textContent = "Umowa o dzieło";
    			option7 = element("option");
    			option7.textContent = "Samozatrudnienie";
    			option8 = element("option");
    			option8.textContent = "Inne";
    			t23 = space();
    			div3 = element("div");
    			label2 = element("label");
    			label2.textContent = "Miejscowość";
    			t25 = space();
    			input1 = element("input");
    			t26 = space();
    			div4 = element("div");
    			label3 = element("label");
    			label3.textContent = "Szukaj w opisach";
    			t28 = space();
    			input2 = element("input");
    			t29 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "Szukaj w stanowiskach";
    			t31 = space();
    			input3 = element("input");
    			t32 = space();
    			div6 = element("div");
    			label5 = element("label");
    			label5.textContent = "Sortuj od:";
    			t34 = space();
    			select2 = element("select");
    			option9 = element("option");
    			option9.textContent = "Najowszych";
    			option10 = element("option");
    			option10.textContent = "Najstarszych";
    			t37 = space();
    			button2 = element("button");
    			button2.textContent = "Zatwierdź";
    			t39 = space();
    			div9 = element("div");
    			t40 = space();
    			footer = element("footer");
    			p = element("p");
    			p.textContent = "Support: help.jobspike@gmail.com";
    			attr_dev(h1, "class", "svelte-1w9tw8l");
    			add_location(h1, file$5, 1, 4, 26);
    			attr_dev(input0, "type", "search");
    			attr_dev(input0, "id", "search");
    			attr_dev(input0, "placeholder", "Szukaj...");
    			attr_dev(input0, "class", "svelte-1w9tw8l");
    			add_location(input0, file$5, 3, 8, 81);
    			attr_dev(button0, "type", "submit");
    			attr_dev(button0, "class", "svelte-1w9tw8l");
    			add_location(button0, file$5, 4, 8, 147);
    			attr_dev(div0, "class", "search svelte-1w9tw8l");
    			add_location(div0, file$5, 2, 4, 52);
    			add_location(script, file$5, 7, 8, 224);
    			attr_dev(button1, "type", "submit");
    			attr_dev(button1, "class", "svelte-1w9tw8l");
    			add_location(button1, file$5, 17, 8, 544);
    			attr_dev(label0, "for", "wymiar");
    			attr_dev(label0, "class", "svelte-1w9tw8l");
    			add_location(label0, file$5, 21, 16, 737);
    			option0.__value = "1";
    			option0.value = option0.__value;
    			add_location(option0, file$5, 23, 20, 835);
    			option1.__value = "2";
    			option1.value = option1.__value;
    			add_location(option1, file$5, 24, 20, 893);
    			option2.__value = "3";
    			option2.value = option2.__value;
    			add_location(option2, file$5, 25, 20, 961);
    			option3.__value = "4";
    			option3.value = option3.__value;
    			add_location(option3, file$5, 26, 20, 1022);
    			attr_dev(select0, "id", "wymiar");
    			attr_dev(select0, "class", "svelte-1w9tw8l");
    			add_location(select0, file$5, 22, 16, 794);
    			attr_dev(div1, "class", "wymiar");
    			add_location(div1, file$5, 20, 12, 700);
    			attr_dev(label1, "for", "typ");
    			attr_dev(label1, "class", "svelte-1w9tw8l");
    			add_location(label1, file$5, 31, 16, 1156);
    			option4.__value = "1";
    			option4.value = option4.__value;
    			add_location(option4, file$5, 33, 20, 1245);
    			option5.__value = "2";
    			option5.value = option5.__value;
    			add_location(option5, file$5, 34, 20, 1306);
    			option6.__value = "3";
    			option6.value = option6.__value;
    			add_location(option6, file$5, 35, 20, 1368);
    			option7.__value = "4";
    			option7.value = option7.__value;
    			add_location(option7, file$5, 36, 20, 1430);
    			option8.__value = "5";
    			option8.value = option8.__value;
    			add_location(option8, file$5, 37, 20, 1494);
    			attr_dev(select1, "id", "typ");
    			attr_dev(select1, "class", "svelte-1w9tw8l");
    			add_location(select1, file$5, 32, 16, 1207);
    			attr_dev(div2, "type", "typ");
    			add_location(div2, file$5, 30, 12, 1123);
    			attr_dev(label2, "for", "miejscowosc");
    			attr_dev(label2, "class", "svelte-1w9tw8l");
    			add_location(label2, file$5, 41, 16, 1625);
    			attr_dev(input1, "id", "miejscowosc");
    			attr_dev(input1, "class", "svelte-1w9tw8l");
    			add_location(input1, file$5, 42, 16, 1686);
    			attr_dev(div3, "class", "miejscowosc svelte-1w9tw8l");
    			add_location(div3, file$5, 40, 12, 1583);
    			attr_dev(label3, "for", "opisy");
    			attr_dev(label3, "class", "svelte-1w9tw8l");
    			add_location(label3, file$5, 45, 16, 1778);
    			attr_dev(input2, "id", "opisy");
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$5, 46, 16, 1838);
    			attr_dev(div4, "class", "opisy svelte-1w9tw8l");
    			add_location(div4, file$5, 44, 12, 1742);
    			attr_dev(label4, "for", "stanowiska");
    			attr_dev(label4, "class", "svelte-1w9tw8l");
    			add_location(label4, file$5, 49, 16, 1945);
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file$5, 50, 16, 2015);
    			attr_dev(div5, "class", "stanowiska svelte-1w9tw8l");
    			add_location(div5, file$5, 48, 12, 1904);
    			attr_dev(label5, "for", "sortuj");
    			attr_dev(label5, "class", "svelte-1w9tw8l");
    			add_location(label5, file$5, 53, 16, 2107);
    			option9.__value = "1";
    			option9.value = option9.__value;
    			add_location(option9, file$5, 55, 20, 2203);
    			option10.__value = "2";
    			option10.value = option10.__value;
    			add_location(option10, file$5, 56, 20, 2261);
    			attr_dev(select2, "id", "sortuj");
    			attr_dev(select2, "class", "svelte-1w9tw8l");
    			add_location(select2, file$5, 54, 16, 2162);
    			attr_dev(div6, "class", "sortuj");
    			add_location(div6, file$5, 52, 12, 2070);
    			attr_dev(button2, "id", "zatwierdz");
    			attr_dev(button2, "class", "svelte-1w9tw8l");
    			add_location(button2, file$5, 59, 12, 2358);
    			attr_dev(div7, "class", "darkgreen zmienfiltry row mb-3 svelte-1w9tw8l");
    			attr_dev(div7, "id", "zmiana");
    			set_style(div7, "display", "none");
    			add_location(div7, file$5, 19, 8, 608);
    			attr_dev(div8, "class", "filtry svelte-1w9tw8l");
    			add_location(div8, file$5, 6, 4, 195);
    			attr_dev(div9, "class", "ogloszenia");
    			add_location(div9, file$5, 62, 4, 2430);
    			attr_dev(div10, "class", "kontent svelte-1w9tw8l");
    			add_location(div10, file$5, 0, 0, 0);
    			add_location(p, file$5, 66, 4, 2486);
    			attr_dev(footer, "class", "svelte-1w9tw8l");
    			add_location(footer, file$5, 65, 0, 2473);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, h1);
    			append_dev(div10, t1);
    			append_dev(div10, div0);
    			append_dev(div0, input0);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(div10, t4);
    			append_dev(div10, div8);
    			append_dev(div8, script);
    			append_dev(div8, t6);
    			append_dev(div8, button1);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div7, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t10);
    			append_dev(div1, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(div7, t15);
    			append_dev(div7, div2);
    			append_dev(div2, label1);
    			append_dev(div2, t17);
    			append_dev(div2, select1);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
    			append_dev(select1, option6);
    			append_dev(select1, option7);
    			append_dev(select1, option8);
    			append_dev(div7, t23);
    			append_dev(div7, div3);
    			append_dev(div3, label2);
    			append_dev(div3, t25);
    			append_dev(div3, input1);
    			append_dev(div7, t26);
    			append_dev(div7, div4);
    			append_dev(div4, label3);
    			append_dev(div4, t28);
    			append_dev(div4, input2);
    			append_dev(div7, t29);
    			append_dev(div7, div5);
    			append_dev(div5, label4);
    			append_dev(div5, t31);
    			append_dev(div5, input3);
    			append_dev(div7, t32);
    			append_dev(div7, div6);
    			append_dev(div6, label5);
    			append_dev(div6, t34);
    			append_dev(div6, select2);
    			append_dev(select2, option9);
    			append_dev(select2, option10);
    			append_dev(div7, t37);
    			append_dev(div7, button2);
    			append_dev(div10, t39);
    			append_dev(div10, div9);
    			insert_dev(target, t40, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p);

    			if (!mounted) {
    				dispose = listen_dev(button1, "click", menu, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if (detaching) detach_dev(t40);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Szukam', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Szukam> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Szukam extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Szukam",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/forgot.svelte generated by Svelte v3.44.3 */

    const file$4 = "src/components/forgot.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let label;
    	let t3;
    	let input;
    	let t4;
    	let div0;
    	let script;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Nie pamiętam hasła";
    			t1 = space();
    			label = element("label");
    			label.textContent = "E-mail";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div0 = element("div");
    			script = element("script");
    			script.textContent = "fuction getmail(){\n                var forgotemail = document.getElementById(\"email\").value; \n                window.location.href=`#/login/forgot/${forgotemail}`\n            }";
    			t6 = space();
    			button = element("button");
    			button.textContent = "Wyślij kod";
    			attr_dev(h1, "class", "svelte-14sy3mo");
    			add_location(h1, file$4, 1, 4, 31);
    			attr_dev(label, "for", "email");
    			attr_dev(label, "class", "svelte-14sy3mo");
    			add_location(label, file$4, 2, 4, 63);
    			attr_dev(input, "id", "email");
    			attr_dev(input, "type", "email");
    			attr_dev(input, "class", "svelte-14sy3mo");
    			add_location(input, file$4, 3, 4, 101);
    			add_location(script, file$4, 5, 8, 165);
    			attr_dev(button, "class", "svelte-14sy3mo");
    			add_location(button, file$4, 11, 8, 389);
    			attr_dev(div0, "class", "guzik svelte-14sy3mo");
    			add_location(div0, file$4, 4, 4, 137);
    			attr_dev(div1, "class", "green forgot svelte-14sy3mo");
    			add_location(div1, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, label);
    			append_dev(div1, t3);
    			append_dev(div1, input);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, script);
    			append_dev(div0, t6);
    			append_dev(div0, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", getmail, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Forgot', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Forgot> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Forgot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Forgot",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/kod.svelte generated by Svelte v3.44.3 */

    const file$3 = "src/components/kod.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let label;
    	let t3;
    	let input;
    	let t4;
    	let div0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Wysłaliśmy kod na twój e-mail";
    			t1 = space();
    			label = element("label");
    			label.textContent = "Kod";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "Potwiedź kod";
    			attr_dev(h1, "class", "svelte-14sy3mo");
    			add_location(h1, file$3, 1, 4, 31);
    			attr_dev(label, "for", "kod");
    			attr_dev(label, "class", "svelte-14sy3mo");
    			add_location(label, file$3, 2, 4, 74);
    			attr_dev(input, "id", "kod");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "svelte-14sy3mo");
    			add_location(input, file$3, 3, 4, 107);
    			attr_dev(button, "class", "svelte-14sy3mo");
    			add_location(button, file$3, 5, 7, 169);
    			attr_dev(div0, "class", "guzik svelte-14sy3mo");
    			add_location(div0, file$3, 4, 4, 142);
    			attr_dev(div1, "class", "green forgot svelte-14sy3mo");
    			add_location(div1, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, label);
    			append_dev(div1, t3);
    			append_dev(div1, input);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", cos, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Kod', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Kod> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Kod extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Kod",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/zmienhaslo.svelte generated by Svelte v3.44.3 */

    const file$2 = "src/components/zmienhaslo.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Zmień hasło";
    			t1 = space();
    			label0 = element("label");
    			label0.textContent = "Hasło";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			label1.textContent = "Potwiedź hasło";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "Zmień";
    			attr_dev(h1, "class", "svelte-14sy3mo");
    			add_location(h1, file$2, 1, 4, 31);
    			attr_dev(label0, "for", "haslo");
    			attr_dev(label0, "class", "svelte-14sy3mo");
    			add_location(label0, file$2, 2, 4, 56);
    			attr_dev(input0, "id", "haslo");
    			attr_dev(input0, "class", "svelte-14sy3mo");
    			add_location(input0, file$2, 3, 4, 93);
    			attr_dev(label1, "for", "potwierdzhaslo");
    			attr_dev(label1, "class", "svelte-14sy3mo");
    			add_location(label1, file$2, 4, 4, 116);
    			attr_dev(input1, "id", "potwierdzhaslo");
    			attr_dev(input1, "class", "svelte-14sy3mo");
    			add_location(input1, file$2, 5, 4, 171);
    			attr_dev(button, "class", "svelte-14sy3mo");
    			add_location(button, file$2, 7, 7, 230);
    			attr_dev(div0, "class", "guzik svelte-14sy3mo");
    			add_location(div0, file$2, 6, 4, 203);
    			attr_dev(div1, "class", "green forgot svelte-14sy3mo");
    			add_location(div1, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, label0);
    			append_dev(div1, t3);
    			append_dev(div1, input0);
    			append_dev(div1, t4);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			append_dev(div1, t7);
    			append_dev(div1, div0);
    			append_dev(div0, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", cos, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Zmienhaslo', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Zmienhaslo> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Zmienhaslo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Zmienhaslo",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Card.svelte generated by Svelte v3.44.3 */

    const file$1 = "src/components/Card.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "card-content");
    			add_location(div0, file$1, 5, 4, 54);
    			attr_dev(div1, "class", "card container svelte-198qbbj");
    			add_location(div1, file$1, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Card', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.3 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (58:2) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("404: Page not Found");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(58:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (56:51) 
    function create_if_block_9(ctx) {
    	let zmiana;
    	let current;
    	zmiana = new Zmienhaslo({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(zmiana.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(zmiana, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(zmiana.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(zmiana.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(zmiana, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(56:51) ",
    		ctx
    	});

    	return block;
    }

    // (54:44) 
    function create_if_block_8(ctx) {
    	let kod;
    	let current;
    	kod = new Kod({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(kod.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(kod, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(kod.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(kod.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(kod, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(54:44) ",
    		ctx
    	});

    	return block;
    }

    // (52:38) 
    function create_if_block_7(ctx) {
    	let forgot;
    	let current;
    	forgot = new Forgot({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(forgot.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(forgot, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(forgot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(forgot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(forgot, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(52:38) ",
    		ctx
    	});

    	return block;
    }

    // (50:32) 
    function create_if_block_6(ctx) {
    	let szukam;
    	let current;
    	szukam = new Szukam({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(szukam.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(szukam, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(szukam.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(szukam.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(szukam, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(50:32) ",
    		ctx
    	});

    	return block;
    }

    // (48:29) 
    function create_if_block_5(ctx) {
    	let dam;
    	let current;
    	dam = new Dam({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(dam.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(dam, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dam.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dam.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(dam, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(48:29) ",
    		ctx
    	});

    	return block;
    }

    // (46:38) 
    function create_if_block_4(ctx) {
    	let szukamdodaj;
    	let current;
    	szukamdodaj = new Dodaj_szukam({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(szukamdodaj.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(szukamdodaj, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(szukamdodaj.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(szukamdodaj.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(szukamdodaj, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(46:38) ",
    		ctx
    	});

    	return block;
    }

    // (44:35) 
    function create_if_block_3(ctx) {
    	let damdodaj;
    	let current;
    	damdodaj = new Dodaj_dam({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(damdodaj.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(damdodaj, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(damdodaj.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(damdodaj.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(damdodaj, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(44:35) ",
    		ctx
    	});

    	return block;
    }

    // (42:33) 
    function create_if_block_2(ctx) {
    	let rejestr;
    	let current;
    	rejestr = new Register({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(rejestr.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(rejestr, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rejestr.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rejestr.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(rejestr, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(42:33) ",
    		ctx
    	});

    	return block;
    }

    // (38:31) 
    function create_if_block_1(ctx) {
    	let login;
    	let current;
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(38:31) ",
    		ctx
    	});

    	return block;
    }

    // (34:1) {#if page===""}
    function create_if_block(ctx) {
    	let home;
    	let current;
    	home = new Main({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:1) {#if page===\\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7,
    		create_if_block_8,
    		create_if_block_9,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*page*/ ctx[0] === "") return 0;
    		if (/*page*/ ctx[0] === "#/login") return 1;
    		if (/*page*/ ctx[0] === "#/rejestr") return 2;
    		if (/*page*/ ctx[0] === "#/dodaj_dam") return 3;
    		if (/*page*/ ctx[0] === "#/dodaj_szukam") return 4;
    		if (/*page*/ ctx[0] === "#/dam") return 5;
    		if (/*page*/ ctx[0] === "#/szukam") return 6;
    		if (/*page*/ ctx[0] === "#/login/forgot") return 7;
    		if (/*page*/ ctx[0] === `#/login/forgot/email`) return 8;
    		if (/*page*/ ctx[0] === `#/login/forgot/email/change`) return 9;
    		return 10;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-olt8e9");
    			add_location(main, file, 32, 0, 986);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let articles = [];

    	onMount(async () => {
    		try {
    			const response = await fetch('http://localhost:8899/api/articles');
    			const data = await response.json();
    			console.log(data.articles);
    			articles = data.articles;
    		} catch(error) {
    			console.log(error);
    		}
    	});

    	let page = document.location.hash;

    	window.onpopstate = function (event) {
    		$$invalidate(0, page = document.location.hash);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Home: Main,
    		Login,
    		Rejestr: Register,
    		SzukamDodaj: Dodaj_szukam,
    		DamDodaj: Dodaj_dam,
    		onMount,
    		Dam,
    		Szukam,
    		Forgot,
    		Kod,
    		Zmiana: Zmienhaslo,
    		Card,
    		articles,
    		page
    	});

    	$$self.$inject_state = $$props => {
    		if ('articles' in $$props) articles = $$props.articles;
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
