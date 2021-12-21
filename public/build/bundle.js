
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

    const file$4 = "src/components/Panel.svelte";

    // (3:8) {#if removeHandler}
    function create_if_block_1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "❌";
    			attr_dev(button, "class", "remove-button svelte-2h8in5");
    			add_location(button, file$4, 3, 12, 91);
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(3:8) {#if removeHandler}",
    		ctx
    	});

    	return block;
    }

    // (10:12) {:else}
    function create_else_block$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "↧";
    			attr_dev(span, "class", "icon svelte-2h8in5");
    			add_location(span, file$4, 10, 16, 415);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(10:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (8:12) {#if isOpen}
    function create_if_block$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "↥";
    			attr_dev(span, "class", "icon svelte-2h8in5");
    			add_location(span, file$4, 8, 16, 342);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(8:12) {#if isOpen}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let button;
    	let span;
    	let t1;
    	let t2;
    	let t3;
    	let section;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*removeHandler*/ ctx[2] && create_if_block_1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*isOpen*/ ctx[0]) return create_if_block$2;
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
    			span = element("span");
    			t1 = text(/*heading*/ ctx[1]);
    			t2 = space();
    			if_block1.c();
    			t3 = space();
    			section = element("section");
    			if (default_slot) default_slot.c();
    			attr_dev(span, "class", "heading svelte-2h8in5");
    			add_location(span, file$4, 6, 12, 262);
    			attr_dev(button, "class", "panel-button svelte-2h8in5");
    			add_location(button, file$4, 5, 8, 186);
    			attr_dev(div0, "class", "panel-header svelte-2h8in5");
    			add_location(div0, file$4, 1, 4, 24);
    			attr_dev(section, "class", "panel-content svelte-2h8in5");
    			toggle_class(section, "open-panel", /*isOpen*/ ctx[0]);
    			add_location(section, file$4, 15, 4, 506);
    			attr_dev(div1, "class", "panel");
    			add_location(div1, file$4, 0, 0, 0);
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
    			append_dev(button, span);
    			append_dev(span, t1);
    			append_dev(button, t2);
    			if_block1.m(button, null);
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
    					if_block0 = create_if_block_1(ctx);
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
    					if_block1.m(button, null);
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
    				toggle_class(section, "open-panel", /*isOpen*/ ctx[0]);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init$1(this, options, instance$6, create_fragment$6, safe_not_equal, { heading: 1, isOpen: 0, removeHandler: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Panel",
    			options,
    			id: create_fragment$6.name
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

    /* src/components/Knob.svelte generated by Svelte v3.44.2 */

    const file$3 = "src/components/Knob.svelte";

    function create_fragment$5(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let t3_value = (/*outputValue*/ ctx[3] ?? /*value*/ ctx[0]) + "";
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let div3;
    	let button0;
    	let span0;
    	let t8;
    	let button1;
    	let span1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			t5 = text(/*unit*/ ctx[2]);
    			t6 = space();
    			div3 = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			span0.textContent = "+";
    			t8 = space();
    			button1 = element("button");
    			span1 = element("span");
    			span1.textContent = "−";
    			attr_dev(div0, "class", "label svelte-1bbxrds");
    			add_location(div0, file$3, 1, 4, 32);
    			attr_dev(div1, "class", "knob center svelte-1bbxrds");
    			set_style(div1, "--rotation", /*rotation*/ ctx[4]);
    			add_location(div1, file$3, 2, 4, 69);
    			attr_dev(div2, "class", "label svelte-1bbxrds");
    			add_location(div2, file$3, 3, 4, 165);
    			attr_dev(span0, "class", "icon");
    			add_location(span0, file$3, 5, 66, 324);
    			attr_dev(button0, "class", "stepButton svelte-1bbxrds");
    			add_location(button0, file$3, 5, 8, 266);
    			attr_dev(span1, "class", "icon");
    			add_location(span1, file$3, 6, 68, 434);
    			attr_dev(button1, "class", "stepButton svelte-1bbxrds");
    			add_location(button1, file$3, 6, 8, 374);
    			attr_dev(div3, "class", "stepButtonContainer svelte-1bbxrds");
    			add_location(div3, file$3, 4, 4, 224);
    			attr_dev(div4, "class", "knobContainer svelte-1bbxrds");
    			add_location(div4, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, t0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div2, t3);
    			append_dev(div2, t4);
    			append_dev(div2, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			append_dev(div3, button0);
    			append_dev(button0, span0);
    			append_dev(div3, t8);
    			append_dev(div3, button1);
    			append_dev(button1, span1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "pointerdown", /*knobClicked*/ ctx[5], false, false, false),
    					listen_dev(button0, "pointerdown", /*stepUpClicked*/ ctx[6], false, false, false),
    					listen_dev(button1, "pointerdown", /*stepDownClicked*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (dirty & /*rotation*/ 16) {
    				set_style(div1, "--rotation", /*rotation*/ ctx[4]);
    			}

    			if (dirty & /*outputValue, value*/ 9 && t3_value !== (t3_value = (/*outputValue*/ ctx[3] ?? /*value*/ ctx[0]) + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*unit*/ 4) set_data_dev(t5, /*unit*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
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

    function clamp(num, min, max) {
    	return Math.round(Math.max(min, Math.min(num, max)));
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    	let startY, startValue, stepButtonDown, stepButtonTimeout;

    	function knobClicked({ clientY }) {
    		startY = clientY;
    		startValue = value;
    		window.addEventListener('pointermove', knobMoved);
    		window.addEventListener('pointerup', knobReleased);
    	}

    	function knobMoved({ clientY }) {
    		const valueDiff = valueRange * (clientY - startY) / pixelRange;
    		$$invalidate(0, value = clamp(startValue - valueDiff, min, max));
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
    			$$invalidate(0, value = value + 1);
    			stepButtonTimeout = setTimeout(stepUp, 300);
    		}
    	}

    	function stepDown() {
    		if (stepButtonDown && value > min) {
    			$$invalidate(0, value = value - 1);
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
    		'outputValue'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Knob> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(8, min = $$props.min);
    		if ('max' in $$props) $$invalidate(9, max = $$props.max);
    		if ('rotRange' in $$props) $$invalidate(10, rotRange = $$props.rotRange);
    		if ('pixelRange' in $$props) $$invalidate(11, pixelRange = $$props.pixelRange);
    		if ('startRotation' in $$props) $$invalidate(12, startRotation = $$props.startRotation);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('outputValue' in $$props) $$invalidate(3, outputValue = $$props.outputValue);
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
    		startY,
    		startValue,
    		stepButtonDown,
    		stepButtonTimeout,
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
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('min' in $$props) $$invalidate(8, min = $$props.min);
    		if ('max' in $$props) $$invalidate(9, max = $$props.max);
    		if ('rotRange' in $$props) $$invalidate(10, rotRange = $$props.rotRange);
    		if ('pixelRange' in $$props) $$invalidate(11, pixelRange = $$props.pixelRange);
    		if ('startRotation' in $$props) $$invalidate(12, startRotation = $$props.startRotation);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('unit' in $$props) $$invalidate(2, unit = $$props.unit);
    		if ('outputValue' in $$props) $$invalidate(3, outputValue = $$props.outputValue);
    		if ('startY' in $$props) startY = $$props.startY;
    		if ('startValue' in $$props) startValue = $$props.startValue;
    		if ('stepButtonDown' in $$props) stepButtonDown = $$props.stepButtonDown;
    		if ('stepButtonTimeout' in $$props) stepButtonTimeout = $$props.stepButtonTimeout;
    		if ('valueRange' in $$props) $$invalidate(13, valueRange = $$props.valueRange);
    		if ('rotation' in $$props) $$invalidate(4, rotation = $$props.rotation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*max, min*/ 768) {
    			$$invalidate(13, valueRange = max - min);
    		}

    		if ($$self.$$.dirty & /*startRotation, value, min, valueRange, rotRange*/ 13569) {
    			$$invalidate(4, rotation = startRotation + (value - min) / valueRange * rotRange);
    		}
    	};

    	return [
    		value,
    		title,
    		unit,
    		outputValue,
    		rotation,
    		knobClicked,
    		stepUpClicked,
    		stepDownClicked,
    		min,
    		max,
    		rotRange,
    		pixelRange,
    		startRotation,
    		valueRange
    	];
    }

    class Knob extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			value: 0,
    			min: 8,
    			max: 9,
    			rotRange: 10,
    			pixelRange: 11,
    			startRotation: 12,
    			title: 1,
    			unit: 2,
    			outputValue: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Knob",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !('value' in props)) {
    			console.warn("<Knob> was created without expected prop 'value'");
    		}

    		if (/*min*/ ctx[8] === undefined && !('min' in props)) {
    			console.warn("<Knob> was created without expected prop 'min'");
    		}

    		if (/*max*/ ctx[9] === undefined && !('max' in props)) {
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
    let processor;

    let waveDataCallback;
    let processorOptions;

    async function init(drawCallback) {
        waveDataCallback = drawCallback;

        audioContext = Pizzicato_min.context;
        limiter = new Pizzicato_min.Effects.Compressor();
        preGain = audioContext.createGain();

        processorOptions = {
            mainGain: Pizzicato_min.masterGainNode.gain.value,
            sampleRate: audioContext.sampleRate,
        };
        await audioContext.audioWorklet.addModule('utils/SoundwaveProcessor.js');
    }

    function createProcessor() {
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
            default: {
                console.warn('unknown processor message', message);
                break;
            }
        }
    }

    function createSound(type, frequency) {
        const sound = new Pizzicato_min.Sound({
            source: 'wave',
            options: {
                type,
                frequency,
                detached: true,
            }
        });

        sound.masterVolume.connect(preGain);

        return sound;
    }

    function removeSound(sound) {
        if (sound) {
            sound.off();
            sound.stop();
            sound.disconnect();
        }
    }

    async function startSoundProcessor() {
        console.log('startSoundProcessor');

        processor = createProcessor();

        preGain.connect(limiter);
        limiter.connect(processor);
        processor.connect(Pizzicato_min.masterGainNode);
    }

    function stopSoundProcessor() {
        console.log('stopSoundProcessor');
        if (processor) {
            processorMessage('stop');
            limiter.disconnect(processor);
            processor.disconnect(Pizzicato_min.masterGainNode);
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

    /* src/modules/SoundwaveControls.svelte generated by Svelte v3.44.2 */

    // (1:0) <Panel heading="SOUNDWAVE" isOpen={true} removeHandler={() => removeHandler(sound)}>
    function create_default_slot$1(ctx) {
    	let knob0;
    	let updating_value;
    	let t;
    	let knob1;
    	let updating_value_1;
    	let current;

    	function knob0_value_binding(value) {
    		/*knob0_value_binding*/ ctx[5](value);
    	}

    	let knob0_props = {
    		title: "WAVE TYPE",
    		outputValue: /*waveType*/ ctx[4],
    		max: 4,
    		min: 1,
    		pixelRange: 200
    	};

    	if (/*waveTypeStep*/ ctx[3] !== void 0) {
    		knob0_props.value = /*waveTypeStep*/ ctx[3];
    	}

    	knob0 = new Knob({ props: knob0_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob0, 'value', knob0_value_binding));

    	function knob1_value_binding(value) {
    		/*knob1_value_binding*/ ctx[6](value);
    	}

    	let knob1_props = {
    		title: "FREQUENCY",
    		unit: "Hz",
    		max: 5000,
    		min: 60,
    		pixelRange: 200
    	};

    	if (/*frequency*/ ctx[2] !== void 0) {
    		knob1_props.value = /*frequency*/ ctx[2];
    	}

    	knob1 = new Knob({ props: knob1_props, $$inline: true });
    	binding_callbacks.push(() => bind(knob1, 'value', knob1_value_binding));

    	const block = {
    		c: function create() {
    			create_component(knob0.$$.fragment);
    			t = space();
    			create_component(knob1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(knob0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(knob1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const knob0_changes = {};
    			if (dirty & /*waveType*/ 16) knob0_changes.outputValue = /*waveType*/ ctx[4];

    			if (!updating_value && dirty & /*waveTypeStep*/ 8) {
    				updating_value = true;
    				knob0_changes.value = /*waveTypeStep*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			knob0.$set(knob0_changes);
    			const knob1_changes = {};

    			if (!updating_value_1 && dirty & /*frequency*/ 4) {
    				updating_value_1 = true;
    				knob1_changes.value = /*frequency*/ ctx[2];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			knob1.$set(knob1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(knob0.$$.fragment, local);
    			transition_in(knob1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(knob0.$$.fragment, local);
    			transition_out(knob1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(knob0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(knob1, detaching);
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

    function create_fragment$4(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				heading: "SOUNDWAVE",
    				isOpen: true,
    				removeHandler: /*func*/ ctx[7],
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
    			if (dirty & /*removeHandler, sound*/ 3) panel_changes.removeHandler = /*func*/ ctx[7];

    			if (dirty & /*$$scope, frequency, waveType, waveTypeStep*/ 1052) {
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
    	validate_slots('SoundwaveControls', slots, []);
    	let { sound } = $$props;
    	let { removeHandler } = $$props;
    	let frequency = 80;
    	let waveTypeStep = 1;
    	let waveType;
    	const WAVE_TYPES = ['sine', 'triangle', 'sawtooth', 'square'];
    	initSoundWave();

    	function initSoundWave() {
    		const { soundwave, isPlaying } = sound;
    		removeSound(soundwave);
    		$$invalidate(0, sound.soundwave = createSound(waveType, frequency), sound);

    		/*
    soundWave.on('play', () => {
        isSoundPlaying = true;
        doDrawing = true;
    });

    soundWave.on('stop', () => {
        isSoundPlaying = false;
        //TODO: find a timeout without magic number - it seems to be not the sound's release
        //const timeout = Math.max(soundWave.release * 1000, drawInterval);
        const timeout = 600;
        setTimeout(() => {
            doDrawing = isSoundPlaying;
        }, timeout);
    });
    */
    		if (isPlaying) {
    			sound.soundwave.play();
    		}
    	}

    	const writable_props = ['sound', 'removeHandler'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SoundwaveControls> was created with unknown prop '${key}'`);
    	});

    	function knob0_value_binding(value) {
    		waveTypeStep = value;
    		$$invalidate(3, waveTypeStep);
    	}

    	function knob1_value_binding(value) {
    		frequency = value;
    		$$invalidate(2, frequency);
    	}

    	const func = () => removeHandler(sound);

    	$$self.$$set = $$props => {
    		if ('sound' in $$props) $$invalidate(0, sound = $$props.sound);
    		if ('removeHandler' in $$props) $$invalidate(1, removeHandler = $$props.removeHandler);
    	};

    	$$self.$capture_state = () => ({
    		Panel,
    		Knob,
    		createSound,
    		removeSound,
    		sound,
    		removeHandler,
    		frequency,
    		waveTypeStep,
    		waveType,
    		WAVE_TYPES,
    		initSoundWave
    	});

    	$$self.$inject_state = $$props => {
    		if ('sound' in $$props) $$invalidate(0, sound = $$props.sound);
    		if ('removeHandler' in $$props) $$invalidate(1, removeHandler = $$props.removeHandler);
    		if ('frequency' in $$props) $$invalidate(2, frequency = $$props.frequency);
    		if ('waveTypeStep' in $$props) $$invalidate(3, waveTypeStep = $$props.waveTypeStep);
    		if ('waveType' in $$props) $$invalidate(4, waveType = $$props.waveType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*frequency*/ 4) {
    			$$invalidate(0, sound.soundwave.frequency = frequency, sound);
    		}

    		if ($$self.$$.dirty & /*waveTypeStep*/ 8) {
    			{
    				$$invalidate(4, waveType = WAVE_TYPES[waveTypeStep - 1]);
    				initSoundWave();
    			}
    		}
    	};

    	return [
    		sound,
    		removeHandler,
    		frequency,
    		waveTypeStep,
    		waveType,
    		knob0_value_binding,
    		knob1_value_binding,
    		func
    	];
    }

    class SoundwaveControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$4, create_fragment$4, safe_not_equal, { sound: 0, removeHandler: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SoundwaveControls",
    			options,
    			id: create_fragment$4.name
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

    /* src/modules/ViewControls.svelte generated by Svelte v3.44.2 */

    // (1:0) <Panel heading="VIEW PARAMETERS" isOpen={true}>
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
    		source: "(1:0) <Panel heading=\\\"VIEW PARAMETERS\\\" isOpen={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				heading: "VIEW PARAMETERS",
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ViewControls', slots, []);
    	let { sampleSize } = $$props;
    	let { fps = 60 } = $$props;
    	let { oldWavesDisplayed = 10 } = $$props;
    	let sampleSizeStep = 15;
    	const writable_props = ['sampleSize', 'fps', 'oldWavesDisplayed'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ViewControls> was created with unknown prop '${key}'`);
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

    class ViewControls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init$1(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			sampleSize: 3,
    			fps: 0,
    			oldWavesDisplayed: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ViewControls",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sampleSize*/ ctx[3] === undefined && !('sampleSize' in props)) {
    			console.warn("<ViewControls> was created without expected prop 'sampleSize'");
    		}
    	}

    	get sampleSize() {
    		throw new Error("<ViewControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sampleSize(value) {
    		throw new Error("<ViewControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fps() {
    		throw new Error("<ViewControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fps(value) {
    		throw new Error("<ViewControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get oldWavesDisplayed() {
    		throw new Error("<ViewControls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set oldWavesDisplayed(value) {
    		throw new Error("<ViewControls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class Sound {
        constructor() {
            this.soundwave = null;
            this.isPlaying = false;
        }

        play() {
            this.isPlaying = true;
            if (this.soundwave) {
                this.soundwave.play();
            }
        }

        stop() {
            this.isPlaying = false;
            if (this.soundwave) {
                this.soundwave.stop();
            }
        }

        remove() {
            removeSound(this.soundwave);
        }
    }

    /* src/modules/Oscilloscope.svelte generated by Svelte v3.44.2 */

    const { console: console_1 } = globals;
    const file$2 = "src/modules/Oscilloscope.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let canvas;

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas = element("canvas");
    			attr_dev(canvas, "class", "canvas svelte-qlemw4");
    			add_location(canvas, file$2, 1, 4, 69);
    			attr_dev(div, "class", "canvasContainer center svelte-qlemw4");
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas);
    			/*canvas_binding*/ ctx[3](canvas);
    			/*div_binding*/ ctx[4](div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*canvas_binding*/ ctx[3](null);
    			/*div_binding*/ ctx[4](null);
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

    let renderFunction;

    function drawCallback(data) {
    	renderFunction(data);
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
    		x: xOffset + xSamples[index] * canvasWidth,
    		y: yOffset + (0.5 + ySamples[index] / 2) * height
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Oscilloscope', slots, []);
    	let { oldWavesDisplayed } = $$props;
    	const canvasImages = [];
    	let canvasContainer;
    	let onscreenCanvas;
    	let onscreenDrawingContext;
    	let offscreenCanvas;
    	let offscreenDrawingContext;
    	let fadeOutTimeout = null;
    	const frameTime = 1 / 60 * 1000;

    	onMount(() => {
    		init();
    	});

    	function init() {
    		setCanvasSize(onscreenCanvas);
    		onscreenDrawingContext = initDrawingContext(onscreenCanvas);
    		offscreenCanvas = document.createElement('canvas');
    		setCanvasSize(offscreenCanvas);
    		offscreenDrawingContext = initDrawingContext(offscreenCanvas);
    		renderFunction = draw;
    	}

    	function setCanvasSize(canvas) {
    		canvas.width = canvasContainer.clientWidth;
    		canvas.height = canvas.width * 0.33;
    	}

    	function draw(data) {
    		//console.log('draw');
    		// stop fade out
    		if (fadeOutTimeout) {
    			clearTimeout(fadeOutTimeout);
    			fadeOutTimeout = null;
    		}

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
    	}

    	function fadeOutImage() {
    		console.log('fadeOutImage', fadeOutTimeout);

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
    		}
    	}

    	const writable_props = ['oldWavesDisplayed'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Oscilloscope> was created with unknown prop '${key}'`);
    	});

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			onscreenCanvas = $$value;
    			$$invalidate(1, onscreenCanvas);
    		});
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasContainer = $$value;
    			$$invalidate(0, canvasContainer);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('oldWavesDisplayed' in $$props) $$invalidate(2, oldWavesDisplayed = $$props.oldWavesDisplayed);
    	};

    	$$self.$capture_state = () => ({
    		renderFunction,
    		drawCallback,
    		onMount,
    		oldWavesDisplayed,
    		canvasImages,
    		canvasContainer,
    		onscreenCanvas,
    		onscreenDrawingContext,
    		offscreenCanvas,
    		offscreenDrawingContext,
    		fadeOutTimeout,
    		frameTime,
    		init,
    		setCanvasSize,
    		initDrawingContext,
    		draw,
    		getWavePointCoordsAtIndex,
    		renderImage,
    		drawImages,
    		fadeOutImage
    	});

    	$$self.$inject_state = $$props => {
    		if ('oldWavesDisplayed' in $$props) $$invalidate(2, oldWavesDisplayed = $$props.oldWavesDisplayed);
    		if ('canvasContainer' in $$props) $$invalidate(0, canvasContainer = $$props.canvasContainer);
    		if ('onscreenCanvas' in $$props) $$invalidate(1, onscreenCanvas = $$props.onscreenCanvas);
    		if ('onscreenDrawingContext' in $$props) onscreenDrawingContext = $$props.onscreenDrawingContext;
    		if ('offscreenCanvas' in $$props) offscreenCanvas = $$props.offscreenCanvas;
    		if ('offscreenDrawingContext' in $$props) offscreenDrawingContext = $$props.offscreenDrawingContext;
    		if ('fadeOutTimeout' in $$props) fadeOutTimeout = $$props.fadeOutTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		canvasContainer,
    		onscreenCanvas,
    		oldWavesDisplayed,
    		canvas_binding,
    		div_binding
    	];
    }

    class Oscilloscope extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance$2, create_fragment$2, safe_not_equal, { oldWavesDisplayed: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Oscilloscope",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*oldWavesDisplayed*/ ctx[2] === undefined && !('oldWavesDisplayed' in props)) {
    			console_1.warn("<Oscilloscope> was created without expected prop 'oldWavesDisplayed'");
    		}
    	}

    	get oldWavesDisplayed() {
    		throw new Error("<Oscilloscope>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set oldWavesDisplayed(value) {
    		throw new Error("<Oscilloscope>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/SoundwaveUi.svelte generated by Svelte v3.44.2 */

    const { Object: Object_1 } = globals;

    const file$1 = "src/pages/SoundwaveUi.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[18] = list;
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (6:4) {:else}
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
    		source: "(6:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (4:4) {#if isSoundPlaying}
    function create_if_block$1(ctx) {
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(4:4) {#if isSoundPlaying}",
    		ctx
    	});

    	return block;
    }

    // (13:0) {#each sounds as sound}
    function create_each_block(ctx) {
    	let soundwavecontrols;
    	let updating_sound;
    	let current;

    	function func() {
    		return /*func*/ ctx[13](/*sound*/ ctx[17]);
    	}

    	function soundwavecontrols_sound_binding(value) {
    		/*soundwavecontrols_sound_binding*/ ctx[14](value, /*sound*/ ctx[17], /*each_value*/ ctx[18], /*sound_index*/ ctx[19]);
    	}

    	let soundwavecontrols_props = { removeHandler: func };

    	if (/*sound*/ ctx[17] !== void 0) {
    		soundwavecontrols_props.sound = /*sound*/ ctx[17];
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
    			if (dirty & /*sounds*/ 32) soundwavecontrols_changes.removeHandler = func;

    			if (!updating_sound && dirty & /*sounds*/ 32) {
    				updating_sound = true;
    				soundwavecontrols_changes.sound = /*sound*/ ctx[17];
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
    		source: "(13:0) {#each sounds as sound}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let viewcontrols;
    	let updating_sampleSize;
    	let updating_oldWavesDisplayed;
    	let updating_fps;
    	let t0;
    	let oscilloscope_1;
    	let t1;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let each_1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function viewcontrols_sampleSize_binding(value) {
    		/*viewcontrols_sampleSize_binding*/ ctx[8](value);
    	}

    	function viewcontrols_oldWavesDisplayed_binding(value) {
    		/*viewcontrols_oldWavesDisplayed_binding*/ ctx[9](value);
    	}

    	function viewcontrols_fps_binding(value) {
    		/*viewcontrols_fps_binding*/ ctx[10](value);
    	}

    	let viewcontrols_props = {};

    	if (/*sampleSize*/ ctx[1] !== void 0) {
    		viewcontrols_props.sampleSize = /*sampleSize*/ ctx[1];
    	}

    	if (/*oldWavesDisplayed*/ ctx[3] !== void 0) {
    		viewcontrols_props.oldWavesDisplayed = /*oldWavesDisplayed*/ ctx[3];
    	}

    	if (/*fps*/ ctx[2] !== void 0) {
    		viewcontrols_props.fps = /*fps*/ ctx[2];
    	}

    	viewcontrols = new ViewControls({
    			props: viewcontrols_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(viewcontrols, 'sampleSize', viewcontrols_sampleSize_binding));
    	binding_callbacks.push(() => bind(viewcontrols, 'oldWavesDisplayed', viewcontrols_oldWavesDisplayed_binding));
    	binding_callbacks.push(() => bind(viewcontrols, 'fps', viewcontrols_fps_binding));

    	let oscilloscope_1_props = {
    		oldWavesDisplayed: /*oldWavesDisplayed*/ ctx[3]
    	};

    	oscilloscope_1 = new Oscilloscope({
    			props: oscilloscope_1_props,
    			$$inline: true
    		});

    	/*oscilloscope_1_binding*/ ctx[11](oscilloscope_1);

    	function select_block_type(ctx, dirty) {
    		if (/*isSoundPlaying*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value = /*sounds*/ ctx[5];
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
    			create_component(viewcontrols.$$.fragment);
    			t0 = space();
    			create_component(oscilloscope_1.$$.fragment);
    			t1 = space();
    			button0 = element("button");
    			if_block.c();
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "add a sound";
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(button0, file$1, 2, 0, 166);
    			add_location(button1, file$1, 9, 0, 320);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(viewcontrols, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(oscilloscope_1, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button0, anchor);
    			if_block.m(button0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*addSound*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const viewcontrols_changes = {};

    			if (!updating_sampleSize && dirty & /*sampleSize*/ 2) {
    				updating_sampleSize = true;
    				viewcontrols_changes.sampleSize = /*sampleSize*/ ctx[1];
    				add_flush_callback(() => updating_sampleSize = false);
    			}

    			if (!updating_oldWavesDisplayed && dirty & /*oldWavesDisplayed*/ 8) {
    				updating_oldWavesDisplayed = true;
    				viewcontrols_changes.oldWavesDisplayed = /*oldWavesDisplayed*/ ctx[3];
    				add_flush_callback(() => updating_oldWavesDisplayed = false);
    			}

    			if (!updating_fps && dirty & /*fps*/ 4) {
    				updating_fps = true;
    				viewcontrols_changes.fps = /*fps*/ ctx[2];
    				add_flush_callback(() => updating_fps = false);
    			}

    			viewcontrols.$set(viewcontrols_changes);
    			const oscilloscope_1_changes = {};
    			if (dirty & /*oldWavesDisplayed*/ 8) oscilloscope_1_changes.oldWavesDisplayed = /*oldWavesDisplayed*/ ctx[3];
    			oscilloscope_1.$set(oscilloscope_1_changes);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(button0, null);
    				}
    			}

    			if (dirty & /*removeSound, sounds*/ 160) {
    				each_value = /*sounds*/ ctx[5];
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
    			transition_in(viewcontrols.$$.fragment, local);
    			transition_in(oscilloscope_1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(viewcontrols.$$.fragment, local);
    			transition_out(oscilloscope_1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(viewcontrols, detaching);
    			if (detaching) detach_dev(t0);
    			/*oscilloscope_1_binding*/ ctx[11](null);
    			destroy_component(oscilloscope_1, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button0);
    			if_block.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t4);
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
    	let sampleSize;
    	let fps;
    	let oldWavesDisplayed;
    	let oscilloscope;
    	let sounds = [];

    	onMount(() => {
    		init(drawCallback);
    		$$invalidate(5, sounds = sounds.concat(new Sound()));
    	});

    	//
    	function startSound() {
    		startSoundProcessor().then(() => {
    			setProcessorSweepTime(sampleSize);
    			setProcessorFps(fps);
    			sounds.forEach(sound => sound.play());
    		});
    	}

    	function stopSound() {
    		sounds.forEach(sound => sound.stop());
    		$$invalidate(0, isSoundPlaying = false);

    		//TODO: find a timeout without magic number - it seems to be not the sound's release
    		//const timeout = Math.max(soundWave.release * 1000, drawInterval);
    		const timeout = 600;

    		setTimeout(
    			() => {
    				if (!isSoundPlaying) {
    					stopSoundProcessor();
    				}
    			},
    			timeout
    		);
    	}

    	function addSound() {
    		const sound = new Sound();

    		if (isSoundPlaying) {
    			sound.play();
    		}

    		$$invalidate(5, sounds = sounds.concat(sound));
    	}

    	function removeSound(sound) {
    		const index = sounds.indexOf(sound);

    		if (index > -1) {
    			const { [index]: removedSound, ...remainingSounds } = sounds;
    			removedSound.remove();
    			$$invalidate(5, sounds = Object.values(remainingSounds));
    		}
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SoundwaveUi> was created with unknown prop '${key}'`);
    	});

    	function viewcontrols_sampleSize_binding(value) {
    		sampleSize = value;
    		$$invalidate(1, sampleSize);
    	}

    	function viewcontrols_oldWavesDisplayed_binding(value) {
    		oldWavesDisplayed = value;
    		$$invalidate(3, oldWavesDisplayed);
    	}

    	function viewcontrols_fps_binding(value) {
    		fps = value;
    		$$invalidate(2, fps);
    	}

    	function oscilloscope_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			oscilloscope = $$value;
    			$$invalidate(4, oscilloscope);
    		});
    	}

    	const click_handler = () => $$invalidate(0, isSoundPlaying = !isSoundPlaying);
    	const func = sound => removeSound(sound);

    	function soundwavecontrols_sound_binding(value, sound, each_value, sound_index) {
    		each_value[sound_index] = value;
    		$$invalidate(5, sounds);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		SoundwaveControls,
    		ViewControls,
    		Sound,
    		Oscilloscope,
    		drawCallback,
    		initSoundsystem: init,
    		setProcessorFps,
    		setProcessorSweepTime,
    		startSoundProcessor,
    		stopSoundProcessor,
    		isSoundPlaying,
    		sampleSize,
    		fps,
    		oldWavesDisplayed,
    		oscilloscope,
    		sounds,
    		startSound,
    		stopSound,
    		addSound,
    		removeSound
    	});

    	$$self.$inject_state = $$props => {
    		if ('isSoundPlaying' in $$props) $$invalidate(0, isSoundPlaying = $$props.isSoundPlaying);
    		if ('sampleSize' in $$props) $$invalidate(1, sampleSize = $$props.sampleSize);
    		if ('fps' in $$props) $$invalidate(2, fps = $$props.fps);
    		if ('oldWavesDisplayed' in $$props) $$invalidate(3, oldWavesDisplayed = $$props.oldWavesDisplayed);
    		if ('oscilloscope' in $$props) $$invalidate(4, oscilloscope = $$props.oscilloscope);
    		if ('sounds' in $$props) $$invalidate(5, sounds = $$props.sounds);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isSoundPlaying*/ 1) {
    			// reactive stuff
    			{
    				if (isSoundPlaying) {
    					startSound();
    				} else {
    					stopSound();
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*sampleSize*/ 2) {
    			{
    				setProcessorSweepTime(sampleSize);
    			}
    		}

    		if ($$self.$$.dirty & /*fps*/ 4) {
    			{
    				setProcessorFps(fps);
    			}
    		}
    	};

    	return [
    		isSoundPlaying,
    		sampleSize,
    		fps,
    		oldWavesDisplayed,
    		oscilloscope,
    		sounds,
    		addSound,
    		removeSound,
    		viewcontrols_sampleSize_binding,
    		viewcontrols_oldWavesDisplayed_binding,
    		viewcontrols_fps_binding,
    		oscilloscope_1_binding,
    		click_handler,
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

    // (5:1) {:else}
    function create_else_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "click anywhere to start";
    			attr_dev(div, "class", "svelte-bjlk6c");
    			add_location(div, file, 5, 2, 86);
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
    		source: "(5:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (3:1) {#if userClicked}
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
    		source: "(3:1) {#if userClicked}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*userClicked*/ ctx[0]) return 0;
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
    			if_block.c();
    			attr_dev(h1, "class", "svelte-bjlk6c");
    			add_location(h1, file, 1, 1, 8);
    			attr_dev(main, "class", "svelte-bjlk6c");
    			add_location(main, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
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
    	let userClicked = false;
    	window.addEventListener('pointerup', initApp);

    	function initApp() {
    		window.removeEventListener('pointerup', initApp);
    		$$invalidate(0, userClicked = true);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ SoundwaveUi, userClicked, initApp });

    	$$self.$inject_state = $$props => {
    		if ('userClicked' in $$props) $$invalidate(0, userClicked = $$props.userClicked);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [userClicked];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init$1(this, options, instance, create_fragment, safe_not_equal, {});

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
    	props: {

    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
