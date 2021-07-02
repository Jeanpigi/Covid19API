
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
                start_hydrating();
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
            end_hydrating();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
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

    /* components/Country.svelte generated by Svelte v3.38.3 */

    const file$6 = "components/Country.svelte";

    function create_fragment$6(ctx) {
    	let div7;
    	let div6;
    	let div0;
    	let h30;
    	let t0_value = /*country*/ ctx[0].Country + "";
    	let t0;
    	let t1;
    	let div1;
    	let h10;
    	let t3;
    	let h31;
    	let t4_value = /*country*/ ctx[0].CountryCode + "";
    	let t4;
    	let t5;
    	let div2;
    	let h11;
    	let t7;
    	let h32;
    	let t8_value = /*country*/ ctx[0].NewConfirmed + "";
    	let t8;
    	let t9;
    	let div3;
    	let h12;
    	let t11;
    	let h33;
    	let t12_value = /*country*/ ctx[0].TotalConfirmed + "";
    	let t12;
    	let t13;
    	let div4;
    	let h13;
    	let t15;
    	let h34;
    	let t16_value = /*country*/ ctx[0].NewDeaths + "";
    	let t16;
    	let t17;
    	let div5;
    	let h14;
    	let t19;
    	let h35;
    	let t20_value = /*country*/ ctx[0].TotalDeaths + "";
    	let t20;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			h30 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Código del Pais:";
    			t3 = space();
    			h31 = element("h3");
    			t4 = text(t4_value);
    			t5 = space();
    			div2 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Nuevos Casos Confirmados:";
    			t7 = space();
    			h32 = element("h3");
    			t8 = text(t8_value);
    			t9 = space();
    			div3 = element("div");
    			h12 = element("h1");
    			h12.textContent = "Total de casos Confirmados:";
    			t11 = space();
    			h33 = element("h3");
    			t12 = text(t12_value);
    			t13 = space();
    			div4 = element("div");
    			h13 = element("h1");
    			h13.textContent = "Nuevos casos de muertes:";
    			t15 = space();
    			h34 = element("h3");
    			t16 = text(t16_value);
    			t17 = space();
    			div5 = element("div");
    			h14 = element("h1");
    			h14.textContent = "Total de casos de muertes:";
    			t19 = space();
    			h35 = element("h3");
    			t20 = text(t20_value);
    			attr_dev(h30, "class", "text-xl xl:text-3xl font-bold");
    			add_location(h30, file$6, 7, 12, 248);
    			attr_dev(div0, "class", "m-4");
    			add_location(div0, file$6, 6, 8, 218);
    			attr_dev(h10, "class", "text-indigo-500");
    			add_location(h10, file$6, 10, 12, 366);
    			add_location(h31, file$6, 11, 12, 428);
    			attr_dev(div1, "class", "m-4");
    			add_location(div1, file$6, 9, 8, 336);
    			attr_dev(h11, "class", "text-indigo-500");
    			add_location(h11, file$6, 14, 12, 512);
    			add_location(h32, file$6, 15, 12, 583);
    			attr_dev(div2, "class", "m-4");
    			add_location(div2, file$6, 13, 8, 482);
    			attr_dev(h12, "class", "text-indigo-500");
    			add_location(h12, file$6, 18, 12, 668);
    			add_location(h33, file$6, 19, 12, 741);
    			attr_dev(div3, "class", "m-4");
    			add_location(div3, file$6, 17, 8, 638);
    			attr_dev(h13, "class", "text-indigo-500");
    			add_location(h13, file$6, 22, 12, 828);
    			add_location(h34, file$6, 23, 12, 898);
    			attr_dev(div4, "class", "m-4");
    			add_location(div4, file$6, 21, 8, 798);
    			attr_dev(h14, "class", "text-indigo-500");
    			add_location(h14, file$6, 26, 12, 980);
    			add_location(h35, file$6, 27, 12, 1052);
    			attr_dev(div5, "class", "m-4");
    			add_location(div5, file$6, 25, 8, 950);
    			attr_dev(div6, "class", "bg-purple-100 rounded border-indigo-500 border overflow-hidden shadow-lg text-center text-sm xl:text-xl my-6");
    			add_location(div6, file$6, 5, 4, 87);
    			attr_dev(div7, "class", "flex justify-center");
    			add_location(div7, file$6, 4, 0, 49);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div0, h30);
    			append_dev(h30, t0);
    			append_dev(div6, t1);
    			append_dev(div6, div1);
    			append_dev(div1, h10);
    			append_dev(div1, t3);
    			append_dev(div1, h31);
    			append_dev(h31, t4);
    			append_dev(div6, t5);
    			append_dev(div6, div2);
    			append_dev(div2, h11);
    			append_dev(div2, t7);
    			append_dev(div2, h32);
    			append_dev(h32, t8);
    			append_dev(div6, t9);
    			append_dev(div6, div3);
    			append_dev(div3, h12);
    			append_dev(div3, t11);
    			append_dev(div3, h33);
    			append_dev(h33, t12);
    			append_dev(div6, t13);
    			append_dev(div6, div4);
    			append_dev(div4, h13);
    			append_dev(div4, t15);
    			append_dev(div4, h34);
    			append_dev(h34, t16);
    			append_dev(div6, t17);
    			append_dev(div6, div5);
    			append_dev(div5, h14);
    			append_dev(div5, t19);
    			append_dev(div5, h35);
    			append_dev(h35, t20);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*country*/ 1 && t0_value !== (t0_value = /*country*/ ctx[0].Country + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*country*/ 1 && t4_value !== (t4_value = /*country*/ ctx[0].CountryCode + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*country*/ 1 && t8_value !== (t8_value = /*country*/ ctx[0].NewConfirmed + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*country*/ 1 && t12_value !== (t12_value = /*country*/ ctx[0].TotalConfirmed + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*country*/ 1 && t16_value !== (t16_value = /*country*/ ctx[0].NewDeaths + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*country*/ 1 && t20_value !== (t20_value = /*country*/ ctx[0].TotalDeaths + "")) set_data_dev(t20, t20_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
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
    	validate_slots("Country", slots, []);
    	let { country = {} } = $$props;
    	const writable_props = ["country"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Country> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("country" in $$props) $$invalidate(0, country = $$props.country);
    	};

    	$$self.$capture_state = () => ({ country });

    	$$self.$inject_state = $$props => {
    		if ("country" in $$props) $$invalidate(0, country = $$props.country);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [country];
    }

    class Country extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { country: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Country",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get country() {
    		throw new Error("<Country>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set country(value) {
    		throw new Error("<Country>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* components/Search.svelte generated by Svelte v3.38.3 */

    const file$5 = "components/Search.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			attr_dev(input, "class", "bg-white text-sm xl:text-xl text-center focus:outline-none focus:shadow-outline border border-gray-400 rounded-lg py-2 px-4 block w-full appearance-none leading-normal");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Buscar al Pais");
    			add_location(input, file$5, 5, 4, 78);
    			attr_dev(div, "class", "py-8 px-16");
    			add_location(div, file$5, 4, 0, 49);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);

    			if (!mounted) {
    				dispose = listen_dev(input, "keyup", /*keyup_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Search", slots, []);
    	let { handleSearch } = $$props;
    	const writable_props = ["handleSearch"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	const keyup_handler = event => handleSearch(event);

    	$$self.$$set = $$props => {
    		if ("handleSearch" in $$props) $$invalidate(0, handleSearch = $$props.handleSearch);
    	};

    	$$self.$capture_state = () => ({ handleSearch });

    	$$self.$inject_state = $$props => {
    		if ("handleSearch" in $$props) $$invalidate(0, handleSearch = $$props.handleSearch);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [handleSearch, keyup_handler];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { handleSearch: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*handleSearch*/ ctx[0] === undefined && !("handleSearch" in props)) {
    			console.warn("<Search> was created without expected prop 'handleSearch'");
    		}
    	}

    	get handleSearch() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleSearch(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* components/Countries.svelte generated by Svelte v3.38.3 */
    const file$4 = "components/Countries.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (20:8) {#each searchCountries as country}
    function create_each_block(ctx) {
    	let country;
    	let current;

    	country = new Country({
    			props: { country: /*country*/ ctx[3] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(country.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(country, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const country_changes = {};
    			if (dirty & /*searchCountries*/ 1) country_changes.country = /*country*/ ctx[3];
    			country.$set(country_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(country.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(country.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(country, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(20:8) {#each searchCountries as country}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let search;
    	let t;
    	let div1;
    	let div0;
    	let current;

    	search = new Search({
    			props: { handleSearch: /*handleSearch*/ ctx[1] },
    			$$inline: true
    		});

    	let each_value = /*searchCountries*/ ctx[0];
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
    			create_component(search.$$.fragment);
    			t = space();
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3");
    			add_location(div0, file$4, 18, 4, 460);
    			attr_dev(div1, "class", "mx-8 md:mx-6 xl:mx-4");
    			add_location(div1, file$4, 17, 0, 421);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(search, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchCountries*/ 1) {
    				each_value = /*searchCountries*/ ctx[0];
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
    						each_blocks[i].m(div0, null);
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
    			transition_in(search.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(search, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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
    	validate_slots("Countries", slots, []);
    	let { countries = [] } = $$props;
    	let searchCountries = countries;

    	const handleSearch = event => {
    		const value = event.target.value;
    		$$invalidate(0, searchCountries = countries.filter(country => country.Country.toLowerCase().includes(value.toLowerCase())));
    	};

    	const writable_props = ["countries"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Countries> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("countries" in $$props) $$invalidate(2, countries = $$props.countries);
    	};

    	$$self.$capture_state = () => ({
    		Country,
    		Search,
    		countries,
    		searchCountries,
    		handleSearch
    	});

    	$$self.$inject_state = $$props => {
    		if ("countries" in $$props) $$invalidate(2, countries = $$props.countries);
    		if ("searchCountries" in $$props) $$invalidate(0, searchCountries = $$props.searchCountries);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searchCountries, handleSearch, countries];
    }

    class Countries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { countries: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Countries",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get countries() {
    		throw new Error("<Countries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countries(value) {
    		throw new Error("<Countries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* components/Header.svelte generated by Svelte v3.38.3 */

    const file$3 = "components/Header.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let t2;
    	let h2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "Covid 19";
    			t2 = space();
    			h2 = element("h2");
    			h2.textContent = "JBearP";
    			attr_dev(img, "class", "mr-1");
    			if (img.src !== (img_src_value = "logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "logo");
    			add_location(img, file$3, 2, 4, 107);
    			attr_dev(h1, "class", "text-2xl xl:text-5xl");
    			add_location(h1, file$3, 3, 4, 156);
    			attr_dev(h2, "class", "text-lg xl:text-2xl");
    			add_location(h2, file$3, 4, 4, 207);
    			attr_dev(div, "class", "bg-indigo-500 max-w-full text-white grid grid-cols-3 text-center font-sans items-center");
    			add_location(div, file$3, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h1);
    			append_dev(div, t2);
    			append_dev(div, h2);
    		},
    		p: noop,
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

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* components/Global.svelte generated by Svelte v3.38.3 */

    const file$2 = "components/Global.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let h1;
    	let t1;
    	let div4;
    	let div0;
    	let span0;
    	let t3;
    	let h20;
    	let t4_value = /*countries*/ ctx[1].length + "";
    	let t4;
    	let t5;
    	let div1;
    	let span1;
    	let t7;
    	let h21;
    	let t8_value = /*global*/ ctx[0].TotalConfirmed + "";
    	let t8;
    	let t9;
    	let div2;
    	let span2;
    	let t11;
    	let h22;
    	let t12_value = /*global*/ ctx[0].TotalRecovered + "";
    	let t12;
    	let t13;
    	let div3;
    	let span3;
    	let t15;
    	let h23;
    	let t16_value = /*global*/ ctx[0].TotalDeaths + "";
    	let t16;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Ámbito Global:";
    			t1 = space();
    			div4 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Paises Afectados";
    			t3 = space();
    			h20 = element("h2");
    			t4 = text(t4_value);
    			t5 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "Casos Confirmados";
    			t7 = space();
    			h21 = element("h2");
    			t8 = text(t8_value);
    			t9 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span2.textContent = "Casos de recuperación";
    			t11 = space();
    			h22 = element("h2");
    			t12 = text(t12_value);
    			t13 = space();
    			div3 = element("div");
    			span3 = element("span");
    			span3.textContent = "Total de muertes";
    			t15 = space();
    			h23 = element("h2");
    			t16 = text(t16_value);
    			attr_dev(h1, "class", "mb-4 xl:mb-10 text-xl md:text-2xl xl:text-3xl ");
    			add_location(h1, file$2, 6, 4, 128);
    			attr_dev(span0, "class", "text-bold");
    			add_location(span0, file$2, 9, 8, 306);
    			add_location(h20, file$2, 10, 8, 362);
    			add_location(div0, file$2, 8, 6, 292);
    			attr_dev(span1, "class", "text-bold");
    			add_location(span1, file$2, 13, 8, 423);
    			add_location(h21, file$2, 14, 8, 480);
    			add_location(div1, file$2, 12, 6, 409);
    			attr_dev(span2, "class", "text-bold");
    			add_location(span2, file$2, 17, 8, 546);
    			add_location(h22, file$2, 18, 8, 607);
    			add_location(div2, file$2, 16, 6, 532);
    			attr_dev(span3, "class", "text-bold");
    			add_location(span3, file$2, 21, 8, 673);
    			add_location(h23, file$2, 22, 8, 729);
    			add_location(div3, file$2, 20, 6, 659);
    			attr_dev(div4, "class", "text-sm xl:text-xl font-sans grid grid-cols-1 xl:grid-cols-4");
    			add_location(div4, file$2, 7, 4, 211);
    			attr_dev(div5, "class", "mt-4 xl:mx-16 xl:mb-16 text-center");
    			add_location(div5, file$2, 5, 0, 75);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h1);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t3);
    			append_dev(div0, h20);
    			append_dev(h20, t4);
    			append_dev(div4, t5);
    			append_dev(div4, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t7);
    			append_dev(div1, h21);
    			append_dev(h21, t8);
    			append_dev(div4, t9);
    			append_dev(div4, div2);
    			append_dev(div2, span2);
    			append_dev(div2, t11);
    			append_dev(div2, h22);
    			append_dev(h22, t12);
    			append_dev(div4, t13);
    			append_dev(div4, div3);
    			append_dev(div3, span3);
    			append_dev(div3, t15);
    			append_dev(div3, h23);
    			append_dev(h23, t16);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*countries*/ 2 && t4_value !== (t4_value = /*countries*/ ctx[1].length + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*global*/ 1 && t8_value !== (t8_value = /*global*/ ctx[0].TotalConfirmed + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*global*/ 1 && t12_value !== (t12_value = /*global*/ ctx[0].TotalRecovered + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*global*/ 1 && t16_value !== (t16_value = /*global*/ ctx[0].TotalDeaths + "")) set_data_dev(t16, t16_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Global", slots, []);
    	let { global = {} } = $$props;
    	let { countries = [] } = $$props;
    	const writable_props = ["global", "countries"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Global> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("global" in $$props) $$invalidate(0, global = $$props.global);
    		if ("countries" in $$props) $$invalidate(1, countries = $$props.countries);
    	};

    	$$self.$capture_state = () => ({ global, countries });

    	$$self.$inject_state = $$props => {
    		if ("global" in $$props) $$invalidate(0, global = $$props.global);
    		if ("countries" in $$props) $$invalidate(1, countries = $$props.countries);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [global, countries];
    }

    class Global extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { global: 0, countries: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Global",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get global() {
    		throw new Error("<Global>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set global(value) {
    		throw new Error("<Global>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get countries() {
    		throw new Error("<Global>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countries(value) {
    		throw new Error("<Global>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* components/Footer.svelte generated by Svelte v3.38.3 */

    const file$1 = "components/Footer.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let ul;
    	let li0;
    	let a0;
    	let i0;
    	let t2;
    	let li1;
    	let a1;
    	let i1;
    	let t3;
    	let li2;
    	let a2;
    	let i2;
    	let t4;
    	let li3;
    	let a3;
    	let i3;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Hecho con 💜 por 🐻 JbearP 🇨🇴";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			i0 = element("i");
    			t2 = space();
    			li1 = element("li");
    			a1 = element("a");
    			i1 = element("i");
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			i2 = element("i");
    			t4 = space();
    			li3 = element("li");
    			a3 = element("a");
    			i3 = element("i");
    			add_location(h1, file$1, 4, 4, 125);
    			attr_dev(div0, "class", "pt-12 text-xs sm:text-ms md:text-lg text-white text-center font-sans");
    			add_location(div0, file$1, 1, 2, 31);
    			attr_dev(i0, "aria-hidden", "");
    			attr_dev(i0, "class", "fab fa-gitlab");
    			add_location(i0, file$1, 9, 8, 294);
    			attr_dev(a0, "href", "https://gitlab.com/JeanPiBot");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener");
    			add_location(a0, file$1, 8, 6, 215);
    			add_location(li0, file$1, 7, 4, 204);
    			attr_dev(i1, "aria-hidden", "");
    			attr_dev(i1, "class", "fab fa-instagram");
    			add_location(i1, file$1, 19, 8, 500);
    			attr_dev(a1, "href", "https://www.instagram.com/jean_pierre_giovanni/");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener");
    			add_location(a1, file$1, 14, 6, 371);
    			add_location(li1, file$1, 13, 4, 360);
    			attr_dev(i2, "aria-hidden", "");
    			attr_dev(i2, "class", "fab fa-facebook");
    			add_location(i2, file$1, 25, 8, 663);
    			attr_dev(a2, "href", "https://www.facebook.com/JePiGi/");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "rel", "noopener");
    			add_location(a2, file$1, 24, 6, 580);
    			add_location(li2, file$1, 23, 4, 569);
    			attr_dev(i3, "aria-hidden", "");
    			attr_dev(i3, "class", "fab fa-youtube");
    			add_location(i3, file$1, 35, 8, 880);
    			attr_dev(a3, "href", "https://www.youtube.com/channel/UCXNcM9LiqXfXgKU8HIwg9Xg");
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "rel", "noopener");
    			add_location(a3, file$1, 30, 6, 742);
    			add_location(li3, file$1, 29, 4, 731);
    			attr_dev(ul, "class", "container");
    			add_location(ul, file$1, 6, 2, 177);
    			attr_dev(div1, "class", "bg-indigo-500 ");
    			add_location(div1, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div1, t1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(a0, i0);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(a1, i1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(a2, i2);
    			append_dev(ul, t4);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(a3, i3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.3 */
    const file = "src/App.svelte";

    // (30:1) {:else}
    function create_else_block(ctx) {
    	let p;

    	let t_value = (/*error*/ ctx[1]
    	? "Lo sentimos ha ocurrido un error, Actualiza la pagina."
    	: "Cargando...") + "";

    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file, 30, 2, 661);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 2 && t_value !== (t_value = (/*error*/ ctx[1]
    			? "Lo sentimos ha ocurrido un error, Actualiza la pagina."
    			: "Cargando...") + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(30:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:1) {#if data.Global}
    function create_if_block(ctx) {
    	let global;
    	let t;
    	let countries;
    	let current;

    	global = new Global({
    			props: {
    				countries: /*data*/ ctx[0].Countries,
    				global: /*data*/ ctx[0].Global
    			},
    			$$inline: true
    		});

    	countries = new Countries({
    			props: { countries: /*data*/ ctx[0].Countries },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(global.$$.fragment);
    			t = space();
    			create_component(countries.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(global, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(countries, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const global_changes = {};
    			if (dirty & /*data*/ 1) global_changes.countries = /*data*/ ctx[0].Countries;
    			if (dirty & /*data*/ 1) global_changes.global = /*data*/ ctx[0].Global;
    			global.$set(global_changes);
    			const countries_changes = {};
    			if (dirty & /*data*/ 1) countries_changes.countries = /*data*/ ctx[0].Countries;
    			countries.$set(countries_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(global.$$.fragment, local);
    			transition_in(countries.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(global.$$.fragment, local);
    			transition_out(countries.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(global, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(countries, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(27:1) {#if data.Global}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let header;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].Global) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			create_component(footer.$$.fragment);
    			add_location(div, file, 24, 0, 502);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t0);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t1);
    			mount_component(footer, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, t1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			if_blocks[current_block_type_index].d();
    			destroy_component(footer);
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

    const API = "https://api.covid19api.com/summary";

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let data = {};
    	let error = false;

    	onMount(async () => {
    		try {
    			const response = await fetch(API);
    			$$invalidate(0, data = await response.json());
    		} catch(err) {
    			$$invalidate(1, error = true);
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Countries,
    		onMount,
    		Header,
    		Global,
    		Footer,
    		API,
    		data,
    		error
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("error" in $$props) $$invalidate(1, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, error];
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
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
