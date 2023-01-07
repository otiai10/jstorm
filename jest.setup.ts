
/// <reference path="./node_modules/@types/chrome/index.d.ts" />

Object.assign(global, {
    chrome: {
        storage: {
            local: {
                __dict__: {
                },
                async clear() {
                    delete this.__dict__;
                    this.__dict__ = new Object();
                    return Promise.resolve();
                },
                async set(ensemble): Promise<void> {
                    const encoded = {};
                    Object.keys(ensemble).map(namespace => {
                        encoded[namespace] = JSON.stringify(ensemble[namespace]);
                    });
                    this.__dict__ = { ...this.__dict__, ...encoded };
                    return new Promise(resolve => setTimeout(() => resolve(), 0));
                },
                async remove(key) {
                    const keys = (key instanceof Array) ? key : [key];
                    keys.map(k => this.__dict___[k] = undefined);
                    return;
                },
                async get(namespace) {
                    const nss = (namespace instanceof Array) ? namespace : [namespace];
                    const result = nss.reduce((ctx, ns) => {
                        ctx[ns] = JSON.parse(this.__dict__[ns] || `{}`);
                        return ctx;
                    }, {});
                    return new Promise(resolve => setTimeout(() => resolve(result), 0));
                }
            },
        }
    }
});
