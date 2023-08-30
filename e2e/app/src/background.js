import { Model } from "../../../lib/chrome/local";
import sampledata from "../kcwidget/localstorage.json";

class Player extends Model {
    static _namespace_ = "Player";
    greet() {
        return `Hello, my name is ${this.name}!`;
    }
}

/**
 * Because chomex.Model encodes everything into JSON.string,
 * when we migrate it into jstorm, we need to JSON.parse
 * and storage.{local|sync}.set.
 */
self.setup_data = async function() {
    const obj = Object.keys(sampledata).reduce((ctx, namespace) => {
        ctx[namespace] = JSON.parse(sampledata[namespace]);
        return ctx;
    }, {});
    await chrome.storage.local.set(obj);
}

self.example_001 = async function() {
    const x = await Player.create({ name: "otiai10" });
    return {
        ok: true,
        namespace: Player.__ns__(),
        id: x._id,
        greet: (await Player.find(x._id)).greet(),
    };
}

self.example_002 = async function() {
    class Frame extends Model {
        static _namespace_ = "Frame";
    }
    return {
        ok: true,
        list: await Frame.list(),
    }
}