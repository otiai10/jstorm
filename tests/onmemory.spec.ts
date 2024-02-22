import { Model } from "../src/runtime/node";

describe("Model using on-memory storage", () => {
    class Foo extends Model {
        static _namespace_ = "Foo";
        static override default = {
            hiromu: { name: "Hiromu" },
            otiai10: { name: "otiai10" },
        };
        name!: string;
    }

    describe("new", () => {
        it("constructs new instance of model without saving", () => {
            const otiai10 = Foo.new({ name: "otiai10" });
            expect(otiai10).toBeInstanceOf(Foo);
            expect(otiai10.name).toBe("otiai10");
            expect(otiai10._id).toBe(null);
        });
    });
    describe("save", () => {
        it("saves the instance to your storage area", async () => {
            const otiai10 = Foo.new({ name: "otiai10" });
            expect(otiai10).toBeInstanceOf(Foo);
            expect(otiai10.name).toBe("otiai10");
            expect(otiai10._id).toBe(null);
            await otiai10.save();
            expect(otiai10._id).not.toBe(null);
        });
    });
});