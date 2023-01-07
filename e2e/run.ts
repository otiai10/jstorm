import * as puppeteer from "puppeteer";
import * as path from "path";

// See https://pptr.dev/guides/chrome-extensions/

const data = [
  {
    label: "Basic usage",
    run: `example_001()`,
    assert: (res: any) => {
      return res;
    }
  },
  {
    label: "Salvage test for chomex.Model",
    run: `example_002()`,
    assert: (res: any) => {
      return { ok: res.ok };
    }
  }
];

(async () => {
  const ext = path.join(__dirname, "app");
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${ext}`,
      `--load-extension=${ext}`,
    ],
  });
  const background = await browser.waitForTarget(
    target => target.type() === 'service_worker',
  );
  const worker = (await background.worker())!;

  await worker.evaluate("setup_data()");

  const errors: any[] = [];

  for (let i = 0; i < data.length; i++) {
    const testcase = data[i];
    console.log(`\n\x1b[1m[${i}] ${testcase.label}\x1b[0m`);
    const response = (await worker.evaluate(testcase.run)) as any;
    const result = testcase.assert(response);
    if (!result.ok) {
      console.log(`\x1b[1m\x1b[31m=> NG\x1b[0m\n`);
      errors.push({ number: i, label: testcase.label, func: testcase.run, result });
    } else {
      console.log(`\x1b[1m\x1b[32m=> OK\x1b[0m`);
      console.log(result);
    }
  }
  await browser.close();
  if (errors.length > 0) {
    console.log("ERRORS:")
    console.error(errors);
    process.exit(1);
  }
})();
