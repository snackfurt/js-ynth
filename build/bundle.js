
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
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
    function init$1(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /* src/components/Panel.svelte generated by Svelte v3.44.2 */

    const file$9 = "src/components/Panel.svelte";

    // (3:8) {#if removeHandler}
    function create_if_block_1$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "❌";
    			attr_dev(button, "class", "remove-button svelte-1rydcio");
    			add_location(button, file$9, 3, 12, 91);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*removeHandler*/ ctx[2])) /*removeHandler*/ ctx[2].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(3:8) {#if removeHandler}",
    		ctx
    	});

    	return block;
    }

    // (8:53) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("↧");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(8:53) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:31) {#if isOpen}
    function create_if_block$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("↥");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(8:31) {#if isOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let button;
    	let span0;
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let section;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*removeHandler*/ ctx[2] && create_if_block_1$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*isOpen*/ ctx[0]) return create_if_block$4;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			button = element("button");
    			span0 = element("span");
    			t1 = text(/*heading*/ ctx[1]);
    			t2 = space();
    			span1 = element("span");
    			if_block1.c();
    			t3 = space();
    			section = element("section");
    			if (default_slot) default_slot.c();
    			attr_dev(span0, "class", "heading svelte-1rydcio");
    			add_location(span0, file$9, 6, 12, 262);
    			attr_dev(span1, "class", "icon svelte-1rydcio");
    			add_location(span1, file$9, 7, 12, 313);
    			attr_dev(button, "class", "panel-button svelte-1rydcio");
    			add_location(button, file$9, 5, 8, 186);
    			attr_dev(div0, "class", "panel-header svelte-1rydcio");
    			add_location(div0, file$9, 1, 4, 24);
    			attr_dev(section, "class", "panel-content svelte-1rydcio");
    			toggle_class(section, "isOpen", /*isOpen*/ ctx[0]);
    			add_location(section, file$9, 11, 4, 420);
    			attr_dev(div1, "class", "panel");
    			add_location(div1, file$9, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(button, span0);
    			append_dev(span0, t1);
    			append_dev(button, t2);
    			append_dev(button, span1);
    			if_block1.m(span1, null);
    			append_dev(div1, t3);
    			append_dev(div1, section);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*removeHandler*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*heading*/ 2) set_data_dev(t1, /*heading*/ ctx[1]);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(span1, null);
    				}
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[3],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*isOpen*/ 1) {
    				toggle_class(section, "isOpen", /*isOpen*/ ctx[0]);
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
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Panel', slots, ['default']);
    	let { heading } = $$props;
    	let { isOpen } = $$props;
    	let { removeHandler = null } = $$props;
    	const writable_props = ['heading', 'isOpen', 'removeHandler'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Panel> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, isOpen = !isOpen);

    	$$self.$$set = $$props => {
    		if ('heading' in $$props) $$invalidate(1, heading = $$props.heading);
    		if ('isOpen' in $$props) $$invalidate(0, isOpen = $$props.isOpen);
    		if ('removeHandler' in $$props) $$invalidate(2, removeHandler = $$props.removeHandler);
    		if ('$$scope' in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ heading, isOpen, removeHandler });

    	$$self.$inject_state = $$props => {
    		if ('heading' in $$props) $$invalidate(1, heading = $$props.heading);
    		if ('isOpen' in $$props) $$invalidate(0, isOpen = $$props.isOpen);
    		if ('removeHandler' in $$props) $$invalidate(2, removeHandler = $$props.removeHandler);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isOpen, heading, removeHandler, $$scope, slots, click_handler];
    }

    class Panel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$c, create_fragment$c, safe_not_equal, { heading: 1, isOpen: 0, removeHandler: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*heading*/ ctx[1] === undefined && !('heading' in props)) {
    			console.warn("<Panel> was created without expected prop 'heading'");
    		}

    		if (/*isOpen*/ ctx[0] === undefined && !('isOpen' in props)) {
    			console.warn("<Panel> was created without expected prop 'isOpen'");
    		}
    	}

    	get heading() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set heading(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isOpen() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isOpen(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeHandler() {
    		throw new Error("<Panel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeHandler(value) {
    		throw new Error("<Panel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/modules/AudioInput.svelte generated by Svelte v3.44.2 */
    const file$8 = "src/modules/AudioInput.svelte";

    // (1:0) <Panel heading="AUDIO INPUT" isOpen={true} removeHandler={() => removeHandler()}>
    function create_default_slot$2(ctx) {
    	let label0;
    	let input0;
    	let t0;
    	let t1;
    	let label1;
    	let input1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label0 = element("label");
    			input0 = element("input");
    			t0 = text("\n        echo cancellation");
    			t1 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t2 = text("\n        noise suppression");
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$8, 2, 8, 102);
    			attr_dev(label0, "class", "svelte-mkl884");
    			add_location(label0, file$8, 1, 4, 86);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$8, 6, 8, 220);
    			attr_dev(label1, "class", "svelte-mkl884");
    			add_location(label1, file$8, 5, 4, 204);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label0, anchor);
    			append_dev(label0, input0);
    			input0.checked = /*useEchoCancellation*/ ctx[0];
    			append_dev(label0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, label1, anchor);
    			append_dev(label1, input1);
    			input1.checked = /*useNoiseSuppression*/ ctx[1];
    			append_dev(label1, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[3]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*useEchoCancellation*/ 1) {
    				input0.checked = /*useEchoCancellation*/ ctx[0];
    			}

    			if (dirty & /*useNoiseSuppression*/ 2) {
    				input1.checked = /*useNoiseSuppression*/ ctx[1];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(label1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(1:0) <Panel heading=\\\"AUDIO INPUT\\\" isOpen={true} removeHandler={() => removeHandler()}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				heading: "AUDIO INPUT",
    				isOpen: true,
    				removeHandler: /*func*/ ctx[5],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel_changes = {};
    			if (dirty & /*removeHandler*/ 4) panel_changes.removeHandler = /*func*/ ctx[5];

    			if (dirty & /*$$scope, useNoiseSuppression, useEchoCancellation*/ 67) {
    				panel_changes.$$scope = { dirty, ctx };
    			}

    			panel.$set(panel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel, detaching);
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

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AudioInput', slots, []);
    	let { removeHandler } = $$props;
    	let { useEchoCancellation } = $$props;
    	let { useNoiseSuppression } = $$props;
    	const writable_props = ['removeHandler', 'useEchoCancellation', 'useNoiseSuppression'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AudioInput> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		useEchoCancellation = this.checked;
    		$$invalidate(0, useEchoCancellation);
    	}

    	function input1_change_handler() {
    		useNoiseSuppression = this.checked;
    		$$invalidate(1, useNoiseSuppression);
    	}

    	const func = () => removeHandler();

    	$$self.$$set = $$props => {
    		if ('removeHandler' in $$props) $$invalidate(2, removeHandler = $$props.removeHandler);
    		if ('useEchoCancellation' in $$props) $$invalidate(0, useEchoCancellation = $$props.useEchoCancellation);
    		if ('useNoiseSuppression' in $$props) $$invalidate(1, useNoiseSuppression = $$props.useNoiseSuppression);
    	};

    	$$self.$capture_state = () => ({
    		Panel,
    		removeHandler,
    		useEchoCancellation,
    		useNoiseSuppression
    	});

    	$$self.$inject_state = $$props => {
    		if ('removeHandler' in $$props) $$invalidate(2, removeHandler = $$props.removeHandler);
    		if ('useEchoCancellation' in $$props) $$invalidate(0, useEchoCancellation = $$props.useEchoCancellation);
    		if ('useNoiseSuppression' in $$props) $$invalidate(1, useNoiseSuppression = $$props.useNoiseSuppression);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		useEchoCancellation,
    		useNoiseSuppression,
    		removeHandler,
    		input0_change_handler,
    		input1_change_handler,
    		func
    	];
    }

    class AudioInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			removeHandler: 2,
    			useEchoCancellation: 0,
    			useNoiseSuppression: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AudioInput",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*removeHandler*/ ctx[2] === undefined && !('removeHandler' in props)) {
    			console.warn("<AudioInput> was created without expected prop 'removeHandler'");
    		}

    		if (/*useEchoCancellation*/ ctx[0] === undefined && !('useEchoCancellation' in props)) {
    			console.warn("<AudioInput> was created without expected prop 'useEchoCancellation'");
    		}

    		if (/*useNoiseSuppression*/ ctx[1] === undefined && !('useNoiseSuppression' in props)) {
    			console.warn("<AudioInput> was created without expected prop 'useNoiseSuppression'");
    		}
    	}

    	get removeHandler() {
    		throw new Error("<AudioInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeHandler(value) {
    		throw new Error("<AudioInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get useEchoCancellation() {
    		throw new Error("<AudioInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useEchoCancellation(value) {
    		throw new Error("<AudioInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get useNoiseSuppression() {
    		throw new Error("<AudioInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useNoiseSuppression(value) {
    		throw new Error("<AudioInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Knob.svelte generated by Svelte v3.44.2 */

    const file$7 = "src/components/Knob.svelte";

    // (3:4) {#if enableInverse}
    function create_if_block$3(ctx) {
    	let button;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			span.textContent = "⅟";
    			attr_dev(span, "class", "icon");
    			add_location(span, file$7, 3, 99, 188);
    			attr_dev(button, "class", "inverseButton svelte-zaktlo");
    			toggle_class(button, "useInverse", /*useInverse*/ ctx[0]);
    			add_location(button, file$7, 3, 8, 97);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*useInverse*/ 1) {
    				toggle_class(button, "useInverse", /*useInverse*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(3:4) {#if enableInverse}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let div2;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let div3;
    	let button0;
    	let span0;
    	let t9;
    	let button1;
    	let span1;
    	let mounted;
    	let dispose;
    	let if_block = /*enableInverse*/ ctx[3] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			div2 = element("div");
    			t4 = text(/*displayedValue*/ ctx[4]);
    			t5 = space();
    			t6 = text(/*unit*/ ctx[2]);
    			t7 = space();
    			div3 = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "+";
    			t9 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "−";
    			attr_dev(div0, "class", "label svelte-zaktlo");
    			add_location(div0, file$7, 1, 4, 32);
    			attr_dev(div1, "class", "knob center svelte-zaktlo");
    			set_style(div1, "--rotation", /*rotation*/ ctx[5]);
    			add_location(div1, file$7, 5, 4, 239);
    			attr_dev(div2, "class", "label svelte-zaktlo");
    			add_location(div2, file$7, 6, 4, 335);
    			attr_dev(span0, "class", "icon");
    			add_location(span0, file$7, 8, 66, 488);
    			attr_dev(button0, "class", "stepButton svelte-zaktlo");
    			add_location(button0, file$7, 8, 8, 430);
    			attr_dev(span1, "class", "icon");
    			add_location(span1, file$7, 9, 68, 598);
    			attr_dev(button1, "class", "stepButton svelte-zaktlo");
    			add_location(button1, file$7, 9, 8, 538);
    			attr_dev(div3, "class", "stepButtonContainer svelte-zaktlo");
    			add_location(div3, file$7, 7, 4, 388);
    			attr_dev(div4, "class", "knobContainer svelte-zaktlo");
    			add_location(div4, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			if (if_block) if_block.m(div4, null);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			append_dev(div2, t4);
    			append_dev(div2, t5);
    			append_dev(div2, t6);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, button0);
    			append_dev(button0, span0);
    			append_dev(div3, t9);
    			append_dev(div3, button1);
    			append_dev(button1, span1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "pointerdown", /*knobClicked*/ ctx[6], false, false, false),
    					listen_dev(button0, "pointerdown", /*stepUpClicked*/ ctx[7], false, false, false),
    					listen_dev(button1, "pointerdown", /*stepDownClicked*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (/*enableInverse*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div4, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*rotation*/ 32) {
    				set_style(div1, "--rotation", /*rotation*/ ctx[5]);
    			}

    			if (dirty & /*displayedValue*/ 16) set_data_dev(t4, /*displayedValue*/ ctx[4]);
    			if (dirty & /*unit*/ 4) set_data_dev(t6, /*unit*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
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

    function round(num) {
    	return num.toFixed(3);
    }

    function clamp(num, min, max) {
    	return Math.round(Math.max(min, Math.min(num, max)));
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let valueRange;
    	let rotation;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Knob', slots, []);
    	let { value, min, max } = $$props;
    	let { rotRange = 2 * Math.PI * 0.83 } = $$props;
    	let { pixelRange = 200 } = $$props;
    	let { startRotation = -Math.PI * 0.83 } = $$props;
    	let { title = '' } = $$props;
    	let { unit = '' } = $$props;
    	let { outputValue = null } = $$props;
    	let { enableInverse = false } = $$props;
    	let { useInverse = false } = $$props;
    	let startY, startValue, stepButtonDown, stepButtonTimeout;
    	let displayedValue;

    	function knobClicked({ clientY }) {
    		startY = clientY;
    		startValue = value;
    		window.addEventListener('pointermove', knobMoved);
    		window.addEventListener('pointerup', knobReleased);
    	}

    	function knobMoved({ clientY }) {
    		const valueDiff = valueRange * (clientY - startY) / pixelRange;
    		$$invalidate(9, value = clamp(startValue - valueDiff, min, max));
    	}

    	function knobReleased() {
    		window.removeEventListener('pointermove', knobMoved);
    		window.removeEventListener('pointerup', knobReleased);
    	}

    	function stepUpClicked() {
    		stepButtonDown = true;
    		stepUp();
    		window.addEventListener('pointerup', stepReleased);
    	}

    	function stepDownClicked() {
    		stepButtonDown = true;
    		stepDown();
    		window.addEventListener('pointerup', stepReleased);
    	}

    	function stepReleased() {
    		stepButtonDown = false;
    		clearTimeout(stepButtonTimeout);
    		window.removeEventListener('pointerup', stepReleased);
    	}

    	function stepUp() {
    		if (stepButtonDown && value < max) {
    			$$invalidate(9, value = value + 1);
    			stepButtonTimeout = setTimeout(stepUp, 300);
    		}
    	}

    	function stepDown() {
    		if (stepButtonDown && value > min) {
    			$$invalidate(9, value = value - 1);
    			stepButtonTimeout = setTimeout(stepDown, 300);
    		}
    	}

    	const writable_props = [
    		'value',
    		'min',
    		'max',
    		'rotRange',
    		'pixelRange',
    		'startRotation',
    		'title',
    		'unit',
    		'outputValue',
    		'enableInverse',
    		'useInverse'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Knob> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(0, useInverse = !useInverse);
    	};

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(9, value = $$props.value);
    		if ('min' in $$props) $$invalidate(10, min = $$props.min);
    		if ('max' in $$props) $$invalidate(11, max = $$props.max);
    		if ('rotRange' in $$props) $$invalidate(12, rotRange = $$props.rotRange);
    		if ('pixelRange' in $$props) $$invalidate(13, pixelRange = $$props.pixelRange);
    		if ('startRotation' in $$props) $$invalidate(14, startRotation = $$props.startRotation);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('outputValue' in $$props) $$invalidate(15, outputValue = $$props.outputValue);
    		if ('enableInverse' in $$props) $$invalidate(3, enableInverse = $$props.enableInverse);
    		if ('useInverse' in $$props) $$invalidate(0, useInverse = $$props.useInverse);
    	};

    	$$self.$capture_state = () => ({
    		value,
    		min,
    		max,
    		rotRange,
    		pixelRange,
    		startRotation,
    		title,
    		unit,
    		outputValue,
    		enableInverse,
    		useInverse,
    		startY,
    		startValue,
    		stepButtonDown,
    		stepButtonTimeout,
    		displayedValue,
    		round,
    		clamp,
    		knobClicked,
    		knobMoved,
    		knobReleased,
    		stepUpClicked,
    		stepDownClicked,
    		stepReleased,
    		stepUp,
    		stepDown,
    		valueRange,
    		rotation
    	});

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(9, value = $$props.value);
    		if ('min' in $$props) $$invalidate(10, min = $$props.min);
    		if ('max' in $$props) $$invalidate(11, max = $$props.max);
    		if ('rotRange' in $$props) $$invalidate(12, rotRange = $$props.rotRange);
    		if ('pixelRange' in $$props) $$invalidate(13, pixelRange = $$props.pixelRange);
    		if ('startRotation' in $$props) $$invalidate(14, startRotation = $$props.startRotation);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('outputValue' in $$props) $$invalidate(15, outputValue = $$props.outputValue);
    		if ('enableInverse' in $$props) $$invalidate(3, enableInverse = $$props.enableInverse);
    		if ('useInverse' in $$props) $$invalidate(0, useInverse = $$props.useInverse);
    		if ('startY' in $$props) startY = $$props.startY;
    		if ('startValue' in $$props) startValue = $$props.startValue;
    		if ('stepButtonDown' in $$props) stepButtonDown = $$props.stepButtonDown;
    		if ('stepButtonTimeout' in $$props) stepButtonTimeout = $$props.stepButtonTimeout;
    		if ('displayedValue' in $$props) $$invalidate(4, displayedValue = $$props.displayedValue);
    		if ('valueRange' in $$props) $$invalidate(16, valueRange = $$props.valueRange);
    		if ('rotation' in $$props) $$invalidate(5, rotation = $$props.rotation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*max, min*/ 3072) {
    			$$invalidate(16, valueRange = max - min);
    		}

    		if ($$self.$$.dirty & /*startRotation, value, min, valueRange, rotRange*/ 87552) {
    			$$invalidate(5, rotation = startRotation + (value - min) / valueRange * rotRange);
    		}

    		if ($$self.$$.dirty & /*outputValue, useInverse, value*/ 33281) {
    			$$invalidate(4, displayedValue = outputValue ?? (useInverse ? round(1 / value) : value));
    		}
    	};

    	return [
    		useInverse,
    		title,
    		unit,
    		enableInverse,
    		displayedValue,
    		rotation,
    		knobClicked,
    		stepUpClicked,
    		stepDownClicked,
    		value,
    		min,
    		max,
    		rotRange,
    		pixelRange,
    		startRotation,
    		outputValue,
    		valueRange,
    		click_handler
    	];
    }

    class Knob extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			value: 9,
    			min: 10,
    			max: 11,
    			rotRange: 12,
    			pixelRange: 13,
    			startRotation: 14,
    			title: 1,
    			unit: 2,
    			outputValue: 15,
    			enableInverse: 3,
    			useInverse: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Knob",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[9] === undefined && !('value' in props)) {
    			console.warn("<Knob> was created without expected prop 'value'");
    		}

    		if (/*min*/ ctx[10] === undefined && !('min' in props)) {
    			console.warn("<Knob> was created without expected prop 'min'");
    		}

    		if (/*max*/ ctx[11] === undefined && !('max' in props)) {
    			console.warn("<Knob> was created without expected prop 'max'");
    		}
    	}

    	get value() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotRange() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotRange(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pixelRange() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pixelRange(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startRotation() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startRotation(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outputValue() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outputValue(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get enableInverse() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enableInverse(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get useInverse() {
    		throw new Error("<Knob>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useInverse(value) {
    		throw new Error("<Knob>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/modules/soundwave/OscillatorControls.svelte generated by Svelte v3.44.2 */
    const file$6 = "src/modules/soundwave/OscillatorControls.svelte";
    const get_label_slot_changes = dirty => ({});
    const get_label_slot_context = ctx => ({});
    const get_knob3_slot_changes = dirty => ({});
    const get_knob3_slot_context = ctx => ({});

    function create_fragment$9(ctx) {
    	let div2;
    	let div0;
    	let knob0;
    	let updating_value;
    	let t0;
    	let knob1;
    	let updating_value_1;
    	let updating_useInverse;
    	let t1;
    	let t2;
    	let div1;
    	let current;

    	function knob0_value_binding(value) {
    		/*knob0_value_binding*/ ctx[11](value);
    	}

    	let knob0_props = {
    		title: "WAVE TYPE",
    		outputValue: /*waveType*/ ctx[1],
    		max: 4,
    		min: 1
    	};

    	if (/*waveTypeValue*/ ctx[6] !== void 0) {
    		knob0_props.value = /*waveTypeValue*/ ctx[6];
    	}

    	knob0 = new Knob({ props: knob0_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob0, 'value', knob0_value_binding));

    	function knob1_value_binding(value) {
    		/*knob1_value_binding*/ ctx[12](value);
    	}

    	function knob1_useInverse_binding(value) {
    		/*knob1_useInverse_binding*/ ctx[13](value);
    	}

    	let knob1_props = {
    		title: "FREQUENCY",
    		unit: "Hz",
    		max: /*maxFrequency*/ ctx[2],
    		min: /*minFrequency*/ ctx[3],
    		enableInverse: /*enableInverseFrequency*/ ctx[5]
    	};

    	if (/*frequencyValue*/ ctx[7] !== void 0) {
    		knob1_props.value = /*frequencyValue*/ ctx[7];
    	}

    	if (/*useInverseFrequency*/ ctx[0] !== void 0) {
    		knob1_props.useInverse = /*useInverseFrequency*/ ctx[0];
    	}

    	knob1 = new Knob({ props: knob1_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob1, 'value', knob1_value_binding));
    	binding_callbacks.push(() => bind(knob1, 'useInverse', knob1_useInverse_binding));
    	const knob3_slot_template = /*#slots*/ ctx[10].knob3;
    	const knob3_slot = create_slot(knob3_slot_template, ctx, /*$$scope*/ ctx[9], get_knob3_slot_context);
    	const label_slot_template = /*#slots*/ ctx[10].label;
    	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[9], get_label_slot_context);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(knob0.$$.fragment);
    			t0 = space();
    			create_component(knob1.$$.fragment);
    			t1 = space();
    			if (knob3_slot) knob3_slot.c();
    			t2 = space();
    			div1 = element("div");
    			if (label_slot) label_slot.c();
    			attr_dev(div0, "class", "controls svelte-15aqzp1");
    			toggle_class(div0, "disabled", /*disabled*/ ctx[4]);
    			add_location(div0, file$6, 1, 4, 28);
    			attr_dev(div1, "class", "labelContainer svelte-15aqzp1");
    			add_location(div1, file$6, 6, 4, 403);
    			attr_dev(div2, "class", "container svelte-15aqzp1");
    			add_location(div2, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(knob0, div0, null);
    			append_dev(div0, t0);
    			mount_component(knob1, div0, null);
    			append_dev(div0, t1);

    			if (knob3_slot) {
    				knob3_slot.m(div0, null);
    			}

    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			if (label_slot) {
    				label_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const knob0_changes = {};
    			if (dirty & /*waveType*/ 2) knob0_changes.outputValue = /*waveType*/ ctx[1];

    			if (!updating_value && dirty & /*waveTypeValue*/ 64) {
    				updating_value = true;
    				knob0_changes.value = /*waveTypeValue*/ ctx[6];
    				add_flush_callback(() => updating_value = false);
    			}

    			knob0.$set(knob0_changes);
    			const knob1_changes = {};
    			if (dirty & /*maxFrequency*/ 4) knob1_changes.max = /*maxFrequency*/ ctx[2];
    			if (dirty & /*minFrequency*/ 8) knob1_changes.min = /*minFrequency*/ ctx[3];
    			if (dirty & /*enableInverseFrequency*/ 32) knob1_changes.enableInverse = /*enableInverseFrequency*/ ctx[5];

    			if (!updating_value_1 && dirty & /*frequencyValue*/ 128) {
    				updating_value_1 = true;
    				knob1_changes.value = /*frequencyValue*/ ctx[7];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			if (!updating_useInverse && dirty & /*useInverseFrequency*/ 1) {
    				updating_useInverse = true;
    				knob1_changes.useInverse = /*useInverseFrequency*/ ctx[0];
    				add_flush_callback(() => updating_useInverse = false);
    			}

    			knob1.$set(knob1_changes);

    			if (knob3_slot) {
    				if (knob3_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						knob3_slot,
    						knob3_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(knob3_slot_template, /*$$scope*/ ctx[9], dirty, get_knob3_slot_changes),
    						get_knob3_slot_context
    					);
    				}
    			}

    			if (dirty & /*disabled*/ 16) {
    				toggle_class(div0, "disabled", /*disabled*/ ctx[4]);
    			}

    			if (label_slot) {
    				if (label_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						label_slot,
    						label_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(label_slot_template, /*$$scope*/ ctx[9], dirty, get_label_slot_changes),
    						get_label_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(knob0.$$.fragment, local);
    			transition_in(knob1.$$.fragment, local);
    			transition_in(knob3_slot, local);
    			transition_in(label_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(knob0.$$.fragment, local);
    			transition_out(knob1.$$.fragment, local);
    			transition_out(knob3_slot, local);
    			transition_out(label_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(knob0);
    			destroy_component(knob1);
    			if (knob3_slot) knob3_slot.d(detaching);
    			if (label_slot) label_slot.d(detaching);
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

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('OscillatorControls', slots, ['knob3','label']);
    	let { waveType } = $$props;
    	let { frequency } = $$props;
    	let { useInverseFrequency = false } = $$props;
    	let { maxFrequency } = $$props;
    	let { minFrequency } = $$props;
    	let { disabled = false } = $$props;
    	let { enableInverseFrequency = false } = $$props;
    	let waveTypeValue = 1;
    	let frequencyValue = frequency;
    	const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];

    	const writable_props = [
    		'waveType',
    		'frequency',
    		'useInverseFrequency',
    		'maxFrequency',
    		'minFrequency',
    		'disabled',
    		'enableInverseFrequency'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<OscillatorControls> was created with unknown prop '${key}'`);
    	});

    	function knob0_value_binding(value) {
    		waveTypeValue = value;
    		$$invalidate(6, waveTypeValue);
    	}

    	function knob1_value_binding(value) {
    		frequencyValue = value;
    		$$invalidate(7, frequencyValue);
    	}

    	function knob1_useInverse_binding(value) {
    		useInverseFrequency = value;
    		$$invalidate(0, useInverseFrequency);
    	}

    	$$self.$$set = $$props => {
    		if ('waveType' in $$props) $$invalidate(1, waveType = $$props.waveType);
    		if ('frequency' in $$props) $$invalidate(8, frequency = $$props.frequency);
    		if ('useInverseFrequency' in $$props) $$invalidate(0, useInverseFrequency = $$props.useInverseFrequency);
    		if ('maxFrequency' in $$props) $$invalidate(2, maxFrequency = $$props.maxFrequency);
    		if ('minFrequency' in $$props) $$invalidate(3, minFrequency = $$props.minFrequency);
    		if ('disabled' in $$props) $$invalidate(4, disabled = $$props.disabled);
    		if ('enableInverseFrequency' in $$props) $$invalidate(5, enableInverseFrequency = $$props.enableInverseFrequency);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Knob,
    		waveType,
    		frequency,
    		useInverseFrequency,
    		maxFrequency,
    		minFrequency,
    		disabled,
    		enableInverseFrequency,
    		waveTypeValue,
    		frequencyValue,
    		WAVE_TYPES
    	});

    	$$self.$inject_state = $$props => {
    		if ('waveType' in $$props) $$invalidate(1, waveType = $$props.waveType);
    		if ('frequency' in $$props) $$invalidate(8, frequency = $$props.frequency);
    		if ('useInverseFrequency' in $$props) $$invalidate(0, useInverseFrequency = $$props.useInverseFrequency);
    		if ('maxFrequency' in $$props) $$invalidate(2, maxFrequency = $$props.maxFrequency);
    		if ('minFrequency' in $$props) $$invalidate(3, minFrequency = $$props.minFrequency);
    		if ('disabled' in $$props) $$invalidate(4, disabled = $$props.disabled);
    		if ('enableInverseFrequency' in $$props) $$invalidate(5, enableInverseFrequency = $$props.enableInverseFrequency);
    		if ('waveTypeValue' in $$props) $$invalidate(6, waveTypeValue = $$props.waveTypeValue);
    		if ('frequencyValue' in $$props) $$invalidate(7, frequencyValue = $$props.frequencyValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*useInverseFrequency, frequencyValue*/ 129) {
    			// reactive stuff
    			{
    				$$invalidate(8, frequency = useInverseFrequency
    				? 1 / frequencyValue
    				: frequencyValue);
    			}
    		}

    		if ($$self.$$.dirty & /*waveTypeValue*/ 64) {
    			{
    				$$invalidate(1, waveType = WAVE_TYPES[waveTypeValue - 1]);
    			}
    		}
    	};

    	return [
    		useInverseFrequency,
    		waveType,
    		maxFrequency,
    		minFrequency,
    		disabled,
    		enableInverseFrequency,
    		waveTypeValue,
    		frequencyValue,
    		frequency,
    		$$scope,
    		slots,
    		knob0_value_binding,
    		knob1_value_binding,
    		knob1_useInverse_binding
    	];
    }

    class OscillatorControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			waveType: 1,
    			frequency: 8,
    			useInverseFrequency: 0,
    			maxFrequency: 2,
    			minFrequency: 3,
    			disabled: 4,
    			enableInverseFrequency: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OscillatorControls",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*waveType*/ ctx[1] === undefined && !('waveType' in props)) {
    			console.warn("<OscillatorControls> was created without expected prop 'waveType'");
    		}

    		if (/*frequency*/ ctx[8] === undefined && !('frequency' in props)) {
    			console.warn("<OscillatorControls> was created without expected prop 'frequency'");
    		}

    		if (/*maxFrequency*/ ctx[2] === undefined && !('maxFrequency' in props)) {
    			console.warn("<OscillatorControls> was created without expected prop 'maxFrequency'");
    		}

    		if (/*minFrequency*/ ctx[3] === undefined && !('minFrequency' in props)) {
    			console.warn("<OscillatorControls> was created without expected prop 'minFrequency'");
    		}
    	}

    	get waveType() {
    		throw new Error("<OscillatorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set waveType(value) {
    		throw new Error("<OscillatorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get frequency() {
    		throw new Error("<OscillatorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frequency(value) {
    		throw new Error("<OscillatorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get useInverseFrequency() {
    		throw new Error("<OscillatorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useInverseFrequency(value) {
    		throw new Error("<OscillatorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxFrequency() {
    		throw new Error("<OscillatorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxFrequency(value) {
    		throw new Error("<OscillatorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minFrequency() {
    		throw new Error("<OscillatorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minFrequency(value) {
    		throw new Error("<OscillatorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<OscillatorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<OscillatorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get enableInverseFrequency() {
    		throw new Error("<OscillatorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enableInverseFrequency(value) {
    		throw new Error("<OscillatorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/modules/soundwave/SoundGeneratorControls.svelte generated by Svelte v3.44.2 */
    const file$5 = "src/modules/soundwave/SoundGeneratorControls.svelte";

    // (2:4) 
    function create_knob3_slot$1(ctx) {
    	let knob;
    	let updating_value;
    	let current;

    	function knob_value_binding(value) {
    		/*knob_value_binding*/ ctx[3](value);
    	}

    	let knob_props = {
    		slot: "knob3",
    		title: "DETUNE",
    		unit: "cents",
    		max: 50,
    		min: -50
    	};

    	if (/*detune*/ ctx[2] !== void 0) {
    		knob_props.value = /*detune*/ ctx[2];
    	}

    	knob = new Knob({ props: knob_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob, 'value', knob_value_binding));

    	const block = {
    		c: function create() {
    			create_component(knob.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(knob, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const knob_changes = {};

    			if (!updating_value && dirty & /*detune*/ 4) {
    				updating_value = true;
    				knob_changes.value = /*detune*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			knob.$set(knob_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(knob.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(knob.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(knob, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_knob3_slot$1.name,
    		type: "slot",
    		source: "(2:4) ",
    		ctx
    	});

    	return block;
    }

    // (3:4) 
    function create_label_slot$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "SOUND";
    			attr_dev(span, "slot", "label");
    			add_location(span, file$5, 2, 4, 200);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_label_slot$1.name,
    		type: "slot",
    		source: "(3:4) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let oscillator;
    	let updating_frequency;
    	let updating_waveType;
    	let current;

    	function oscillator_frequency_binding(value) {
    		/*oscillator_frequency_binding*/ ctx[4](value);
    	}

    	function oscillator_waveType_binding(value) {
    		/*oscillator_waveType_binding*/ ctx[5](value);
    	}

    	let oscillator_props = {
    		maxFrequency: 5000,
    		minFrequency: 60,
    		$$slots: {
    			label: [create_label_slot$1],
    			knob3: [create_knob3_slot$1]
    		},
    		$$scope: { ctx }
    	};

    	if (/*frequency*/ ctx[1] !== void 0) {
    		oscillator_props.frequency = /*frequency*/ ctx[1];
    	}

    	if (/*waveType*/ ctx[0] !== void 0) {
    		oscillator_props.waveType = /*waveType*/ ctx[0];
    	}

    	oscillator = new OscillatorControls({ props: oscillator_props, $$inline: true });
    	binding_callbacks.push(() => bind(oscillator, 'frequency', oscillator_frequency_binding));
    	binding_callbacks.push(() => bind(oscillator, 'waveType', oscillator_waveType_binding));

    	const block = {
    		c: function create() {
    			create_component(oscillator.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(oscillator, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const oscillator_changes = {};

    			if (dirty & /*$$scope, detune*/ 68) {
    				oscillator_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_frequency && dirty & /*frequency*/ 2) {
    				updating_frequency = true;
    				oscillator_changes.frequency = /*frequency*/ ctx[1];
    				add_flush_callback(() => updating_frequency = false);
    			}

    			if (!updating_waveType && dirty & /*waveType*/ 1) {
    				updating_waveType = true;
    				oscillator_changes.waveType = /*waveType*/ ctx[0];
    				add_flush_callback(() => updating_waveType = false);
    			}

    			oscillator.$set(oscillator_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(oscillator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(oscillator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(oscillator, detaching);
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

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SoundGeneratorControls', slots, []);
    	let { waveType } = $$props;
    	let { frequency } = $$props;
    	let { detune } = $$props;
    	const writable_props = ['waveType', 'frequency', 'detune'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SoundGeneratorControls> was created with unknown prop '${key}'`);
    	});

    	function knob_value_binding(value) {
    		detune = value;
    		$$invalidate(2, detune);
    	}

    	function oscillator_frequency_binding(value) {
    		frequency = value;
    		$$invalidate(1, frequency);
    	}

    	function oscillator_waveType_binding(value) {
    		waveType = value;
    		$$invalidate(0, waveType);
    	}

    	$$self.$$set = $$props => {
    		if ('waveType' in $$props) $$invalidate(0, waveType = $$props.waveType);
    		if ('frequency' in $$props) $$invalidate(1, frequency = $$props.frequency);
    		if ('detune' in $$props) $$invalidate(2, detune = $$props.detune);
    	};

    	$$self.$capture_state = () => ({
    		Oscillator: OscillatorControls,
    		Knob,
    		waveType,
    		frequency,
    		detune
    	});

    	$$self.$inject_state = $$props => {
    		if ('waveType' in $$props) $$invalidate(0, waveType = $$props.waveType);
    		if ('frequency' in $$props) $$invalidate(1, frequency = $$props.frequency);
    		if ('detune' in $$props) $$invalidate(2, detune = $$props.detune);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		waveType,
    		frequency,
    		detune,
    		knob_value_binding,
    		oscillator_frequency_binding,
    		oscillator_waveType_binding
    	];
    }

    class SoundGeneratorControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$8, create_fragment$8, safe_not_equal, { waveType: 0, frequency: 1, detune: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SoundGeneratorControls",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*waveType*/ ctx[0] === undefined && !('waveType' in props)) {
    			console.warn("<SoundGeneratorControls> was created without expected prop 'waveType'");
    		}

    		if (/*frequency*/ ctx[1] === undefined && !('frequency' in props)) {
    			console.warn("<SoundGeneratorControls> was created without expected prop 'frequency'");
    		}

    		if (/*detune*/ ctx[2] === undefined && !('detune' in props)) {
    			console.warn("<SoundGeneratorControls> was created without expected prop 'detune'");
    		}
    	}

    	get waveType() {
    		throw new Error("<SoundGeneratorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set waveType(value) {
    		throw new Error("<SoundGeneratorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get frequency() {
    		throw new Error("<SoundGeneratorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frequency(value) {
    		throw new Error("<SoundGeneratorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get detune() {
    		throw new Error("<SoundGeneratorControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set detune(value) {
    		throw new Error("<SoundGeneratorControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Toggle.svelte generated by Svelte v3.44.2 */
    const file$4 = "src/components/Toggle.svelte";
    const get_default_slot_changes = dirty => ({ toggled: dirty & /*toggled*/ 1 });
    const get_default_slot_context = ctx => ({ toggled: /*toggled*/ ctx[0] });

    // (81:12) {#if on && off}
    function create_if_block$2(ctx) {
    	let span;
    	let t_value = (/*toggled*/ ctx[0] ? /*on*/ ctx[4] : /*off*/ ctx[5]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "svelte-1c9ojcg");
    			add_location(span, file$4, 80, 27, 1828);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*toggled, on, off*/ 49 && t_value !== (t_value = (/*toggled*/ ctx[0] ? /*on*/ ctx[4] : /*off*/ ctx[5]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(81:12) {#if on && off}",
    		ctx
    	});

    	return block;
    }

    // (80:24)              
    function fallback_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*on*/ ctx[4] && /*off*/ ctx[5] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*on*/ ctx[4] && /*off*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(80:24)              ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let label_1;
    	let t0;
    	let t1;
    	let div0;
    	let button;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[1]);
    			t1 = space();
    			div0 = element("div");
    			button = element("button");
    			t2 = space();
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr_dev(label_1, "for", /*id*/ ctx[9]);
    			attr_dev(label_1, "class", "svelte-1c9ojcg");
    			toggle_class(label_1, "hideLabel", /*hideLabel*/ ctx[2]);
    			add_location(label_1, file$4, 65, 4, 1292);
    			attr_dev(button, "id", /*id*/ ctx[9]);
    			attr_dev(button, "aria-checked", /*toggled*/ ctx[0]);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "role", "switch");
    			set_style(button, "color", /*switchColor*/ ctx[6]);

    			set_style(button, "background-color", /*toggled*/ ctx[0]
    			? /*toggledColor*/ ctx[7]
    			: /*untoggledColor*/ ctx[8]);

    			button.disabled = /*disabled*/ ctx[3];
    			attr_dev(button, "class", "svelte-1c9ojcg");
    			add_location(button, file$4, 67, 8, 1360);
    			attr_dev(div0, "class", "svelte-1c9ojcg");
    			add_location(div0, file$4, 66, 4, 1346);
    			attr_dev(div1, "class", "container svelte-1c9ojcg");
    			add_location(div1, file$4, 63, 0, 1203);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label_1);
    			append_dev(label_1, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(div0, t2);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(button, "click", /*click_handler_1*/ ctx[15], false, false, false),
    					listen_dev(button, "focus", /*focus_handler*/ ctx[13], false, false, false),
    					listen_dev(button, "blur", /*blur_handler*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*label*/ 2) set_data_dev(t0, /*label*/ ctx[1]);

    			if (dirty & /*hideLabel*/ 4) {
    				toggle_class(label_1, "hideLabel", /*hideLabel*/ ctx[2]);
    			}

    			if (!current || dirty & /*toggled*/ 1) {
    				attr_dev(button, "aria-checked", /*toggled*/ ctx[0]);
    			}

    			if (!current || dirty & /*switchColor*/ 64) {
    				set_style(button, "color", /*switchColor*/ ctx[6]);
    			}

    			if (!current || dirty & /*toggled, toggledColor, untoggledColor*/ 385) {
    				set_style(button, "background-color", /*toggled*/ ctx[0]
    				? /*toggledColor*/ ctx[7]
    				: /*untoggledColor*/ ctx[8]);
    			}

    			if (!current || dirty & /*disabled*/ 8) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[3]);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, toggled*/ 1025)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[10],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[10])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[10], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty & /*toggled, on, off*/ 49)) {
    					default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Toggle', slots, ['default']);
    	let { toggled = true } = $$props;
    	let { label = "Label" } = $$props;
    	let { hideLabel = false } = $$props;
    	let { disabled = false } = $$props;
    	let { on = undefined } = $$props;
    	let { off = undefined } = $$props;
    	let { switchColor = "#fff" } = $$props;
    	let { toggledColor = "#0f62fe" } = $$props;
    	let { untoggledColor = "#8d8d8d" } = $$props;
    	let id = "toggle" + Math.random().toString(36);
    	const dispatch = createEventDispatcher();

    	const writable_props = [
    		'toggled',
    		'label',
    		'hideLabel',
    		'disabled',
    		'on',
    		'off',
    		'switchColor',
    		'toggledColor',
    		'untoggledColor'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Toggle> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function focus_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function blur_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	const click_handler_1 = () => $$invalidate(0, toggled = !toggled);

    	$$self.$$set = $$props => {
    		if ('toggled' in $$props) $$invalidate(0, toggled = $$props.toggled);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('hideLabel' in $$props) $$invalidate(2, hideLabel = $$props.hideLabel);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ('on' in $$props) $$invalidate(4, on = $$props.on);
    		if ('off' in $$props) $$invalidate(5, off = $$props.off);
    		if ('switchColor' in $$props) $$invalidate(6, switchColor = $$props.switchColor);
    		if ('toggledColor' in $$props) $$invalidate(7, toggledColor = $$props.toggledColor);
    		if ('untoggledColor' in $$props) $$invalidate(8, untoggledColor = $$props.untoggledColor);
    		if ('$$scope' in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		toggled,
    		label,
    		hideLabel,
    		disabled,
    		on,
    		off,
    		switchColor,
    		toggledColor,
    		untoggledColor,
    		id,
    		createEventDispatcher,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ('toggled' in $$props) $$invalidate(0, toggled = $$props.toggled);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('hideLabel' in $$props) $$invalidate(2, hideLabel = $$props.hideLabel);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ('on' in $$props) $$invalidate(4, on = $$props.on);
    		if ('off' in $$props) $$invalidate(5, off = $$props.off);
    		if ('switchColor' in $$props) $$invalidate(6, switchColor = $$props.switchColor);
    		if ('toggledColor' in $$props) $$invalidate(7, toggledColor = $$props.toggledColor);
    		if ('untoggledColor' in $$props) $$invalidate(8, untoggledColor = $$props.untoggledColor);
    		if ('id' in $$props) $$invalidate(9, id = $$props.id);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*toggled*/ 1) {
    			dispatch("toggle", toggled);
    		}
    	};

    	return [
    		toggled,
    		label,
    		hideLabel,
    		disabled,
    		on,
    		off,
    		switchColor,
    		toggledColor,
    		untoggledColor,
    		id,
    		$$scope,
    		slots,
    		click_handler,
    		focus_handler,
    		blur_handler,
    		click_handler_1
    	];
    }

    class Toggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			toggled: 0,
    			label: 1,
    			hideLabel: 2,
    			disabled: 3,
    			on: 4,
    			off: 5,
    			switchColor: 6,
    			toggledColor: 7,
    			untoggledColor: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toggle",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get toggled() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggled(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hideLabel() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hideLabel(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get on() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set on(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get off() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set off(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get switchColor() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set switchColor(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toggledColor() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toggledColor(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get untoggledColor() {
    		throw new Error("<Toggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set untoggledColor(value) {
    		throw new Error("<Toggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/modules/soundwave/LFOControls.svelte generated by Svelte v3.44.2 */

    // (2:4) 
    function create_knob3_slot(ctx) {
    	let knob;
    	let updating_value;
    	let current;

    	function knob_value_binding(value) {
    		/*knob_value_binding*/ ctx[5](value);
    	}

    	let knob_props = {
    		slot: "knob3",
    		title: "DEPTH",
    		unit: "",
    		max: 100,
    		min: 1
    	};

    	if (/*depth*/ ctx[3] !== void 0) {
    		knob_props.value = /*depth*/ ctx[3];
    	}

    	knob = new Knob({ props: knob_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob, 'value', knob_value_binding));

    	const block = {
    		c: function create() {
    			create_component(knob.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(knob, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const knob_changes = {};

    			if (!updating_value && dirty & /*depth*/ 8) {
    				updating_value = true;
    				knob_changes.value = /*depth*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			knob.$set(knob_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(knob.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(knob.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(knob, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_knob3_slot.name,
    		type: "slot",
    		source: "(2:4) ",
    		ctx
    	});

    	return block;
    }

    // (3:4) 
    function create_label_slot(ctx) {
    	let toggle;
    	let updating_toggled;
    	let current;

    	function toggle_toggled_binding(value) {
    		/*toggle_toggled_binding*/ ctx[4](value);
    	}

    	let toggle_props = {
    		slot: "label",
    		hideLabel: true,
    		label: "toggle LFO",
    		switchColor: "#ff3e00",
    		toggledColor: "#fff",
    		untoggledColor: "#fff",
    		on: "LFO on",
    		off: "LFO off"
    	};

    	if (/*lfoActive*/ ctx[0] !== void 0) {
    		toggle_props.toggled = /*lfoActive*/ ctx[0];
    	}

    	toggle = new Toggle({ props: toggle_props, $$inline: true });
    	binding_callbacks.push(() => bind(toggle, 'toggled', toggle_toggled_binding));

    	const block = {
    		c: function create() {
    			create_component(toggle.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(toggle, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const toggle_changes = {};

    			if (!updating_toggled && dirty & /*lfoActive*/ 1) {
    				updating_toggled = true;
    				toggle_changes.toggled = /*lfoActive*/ ctx[0];
    				add_flush_callback(() => updating_toggled = false);
    			}

    			toggle.$set(toggle_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toggle.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toggle.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(toggle, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_label_slot.name,
    		type: "slot",
    		source: "(3:4) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let oscillator;
    	let updating_frequency;
    	let updating_waveType;
    	let current;

    	function oscillator_frequency_binding(value) {
    		/*oscillator_frequency_binding*/ ctx[6](value);
    	}

    	function oscillator_waveType_binding(value) {
    		/*oscillator_waveType_binding*/ ctx[7](value);
    	}

    	let oscillator_props = {
    		disabled: !/*lfoActive*/ ctx[0],
    		maxFrequency: 200,
    		minFrequency: 1,
    		enableInverseFrequency: true,
    		$$slots: {
    			label: [create_label_slot],
    			knob3: [create_knob3_slot]
    		},
    		$$scope: { ctx }
    	};

    	if (/*frequency*/ ctx[2] !== void 0) {
    		oscillator_props.frequency = /*frequency*/ ctx[2];
    	}

    	if (/*waveType*/ ctx[1] !== void 0) {
    		oscillator_props.waveType = /*waveType*/ ctx[1];
    	}

    	oscillator = new OscillatorControls({ props: oscillator_props, $$inline: true });
    	binding_callbacks.push(() => bind(oscillator, 'frequency', oscillator_frequency_binding));
    	binding_callbacks.push(() => bind(oscillator, 'waveType', oscillator_waveType_binding));

    	const block = {
    		c: function create() {
    			create_component(oscillator.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(oscillator, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const oscillator_changes = {};
    			if (dirty & /*lfoActive*/ 1) oscillator_changes.disabled = !/*lfoActive*/ ctx[0];

    			if (dirty & /*$$scope, lfoActive, depth*/ 265) {
    				oscillator_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_frequency && dirty & /*frequency*/ 4) {
    				updating_frequency = true;
    				oscillator_changes.frequency = /*frequency*/ ctx[2];
    				add_flush_callback(() => updating_frequency = false);
    			}

    			if (!updating_waveType && dirty & /*waveType*/ 2) {
    				updating_waveType = true;
    				oscillator_changes.waveType = /*waveType*/ ctx[1];
    				add_flush_callback(() => updating_waveType = false);
    			}

    			oscillator.$set(oscillator_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(oscillator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(oscillator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(oscillator, detaching);
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

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('LFOControls', slots, []);
    	let { lfoActive } = $$props;
    	let { waveType } = $$props;
    	let { frequency } = $$props;
    	let { depth } = $$props;
    	const writable_props = ['lfoActive', 'waveType', 'frequency', 'depth'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LFOControls> was created with unknown prop '${key}'`);
    	});

    	function toggle_toggled_binding(value) {
    		lfoActive = value;
    		$$invalidate(0, lfoActive);
    	}

    	function knob_value_binding(value) {
    		depth = value;
    		$$invalidate(3, depth);
    	}

    	function oscillator_frequency_binding(value) {
    		frequency = value;
    		$$invalidate(2, frequency);
    	}

    	function oscillator_waveType_binding(value) {
    		waveType = value;
    		$$invalidate(1, waveType);
    	}

    	$$self.$$set = $$props => {
    		if ('lfoActive' in $$props) $$invalidate(0, lfoActive = $$props.lfoActive);
    		if ('waveType' in $$props) $$invalidate(1, waveType = $$props.waveType);
    		if ('frequency' in $$props) $$invalidate(2, frequency = $$props.frequency);
    		if ('depth' in $$props) $$invalidate(3, depth = $$props.depth);
    	};

    	$$self.$capture_state = () => ({
    		Oscillator: OscillatorControls,
    		Knob,
    		Toggle,
    		lfoActive,
    		waveType,
    		frequency,
    		depth
    	});

    	$$self.$inject_state = $$props => {
    		if ('lfoActive' in $$props) $$invalidate(0, lfoActive = $$props.lfoActive);
    		if ('waveType' in $$props) $$invalidate(1, waveType = $$props.waveType);
    		if ('frequency' in $$props) $$invalidate(2, frequency = $$props.frequency);
    		if ('depth' in $$props) $$invalidate(3, depth = $$props.depth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		lfoActive,
    		waveType,
    		frequency,
    		depth,
    		toggle_toggled_binding,
    		knob_value_binding,
    		oscillator_frequency_binding,
    		oscillator_waveType_binding
    	];
    }

    class LFOControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			lfoActive: 0,
    			waveType: 1,
    			frequency: 2,
    			depth: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LFOControls",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*lfoActive*/ ctx[0] === undefined && !('lfoActive' in props)) {
    			console.warn("<LFOControls> was created without expected prop 'lfoActive'");
    		}

    		if (/*waveType*/ ctx[1] === undefined && !('waveType' in props)) {
    			console.warn("<LFOControls> was created without expected prop 'waveType'");
    		}

    		if (/*frequency*/ ctx[2] === undefined && !('frequency' in props)) {
    			console.warn("<LFOControls> was created without expected prop 'frequency'");
    		}

    		if (/*depth*/ ctx[3] === undefined && !('depth' in props)) {
    			console.warn("<LFOControls> was created without expected prop 'depth'");
    		}
    	}

    	get lfoActive() {
    		throw new Error("<LFOControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lfoActive(value) {
    		throw new Error("<LFOControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get waveType() {
    		throw new Error("<LFOControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set waveType(value) {
    		throw new Error("<LFOControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get frequency() {
    		throw new Error("<LFOControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set frequency(value) {
    		throw new Error("<LFOControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get depth() {
    		throw new Error("<LFOControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set depth(value) {
    		throw new Error("<LFOControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/modules/soundwave/SoundwaveControls.svelte generated by Svelte v3.44.2 */

    // (1:0) <Panel heading="SOUNDWAVE" isOpen={true} removeHandler={() => removeHandler(sound)}>
    function create_default_slot$1(ctx) {
    	let soundgeneratorcontrols;
    	let updating_frequency;
    	let updating_waveType;
    	let updating_detune;
    	let t;
    	let lfocontrols;
    	let updating_lfoActive;
    	let updating_frequency_1;
    	let updating_waveType_1;
    	let updating_depth;
    	let current;

    	function soundgeneratorcontrols_frequency_binding(value) {
    		/*soundgeneratorcontrols_frequency_binding*/ ctx[9](value);
    	}

    	function soundgeneratorcontrols_waveType_binding(value) {
    		/*soundgeneratorcontrols_waveType_binding*/ ctx[10](value);
    	}

    	function soundgeneratorcontrols_detune_binding(value) {
    		/*soundgeneratorcontrols_detune_binding*/ ctx[11](value);
    	}

    	let soundgeneratorcontrols_props = {};

    	if (/*soundFrequency*/ ctx[3] !== void 0) {
    		soundgeneratorcontrols_props.frequency = /*soundFrequency*/ ctx[3];
    	}

    	if (/*soundWaveType*/ ctx[2] !== void 0) {
    		soundgeneratorcontrols_props.waveType = /*soundWaveType*/ ctx[2];
    	}

    	if (/*soundDetune*/ ctx[4] !== void 0) {
    		soundgeneratorcontrols_props.detune = /*soundDetune*/ ctx[4];
    	}

    	soundgeneratorcontrols = new SoundGeneratorControls({
    			props: soundgeneratorcontrols_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(soundgeneratorcontrols, 'frequency', soundgeneratorcontrols_frequency_binding));
    	binding_callbacks.push(() => bind(soundgeneratorcontrols, 'waveType', soundgeneratorcontrols_waveType_binding));
    	binding_callbacks.push(() => bind(soundgeneratorcontrols, 'detune', soundgeneratorcontrols_detune_binding));

    	function lfocontrols_lfoActive_binding(value) {
    		/*lfocontrols_lfoActive_binding*/ ctx[12](value);
    	}

    	function lfocontrols_frequency_binding(value) {
    		/*lfocontrols_frequency_binding*/ ctx[13](value);
    	}

    	function lfocontrols_waveType_binding(value) {
    		/*lfocontrols_waveType_binding*/ ctx[14](value);
    	}

    	function lfocontrols_depth_binding(value) {
    		/*lfocontrols_depth_binding*/ ctx[15](value);
    	}

    	let lfocontrols_props = {};

    	if (/*lfoActive*/ ctx[8] !== void 0) {
    		lfocontrols_props.lfoActive = /*lfoActive*/ ctx[8];
    	}

    	if (/*lfoFrequency*/ ctx[6] !== void 0) {
    		lfocontrols_props.frequency = /*lfoFrequency*/ ctx[6];
    	}

    	if (/*lfoWaveType*/ ctx[5] !== void 0) {
    		lfocontrols_props.waveType = /*lfoWaveType*/ ctx[5];
    	}

    	if (/*lfoDepth*/ ctx[7] !== void 0) {
    		lfocontrols_props.depth = /*lfoDepth*/ ctx[7];
    	}

    	lfocontrols = new LFOControls({ props: lfocontrols_props, $$inline: true });
    	binding_callbacks.push(() => bind(lfocontrols, 'lfoActive', lfocontrols_lfoActive_binding));
    	binding_callbacks.push(() => bind(lfocontrols, 'frequency', lfocontrols_frequency_binding));
    	binding_callbacks.push(() => bind(lfocontrols, 'waveType', lfocontrols_waveType_binding));
    	binding_callbacks.push(() => bind(lfocontrols, 'depth', lfocontrols_depth_binding));

    	const block = {
    		c: function create() {
    			create_component(soundgeneratorcontrols.$$.fragment);
    			t = space();
    			create_component(lfocontrols.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(soundgeneratorcontrols, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(lfocontrols, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const soundgeneratorcontrols_changes = {};

    			if (!updating_frequency && dirty & /*soundFrequency*/ 8) {
    				updating_frequency = true;
    				soundgeneratorcontrols_changes.frequency = /*soundFrequency*/ ctx[3];
    				add_flush_callback(() => updating_frequency = false);
    			}

    			if (!updating_waveType && dirty & /*soundWaveType*/ 4) {
    				updating_waveType = true;
    				soundgeneratorcontrols_changes.waveType = /*soundWaveType*/ ctx[2];
    				add_flush_callback(() => updating_waveType = false);
    			}

    			if (!updating_detune && dirty & /*soundDetune*/ 16) {
    				updating_detune = true;
    				soundgeneratorcontrols_changes.detune = /*soundDetune*/ ctx[4];
    				add_flush_callback(() => updating_detune = false);
    			}

    			soundgeneratorcontrols.$set(soundgeneratorcontrols_changes);
    			const lfocontrols_changes = {};

    			if (!updating_lfoActive && dirty & /*lfoActive*/ 256) {
    				updating_lfoActive = true;
    				lfocontrols_changes.lfoActive = /*lfoActive*/ ctx[8];
    				add_flush_callback(() => updating_lfoActive = false);
    			}

    			if (!updating_frequency_1 && dirty & /*lfoFrequency*/ 64) {
    				updating_frequency_1 = true;
    				lfocontrols_changes.frequency = /*lfoFrequency*/ ctx[6];
    				add_flush_callback(() => updating_frequency_1 = false);
    			}

    			if (!updating_waveType_1 && dirty & /*lfoWaveType*/ 32) {
    				updating_waveType_1 = true;
    				lfocontrols_changes.waveType = /*lfoWaveType*/ ctx[5];
    				add_flush_callback(() => updating_waveType_1 = false);
    			}

    			if (!updating_depth && dirty & /*lfoDepth*/ 128) {
    				updating_depth = true;
    				lfocontrols_changes.depth = /*lfoDepth*/ ctx[7];
    				add_flush_callback(() => updating_depth = false);
    			}

    			lfocontrols.$set(lfocontrols_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(soundgeneratorcontrols.$$.fragment, local);
    			transition_in(lfocontrols.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(soundgeneratorcontrols.$$.fragment, local);
    			transition_out(lfocontrols.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(soundgeneratorcontrols, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(lfocontrols, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(1:0) <Panel heading=\\\"SOUNDWAVE\\\" isOpen={true} removeHandler={() => removeHandler(sound)}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				heading: "SOUNDWAVE",
    				isOpen: true,
    				removeHandler: /*func*/ ctx[16],
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel_changes = {};
    			if (dirty & /*removeHandler, sound*/ 3) panel_changes.removeHandler = /*func*/ ctx[16];

    			if (dirty & /*$$scope, lfoActive, lfoFrequency, lfoWaveType, lfoDepth, soundFrequency, soundWaveType, soundDetune*/ 262652) {
    				panel_changes.$$scope = { dirty, ctx };
    			}

    			panel.$set(panel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel, detaching);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SoundwaveControls', slots, []);
    	let { sound } = $$props;
    	let { removeHandler } = $$props;

    	// sound
    	let soundWaveType = null;

    	let soundFrequency = 80;
    	let soundDetune = 0;

    	// lfo
    	let lfoWaveType = null;

    	let lfoFrequency = 10;
    	let lfoDepth = 50;
    	let lfoActive = false;

    	//
    	function initSoundWave() {
    		const { isPlaying } = sound;
    		sound.init(soundWaveType, soundFrequency);

    		if (lfoActive) {
    			sound.initLfo(lfoWaveType, lfoFrequency, lfoDepth);
    		}

    		if (isPlaying) {
    			sound.play();
    		}
    	}

    	const writable_props = ['sound', 'removeHandler'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SoundwaveControls> was created with unknown prop '${key}'`);
    	});

    	function soundgeneratorcontrols_frequency_binding(value) {
    		soundFrequency = value;
    		$$invalidate(3, soundFrequency);
    	}

    	function soundgeneratorcontrols_waveType_binding(value) {
    		soundWaveType = value;
    		$$invalidate(2, soundWaveType);
    	}

    	function soundgeneratorcontrols_detune_binding(value) {
    		soundDetune = value;
    		$$invalidate(4, soundDetune);
    	}

    	function lfocontrols_lfoActive_binding(value) {
    		lfoActive = value;
    		$$invalidate(8, lfoActive);
    	}

    	function lfocontrols_frequency_binding(value) {
    		lfoFrequency = value;
    		$$invalidate(6, lfoFrequency);
    	}

    	function lfocontrols_waveType_binding(value) {
    		lfoWaveType = value;
    		$$invalidate(5, lfoWaveType);
    	}

    	function lfocontrols_depth_binding(value) {
    		lfoDepth = value;
    		$$invalidate(7, lfoDepth);
    	}

    	const func = () => removeHandler(sound);

    	$$self.$$set = $$props => {
    		if ('sound' in $$props) $$invalidate(0, sound = $$props.sound);
    		if ('removeHandler' in $$props) $$invalidate(1, removeHandler = $$props.removeHandler);
    	};

    	$$self.$capture_state = () => ({
    		Panel,
    		SoundGeneratorControls,
    		LFOControls,
    		sound,
    		removeHandler,
    		soundWaveType,
    		soundFrequency,
    		soundDetune,
    		lfoWaveType,
    		lfoFrequency,
    		lfoDepth,
    		lfoActive,
    		initSoundWave
    	});

    	$$self.$inject_state = $$props => {
    		if ('sound' in $$props) $$invalidate(0, sound = $$props.sound);
    		if ('removeHandler' in $$props) $$invalidate(1, removeHandler = $$props.removeHandler);
    		if ('soundWaveType' in $$props) $$invalidate(2, soundWaveType = $$props.soundWaveType);
    		if ('soundFrequency' in $$props) $$invalidate(3, soundFrequency = $$props.soundFrequency);
    		if ('soundDetune' in $$props) $$invalidate(4, soundDetune = $$props.soundDetune);
    		if ('lfoWaveType' in $$props) $$invalidate(5, lfoWaveType = $$props.lfoWaveType);
    		if ('lfoFrequency' in $$props) $$invalidate(6, lfoFrequency = $$props.lfoFrequency);
    		if ('lfoDepth' in $$props) $$invalidate(7, lfoDepth = $$props.lfoDepth);
    		if ('lfoActive' in $$props) $$invalidate(8, lfoActive = $$props.lfoActive);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sound, soundFrequency*/ 9) {
    			// reactive stuff
    			{
    				sound.setFrequency(soundFrequency);
    			}
    		}

    		if ($$self.$$.dirty & /*soundWaveType*/ 4) {
    			{
    				soundWaveType && initSoundWave();
    			}
    		}

    		if ($$self.$$.dirty & /*soundDetune, sound*/ 17) {
    			{
    				if (soundDetune !== undefined) {
    					sound.setDetune(soundDetune);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*lfoActive, sound, lfoWaveType, lfoFrequency, lfoDepth*/ 481) {
    			{
    				if (lfoActive) {
    					sound.initLfo(lfoWaveType, lfoFrequency, lfoDepth);
    				} else {
    					sound.removeLfo();
    				}
    			}
    		}
    	};

    	return [
    		sound,
    		removeHandler,
    		soundWaveType,
    		soundFrequency,
    		soundDetune,
    		lfoWaveType,
    		lfoFrequency,
    		lfoDepth,
    		lfoActive,
    		soundgeneratorcontrols_frequency_binding,
    		soundgeneratorcontrols_waveType_binding,
    		soundgeneratorcontrols_detune_binding,
    		lfocontrols_lfoActive_binding,
    		lfocontrols_frequency_binding,
    		lfocontrols_waveType_binding,
    		lfocontrols_depth_binding,
    		func
    	];
    }

    class SoundwaveControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$5, create_fragment$5, safe_not_equal, { sound: 0, removeHandler: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SoundwaveControls",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sound*/ ctx[0] === undefined && !('sound' in props)) {
    			console.warn("<SoundwaveControls> was created without expected prop 'sound'");
    		}

    		if (/*removeHandler*/ ctx[1] === undefined && !('removeHandler' in props)) {
    			console.warn("<SoundwaveControls> was created without expected prop 'removeHandler'");
    		}
    	}

    	get sound() {
    		throw new Error("<SoundwaveControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sound(value) {
    		throw new Error("<SoundwaveControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeHandler() {
    		throw new Error("<SoundwaveControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeHandler(value) {
    		throw new Error("<SoundwaveControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var Pizzicato_min = createCommonjsModule(function (module) {
    !function(e){function t(e,t){this.options={},e=e||this.options;var i={frequency:350,peak:1};this.inputNode=this.filterNode=s.context.createBiquadFilter(),this.filterNode.type=t,this.outputNode=o.context.createGain(),this.filterNode.connect(this.outputNode);for(var n in i)this[n]=e[n],this[n]=void 0===this[n]||null===this[n]?i[n]:this[n];}function i(){var e,t,i=s.context.sampleRate*this.time,n=o.context.createBuffer(2,i,s.context.sampleRate),a=n.getChannelData(0),r=n.getChannelData(1);for(t=0;i>t;t++)e=this.reverse?i-t:t,a[t]=(2*Math.random()-1)*Math.pow(1-e/i,this.decay),r[t]=(2*Math.random()-1)*Math.pow(1-e/i,this.decay);this.reverbNode.buffer&&(this.inputNode.disconnect(this.reverbNode),this.reverbNode.disconnect(this.wetGainNode),this.reverbNode=o.context.createConvolver(),this.inputNode.connect(this.reverbNode),this.reverbNode.connect(this.wetGainNode)),this.reverbNode.buffer=n;}function n(e){for(var t=s.context.sampleRate,i=new Float32Array(t),n=Math.PI/180,o=0;t>o;o++){var a=2*o/t-1;i[o]=(3+e)*a*20*n/(Math.PI+e*Math.abs(a));}return i}var o={},s=o,a=module.exports;a?module.exports=o:e.Pizzicato=e.Pz=o;var c=e.AudioContext||e.webkitAudioContext;if(!c)return void console.error("No AudioContext found in this environment. Please ensure your window or global object contains a working AudioContext constructor function.");o.context=new c;var h=o.context.createGain();h.connect(o.context.destination),o.Util={isString:function(e){return "[object String]"===toString.call(e)},isObject:function(e){return "[object Object]"===toString.call(e)},isFunction:function(e){return "[object Function]"===toString.call(e)},isNumber:function(e){return "[object Number]"===toString.call(e)&&e===+e},isArray:function(e){return "[object Array]"===toString.call(e)},isInRange:function(e,t,i){return s.Util.isNumber(e)&&s.Util.isNumber(t)&&s.Util.isNumber(i)?e>=t&&i>=e:!1},isBool:function(e){return "boolean"==typeof e},isOscillator:function(e){return e&&"[object OscillatorNode]"===e.toString()},isAudioBufferSourceNode:function(e){return e&&"[object AudioBufferSourceNode]"===e.toString()},isSound:function(e){return e instanceof s.Sound},isEffect:function(e){for(var t in o.Effects)if(e instanceof o.Effects[t])return !0;return !1},normalize:function(e,t,i){return s.Util.isNumber(e)&&s.Util.isNumber(t)&&s.Util.isNumber(i)?(i-t)*e/1+t:void 0},getDryLevel:function(e){return !s.Util.isNumber(e)||e>1||0>e?0:.5>=e?1:1-2*(e-.5)},getWetLevel:function(e){return !s.Util.isNumber(e)||e>1||0>e?0:e>=.5?1:1-2*(.5-e)}};var u=o.context.createGain(),d=Object.getPrototypeOf(Object.getPrototypeOf(u)),l=d.connect;d.connect=function(e){var t=s.Util.isEffect(e)?e.inputNode:e;return l.call(this,t),e},Object.defineProperty(o,"volume",{enumerable:!0,get:function(){return h.gain.value},set:function(e){s.Util.isInRange(e,0,1)&&h&&(h.gain.value=e);}}),Object.defineProperty(o,"masterGainNode",{enumerable:!1,get:function(){return h},set:function(e){console.error("Can't set the master gain node");}}),o.Events={on:function(e,t,i){if(e&&t){this._events=this._events||{};var n=this._events[e]||(this._events[e]=[]);n.push({callback:t,context:i||this,handler:this});}},trigger:function(e){if(e){var t,i,n,o;if(this._events=this._events||{},t=this._events[e]||(this._events[e]=[])){for(i=Math.max(0,arguments.length-1),n=[],o=0;i>o;o++)n[o]=arguments[o+1];for(o=0;o<t.length;o++)t[o].callback.apply(t[o].context,n);}}},off:function(e){e?this._events[e]=void 0:this._events={};}},o.Sound=function(e,t){function i(e){var t=["wave","file","input","script","sound"];if(e&&!d.isFunction(e)&&!d.isString(e)&&!d.isObject(e))return "Description type not supported. Initialize a sound using an object, a function or a string.";if(d.isObject(e)){if(!d.isString(e.source)||-1===t.indexOf(e.source))return "Specified source not supported. Sources can be wave, file, input or script";if(!("file"!==e.source||e.options&&e.options.path))return "A path is needed for sounds with a file source";if(!("script"!==e.source||e.options&&e.options.audioFunction))return "An audio function is needed for sounds with a script source"}}function n(e,t){e=e||{},this.getRawSourceNode=function(){var t=this.sourceNode?this.sourceNode.frequency.value:e.frequency,i=o.context.createOscillator();return i.type=e.type||"sine",i.frequency.value=t||440,i},this.sourceNode=this.getRawSourceNode(),this.sourceNode.gainSuccessor=s.context.createGain(),this.sourceNode.connect(this.sourceNode.gainSuccessor),d.isFunction(t)&&t();}function a(e,t){e=d.isArray(e)?e:[e];var i=new XMLHttpRequest;i.open("GET",e[0],!0),i.responseType="arraybuffer",i.onload=function(i){o.context.decodeAudioData(i.target.response,function(e){u.getRawSourceNode=function(){var t=o.context.createBufferSource();return t.loop=this.loop,t.buffer=e,t},d.isFunction(t)&&t();}.bind(u),function(i){return console.error("Error decoding audio file "+e[0]),e.length>1?(e.shift(),void a(e,t)):(i=i||new Error("Error decoding audio file "+e[0]),void(d.isFunction(t)&&t(i)))}.bind(u));},i.onreadystatechange=function(t){4===i.readyState&&200!==i.status&&console.error("Error while fetching "+e[0]+". "+i.statusText);},i.send();}function r(e,t){if(navigator.getUserMedia=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia,!navigator.getUserMedia&&!navigator.mediaDevices.getUserMedia)return void console.error("Your browser does not support getUserMedia");var i=function(e){u.getRawSourceNode=function(){return o.context.createMediaStreamSource(e)},d.isFunction(t)&&t();}.bind(u),n=function(e){d.isFunction(t)&&t(e);};navigator.mediaDevices.getUserMedia?navigator.mediaDevices.getUserMedia({audio:!0}).then(i)["catch"](n):navigator.getUserMedia({audio:!0},i,n);}function c(e,t){var i=d.isFunction(e)?e:e.audioFunction,n=d.isObject(e)&&e.bufferSize?e.bufferSize:null;if(!n)try{o.context.createScriptProcessor();}catch(s){n=2048;}this.getRawSourceNode=function(){var e=o.context.createScriptProcessor(n,1,1);return e.onaudioprocess=i,e};}function h(e,t){this.getRawSourceNode=e.sound.getRawSourceNode,e.sound.sourceNode&&s.Util.isOscillator(e.sound.sourceNode)&&(this.sourceNode=this.getRawSourceNode(),this.frequency=e.sound.frequency);}var u=this,d=o.Util,l=i(e),f=d.isObject(e)&&d.isObject(e.options),p=.04,v=.04;if(l)throw console.error(l),new Error("Error initializing Pizzicato Sound: "+l);this.detached=f&&e.options.detached,this.masterVolume=o.context.createGain(),this.fadeNode=o.context.createGain(),this.fadeNode.gain.value=0,this.detached||this.masterVolume.connect(o.masterGainNode),this.lastTimePlayed=0,this.effects=[],this.effectConnectors=[],this.playing=this.paused=!1,this.loop=f&&e.options.loop,this.attack=f&&d.isNumber(e.options.attack)?e.options.attack:p,this.volume=f&&d.isNumber(e.options.volume)?e.options.volume:1,f&&d.isNumber(e.options.release)?this.release=e.options.release:f&&d.isNumber(e.options.sustain)?(console.warn("'sustain' is deprecated. Use 'release' instead."),this.release=e.options.sustain):this.release=v,e?d.isString(e)?a.bind(this)(e,t):d.isFunction(e)?c.bind(this)(e,t):"file"===e.source?a.bind(this)(e.options.path,t):"wave"===e.source?n.bind(this)(e.options,t):"input"===e.source?r.bind(this)(e,t):"script"===e.source?c.bind(this)(e.options,t):"sound"===e.source&&h.bind(this)(e.options,t):n.bind(this)({},t);},o.Sound.prototype=Object.create(o.Events,{play:{enumerable:!0,value:function(e,t){this.playing||(s.Util.isNumber(t)||(t=this.offsetTime||0),s.Util.isNumber(e)||(e=0),this.playing=!0,this.paused=!1,this.sourceNode=this.getSourceNode(),this.applyAttack(),s.Util.isFunction(this.sourceNode.start)&&(this.lastTimePlayed=o.context.currentTime-t,this.sourceNode.start(s.context.currentTime+e,t)),this.trigger("play"));}},stop:{enumerable:!0,value:function(){(this.paused||this.playing)&&(this.paused=this.playing=!1,this.stopWithRelease(),this.offsetTime=0,this.trigger("stop"));}},pause:{enumerable:!0,value:function(){if(!this.paused&&this.playing){this.paused=!0,this.playing=!1,this.stopWithRelease();var e=s.context.currentTime-this.lastTimePlayed;this.sourceNode.buffer?this.offsetTime=e%(this.sourceNode.buffer.length/s.context.sampleRate):this.offsetTime=e,this.trigger("pause");}}},clone:{enumerable:!0,value:function(){for(var e=new o.Sound({source:"sound",options:{loop:this.loop,attack:this.attack,release:this.release,volume:this.volume,sound:this}}),t=0;t<this.effects.length;t++)e.addEffect(this.effects[t]);return e}},onEnded:{enumerable:!0,value:function(e){return function(){this.sourceNode&&this.sourceNode!==e||(this.playing&&this.stop(),this.paused||this.trigger("end"));}}},addEffect:{enumerable:!0,value:function(e){if(!s.Util.isEffect(e))return console.error("The object provided is not a Pizzicato effect."),this;this.effects.push(e);var t=this.effectConnectors.length>0?this.effectConnectors[this.effectConnectors.length-1]:this.fadeNode;t.disconnect(),t.connect(e);var i=s.context.createGain();return this.effectConnectors.push(i),e.connect(i),i.connect(this.masterVolume),this}},removeEffect:{enumerable:!0,value:function(e){var t=this.effects.indexOf(e);if(-1===t)return console.warn("Cannot remove effect that is not applied to this sound."),this;var i=this.playing;i&&this.pause();var n=0===t?this.fadeNode:this.effectConnectors[t-1];n.disconnect();var o=this.effectConnectors[t];o.disconnect(),e.disconnect(o),this.effectConnectors.splice(t,1),this.effects.splice(t,1);var s;return s=t>this.effects.length-1||0===this.effects.length?this.masterVolume:this.effects[t],n.connect(s),i&&this.play(),this}},connect:{enumerable:!0,value:function(e){return this.masterVolume.connect(e),this}},disconnect:{enumerable:!0,value:function(e){return this.masterVolume.disconnect(e),this}},connectEffects:{enumerable:!0,value:function(){for(var e=[],t=0;t<this.effects.length;t++){var i=t===this.effects.length-1,n=i?this.masterVolume:this.effects[t+1].inputNode;e[t]=s.context.createGain(),this.effects[t].outputNode.disconnect(this.effectConnectors[t]),this.effects[t].outputNode.connect(n);}}},volume:{enumerable:!0,get:function(){return this.masterVolume?this.masterVolume.gain.value:void 0},set:function(e){s.Util.isInRange(e,0,1)&&this.masterVolume&&(this.masterVolume.gain.value=e);}},frequency:{enumerable:!0,get:function(){return this.sourceNode&&s.Util.isOscillator(this.sourceNode)?this.sourceNode.frequency.value:null},set:function(e){this.sourceNode&&s.Util.isOscillator(this.sourceNode)&&(this.sourceNode.frequency.value=e);}},sustain:{enumerable:!0,get:function(){return console.warn("'sustain' is deprecated. Use 'release' instead."),this.release},set:function(e){console.warn("'sustain' is deprecated. Use 'release' instead."),s.Util.isInRange(e,0,10)&&(this.release=e);}},getSourceNode:{enumerable:!0,value:function(){if(this.sourceNode){var e=this.sourceNode;e.gainSuccessor.gain.setValueAtTime(e.gainSuccessor.gain.value,s.context.currentTime),e.gainSuccessor.gain.linearRampToValueAtTime(1e-4,s.context.currentTime+.2),setTimeout(function(){e.disconnect(),e.gainSuccessor.disconnect();},200);}var t=this.getRawSourceNode();return t.gainSuccessor=s.context.createGain(),t.connect(t.gainSuccessor),t.gainSuccessor.connect(this.fadeNode),this.fadeNode.connect(this.getInputNode()),s.Util.isAudioBufferSourceNode(t)&&(t.onended=this.onEnded(t).bind(this)),t}},getInputNode:{enumerable:!0,value:function(){return this.effects.length>0?this.effects[0].inputNode:this.masterVolume}},applyAttack:{enumerable:!1,value:function(){this.fadeNode.gain.value;if(this.fadeNode.gain.cancelScheduledValues(s.context.currentTime),!this.attack)return void this.fadeNode.gain.setTargetAtTime(1,s.context.currentTime,.001);var e=navigator.userAgent.toLowerCase().indexOf("firefox")>-1,t=this.attack;e||(t=(1-this.fadeNode.gain.value)*this.attack),this.fadeNode.gain.setTargetAtTime(1,s.context.currentTime,2*t);}},stopWithRelease:{enumerable:!1,value:function(e){var t=this.sourceNode,i=function(){return s.Util.isFunction(t.stop)?t.stop(0):t.disconnect()};this.fadeNode.gain.value;if(this.fadeNode.gain.cancelScheduledValues(s.context.currentTime),!this.release)return this.fadeNode.gain.setTargetAtTime(0,s.context.currentTime,.001),void i();var n=navigator.userAgent.toLowerCase().indexOf("firefox")>-1,o=this.release;n||(o=this.fadeNode.gain.value*this.release),this.fadeNode.gain.setTargetAtTime(1e-5,s.context.currentTime,o/5),window.setTimeout(function(){i();},1e3*o);}}}),o.Group=function(e){e=e||[],this.mergeGainNode=s.context.createGain(),this.masterVolume=s.context.createGain(),this.sounds=[],this.effects=[],this.effectConnectors=[],this.mergeGainNode.connect(this.masterVolume),this.masterVolume.connect(s.masterGainNode);for(var t=0;t<e.length;t++)this.addSound(e[t]);},o.Group.prototype=Object.create(s.Events,{connect:{enumerable:!0,value:function(e){return this.masterVolume.connect(e),this}},disconnect:{enumerable:!0,value:function(e){return this.masterVolume.disconnect(e),this}},addSound:{enumerable:!0,value:function(e){return s.Util.isSound(e)?this.sounds.indexOf(e)>-1?void console.warn("The Pizzicato.Sound object was already added to this group"):e.detached?void console.warn("Groups do not support detached sounds. You can manually create an audio graph to group detached sounds together."):(e.disconnect(s.masterGainNode),e.connect(this.mergeGainNode),void this.sounds.push(e)):void console.error("You can only add Pizzicato.Sound objects")}},removeSound:{enumerable:!0,value:function(e){var t=this.sounds.indexOf(e);return -1===t?void console.warn("Cannot remove a sound that is not part of this group."):(e.disconnect(this.mergeGainNode),e.connect(s.masterGainNode),void this.sounds.splice(t,1))}},volume:{enumerable:!0,get:function(){return this.masterVolume?this.masterVolume.gain.value:void 0},set:function(e){s.Util.isInRange(e,0,1)&&(this.masterVolume.gain.value=e);}},play:{enumerable:!0,value:function(){for(var e=0;e<this.sounds.length;e++)this.sounds[e].play();this.trigger("play");}},stop:{enumerable:!0,value:function(){for(var e=0;e<this.sounds.length;e++)this.sounds[e].stop();this.trigger("stop");}},pause:{enumerable:!0,value:function(){for(var e=0;e<this.sounds.length;e++)this.sounds[e].pause();this.trigger("pause");}},addEffect:{enumerable:!0,value:function(e){if(!s.Util.isEffect(e))return console.error("The object provided is not a Pizzicato effect."),this;this.effects.push(e);var t=this.effectConnectors.length>0?this.effectConnectors[this.effectConnectors.length-1]:this.mergeGainNode;t.disconnect(),t.connect(e);var i=s.context.createGain();return this.effectConnectors.push(i),e.connect(i),i.connect(this.masterVolume),this}},removeEffect:{enumerable:!0,value:function(e){var t=this.effects.indexOf(e);if(-1===t)return console.warn("Cannot remove effect that is not applied to this group."),this;var i=0===t?this.mergeGainNode:this.effectConnectors[t-1];i.disconnect();var n=this.effectConnectors[t];n.disconnect(),e.disconnect(n),this.effectConnectors.splice(t,1),this.effects.splice(t,1);var o;return o=t>this.effects.length-1||0===this.effects.length?this.masterVolume:this.effects[t],i.connect(o),this}}}),o.Effects={};var f=Object.create(null,{connect:{enumerable:!0,value:function(e){return this.outputNode.connect(e),this}},disconnect:{enumerable:!0,value:function(e){return this.outputNode.disconnect(e),this}}});o.Effects.Delay=function(e){this.options={},e=e||this.options;var t={feedback:.5,time:.3,mix:.5};this.inputNode=o.context.createGain(),this.outputNode=o.context.createGain(),this.dryGainNode=o.context.createGain(),this.wetGainNode=o.context.createGain(),this.feedbackGainNode=o.context.createGain(),this.delayNode=o.context.createDelay(),this.inputNode.connect(this.dryGainNode),this.dryGainNode.connect(this.outputNode),this.delayNode.connect(this.feedbackGainNode),this.feedbackGainNode.connect(this.delayNode),this.inputNode.connect(this.delayNode),this.delayNode.connect(this.wetGainNode),this.wetGainNode.connect(this.outputNode);for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];},o.Effects.Delay.prototype=Object.create(f,{mix:{enumerable:!0,get:function(){return this.options.mix},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.mix=e,this.dryGainNode.gain.value=o.Util.getDryLevel(this.mix),this.wetGainNode.gain.value=o.Util.getWetLevel(this.mix));}},time:{enumerable:!0,get:function(){return this.options.time},set:function(e){s.Util.isInRange(e,0,180)&&(this.options.time=e,this.delayNode.delayTime.value=e);}},feedback:{enumerable:!0,get:function(){return this.options.feedback},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.feedback=parseFloat(e,10),this.feedbackGainNode.gain.value=this.feedback);}}}),o.Effects.Compressor=function(e){this.options={},e=e||this.options;var t={threshold:-24,knee:30,attack:.003,release:.25,ratio:12};this.inputNode=this.compressorNode=o.context.createDynamicsCompressor(),this.outputNode=o.context.createGain(),this.compressorNode.connect(this.outputNode);for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];},o.Effects.Compressor.prototype=Object.create(f,{threshold:{enumerable:!0,get:function(){return this.compressorNode.threshold.value},set:function(e){o.Util.isInRange(e,-100,0)&&(this.compressorNode.threshold.value=e);}},knee:{enumerable:!0,get:function(){return this.compressorNode.knee.value},set:function(e){o.Util.isInRange(e,0,40)&&(this.compressorNode.knee.value=e);}},attack:{enumerable:!0,get:function(){return this.compressorNode.attack.value},set:function(e){o.Util.isInRange(e,0,1)&&(this.compressorNode.attack.value=e);}},release:{enumerable:!0,get:function(){return this.compressorNode.release.value},set:function(e){o.Util.isInRange(e,0,1)&&(this.compressorNode.release.value=e);}},ratio:{enumerable:!0,get:function(){return this.compressorNode.ratio.value},set:function(e){o.Util.isInRange(e,1,20)&&(this.compressorNode.ratio.value=e);}},getCurrentGainReduction:function(){return this.compressorNode.reduction}}),o.Effects.LowPassFilter=function(e){t.call(this,e,"lowpass");},o.Effects.HighPassFilter=function(e){t.call(this,e,"highpass");};var p=Object.create(f,{frequency:{enumerable:!0,get:function(){return this.filterNode.frequency.value},set:function(e){o.Util.isInRange(e,10,22050)&&(this.filterNode.frequency.value=e);}},peak:{enumerable:!0,get:function(){return this.filterNode.Q.value},set:function(e){o.Util.isInRange(e,1e-4,1e3)&&(this.filterNode.Q.value=e);}}});o.Effects.LowPassFilter.prototype=p,o.Effects.HighPassFilter.prototype=p,o.Effects.Distortion=function(e){this.options={},e=e||this.options;var t={gain:.5};this.waveShaperNode=o.context.createWaveShaper(),this.inputNode=this.outputNode=this.waveShaperNode;for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];},o.Effects.Distortion.prototype=Object.create(f,{gain:{enumerable:!0,get:function(){return this.options.gain},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.gain=e,this.adjustGain());}},adjustGain:{writable:!1,configurable:!1,enumerable:!1,value:function(){for(var e,t=s.Util.isNumber(this.options.gain)?parseInt(100*this.options.gain,10):50,i=44100,n=new Float32Array(i),o=Math.PI/180,a=0;i>a;++a)e=2*a/i-1,n[a]=(3+t)*e*20*o/(Math.PI+t*Math.abs(e));this.waveShaperNode.curve=n;}}}),o.Effects.Flanger=function(e){this.options={},e=e||this.options;var t={time:.45,speed:.2,depth:.1,feedback:.1,mix:.5};this.inputNode=o.context.createGain(),this.outputNode=o.context.createGain(),this.inputFeedbackNode=o.context.createGain(),this.wetGainNode=o.context.createGain(),this.dryGainNode=o.context.createGain(),this.delayNode=o.context.createDelay(),this.oscillatorNode=o.context.createOscillator(),this.gainNode=o.context.createGain(),this.feedbackNode=o.context.createGain(),this.oscillatorNode.type="sine",this.inputNode.connect(this.inputFeedbackNode),this.inputNode.connect(this.dryGainNode),this.inputFeedbackNode.connect(this.delayNode),this.inputFeedbackNode.connect(this.wetGainNode),this.delayNode.connect(this.wetGainNode),this.delayNode.connect(this.feedbackNode),this.feedbackNode.connect(this.inputFeedbackNode),this.oscillatorNode.connect(this.gainNode),this.gainNode.connect(this.delayNode.delayTime),this.dryGainNode.connect(this.outputNode),this.wetGainNode.connect(this.outputNode),this.oscillatorNode.start(0);for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];},o.Effects.Flanger.prototype=Object.create(f,{time:{enumberable:!0,get:function(){return this.options.time},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.time=e,this.delayNode.delayTime.value=s.Util.normalize(e,.001,.02));}},speed:{enumberable:!0,get:function(){return this.options.speed},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.speed=e,this.oscillatorNode.frequency.value=s.Util.normalize(e,.5,5));}},depth:{enumberable:!0,get:function(){return this.options.depth},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.depth=e,this.gainNode.gain.value=s.Util.normalize(e,5e-4,.005));}},feedback:{enumberable:!0,get:function(){return this.options.feedback},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.feedback=e,this.feedbackNode.gain.value=s.Util.normalize(e,0,.8));}},mix:{enumberable:!0,get:function(){return this.options.mix},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.mix=e,this.dryGainNode.gain.value=o.Util.getDryLevel(this.mix),this.wetGainNode.gain.value=o.Util.getWetLevel(this.mix));}}}),o.Effects.StereoPanner=function(e){this.options={},e=e||this.options;var t={pan:0};this.inputNode=o.context.createGain(),this.outputNode=o.context.createGain(),o.context.createStereoPanner?(this.pannerNode=o.context.createStereoPanner(),this.inputNode.connect(this.pannerNode),this.pannerNode.connect(this.outputNode)):o.context.createPanner?(console.warn("Your browser does not support the StereoPannerNode. Will use PannerNode instead."),this.pannerNode=o.context.createPanner(),this.pannerNode.type="equalpower",this.inputNode.connect(this.pannerNode),this.pannerNode.connect(this.outputNode)):(console.warn("Your browser does not support the Panner effect."),this.inputNode.connect(this.outputNode));for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];},o.Effects.StereoPanner.prototype=Object.create(f,{pan:{enumerable:!0,get:function(){return this.options.pan},set:function(e){if(s.Util.isInRange(e,-1,1)&&(this.options.pan=e,this.pannerNode)){var t=this.pannerNode.toString().indexOf("StereoPannerNode")>-1;t?this.pannerNode.pan.value=e:this.pannerNode.setPosition(e,0,1-Math.abs(e));}}}}),o.Effects.Convolver=function(e,t){this.options={},e=e||this.options;var i=this,n=new XMLHttpRequest,a={mix:.5};this.callback=t,this.inputNode=o.context.createGain(),this.convolverNode=o.context.createConvolver(),this.outputNode=o.context.createGain(),this.wetGainNode=o.context.createGain(),this.dryGainNode=o.context.createGain(),this.inputNode.connect(this.convolverNode),this.convolverNode.connect(this.wetGainNode),this.inputNode.connect(this.dryGainNode),this.dryGainNode.connect(this.outputNode),this.wetGainNode.connect(this.outputNode);for(var r in a)this[r]=e[r],this[r]=void 0===this[r]||null===this[r]?a[r]:this[r];return e.impulse?(n.open("GET",e.impulse,!0),n.responseType="arraybuffer",n.onload=function(e){var t=e.target.response;o.context.decodeAudioData(t,function(e){i.convolverNode.buffer=e,i.callback&&s.Util.isFunction(i.callback)&&i.callback();},function(e){e=e||new Error("Error decoding impulse file"),i.callback&&s.Util.isFunction(i.callback)&&i.callback(e);});},n.onreadystatechange=function(t){4===n.readyState&&200!==n.status&&console.error("Error while fetching "+e.impulse+". "+n.statusText);},void n.send()):void console.error("No impulse file specified.")},o.Effects.Convolver.prototype=Object.create(f,{mix:{enumerable:!0,get:function(){return this.options.mix},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.mix=e,this.dryGainNode.gain.value=o.Util.getDryLevel(this.mix),this.wetGainNode.gain.value=o.Util.getWetLevel(this.mix));}}}),o.Effects.PingPongDelay=function(e){this.options={},e=e||this.options;var t={feedback:.5,time:.3,mix:.5};this.inputNode=o.context.createGain(),this.outputNode=o.context.createGain(),this.delayNodeLeft=o.context.createDelay(),this.delayNodeRight=o.context.createDelay(),this.dryGainNode=o.context.createGain(),this.wetGainNode=o.context.createGain(),this.feedbackGainNode=o.context.createGain(),this.channelMerger=o.context.createChannelMerger(2),this.inputNode.connect(this.dryGainNode),this.dryGainNode.connect(this.outputNode),this.delayNodeLeft.connect(this.channelMerger,0,0),this.delayNodeRight.connect(this.channelMerger,0,1),this.delayNodeLeft.connect(this.delayNodeRight),this.feedbackGainNode.connect(this.delayNodeLeft),this.delayNodeRight.connect(this.feedbackGainNode),this.inputNode.connect(this.feedbackGainNode),this.channelMerger.connect(this.wetGainNode),this.wetGainNode.connect(this.outputNode);for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];},o.Effects.PingPongDelay.prototype=Object.create(f,{mix:{enumerable:!0,get:function(){return this.options.mix},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.mix=e,this.dryGainNode.gain.value=o.Util.getDryLevel(this.mix),this.wetGainNode.gain.value=o.Util.getWetLevel(this.mix));}},time:{enumerable:!0,get:function(){return this.options.time},set:function(e){s.Util.isInRange(e,0,180)&&(this.options.time=e,this.delayNodeLeft.delayTime.value=e,this.delayNodeRight.delayTime.value=e);}},feedback:{enumerable:!0,get:function(){return this.options.feedback},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.feedback=parseFloat(e,10),this.feedbackGainNode.gain.value=this.feedback);}}}),o.Effects.Reverb=function(e){this.options={},e=e||this.options;var t={mix:.5,time:.01,decay:.01,reverse:!1};this.inputNode=o.context.createGain(),this.reverbNode=o.context.createConvolver(),this.outputNode=o.context.createGain(),this.wetGainNode=o.context.createGain(),this.dryGainNode=o.context.createGain(),this.inputNode.connect(this.reverbNode),this.reverbNode.connect(this.wetGainNode),this.inputNode.connect(this.dryGainNode),this.dryGainNode.connect(this.outputNode),this.wetGainNode.connect(this.outputNode);for(var n in t)this[n]=e[n],this[n]=void 0===this[n]||null===this[n]?t[n]:this[n];i.bind(this)();},o.Effects.Reverb.prototype=Object.create(f,{mix:{enumerable:!0,get:function(){return this.options.mix},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.mix=e,this.dryGainNode.gain.value=o.Util.getDryLevel(this.mix),this.wetGainNode.gain.value=o.Util.getWetLevel(this.mix));}},time:{enumerable:!0,get:function(){return this.options.time},set:function(e){s.Util.isInRange(e,1e-4,10)&&(this.options.time=e,i.bind(this)());}},decay:{enumerable:!0,get:function(){return this.options.decay},set:function(e){s.Util.isInRange(e,1e-4,10)&&(this.options.decay=e,i.bind(this)());}},reverse:{enumerable:!0,get:function(){return this.options.reverse},set:function(e){s.Util.isBool(e)&&(this.options.reverse=e,i.bind(this)());}}}),o.Effects.Tremolo=function(e){this.options={},e=e||this.options;var t={speed:4,depth:1,mix:.8};this.inputNode=o.context.createGain(),this.outputNode=o.context.createGain(),this.dryGainNode=o.context.createGain(),this.wetGainNode=o.context.createGain(),this.tremoloGainNode=o.context.createGain(),this.tremoloGainNode.gain.value=0,this.lfoNode=o.context.createOscillator(),this.shaperNode=o.context.createWaveShaper(),this.shaperNode.curve=new Float32Array([0,1]),this.shaperNode.connect(this.tremoloGainNode.gain),this.inputNode.connect(this.dryGainNode),this.dryGainNode.connect(this.outputNode),this.lfoNode.connect(this.shaperNode),this.lfoNode.type="sine",this.lfoNode.start(0),this.inputNode.connect(this.tremoloGainNode),this.tremoloGainNode.connect(this.wetGainNode),this.wetGainNode.connect(this.outputNode);for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];},o.Effects.Tremolo.prototype=Object.create(f,{mix:{enumerable:!0,get:function(){return this.options.mix},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.mix=e,this.dryGainNode.gain.value=o.Util.getDryLevel(this.mix),this.wetGainNode.gain.value=o.Util.getWetLevel(this.mix));}},speed:{enumerable:!0,get:function(){return this.options.speed},set:function(e){s.Util.isInRange(e,0,20)&&(this.options.speed=e,this.lfoNode.frequency.value=e);}},depth:{enumerable:!0,get:function(){return this.options.depth},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.depth=e,this.shaperNode.curve=new Float32Array([1-e,1]));}}}),o.Effects.DubDelay=function(e){this.options={},e=e||this.options;var t={feedback:.6,time:.7,mix:.5,cutoff:700};this.inputNode=o.context.createGain(),this.outputNode=o.context.createGain(),this.dryGainNode=o.context.createGain(),this.wetGainNode=o.context.createGain(),this.feedbackGainNode=o.context.createGain(),this.delayNode=o.context.createDelay(),this.bqFilterNode=o.context.createBiquadFilter(),this.inputNode.connect(this.dryGainNode),this.dryGainNode.connect(this.outputNode),this.inputNode.connect(this.wetGainNode),this.inputNode.connect(this.feedbackGainNode),this.feedbackGainNode.connect(this.bqFilterNode),this.bqFilterNode.connect(this.delayNode),this.delayNode.connect(this.feedbackGainNode),this.delayNode.connect(this.wetGainNode),this.wetGainNode.connect(this.outputNode);for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];},o.Effects.DubDelay.prototype=Object.create(f,{mix:{enumerable:!0,get:function(){return this.options.mix},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.mix=e,this.dryGainNode.gain.value=o.Util.getDryLevel(this.mix),this.wetGainNode.gain.value=o.Util.getWetLevel(this.mix));}},time:{enumerable:!0,get:function(){return this.options.time},set:function(e){s.Util.isInRange(e,0,180)&&(this.options.time=e,this.delayNode.delayTime.value=e);}},feedback:{enumerable:!0,get:function(){return this.options.feedback},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.feedback=parseFloat(e,10),this.feedbackGainNode.gain.value=this.feedback);}},cutoff:{enumerable:!0,get:function(){return this.options.cutoff},set:function(e){s.Util.isInRange(e,0,4e3)&&(this.options.cutoff=e,this.bqFilterNode.frequency.value=this.cutoff);}}}),o.Effects.RingModulator=function(e){this.options={},e=e||this.options;var t={speed:30,distortion:1,mix:.5};this.inputNode=o.context.createGain(),this.outputNode=o.context.createGain(),this.dryGainNode=o.context.createGain(),this.wetGainNode=o.context.createGain(),this.vIn=o.context.createOscillator(),this.vIn.start(0),this.vInGain=o.context.createGain(),this.vInGain.gain.value=.5,this.vInInverter1=o.context.createGain(),this.vInInverter1.gain.value=-1,this.vInInverter2=o.context.createGain(),this.vInInverter2.gain.value=-1,this.vInDiode1=new v(o.context),this.vInDiode2=new v(o.context),this.vInInverter3=o.context.createGain(),this.vInInverter3.gain.value=-1,this.vcInverter1=o.context.createGain(),this.vcInverter1.gain.value=-1,this.vcDiode3=new v(o.context),this.vcDiode4=new v(o.context),this.outGain=o.context.createGain(),this.outGain.gain.value=3,this.compressor=o.context.createDynamicsCompressor(),this.compressor.threshold.value=-24,this.compressor.ratio.value=16,this.inputNode.connect(this.dryGainNode),this.dryGainNode.connect(this.outputNode),this.inputNode.connect(this.vcInverter1),this.inputNode.connect(this.vcDiode4.node),this.vcInverter1.connect(this.vcDiode3.node),this.vIn.connect(this.vInGain),this.vInGain.connect(this.vInInverter1),this.vInGain.connect(this.vcInverter1),this.vInGain.connect(this.vcDiode4.node),this.vInInverter1.connect(this.vInInverter2),this.vInInverter1.connect(this.vInDiode2.node),this.vInInverter2.connect(this.vInDiode1.node),this.vInDiode1.connect(this.vInInverter3),this.vInDiode2.connect(this.vInInverter3),this.vInInverter3.connect(this.compressor),this.vcDiode3.connect(this.compressor),this.vcDiode4.connect(this.compressor),this.compressor.connect(this.outGain),
    this.outGain.connect(this.wetGainNode),this.wetGainNode.connect(this.outputNode);for(var i in t)this[i]=e[i],this[i]=void 0===this[i]||null===this[i]?t[i]:this[i];};var v=function(e){this.context=e,this.node=this.context.createWaveShaper(),this.vb=.2,this.vl=.4,this.h=1,this.setCurve();};return v.prototype.setDistortion=function(e){return this.h=e,this.setCurve()},v.prototype.setCurve=function(){var e,t,i,n,o,s,a;for(t=1024,o=new Float32Array(t),e=s=0,a=o.length;a>=0?a>s:s>a;e=a>=0?++s:--s)i=(e-t/2)/(t/2),i=Math.abs(i),n=i<=this.vb?0:this.vb<i&&i<=this.vl?this.h*(Math.pow(i-this.vb,2)/(2*this.vl-2*this.vb)):this.h*i-this.h*this.vl+this.h*(Math.pow(this.vl-this.vb,2)/(2*this.vl-2*this.vb)),o[e]=n;return this.node.curve=o},v.prototype.connect=function(e){return this.node.connect(e)},o.Effects.RingModulator.prototype=Object.create(f,{mix:{enumerable:!0,get:function(){return this.options.mix},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.mix=e,this.dryGainNode.gain.value=o.Util.getDryLevel(this.mix),this.wetGainNode.gain.value=o.Util.getWetLevel(this.mix));}},speed:{enumerable:!0,get:function(){return this.options.speed},set:function(e){s.Util.isInRange(e,0,2e3)&&(this.options.speed=e,this.vIn.frequency.value=e);}},distortion:{enumerable:!0,get:function(){return this.options.distortion},set:function(e){if(s.Util.isInRange(e,.2,50)){this.options.distortion=parseFloat(e,10);for(var t=[this.vInDiode1,this.vInDiode2,this.vcDiode3,this.vcDiode4],i=0,n=t.length;n>i;i++)t[i].setDistortion(e);}}}}),o.Effects.Quadrafuzz=function(e){this.options={},e=e||this.options;var t={lowGain:.6,midLowGain:.8,midHighGain:.5,highGain:.6};this.inputNode=s.context.createGain(),this.outputNode=s.context.createGain(),this.dryGainNode=s.context.createGain(),this.wetGainNode=s.context.createGain(),this.lowpassLeft=s.context.createBiquadFilter(),this.lowpassLeft.type="lowpass",this.lowpassLeft.frequency.value=147,this.lowpassLeft.Q.value=.7071,this.bandpass1Left=s.context.createBiquadFilter(),this.bandpass1Left.type="bandpass",this.bandpass1Left.frequency.value=587,this.bandpass1Left.Q.value=.7071,this.bandpass2Left=s.context.createBiquadFilter(),this.bandpass2Left.type="bandpass",this.bandpass2Left.frequency.value=2490,this.bandpass2Left.Q.value=.7071,this.highpassLeft=s.context.createBiquadFilter(),this.highpassLeft.type="highpass",this.highpassLeft.frequency.value=4980,this.highpassLeft.Q.value=.7071,this.overdrives=[];for(var i=0;4>i;i++)this.overdrives[i]=s.context.createWaveShaper(),this.overdrives[i].curve=n();this.inputNode.connect(this.wetGainNode),this.inputNode.connect(this.dryGainNode),this.dryGainNode.connect(this.outputNode);var o=[this.lowpassLeft,this.bandpass1Left,this.bandpass2Left,this.highpassLeft];for(i=0;i<o.length;i++)this.wetGainNode.connect(o[i]),o[i].connect(this.overdrives[i]),this.overdrives[i].connect(this.outputNode);for(var a in t)this[a]=e[a],this[a]=void 0===this[a]||null===this[a]?t[a]:this[a];},o.Effects.Quadrafuzz.prototype=Object.create(f,{lowGain:{enumerable:!0,get:function(){return this.options.lowGain},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.lowGain=e,this.overdrives[0].curve=n(s.Util.normalize(this.lowGain,0,150)));}},midLowGain:{enumerable:!0,get:function(){return this.options.midLowGain},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.midLowGain=e,this.overdrives[1].curve=n(s.Util.normalize(this.midLowGain,0,150)));}},midHighGain:{enumerable:!0,get:function(){return this.options.midHighGain},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.midHighGain=e,this.overdrives[2].curve=n(s.Util.normalize(this.midHighGain,0,150)));}},highGain:{enumerable:!0,get:function(){return this.options.highGain},set:function(e){s.Util.isInRange(e,0,1)&&(this.options.highGain=e,this.overdrives[3].curve=n(s.Util.normalize(this.highGain,0,150)));}}}),o}("undefined"!=typeof window?window:commonjsGlobal);
    });

    let audioContext;
    let limiter;
    let preGain;

    let isSoundPlaying;
    let isInputPlaying;
    let inputStream;

    let processor;
    let processorOptions;
    let waveDataCallback;
    let soundDataCallback;
    let processErrorCallback;


    async function init(drawWaveCallback, drawSoundCallback, errorCallback) {
        waveDataCallback = drawWaveCallback;
        soundDataCallback = drawSoundCallback;
        processErrorCallback = errorCallback;

        audioContext = Pizzicato_min.context;

        preGain = createGain();
        limiter = new Pizzicato_min.Effects.Compressor({
            threshold: -5.0, // decibels
            knee: 0, // decibels
            ratio: 40.0,  // decibels
            attack: 0.001, // seconds
            release: 0.1, // seconds
        });

        processorOptions = {
            mainGain: Pizzicato_min.masterGainNode.gain.value,
            sampleRate: audioContext.sampleRate,
        };
        await audioContext.audioWorklet.addModule('processors/SoundwaveProcessor.js');
        await audioContext.audioWorklet.addModule('processors/SingleSoundProcessor.js');
    }

    function createSoundwaveProcessor() {
        const processorNode = new AudioWorkletNode(audioContext, 'soundwave-processor', {processorOptions});
        processorNode.port.onmessage = (e) => {
            //console.log('soundsystem.onmessage', e);
            handleProcessorMessage(e.data);
        };

        return processorNode;
    }

    function handleProcessorMessage(message) {
        const { id, data } = message;
        //console.log('handleProcessorMessage', id);
        //console.log(data);
        switch (id) {
            case 'waveData': {
                waveDataCallback(data);
                break;
            }
            case 'soundData': {
                console.log('got soundData', data);
                stopSingleSoundProcessor();
                soundDataCallback(data);
                break;
            }
            case 'error': {
                processErrorCallback(data);
                break;
            }
            default: {
                console.warn('unknown processor message', message);
                break;
            }
        }
    }

    function createSound(type, frequency) {
        const sound = createOscillator(type, frequency);
        const soundGain = audioContext.createGain();
        sound.connect(soundGain);
        soundGain.connect(preGain);

        return {sound, soundGain};
    }

    function createOscillator(type, frequency) {
        const osc = new Pizzicato_min.Sound({
            source: 'wave',
            options: {
                type,
                frequency,
                detached: true,
            }
        });

        return osc;
    }

    function removeOscillator(osc) {
        if (osc) {
            osc.off();
            osc.stop();
            osc.disconnect();
        }
    }

    function assertAudioContextRunning() {
        if (Pizzicato_min.context.state !== 'running') {
            Pizzicato_min.context.resume();
        }
    }

    async function startUserAudio(echoCancellation, noiseSuppression) {
        stopUserAudio();
        assertAudioContextRunning();
        return navigator.mediaDevices.getUserMedia({ audio: {echoCancellation, noiseSuppression} })
            .then(stream => {
                const audioSourceNode = new MediaStreamAudioSourceNode(audioContext, {mediaStream: stream});
                audioSourceNode.connect(limiter);
                startSoundwaveProcessor();
                isInputPlaying = true;
                inputStream = stream;
                return true;
            });
    }

    function stopUserAudio() {
        isInputPlaying = false;
        stopSoundwaveProcessor();
        if (inputStream) {
            inputStream.getAudioTracks().forEach(track => {
                track.stop();
            });
            inputStream = null;
        }
    }

    function startSound() {
        assertAudioContextRunning();
        preGain.connect(limiter);
        startSoundwaveProcessor();
        //startSingleSoundProcessor();
        isSoundPlaying = true;
    }

    function stopSound() {
        isSoundPlaying = false;
        stopSoundwaveProcessor();
    }

    function stopSingleSoundProcessor() {
        if (processor) {
            console.log('stopSingleSoundProcessor');
            //processorMessage('stop');
            limiter.disconnect(processor);
            processor.disconnect(Pizzicato_min.masterGainNode);
            processor = null;
        }
    }

    function startSoundwaveProcessor() {
        if (!processor) {
            console.log('startSoundwaveProcessor');

            processor = createSoundwaveProcessor();

            limiter.connect(processor);
            processor.connect(Pizzicato_min.masterGainNode);
        }
    }

    function stopSoundwaveProcessor() {
        if (processor && !isInputPlaying && !isSoundPlaying) {
            console.log('stopSoundwaveProcessor');
            processorMessage('stop');
            limiter.disconnect(processor);
            processor.disconnect(Pizzicato_min.masterGainNode);
            processor = null;
        }
    }

    function setProcessorSweepTime(time) {
        processorMessage('sweepTime', time);
    }

    function setProcessorFps(fps) {
        processorMessage('fps', fps);
    }

    function processorMessage(id, data) {
        if (processor) {
            processor.port.postMessage({id, data});
        }
    }

    function createGain(options = {}) {
        return new GainNode(audioContext, options);
    }

    function changeFrequency(sound, newFrequency) {
        sound.frequency.exponentialRampToValueAtTime(newFrequency, audioContext.currentTime + 0.2);
    }

    class LFO {

        constructor() {
            this.gain = null;
            this.oscillator = null;

            this.waveType = null;
            this.frequency = null;
            this.destination = null;
            this.depth = null;
        }

        init(waveType, frequency, depth, destination) {
            this.waveType = waveType;
            this.frequency = frequency;
            this.depth = depth;
            this.destination = destination;

            this.remove();

            this.oscillator = createOscillator(waveType, frequency);

            this.gain = createGain({ gain: depth });
            this.gain.connect(destination);

            this.oscillator.connect(this.gain);
        }

        play() {
            if (this.oscillator) {
                this.oscillator.play();
            }
        }

        stop() {
            if (this.oscillator) {
                this.oscillator.stop();
            }
        }

        remove() {
            if (this.gain) {
                this.gain.disconnect();
            }
            removeOscillator(this.oscillator);
        }

        setFrequency(frequency) {
            if (this.oscillator) {
                changeFrequency(this.oscillator, frequency);
            }
        }
    }

    /**
     * This is a wrapper around a Pizzicato.Sound object ('soundwave').
     *
     * The underlying sound is created by the soundsystem ('createSound').
     */

    class Sound {
        constructor() {
            this.soundwave = null;
            this.gain = null;
            this.lfo = null;
            this.isPlaying = false;
        }

        init(waveType, frequency) {
            this.remove();
            const { sound, soundGain } = createSound(waveType, frequency);
            this.soundwave = sound;
            this.gain = soundGain;
        }

        setFrequency(frequency) {
            if (this.soundwave) {
                changeFrequency(this.soundwave.sourceNode, frequency);
            }
        }

        setDetune(detune) {
            if (this.soundwave) {
                this.soundwave.sourceNode.detune.value = detune;
            }
        }

        initLfo(waveType, frequency, depth) {
            this.removeLfo();

            this.lfo = new LFO();
            this.lfo.init(waveType, frequency, depth, this.soundwave.sourceNode.frequency);

            if (this.isPlaying) {
                this.lfo.play();
            }
        }

        setLfoFrequency(frequency) {
            if (this.lfo) {
                this.lfo.setFrequency(frequency);
            }
        }

        removeLfo() {
            if (this.lfo) {
                this.lfo.remove();
                this.lfo = null;
            }
        }

        play() {
            this.isPlaying = true;
            if (this.soundwave) {
                this.soundwave.play();
            }
            if (this.lfo) {
                // lfo must be recreated (connected again) if sound was stopped
                const { waveType, frequency, depth } = this.lfo;
                this.initLfo(waveType, frequency, depth);
            }
        }

        stop() {
            this.isPlaying = false;
            if (this.soundwave) {
                this.soundwave.stop();
            }
            if (this.lfo) {
                this.lfo.stop();
            }
        }

        remove() {
            this.removeLfo();
            removeOscillator(this.soundwave);
            if (this.gain) {
                this.gain.disconnect();
            }
        }
    }

    /* src/modules/oscilloscope/OscilloscopeControls.svelte generated by Svelte v3.44.2 */

    // (1:0) <Panel heading="OSCILLOSCOPE PARAMETERS" isOpen={true}>
    function create_default_slot(ctx) {
    	let knob0;
    	let updating_value;
    	let t0;
    	let knob1;
    	let updating_value_1;
    	let t1;
    	let knob2;
    	let updating_value_2;
    	let current;

    	function knob0_value_binding(value) {
    		/*knob0_value_binding*/ ctx[4](value);
    	}

    	let knob0_props = {
    		title: "⅟SAMPLE TIME",
    		max: 1000,
    		min: 1,
    		pixelRange: 200
    	};

    	if (/*sampleSizeStep*/ ctx[2] !== void 0) {
    		knob0_props.value = /*sampleSizeStep*/ ctx[2];
    	}

    	knob0 = new Knob({ props: knob0_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob0, 'value', knob0_value_binding));

    	function knob1_value_binding(value) {
    		/*knob1_value_binding*/ ctx[5](value);
    	}

    	let knob1_props = {
    		title: "FPS",
    		max: 120,
    		min: 1,
    		pixelRange: 200
    	};

    	if (/*fps*/ ctx[0] !== void 0) {
    		knob1_props.value = /*fps*/ ctx[0];
    	}

    	knob1 = new Knob({ props: knob1_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob1, 'value', knob1_value_binding));

    	function knob2_value_binding(value) {
    		/*knob2_value_binding*/ ctx[6](value);
    	}

    	let knob2_props = {
    		title: "WAVES SHOWING",
    		max: 30,
    		min: 1,
    		pixelRange: 200
    	};

    	if (/*oldWavesDisplayed*/ ctx[1] !== void 0) {
    		knob2_props.value = /*oldWavesDisplayed*/ ctx[1];
    	}

    	knob2 = new Knob({ props: knob2_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob2, 'value', knob2_value_binding));

    	const block = {
    		c: function create() {
    			create_component(knob0.$$.fragment);
    			t0 = space();
    			create_component(knob1.$$.fragment);
    			t1 = space();
    			create_component(knob2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(knob0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(knob1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(knob2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const knob0_changes = {};

    			if (!updating_value && dirty & /*sampleSizeStep*/ 4) {
    				updating_value = true;
    				knob0_changes.value = /*sampleSizeStep*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			knob0.$set(knob0_changes);
    			const knob1_changes = {};

    			if (!updating_value_1 && dirty & /*fps*/ 1) {
    				updating_value_1 = true;
    				knob1_changes.value = /*fps*/ ctx[0];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			knob1.$set(knob1_changes);
    			const knob2_changes = {};

    			if (!updating_value_2 && dirty & /*oldWavesDisplayed*/ 2) {
    				updating_value_2 = true;
    				knob2_changes.value = /*oldWavesDisplayed*/ ctx[1];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			knob2.$set(knob2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(knob0.$$.fragment, local);
    			transition_in(knob1.$$.fragment, local);
    			transition_in(knob2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(knob0.$$.fragment, local);
    			transition_out(knob1.$$.fragment, local);
    			transition_out(knob2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(knob0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(knob1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(knob2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(1:0) <Panel heading=\\\"OSCILLOSCOPE PARAMETERS\\\" isOpen={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				heading: "OSCILLOSCOPE PARAMETERS",
    				isOpen: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(panel.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(panel, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const panel_changes = {};

    			if (dirty & /*$$scope, oldWavesDisplayed, fps, sampleSizeStep*/ 135) {
    				panel_changes.$$scope = { dirty, ctx };
    			}

    			panel.$set(panel_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(panel, detaching);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('OscilloscopeControls', slots, []);
    	let { sampleSize } = $$props;
    	let { fps } = $$props;
    	let { oldWavesDisplayed } = $$props;
    	let sampleSizeStep = 1 / sampleSize;
    	const writable_props = ['sampleSize', 'fps', 'oldWavesDisplayed'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<OscilloscopeControls> was created with unknown prop '${key}'`);
    	});

    	function knob0_value_binding(value) {
    		sampleSizeStep = value;
    		$$invalidate(2, sampleSizeStep);
    	}

    	function knob1_value_binding(value) {
    		fps = value;
    		$$invalidate(0, fps);
    	}

    	function knob2_value_binding(value) {
    		oldWavesDisplayed = value;
    		$$invalidate(1, oldWavesDisplayed);
    	}

    	$$self.$$set = $$props => {
    		if ('sampleSize' in $$props) $$invalidate(3, sampleSize = $$props.sampleSize);
    		if ('fps' in $$props) $$invalidate(0, fps = $$props.fps);
    		if ('oldWavesDisplayed' in $$props) $$invalidate(1, oldWavesDisplayed = $$props.oldWavesDisplayed);
    	};

    	$$self.$capture_state = () => ({
    		Panel,
    		Knob,
    		sampleSize,
    		fps,
    		oldWavesDisplayed,
    		sampleSizeStep
    	});

    	$$self.$inject_state = $$props => {
    		if ('sampleSize' in $$props) $$invalidate(3, sampleSize = $$props.sampleSize);
    		if ('fps' in $$props) $$invalidate(0, fps = $$props.fps);
    		if ('oldWavesDisplayed' in $$props) $$invalidate(1, oldWavesDisplayed = $$props.oldWavesDisplayed);
    		if ('sampleSizeStep' in $$props) $$invalidate(2, sampleSizeStep = $$props.sampleSizeStep);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sampleSizeStep*/ 4) {
    			$$invalidate(3, sampleSize = 1 / sampleSizeStep);
    		}
    	};

    	return [
    		fps,
    		oldWavesDisplayed,
    		sampleSizeStep,
    		sampleSize,
    		knob0_value_binding,
    		knob1_value_binding,
    		knob2_value_binding
    	];
    }

    class OscilloscopeControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			sampleSize: 3,
    			fps: 0,
    			oldWavesDisplayed: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OscilloscopeControls",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sampleSize*/ ctx[3] === undefined && !('sampleSize' in props)) {
    			console.warn("<OscilloscopeControls> was created without expected prop 'sampleSize'");
    		}

    		if (/*fps*/ ctx[0] === undefined && !('fps' in props)) {
    			console.warn("<OscilloscopeControls> was created without expected prop 'fps'");
    		}

    		if (/*oldWavesDisplayed*/ ctx[1] === undefined && !('oldWavesDisplayed' in props)) {
    			console.warn("<OscilloscopeControls> was created without expected prop 'oldWavesDisplayed'");
    		}
    	}

    	get sampleSize() {
    		throw new Error("<OscilloscopeControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sampleSize(value) {
    		throw new Error("<OscilloscopeControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fps() {
    		throw new Error("<OscilloscopeControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fps(value) {
    		throw new Error("<OscilloscopeControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get oldWavesDisplayed() {
    		throw new Error("<OscilloscopeControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set oldWavesDisplayed(value) {
    		throw new Error("<OscilloscopeControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/FPSDisplay.svelte generated by Svelte v3.44.2 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/components/FPSDisplay.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*currentFps*/ ctx[0]);
    			t1 = text(" FPS");
    			add_location(div, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentFps*/ 1) set_data_dev(t0, /*currentFps*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    const FILTER_STRENGTH = 10;

    // how often we'll display the current fps (in milliseconds)
    const DISPLAY_INTERVAL = 500;

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FPSDisplay', slots, []);
    	const doTick = time => tick(time);
    	const stop = () => reset();
    	let currentFps = 0; // the fps value that gets displayed
    	let frameTime = 0; // the average time
    	let lastTickTime = 0;
    	let intervalId = -1;
    	let tickCounter = 0; // if we calculate the currentFps before we reached FILTER_STRENGTH, we'll get values that are much too high 
    	const logData = [];

    	onDestroy(() => {
    		reset();
    	});

    	function startDisplayUpdateInterval() {
    		if (intervalId === -1) {
    			intervalId = setInterval(updateDisplay, DISPLAY_INTERVAL);
    		}
    	}

    	function updateDisplay() {
    		if (tickCounter >= FILTER_STRENGTH) {
    			$$invalidate(0, currentFps = (1000 / frameTime).toFixed(1));
    			logData.push('display');

    			if (tickCounter > 50) {
    				console.log(logData.splice(0));
    				tickCounter = FILTER_STRENGTH;
    			}
    		}
    	}

    	function tick(time) {
    		tickCounter++;

    		// is first tick? set the initial state
    		if (!lastTickTime) {
    			lastTickTime = time;
    			startDisplayUpdateInterval();
    			return;
    		}

    		const thisFrameTime = time - lastTickTime;
    		lastTickTime = time;

    		// first frameTime calculation? use thisFrameTime as intial state
    		if (!frameTime) {
    			frameTime = thisFrameTime / FILTER_STRENGTH;
    		} else {
    			frameTime += (thisFrameTime - frameTime) / FILTER_STRENGTH;
    		}

    		logData.push({ frameTime, thisFrame: thisFrameTime });
    	}

    	function reset() {
    		$$invalidate(0, currentFps = 0);
    		frameTime = 0;
    		lastTickTime = 0;
    		clearInterval(intervalId);
    		intervalId = -1;
    		tickCounter = 0;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<FPSDisplay> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onDestroy,
    		doTick,
    		stop,
    		FILTER_STRENGTH,
    		DISPLAY_INTERVAL,
    		currentFps,
    		frameTime,
    		lastTickTime,
    		intervalId,
    		tickCounter,
    		logData,
    		startDisplayUpdateInterval,
    		updateDisplay,
    		tick,
    		reset
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentFps' in $$props) $$invalidate(0, currentFps = $$props.currentFps);
    		if ('frameTime' in $$props) frameTime = $$props.frameTime;
    		if ('lastTickTime' in $$props) lastTickTime = $$props.lastTickTime;
    		if ('intervalId' in $$props) intervalId = $$props.intervalId;
    		if ('tickCounter' in $$props) tickCounter = $$props.tickCounter;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentFps, doTick, stop];
    }

    class FPSDisplay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$3, create_fragment$3, safe_not_equal, { doTick: 1, stop: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FPSDisplay",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get doTick() {
    		return this.$$.ctx[1];
    	}

    	set doTick(value) {
    		throw new Error("<FPSDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stop() {
    		return this.$$.ctx[2];
    	}

    	set stop(value) {
    		throw new Error("<FPSDisplay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/modules/oscilloscope/Oscilloscope.svelte generated by Svelte v3.44.2 */
    const file$2 = "src/modules/oscilloscope/Oscilloscope.svelte";

    function create_fragment$2(ctx) {
    	let viewcontrols;
    	let updating_sampleSize;
    	let updating_oldWavesDisplayed;
    	let updating_fps;
    	let t0;
    	let fpsdisplay;
    	let updating_doTick;
    	let updating_stop;
    	let t1;
    	let div;
    	let canvas;
    	let current;

    	function viewcontrols_sampleSize_binding(value) {
    		/*viewcontrols_sampleSize_binding*/ ctx[7](value);
    	}

    	function viewcontrols_oldWavesDisplayed_binding(value) {
    		/*viewcontrols_oldWavesDisplayed_binding*/ ctx[8](value);
    	}

    	function viewcontrols_fps_binding(value) {
    		/*viewcontrols_fps_binding*/ ctx[9](value);
    	}

    	let viewcontrols_props = {};

    	if (/*sampleSize*/ ctx[1] !== void 0) {
    		viewcontrols_props.sampleSize = /*sampleSize*/ ctx[1];
    	}

    	if (/*oldWavesDisplayed*/ ctx[0] !== void 0) {
    		viewcontrols_props.oldWavesDisplayed = /*oldWavesDisplayed*/ ctx[0];
    	}

    	if (/*fps*/ ctx[2] !== void 0) {
    		viewcontrols_props.fps = /*fps*/ ctx[2];
    	}

    	viewcontrols = new OscilloscopeControls({
    			props: viewcontrols_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(viewcontrols, 'sampleSize', viewcontrols_sampleSize_binding));
    	binding_callbacks.push(() => bind(viewcontrols, 'oldWavesDisplayed', viewcontrols_oldWavesDisplayed_binding));
    	binding_callbacks.push(() => bind(viewcontrols, 'fps', viewcontrols_fps_binding));

    	function fpsdisplay_doTick_binding(value) {
    		/*fpsdisplay_doTick_binding*/ ctx[10](value);
    	}

    	function fpsdisplay_stop_binding(value) {
    		/*fpsdisplay_stop_binding*/ ctx[11](value);
    	}

    	let fpsdisplay_props = {};

    	if (/*doFPSTick*/ ctx[5] !== void 0) {
    		fpsdisplay_props.doTick = /*doFPSTick*/ ctx[5];
    	}

    	if (/*stopFPS*/ ctx[6] !== void 0) {
    		fpsdisplay_props.stop = /*stopFPS*/ ctx[6];
    	}

    	fpsdisplay = new FPSDisplay({ props: fpsdisplay_props, $$inline: true });
    	binding_callbacks.push(() => bind(fpsdisplay, 'doTick', fpsdisplay_doTick_binding));
    	binding_callbacks.push(() => bind(fpsdisplay, 'stop', fpsdisplay_stop_binding));

    	const block = {
    		c: function create() {
    			create_component(viewcontrols.$$.fragment);
    			t0 = space();
    			create_component(fpsdisplay.$$.fragment);
    			t1 = space();
    			div = element("div");
    			canvas = element("canvas");
    			attr_dev(canvas, "class", "canvas");
    			add_location(canvas, file$2, 3, 4, 232);
    			attr_dev(div, "class", "canvasContainer center svelte-zzng2e");
    			add_location(div, file$2, 2, 0, 163);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(viewcontrols, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(fpsdisplay, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas);
    			/*canvas_binding*/ ctx[12](canvas);
    			/*div_binding*/ ctx[13](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const viewcontrols_changes = {};

    			if (!updating_sampleSize && dirty & /*sampleSize*/ 2) {
    				updating_sampleSize = true;
    				viewcontrols_changes.sampleSize = /*sampleSize*/ ctx[1];
    				add_flush_callback(() => updating_sampleSize = false);
    			}

    			if (!updating_oldWavesDisplayed && dirty & /*oldWavesDisplayed*/ 1) {
    				updating_oldWavesDisplayed = true;
    				viewcontrols_changes.oldWavesDisplayed = /*oldWavesDisplayed*/ ctx[0];
    				add_flush_callback(() => updating_oldWavesDisplayed = false);
    			}

    			if (!updating_fps && dirty & /*fps*/ 4) {
    				updating_fps = true;
    				viewcontrols_changes.fps = /*fps*/ ctx[2];
    				add_flush_callback(() => updating_fps = false);
    			}

    			viewcontrols.$set(viewcontrols_changes);
    			const fpsdisplay_changes = {};

    			if (!updating_doTick && dirty & /*doFPSTick*/ 32) {
    				updating_doTick = true;
    				fpsdisplay_changes.doTick = /*doFPSTick*/ ctx[5];
    				add_flush_callback(() => updating_doTick = false);
    			}

    			if (!updating_stop && dirty & /*stopFPS*/ 64) {
    				updating_stop = true;
    				fpsdisplay_changes.stop = /*stopFPS*/ ctx[6];
    				add_flush_callback(() => updating_stop = false);
    			}

    			fpsdisplay.$set(fpsdisplay_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(viewcontrols.$$.fragment, local);
    			transition_in(fpsdisplay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(viewcontrols.$$.fragment, local);
    			transition_out(fpsdisplay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(viewcontrols, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(fpsdisplay, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			/*canvas_binding*/ ctx[12](null);
    			/*div_binding*/ ctx[13](null);
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

    let renderWaveFunction;
    let renderSoundFunction;

    function drawWaveCallback(data) {
    	renderWaveFunction(data);
    }

    function drawSoundCallback(data) {
    	renderSoundFunction(data);
    }

    function initDrawingContext(canvas) {
    	const drawingContext = canvas.getContext('2d');
    	drawingContext.strokeStyle = '#ff3e00';
    	drawingContext.lineWidth = 1;
    	return drawingContext;
    }

    function getWavePointCoordsAtIndex(waveData, index, canvasWidth, canvasHeight) {
    	const { xSamples, ySamples } = waveData;
    	const padding = 100; // avoid clipping of top points
    	const yOffset = padding / 2;
    	const height = canvasHeight - padding;
    	const xOffset = canvasWidth / 2;

    	return {
    		x: xOffset + xSamples[index] / 2 * canvasWidth,
    		y: yOffset + (0.5 + ySamples[index] / 2) * height
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Oscilloscope', slots, []);
    	let { oldWavesDisplayed } = $$props;
    	let { sampleSize } = $$props;
    	let { fps } = $$props;
    	const canvasImages = [];
    	let canvasContainer;
    	let onscreenCanvas;
    	let onscreenDrawingContext;
    	let offscreenCanvas;
    	let offscreenDrawingContext;
    	let doFPSTick;
    	let stopFPS;
    	let fadeOutTimeout = null;
    	const frameTime = 1 / 60 * 1000;

    	onMount(() => {
    		init();
    	});

    	onDestroy(() => {
    		clearFadeOut();

    		// reset async callbacks to avoid null pointers if they are called after removal
    		renderWaveFunction = () => {
    			
    		};

    		renderSoundFunction = () => {
    			
    		};

    		drawImages = () => {
    			
    		};
    	});

    	function init() {
    		setCanvasSize(onscreenCanvas);
    		onscreenDrawingContext = initDrawingContext(onscreenCanvas);
    		offscreenCanvas = document.createElement('canvas');
    		setCanvasSize(offscreenCanvas);
    		offscreenDrawingContext = initDrawingContext(offscreenCanvas);
    		renderWaveFunction = drawWave;
    		renderSoundFunction = drawSound;
    	}

    	function setCanvasSize(canvas) {
    		canvas.width = canvasContainer.clientWidth;
    		canvas.height = canvas.width * 0.33;
    	}

    	function clearFadeOut() {
    		if (fadeOutTimeout) {
    			clearTimeout(fadeOutTimeout);
    			fadeOutTimeout = null;
    		}
    	}

    	function drawWave(data) {
    		//console.log('drawWave');
    		// stop fade out
    		clearFadeOut();

    		// draw samples
    		const { samplesLength, continueProcessing } = data;

    		const { width, height } = offscreenCanvas;
    		let lastX = Number.POSITIVE_INFINITY;
    		offscreenDrawingContext.clearRect(0, 0, width, height);
    		offscreenDrawingContext.beginPath();

    		for (let i = 0; i < samplesLength; i++) {
    			const { x, y } = getWavePointCoordsAtIndex(data, i, width, height);
    			if (x < lastX) offscreenDrawingContext.moveTo(x, y); else offscreenDrawingContext.lineTo(x, y);
    			lastX = x;
    		}

    		offscreenDrawingContext.stroke();
    		renderImage();

    		if (!continueProcessing) {
    			fadeOutImage();
    		}
    	}

    	function drawSound(data) {
    		//console.log('drawSound');
    		// draw samples
    		const { samplesX, samplesY } = data;

    		const { width, height } = offscreenCanvas;
    		const samplesLength = samplesX.length;
    		const xOffset = -1;
    		offscreenDrawingContext.clearRect(0, 0, width, height);
    		offscreenDrawingContext.beginPath();

    		for (let i = 0; i < samplesLength; i++) {
    			const mockData = {
    				xSamples: [xOffset + i / samplesLength * 2], // range -1 to 1
    				ySamples: [samplesY[i]]
    			};

    			const { x, y } = getWavePointCoordsAtIndex(mockData, 0, width, height);
    			if (i === 0) offscreenDrawingContext.moveTo(x, y); else offscreenDrawingContext.lineTo(x, y);
    		}

    		offscreenDrawingContext.stroke();
    		renderImage();
    	}

    	function renderImage() {
    		const canvasImage = new Image();
    		canvasImages.push(canvasImage);

    		if (canvasImages.length > oldWavesDisplayed) {
    			const overflow = canvasImages.length - oldWavesDisplayed;
    			canvasImages.splice(0, overflow);
    		}

    		canvasImage.onload = drawImages;
    		canvasImage.src = offscreenCanvas.toDataURL();
    	}

    	function drawImages() {
    		const { width, height } = onscreenCanvas;
    		onscreenDrawingContext.clearRect(0, 0, width, height);
    		onscreenDrawingContext.imageSmoothingEnabled = true;
    		const fadeUntil = oldWavesDisplayed / 3;

    		canvasImages.forEach((image, index) => {
    			const opacity = Math.min((index + 1) / fadeUntil, 1);
    			onscreenDrawingContext.globalAlpha = opacity.toString(10);
    			onscreenDrawingContext.drawImage(image, 0, 0, width, height);
    		});

    		onscreenDrawingContext.globalAlpha = 1;
    		doFPSTick(new Date().getTime());
    	}

    	function fadeOutImage() {
    		if (!fadeOutTimeout && canvasImages.length) {
    			fadeOutTimeout = setTimeout(
    				() => {
    					canvasImages.splice(0, 1);
    					drawImages();
    					fadeOutTimeout = null;
    					fadeOutImage();
    				},
    				frameTime
    			);
    		} else {
    			stopFPS();
    		}
    	}

    	const writable_props = ['oldWavesDisplayed', 'sampleSize', 'fps'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Oscilloscope> was created with unknown prop '${key}'`);
    	});

    	function viewcontrols_sampleSize_binding(value) {
    		sampleSize = value;
    		$$invalidate(1, sampleSize);
    	}

    	function viewcontrols_oldWavesDisplayed_binding(value) {
    		oldWavesDisplayed = value;
    		$$invalidate(0, oldWavesDisplayed);
    	}

    	function viewcontrols_fps_binding(value) {
    		fps = value;
    		$$invalidate(2, fps);
    	}

    	function fpsdisplay_doTick_binding(value) {
    		doFPSTick = value;
    		$$invalidate(5, doFPSTick);
    	}

    	function fpsdisplay_stop_binding(value) {
    		stopFPS = value;
    		$$invalidate(6, stopFPS);
    	}

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			onscreenCanvas = $$value;
    			$$invalidate(4, onscreenCanvas);
    		});
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasContainer = $$value;
    			$$invalidate(3, canvasContainer);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('oldWavesDisplayed' in $$props) $$invalidate(0, oldWavesDisplayed = $$props.oldWavesDisplayed);
    		if ('sampleSize' in $$props) $$invalidate(1, sampleSize = $$props.sampleSize);
    		if ('fps' in $$props) $$invalidate(2, fps = $$props.fps);
    	};

    	$$self.$capture_state = () => ({
    		renderWaveFunction,
    		renderSoundFunction,
    		drawWaveCallback,
    		drawSoundCallback,
    		onMount,
    		onDestroy,
    		ViewControls: OscilloscopeControls,
    		FPSDisplay,
    		oldWavesDisplayed,
    		sampleSize,
    		fps,
    		canvasImages,
    		canvasContainer,
    		onscreenCanvas,
    		onscreenDrawingContext,
    		offscreenCanvas,
    		offscreenDrawingContext,
    		doFPSTick,
    		stopFPS,
    		fadeOutTimeout,
    		frameTime,
    		init,
    		setCanvasSize,
    		initDrawingContext,
    		clearFadeOut,
    		drawWave,
    		drawSound,
    		getWavePointCoordsAtIndex,
    		renderImage,
    		drawImages,
    		fadeOutImage
    	});

    	$$self.$inject_state = $$props => {
    		if ('oldWavesDisplayed' in $$props) $$invalidate(0, oldWavesDisplayed = $$props.oldWavesDisplayed);
    		if ('sampleSize' in $$props) $$invalidate(1, sampleSize = $$props.sampleSize);
    		if ('fps' in $$props) $$invalidate(2, fps = $$props.fps);
    		if ('canvasContainer' in $$props) $$invalidate(3, canvasContainer = $$props.canvasContainer);
    		if ('onscreenCanvas' in $$props) $$invalidate(4, onscreenCanvas = $$props.onscreenCanvas);
    		if ('onscreenDrawingContext' in $$props) onscreenDrawingContext = $$props.onscreenDrawingContext;
    		if ('offscreenCanvas' in $$props) offscreenCanvas = $$props.offscreenCanvas;
    		if ('offscreenDrawingContext' in $$props) offscreenDrawingContext = $$props.offscreenDrawingContext;
    		if ('doFPSTick' in $$props) $$invalidate(5, doFPSTick = $$props.doFPSTick);
    		if ('stopFPS' in $$props) $$invalidate(6, stopFPS = $$props.stopFPS);
    		if ('fadeOutTimeout' in $$props) fadeOutTimeout = $$props.fadeOutTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		oldWavesDisplayed,
    		sampleSize,
    		fps,
    		canvasContainer,
    		onscreenCanvas,
    		doFPSTick,
    		stopFPS,
    		viewcontrols_sampleSize_binding,
    		viewcontrols_oldWavesDisplayed_binding,
    		viewcontrols_fps_binding,
    		fpsdisplay_doTick_binding,
    		fpsdisplay_stop_binding,
    		canvas_binding,
    		div_binding
    	];
    }

    class Oscilloscope extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			oldWavesDisplayed: 0,
    			sampleSize: 1,
    			fps: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Oscilloscope",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*oldWavesDisplayed*/ ctx[0] === undefined && !('oldWavesDisplayed' in props)) {
    			console.warn("<Oscilloscope> was created without expected prop 'oldWavesDisplayed'");
    		}

    		if (/*sampleSize*/ ctx[1] === undefined && !('sampleSize' in props)) {
    			console.warn("<Oscilloscope> was created without expected prop 'sampleSize'");
    		}

    		if (/*fps*/ ctx[2] === undefined && !('fps' in props)) {
    			console.warn("<Oscilloscope> was created without expected prop 'fps'");
    		}
    	}

    	get oldWavesDisplayed() {
    		throw new Error("<Oscilloscope>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set oldWavesDisplayed(value) {
    		throw new Error("<Oscilloscope>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sampleSize() {
    		throw new Error("<Oscilloscope>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sampleSize(value) {
    		throw new Error("<Oscilloscope>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fps() {
    		throw new Error("<Oscilloscope>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fps(value) {
    		throw new Error("<Oscilloscope>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/SoundwaveUi.svelte generated by Svelte v3.44.2 */

    const { Object: Object_1, console: console_1 } = globals;

    const file$1 = "src/pages/SoundwaveUi.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[27] = list;
    	child_ctx[28] = i;
    	return child_ctx;
    }

    // (2:0) {#if errorMessage}
    function create_if_block_3(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errorMessage*/ ctx[7]);
    			attr_dev(div, "class", "errorMsg svelte-p4iq6r");
    			add_location(div, file$1, 2, 4, 127);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMessage*/ 128) set_data_dev(t, /*errorMessage*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(2:0) {#if errorMessage}",
    		ctx
    	});

    	return block;
    }

    // (9:8) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("get input");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(9:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (7:8) {#if isInputPlaying}
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("stop input");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(7:8) {#if isInputPlaying}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("play sound");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(16:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:8) {#if isSoundPlaying}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("stop sound");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(14:8) {#if isSoundPlaying}",
    		ctx
    	});

    	return block;
    }

    // (24:0) {#if isInputPlaying}
    function create_if_block$1(ctx) {
    	let audioinput;
    	let updating_useEchoCancellation;
    	let updating_useNoiseSuppression;
    	let current;

    	function audioinput_useEchoCancellation_binding(value) {
    		/*audioinput_useEchoCancellation_binding*/ ctx[17](value);
    	}

    	function audioinput_useNoiseSuppression_binding(value) {
    		/*audioinput_useNoiseSuppression_binding*/ ctx[18](value);
    	}

    	let audioinput_props = {
    		removeHandler: /*stopAudioInput*/ ctx[10]
    	};

    	if (/*useEchoCancellation*/ ctx[1] !== void 0) {
    		audioinput_props.useEchoCancellation = /*useEchoCancellation*/ ctx[1];
    	}

    	if (/*useNoiseSuppression*/ ctx[2] !== void 0) {
    		audioinput_props.useNoiseSuppression = /*useNoiseSuppression*/ ctx[2];
    	}

    	audioinput = new AudioInput({ props: audioinput_props, $$inline: true });
    	binding_callbacks.push(() => bind(audioinput, 'useEchoCancellation', audioinput_useEchoCancellation_binding));
    	binding_callbacks.push(() => bind(audioinput, 'useNoiseSuppression', audioinput_useNoiseSuppression_binding));

    	const block = {
    		c: function create() {
    			create_component(audioinput.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(audioinput, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const audioinput_changes = {};

    			if (!updating_useEchoCancellation && dirty & /*useEchoCancellation*/ 2) {
    				updating_useEchoCancellation = true;
    				audioinput_changes.useEchoCancellation = /*useEchoCancellation*/ ctx[1];
    				add_flush_callback(() => updating_useEchoCancellation = false);
    			}

    			if (!updating_useNoiseSuppression && dirty & /*useNoiseSuppression*/ 4) {
    				updating_useNoiseSuppression = true;
    				audioinput_changes.useNoiseSuppression = /*useNoiseSuppression*/ ctx[2];
    				add_flush_callback(() => updating_useNoiseSuppression = false);
    			}

    			audioinput.$set(audioinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(audioinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(audioinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(audioinput, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(24:0) {#if isInputPlaying}",
    		ctx
    	});

    	return block;
    }

    // (27:0) {#each sounds as sound}
    function create_each_block(ctx) {
    	let soundwavecontrols;
    	let updating_sound;
    	let current;

    	function func() {
    		return /*func*/ ctx[19](/*sound*/ ctx[26]);
    	}

    	function soundwavecontrols_sound_binding(value) {
    		/*soundwavecontrols_sound_binding*/ ctx[20](value, /*sound*/ ctx[26], /*each_value*/ ctx[27], /*sound_index*/ ctx[28]);
    	}

    	let soundwavecontrols_props = { removeHandler: func };

    	if (/*sound*/ ctx[26] !== void 0) {
    		soundwavecontrols_props.sound = /*sound*/ ctx[26];
    	}

    	soundwavecontrols = new SoundwaveControls({
    			props: soundwavecontrols_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(soundwavecontrols, 'sound', soundwavecontrols_sound_binding));

    	const block = {
    		c: function create() {
    			create_component(soundwavecontrols.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(soundwavecontrols, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const soundwavecontrols_changes = {};
    			if (dirty & /*sounds*/ 256) soundwavecontrols_changes.removeHandler = func;

    			if (!updating_sound && dirty & /*sounds*/ 256) {
    				updating_sound = true;
    				soundwavecontrols_changes.sound = /*sound*/ ctx[26];
    				add_flush_callback(() => updating_sound = false);
    			}

    			soundwavecontrols.$set(soundwavecontrols_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(soundwavecontrols.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(soundwavecontrols.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(soundwavecontrols, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:0) {#each sounds as sound}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let oscilloscope;
    	let updating_sampleSize;
    	let updating_oldWavesDisplayed;
    	let updating_fps;
    	let t0;
    	let t1;
    	let div;
    	let button0;
    	let t2;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let t6;
    	let each_1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function oscilloscope_sampleSize_binding(value) {
    		/*oscilloscope_sampleSize_binding*/ ctx[14](value);
    	}

    	function oscilloscope_oldWavesDisplayed_binding(value) {
    		/*oscilloscope_oldWavesDisplayed_binding*/ ctx[15](value);
    	}

    	function oscilloscope_fps_binding(value) {
    		/*oscilloscope_fps_binding*/ ctx[16](value);
    	}

    	let oscilloscope_props = {};

    	if (/*sampleSize*/ ctx[3] !== void 0) {
    		oscilloscope_props.sampleSize = /*sampleSize*/ ctx[3];
    	}

    	if (/*oldWavesDisplayed*/ ctx[6] !== void 0) {
    		oscilloscope_props.oldWavesDisplayed = /*oldWavesDisplayed*/ ctx[6];
    	}

    	if (/*fps*/ ctx[4] !== void 0) {
    		oscilloscope_props.fps = /*fps*/ ctx[4];
    	}

    	oscilloscope = new Oscilloscope({
    			props: oscilloscope_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(oscilloscope, 'sampleSize', oscilloscope_sampleSize_binding));
    	binding_callbacks.push(() => bind(oscilloscope, 'oldWavesDisplayed', oscilloscope_oldWavesDisplayed_binding));
    	binding_callbacks.push(() => bind(oscilloscope, 'fps', oscilloscope_fps_binding));
    	let if_block0 = /*errorMessage*/ ctx[7] && create_if_block_3(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*isInputPlaying*/ ctx[5]) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*isSoundPlaying*/ ctx[0]) return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block2 = current_block_type_1(ctx);
    	let if_block3 = /*isInputPlaying*/ ctx[5] && create_if_block$1(ctx);
    	let each_value = /*sounds*/ ctx[8];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			create_component(oscilloscope.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div = element("div");
    			button0 = element("button");
    			if_block1.c();
    			t2 = space();
    			button1 = element("button");
    			if_block2.c();
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "add a sound";
    			t5 = space();
    			if (if_block3) if_block3.c();
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(button0, "class", "svelte-p4iq6r");
    			add_location(button0, file$1, 5, 4, 186);
    			attr_dev(button1, "class", "svelte-p4iq6r");
    			add_location(button1, file$1, 12, 4, 345);
    			attr_dev(button2, "class", "svelte-p4iq6r");
    			add_location(button2, file$1, 19, 4, 500);
    			add_location(div, file$1, 4, 0, 176);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(oscilloscope, target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			if_block1.m(button0, null);
    			append_dev(div, t2);
    			append_dev(div, button1);
    			if_block2.m(button1, null);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			insert_dev(target, t5, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t6, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*toggleAudioInput*/ ctx[9], false, false, false),
    					listen_dev(button1, "click", /*toggleSound*/ ctx[11], false, false, false),
    					listen_dev(button2, "click", /*addSound*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const oscilloscope_changes = {};

    			if (!updating_sampleSize && dirty & /*sampleSize*/ 8) {
    				updating_sampleSize = true;
    				oscilloscope_changes.sampleSize = /*sampleSize*/ ctx[3];
    				add_flush_callback(() => updating_sampleSize = false);
    			}

    			if (!updating_oldWavesDisplayed && dirty & /*oldWavesDisplayed*/ 64) {
    				updating_oldWavesDisplayed = true;
    				oscilloscope_changes.oldWavesDisplayed = /*oldWavesDisplayed*/ ctx[6];
    				add_flush_callback(() => updating_oldWavesDisplayed = false);
    			}

    			if (!updating_fps && dirty & /*fps*/ 16) {
    				updating_fps = true;
    				oscilloscope_changes.fps = /*fps*/ ctx[4];
    				add_flush_callback(() => updating_fps = false);
    			}

    			oscilloscope.$set(oscilloscope_changes);

    			if (/*errorMessage*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(t1.parentNode, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button0, null);
    				}
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(button1, null);
    				}
    			}

    			if (/*isInputPlaying*/ ctx[5]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*isInputPlaying*/ 32) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t6.parentNode, t6);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*removeSound, sounds*/ 8448) {
    				each_value = /*sounds*/ ctx[8];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(oscilloscope.$$.fragment, local);
    			transition_in(if_block3);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(oscilloscope.$$.fragment, local);
    			transition_out(if_block3);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(oscilloscope, detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if_block1.d();
    			if_block2.d();
    			if (detaching) detach_dev(t5);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t6);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('SoundwaveUi', slots, []);
    	let isSoundPlaying = false;
    	let isInputPlaying = false;
    	let useEchoCancellation = false;
    	let useNoiseSuppression = true;
    	let sampleSize = 0.1;
    	let fps = 60;
    	let oldWavesDisplayed = 10;
    	let errorMessage = null;
    	let sounds = [];

    	onMount(() => {
    		init(drawWaveCallback, drawSoundCallback, errorCallback);
    		$$invalidate(8, sounds = sounds.concat(new Sound()));
    	});

    	//
    	function toggleAudioInput() {
    		$$invalidate(7, errorMessage = null);

    		if (isInputPlaying) {
    			stopAudioInput();
    		} else {
    			startAudioInput();
    		}
    	}

    	function startAudioInput() {
    		startUserAudio(useEchoCancellation, useNoiseSuppression).then(() => {
    			$$invalidate(5, isInputPlaying = true);
    		}).catch(error => {
    			console.error('cannot get user audio', { error });
    			$$invalidate(7, errorMessage = 'cannot get audio input');
    			$$invalidate(5, isInputPlaying = false);
    		});
    	}

    	function stopAudioInput() {
    		stopUserAudio();
    		$$invalidate(5, isInputPlaying = false);
    	}

    	function updateAudioInput() {
    		if (isInputPlaying) {
    			startAudioInput();
    		}
    	}

    	function toggleSound() {
    		$$invalidate(7, errorMessage = null);
    		$$invalidate(0, isSoundPlaying = !isSoundPlaying);
    	}

    	function startSound$1() {
    		startSound();
    		setProcessorSweepTime(sampleSize);
    		setProcessorFps(fps);
    		sounds.forEach(sound => sound.play());
    	}

    	function stopSound$1() {
    		sounds.forEach(sound => sound.stop());
    		$$invalidate(0, isSoundPlaying = false);

    		//TODO: find a timeout without magic number - it seems to be not the sound's release
    		//const timeout = Math.max(soundWave.release * 1000, drawInterval);
    		const timeout = 600;

    		setTimeout(
    			() => {
    				if (!isSoundPlaying) {
    					stopSound();
    				}
    			},
    			timeout
    		);
    	}

    	function addSound() {
    		const sound = new Sound();
    		$$invalidate(8, sounds = sounds.concat(sound));

    		if (isSoundPlaying) {
    			sounds.forEach(sound => sound.stop());
    			sounds.forEach(sound => sound.play());
    		}
    	}

    	function removeSound(sound) {
    		const index = sounds.indexOf(sound);

    		if (index > -1) {
    			const { [index]: removedSound, ...remainingSounds } = sounds;
    			removedSound.remove();
    			$$invalidate(8, sounds = Object.values(remainingSounds));
    		}
    	}

    	function errorCallback(errorType) {
    		let message = 'an error occurred.';

    		switch (errorType) {
    			case 'process':
    				{
    					message = 'cannot get audio data. please check your audio system - is your audio used by another app?';
    					break;
    				}
    		}

    		$$invalidate(7, errorMessage = message);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<SoundwaveUi> was created with unknown prop '${key}'`);
    	});

    	function oscilloscope_sampleSize_binding(value) {
    		sampleSize = value;
    		$$invalidate(3, sampleSize);
    	}

    	function oscilloscope_oldWavesDisplayed_binding(value) {
    		oldWavesDisplayed = value;
    		$$invalidate(6, oldWavesDisplayed);
    	}

    	function oscilloscope_fps_binding(value) {
    		fps = value;
    		$$invalidate(4, fps);
    	}

    	function audioinput_useEchoCancellation_binding(value) {
    		useEchoCancellation = value;
    		$$invalidate(1, useEchoCancellation);
    	}

    	function audioinput_useNoiseSuppression_binding(value) {
    		useNoiseSuppression = value;
    		$$invalidate(2, useNoiseSuppression);
    	}

    	const func = sound => removeSound(sound);

    	function soundwavecontrols_sound_binding(value, sound, each_value, sound_index) {
    		each_value[sound_index] = value;
    		$$invalidate(8, sounds);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		AudioInput,
    		SoundwaveControls,
    		Sound,
    		Oscilloscope,
    		drawWaveCallback,
    		drawSoundCallback,
    		initSoundsystem: init,
    		startPlayingSound: startSound,
    		stopPlayingSound: stopSound,
    		startUserAudio,
    		stopUserAudio,
    		setProcessorFps,
    		setProcessorSweepTime,
    		isSoundPlaying,
    		isInputPlaying,
    		useEchoCancellation,
    		useNoiseSuppression,
    		sampleSize,
    		fps,
    		oldWavesDisplayed,
    		errorMessage,
    		sounds,
    		toggleAudioInput,
    		startAudioInput,
    		stopAudioInput,
    		updateAudioInput,
    		toggleSound,
    		startSound: startSound$1,
    		stopSound: stopSound$1,
    		addSound,
    		removeSound,
    		errorCallback
    	});

    	$$self.$inject_state = $$props => {
    		if ('isSoundPlaying' in $$props) $$invalidate(0, isSoundPlaying = $$props.isSoundPlaying);
    		if ('isInputPlaying' in $$props) $$invalidate(5, isInputPlaying = $$props.isInputPlaying);
    		if ('useEchoCancellation' in $$props) $$invalidate(1, useEchoCancellation = $$props.useEchoCancellation);
    		if ('useNoiseSuppression' in $$props) $$invalidate(2, useNoiseSuppression = $$props.useNoiseSuppression);
    		if ('sampleSize' in $$props) $$invalidate(3, sampleSize = $$props.sampleSize);
    		if ('fps' in $$props) $$invalidate(4, fps = $$props.fps);
    		if ('oldWavesDisplayed' in $$props) $$invalidate(6, oldWavesDisplayed = $$props.oldWavesDisplayed);
    		if ('errorMessage' in $$props) $$invalidate(7, errorMessage = $$props.errorMessage);
    		if ('sounds' in $$props) $$invalidate(8, sounds = $$props.sounds);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isSoundPlaying*/ 1) {
    			// reactive stuff
    			isSoundPlaying ? startSound$1() : stopSound$1();
    		}

    		if ($$self.$$.dirty & /*sampleSize*/ 8) {
    			setProcessorSweepTime(sampleSize);
    		}

    		if ($$self.$$.dirty & /*fps*/ 16) {
    			setProcessorFps(fps);
    		}

    		if ($$self.$$.dirty & /*useEchoCancellation, useNoiseSuppression*/ 6) {
    			updateAudioInput(); // pass unused params to enable reactivity
    		}
    	};

    	return [
    		isSoundPlaying,
    		useEchoCancellation,
    		useNoiseSuppression,
    		sampleSize,
    		fps,
    		isInputPlaying,
    		oldWavesDisplayed,
    		errorMessage,
    		sounds,
    		toggleAudioInput,
    		stopAudioInput,
    		toggleSound,
    		addSound,
    		removeSound,
    		oscilloscope_sampleSize_binding,
    		oscilloscope_oldWavesDisplayed_binding,
    		oscilloscope_fps_binding,
    		audioinput_useEchoCancellation_binding,
    		audioinput_useNoiseSuppression_binding,
    		func,
    		soundwavecontrols_sound_binding
    	];
    }

    class SoundwaveUi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SoundwaveUi",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.2 */
    const file = "src/App.svelte";

    // (6:1) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "click anywhere to start";
    			add_location(div, file, 6, 2, 173);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(6:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (4:1) {#if userClicked}
    function create_if_block(ctx) {
    	let soundwaveui;
    	let current;
    	soundwaveui = new SoundwaveUi({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(soundwaveui.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(soundwaveui, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(soundwaveui.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(soundwaveui.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(soundwaveui, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(4:1) {#if userClicked}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let small;
    	let t2;
    	let t3;
    	let t4;
    	let a;
    	let t5;
    	let t6;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*userClicked*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "JS SYNTH";
    			t1 = space();
    			small = element("small");
    			t2 = text("v. ");
    			t3 = text(/*version*/ ctx[0]);
    			t4 = text(" · ");
    			a = element("a");
    			t5 = text("ARCHIVE");
    			t6 = space();
    			if_block.c();
    			attr_dev(h1, "class", "svelte-unjplg");
    			add_location(h1, file, 1, 1, 8);
    			attr_dev(a, "href", /*linkUrl*/ ctx[3]);
    			add_location(a, file, 2, 23, 49);
    			attr_dev(small, "class", "svelte-unjplg");
    			add_location(small, file, 2, 1, 27);
    			attr_dev(main, "class", "svelte-unjplg");
    			add_location(main, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, small);
    			append_dev(small, t2);
    			append_dev(small, t3);
    			append_dev(small, t4);
    			append_dev(small, a);
    			append_dev(a, t5);
    			/*a_binding*/ ctx[4](a);
    			append_dev(main, t6);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*version*/ 1) set_data_dev(t3, /*version*/ ctx[0]);
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
    			/*a_binding*/ ctx[4](null);
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
    	let { version } = $$props;
    	let userClicked = false;
    	let archiveLink;

    	const linkUrl = location.pathname.includes('/versions/')
    	? '../'
    	: './versions/';

    	window.addEventListener('pointerup', initApp);

    	function initApp(event) {
    		if (event.target !== archiveLink) {
    			window.removeEventListener('pointerup', initApp);
    			$$invalidate(1, userClicked = true);
    		}
    	}

    	const writable_props = ['version'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function a_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			archiveLink = $$value;
    			$$invalidate(2, archiveLink);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('version' in $$props) $$invalidate(0, version = $$props.version);
    	};

    	$$self.$capture_state = () => ({
    		SoundwaveUi,
    		version,
    		userClicked,
    		archiveLink,
    		linkUrl,
    		initApp
    	});

    	$$self.$inject_state = $$props => {
    		if ('version' in $$props) $$invalidate(0, version = $$props.version);
    		if ('userClicked' in $$props) $$invalidate(1, userClicked = $$props.userClicked);
    		if ('archiveLink' in $$props) $$invalidate(2, archiveLink = $$props.archiveLink);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [version, userClicked, archiveLink, linkUrl, a_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal, { version: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*version*/ ctx[0] === undefined && !('version' in props)) {
    			console.warn("<App> was created without expected prop 'version'");
    		}
    	}

    	get version() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		version: '1.6'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
