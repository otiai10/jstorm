import { Model } from "../lib/browser/local";

class Item extends Model {
    static override __namespace__ = "Item";
    public title: string;
    public status: number;
}

(async () => {
    console.log(await Item.list());
    const foo = await Item.create({ title: "test", status: 0 });
    console.log(foo);
    console.log(await Item.list());
})();
