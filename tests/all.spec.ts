/// <reference path="../node_modules/@types/chrome/index.d.ts" />

import { Model } from "../src/model";
import { Types, type TypeCheckFunc } from "../src/types";

describe("Model", () => {

    beforeEach(async () => {
        await chrome.storage.local.clear();
    });

    describe("new", () => {
        it("constructs new instance of model without saving", () => {
            class Player extends Model {
                public name: string;
            }
            const otiai10 = Player.new({ name: "otiai10" });
            expect(otiai10).toBeInstanceOf(Player);
            expect(otiai10.name).toBe("otiai10");
            expect(otiai10._id).toBe(null);
        });
    });

    describe("save", () => {
        it("saves the instance to your storage area", async () => {
            class Player extends Model {
                public name: string;
            }
            const otiai10 = Player.new({ name: "otiai10" });
            expect(otiai10).toBeInstanceOf(Player);
            expect(otiai10.name).toBe("otiai10");
            expect(otiai10._id).toBe(null);
            await otiai10.save();
            expect(otiai10._id).not.toBe(null);
        });
    });

    describe("create", () => {
        it("is just a shorthand of new().save()", async () => {
            class Player extends Model {
                static override __namespace__ = "Player";
                public name: string;
            }
            const otiai20 = await Player.create({ name: "otiai20" });
            expect(otiai20).toBeInstanceOf(Player);
            expect(otiai20.name).toBe("otiai20");
            expect(otiai20._id).not.toBe(null);
        });
    });

    describe("list", () => {
        it("shold list all records as an array of Model instance", async () => {
            class Player extends Model {
                public name: string;
                greet(): string {
                    return `Hello, this is ${this.name}!`;
                }
            }
            await Player.create({ name: "otiai2001" });
            await Player.create({ name: "otiai2002" });
            await Player.create({ name: "otiai2003" });
            const list = await Player.list();
            expect(list.length).toBe(3);
            expect(list[0]).toBeInstanceOf(Player);
            expect(list[0].greet()).toBe(`Hello, this is otiai2001!`);
        });
    });

    describe("delete", () => {
        it("should delete the instance specifically", async () => {
            class Player extends Model {
                public name: string;
                static override __nextID__ = Model.sequentialID;
            }
            await Player.create({ name: "otiai3001" });
            const p = await Player.create({ name: "otiai3002" });
            await Player.create({ name: "otiai3003" });
            const q = await Player.find(p._id!);
            expect(q?._id).toEqual(p._id);
            const d = await q!.delete();
            expect(d._id).toBeUndefined();
            const list = await Player.list();
            expect(list.length).toBe(2);
            expect(list.some(p => p.name == "otiai3002")).toBeFalsy();
        });
    });

    describe("drop", () => {
        it("should delete all entries under the namespace", async () => {
            class Player extends Model {}
            await Player.create();
            await Player.create();
            await Player.create();
            await Player.create();
            expect(await Player.list()).toHaveLength(4);
            await Player.drop();
            expect(await Player.list()).toHaveLength(0);
        });
    });

    describe("filter", () => {
        it("should filter the list by given filter-func", async () => {
            class Player extends Model {
                public name: string;
            }
            await Player.create({ name: "Hiromu Ochiai" });
            await Player.create({ name: "otiai10" });
            await Player.create({ name: "EroRetweet Maesto" });
            expect(await Player.list()).toHaveLength(3);
            expect(await Player.filter(p => p.name.includes("iai"))).toHaveLength(2);
            expect(await Player.filter(p => p.name.startsWith("Ero"))).toHaveLength(1);
        })
    });

    describe("schema", () => {
        it("should define types of properties", async () => {
            class Player extends Model {
                public name: string;
                public age: number;
                static override schema = {
                    name: Types.string.isRequired,
                    age: Types.number,
                }
            }
            class Team extends Model {
                public name: string;
                public captain: Player;
                public admins: Player[];
                static override schema = {
                    name: Types.string.isRequired,
                    captain: Types.model(Player, { eager: true }).isRequired,
                    admins: Types.arrayOf(Types.model(Player)),
                }
            }
            const jack = await Player.create({ name: "Jack" });
            const benn = await Player.create({ name: "Benn" });
            const nick = await Player.create({ name: "Nick" });
            const team = Team.new({ name: "Broncos" });
            team.captain = nick;
            team.admins = [benn, jack];

            const saved = await team.save();

            const found = await Team.find(saved._id!);
            expect(found?.admins[0]).toBeInstanceOf(Player);
            expect(found?.captain).toBeInstanceOf(Player);
            expect(found?.captain._id).toBe(nick._id);
        })
    });
});