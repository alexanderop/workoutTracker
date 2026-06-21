# Vitest Mocking Cheat Sheet

## Table of Contents
1. [Default Imports](#default-imports)
2. [Named Imports](#named-imports)
3. [Classes and Prototypes](#classes-and-prototypes)
4. [Snapshot Testing](#snapshot-testing)
5. [Composables and Composition API](#composables-and-composition-api)
6. [Vue Lifecycle Hooks](#vue-lifecycle-hooks)
7. [Partial Module Mocks](#partial-module-mocks)
8. [External Variables in Mocks (doMock)](#external-variables-in-mocks)
9. [Mock Cleanup](#mock-cleanup)
10. [Auto-Mocking with __mocks__](#auto-mocking)
11. [Date and Time](#date-and-time)
12. [Errors and Rejected Promises](#errors-and-rejected-promises)
13. [Global Fetch](#global-fetch)
14. [Parameterized Tests](#parameterized-tests)
15. [stubGlobal](#stubglobal)
16. [Mock Verification](#mock-verification)

---

## Default Imports

### Mock default function export
```ts
// default-func.ts
const getWithEmoji = (message: string) => `${message} 😎`;
export default getWithEmoji;

// test
import getWithEmojiFunc from "./default-func";
vi.mock("./default-func", () => ({
  default: vi.fn((message: string) => `${message} 🥳`),
}));

expect(getWithEmojiFunc("hello")).toEqual("hello 🥳");
```

### Spy on default function export
```ts
import * as exports from "./default-func";

const spy = vi.spyOn(exports, "default");
const result = spy("test");
expect(spy).toHaveBeenCalledWith("test");
```

### Spy on default object's method
```ts
// default-obj.ts
export default {
  getWithEmoji: (message: string) => `${message} 😎`,
};

// test
import getWithEmojiObj from "./default-obj";
const spy = vi.spyOn(getWithEmojiObj, "getWithEmoji");
expect(spy("test")).toEqual("test 😎");
```

---

## Named Imports

### Mock named function
```ts
import { getWithEmoji } from "./named-import-func";
vi.mock("./named-import-func");

vi.mocked(getWithEmoji).mockReturnValue("mocked 🤩");
expect(getWithEmoji("hello")).toBe("mocked 🤩");
```

### Mock named property (getter)
```ts
// named-import-property.ts
export const magicNumber: number = 42;

// test
import * as exports from "./named-import-property";
vi.spyOn(exports, "magicNumber", "get").mockReturnValue(41);
expect(exports.magicNumber).toBe(41);
```

---

## Classes and Prototypes

### Mock default class method
```ts
// default-class.ts
export default class Bike {
  ride() { return "original"; }
}

// test
vi.mock("./default-class", () => {
  const MyClass = vi.fn();
  MyClass.prototype.ride = vi.fn();
  return { default: MyClass };
});

vi.mocked(Bike.prototype.ride)
  .mockReturnValueOnce("first")
  .mockReturnValueOnce("second");

const bike = new Bike();
expect(bike.ride()).toBe("first");
expect(Bike.prototype.ride()).toBe("second");
```

### Mock named class method
```ts
// named-class.ts
export class Car {
  drive() { return "original"; }
}

// test
vi.mock("./named-class", () => {
  const MyClass = vi.fn();
  MyClass.prototype.drive = vi.fn();
  return { Car: MyClass };
});

vi.mocked(Car.prototype.drive).mockReturnValue("mocked");
```

---

## Snapshot Testing

### Data snapshot
```ts
const data = { id: 1, name: "John", email: "john@example.com" };
expect(data).toMatchSnapshot();
```

### Snapshot with mock function
```ts
const person = {
  id: 1,
  name: "John",
  contact: vi.fn(), // captured in snapshot
};
expect(person).toMatchSnapshot();
```

### Vue component snapshot
```ts
import { mount } from "@vue/test-utils";
import MyComponent from "./MyComponent.vue";

const wrapper = mount(MyComponent, { props: { name: "test" } });
expect(wrapper.html()).toMatchSnapshot();
```

---

## Composables and Composition API

### Test composable with watchEffect
```ts
import { ref, watchEffect, nextTick } from "vue";

function useCounter() {
  const count = ref(2);
  watchEffect(() => {
    if (count.value > 5) count.value = 0;
  });
  const increment = () => count.value++;
  return { count, increment };
}

test("useCounter", async () => {
  const { count, increment } = useCounter();
  expect(count.value).toBe(2);

  increment(); increment(); increment(); increment();
  expect(count.value).toBe(6);

  await nextTick(); // trigger watchEffect
  expect(count.value).toBe(0);
});
```

---

## Vue Lifecycle Hooks

### Test component with onMounted
```ts
import { mount, flushPromises } from "@vue/test-utils";
import Counter from "./Counter.vue";
import { nextTick } from "vue";

test("lifecycle", async () => {
  const wrapper = mount(Counter);
  expect(wrapper.text()).toContain("count: 0");

  await nextTick(); // wait for onMounted
  expect(wrapper.text()).toContain("count: 2");
});
```

---

## Partial Module Mocks

### Mock one function, leave others undefined
```ts
vi.mock("./stringOperations", () => ({
  stringOperations: {
    getWithEmoji: vi.fn().mockReturnValue("mocked"),
    // log is undefined
  },
}));
```

### Mock one function, keep original for others
```ts
vi.mock("./stringOperations", async (importOriginal) => {
  const original = await importOriginal();
  return {
    stringOperations: {
      log: original.stringOperations.log, // keep original
      getWithEmoji: vi.fn().mockReturnValue("mocked"),
    },
  };
});
```

---

## External Variables in Mocks

Use `vi.doMock` (not hoisted) to access external variables:

```ts
it("doMock with external variable", async () => {
  const dummyText = "dummy";

  vi.doMock("./someModule", () => ({
    someFunction: vi.fn().mockReturnValue(dummyText),
  }));

  // Must use dynamic import with doMock
  const { someFunction } = await import("./someModule");
  expect(someFunction()).toEqual(dummyText);
});
```

---

## Mock Cleanup

### mockClear - reset call history only
```ts
const mockFn = vi.fn();
mockFn();
expect(mockFn).toHaveBeenCalledTimes(1);
mockFn.mockClear();
mockFn();
expect(mockFn).toHaveBeenCalledTimes(1); // count reset
```

### mockReset - clear calls + return undefined
```ts
const mockAdd = vi.fn(add).mockImplementation((a, b) => 2 * a + 2 * b);
expect(mockAdd(1, 1)).toBe(4);
mockAdd.mockReset();
expect(mockAdd(1, 1)).toBeUndefined(); // no implementation
```

### mockRestore - clear calls + restore original
```ts
mockAdd.mockRestore();
expect(mockAdd(1, 1)).toBe(2); // original implementation
```

### Cleanup hooks
```ts
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());
```

---

## Auto-Mocking

Create `__mocks__/axios.ts` in project root:

```ts
// __mocks__/axios.ts
const mockAxios = {
  get: vi.fn((url) => Promise.resolve({ data: { urlCharCount: url.length } })),
  post: vi.fn(() => Promise.resolve({ data: {} })),
};
export default mockAxios;

// test - auto-mocks from __mocks__ folder
vi.mock("axios");
const response = await axios.get("url");
expect(response.data.urlCharCount).toBe(3);
```

### Import actual module in test
```ts
const ax = await vi.importActual<typeof axios>("axios");
expect(vi.isMockFunction(ax.get)).toBe(false);
```

### Mock only for single test
```ts
const { default: ax } = await vi.importMock<typeof import("axios")>("axios");
```

---

## Date and Time

### Set system time
```ts
vi.setSystemTime(new Date("2024-04-04 15:17"));
expect(new Date().toTimeString().slice(0, 5)).toBe("15:17");
vi.useRealTimers(); // cleanup
```

### Fake timers
```ts
beforeAll(() => vi.useFakeTimers());
afterAll(() => vi.useRealTimers());

it("polling", async () => {
  const callback = vi.fn();
  setInterval(callback, 1000);

  await vi.advanceTimersByTimeAsync(3000);
  expect(callback).toHaveBeenCalledTimes(3);
});
```

---

## Errors and Rejected Promises

### Expect thrown error
```ts
expect(() => { throw new Error("message"); }).toThrow("message");
```

### Expect rejected promise
```ts
vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Network error"))));
await expect(fetch("url")).rejects.toThrow("Network error");
```

### Multiple assertion patterns
```ts
globalThis.fetch = vi.fn().mockRejectedValue(new Error("fail"));
await expect(fetch("url")).rejects.toThrowError("fail");
await expect(fetch("url")).rejects.toThrowError(Error);
await expect(fetch("url")).rejects.toThrowError(/fail/);
```

---

## Global Fetch

### Pattern 1: globalThis.fetch
```ts
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ message: "hey" }),
} as Response);
```

### Pattern 2: globalThis.fetch + vi.mocked
```ts
globalThis.fetch = vi.fn();
vi.mocked(fetch).mockResolvedValue({
  ok: true,
  blob: async () => new Blob(),
} as Response);
```

### Pattern 3: vi.stubGlobal
```ts
vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
  json: () => ({ data: "hey" }),
  blob: async () => new Blob(),
})));
```

---

## Parameterized Tests

```ts
const inputs = ["Hello", "world", "!"];

test.each(inputs)("string length of %s", (input) => {
  expect(input.length).toBeGreaterThan(0);
});

// With objects
test.each([
  { a: 1, b: 2, expected: 3 },
  { a: 2, b: 3, expected: 5 },
])("add($a, $b) = $expected", ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});
```

---

## stubGlobal

```ts
// Math
vi.stubGlobal("Math", { random: () => 0.5 });
expect(Math.random()).toBe(0.5);

// Date
vi.stubGlobal("Date", class {
  getTime() { return 1000; }
});
expect(new Date().getTime()).toBe(1000);

// console
vi.stubGlobal("console", {
  log: vi.fn(),
  error: vi.fn(),
});
console.log("test");
expect(vi.mocked(console.log)).toHaveBeenCalledWith("test");

// window (requires jsdom/happy-dom)
vi.stubGlobal("window", { innerWidth: 1024, innerHeight: 768 });
```

---

## Mock Verification

### Call count and arguments
```ts
const mockFn = vi.fn();
mockFn("arg1", "arg2");
mockFn("arg3", "arg4");

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
expect(mockFn.mock.calls[0]).toEqual(["arg1", "arg2"]);
expect(mockFn.mock.calls[1]).toEqual(["arg3", "arg4"]);
```

### Flexible argument matching
```ts
expect(mockFn).toHaveBeenCalledWith(expect.any(String), expect.anything());
expect(mockFn).toHaveBeenCalledWith(expect.anything(), expect.any(Number));
expect(mockFn).toHaveBeenCalledWith(
  expect.objectContaining({ key: "value" })
);
```

### Return value verification
```ts
const mockFn = vi.fn().mockReturnValue("mocked value");
expect(mockFn()).toBe("mocked value");
expect(typeof mockFn()).toBe("string");
```

### Check if function is mocked
```ts
expect(vi.isMockFunction(mockFn)).toBe(true);
```
